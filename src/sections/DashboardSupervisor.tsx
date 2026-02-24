// ============================================================
// AMAN CEMENT CRM — Supervisor Dashboard
// ============================================================

import { useAuthStore } from '@/store/authStore';
import { useTeam } from '@/hooks/useTeam';
import { useConversions } from '@/hooks/useConversions';
import { useTodayVisits } from '@/hooks/useVisits';
import { useCustomers } from '@/hooks/useCustomers';
import { useUserTerritories } from '@/hooks/useTerritories';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useMemo } from 'react';
import { TERRITORY_COLORS } from '@/lib/constants';
import {
  Users,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  BarChart3,
  UserCheck,
  Store,
  Building2,
} from 'lucide-react';

export function DashboardSupervisor() {
  const { user } = useAuthStore();
  const { data: teamMembers = [] } = useTeam();
  const navigate = useNavigate();

  // Fetch shop counts for each team member (total recurring shops + projects)
  const { data: teamShopCounts = {} } = useQuery({
    queryKey: ['team-shop-counts', teamMembers.map(m => m.id).join(',')],
    queryFn: async () => {
      if (!teamMembers.length) return {};
      const ids = teamMembers.map(m => m.id);
      const { data, error } = await supabase
        .from('customers')
        .select('created_by, pipeline')
        .in('created_by', ids)
        .eq('status', 'active');
      if (error) throw error;
      const map: Record<string, { shops: number; projects: number }> = {};
      for (const c of (data || [])) {
        if (!map[c.created_by]) map[c.created_by] = { shops: 0, projects: 0 };
        if (c.pipeline === 'recurring') map[c.created_by].shops++;
        else map[c.created_by].projects++;
      }
      return map;
    },
    enabled: teamMembers.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  // Calculate supervised territories from team + self
  const uniqueTerritoryIds = useMemo(() => {
    const ids = new Set<string>();
    teamMembers.forEach(m => m.territory_ids?.forEach(id => ids.add(id)));
    if (user?.territory_ids) user.territory_ids.forEach(id => ids.add(id));
    return Array.from(ids);
  }, [teamMembers, user]);

  const { data: territories = [], isLoading: territoriesLoading } = useUserTerritories(
    user?.id,
    user?.role,
    uniqueTerritoryIds
  );

  const { data: customers, isLoading: customersLoading } = useCustomers({ status: 'active' });

  // Fetch real team activity
  const { data: todayVisits = [] } = useTodayVisits(undefined, true);

  // Fetch today's conversions for team
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: todayConversions = [] } = useConversions({
    includeTeam: true,
    dateFrom: todayStr
  });

  const totalTerritories = territories.length;

  // Calculate real team performance
  const teamPerformance = teamMembers.map(member => {
    const memberVisits = todayVisits.filter(v => v.sales_rep_id === member.id).length;
    const memberConversions = todayConversions.filter(c => c.converted_by === member.id).length;
    const memberSalesValue = todayConversions
      .filter(c => c.converted_by === member.id)
      .reduce((sum, c) => sum + (c.order_value || 0), 0);

    // Estimate daily target from monthly (assuming 26 working days)
    const dailyTarget = Math.round((member.target_monthly || 0) / 26) || 1;

    return {
      id: member.id,
      name: member.full_name,
      visits: memberVisits,
      conversions: memberConversions,
      salesValue: memberSalesValue,
      target: dailyTarget
    };
  });

  // Coverage gaps (territories with no visits today)
  // Real implementation: Finding territories not visited today
  const visitedTerritoryIds = new Set(todayVisits.map(v => v.customer?.territory_id).filter(Boolean));
  const coverageGaps = territories
    .filter(t => !visitedTerritoryIds.has(t.id))
    .slice(0, 3)
    .map(t => ({
      ...t,
      // We only know they weren't visited today, so display a generic message or "Today"
      daysSinceLastVisit: "Today",
    }));

  // High potential non-converters
  const highPotentialCustomers = customers?.filter(
    c => c.last_outcome === 'interested'
  ).slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#F0F4F8]">
            Team Dashboard
          </h2>
          <p className="text-[#8B9CB8] mt-1">
            Monitor your team's performance and activities
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-[#3A9EFF] text-[#3A9EFF]"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Team Details
          </Button>
          <Button className="bg-[#C41E3A] hover:bg-[#9B1830]" onClick={() => navigate('/detailed-analytics')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Team Members"
          value={teamMembers.length}
          subtext="Active sales reps"
          color="#3A9EFF"
        />
        <StatCard
          icon={<MapPin className="w-5 h-5" />}
          label="Territories"
          value={totalTerritories}
          subtext="Under your supervision"
          color="#2ECC71"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Today's Visits"
          value={todayVisits.length}
          subtext="Across all team members"
          color="#D4A843"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Conversions"
          value={todayConversions.length}
          subtext="Today's successful conversions"
          color="#9B6BFF"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance - full hierarchy */}
        <Card className="bg-[#0A2A5C] border-white/10 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#3A9EFF]" />
                Full Team ({teamMembers.length})
              </CardTitle>
              <span className="text-xs text-[#8B9CB8]">All levels — direct reports &amp; their teams</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {teamPerformance.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-[#061A3A]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-[#8B9CB8] uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs text-[#8B9CB8] uppercase">Role</th>
                      <th className="px-4 py-3 text-center text-xs text-[#2ECC71] uppercase">Shops</th>
                      <th className="px-4 py-3 text-center text-xs text-[#D4A843] uppercase">Projects</th>
                      <th className="px-4 py-3 text-center text-xs text-[#3A9EFF] uppercase">Visits Today</th>
                      <th className="px-4 py-3 text-center text-xs text-[#9B6BFF] uppercase">Conversions</th>
                      <th className="px-4 py-3 text-center text-xs text-[#FF7C3A] uppercase">Sales ৳</th>
                      <th className="px-4 py-3 text-right text-xs text-[#8B9CB8] uppercase">Target %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {teamPerformance.map((member) => {
                      const progress = Math.min(
                        member.target > 0 ? (member.salesValue / member.target) * 100 : 0, 100
                      );
                      const shopData = (teamShopCounts as any)[member.id];
                      const roleName = (teamMembers.find(m => m.id === member.id) as any)?.role || '';
                      const roleColors: Record<string, string> = {
                        sales_rep: 'text-[#3A9EFF] bg-[#3A9EFF]/10',
                        supervisor: 'text-[#2ECC71] bg-[#2ECC71]/10',
                        area_manager: 'text-[#D4A843] bg-[#D4A843]/10',
                        regional_manager: 'text-[#9B6BFF] bg-[#9B6BFF]/10',
                        division_head: 'text-[#FF7C3A] bg-[#FF7C3A]/10',
                      };
                      const roleColor = roleColors[roleName] || 'text-[#8B9CB8] bg-white/10';
                      return (
                        <tr key={member.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#143874] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {member.name?.charAt(0) || 'U'}
                              </div>
                              <span className="text-[#F0F4F8] font-medium">{member.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded ${roleColor}`}>
                              {roleName.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-[#2ECC71] font-semibold">{shopData?.shops ?? '—'}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-[#D4A843] font-semibold">{shopData?.projects ?? '—'}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-[#3A9EFF] font-semibold">{member.visits}</td>
                          <td className="px-4 py-3 text-center text-[#9B6BFF] font-semibold">{member.conversions}</td>
                          <td className="px-4 py-3 text-center text-[#FF7C3A] font-semibold">৳{member.salesValue.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`font-semibold ${progress >= 80 ? 'text-[#2ECC71]' : progress >= 50 ? 'text-[#D4A843]' : 'text-[#E74C5E]'}`}>
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10 text-[#8B9CB8]">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No team members found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Coverage Gaps */}
        <Card className="bg-[#0A2A5C] border-white/10">
          <CardHeader>
            <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#FF7C3A]" />
              Coverage Gaps (Not Visited Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {territoriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41E3A]" />
              </div>
            ) : coverageGaps.length ? (
              <div className="space-y-3">
                {coverageGaps.map((territory) => {
                  const fillColor = territory.color || '#8B9CB8';
                  return (
                    <div
                      key={territory.id}
                      className="flex items-center gap-4 p-3 bg-[#FF7C3A]/10 border border-[#FF7C3A]/30 rounded-lg"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: `${fillColor}30` }}
                      >
                        <MapPin className="w-5 h-5" style={{ color: fillColor }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[#F0F4F8] font-medium">{territory.name}</p>
                        <p className="text-[#FF7C3A] text-sm">
                          No visits logged today
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-[#C41E3A] hover:bg-[#9B1830]"
                      >
                        Assign
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-[#8B9CB8]">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>All territories visited today!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* High Potential Non-Converters */}
      <Card className="bg-[#0A2A5C] border-white/10">
        <CardHeader>
          <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#2ECC71]" />
            High Potential Non-Converters
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41E3A]" />
            </div>
          ) : highPotentialCustomers.length ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {highPotentialCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 bg-[#0F3460] rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[#F0F4F8] font-medium">{customer.name}</p>
                      <p className="text-[#8B9CB8] text-sm">{customer.area}</p>
                    </div>
                    <div className="w-8 h-8 bg-[#2ECC71]/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-[#2ECC71]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs bg-[#2ECC71]/20 text-[#2ECC71] px-2 py-0.5 rounded">
                      Interested
                    </span>
                    <span className="text-xs text-[#8B9CB8]">
                      Needs follow-up
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#8B9CB8]">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No high potential customers pending</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext: string;
  color: string;
}

function StatCard({ icon, label, value, subtext, color }: StatCardProps) {
  return (
    <Card className="bg-[#0A2A5C] border-white/10">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${color}20` }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#F0F4F8]">{value}</p>
            <p className="text-[#8B9CB8] text-xs">{label}</p>
          </div>
        </div>
        <p className="text-[#8B9CB8] text-xs mt-3">{subtext}</p>
      </CardContent>
    </Card>
  );
}
