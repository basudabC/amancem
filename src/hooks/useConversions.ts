// ============================================================
// useConversions Hook - Fetch and manage conversion/sales data
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useMemo } from 'react';

export interface Conversion {
    id: string;
    customer_id: string;
    converted_by: string;
    converted_at: string;
    order_value: number;
    order_volume: number;
    product_type: string;
    source_visit_id?: string;
    notes?: string;
    cash_amount: number;
    credit_amount: number;

    // Joined data
    customer_name?: string;
    customer_pipeline?: string;
    sales_rep_name?: string;
}

export interface SalesSummary {
    total_value: number;
    total_volume: number;
    total_count: number;
    total_credit: number;
    total_cash: number;
    by_product: Record<string, { value: number; volume: number; count: number }>;
}

interface UseConversionsOptions {
    customerId?: string;
    salesRepId?: string;
    dateFrom?: string;
    dateTo?: string;
    includeTeam?: boolean; // For managers to see team sales
}

export function useConversions(options: UseConversionsOptions = {}) {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['conversions', options],
        queryFn: async () => {
            let query = supabase
                .from('conversions')
                .select(`
          *,
          customers!conversions_customer_id_fkey!inner(name, pipeline),
          profiles!conversions_converted_by_fkey(full_name)
        `)
                .order('converted_at', { ascending: false });

            // Filter by customer
            if (options.customerId) {
                query = query.eq('customer_id', options.customerId);
            }

            // Filter by sales rep or team (hierarchy-based)
            if (options.salesRepId) {
                query = query.eq('converted_by', options.salesRepId);
            } else if (options.includeTeam) {
                // RLS Policy "hierarchy_view_conversions" handles the filtering
                // effectively showing own + team conversions automatically.
                // No manual filter needed here.
            } else if (user && !options.customerId) {
                // Default: only show user's own conversions (but NOT when filtering by customer)
                query = query.eq('converted_by', user.id);
            }

            // Date range filters
            if (options.dateFrom) {
                query = query.gte('converted_at', options.dateFrom);
            }
            if (options.dateTo) {
                query = query.lte('converted_at', options.dateTo);
            }

            const { data, error } = await query;

            if (error) {
                console.error('useConversions: Query error:', error);
                throw error;
            }

            // Transform data
            const conversions: Conversion[] = (data || []).map((item: any) => ({
                id: item.id,
                customer_id: item.customer_id,
                converted_by: item.converted_by,
                converted_at: item.converted_at,
                order_value: item.total_value || 0,
                cash_amount: item.cash_amount || 0,
                credit_amount: item.credit_amount || 0,
                order_volume: item.quantity_bags || 0,
                product_type: item.product,
                source_visit_id: item.visit_id || item.source_visit_id,
                notes: item.sale_notes || item.notes,
                customer_name: item.customers?.name,
                customer_pipeline: item.customers?.pipeline,
                sales_rep_name: item.profiles?.full_name,
            }));

            return conversions;
        },
        enabled: !!user,
        retry: 1,
        staleTime: 30000, // 30 seconds
    });
}

// Hook to get sales summary/metrics
export function useSalesSummary(options: UseConversionsOptions = {}) {
    const { data: conversions, isLoading, error, ...rest } = useConversions(options);

    const summary: SalesSummary = {
        total_value: 0,
        total_volume: 0,
        total_count: 0,
        total_credit: 0,
        total_cash: 0,
        by_product: {},
    };

    if (!isLoading && conversions && conversions.length > 0) {
        conversions.forEach(conv => {
            summary.total_value += conv.order_value || 0;
            summary.total_volume += conv.order_volume || 0;
            summary.total_count += 1;

            const product = conv.product_type || 'Unknown';
            if (!summary.by_product[product]) {
                summary.by_product[product] = { value: 0, volume: 0, count: 0 };
            }
            summary.by_product[product].value += conv.order_value || 0;
            summary.by_product[product].volume += conv.order_volume || 0;
            summary.by_product[product].count += 1;
        });
    }

    return {
        ...rest,
        isLoading,
        error,
        data: conversions,
        summary,
    };
}

// Hook for customer's recent sales (last 30 days)
export function useCustomerRecentSales(customerId: string) {
    const dateFrom = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
    }, []);

    const queryResult = useConversions({
        customerId,
        dateFrom,
    });

    const { data: conversions, isLoading, error } = queryResult;

    const summary: SalesSummary = {
        total_value: 0,
        total_volume: 0,
        total_count: 0,
        total_credit: 0,
        total_cash: 0,
        by_product: {},
    };

    if (!isLoading && conversions && conversions.length > 0) {
        conversions.forEach(conv => {
            summary.total_value += conv.order_value || 0;
            summary.total_volume += conv.order_volume || 0;
            summary.total_count += 1;

            const product = conv.product_type || 'Unknown';
            if (!summary.by_product[product]) {
                summary.by_product[product] = { value: 0, volume: 0, count: 0 };
            }
            summary.by_product[product].value += conv.order_value || 0;
            summary.by_product[product].volume += conv.order_volume || 0;
            summary.by_product[product].count += 1;
        });
    }

    return {
        data: conversions,
        isLoading,
        error,
        summary,
    };
}
