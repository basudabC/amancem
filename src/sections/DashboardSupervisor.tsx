// ============================================================
// AMAN CEMENT CRM — Supervisor Dashboard
// ============================================================

import { useCustomers } from '@/hooks/useCustomers';
import { useTerritories } from '@/hooks/useTerritories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TERRITORY_COLORS } from '@/lib/constants';
import { 
  Users, 
  MapPin, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Target,
  BarChart3,
  UserCheck
} from 'lucide-react';

export function DashboardSupervisor() {
  const { data: customers, isLoading: customersLoading } = useCustomers({ status: 'active' });
  const { data: territories, isLoading: territoriesLoading } = useTerritories();

  const totalTerritories = territories?.length || 0;

  // Mock team data
  const teamMembers = [
    { id: '1', name: 'Ahmed Khan', visits: 12, conversions: 5, target: 15 },
    { id: '2', name: 'Rahim Uddin', visits: 8, conversions: 3, target: 15 },
    { id: '3', name: 'Karim Hassan', visits: 15, conversions: 7, target: 15 },
    { id: '4', name: 'Jamal Hossain', visits: 6, conversions: 2, target: 15 },
  ];

  // Coverage gaps (territories with low activity)
  const coverageGaps = territories?.slice(0, 2).map(t => ({
    ...t,
    daysSinceLastVisit: Math.floor(Math.random() * 7) + 3,
  })) || [];

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
          <Button className="bg-[#C41E3A] hover:bg-[#9B1830]">
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
          value={teamMembers.reduce((sum, m) => sum + m.visits, 0)}
          subtext="Across all team members"
          color="#D4A843"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Conversions"
          value={teamMembers.reduce((sum, m) => sum + m.conversions, 0)}
          subtext="Today's successful conversions"
          color="#9B6BFF"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <Card className="bg-[#0A2A5C] border-white/10">
          <CardHeader>
            <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#3A9EFF]" />
              Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => {
                const progress = (member.visits / member.target) * 100;
                return (
                  <div key={member.id} className="p-3 bg-[#0F3460] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#143874] rounded-full flex items-center justify-center">
                          <span className="text-[#F0F4F8] font-semibold">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-[#F0F4F8] font-medium">{member.name}</p>
                          <p className="text-[#8B9CB8] text-xs">
                            {member.visits} visits • {member.conversions} conversions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[#F0F4F8] font-semibold">
                          {Math.round(progress)}%
                        </p>
                        <p className="text-[#8B9CB8] text-xs">of target</p>
                      </div>
                    </div>
                    <Progress 
                      value={progress} 
                      className="h-1.5 bg-[#0A2A5C]"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Coverage Gaps */}
        <Card className="bg-[#0A2A5C] border-white/10">
          <CardHeader>
            <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#FF7C3A]" />
              Coverage Gaps
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
                  const colors = TERRITORY_COLORS[territory.color_key];
                  return (
                    <div
                      key={territory.id}
                      className="flex items-center gap-4 p-3 bg-[#FF7C3A]/10 border border-[#FF7C3A]/30 rounded-lg"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: `${colors?.fill}30` }}
                      >
                        <MapPin className="w-5 h-5" style={{ color: colors?.fill }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[#F0F4F8] font-medium">{territory.name}</p>
                        <p className="text-[#FF7C3A] text-sm">
                          No visits in {(territory as any).daysSinceLastVisit} days
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
                <p>No coverage gaps detected</p>
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
