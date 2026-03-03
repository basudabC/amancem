// ============================================================
// AMAN CEMENT CRM — Rep Performance Profile Modal
// Comprehensive view of a sales rep's performance metrics
// ============================================================

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
    X,
    TrendingUp,
    TrendingDown,
    CalendarCheck,
    Target,
    ShoppingBag,
    CheckCircle2,
    XCircle,
    Clock,
    BarChart3,
    Minus,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Award,
    Activity,
    Store,
    Eye,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, subMonths, addMonths, getMonth, getYear } from 'date-fns';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface RepPerformanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: any | null;
}

interface DayStatus {
    date: Date;
    status: 'present' | 'absent' | 'off_day' | 'future';
    visitCount: number;
    checkIn?: string;
    checkOut?: string;
    hoursWorked?: number;
}

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const OUTCOME_COLORS: Record<string, string> = {
    completed: '#2ECC71',
    interested: '#3A9EFF',
    not_interested: '#E74C5E',
    follow_up: '#D4A843',
    no_answer: '#8B9CB8',
    scheduled: '#9B6BFF',
    cancelled: '#FF7C3A',
    in_progress: '#3A9EFF',
    progressive: '#3A9EFF',
    stagnant: '#FF7C3A',
    new: '#D4A843',
};

const OUTCOME_LABELS: Record<string, string> = {
    completed: 'Completed',
    interested: 'Interested',
    not_interested: 'Not Interested',
    follow_up: 'Follow Up',
    no_answer: 'No Answer',
    scheduled: 'Scheduled',
    cancelled: 'Cancelled',
    in_progress: 'In Progress',
    progressive: 'Progressive',
    stagnant: 'Stagnant',
    new: 'New',
};

