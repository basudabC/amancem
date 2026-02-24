// ============================================================
// AMAN CEMENT CRM — Management Dashboard
// ============================================================

import { useCustomers } from '@/hooks/useCustomers';
import { useTerritories } from '@/hooks/useTerritories';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TERRITORY_COLORS } from '@/lib/constants';
import {
  Map,
  Users,
  Store,
  TrendingUp,
  Target,
  Flame,
  AlertTriangle,
  BarChart3,
  MapPin
} from 'lucide-react';

export function DashboardManagement() {
  const { data: customers } = useCustomers({ status: 'active' });
  const { data: territories } = useTerritories();
  const navigate = useNavigate();

  const totalCustomers = customers?.length || 0;
  const recurringCustomers = customers?.filter(c => c.pipeline === 'recurring').length || 0;
  const projectCustomers = customers?.filter(c => c.pipeline === 'one_time').length || 0;
  const totalTerritories = territories?.length || 0;

  // Mock conversion funnel data
  const funnelData = {
    mapped: totalCustomers,
    visited: Math.round(totalCustomers * 0.75),
    interested: Math.round(totalCustomers * 0.35),
    converted: Math.round(totalCustomers * 0.22),
  };

  // Mock territory rankings
  const territoryRankings = territories?.slice(0, 5).map((t) => ({
    ...t,
    conversion_rate: Math.round(20 + Math.random() * 30),
    volume: Math.round(500 + Math.random() * 1500),
    coverage: Math.round(60 + Math.random() * 40),
  })) || [];

  // Mock leakage alerts
  const leakageAlerts = [
    { type: 'dead_zone', message: 'Territory C: No visits in 7 days', severity: 'critical' },
    { type: 'high_interest', message: '5 customers: 3+ Interested, 0 Orders', severity: 'warning' },
    { type: 'target_gap', message: 'Territory B: Monthly volume 45% below target', severity: 'critical' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#F0F4F8]">
            Management Dashboard
          </h2>
          <p className="text-[#8B9CB8] mt-1">
            National overview of sales performance
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-[#3A9EFF] text-[#3A9EFF]"
          >
            <Map className="w-4 h-4 mr-2" />
            View Full Map
          </Button>
          <Button className="bg-[#C41E3A] hover:bg-[#9B1830]" onClick={() => navigate('/detailed-analytics')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Detailed Analytics
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Store className="w-5 h-5" />}
          label="Total Customers"
          value={totalCustomers}
          subtext={`${recurringCustomers} Recurring, ${projectCustomers} Projects`}
          color="#3A9EFF"
        />
        <MetricCard
          icon={<MapPin className="w-5 h-5" />}
          label="Territories"
          value={totalTerritories}
          subtext="Active sales zones"
          color="#2ECC71"
        />
        <MetricCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Monthly Volume"
          value="12,450 tons"
          subtext="+8% from last month"
          color="#D4A843"
        />
        <MetricCard
          icon={<Target className="w-5 h-5" />}
          label="Conversion Rate"
          value="24.5%"
          subtext="+2.3% from last month"
          color="#9B6BFF"
        />
      </div>

      {/* Conversion Funnel */}
      <Card className="bg-[#0A2A5C] border-white/10">
        <CardHeader>
          <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#C41E3A]" />
            Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <FunnelStage
              label="Mapped"
              value={funnelData.mapped}
              percentage={100}
              color="#3A9EFF"
            />
            <FunnelStage
              label="Visited"
              value={funnelData.visited}
              percentage={Math.round((funnelData.visited / funnelData.mapped) * 100)}
              color="#2ECC71"
            />
            <FunnelStage
              label="Interested"
              value={funnelData.interested}
              percentage={Math.round((funnelData.interested / funnelData.mapped) * 100)}
              color="#D4A843"
            />
            <FunnelStage
              label="Converted"
              value={funnelData.converted}
              percentage={Math.round((funnelData.converted / funnelData.mapped) * 100)}
              color="#9B6BFF"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Territory Rankings */}
        <Card className="bg-[#0A2A5C] border-white/10">
          <CardHeader>
            <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
              <Map className="w-5 h-5 text-[#2ECC71]" />
              Territory Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {territoryRankings.length ? (
              <div className="space-y-3">
                {territoryRankings.map((territory, index) => {
                  const colors = TERRITORY_COLORS[territory.color_key];
                  return (
                    <div
                      key={territory.id}
                      className="flex items-center gap-4 p-3 bg-[#0F3460] rounded-lg"
                    >
                      <div className="w-6 h-6 bg-[#143874] rounded-full flex items-center justify-center text-[#F0F4F8] font-semibold text-xs">
                        {index + 1}
                      </div>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: colors?.fill || '#3A9EFF' }}
                      />
                      <div className="flex-1">
                        <p className="text-[#F0F4F8] font-medium">{territory.name}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-[#8B9CB8]">
                            {territory.volume} tons
                          </span>
                          <span className="text-xs text-[#2ECC71]">
                            {territory.conversion_rate}% conv.
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#8B9CB8] mb-1">
                          Coverage
                        </div>
                        <Progress
                          value={territory.coverage}
                          className="w-20 h-1.5 bg-[#0A2A5C]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-[#8B9CB8]">
                <Map className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No territories found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leakage Alerts */}
        <Card className="bg-[#0A2A5C] border-white/10">
          <CardHeader>
            <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#FF7C3A]" />
              Conversion Leakage Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leakageAlerts.map((alert, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${alert.severity === 'critical'
                      ? 'bg-[#E74C5E]/10 border border-[#E74C5E]/30'
                      : 'bg-[#FF7C3A]/10 border border-[#FF7C3A]/30'
                    }`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 flex-shrink-0 ${alert.severity === 'critical' ? 'text-[#E74C5E]' : 'text-[#FF7C3A]'
                      }`}
                  />
                  <div>
                    <p className={`text-sm font-medium ${alert.severity === 'critical' ? 'text-[#E74C5E]' : 'text-[#FF7C3A]'
                      }`}>
                      {alert.type === 'dead_zone' && 'Dead Zone Detected'}
                      {alert.type === 'high_interest' && 'High Interest, No Order'}
                      {alert.type === 'target_gap' && 'Target Gap Alert'}
                    </p>
                    <p className="text-[#8B9CB8] text-sm mt-0.5">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          icon={<Users className="w-6 h-6" />}
          title="Team Performance"
          description="View individual rep metrics and comparisons"
          color="#3A9EFF"
        />
        <QuickActionCard
          icon={<Map className="w-6 h-6" />}
          title="Live Field Map"
          description="Track real-time rep positions and activities"
          color="#2ECC71"
        />
        <QuickActionCard
          icon={<BarChart3 className="w-6 h-6" />}
          title="Sales Analytics"
          description="Deep dive into sales trends and patterns"
          color="#D4A843"
        />
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext: string;
  color: string;
}

function MetricCard({ icon, label, value, subtext, color }: MetricCardProps) {
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

interface FunnelStageProps {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

function FunnelStage({ label, value, percentage, color }: FunnelStageProps) {
  return (
    <div className="text-center">
      <div
        className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2"
        style={{ background: `${color}20` }}
      >
        <span className="text-xl font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <p className="text-[#F0F4F8] font-medium text-sm">{label}</p>
      <p className="text-[#8B9CB8] text-xs">{percentage}%</p>
    </div>
  );
}

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function QuickActionCard({ icon, title, description, color }: QuickActionCardProps) {
  return (
    <button className="flex items-start gap-4 p-4 bg-[#0A2A5C] border border-white/10 rounded-xl hover:bg-[#0F3460] transition-colors text-left">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}20` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <h3 className="text-[#F0F4F8] font-semibold">{title}</h3>
        <p className="text-[#8B9CB8] text-sm mt-1">{description}</p>
      </div>
    </button>
  );
}
