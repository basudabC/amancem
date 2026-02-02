// ============================================================
// AMAN CEMENT CRM — Territory Data Hooks (React Query)
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Territory } from '@/types';

// Fetch all territories
export const useTerritories = () => {
  return useQuery({
    queryKey: ['territories'],
    queryFn: async (): Promise<Territory[]> => {
      const { data, error } = await supabase
        .from('territories')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data || []) as Territory[];
    },
  });
};

// Fetch single territory with stats
export const useTerritory = (id: string) => {
  return useQuery({
    queryKey: ['territory', id],
    queryFn: async (): Promise<Territory | null> => {
      // Fetch territory
      const { data: territory, error: territoryError } = await supabase
        .from('territories')
        .select('*')
        .eq('id', id)
        .single();

      if (territoryError) throw territoryError;
      if (!territory) return null;

      // Fetch stats
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('pipeline, status, pipeline_data')
        .eq('territory_id', id);

      if (customersError) throw customersError;

      const recurringCount = customers?.filter((c: any) => c.pipeline === 'recurring').length || 0;
      const projectCount = customers?.filter((c: any) => c.pipeline === 'one_time').length || 0;

      // Calculate monthly volume from recurring customers
      const monthlyVolume = customers?.reduce((sum: number, c: any) => {
        if (c.pipeline === 'recurring' && c.pipeline_data?.monthly_sales) {
          const sales = c.pipeline_data.monthly_sales.reduce((s: number, b: any) => s + (b.monthlySales || 0), 0);
          return sum + sales;
        }
        return sum;
      }, 0) || 0;

      // Fetch active reps
      const { data: reps, error: repsError } = await supabase
        .from('profiles')
        .select('id')
        .contains('territory_ids', [id]);

      if (repsError) throw repsError;

      // Calculate conversion rate (mock calculation - would be based on actual visits)
      const conversionRate = Math.round(Math.random() * 30 + 20); // 20-50% for demo

      const t = territory as any;
      return {
        id: t.id,
        name: t.name,
        parent_id: t.parent_id,
        level: t.level,
        boundary: t.boundary,
        color_key: t.color_key,
        created_at: t.created_at,
        stats: {
          totalCustomers: customers?.length || 0,
          recurringCount,
          projectCount,
          monthlyVolume: Math.round(monthlyVolume),
          activeReps: reps?.length || 0,
          conversionRate,
        },
      } as Territory;
    },
    enabled: !!id,
  });
};

// Create territory mutation
export const useCreateTerritory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (territory: Omit<Territory, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('territories')
        .insert(territory)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
    },
  });
};

// Update territory mutation
export const useUpdateTerritory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Territory> }) => {
      const { data, error } = await supabase
        .from('territories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
      queryClient.invalidateQueries({ queryKey: ['territory', variables.id] });
    },
  });
};

// Fetch territories by user access
export const useUserTerritories = (userId?: string, userRole?: string, territoryIds?: string[]) => {
  return useQuery({
    queryKey: ['user-territories', userId, userRole, territoryIds],
    queryFn: async (): Promise<Territory[]> => {
      if (!userId) return [];

      // Country head sees all territories
      if (userRole === 'country_head') {
        const { data, error } = await supabase
          .from('territories')
          .select('*')
          .order('name');

        if (error) throw error;
        return (data || []) as Territory[];
      }

      // Other roles see only authorized territories
      const conditions = [];

      // 1. Assigned via list (e.g. from profile or team)
      if (territoryIds && territoryIds.length > 0) {
        // Need to format array for PostgREST: (id1,id2,id3)
        conditions.push(`id.in.(${territoryIds.join(',')})`);
      }

      // 2. Assigned via supervisor_id column (direct supervision)
      if (userId) {
        conditions.push(`supervisor_id.eq.${userId}`);
      }

      if (conditions.length > 0) {
        // Use OR to combine conditions
        const { data, error } = await supabase
          .from('territories')
          .select('*')
          .or(conditions.join(','))
          .order('name');

        if (error) throw error;
        return (data || []) as Territory[];
      }

      return [];
    },
    enabled: !!userId,
  });
};
