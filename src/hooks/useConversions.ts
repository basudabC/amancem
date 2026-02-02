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

    // Joined data
    customer_name?: string;
    customer_pipeline?: string;
    sales_rep_name?: string;
}

export interface SalesSummary {
    total_value: number;
    total_volume: number;
    total_count: number;
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

    console.log('useConversions: Hook called, user exists:', !!user, 'user:', user);

    return useQuery({
        queryKey: ['conversions', options],
        queryFn: async () => {
            console.log('useConversions: Starting query with options:', options);
            console.log('useConversions: Current user:', user?.id, user?.role);

            let query = supabase
                .from('conversions')
                .select(`
          *,
          customers!inner(name, pipeline),
          profiles!conversions_converted_by_fkey(full_name)
        `)
                .order('converted_at', { ascending: false });

            // Filter by customer
            if (options.customerId) {
                console.log('useConversions: Filtering by customer:', options.customerId);
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

            console.log('useConversions: Executing query...');
            const { data, error } = await query;

            if (error) {
                console.error('useConversions: Query error:', error);
                throw error;
            }

            console.log('useConversions: Query successful, rows returned:', data?.length || 0);

            // Transform data
            const conversions: Conversion[] = (data || []).map((item: any) => ({
                id: item.id,
                customer_id: item.customer_id,
                converted_by: item.converted_by,
                converted_at: item.converted_at,
                order_value: item.total_value || 0,
                order_volume: item.quantity_bags || 0,
                product_type: item.product,
                source_visit_id: item.visit_id || item.source_visit_id,
                notes: item.sale_notes || item.notes,
                customer_name: item.customers?.name,
                customer_pipeline: item.customers?.pipeline,
                sales_rep_name: item.profiles?.full_name,
            }));

            console.log('useConversions: Transformed conversions:', conversions);
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

    console.log('useSalesSummary: Input conversions:', conversions);
    console.log('useSalesSummary: isLoading:', isLoading, 'error:', error);

    const summary: SalesSummary = {
        total_value: 0,
        total_volume: 0,
        total_count: 0,
        by_product: {},
    };

    // Only calculate summary if data is loaded and available
    if (!isLoading && conversions && conversions.length > 0) {
        console.log('useSalesSummary: Processing', conversions.length, 'conversions');
        conversions.forEach(conv => {
            console.log('useSalesSummary: Processing conversion:', {
                id: conv.id,
                order_value: conv.order_value,
                order_volume: conv.order_volume,
                product_type: conv.product_type
            });

            summary.total_value += conv.order_value || 0;
            summary.total_volume += conv.order_volume || 0;
            summary.total_count += 1;

            // Group by product
            const product = conv.product_type || 'Unknown';
            if (!summary.by_product[product]) {
                summary.by_product[product] = { value: 0, volume: 0, count: 0 };
            }
            summary.by_product[product].value += conv.order_value || 0;
            summary.by_product[product].volume += conv.order_volume || 0;
            summary.by_product[product].count += 1;
        });
    } else {
        console.log('useSalesSummary: No conversions data or still loading');
    }

    console.log('useSalesSummary: Final summary:', summary);

    return {
        ...rest,
        isLoading,
        error,
        data: conversions,
        summary,
    };
}

// Hook for customer's recent sales (last 30 days)
// Hook for customer's recent sales (last 30 days)
export function useCustomerRecentSales(customerId: string) {
    // Memoize the date to prevent infinite re-fetching
    // We only want this to change if the component remounts or customerId changes
    const dateFrom = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        // Strip time to ensure stability across renders
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
    }, []); // Empty dependency array ensures it's stable for the component's lifetime

    console.log('useCustomerRecentSales called for customer:', customerId);
    console.log('useCustomerRecentSales dateFrom:', dateFrom);

    const queryResult = useConversions({
        customerId,
        dateFrom,
    });

    const { data: conversions, isLoading, error } = queryResult;

    console.log('useCustomerRecentSales conversions:', conversions);
    console.log('useCustomerRecentSales isLoading:', isLoading);
    console.log('useCustomerRecentSales error:', error);

    // Calculate summary directly - only when data is loaded
    const summary: SalesSummary = {
        total_value: 0,
        total_volume: 0,
        total_count: 0,
        by_product: {},
    };

    // IMPORTANT: Only calculate if NOT loading and conversions exist
    if (!isLoading && conversions && conversions.length > 0) {
        console.log('useCustomerRecentSales: Calculating summary from', conversions.length, 'conversions');
        conversions.forEach(conv => {
            console.log('useCustomerRecentSales: Processing conversion:', {
                order_value: conv.order_value,
                order_volume: conv.order_volume
            });
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
    } else if (!isLoading && (!conversions || conversions.length === 0)) {
        console.log('useCustomerRecentSales: No conversions found');
    } else {
        console.log('useCustomerRecentSales: Still loading, skipping summary calculation');
    }

    console.log('useCustomerRecentSales final summary:', summary);

    return {
        data: conversions,
        isLoading,
        error,
        summary,
    };
}
