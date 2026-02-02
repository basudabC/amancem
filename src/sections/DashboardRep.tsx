// ============================================================
// AMAN CEMENT CRM — Sales Rep Dashboard
// ============================================================

import { useAuthStore } from '@/store/authStore';
import { useCustomers } from '@/hooks/useCustomers';
import { useTodayVisits } from '@/hooks/useVisits';
import { useSalesSummary } from '@/hooks/useConversions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Route,
  MapPin,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Target,
  Flame,
  DollarSign,
  Package,
} from 'lucide-react';

export function DashboardRep() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: customers, isLoading: customersLoading } = useCustomers({
    salesRepId: user?.id,
    status: 'active',
  });

  const { data: todayVisits, isLoading: visitsLoading } = useTodayVisits(user?.id);

  // Sales data - today and this month
  const { todayStr, startOfMonthStr } = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return {
      todayStr: today.toISOString(),
      startOfMonthStr: startOfMonth.toISOString()
    };
  }, []);

  const { summary: todaySales } = useSalesSummary({
    salesRepId: user?.role === 'sales_rep' ? user?.id : undefined,
    includeTeam: user?.role !== 'sales_rep',
    dateFrom: todayStr,
  });

  const { summary: monthlySales } = useSalesSummary({
    salesRepId: user?.role === 'sales_rep' ? user?.id : undefined,
    includeTeam: user?.role !== 'sales_rep',
    dateFrom: startOfMonthStr,
  });

  // Fetch fresh profile data for Target
  const { data: profile } = useQuery({
    queryKey: ['my-profile-target', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('target_monthly')
        .eq('id', user?.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id
  });

  const monthlyTarget = profile?.target_monthly || 0;
  const dailyTarget = monthlyTarget > 0 ? Math.round(monthlyTarget / 30) : 0;

  const visitsDone = todayVisits?.filter(v => v.completed).length || 0;
  const visitsTarget = 8; // Daily target
  const visitProgress = (visitsDone / visitsTarget) * 100;

  // Hot prospects (interested customers not yet converted)
  const hotProspects = customers?.filter(
    c => c.last_outcome === 'interested' && c.pipeline === 'recurring'
  ).slice(0, 3) || [];

  // Pending follow-ups
  const pendingFollowups = customers?.filter(
    c => c.last_outcome === 'progressive'
  ).slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#F0F4F8]">
            Welcome back, {user?.full_name?.split(' ')[0]}
          </h2>
          <p className="text-[#8B9CB8] mt-1">
            Here's your performance overview for today
          </p>
        </div>
        <Button
          className="bg-[#C41E3A] hover:bg-[#9B1830]"
          onClick={() => navigate('/map')}
        >
          <Route className="w-4 h-4 mr-2" />
          View Today's Route
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Sales vs Target */}
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Daily Sales"
          value={`৳${todaySales.total_value.toLocaleString()}`}
          subtext={`Target: ৳${dailyTarget.toLocaleString()}`}
          color={todaySales.total_value >= dailyTarget ? "#2ECC71" : "#E74C5E"}
          progress={dailyTarget > 0 ? (todaySales.total_value / dailyTarget) * 100 : 0}
        />

        {/* Monthly Sales vs Target */}
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Monthly Sales"
          value={`৳${monthlySales.total_value.toLocaleString()}`}
          subtext={`Target: ৳${monthlyTarget.toLocaleString()}`}
          color={monthlySales.total_value >= monthlyTarget ? "#2ECC71" : "#3A9EFF"}
          progress={monthlyTarget > 0 ? (monthlySales.total_value / monthlyTarget) * 100 : 0}
        />

        <StatCard
          icon={<MapPin className="w-5 h-5" />}
          label="Today's Visits"
          value={`${visitsDone} / ${visitsTarget}`}
          subtext={`${((visitsDone / visitsTarget) * 100).toFixed(0)}% Completed`}
          color="#3A9EFF"
          progress={visitProgress}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Conversion Rate"
          value={`${todayVisits?.length ? ((todaySales.total_count / todayVisits.length) * 100).toFixed(1) : 0}%`}
          subtext="Based on today's visits"
          color="#F1C40F"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Route */}
        <Card className="lg:col-span-2 bg-[#0A2A5C] border-white/10">
          <CardHeader>
            <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
              <Route className="w-5 h-5 text-[#C41E3A]" />
              Today's Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visitsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41E3A]" />
              </div>
            ) : todayVisits?.length ? (
              <div className="space-y-3">
                {todayVisits.slice(0, 5).map((visit, index) => (
                  <div
                    key={visit.id}
                    className="flex items-center gap-4 p-3 bg-[#0F3460] rounded-lg"
                  >
                    <div className="w-8 h-8 bg-[#143874] rounded-full flex items-center justify-center text-[#F0F4F8] font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-[#F0F4F8] font-medium">
                        {visit.customer_name}
                      </p>
                      <p className="text-[#8B9CB8] text-sm">
                        {visit.completed ? 'Completed' : 'Pending'}
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${visit.completed
                        ? 'bg-[#2ECC71]/20 text-[#2ECC71]'
                        : 'bg-[#FF7C3A]/20 text-[#FF7C3A]'
                        }`}
                    >
                      {visit.completed ? 'Done' : 'Pending'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#8B9CB8]">
                <Route className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No visits scheduled for today</p>
                <Button
                  variant="outline"
                  className="mt-4 border-[#3A9EFF] text-[#3A9EFF]"
                  onClick={() => navigate('/map')}
                >
                  Plan Your Route
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hot Prospects */}
        <Card className="bg-[#0A2A5C] border-white/10">
          <CardHeader>
            <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#FF7C3A]" />
              Hot Prospects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41E3A]" />
              </div>
            ) : hotProspects.length ? (
              <div className="space-y-3">
                {hotProspects.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 bg-[#0F3460] rounded-lg"
                  >
                    <p className="text-[#F0F4F8] font-medium">{customer.name}</p>
                    <p className="text-[#8B9CB8] text-sm">{customer.area}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-[#2ECC71]/20 text-[#2ECC71] px-2 py-0.5 rounded">
                        Interested
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#8B9CB8]">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hot prospects yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Follow-ups */}
      <Card className="bg-[#0A2A5C] border-white/10">
        <CardHeader>
          <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#3A9EFF]" />
            Pending Follow-ups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41E3A]" />
            </div>
          ) : pendingFollowups.length ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pendingFollowups.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 bg-[#0F3460] rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[#F0F4F8] font-medium">{customer.name}</p>
                      <p className="text-[#8B9CB8] text-sm">{customer.area}</p>
                    </div>
                    <AlertCircle className="w-5 h-5 text-[#FF7C3A]" />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs bg-[#3A9EFF]/20 text-[#3A9EFF] px-2 py-0.5 rounded">
                      Progressive
                    </span>
                    <span className="text-xs text-[#8B9CB8]">
                      Follow-up needed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#8B9CB8]">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pending follow-ups</p>
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
  progress?: number;
}

function StatCard({ icon, label, value, subtext, color, progress }: StatCardProps) {
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
        {progress !== undefined && (
          <div className="mt-3">
            <Progress
              value={progress}
              className="h-1.5 bg-[#0F3460]"
            />
          </div>
        )}
        <p className="text-[#8B9CB8] text-xs mt-2">{subtext}</p>
      </CardContent>
    </Card>
  );
}
