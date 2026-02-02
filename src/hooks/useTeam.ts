
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export interface TeamMember {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
    email: string;
    phone?: string;
    territory_ids?: string[];
    target_monthly?: number;
}

export const useTeam = () => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['team', user?.id],
        queryFn: async (): Promise<TeamMember[]> => {
            if (!user?.id) return [];

            // Fetch recursive subordinates for full hierarchy access
            const { data: subordinates, error: rpcError } = await supabase
                .rpc('get_recursive_subordinates', { manager_id: user.id });

            if (rpcError) {
                console.error('Error fetching team hierarchy:', rpcError);
                // Fallback to direct reports
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('reports_to', user.id)
                    .eq('is_active', true);
                if (error) throw error;
                return (data || []) as TeamMember[];
            }

            // Fetch profiles for all subordinates + self?
            // Usually we want to assign to subordinates.
            // The RFC returns `id` as the column name (see fix_customer_visibility.sql)
            const subordinateIds = (subordinates || [])
                .map((s: any) => s.id)
                .filter((id: any) => id);

            if (subordinateIds.length === 0) return [];

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .in('id', subordinateIds)
                .eq('is_active', true);

            if (error) throw error;
            return (data || []) as TeamMember[];
        },
        enabled: !!user?.id,
    });
};
