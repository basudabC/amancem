// ============================================================
// AMAN CEMENT CRM — Customer Data Hooks (React Query)
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Customer, Visit, PipelineType } from '@/types';

// Fetch customers with filters
export const useCustomers = (filters?: {
  pipeline?: PipelineType;
  territoryId?: string;
  status?: 'active' | 'archived';
  salesRepId?: string;
}) => {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: async (): Promise<Customer[]> => {
      let query = supabase
        .from('customers')
        .select('*');

      if (filters?.pipeline) {
        query = query.eq('pipeline', filters.pipeline);
      }
      if (filters?.territoryId) {
        query = query.eq('territory_id', filters.territoryId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.salesRepId) {
        query = query.eq('sales_rep_id', filters.salesRepId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match Customer type
      const transformedData = (data || []).map((item: any) => {
        return {
          id: item.id,
          pipeline: item.pipeline,
          name: item.name,
          owner_name: item.owner_name,
          owner_age: item.owner_age,
          phone: item.phone,
          email: item.email,
          address: item.address,
          lat: item.lat,
          lng: item.lng,
          latitude: item.latitude,
          longitude: item.longitude,
          area: item.area,
          territory_id: item.territory_id,
          sales_rep_id: item.sales_rep_id,
          assigned_to: item.assigned_to,
          created_by: item.created_by,
          status: item.status,
          pipeline_data: item.pipeline_data,
          last_outcome: item.last_outcome,
          last_visit_outcome: item.last_visit_outcome,
          is_converted: item.is_converted,
          notes: item.notes,
          tags: item.tags,
          // Recurring shop fields
          shop_name: item.shop_name,
          monthly_sales_advance: item.monthly_sales_advance,
          monthly_sales_advance_plus: item.monthly_sales_advance_plus,
          monthly_sales_green: item.monthly_sales_green,
          monthly_sales_basic: item.monthly_sales_basic,
          monthly_sales_classic: item.monthly_sales_classic,
          selling_price_advance: item.selling_price_advance,
          selling_price_advance_plus: item.selling_price_advance_plus,
          selling_price_green: item.selling_price_green,
          selling_price_basic: item.selling_price_basic,
          selling_price_classic: item.selling_price_classic,
          brand_preferences: item.brand_preferences,
          competitor_brands: item.competitor_brands,
          storage_capacity: item.storage_capacity,
          credit_practice: item.credit_practice,
          credit_days: item.credit_days,
          promotions_offered: item.promotions_offered,
          // Project fields
          built_up_area: item.built_up_area,
          number_of_floors: item.number_of_floors,
          structure_type: item.structure_type,
          construction_stage: item.construction_stage,
          project_started: item.project_started,
          current_brand: item.current_brand,
          cement_required: item.cement_required,
          cement_consumed: item.cement_consumed,
          cement_remaining: item.cement_remaining,
          created_at: item.created_at,
          updated_at: item.updated_at,
          territory_name: item.territories?.name,
          territory_color_key: item.territories?.color_key,
          sales_rep_name: item.profiles?.full_name,
        } as Customer;
      });

      return transformedData;
    },
  });
};

// Fetch single customer
export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async (): Promise<Customer | null> => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      const item = data as any;
      return {
        id: item.id,
        pipeline: item.pipeline,
        name: item.name,
        owner_name: item.owner_name,
        owner_age: item.owner_age,
        phone: item.phone,
        email: item.email,
        address: item.address,
        lat: item.lat,
        lng: item.lng,
        latitude: item.latitude,
        longitude: item.longitude,
        area: item.area,
        territory_id: item.territory_id,
        sales_rep_id: item.sales_rep_id,
        assigned_to: item.assigned_to,
        created_by: item.created_by,
        status: item.status,
        pipeline_data: item.pipeline_data,
        last_outcome: item.last_outcome,
        last_visit_outcome: item.last_visit_outcome,
        is_converted: item.is_converted,
        notes: item.notes,
        tags: item.tags,
        // Recurring shop fields
        shop_name: item.shop_name,
        monthly_sales_advance: item.monthly_sales_advance,
        monthly_sales_advance_plus: item.monthly_sales_advance_plus,
        monthly_sales_green: item.monthly_sales_green,
        monthly_sales_basic: item.monthly_sales_basic,
        monthly_sales_classic: item.monthly_sales_classic,
        selling_price_advance: item.selling_price_advance,
        selling_price_advance_plus: item.selling_price_advance_plus,
        selling_price_green: item.selling_price_green,
        selling_price_basic: item.selling_price_basic,
        selling_price_classic: item.selling_price_classic,
        brand_preferences: item.brand_preferences,
        competitor_brands: item.competitor_brands,
        storage_capacity: item.storage_capacity,
        credit_practice: item.credit_practice,
        credit_days: item.credit_days,
        promotions_offered: item.promotions_offered,
        // Project fields
        built_up_area: item.built_up_area,
        number_of_floors: item.number_of_floors,
        structure_type: item.structure_type,
        construction_stage: item.construction_stage,
        project_started: item.project_started,
        current_brand: item.current_brand,
        cement_required: item.cement_required,
        cement_consumed: item.cement_consumed,
        cement_remaining: item.cement_remaining,
        created_at: item.created_at,
        updated_at: item.updated_at,
        territory_name: item.territories?.name,
        territory_color_key: item.territories?.color_key,
        sales_rep_name: item.profiles?.full_name,
      } as Customer;
    },
    enabled: !!id,
  });
};

