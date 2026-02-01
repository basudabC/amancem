// ============================================================
// AMAN CEMENT CRM — Map Filter Controls
// ============================================================

import { useState } from 'react';
import { useMapStore } from '@/store/mapStore';
import { useAuthStore } from '@/store/authStore';
import { TERRITORY_COLORS } from '@/lib/constants';
import { 
  Flame, 
  Users, 
  Store, 
  Building2, 
  Archive,
  ChevronDown,
  ChevronUp,
  Map as MapIcon
} from 'lucide-react';

export function MapControls() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { user } = useAuthStore();
  const {
    showRecurring,
    showProjects,
    showArchived,
    selectedTerritories,
    showHeatmap,
    showLiveReps,
    territories,
    toggleRecurring,
    toggleProjects,
    toggleArchived,
    toggleTerritory,
    toggleHeatmap,
    toggleLiveReps,
    selectAllTerritories,
    deselectAllTerritories,
  } = useMapStore();

  // Only management can see live reps
  const canSeeLiveReps = user?.role === 'regional_manager' || user?.role === 'country_head';

  return (
    <div className="absolute top-4 left-4 z-10">
      <div 
        className="bg-[#0A2A5C] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        style={{ minWidth: '240px' }}
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-[#C41E3A]" />
            <span className="text-[#F0F4F8] font-semibold text-sm">Map Filters</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#8B9CB8]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#8B9CB8]" />
          )}
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-4">
            {/* Pipeline Filters */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-[#8B9CB8] uppercase tracking-wider">
                Customer Types
              </span>
              <div className="space-y-1.5">
                <FilterToggle
                  active={showRecurring}
                  onClick={toggleRecurring}
                  icon={<Store className="w-3.5 h-3.5" />}
                  label="Recurring Customers"
                  color="#3A9EFF"
                />
                <FilterToggle
                  active={showProjects}
                  onClick={toggleProjects}
                  icon={<Building2 className="w-3.5 h-3.5" />}
                  label="Project Customers"
                  color="#9B6BFF"
                />
                <FilterToggle
                  active={showArchived}
                  onClick={toggleArchived}
                  icon={<Archive className="w-3.5 h-3.5" />}
                  label="Show Archived"
                  color="#4A5B7A"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Territory Filters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#8B9CB8] uppercase tracking-wider">
                  Territories
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={selectAllTerritories}
                    className="text-[10px] text-[#3A9EFF] hover:text-[#F0F4F8] transition-colors"
                  >
                    All
                  </button>
                  <span className="text-[#4A5B7A]">|</span>
                  <button
                    onClick={deselectAllTerritories}
                    className="text-[10px] text-[#3A9EFF] hover:text-[#F0F4F8] transition-colors"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                {territories.map((territory) => {
                  const colors = TERRITORY_COLORS[territory.color_key];
                  const isSelected = selectedTerritories.includes(territory.id);
                  
                  return (
                    <button
                      key={territory.id}
                      onClick={() => toggleTerritory(territory.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${
                        isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          background: colors?.fill || '#3A9EFF',
                          opacity: isSelected ? 1 : 0.4 
                        }}
                      />
                      <span 
                        className={`text-xs ${
                          isSelected ? 'text-[#F0F4F8]' : 'text-[#8B9CB8]'
                        }`}
                      >
                        {territory.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Visualization Layers */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-[#8B9CB8] uppercase tracking-wider">
                Visualization
              </span>
              <div className="space-y-1.5">
                <FilterToggle
                  active={showHeatmap}
                  onClick={toggleHeatmap}
                  icon={<Flame className="w-3.5 h-3.5" />}
                  label="Demand Heatmap"
                  color="#FF7C3A"
                />
                {canSeeLiveReps && (
                  <FilterToggle
                    active={showLiveReps}
                    onClick={toggleLiveReps}
                    icon={<Users className="w-3.5 h-3.5" />}
                    label="Live Rep Positions"
                    color="#2ECC71"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface FilterToggleProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
}

function FilterToggle({ active, onClick, icon, label, color }: FilterToggleProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all ${
        active ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
    >
      <div
        className="w-5 h-5 rounded-md flex items-center justify-center"
        style={{ 
          background: active ? `${color}30` : 'transparent',
          border: `1px solid ${active ? color : 'rgba(255,255,255,0.15)'}`,
        }}
      >
        <span style={{ color: active ? color : '#4A5B7A' }}>{icon}</span>
      </div>
      <span 
        className={`text-xs ${
          active ? 'text-[#F0F4F8]' : 'text-[#8B9CB8]'
        }`}
      >
        {label}
      </span>
      {active && (
        <div 
          className="ml-auto w-1.5 h-1.5 rounded-full"
          style={{ background: color }}
        />
      )}
    </button>
  );
}
