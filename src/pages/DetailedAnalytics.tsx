// ============================================================
// AMAN CEMENT CRM — Detailed Analytics Page
// Date-selectable, hierarchy-wise, territory/area analytics
// ============================================================

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { format, isToday, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    useMyAttendance,
    useRepDailyVisits,
    useRepYesterdayVisits,
    useTeamAttendance,
    useTeamVisitsForDate,
    useTeamSalesForDate,
    useTerritoryAreaAnalytics,
} from '@/hooks/useDetailedAnalytics';
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Clock,
    MapPin,
    TrendingUp,
    Users,
    CheckCircle2,
    Target,
    BarChart3,
    Activity,
    Timer,
    ArrowUpRight,
    ArrowDownRight,
    Store,
    Building2,
    Package,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────
function outcomeColor(outcome: string | null | undefined) {
    switch (outcome) {
        case 'interested': return 'text-green-400 bg-green-400/10 border-green-400/30';
        case 'progressive': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
        case 'not_interested': return 'text-red-400 bg-red-400/10 border-red-400/30';
        case 'stagnant': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
        default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
}

function outcomeLabel(o: string | null | undefined) {
    const map: Record<string, string> = {
        interested: 'Interested', progressive: 'Progressive',
        not_interested: 'Not Interested', stagnant: 'Stagnant',
    };
    return (o && map[o]) || 'N/A';
}

function fmt(ts: string | null | undefined) {
    if (!ts) return '—';
    return format(new Date(ts), 'hh:mm a');
}

function calcOutcomeStats(visits: any[]) {
    const total = visits.length;
    const count = (k: string) => visits.filter(v => v.outcome === k).length;
    return {
        interested: count('interested'), progressive: count('progressive'),
        not_interested: count('not_interested'), stagnant: count('stagnant'), total,
    };
}

// ─── Working Date Picker ──────────────────────────────────────
function DatePicker({ date, onChange }: { date: Date; onChange: (d: Date) => void }) {
    const today = new Date();
    today.setHours(23, 59, 59);

    const prev = () => onChange(subDays(date, 1));
    const next = () => {
        const n = new Date(date);
        n.setDate(n.getDate() + 1);
        if (n <= today) onChange(n);
    };

    return (
        <div className="flex items-center gap-2">
            <button onClick={prev} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#8B9CB8] hover:text-white">
                <ChevronLeft className="w-4 h-4" />
            </button>

            <label className="flex items-center gap-2 px-3 py-2 bg-[#0A2A5C] border border-white/10 rounded-lg cursor-pointer hover:border-[#3A9EFF]/50 transition-colors">
                <Calendar className="w-4 h-4 text-[#8B9CB8] flex-shrink-0" />
                <span className="text-[#F0F4F8] font-medium text-sm whitespace-nowrap">
                    {isToday(date) ? 'Today — ' : ''}{format(date, 'dd MMM yyyy')}
                </span>
                <input
                    type="date"
                    value={format(date, 'yyyy-MM-dd')}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    onChange={e => { if (e.target.value) onChange(new Date(e.target.value + 'T00:00:00')); }}
                    className="w-0 h-0 opacity-0 absolute"
                />
            </label>

            <button
                onClick={next}
                disabled={isToday(date)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#8B9CB8] hover:text-white disabled:opacity-30"
            >
                <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday(date) && (
                <button
                    onClick={() => onChange(new Date())}
                    className="px-3 py-1.5 text-xs bg-[#C41E3A]/20 text-[#C41E3A] border border-[#C41E3A]/30 rounded-lg hover:bg-[#C41E3A]/30 transition-colors"
                >
                    Today
                </button>
            )}
        </div>
    );
}

// ─── Stat Box ─────────────────────────────────────────────────
function StatBox({ label, value, sub, color = '#3A9EFF', icon }: {
    label: string; value: React.ReactNode; sub?: string; color?: string; icon?: React.ReactNode;
}) {
    return (
        <div className="bg-[#0A2A5C] rounded-xl border border-white/10 p-4">
            <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                    <span style={{ color }}>{icon}</span>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-[#F0F4F8]">{value}</div>
                    <div className="text-[#8B9CB8] text-xs">{label}</div>
                </div>
            </div>
            {sub && <p className="text-[#8B9CB8] text-xs mt-3">{sub}</p>}
        </div>
    );
}

// ─── Outcome Bar ──────────────────────────────────────────────
function OutcomeBar({ stats }: { stats: ReturnType<typeof calcOutcomeStats> }) {
    const pct = (n: number) => stats.total > 0 ? ((n / stats.total) * 100).toFixed(0) : '0';
    const bars = [
        { key: 'interested', label: 'Interested', color: '#2ECC71', count: stats.interested },
        { key: 'progressive', label: 'Progressive', color: '#3A9EFF', count: stats.progressive },
        { key: 'not_interested', label: 'Not Interested', color: '#E74C5E', count: stats.not_interested },
        { key: 'stagnant', label: 'Stagnant', color: '#D4A843', count: stats.stagnant },
    ];
    return (
        <div className="space-y-3">
            {bars.map(b => (
                <div key={b.key}>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#8B9CB8]">{b.label}</span>
                        <span style={{ color: b.color }} className="font-semibold">{b.count} ({pct(b.count)}%)</span>
                    </div>
                    <Progress value={stats.total > 0 ? (b.count / stats.total) * 100 : 0} className="h-2 bg-[#0F3460]" />
                </div>
            ))}
        </div>
    );
}

// ─── Territory / Area Section (shown for managers only) ───────
function TerritoryAreaSection({ userId }: { userId: string }) {
    const { data, isLoading } = useTerritoryAreaAnalytics(userId);
    const [activeTab, setActiveTab] = useState<'territory' | 'area'>('area');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#C41E3A]" />
            </div>
        );
    }

    const territories = data?.territories || [];
    const areas = data?.areas || [];

    return (
        <div className="space-y-4">
            {/* Tab toggle */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setActiveTab('area')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'area'
                            ? 'bg-[#C41E3A] text-white'
                            : 'bg-[#0A2A5C] text-[#8B9CB8] border border-white/10 hover:text-white'
                        }`}
                >
                    Area View
                </button>
                <button
                    onClick={() => setActiveTab('territory')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'territory'
                            ? 'bg-[#C41E3A] text-white'
                            : 'bg-[#0A2A5C] text-[#8B9CB8] border border-white/10 hover:text-white'
                        }`}
                >
                    Territory View
                </button>
            </div>

            {activeTab === 'area' ? (
                areas.length === 0 ? (
                    <div className="bg-[#0A2A5C] border border-white/10 rounded-xl p-10 text-center text-[#8B9CB8]">
                        No area data found. Ensure customers have territory assignments.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {areas.map(a => (
                            <AreaCard key={a.area} area={a} />
                        ))}
                    </div>
                )
            ) : (
                territories.length === 0 ? (
                    <div className="bg-[#0A2A5C] border border-white/10 rounded-xl p-10 text-center text-[#8B9CB8]">
                        No territory data found.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                        <table className="w-full text-sm">
                            <thead className="bg-[#061A3A]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs text-[#8B9CB8] uppercase">Territory</th>
                                    <th className="px-4 py-3 text-left text-xs text-[#8B9CB8] uppercase">Area</th>
                                    <th className="px-4 py-3 text-center text-xs text-[#3A9EFF] uppercase">Total</th>
                                    <th className="px-4 py-3 text-center text-xs text-[#2ECC71] uppercase">Shops</th>
                                    <th className="px-4 py-3 text-center text-xs text-[#D4A843] uppercase">Projects</th>
                                    <th className="px-4 py-3 text-center text-xs text-[#2ECC71] uppercase">Aman Shops</th>
                                    <th className="px-4 py-3 text-center text-xs text-[#9B6BFF] uppercase">Aman Projects</th>
                                    <th className="px-4 py-3 text-center text-xs text-[#FF7C3A] uppercase">Monthly Vol (t)</th>
                                    <th className="px-4 py-3 text-center text-xs text-[#8B9CB8] uppercase">Cement Req (t)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-[#0A2A5C]">
                                {territories.map(t => (
                                    <tr key={t.territory_id} className="hover:bg-white/5">
                                        <td className="px-4 py-3 text-[#F0F4F8] font-medium">{t.territory_name}</td>
                                        <td className="px-4 py-3 text-[#8B9CB8] text-xs">{t.area}</td>
                                        <td className="px-4 py-3 text-center text-[#3A9EFF] font-bold">{t.total_customers}</td>
                                        <td className="px-4 py-3 text-center text-[#2ECC71]">{t.recurring_shops}</td>
                                        <td className="px-4 py-3 text-center text-[#D4A843]">{t.projects}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-[#2ECC71] font-semibold">{t.recurring_aman}</span>
                                            <span className="text-[#8B9CB8] text-xs ml-1">/ {t.recurring_shops}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-[#9B6BFF] font-semibold">{t.projects_aman}</span>
                                            <span className="text-[#8B9CB8] text-xs ml-1">/ {t.projects}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-[#FF7C3A] font-semibold">
                                            {t.monthly_volume_tons.toFixed(1)}
                                        </td>
                                        <td className="px-4 py-3 text-center text-[#8B9CB8]">
                                            {t.cement_required_tons.toFixed(0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
    );
}

function AreaCard({ area }: { area: ReturnType<typeof useTerritoryAreaAnalytics>['data'] extends { areas: Array<infer A> } ? A : never }) {
    const shopAmanPct = area.recurring_shops > 0
        ? ((area.recurring_aman / area.recurring_shops) * 100).toFixed(0)
        : '0';
    const projAmanPct = area.projects > 0
        ? ((area.projects_aman / area.projects) * 100).toFixed(0)
        : '0';

    return (
        <Card className="bg-[#0A2A5C] border-white/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-[#F0F4F8] flex items-center justify-between">
                    <span>{area.area}</span>
                    <Badge className="bg-[#3A9EFF]/20 text-[#3A9EFF] border-[#3A9EFF]/30 text-xs">
                        {area.total_customers} customers
                    </Badge>
                </CardTitle>
                <p className="text-[#8B9CB8] text-xs">{area.territories.join(' · ')}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Shops */}
                <div className="bg-[#0F3460] rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Store className="w-4 h-4 text-[#2ECC71]" />
                        <span className="text-[#F0F4F8] font-medium text-sm">Recurring Shops</span>
                        <span className="ml-auto text-[#2ECC71] font-bold">{area.recurring_shops}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-[#8B9CB8]">Aman Cement</span>
                        <span className="text-[#2ECC71]">{area.recurring_aman} ({shopAmanPct}%)</span>
                    </div>
                    <Progress value={area.recurring_shops > 0 ? (area.recurring_aman / area.recurring_shops) * 100 : 0} className="h-1.5 bg-[#0A2A5C]" />
                    <div className="flex justify-between text-xs">
                        <span className="text-[#8B9CB8]">Others</span>
                        <span className="text-[#8B9CB8]">{area.recurring_shops - area.recurring_aman}</span>
                    </div>
                    <div className="pt-1 border-t border-white/10 flex justify-between text-xs">
                        <span className="text-[#8B9CB8]">Total Monthly Volume</span>
                        <span className="text-[#FF7C3A] font-semibold">{area.monthly_volume_tons.toFixed(1)} tons</span>
                    </div>
                </div>

                {/* Projects */}
                <div className="bg-[#0F3460] rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-[#D4A843]" />
                        <span className="text-[#F0F4F8] font-medium text-sm">Projects</span>
                        <span className="ml-auto text-[#D4A843] font-bold">{area.projects}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-[#8B9CB8]">Using Aman Cement</span>
                        <span className="text-[#9B6BFF]">{area.projects_aman} ({projAmanPct}%)</span>
                    </div>
                    <Progress value={area.projects > 0 ? (area.projects_aman / area.projects) * 100 : 0} className="h-1.5 bg-[#0A2A5C]" />
                    <div className="pt-1 border-t border-white/10 flex justify-between text-xs">
                        <span className="text-[#8B9CB8]">Total Cement Required</span>
                        <span className="text-[#D4A843] font-semibold">{area.cement_required_tons.toFixed(0)} tons</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Sales Rep View ───────────────────────────────────────────
function RepAnalyticsView({ userId, date }: { userId: string; date: Date }) {
    const { data: attendance } = useMyAttendance(userId, date);
    const { data: todayVisits = [] } = useRepDailyVisits(userId, date);
    const { data: ystVisits = [] } = useRepYesterdayVisits(userId, date);

    const stats = calcOutcomeStats(todayVisits as any[]);
    const ystStats = calcOutcomeStats(ystVisits as any[]);
    const diff = stats.total - ystStats.total;
    const intPct = stats.total > 0 ? ((stats.interested / stats.total) * 100).toFixed(1) : '0';

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatBox label="Check In" value={fmt(attendance?.check_in_at)} icon={<Clock className="w-5 h-5" />} color="#2ECC71" sub={isToday(date) && !attendance ? 'Not checked in yet' : undefined} />
                <StatBox label="Check Out" value={fmt(attendance?.check_out_at)} icon={<Clock className="w-5 h-5" />} color="#FF7C3A" sub="Based on last visit" />
                <StatBox label="Hours in Market" value={attendance?.total_hours ? `${attendance.total_hours}h` : '—'} icon={<Timer className="w-5 h-5" />} color="#9B6BFF" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="Today's Visits" value={stats.total} icon={<MapPin className="w-5 h-5" />} color="#3A9EFF" />
                <StatBox label="Yesterday's Visits" value={ystStats.total} icon={<MapPin className="w-5 h-5" />} color="#8B9CB8" />
                <StatBox
                    label="Day-on-Day"
                    value={<span className={diff >= 0 ? 'text-green-400' : 'text-red-400'}>{diff >= 0 ? '+' : ''}{diff}</span>}
                    icon={diff >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    color={diff >= 0 ? '#2ECC71' : '#E74C5E'}
                />
                <StatBox label="Interested Rate" value={`${intPct}%`} icon={<TrendingUp className="w-5 h-5" />} color="#D4A843" sub="Positive visit rate" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-[#0A2A5C] border-white/10">
                    <CardHeader>
                        <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-[#C41E3A]" /> Visit Outcome Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.total === 0
                            ? <p className="text-[#8B9CB8] text-center py-6">No visits on {format(date, 'dd MMM yyyy')}</p>
                            : <OutcomeBar stats={stats} />}
                    </CardContent>
                </Card>

                <Card className="bg-[#0A2A5C] border-white/10">
                    <CardHeader>
                        <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
                            <Activity className="w-5 h-5 text-[#3A9EFF]" /> Visit Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(todayVisits as any[]).length === 0
                            ? <p className="text-[#8B9CB8] text-center py-6">No visits recorded</p>
                            : (
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                    {(todayVisits as any[]).map((v, i) => (
                                        <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#0F3460]">
                                            <span className="text-xs text-[#8B9CB8] w-6 text-center font-mono">{i + 1}</span>
                                            <div className="flex-1">
                                                <p className="text-[#F0F4F8] text-sm font-medium">{(v.customers as any)?.name || 'Unknown'}</p>
                                                <p className="text-[#8B9CB8] text-xs">{fmt(v.checked_in_at)}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded border ${outcomeColor(v.outcome)}`}>
                                                {outcomeLabel(v.outcome)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ─── Manager / Hierarchy View ─────────────────────────────────
function ManagerAnalyticsView({ managerId, date }: { managerId: string; date: Date }) {
    const { data: teamAtt = [], isLoading } = useTeamAttendance(managerId, date);
    const { data: teamVisits = [] } = useTeamVisitsForDate(managerId, date);
    const { data: teamSales = [] } = useTeamSalesForDate(managerId, date);

    const presentCount = teamAtt.filter(r => r.status === 'present').length;
    const totalSales = (teamSales as any[]).reduce((s, r) => s + (r.order_value || 0), 0);
    const visitStats = calcOutcomeStats(teamVisits as any[]);

    const repBreakdown = useMemo(() =>
        teamAtt.map(m => {
            const mv = (teamVisits as any[]).filter(v => v.sales_rep_id === m.user_id);
            const ms = (teamSales as any[]).filter(s => s.converted_by === m.user_id);
            return { ...m, visitCount: mv.length, salesValue: ms.reduce((s, r) => s + (r.order_value || 0), 0), outcomeStats: calcOutcomeStats(mv) };
        }), [teamAtt, teamVisits, teamSales]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="Present Today" value={`${presentCount}/${teamAtt.length}`} icon={<Users className="w-5 h-5" />} color="#2ECC71" />
                <StatBox label="Total Visits" value={teamVisits.length} icon={<MapPin className="w-5 h-5" />} color="#3A9EFF" />
                <StatBox label="Interested" value={visitStats.interested} icon={<TrendingUp className="w-5 h-5" />} color="#D4A843"
                    sub={`${visitStats.total > 0 ? ((visitStats.interested / visitStats.total) * 100).toFixed(0) : 0}% of visits`} />
                <StatBox label="Total Sales" value={`৳${totalSales.toLocaleString()}`} icon={<Target className="w-5 h-5" />} color="#9B6BFF" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-[#0A2A5C] border-white/10">
                    <CardHeader>
                        <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-[#C41E3A]" /> Team Visit Outcomes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {visitStats.total === 0
                            ? <p className="text-[#8B9CB8] text-center py-6">No visits on {format(date, 'dd MMM yyyy')}</p>
                            : <OutcomeBar stats={visitStats} />}
                    </CardContent>
                </Card>

                <Card className="bg-[#0A2A5C] border-white/10">
                    <CardHeader>
                        <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-[#2ECC71]" /> Attendance Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-[#8B9CB8]">Attendance Rate</span>
                                <span className="text-[#2ECC71] font-semibold">
                                    {teamAtt.length > 0 ? ((presentCount / teamAtt.length) * 100).toFixed(0) : 0}%
                                </span>
                            </div>
                            <Progress value={teamAtt.length > 0 ? (presentCount / teamAtt.length) * 100 : 0} className="h-2 bg-[#0F3460]" />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#2ECC71]" /><span className="text-xs text-[#8B9CB8]">Present: {presentCount}</span></div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#E74C5E]" /><span className="text-xs text-[#8B9CB8]">Absent: {teamAtt.length - presentCount}</span></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Per-Rep Table */}
            <Card className="bg-[#0A2A5C] border-white/10">
                <CardHeader>
                    <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#3A9EFF]" /> Individual Performance — {format(date, 'dd MMM yyyy')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41E3A]" /></div>
                    ) : repBreakdown.length === 0 ? (
                        <p className="text-[#8B9CB8] text-center py-10">No team members found</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-[#061A3A]">
                                    <tr>
                                        {['Name', 'Role', 'Check In', 'Check Out', 'Hours', 'Visits', 'Interested', 'Sales', 'Status'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs text-[#8B9CB8] uppercase font-medium">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {repBreakdown.map(m => (
                                        <tr key={m.user_id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-[#143874] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                                        {m.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[#F0F4F8] font-medium">{m.full_name}</p>
                                                        <p className="text-[#8B9CB8] text-xs">{m.employee_code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-white/10 text-[#8B9CB8]">{m.role?.replace(/_/g, ' ')}</span></td>
                                            <td className="px-4 py-3 text-center text-[#F0F4F8] font-mono text-xs">{fmt(m.check_in_at)}</td>
                                            <td className="px-4 py-3 text-center text-[#F0F4F8] font-mono text-xs">{fmt(m.check_out_at)}</td>
                                            <td className="px-4 py-3 text-center text-[#9B6BFF] font-semibold">{m.total_hours ? `${m.total_hours}h` : '—'}</td>
                                            <td className="px-4 py-3 text-center text-[#3A9EFF] font-semibold">{m.visitCount}</td>
                                            <td className="px-4 py-3 text-center text-[#2ECC71] font-semibold">
                                                {m.outcomeStats.interested}
                                                <span className="text-xs text-[#8B9CB8] ml-1">({m.outcomeStats.total > 0 ? ((m.outcomeStats.interested / m.outcomeStats.total) * 100).toFixed(0) : 0}%)</span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-[#D4A843] font-semibold">৳{m.salesValue.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center">
                                                {m.status === 'present'
                                                    ? <Badge className="bg-[#2ECC71]/20 text-[#2ECC71] border-[#2ECC71]/30 text-xs">Present</Badge>
                                                    : <Badge className="bg-[#E74C5E]/20 text-[#E74C5E] border-[#E74C5E]/30 text-xs">Absent</Badge>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────
export function DetailedAnalytics() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeSection, setActiveSection] = useState<'activity' | 'territory'>('activity');

    const isManager = user?.role !== 'sales_rep';
    const showTerritory = ['supervisor', 'area_manager', 'regional_manager', 'division_head', 'country_head'].includes(user?.role || '');

    const roleBadgeColor: Record<string, string> = {
        sales_rep: 'bg-[#3A9EFF]/20 text-[#3A9EFF]',
        supervisor: 'bg-[#2ECC71]/20 text-[#2ECC71]',
        area_manager: 'bg-[#D4A843]/20 text-[#D4A843]',
        regional_manager: 'bg-[#9B6BFF]/20 text-[#9B6BFF]',
        division_head: 'bg-[#FF7C3A]/20 text-[#FF7C3A]',
        country_head: 'bg-[#C41E3A]/20 text-[#C41E3A]',
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#8B9CB8] hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-[#F0F4F8]">Detailed Analytics</h1>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor[user?.role || ''] || ''}`}>
                                {user?.role?.replace(/_/g, ' ').toUpperCase()}
                            </span>
                        </div>
                        <p className="text-[#8B9CB8] text-sm mt-0.5">
                            {isManager ? 'Hierarchy-wise team performance and attendance' : 'Your daily activity and visit outcomes'}
                        </p>
                    </div>
                </div>
                <DatePicker date={selectedDate} onChange={setSelectedDate} />
            </div>

            {/* Section tabs (managers only) */}
            {showTerritory && (
                <div className="flex items-center gap-2 border-b border-white/10 pb-1">
                    <button
                        onClick={() => setActiveSection('activity')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeSection === 'activity' ? 'text-white border-b-2 border-[#C41E3A]' : 'text-[#8B9CB8] hover:text-white'
                            }`}
                    >
                        <Activity className="w-4 h-4 inline mr-2" />
                        Daily Activity
                    </button>
                    <button
                        onClick={() => setActiveSection('territory')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeSection === 'territory' ? 'text-white border-b-2 border-[#C41E3A]' : 'text-[#8B9CB8] hover:text-white'
                            }`}
                    >
                        <Package className="w-4 h-4 inline mr-2" />
                        Territory & Area
                    </button>
                </div>
            )}

            {/* Content */}
            {activeSection === 'territory' && showTerritory && user?.id ? (
                <TerritoryAreaSection userId={user.id} />
            ) : !isManager && user?.id ? (
                <RepAnalyticsView userId={user.id} date={selectedDate} />
            ) : user?.id ? (
                <ManagerAnalyticsView managerId={user.id} date={selectedDate} />
            ) : null}
        </div>
    );
}
