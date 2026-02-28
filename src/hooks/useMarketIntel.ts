// ============================================================
// AMAN CEMENT CRM — Market Intelligence Hooks
// ============================================================

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

export interface MarketIntelFilters {
    division_id?: string;
    region_id?: string;
    area_id?: string;
    territory_id?: string;
    date_range?: [Date, Date];
    brand_id?: string;
}

// Subscribes to customer data updates
export function useRealtimeMarketIntel() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const customersChannel = supabase
            .channel('market_intel_customers')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'customers' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['market_intel_size'] });
                    queryClient.invalidateQueries({ queryKey: ['market_intel_brand_share'] });
                }
            )
            .subscribe();

        const visitsChannel = supabase
            .channel('market_intel_visits')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'visits' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['market_intel_sentiment'] });
                    queryClient.invalidateQueries({ queryKey: ['market_intel_activity'] });
                }
            )
            .subscribe();

        const trackerChannel = supabase
            .channel('market_intel_tracker')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'customer_brand_tracker' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['market_intel_brand_share'] });
                    queryClient.invalidateQueries({ queryKey: ['market_intel_prices'] });
                    queryClient.invalidateQueries({ queryKey: ['market_intel_size'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(customersChannel);
            supabase.removeChannel(visitsChannel);
            supabase.removeChannel(trackerChannel);
        };
    }, [queryClient]);
}

// Fetch Market Size for a Territory
export function useMarketSize(filters: MarketIntelFilters) {
    return useQuery({
        queryKey: ['market_intel_size', filters],
        queryFn: async () => {
            // If territory is specified, fetch the aggregation directly via simple DB logic
            // Since `get_territory_market_size` RPC was created, we can attempt to use it,
            // But we will gracefully fallback to manual calculation if the RPC is unavailable
            try {
                if (filters.territory_id) {
                    const { data, error } = await supabase.rpc('get_territory_market_size', {
                        p_territory_id: filters.territory_id,
                    });
                    if (!error && data && data.length > 0) {
                        return data[0];
                    }
                }
            } catch (e) {
                console.warn('RPC failed or missing, falling back to manual fetch', e);
            }

            // Manual Query Fallback
            let query = supabase
                .from('customers')
                .select('pipeline, project_started, current_brand, storage_capacity, monthly_sales_advance, monthly_sales_advance_plus, monthly_sales_green, monthly_sales_basic, monthly_sales_classic, territory_id')
                .eq('status', 'active');

            if (filters.territory_id) query = query.eq('territory_id', filters.territory_id);

            const { data, error } = await query;
            if (error) throw error;

            const result = {
                total_market_volume: 0,
                our_volume: 0,
                total_shops: 0,
                active_projects: 0
            };

            data?.forEach((c: any) => {
                // Total Market Volume = Storage Capacity in Tons * 20 bags
                result.total_market_volume += (c.storage_capacity || 0) * 20;

                // Our captured share = Sum of Aman Cement monthly sales * 20 bags
                const amanVolTons = (c.monthly_sales_advance || 0) +
                    (c.monthly_sales_advance_plus || 0) +
                    (c.monthly_sales_green || 0) +
                    (c.monthly_sales_basic || 0) +
                    (c.monthly_sales_classic || 0);
                result.our_volume += amanVolTons * 20;

                // Total Mapped Shops (Dealer & Retailer)
                const pipelineType = (c.pipeline || '').toLowerCase();
                if (pipelineType === 'recurring') {
                    result.total_shops += 1;
                }
                // Active Projects using Aman Cement
                else if (pipelineType === 'one_time') {
                    const isAman = c.current_brand && c.current_brand.toLowerCase().includes('aman');
                    if (c.project_started && isAman) {
                        result.active_projects += 1;
                    }
                }
            });

            return result;
        },
        enabled: !!filters.territory_id // Often requires a territory to be meaningful
    });
}