// ─────────────────────────────────────────────────────────
// Custom Tooltip for Charts
// ─────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0A2A5C] border border-white/20 rounded-lg p-3 shadow-xl">
                <p className="text-[#8B9CB8] text-xs mb-1">{label}</p>
                {payload.map((entry: any, i: number) => (
                    <p key={i} className="text-sm font-semibold" style={{ color: entry.color || entry.fill }}>
                        {entry.name}: {typeof entry.value === 'number' && entry.value > 999
                            ? `৳${(entry.value / 1000).toFixed(1)}K`
                            : entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// ─────────────────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────────────────

function KpiCard({
    icon: Icon,
    label,
    value,
    sub,
    color,
    trend,
}: {
    icon: any;
    label: string;
    value: string | number;
    sub?: string;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
}) {
    return (
        <div className="bg-[#061A3A] rounded-xl p-4 border border-white/10 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full opacity-5`} style={{ background: color, transform: 'translate(30%, -30%)' }} />
            <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center`} style={{ background: `${color}20` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                </div>
                {trend && (
                    <span className={`flex items-center gap-0.5 text-xs ${trend === 'up' ? 'text-[#2ECC71]' : trend === 'down' ? 'text-[#E74C5E]' : 'text-[#8B9CB8]'}`}>
                        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-[#F0F4F8] leading-none">{value}</p>
            <p className="text-xs text-[#8B9CB8] mt-1">{label}</p>
            {sub && <p className="text-xs mt-1" style={{ color }}>{sub}</p>}
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Attendance Calendar
// ─────────────────────────────────────────────────────────

function AttendanceCalendar({ days }: { days: DayStatus[] }) {
    const weeks: DayStatus[][] = [];
    let week: DayStatus[] = [];
    days.forEach((day, i) => {
        week.push(day);
        if (week.length === 7 || i === days.length - 1) {
            weeks.push(week);
            week = [];
        }
    });

    const statusColor: Record<DayStatus['status'], string> = {
        present: 'bg-[#2ECC71]',
        absent: 'bg-[#E74C5E]/60',
        off_day: 'bg-white/5',
        future: 'bg-white/5',
    };

    return (
        <div className="space-y-1">
            <div className="grid grid-cols-7 gap-1 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className={`text-center text-[10px] font-medium ${i === 5 ? 'text-[#FF7C3A]' : 'text-[#8B9CB8]'}`}>{d}</div>
                ))}
            </div>
            {weeks.map((w, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1">
                    {w.map((day, di) => (
                        <div
                            key={di}
                            title={`${format(day.date, 'EEE, MMM d')}: ${day.status}${day.checkIn ? ` · In: ${day.checkIn}` : ''
                                }${day.checkOut ? ` · Out: ${day.checkOut}` : ''}${day.hoursWorked ? ` · ${day.hoursWorked}h` : ''}`}
                            className={`h-7 rounded flex items-center justify-center text-[10px] font-medium cursor-default transition-transform hover:scale-110 ${statusColor[day.status]}`}
                        >
                            <span className={day.status === 'future' || day.status === 'off_day' ? 'text-[#4A5B7A]' : 'text-white'}>
                                {format(day.date, 'd')}
                            </span>
                        </div>
                    ))}
                </div>
            ))}
            <div className="flex items-center gap-4 mt-2 justify-center">
                {[
                    { label: 'Present', cls: 'bg-[#2ECC71]' },
                    { label: 'Absent', cls: 'bg-[#E74C5E]/60' },
                    { label: 'Friday (Off)', cls: 'bg-white/10' },
                ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded ${l.cls}`} />
                        <span className="text-[10px] text-[#8B9CB8]">{l.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────

export function RepPerformanceModal({ isOpen, onClose, member }: RepPerformanceModalProps) {
    const [viewDate, setViewDate] = useState(() => new Date());
    const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'sales' | 'attendance'>('overview');

    const monthStart = useMemo(() => startOfMonth(viewDate), [viewDate]);
    const monthEnd = useMemo(() => endOfMonth(viewDate), [viewDate]);

    const monthLabel = useMemo(() => format(viewDate, 'MMMM yyyy'), [viewDate]);

    const prevMonth = () => setViewDate(d => subMonths(d, 1));
    const nextMonth = () => setViewDate(d => addMonths(d, 1));
    const isCurrentMonth = getMonth(viewDate) === getMonth(new Date()) && getYear(viewDate) === getYear(new Date());

    // ── Fetch visits for this rep & month ──────────────────
    const { data: visits = [], isLoading: visitsLoading } = useQuery({
        queryKey: ['rep-visits', member?.id, format(monthStart, 'yyyy-MM')],
        enabled: !!member?.id && isOpen,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('visits')
                .select('id, status, outcome, created_at, customer_id, purpose, notes')
                .eq('sales_rep_id', member.id)
                .gte('created_at', format(monthStart, 'yyyy-MM-dd'))
                .lte('created_at', format(monthEnd, 'yyyy-MM-dd') + 'T23:59:59')
                .order('created_at', { ascending: true });
            if (error) throw error;
            return data || [];
        },
    });

    // ── Fetch shops added by this rep (all time) ──────────
    const { data: shopsData = [], isLoading: shopsLoading } = useQuery({
        queryKey: ['rep-shops', member?.id],
        enabled: !!member?.id && isOpen,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('customers')
                .select('id, name, shop_name, area, pipeline, is_converted, created_at, visit_count')
                .eq('assigned_to', member.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
    });

    // ── Sales achievements (table not yet created — disabled to prevent 404) ──
    // Target comes from member.target_monthly; achievements will show ৳0 until table exists
    const salesTargets: any[] = [];
    const targetsLoading = false;

    // ── Fetch attendance records from the DB table ────────
    const { data: attendanceRecords = [], isLoading: attendanceLoading } = useQuery({
        queryKey: ['rep-attendance', member?.id, format(monthStart, 'yyyy-MM')],
        enabled: !!member?.id && isOpen,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('attendance')
                .select('date, status, check_in_at, check_out_at, total_hours')
                .eq('user_id', member.id)
                .gte('date', format(monthStart, 'yyyy-MM-dd'))
                .lte('date', format(monthEnd, 'yyyy-MM-dd'));
            if (error) return []; // graceful fallback
            return data || [];
        },
    });

    // ── Fetch last 6 months trend data ────────────────────
    const { data: trendData = [] } = useQuery({
        queryKey: ['rep-trend', member?.id],
        enabled: !!member?.id && isOpen,
        queryFn: async () => {
            const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
            const results = await Promise.all(
                months.map(async (m) => {
                    const mStart = startOfMonth(m);
                    const mEnd = endOfMonth(m);

                    const [visitsRes, shopsRes] = await Promise.all([
                        supabase
                            .from('visits')
                            .select('id, status', { count: 'exact', head: false })
                            .eq('sales_rep_id', member.id)
                            .gte('created_at', format(mStart, 'yyyy-MM-dd'))
                            .lte('created_at', format(mEnd, 'yyyy-MM-dd') + 'T23:59:59'),
                        supabase
                            .from('customers')
                            .select('id', { count: 'exact', head: false })
                            .eq('assigned_to', member.id)
                            .gte('created_at', format(mStart, 'yyyy-MM-dd'))
                            .lte('created_at', format(mEnd, 'yyyy-MM-dd') + 'T23:59:59'),
                    ]);

                    const completedVisits = (visitsRes.data || []).filter(
                        (v: any) => v.status === 'completed' || v.status === 'in_progress'
                    ).length;

                    return {
                        month: format(m, 'MMM'),
                        visits: visitsRes.data?.length || 0,
                        completed: completedVisits,
                        shops: shopsRes.data?.length || 0,
                        target: member?.target_monthly || 0,
                        sales: 0, // would need daily_achievement data
                    };
                })
            );
            return results;
        },
    });

    // ── Computed Stats ────────────────────────────────────
    const stats = useMemo(() => {
        const totalVisits = visits.length;
        // A visit is "completed" if status is completed OR in_progress (checked in)
        const completedVisits = visits.filter((v: any) => v.status === 'completed' || v.status === 'in_progress').length;
        const scheduledVisits = visits.filter((v: any) => v.status === 'scheduled').length;
        const cancelledVisits = visits.filter((v: any) => v.status === 'cancelled').length;

        // De-duplicate customer visits for "shops visited"
        const uniqueShopsVisited = new Set(visits.map((v: any) => v.customer_id)).size;

        // Shops added this month
        const shopsThisMonth = shopsData.filter((s: any) => {
            const d = parseISO(s.created_at);
            return d >= monthStart && d <= monthEnd;
        }).length;

        // Visit outcome breakdown — use `outcome` field (can be null), fallback to status
        const outcomeCounts: Record<string, number> = {};
        visits.forEach((v: any) => {
            const key = v.outcome || v.status || 'scheduled';
            outcomeCounts[key] = (outcomeCounts[key] || 0) + 1;
        });
        const outcomeData = Object.entries(outcomeCounts).map(([key, count]) => ({
            name: OUTCOME_LABELS[key] || key,
            value: count,
            color: OUTCOME_COLORS[key] || '#8B9CB8',
        }));

        // Sales figures
        const totalSalesAchieved = salesTargets.reduce((sum: number, t: any) => sum + (t.daily_achievement || 0), 0);
        const target = member?.target_monthly || 0;
        const achievementPct = target > 0 ? Math.round((totalSalesAchieved / target) * 100) : 0;

        // ── Attendance — from the attendance DB table ───────────────
        // Only Friday (dow === 5) is the weekly off day
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const today = new Date();

        // Build a lookup map: date string -> attendance record
        const attendanceByDate = new Map<string, any>();
        attendanceRecords.forEach((rec: any) => {
            attendanceByDate.set(rec.date, rec);
        });

        // Count visits per date for tooltip enrichment
        const visitsByDate = new Map<string, number>();
        visits.forEach((v: any) => {
            if (v.created_at) {
                const key = format(parseISO(v.created_at), 'yyyy-MM-dd');
                visitsByDate.set(key, (visitsByDate.get(key) || 0) + 1);
            }
        });

        const dayStatuses: DayStatus[] = days.map((day) => {
            const dow = day.getDay(); // 0=Sun, 5=Fri, 6=Sat
            const dateKey = format(day, 'yyyy-MM-dd');
            const isFuture = day > today;
            const rec = attendanceByDate.get(dateKey);
            const dayVisitCount = visitsByDate.get(dateKey) || 0;

            if (isFuture) return { date: day, status: 'future', visitCount: 0 };
            // Only Friday is off
            if (dow === 5) return { date: day, status: 'off_day', visitCount: 0 };

            if (rec && rec.status === 'present') {
                return {
                    date: day,
                    status: 'present',
                    visitCount: dayVisitCount,
                    checkIn: rec.check_in_at ? format(parseISO(rec.check_in_at), 'hh:mm a') : undefined,
                    checkOut: rec.check_out_at ? format(parseISO(rec.check_out_at), 'hh:mm a') : undefined,
                    hoursWorked: rec.total_hours ?? undefined,
                };
            }
            return { date: day, status: 'absent', visitCount: 0 };
        });

        // Work days exclude Friday (off_day) and future days
        const workDays = dayStatuses.filter(d => d.status !== 'off_day' && d.status !== 'future');
        const presentDays = dayStatuses.filter(d => d.status === 'present').length;
        const absentDays = dayStatuses.filter(d => d.status === 'absent').length;
        const attendancePct = workDays.length > 0 ? Math.round((presentDays / workDays.length) * 100) : 0;

        return {
            totalVisits,
            completedVisits,
            scheduledVisits,
            cancelledVisits,
            uniqueShopsVisited,
            shopsThisMonth,
            totalShops: shopsData.length,
            outcomeData,
            totalSalesAchieved,
            target,
            achievementPct,
            dayStatuses,
            presentDays,
            absentDays,
            attendancePct,
            workDays: workDays.length,
        };
    }, [visits, shopsData, salesTargets, attendanceRecords, member, monthStart, monthEnd]);

    if (!isOpen || !member) return null;

    const isLoading = visitsLoading || shopsLoading || targetsLoading || attendanceLoading;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'visits', label: 'Visits', icon: CalendarCheck },
        { id: 'sales', label: 'Sales', icon: TrendingUp },
        { id: 'attendance', label: 'Attendance', icon: Calendar },
    ] as const;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="bg-[#0A2A5C] rounded-2xl border border-white/10 w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">

                {/* ── Header ─────────────────────────── */}
                <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-[#0F3460] to-[#0A2A5C] shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#3A9EFF] to-[#C41E3A] rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-xl font-bold">
                                {member.full_name?.charAt(0)?.toUpperCase() || 'R'}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#F0F4F8]">{member.full_name}</h2>
                            <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-xs text-[#8B9CB8]">{member.employee_code}</span>
                                {member.area && <span className="text-xs text-[#8B9CB8]">· {member.area}</span>}
                                {member.region && <span className="text-xs text-[#8B9CB8]">· {member.region}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Month Navigator */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-[#061A3A] border border-white/10 rounded-xl px-4 py-2">
                            <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <ChevronLeft className="w-4 h-4 text-[#8B9CB8]" />
                            </button>
                            <span className="text-sm font-semibold text-[#F0F4F8] min-w-[120px] text-center">{monthLabel}</span>
                            <button
                                onClick={nextMonth}
                                disabled={isCurrentMonth}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4 text-[#8B9CB8]" />
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <X className="w-5 h-5 text-[#8B9CB8]" />
                        </button>
                    </div>
                </div>

                {/* ── Tabs ────────────────────────────── */}
                <div className="flex border-b border-white/10 bg-[#061A3A] shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
                                ? 'border-[#C41E3A] text-[#F0F4F8]'
                                : 'border-transparent text-[#8B9CB8] hover:text-[#F0F4F8]'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Content ─────────────────────────── */}
                <div className="overflow-y-auto flex-1 p-5">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 border-2 border-[#C41E3A] border-t-transparent rounded-full animate-spin" />
                                <p className="text-[#8B9CB8] text-sm">Loading performance data...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* ══ OVERVIEW TAB ══ */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* KPI Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <KpiCard icon={Store} label="Total Shops (All Time)" value={stats.totalShops} color="#3A9EFF"
                                            sub={`+${stats.shopsThisMonth} this month`} />
                                        <KpiCard icon={Eye} label="Shops Visited" value={stats.uniqueShopsVisited} color="#2ECC71"
                                            sub={`${stats.totalVisits} total visits`} />
                                        <KpiCard icon={Target} label="Sales Target" value={`৳${(stats.target / 1000).toFixed(0)}K`} color="#FF7C3A" />
                                        <KpiCard
                                            icon={TrendingUp}
                                            label="Achievement"
                                            value={`${stats.achievementPct}%`}
                                            color={stats.achievementPct >= 100 ? '#2ECC71' : stats.achievementPct >= 70 ? '#D4A843' : '#E74C5E'}
                                            sub={`৳${(stats.totalSalesAchieved / 1000).toFixed(0)}K achieved`}
                                            trend={stats.achievementPct >= 100 ? 'up' : stats.achievementPct >= 50 ? 'neutral' : 'down'}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <KpiCard icon={CheckCircle2} label="Completed Visits" value={stats.completedVisits} color="#2ECC71" />
                                        <KpiCard icon={Clock} label="Scheduled" value={stats.scheduledVisits} color="#9B6BFF" />
                                        <KpiCard icon={CalendarCheck} label="Days Present" value={stats.presentDays} color="#3A9EFF"
                                            sub={`${stats.attendancePct}% attendance`} trend={stats.attendancePct >= 80 ? 'up' : stats.attendancePct >= 60 ? 'neutral' : 'down'} />
                                        <KpiCard icon={XCircle} label="Days Absent" value={stats.absentDays} color="#E74C5E"
                                            sub={`Out of ${stats.workDays} work days`} />
                                    </div>

                                    {/* Visit Outcome Pie + 6-Month Trend (side by side) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Visit Outcomes Pie */}
                                        <div className="bg-[#061A3A] rounded-xl p-4 border border-white/10">
                                            <h3 className="text-sm font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-[#3A9EFF]" />
                                                Visit Outcomes — {monthLabel}
                                            </h3>
                                            {stats.outcomeData.length === 0 ? (
                                                <div className="flex items-center justify-center h-36 text-[#8B9CB8] text-sm">No visit data</div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height={220}>
                                                    <PieChart>
                                                        <Pie
                                                            data={stats.outcomeData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={55}
                                                            outerRadius={90}
                                                            paddingAngle={3}
                                                            dataKey="value"
                                                        >
                                                            {stats.outcomeData.map((entry, index) => (
                                                                <Cell key={index} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Legend
                                                            iconType="circle"
                                                            iconSize={8}
                                                            formatter={(value) => <span className="text-xs text-[#8B9CB8]">{value}</span>}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>

                                        {/* 6-Month Trend */}
                                        <div className="bg-[#061A3A] rounded-xl p-4 border border-white/10">
                                            <h3 className="text-sm font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-[#2ECC71]" />
                                                6-Month Visit Trend
                                            </h3>
                                            <ResponsiveContainer width="100%" height={220}>
                                                <LineChart data={trendData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis dataKey="month" tick={{ fill: '#8B9CB8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fill: '#8B9CB8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Legend formatter={(v) => <span className="text-xs text-[#8B9CB8]">{v}</span>} />
                                                    <Line type="monotone" dataKey="visits" name="Total Visits" stroke="#3A9EFF" strokeWidth={2} dot={{ fill: '#3A9EFF', r: 4 }} />
                                                    <Line type="monotone" dataKey="completed" name="Completed" stroke="#2ECC71" strokeWidth={2} dot={{ fill: '#2ECC71', r: 4 }} />
                                                    <Line type="monotone" dataKey="shops" name="Shops Added" stroke="#D4A843" strokeWidth={2} dot={{ fill: '#D4A843', r: 4 }} strokeDasharray="5 5" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══ VISITS TAB ══ */}
                            {activeTab === 'visits' && (
                                <div className="space-y-5">
                                    {/* Visit Outcome Bar Chart */}
                                    <div className="bg-[#061A3A] rounded-xl p-4 border border-white/10">
                                        <h3 className="text-sm font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-[#3A9EFF]" /> Visit Status Breakdown — {monthLabel}
                                        </h3>
                                        {stats.outcomeData.length === 0 ? (
                                            <div className="flex items-center justify-center h-36 text-[#8B9CB8] text-sm">No visit data for this month</div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={200}>
                                                <BarChart data={stats.outcomeData} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                                    <XAxis type="number" tick={{ fill: '#8B9CB8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                    <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#8B9CB8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Bar dataKey="value" name="Visits" radius={[0, 6, 6, 0]}>
                                                        {stats.outcomeData.map((entry, index) => (
                                                            <Cell key={index} fill={entry.color} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>

                                    {/* Visit List */}
                                    <div className="bg-[#061A3A] rounded-xl border border-white/10 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-white/10">
                                            <h3 className="text-sm font-semibold text-[#F0F4F8]">Visit Log — {monthLabel}</h3>
                                        </div>
                                        <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                                            {visits.length === 0 ? (
                                                <div className="p-8 text-center text-[#8B9CB8] text-sm">No visits recorded this month</div>
                                            ) : (
                                                visits.map((v: any) => (
                                                    <div key={v.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                                                        <div
                                                            className="w-2 h-2 rounded-full shrink-0"
                                                            style={{ background: OUTCOME_COLORS[v.outcome || v.status] || '#8B9CB8' }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-[#F0F4F8] truncate">{v.purpose || 'Visit'}</p>
                                                            {v.notes && <p className="text-xs text-[#8B9CB8] truncate">{v.notes}</p>}
                                                        </div>
                                                        <span
                                                            className="text-xs px-2 py-0.5 rounded-full shrink-0"
                                                            style={{ background: `${OUTCOME_COLORS[v.outcome || v.status]}20`, color: OUTCOME_COLORS[v.outcome || v.status] || '#8B9CB8' }}
                                                        >
                                                            {OUTCOME_LABELS[v.outcome || v.status] || v.outcome || v.status}
                                                        </span>
                                                        <span className="text-xs text-[#8B9CB8] shrink-0">
                                                            {v.created_at ? format(parseISO(v.created_at), 'MMM d') : '-'}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Shops visited summary */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-[#061A3A] rounded-xl p-4 border border-white/10 text-center">
                                            <p className="text-3xl font-bold text-[#3A9EFF]">{stats.totalVisits}</p>
                                            <p className="text-xs text-[#8B9CB8] mt-1">Total Visits</p>
                                        </div>
                                        <div className="bg-[#061A3A] rounded-xl p-4 border border-white/10 text-center">
                                            <p className="text-3xl font-bold text-[#2ECC71]">{stats.uniqueShopsVisited}</p>
                                            <p className="text-xs text-[#8B9CB8] mt-1">Unique Shops</p>
                                        </div>
                                        <div className="bg-[#061A3A] rounded-xl p-4 border border-white/10 text-center">
                                            <p className="text-3xl font-bold text-[#D4A843]">{stats.completedVisits}</p>
                                            <p className="text-xs text-[#8B9CB8] mt-1">Completed</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══ SALES TAB ══ */}
                            {activeTab === 'sales' && (
                                <div className="space-y-5">
                                    {/* Target vs Achieved */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[#061A3A] rounded-xl p-5 border border-white/10">
                                            <p className="text-xs text-[#8B9CB8] uppercase tracking-wide mb-1">Monthly Target</p>
                                            <p className="text-3xl font-bold text-[#FF7C3A]">৳{stats.target.toLocaleString()}</p>
                                            <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(stats.achievementPct, 100)}%`,
                                                        background: stats.achievementPct >= 100 ? '#2ECC71' : stats.achievementPct >= 70 ? '#D4A843' : '#E74C5E',
                                                    }}
                                                />
                                            </div>
                                            <p className="text-xs text-[#8B9CB8] mt-2">
                                                {stats.achievementPct}% achieved · ৳{stats.totalSalesAchieved.toLocaleString()} sold
                                            </p>
                                        </div>
                                        <div className="bg-[#061A3A] rounded-xl p-5 border border-white/10">
                                            <p className="text-xs text-[#8B9CB8] uppercase tracking-wide mb-1">Achievement</p>
                                            <p
                                                className="text-3xl font-bold"
                                                style={{ color: stats.achievementPct >= 100 ? '#2ECC71' : stats.achievementPct >= 70 ? '#D4A843' : '#E74C5E' }}
                                            >
                                                {stats.achievementPct}%
                                            </p>
                                            <p className="text-sm text-[#8B9CB8] mt-2">৳{stats.totalSalesAchieved.toLocaleString()} of ৳{stats.target.toLocaleString()}</p>
                                            {stats.achievementPct >= 100 && (
                                                <div className="mt-2 flex items-center gap-1 text-[#2ECC71] text-xs">
                                                    <Award className="w-3.5 h-3.5" />
                                                    Target Achieved!
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 6-Month Sales Trend */}
                                    <div className="bg-[#061A3A] rounded-xl p-4 border border-white/10">
                                        <h3 className="text-sm font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-[#2ECC71]" /> 6-Month Performance Trend
                                        </h3>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <BarChart data={trendData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="month" tick={{ fill: '#8B9CB8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: '#8B9CB8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend formatter={(v) => <span className="text-xs text-[#8B9CB8]">{v}</span>} />
                                                <Bar dataKey="visits" name="Visits" fill="#3A9EFF" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="shops" name="Shops Added" fill="#D4A843" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Shops Added Summary */}
                                    <div className="bg-[#061A3A] rounded-xl border border-white/10 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-[#F0F4F8] flex items-center gap-2">
                                                <ShoppingBag className="w-4 h-4 text-[#D4A843]" /> Shops Added This Month
                                            </h3>
                                            <span className="text-xs bg-[#D4A843]/20 text-[#D4A843] px-2 py-0.5 rounded-full">
                                                {stats.shopsThisMonth} new
                                            </span>
                                        </div>
                                        <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                                            {shopsData.filter(s => {
                                                const d = parseISO(s.created_at);
                                                return d >= monthStart && d <= monthEnd;
                                            }).length === 0 ? (
                                                <div className="p-6 text-center text-[#8B9CB8] text-sm">No shops added this month</div>
                                            ) : (
                                                shopsData
                                                    .filter(s => {
                                                        const d = parseISO(s.created_at);
                                                        return d >= monthStart && d <= monthEnd;
                                                    })
                                                    .map((shop: any) => (
                                                        <div key={shop.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5">
                                                            <Store className="w-4 h-4 text-[#8B9CB8] shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm text-[#F0F4F8] truncate">{shop.shop_name || shop.name}</p>
                                                                {shop.area && <p className="text-xs text-[#8B9CB8]">{shop.area}</p>}
                                                            </div>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${shop.is_converted ? 'bg-[#2ECC71]/20 text-[#2ECC71]' : 'bg-white/10 text-[#8B9CB8]'}`}>
                                                                {shop.is_converted ? 'Converted' : 'Prospect'}
                                                            </span>
                                                        </div>
                                                    ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══ ATTENDANCE TAB ══ */}
                            {activeTab === 'attendance' && (
                                <div className="space-y-5">
                                    {/* Attendance Summary Cards */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-[#2ECC71]/10 border border-[#2ECC71]/30 rounded-xl p-4 text-center">
                                            <p className="text-3xl font-bold text-[#2ECC71]">{stats.presentDays}</p>
                                            <p className="text-xs text-[#8B9CB8] mt-1">Days Present</p>
                                        </div>
                                        <div className="bg-[#E74C5E]/10 border border-[#E74C5E]/30 rounded-xl p-4 text-center">
                                            <p className="text-3xl font-bold text-[#E74C5E]">{stats.absentDays}</p>
                                            <p className="text-xs text-[#8B9CB8] mt-1">Days Absent</p>
                                        </div>
                                        <div className="bg-[#3A9EFF]/10 border border-[#3A9EFF]/30 rounded-xl p-4 text-center">
                                            <p className="text-3xl font-bold text-[#3A9EFF]">{stats.attendancePct}%</p>
                                            <p className="text-xs text-[#8B9CB8] mt-1">Attendance Rate</p>
                                        </div>
                                    </div>

                                    {/* Attendance Calendar */}
                                    <div className="bg-[#061A3A] rounded-xl p-5 border border-white/10">
                                        <h3 className="text-sm font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-[#3A9EFF]" /> Attendance Calendar — {monthLabel}
                                        </h3>
                                        <AttendanceCalendar days={stats.dayStatuses} />
                                    </div>

                                    {/* Attendance Progress Bar */}
                                    <div className="bg-[#061A3A] rounded-xl p-4 border border-white/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-[#8B9CB8]">Monthly Attendance</span>
                                            <span className="text-sm font-semibold text-[#F0F4F8]">{stats.presentDays}/{stats.workDays} work days</span>
                                        </div>
                                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{
                                                    width: `${stats.attendancePct}%`,
                                                    background: stats.attendancePct >= 80
                                                        ? 'linear-gradient(90deg, #2ECC71, #27ae60)'
                                                        : stats.attendancePct >= 60
                                                            ? 'linear-gradient(90deg, #D4A843, #f39c12)'
                                                            : 'linear-gradient(90deg, #E74C5E, #c0392b)',
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-[#8B9CB8] mt-2">
                                            {stats.attendancePct >= 80
                                                ? '✅ Excellent attendance'
                                                : stats.attendancePct >= 60
                                                    ? '⚠️ Below target attendance'
                                                    : '🚨 Critical attendance issue'}
                                        </p>
                                    </div>

                                    {/* Daily visit activity for the month */}
                                    <div className="bg-[#061A3A] rounded-xl p-4 border border-white/10">
                                        <h3 className="text-sm font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-[#9B6BFF]" /> Daily Visit Activity
                                        </h3>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <BarChart
                                                data={stats.dayStatuses
                                                    .filter(d => d.status !== 'off_day' && d.status !== 'future')
                                                    .map(d => ({
                                                        day: format(d.date, 'd'),
                                                        visits: d.visitCount,
                                                        fill: d.status === 'present' ? '#2ECC71' : '#E74C5E',
                                                    }))}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="day" tick={{ fill: '#8B9CB8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: '#8B9CB8', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="visits" name="Visits" radius={[4, 4, 0, 0]}>
                                                    {stats.dayStatuses
                                                        .filter(d => d.status !== 'off_day' && d.status !== 'future')
                                                        .map((d, i) => (
                                                            <Cell key={i} fill={d.visitCount > 0 ? '#2ECC71' : '#E74C5E'} opacity={0.8} />
                                                        ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
