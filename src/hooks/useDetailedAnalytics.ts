// ============================================================
// AMAN CEMENT CRM — Detailed Analytics Hooks
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

// ─── Territory / Area Aggregated Analytics ────────────────────
export interface TerritoryStats {
    territory_id: string;
    territory_name: string;
    area: string;
    total_customers: number;
    recurring_shops: number;
    projects: number;
    recurring_aman: number;
    recurring_others: number;
    projects_aman: number;
    projects_others: number;
    monthly_volume_tons: number;
    cement_required_tons: number;
    cement_consumed_tons: number;
}

export interface AreaStats {
    area: string;
    total_customers: number;
    recurring_shops: number;
    projects: number;
    recurring_aman: number;
    projects_aman: number;
    monthly_volume_tons: number;
    cement_required_tons: number;
    territories: string[];
}

function isAmanBrand(
    brandPrefs: string[] | null | undefined,
    currentBrand: string | null | undefined
): boolean {
    const key = 'aman';
    if (brandPrefs && brandPrefs.length > 0)
        return brandPrefs.some(b => b.toLowerCase().includes(key));
    if (currentBrand) return currentBrand.toLowerCase().includes(key);
    return false;
}

export const useTerritoryAreaAnalytics = (userId?: string) => {
    return useQuery({
        queryKey: ['territory-area-analytics', userId],
        queryFn: async (): Promise<{ territories: TerritoryStats[]; areas: AreaStats[] }> => {
            const { data, error } = await supabase
                .from('customers')
                .select(`
          id, pipeline, area, territory_id, is_converted, current_brand,
          brand_preferences, monthly_sales_advance, monthly_sales_advance_plus,
          monthly_sales_green, monthly_sales_basic, monthly_sales_classic,
          cement_required, cement_consumed, status,
          territories(name, area)
        `)
                .eq('status', 'active');

            if (error) throw error;
            const customers = (data || []) as any[];

            const terrMap = new Map<string, TerritoryStats>();
            for (const c of customers) {
                const tid = c.territory_id || '__unassigned__';
                const tname = (c.territories as any)?.name || 'Unassigned';
                const area = (c.territories as any)?.area || c.area || 'Unknown Area';

                if (!terrMap.has(tid)) {
                    terrMap.set(tid, {
                        territory_id: tid, territory_name: tname, area,
                        total_customers: 0, recurring_shops: 0, projects: 0,
                        recurring_aman: 0, recurring_others: 0,
                        projects_aman: 0, projects_others: 0,
                        monthly_volume_tons: 0, cement_required_tons: 0, cement_consumed_tons: 0,
                    });
                }
                const t = terrMap.get(tid)!;
                t.total_customers++;

                if (c.pipeline === 'recurring') {
                    t.recurring_shops++;
                    t.monthly_volume_tons +=
                        (c.monthly_sales_advance || 0) + (c.monthly_sales_advance_plus || 0) +
                        (c.monthly_sales_green || 0) + (c.monthly_sales_basic || 0) +
                        (c.monthly_sales_classic || 0);
                    if (isAmanBrand(c.brand_preferences, null)) t.recurring_aman++; else t.recurring_others++;
                } else {
                    t.projects++;
                    t.cement_required_tons += c.cement_required || 0;
                    t.cement_consumed_tons += c.cement_consumed || 0;
                    if (c.is_converted || isAmanBrand(null, c.current_brand)) t.projects_aman++; else t.projects_others++;
                }
            }

            const territories = Array.from(terrMap.values())
                .filter(t => t.territory_id !== '__unassigned__')
                .sort((a, b) => a.territory_name.localeCompare(b.territory_name));

            const areaMap = new Map<string, AreaStats>();
            for (const t of territories) {
                if (!areaMap.has(t.area)) {
                    areaMap.set(t.area, {
                        area: t.area, total_customers: 0, recurring_shops: 0, projects: 0,
                        recurring_aman: 0, projects_aman: 0,
                        monthly_volume_tons: 0, cement_required_tons: 0, territories: [],
                    });
                }
                const a = areaMap.get(t.area)!;
                a.total_customers += t.total_customers;
                a.recurring_shops += t.recurring_shops;
                a.projects += t.projects;
                a.recurring_aman += t.recurring_aman;
                a.projects_aman += t.projects_aman;
                a.monthly_volume_tons += t.monthly_volume_tons;
                a.cement_required_tons += t.cement_required_tons;
                if (!a.territories.includes(t.territory_name)) a.territories.push(t.territory_name);
            }

            return {
                territories,
                areas: Array.from(areaMap.values()).sort((a, b) => a.area.localeCompare(b.area)),
            };
        },
        staleTime: 5 * 60 * 1000,
        enabled: !!userId,
    });
};


// ─── My Attendance for a Given Date ───────────────────────────
export const useMyAttendance = (userId: string | undefined, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return useQuery({
        queryKey: ['my-attendance', userId, dateStr],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('attendance')
                .select('*')
                .eq('user_id', userId)
                .eq('date', dateStr)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
        enabled: !!userId,
        staleTime: 60 * 1000, // 1 min
    });
};

// ─── My Visits for a Given Date (for outcome analysis) ────────
export const useRepDailyVisits = (userId: string | undefined, date: Date) => {
    const startStr = format(date, 'yyyy-MM-dd') + 'T00:00:00.000Z';
    const endStr = format(date, 'yyyy-MM-dd') + 'T23:59:59.999Z';
    return useQuery({
        queryKey: ['rep-daily-visits', userId, format(date, 'yyyy-MM-dd')],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('visits')
                .select('id, outcome, status, checked_in_at, customer_id, customers(name)')
                .eq('sales_rep_id', userId)
                .gte('checked_in_at', startStr)
                .lte('checked_in_at', endStr)
                .order('checked_in_at', { ascending: true });
            if (error) throw error;
            return data || [];
        },
        enabled: !!userId,
        staleTime: 60 * 1000,
    });
};