// Fetch Brand Share Data
export function useBrandShare(filters: MarketIntelFilters) {
    return useQuery({
        queryKey: ['market_intel_brand_share', filters],
        queryFn: async () => {
            let startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            let endDate = new Date();

            if (filters.date_range && filters.date_range.length === 2) {
                startDate = filters.date_range[0];
                endDate = filters.date_range[1];
                endDate.setHours(23, 59, 59, 999);
            }

            let query = supabase
                .from('customer_brand_tracker')
                .select('id, brand_name, monthly_volume, selling_price, promotions, created_at, customers!inner(territory_id)')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());

            if (filters.territory_id) {
                query = query.eq('customers.territory_id', filters.territory_id);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Temporary aggregations for the UI
            const brandData: Record<string, {
                brand: string;
                shops_selling: number;
                primary_shops: number;
                est_volume: number;
                dominance_reason: string;
            }> = {};

            data?.forEach((r: any) => {
                const bname = r.brand_name || 'Unknown';
                if (!brandData[bname]) {
                    brandData[bname] = {
                        brand: bname,
                        shops_selling: 0,
                        primary_shops: 0,
                        est_volume: 0,
                        dominance_reason: ''
                    };
                }

                brandData[bname].shops_selling += 1;
                brandData[bname].est_volume += (r.monthly_volume || 0);

                if (r.promotions) {
                    if (!brandData[bname].dominance_reason.includes(r.promotions)) {
                        brandData[bname].dominance_reason += (brandData[bname].dominance_reason ? ', ' : '') + r.promotions;
                    }
                }

                // Assuming primary shop for a brand if the rep entered it (naive approach for now)
                brandData[bname].primary_shops += 1;
            });

            return Object.values(brandData).sort((a, b) => b.est_volume - a.est_volume);
        },
        enabled: !!filters.territory_id
    });
}