// Create customer mutation
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

// Update customer mutation
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Customer> }) => {
      const { data, error } = await supabase
        .from('customers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
    },
  });
};

// Archive customer (soft delete)
export const useArchiveCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('customers')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

// Fetch customer visits
export const useCustomerVisits = (customerId: string) => {
  return useQuery({
    queryKey: ['visits', customerId],
    queryFn: async (): Promise<Visit[]> => {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          customers:customer_id (name, pipeline)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        customer_id: item.customer_id,
        sales_rep_id: item.sales_rep_id,
        checkin_lat: item.checkin_lat,
        checkin_lng: item.checkin_lng,
        checkin_at: item.checkin_at,
        outcome: item.outcome,
        note: item.note,
        voice_memo_url: item.voice_memo_url,
        completed: item.completed,
        created_at: item.created_at,
        customer_name: item.customers?.name,
        customer_pipeline: item.customers?.pipeline,
      })) as Visit[];
    },
    enabled: !!customerId,
  });
};

// Create visit mutation
export const useCreateVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visit: Omit<Visit, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('visits')
        .insert(visit)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['visits', variables.customer_id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

// Update visit outcome
export const useUpdateVisitOutcome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      visitId,
      outcome,
      completed
    }: {
      visitId: string;
      outcome: string;
      completed: boolean;
    }) => {
      const { data, error } = await supabase
        .from('visits')
        .update({ outcome, completed })
        .eq('id', visitId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

// Fetch customers for map (optimized payload)
export const useMapCustomers = (territoryIds?: string[]) => {
  return useQuery({
    queryKey: ['map-customers', territoryIds],
    queryFn: async (): Promise<Customer[]> => {
      let query = supabase
        .from('customers')
        .select('*')
        .eq('status', 'active');

      if (territoryIds && territoryIds.length > 0) {
        query = query.in('territory_id', territoryIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        pipeline: item.pipeline,
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        territory_id: item.territory_id,
        sales_rep_id: item.sales_rep_id,
        status: item.status,
        pipeline_data: item.pipeline_data,
        last_outcome: item.last_outcome,
        territory_name: item.territories?.name,
        territory_color_key: item.territories?.color_key,
        sales_rep_name: item.profiles?.full_name,
      })) as Customer[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
