// ============================================================
// AMAN CEMENT CRM — Analytics Page
// Comprehensive analytics and reporting dashboard
// ============================================================

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Map,
  Users,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Building2,
  CheckCircle2,
  Clock,
  Navigation
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Date range options
const dateRanges = [
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' },
];

// Chart colors
const COLORS = {
  primary: '#C41E3A',
  secondary: '#3A9EFF',
  success: '#2ECC71',
  warning: '#D4A843',
  info: '#9B6BFF',
  teal: '#2DD4BF',
  orange: '#FF7C3A',
};

const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.info, COLORS.teal];

export function Analytics() {
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState('30days');
  const [territoryFilter, setTerritoryFilter] = useState<string>('all');
  const [repFilter, setRepFilter] = useState<string>('all');

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case '7days':
        return { startDate: subDays(now, 7), endDate: now };
      case '30days':
        return { startDate: subDays(now, 30), endDate: now };
      case 'thisMonth':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(now), 1);
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
      default:
        return { startDate: subDays(now, 30), endDate: now };
    }
  }, [dateRange]);

  // Fetch territories
  const { data: territories = [] } = useQuery({
    queryKey: ['territories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('territories').select('*').eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-for-analytics'],
    queryFn: async () => {
      let query = supabase.from('profiles').select('*').eq('is_active', true);

      if (user?.role === 'supervisor') {
        query = query.eq('reports_to', user.id);
      } else if (user?.role === 'area_manager') {
        query = query.eq('area', user.area);
      } else if (user?.role === 'regional_manager') {
        query = query.eq('region', user.region);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch visits data
  const { data: visitsData = [] } = useQuery({
    queryKey: ['analytics-visits', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('visits')
        .select(`
          *,
          customers:customer_id (territory_id, pipeline)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (user?.role === 'sales_rep') {
        query = query.eq('sales_rep_id', user.id);
      } else if (repFilter !== 'all') {
        query = query.eq('sales_rep_id', repFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch customers data
  const { data: customersData = [] } = useQuery({
    queryKey: ['analytics-customers', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (territoryFilter !== 'all') {
        query = query.eq('territory_id', territoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch conversions data
  const { data: conversionsData = [] } = useQuery({
    queryKey: ['analytics-conversions', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('conversions')
        .select(`
          *,
          customers:customer_id (territory_id)
        `)
        .gte('converted_at', startDate.toISOString())
        .lte('converted_at', endDate.toISOString());

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalVisits = visitsData.length;
    const completedVisits = visitsData.filter((v: any) => v.status === 'completed').length;
    const completionRate = totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0;

    const totalCustomers = customersData.length;
    const recurringCustomers = customersData.filter((c: any) => c.pipeline === 'recurring').length;
    const projectCustomers = customersData.filter((c: any) => c.pipeline === 'one_time').length;

    const totalConversions = conversionsData.length;
    // Fix: Use total_value/quantity_bags (new columns) with fallback to order_value/order_volume (legacy)
    const totalOrderValue = conversionsData.reduce((sum: number, c: any) => sum + (c.total_value || c.order_value || 0), 0);
    const totalVolume = conversionsData.reduce((sum: number, c: any) => sum + (c.quantity_bags || c.order_volume || 0), 0);

    // Calculate conversion rate
    const uniqueVisitedCustomers = new Set(visitsData.map((v: any) => v.customer_id)).size;
    const conversionRate = uniqueVisitedCustomers > 0 ? (totalConversions / uniqueVisitedCustomers) * 100 : 0;

    return {
      totalVisits,
      completedVisits,
      completionRate,
      totalCustomers,
      recurringCustomers,
      projectCustomers,
      totalConversions,
      totalOrderValue,
      totalVolume,
      conversionRate,
    };
  }, [visitsData, customersData, conversionsData]);

  // Daily visits chart data
  const dailyVisitsData = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayVisits = visitsData.filter((v: any) =>
        format(parseISO(v.created_at), 'yyyy-MM-dd') === dayStr
      );
      return {
        date: format(day, 'MMM d'),
        visits: dayVisits.length,
        completed: dayVisits.filter((v: any) => v.status === 'completed').length,
      };
    });
  }, [visitsData, startDate, endDate]);

  // Pipeline distribution
  const pipelineData = useMemo(() => [
    { name: 'Recurring', value: metrics.recurringCustomers, color: COLORS.secondary },
    { name: 'Projects', value: metrics.projectCustomers, color: COLORS.primary },
  ], [metrics]);

  // Territory performance
  const territoryData = useMemo(() => {
    const territoryStats: Record<string, { name: string; visits: number; conversions: number; customers: number }> = {};

    territories.forEach((t: any) => {
      territoryStats[t.id] = { name: t.name, visits: 0, conversions: 0, customers: 0 };
    });

    visitsData.forEach((v: any) => {
      const territoryId = v.customers?.territory_id;
      if (territoryId && territoryStats[territoryId]) {
        territoryStats[territoryId].visits++;
      }
    });

    conversionsData.forEach((c: any) => {
      const territoryId = c.customers?.territory_id;
      if (territoryId && territoryStats[territoryId]) {
        territoryStats[territoryId].conversions++;
      }
    });

    customersData.forEach((c: any) => {
      if (territoryStats[c.territory_id]) {
        territoryStats[c.territory_id].customers++;
      }
    });

    return Object.values(territoryStats).slice(0, 6);
  }, [territories, visitsData, conversionsData, customersData]);

  // Visit outcomes
  const outcomeData = useMemo(() => {
    const outcomes: Record<string, number> = {};
    visitsData.forEach((v: any) => {
      if (v.outcome) {
        outcomes[v.outcome] = (outcomes[v.outcome] || 0) + 1;
      }
    });

    return [
      { name: 'Interested', value: outcomes['interested'] || 0, color: COLORS.success },
      { name: 'Progressive', value: outcomes['progressive'] || 0, color: COLORS.warning },
      { name: 'New', value: outcomes['new'] || 0, color: COLORS.secondary },
      { name: 'Not Interested', value: outcomes['not_interested'] || 0, color: COLORS.primary },
      { name: 'Stagnant', value: outcomes['stagnant'] || 0, color: COLORS.info },
    ].filter(d => d.value > 0);
  }, [visitsData]);

  // Top performers
  const topPerformers = useMemo(() => {
    const performerStats: Record<string, { name: string; visits: number; conversions: number; value: number }> = {};

    teamMembers.forEach((m: any) => {
      performerStats[m.id] = { name: m.full_name, visits: 0, conversions: 0, value: 0 };
    });

    visitsData.forEach((v: any) => {
      if (performerStats[v.sales_rep_id]) {
        performerStats[v.sales_rep_id].visits++;
      }
    });

    conversionsData.forEach((c: any) => {
      if (performerStats[c.converted_by]) {
        performerStats[c.converted_by].conversions++;
        // Fix: Use total_value first, fallback to order_value
        performerStats[c.converted_by].value += c.total_value || c.order_value || 0;
      }
    });

    return Object.values(performerStats)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [teamMembers, visitsData, conversionsData]);

  const exportData = () => {
    const csvContent = [
      ['Date', 'Visits', 'Completed', 'New Customers', 'Conversions'].join(','),
      ...dailyVisitsData.map(d => [d.date, d.visits, d.completed, 0, 0].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F0F4F8]">Analytics & Reports</h1>
          <p className="text-[#8B9CB8] text-sm mt-1">Comprehensive insights into your sales performance</p>
        </div>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F3460] hover:bg-[#143874] text-[#F0F4F8] rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-[#0A2A5C] p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#8B9CB8]" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
          >
            {dateRanges.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-[#8B9CB8]" />
          <select
            value={territoryFilter}
            onChange={(e) => setTerritoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
          >
            <option value="all">All Territories</option>
            {territories.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#8B9CB8]" />
          <select
            value={repFilter}
            onChange={(e) => setRepFilter(e.target.value)}
            className="px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
          >
            <option value="all">All Reps</option>
            {teamMembers.map((m: any) => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#0A2A5C] rounded-xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#8B9CB8] text-sm">Total Visits</span>
            <div className="w-8 h-8 bg-[#3A9EFF]/20 rounded-lg flex items-center justify-center">
              <Navigation className="w-4 h-4 text-[#3A9EFF]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#F0F4F8]">{metrics.totalVisits}</p>
          <div className="flex items-center gap-1 mt-2 text-[#2ECC71] text-sm">
            <ArrowUpRight className="w-4 h-4" />
            <span>{metrics.completionRate.toFixed(1)}% completed</span>
          </div>
        </div>

        <div className="bg-[#0A2A5C] rounded-xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#8B9CB8] text-sm">New Customers</span>
            <div className="w-8 h-8 bg-[#2ECC71]/20 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-[#2ECC71]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#F0F4F8]">{metrics.totalCustomers}</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-[#8B9CB8]">{metrics.recurringCustomers} recurring</span>
            <span className="text-[#8B9CB8]">{metrics.projectCustomers} projects</span>
          </div>
        </div>

        <div className="bg-[#0A2A5C] rounded-xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#8B9CB8] text-sm">Conversions</span>
            <div className="w-8 h-8 bg-[#C41E3A]/20 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-[#C41E3A]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#F0F4F8]">{metrics.totalConversions}</p>
          <div className="flex items-center gap-1 mt-2 text-[#2ECC71] text-sm">
            <ArrowUpRight className="w-4 h-4" />
            <span>{metrics.conversionRate.toFixed(1)}% conversion rate</span>
          </div>
        </div>

        <div className="bg-[#0A2A5C] rounded-xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#8B9CB8] text-sm">Order Value</span>
            <div className="w-8 h-8 bg-[#D4A843]/20 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-[#D4A843]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#F0F4F8]">৳{(metrics.totalOrderValue / 1000000).toFixed(2)}M</p>
          <div className="flex items-center gap-1 mt-2 text-[#8B9CB8] text-sm">
            <span>{metrics.totalVolume.toFixed(1)} tons volume</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Daily Visits Chart */}
        <div className="bg-[#0A2A5C] rounded-xl p-5 border border-white/10">
          <h3 className="text-lg font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#3A9EFF]" />
            Daily Visit Activity
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dailyVisitsData}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#8B9CB8" fontSize={12} />
              <YAxis stroke="#8B9CB8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F3460', border: '1px solid #ffffff20', borderRadius: '8px' }}
                labelStyle={{ color: '#F0F4F8' }}
              />
              <Legend />
              <Area type="monotone" dataKey="visits" stroke={COLORS.secondary} fillOpacity={1} fill="url(#colorVisits)" name="Total Visits" />
              <Area type="monotone" dataKey="completed" stroke={COLORS.success} fill="transparent" name="Completed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Distribution */}
        <div className="bg-[#0A2A5C] rounded-xl p-5 border border-white/10">
          <h3 className="text-lg font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#C41E3A]" />
            Customer Pipeline Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RePieChart>
              <Pie
                data={pipelineData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {pipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0F3460', border: '1px solid #ffffff20', borderRadius: '8px' }}
              />
              <Legend />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Territory Performance */}
        <div className="bg-[#0A2A5C] rounded-xl p-5 border border-white/10">
          <h3 className="text-lg font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
            <Map className="w-5 h-5 text-[#2ECC71]" />
            Territory Performance
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={territoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#8B9CB8" fontSize={11} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#8B9CB8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F3460', border: '1px solid #ffffff20', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="visits" fill={COLORS.secondary} name="Visits" radius={[4, 4, 0, 0]} />
              <Bar dataKey="conversions" fill={COLORS.success} name="Conversions" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Visit Outcomes */}
        <div className="bg-[#0A2A5C] rounded-xl p-5 border border-white/10">
          <h3 className="text-lg font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#D4A843]" />
            Visit Outcomes
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={outcomeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" stroke="#8B9CB8" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#8B9CB8" fontSize={12} width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F3460', border: '1px solid #ffffff20', borderRadius: '8px' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {outcomeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-[#0A2A5C] rounded-xl p-5 border border-white/10">
        <h3 className="text-lg font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#9B6BFF]" />
          Top Performers
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#061A3A]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Visits</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Conversions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Order Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topPerformers.map((performer, index) => (
                <tr key={index} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-[#D4A843] text-white' :
                      index === 1 ? 'bg-[#8B9CB8] text-white' :
                        index === 2 ? 'bg-[#4A5B7A] text-white' :
                          'bg-[#0F3460] text-[#8B9CB8]'
                      }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#F0F4F8]">{performer.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[#F0F4F8]">{performer.visits}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[#2ECC71]">{performer.conversions}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[#D4A843] font-medium">
                      ৳{(performer.value / 1000).toFixed(1)}K
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
