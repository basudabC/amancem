// ============================================================
// AMAN CEMENT CRM — Customer Info Window (Custom Overlay)
// ============================================================

import { useMapStore } from '@/store/mapStore';
import { TERRITORY_COLORS, STATUS_COLORS } from '@/lib/constants';
import { X, MapPin, Phone, User, TrendingUp, Building2, Calendar } from 'lucide-react';

export function CustomerInfoWindow() {
  const { selectedCustomer, infoWindowOpen, setInfoWindowOpen } = useMapStore();

  if (!infoWindowOpen || !selectedCustomer) return null;

  const territoryColor = selectedCustomer.territory_color_key 
    ? TERRITORY_COLORS[selectedCustomer.territory_color_key]?.fill 
    : '#3A9EFF';

  const isRecurring = selectedCustomer.pipeline === 'recurring';
  const pipelineData = selectedCustomer.pipeline_data as any;

  return (
    <div className="absolute bottom-4 left-4 z-10 w-80">
      <div className="bg-[#0A2A5C] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-white/10">
          <div>
            <h3 className="text-[#F0F4F8] font-semibold text-base">
              {selectedCustomer.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span 
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  background: isRecurring ? 'rgba(58,158,255,0.18)' : 'rgba(155,107,255,0.18)',
                  color: isRecurring ? '#3A9EFF' : '#9B6BFF',
                  border: `1px solid ${isRecurring ? 'rgba(58,158,255,0.33)' : 'rgba(155,107,255,0.33)'}`,
                }}
              >
                {isRecurring ? 'Recurring' : 'Project'}
              </span>
              {selectedCustomer.last_outcome && (
                <span 
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{
                    background: `${getOutcomeColor(selectedCustomer.last_outcome)}18`,
                    color: getOutcomeColor(selectedCustomer.last_outcome),
                    border: `1px solid ${getOutcomeColor(selectedCustomer.last_outcome)}33`,
                  }}
                >
                  {selectedCustomer.last_outcome}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setInfoWindowOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-[#8B9CB8]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Territory */}
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${territoryColor}20` }}
            >
              <MapPin className="w-4 h-4" style={{ color: territoryColor }} />
            </div>
            <div>
              <span className="text-xs text-[#8B9CB8] block">Territory</span>
              <span className="text-sm text-[#F0F4F8] font-medium">
                {selectedCustomer.territory_name}
              </span>
            </div>
          </div>

          {/* Area */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0F3460] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#8B9CB8]" />
            </div>
            <div>
              <span className="text-xs text-[#8B9CB8] block">Area</span>
              <span className="text-sm text-[#F0F4F8]">
                {selectedCustomer.area || 'N/A'}
              </span>
            </div>
          </div>

          {/* Sales Rep */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0F3460] flex items-center justify-center">
              <User className="w-4 h-4 text-[#8B9CB8]" />
            </div>
            <div>
              <span className="text-xs text-[#8B9CB8] block">Sales Rep</span>
              <span className="text-sm text-[#F0F4F8]">
                {selectedCustomer.sales_rep_name || 'N/A'}
              </span>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0F3460] flex items-center justify-center">
              <Phone className="w-4 h-4 text-[#8B9CB8]" />
            </div>
            <div>
              <span className="text-xs text-[#8B9CB8] block">Phone</span>
              <span className="text-sm text-[#8B9CB8]">
                {selectedCustomer.phone || 'N/A'}
              </span>
            </div>
          </div>

          {/* Pipeline-specific details */}
          {isRecurring ? (
            <>
              <div className="h-px bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(46,204,113,0.15)] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#2ECC71]" />
                </div>
                <div>
                  <span className="text-xs text-[#8B9CB8] block">Monthly Volume</span>
                  <span className="text-sm text-[#2ECC71] font-semibold">
                    {pipelineData?.monthly_sales?.reduce(
                      (s: number, b: any) => s + (b.monthlySales || 0), 
                      0
                    ) || 0} tons
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0F3460] flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-[#8B9CB8]" />
                </div>
                <div>
                  <span className="text-xs text-[#8B9CB8] block">Credit Practice</span>
                  <span className="text-sm text-[#F0F4F8]">
                    {pipelineData?.credit_practice === 'cash' 
                      ? 'Cash' 
                      : `Credit — ${pipelineData?.credit_days} days`}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="h-px bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(212,168,67,0.15)] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#D4A843]" />
                </div>
                <div>
                  <span className="text-xs text-[#8B9CB8] block">Construction Stage</span>
                  <span className="text-sm text-[#D4A843] font-semibold">
                    {pipelineData?.construction_stage_percent || 0}% Complete
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(46,204,113,0.15)] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#2ECC71]" />
                </div>
                <div>
                  <span className="text-xs text-[#8B9CB8] block">Cement Required</span>
                  <span className="text-sm text-[#2ECC71] font-semibold">
                    {pipelineData?.cement_requirement_tons || 0} tons
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getOutcomeColor(outcome: string): string {
  switch (outcome) {
    case 'interested':
      return STATUS_COLORS.interested;
    case 'progressive':
      return STATUS_COLORS.progressive;
    case 'not_interested':
      return STATUS_COLORS.not_interested;
    case 'stagnant':
      return STATUS_COLORS.stagnant;
    default:
      return STATUS_COLORS.new;
  }
}