// Fetch Pricing & Sentiments from recent visits and tracker
export function useVisitIntel(filters: MarketIntelFilters) {
    return useQuery({
        queryKey: ['market_intel_visits', filters],
        queryFn: async () => {
            let startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            let endDate = new Date();

            if (filters.date_range && filters.date_range.length === 2) {
                startDate = filters.date_range[0];
                endDate = filters.date_range[1];
                // Ensure endDate covers the whole day
                endDate.setHours(23, 59, 59, 999);
            }

            // Fetch pricing from actual customer_brand_tracker table
            let priceQuery = supabase
                .from('customer_brand_tracker')
                .select('brand_name, selling_price, created_at, customers!inner(territory_id, name)')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: false })
                .limit(50);

            if (filters.territory_id) {
                priceQuery = priceQuery.eq('customers.territory_id', filters.territory_id);
            }

            // Fetch sentiments and ALL visits in range to calculate "rep wise visited count shopwise"
            let visitQuery = supabase
                .from('visits')
                .select('id, customer_id, created_at, market_intel, sales_rep_id, outcome, profiles:sales_rep_id(full_name), customers!inner(id, territory_id, name)')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());

            if (filters.territory_id) {
                visitQuery = visitQuery.eq('customers.territory_id', filters.territory_id);
            }

            // Fetch Total Assigned Shops mapped to reps in this territory
            let mappedShopsQuery = supabase
                .from('customers')
                .select('assigned_to, id')
                .in('pipeline', ['recurring', 'one_time']);

            if (filters.territory_id) {
                mappedShopsQuery = mappedShopsQuery.eq('territory_id', filters.territory_id);
            }

            const [priceRes, visitRes, mappedRes] = await Promise.all([priceQuery, visitQuery, mappedShopsQuery]);

            // Calculate total mapped assigned shops per rep
            const repAssignedCounts: Record<string, number> = {};
            mappedRes.data?.forEach((c: any) => {
                if (c.assigned_to) {
                    repAssignedCounts[c.assigned_to] = (repAssignedCounts[c.assigned_to] || 0) + 1;
                }
            });

            if (priceRes.error) console.error('Error fetching tracker data:', priceRes.error);
            if (visitRes.error) console.error('Error fetching visit intel:', visitRes.error);

            const pricing: any[] = [];
            const sentiments: any[] = [];
            const activities: any[] = [];

            priceRes.data?.forEach((r: any) => {
                pricing.push({
                    brand: r.brand_name,
                    retail_price: r.selling_price,
                    dealer_price: r.selling_price, // Assuming same for UI demo purposes if undefined
                    shop_name: r.customers?.name || 'Unknown',
                    visit_date: r.created_at,
                });
            });

            // Structure: repId -> { rep_name, shops: shopId -> { shop_name, visits, outcomes: {} } }
            const repVisitsMap: Record<string, {
                rep_name: string;
                shops: Record<string, { shop_name: string; visits: number; outcomes: Record<string, number> }>
            }> = {};

            visitRes.data?.forEach((v: any) => {
                // Tracking total visited count shopwise and outcomes by sales rep
                const repId = v.sales_rep_id;
                const repName = v.profiles?.full_name || 'Unknown Rep';
                const shopId = v.customer_id;
                const shopName = v.customers?.name || 'Unknown Shop';
                const outcome = v.outcome || 'No outcome'; // e.g. interested, prospect, etc.

                if (!repVisitsMap[repId]) {
                    repVisitsMap[repId] = { rep_name: repName, shops: {} };
                }
                if (!repVisitsMap[repId].shops[shopId]) {
                    repVisitsMap[repId].shops[shopId] = { shop_name: shopName, visits: 0, outcomes: {} };
                }

                repVisitsMap[repId].shops[shopId].visits += 1;
                repVisitsMap[repId].shops[shopId].outcomes[outcome] = (repVisitsMap[repId].shops[shopId].outcomes[outcome] || 0) + 1;

                // Process market intel text block
                const intel = v.market_intel as any;
                if (!intel) return;

                if (intel.prices && Array.isArray(intel.prices)) {
                    // We can still parse fallback visit prices if they exist
                    intel.prices.forEach((p: any) => {
                        pricing.push({
                            ...p,
                            visit_date: v.created_at,
                            shop_name: v.customers?.name,
                            rep_id: v.sales_rep_id
                        });
                    });
                }

                if (intel.sentiment) {
                    sentiments.push({
                        shop_name: v.customers?.name,
                        sentiment_score: intel.sentiment.score,
                        complaint: intel.sentiment.primary_complaint,
                        praised_competitor: intel.sentiment.praised_competitor,
                        visit_date: v.created_at
                    });
                }

                if (intel.activities && Array.isArray(intel.activities)) {
                    intel.activities.forEach((a: any) => {
                        activities.push({
                            ...a,
                            visit_date: v.created_at
                        });
                    });
                }
            });

            // Flatten rep visits map for frontend consumption
            const rep_shop_visits: any[] = [];
            Object.entries(repVisitsMap).forEach(([repId, repData]) => {
                const totalShops = Object.keys(repData.shops).length;
                let totalVisits = 0;

                const shopsArray = Object.values(repData.shops).map(shopData => {
                    totalVisits += shopData.visits;
                    // Format outcomes: e.g. "2 active, 1 interested"
                    const outcomeStr = Object.entries(shopData.outcomes)
                        .map(([outcome, count]) => `${count} ${outcome}`)
                        .join(', ');

                    return {
                        shop_name: shopData.shop_name,
                        visit_count: shopData.visits,
                        outcomes: outcomeStr
                    };
                });

                // Sort shops by most visited inside the rep
                shopsArray.sort((a, b) => b.visit_count - a.visit_count);

                rep_shop_visits.push({
                    rep_id: repId,
                    rep_name: repData.rep_name,
                    unique_shops_visited: totalShops,
                    total_assigned_shops: repAssignedCounts[repId] || 0,
                    total_visits: totalVisits,
                    shopsDetails: shopsArray
                });
            });

            // Sort by top performing rep
            rep_shop_visits.sort((a, b) => b.total_visits - a.total_visits);

            return { pricing, sentiments, activities, rep_shop_visits };
        },
        enabled: !!filters.territory_id
    });
}
