// ============================================================
// AMAN CEMENT CRM — Territory Info Panel
// ============================================================

import { useMapStore } from '@/store/mapStore';
import { useTerritory } from '@/hooks/useTerritories';
import { TERRITORY_COLORS } from '@/lib/constants';
import { X, Users, Store, Building2, TrendingUp, MapPin } from 'lucide-react';

export function TerritoryPanel() {
  const { selectedTerritory, territoryPanelOpen, setTerritoryPanelOpen } = useMapStore();
  
  const { data: territoryWithStats, isLoading } = useTerritory(
    selectedTerritory?.id || ''
  );

  if (!territoryPanelOpen || !selectedTerritory) return null;

  const colors = TERRITORY_COLORS[selectedTerritory.color_key] || TERRITORY_COLORS.territory_a;
  const stats = territoryWithStats?.stats;

  return (
    <div className="absolute top-4 right-4 z-10 w-80">
      <div className="bg-[#0A2A5C] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ 
              background: `${colors.fill}22`,
              border: `1px solid ${colors.fill}66`
            }}
          >
            <div 
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: colors.fill }}
            />
            <span 
              className="text-sm font-semibold"
              style={{ color: colors.fill }}
            >
              {selectedTerritory.name}
            </span>
          </div>
          <button
            onClick={() => setTerritoryPanelOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-[#8B9CB8]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41E3A]" />
            </div>
          ) : stats ? (
            <div className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<Store className="w-4 h-4" />}
                  value={stats.totalCustomers}
                  label="Total Shops"
                  color="#3A9EFF"
                />
                <StatCard
                  icon={<Building2 className="w-4 h-4" />}
                  value={stats.recurringCount}
                  label="Recurring"
                  color="#2ECC71"
                />
                <StatCard
                  icon={<MapPin className="w-4 h-4" />}
                  value={stats.projectCount}
                  label="Projects"
                  color="#9B6BFF"
                />
                <StatCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  value={`${stats.monthlyVolume} tons`}
                  label="Monthly Volume"
                  color="#D4A843"
                />
                <StatCard
                  icon={<Users className="w-4 h-4" />}
                  value={stats.activeReps}
                  label="Field Reps"
                  color="#2DD4BF"
                />
                <StatCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  value={`${stats.conversionRate}%`}
                  label="Conversion"
                  color="#3A9EFF"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-[#8B9CB8]">
              No statistics available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <div className="bg-[#0F3460] rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <div style={{ color }}>{icon}</div>
        <span 
          className="text-lg font-bold"
          style={{ color }}
        >
          {value}
        </span>
      </div>
      <span className="text-xs text-[#8B9CB8]">{label}</span>
    </div>
  );
}