// ─── Yesterday's Visits (for comparison) ──────────────────────
export const useRepYesterdayVisits = (userId: string | undefined, date: Date) => {
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    return useRepDailyVisits(userId, yesterday);
};

// ─── Team Attendance for a Date (Manager view) ────────────────
export interface TeamAttendanceRow {
    user_id: string;
    full_name: string;
    employee_code: string;
    role: string;
    check_in_at: string | null;
    check_out_at: string | null;
    total_hours: number | null;
    status: string | null;
}

export const useTeamAttendance = (
    managerId: string | undefined,
    date: Date
) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return useQuery({
        queryKey: ['team-attendance', managerId, dateStr],
        queryFn: async (): Promise<TeamAttendanceRow[]> => {
            // 1. Get all direct reports (recursive downline via reports_to)
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, employee_code, role, reports_to')
                .eq('is_active', true);

            if (profilesError) throw profilesError;
            if (!profiles || profiles.length === 0) return [];

            // Build set of all subordinate user IDs for this manager
            const subordinateIds = new Set<string>();
            const addSubordinates = (parentId: string) => {
                profiles
                    .filter((p: any) => p.reports_to === parentId)
                    .forEach((p: any) => {
                        subordinateIds.add(p.id);
                        addSubordinates(p.id); // recurse
                    });
            };
            addSubordinates(managerId!);

            if (subordinateIds.size === 0) return [];

            // 2. Fetch attendance for those IDs on the given date
            const { data: attendance, error: attError } = await supabase
                .from('attendance')
                .select('user_id, check_in_at, check_out_at, total_hours, status')
                .in('user_id', Array.from(subordinateIds))
                .eq('date', dateStr);

            if (attError) throw attError;

            const attMap = new Map<string, any>();
            (attendance || []).forEach((a: any) => attMap.set(a.user_id, a));

            // 3. Merge profiles with attendance
            return Array.from(subordinateIds)
                .map((id) => {
                    const profile = profiles.find((p: any) => p.id === id);
                    const att = attMap.get(id);
                    return {
                        user_id: id,
                        full_name: profile?.full_name || 'Unknown',
                        employee_code: profile?.employee_code || '',
                        role: profile?.role || '',
                        check_in_at: att?.check_in_at || null,
                        check_out_at: att?.check_out_at || null,
                        total_hours: att?.total_hours || null,
                        status: att?.status || 'absent',
                    } as TeamAttendanceRow;
                })
                .sort((a, b) => a.full_name.localeCompare(b.full_name));
        },
        enabled: !!managerId,
        staleTime: 2 * 60 * 1000,
    });
};

// ─── Team Visits for a Date (Manager view) ────────────────────
export const useTeamVisitsForDate = (
    managerId: string | undefined,
    date: Date
) => {
    const startStr = format(date, 'yyyy-MM-dd') + 'T00:00:00.000Z';
    const endStr = format(date, 'yyyy-MM-dd') + 'T23:59:59.999Z';

    return useQuery({
        queryKey: ['team-visits-date', managerId, format(date, 'yyyy-MM-dd')],
        queryFn: async () => {
            // Get subordinate IDs
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, reports_to')
                .eq('is_active', true);

            const subordinateIds = new Set<string>();
            const addSubordinates = (parentId: string) => {
                (profiles || [])
                    .filter((p: any) => p.reports_to === parentId)
                    .forEach((p: any) => {
                        subordinateIds.add(p.id);
                        addSubordinates(p.id);
                    });
            };
            if (managerId) addSubordinates(managerId);

            if (subordinateIds.size === 0) return [];

            const { data, error } = await supabase
                .from('visits')
                .select('id, sales_rep_id, outcome, status, checked_in_at, customers(name, territory_id)')
                .in('sales_rep_id', Array.from(subordinateIds))
                .gte('checked_in_at', startStr)
                .lte('checked_in_at', endStr);

            if (error) throw error;
            return data || [];
        },
        enabled: !!managerId,
        staleTime: 2 * 60 * 1000,
    });
};

// ─── Sales performance for team on a date ─────────────────────
export const useTeamSalesForDate = (
    managerId: string | undefined,
    date: Date
) => {
    const startStr = format(date, 'yyyy-MM-dd') + 'T00:00:00.000Z';
    const endStr = format(date, 'yyyy-MM-dd') + 'T23:59:59.999Z';

    return useQuery({
        queryKey: ['team-sales-date', managerId, format(date, 'yyyy-MM-dd')],
        queryFn: async () => {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, reports_to')
                .eq('is_active', true);

            const subordinateIds = new Set<string>();
            const addSubordinates = (parentId: string) => {
                (profiles || [])
                    .filter((p: any) => p.reports_to === parentId)
                    .forEach((p: any) => {
                        subordinateIds.add(p.id);
                        addSubordinates(p.id);
                    });
            };
            if (managerId) addSubordinates(managerId);

            if (subordinateIds.size === 0) return [];

            const { data, error } = await supabase
                .from('conversions')
                .select('id, converted_by, order_value, quantity_bags, created_at')
                .in('converted_by', Array.from(subordinateIds))
                .gte('created_at', startStr)
                .lte('created_at', endStr);

            if (error) throw error;
            return data || [];
        },
        enabled: !!managerId,
        staleTime: 2 * 60 * 1000,
    });
};
