// ============================================================
// AMAN CEMENT CRM — Customer Markers Component
// ============================================================

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { useMapStore } from '@/store/mapStore';
import { useAuthStore } from '@/store/authStore';
import { useMapCustomers } from '@/hooks/useCustomers';
import { useCustomerRecentSales } from '@/hooks/useConversions';
import { useTeam } from '@/hooks/useTeam';
import { TERRITORY_COLORS, STATUS_COLORS } from '@/lib/constants';
import type { Customer, VisitOutcome } from '@/types';

// ── House icon for recurring shops (solid house shape) ──────
function createHouseMarkerSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="40" viewBox="0 0 36 40">
    <!-- shadow -->
    <ellipse cx="18" cy="38" rx="8" ry="2.5" fill="rgba(0,0,0,0.25)"/>
    <!-- roof -->
    <polygon points="18,2 34,18 2,18" fill="${color}" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
    <!-- walls -->
    <rect x="5" y="17" width="26" height="18" rx="1" fill="${color}" stroke="rgba(255,255,255,0.25)" stroke-width="0.5"/>
    <!-- door -->
    <rect x="14" y="26" width="8" height="9" rx="1.5" fill="rgba(0,0,0,0.45)"/>
    <circle cx="21" cy="31" r="1" fill="rgba(255,255,255,0.5)"/>
    <!-- window left -->
    <rect x="7" y="21" width="6" height="5" rx="1" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>
    <!-- window right -->
    <rect x="23" y="21" width="6" height="5" rx="1" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>
    <!-- highlight on roof -->
    <polygon points="18,4 32,18 18,18" fill="rgba(255,255,255,0.08)"/>
  </svg>`;
}

// ── Building icon for project customers ─────────────────────
function createBuildingMarkerSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="40" viewBox="0 0 36 40">
    <!-- shadow -->
    <ellipse cx="18" cy="38" rx="8" ry="2.5" fill="rgba(0,0,0,0.25)"/>
    <!-- main building -->
    <rect x="6" y="10" width="24" height="25" rx="1.5" fill="${color}" stroke="rgba(255,255,255,0.3)" stroke-width="0.8"/>
    <!-- roof line -->
    <rect x="6" y="10" width="24" height="4" rx="1.5" fill="rgba(0,0,0,0.2)"/>
    <!-- crane arm -->
    <line x1="26" y1="2" x2="26" y2="12" stroke="rgba(255,255,255,0.7)" stroke-width="1.5"/>
    <line x1="18" y1="3" x2="32" y2="3" stroke="rgba(255,255,255,0.7)" stroke-width="1.5"/>
    <line x1="32" y1="3" x2="32" y2="8" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
    <!-- windows grid -->
    <rect x="9" y="16" width="5" height="4" rx="0.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" stroke-width="0.5"/>
    <rect x="16" y="16" width="5" height="4" rx="0.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" stroke-width="0.5"/>
    <rect x="23" y="16" width="5" height="4" rx="0.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" stroke-width="0.5"/>
    <rect x="9" y="22" width="5" height="4" rx="0.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" stroke-width="0.5"/>
    <rect x="23" y="22" width="5" height="4" rx="0.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" stroke-width="0.5"/>
    <!-- central door -->
    <rect x="14" y="27" width="8" height="8" rx="1" fill="rgba(0,0,0,0.4)"/>
  </svg>`;
}

// ── Deterministic unique HSL color from any string ID ────────
// Uses golden-ratio hue spacing so every territory gets a visually
// distinct color, no matter how many territories exist.
function hashStringToHue(str: string): number {
  // djb2 hash → spread over 360°
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  // Golden angle in degrees ≈ 137.508
  return Math.abs(hash * 137.508) % 360;
}

// ── Pick unique territory color for icon ────────────────────
// Always uses golden-ratio HSL — supports unlimited territories
function getTerritoryColor(customer: Customer): string {
  if (customer.status === 'archived') return '#6B7A8D';
  // Generate unique hue from territory_id (falls back to customer id)
  const id = customer.territory_id || customer.id || 'unknown';
  const hue = hashStringToHue(id);
  return `hsl(${hue.toFixed(0)}, 80%, 62%)`;
}

// ── Create the marker icon object ────────────────────────────
function createMarkerIcon(customer: Customer): google.maps.Icon {
  const color = getTerritoryColor(customer);
  const svg = customer.pipeline === 'recurring'
    ? createHouseMarkerSvg(color)
    : createBuildingMarkerSvg(color);
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(36, 40),
    anchor: new google.maps.Point(18, 38),
    labelOrigin: new google.maps.Point(18, -6),
  };
}

export function CustomerMarkers({ onEdit }: { onEdit?: (customer: Customer) => void }) {
  const { map } = useMapStore();
  const { user } = useAuthStore();
  const { data: teamMembers = [] } = useTeam();
  const [activeMarker, setActiveMarker] = useState<Customer | null>(null);

  // Calculate generic hierarchy territory list
  const allTerritoryIds = useMemo(() => {
    // If country head or division head, return undefined to fetch all (RLS handles filtering)
    if (user?.role === 'country_head' || user?.role === 'division_head') return undefined;

    const ids = new Set<string>();
    if (user?.territory_ids) user.territory_ids.forEach(id => ids.add(id));

    // Add team's territories
    teamMembers.forEach(m => {
      if (m.territory_ids) m.territory_ids.forEach(id => ids.add(id));
    });

    return Array.from(ids);
  }, [user, teamMembers]);

  // Fetch customers based on hierarchical territories
  const { data: customersData, isLoading } = useMapCustomers(allTerritoryIds);

  const handleMarkerClick = useCallback((customer: Customer) => {
    setActiveMarker(customer);
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setActiveMarker(null);
  }, []);

  // Filter customers with valid coordinates
  const validCustomers = useMemo(() => {
    if (!customersData) return [];
    return customersData.filter(customer => {
      const lat = Number(customer.latitude);
      const lng = Number(customer.longitude);
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });
  }, [customersData]);

  // Auto-zoom to fit markers
  useEffect(() => {
    if (map && validCustomers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      let hasPoints = false;

      validCustomers.forEach(customer => {
        const lat = Number(customer.latitude);
        const lng = Number(customer.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.extend({ lat, lng });
          hasPoints = true;
        }
      });

      if (hasPoints) {
        map.fitBounds(bounds);
        // Prevent zooming in too far if only one or few points
        const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          if (map.getZoom()! > 14) map.setZoom(14);
          if (map.getZoom()! < 9) map.setZoom(9);
        });
        return () => google.maps.event.removeListener(listener);
      }
    }
  }, [map, validCustomers]);

  if (!map || isLoading || !customersData) return null;

  return (
    <>
      {validCustomers.map((customer) => {
        const lat = Number(customer.latitude);
        const lng = Number(customer.longitude);

        return (
          <Marker
            key={customer.id}
            position={{ lat, lng }}
            icon={createMarkerIcon(customer)}
            title={customer.name}
            onClick={() => handleMarkerClick(customer)}
            zIndex={10}
          />
        );
      })}

      {activeMarker && (
        <InfoWindow
          position={{
            lat: activeMarker.latitude || 0,
            lng: activeMarker.longitude || 0,
          }}
          onCloseClick={handleInfoWindowClose}
          options={{
            pixelOffset: new google.maps.Size(0, -35),
          }}
        >
          <CustomerInfoContent customer={activeMarker} onEdit={onEdit} />
        </InfoWindow>
      )}
    </>
  );
}

interface CustomerInfoContentProps {
  customer: Customer;
  onEdit?: (customer: Customer) => void;
}

// Customer Info Window Content
function CustomerInfoContent({ customer, onEdit }: CustomerInfoContentProps) {
  const territoryColor = customer.territory_color_key
    ? TERRITORY_COLORS[customer.territory_color_key as keyof typeof TERRITORY_COLORS]?.fill
    : '#3A9EFF';

  const isRecurring = customer.pipeline === 'recurring';
  const pipelineData = customer.pipeline_data as any;

  // New: Fetch sales data
  const { summary: salesSummary, isLoading: salesLoading } = useCustomerRecentSales(customer.id);

  return (
    <div
      style={{
        fontFamily: 'Nunito Sans, sans-serif',
        background: '#0A2A5C',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '12px',
        padding: '16px 18px',
        minWidth: '260px',
        maxWidth: '300px',
        color: '#F0F4F8',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 600,
              fontSize: '16px',
              color: '#F0F4F8',
              lineHeight: 1.2,
            }}
          >
            {customer.name}
          </div>
          <div style={{ marginTop: '4px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                background: isRecurring ? 'rgba(58,158,255,0.18)' : 'rgba(155,107,255,0.18)',
                color: isRecurring ? '#3A9EFF' : '#9B6BFF',
                fontSize: '9px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                padding: '3px 8px',
                borderRadius: '4px',
                border: `1px solid ${isRecurring ? 'rgba(58,158,255,0.33)' : 'rgba(155,107,255,0.33)'}`,
              }}
            >
              {isRecurring ? 'Recurring' : 'Project'}
            </span>
            {customer.last_outcome && typeof customer.last_outcome === 'string' && (
              <span
                style={{
                  background: `${getOutcomeColor(customer.last_outcome as VisitOutcome) || STATUS_COLORS.new}18`,
                  color: getOutcomeColor(customer.last_outcome as VisitOutcome) || STATUS_COLORS.new,
                  fontSize: '9px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${getOutcomeColor(customer.last_outcome as VisitOutcome) || STATUS_COLORS.new}33`,
                }}
              >
                {customer.last_outcome}
              </span>
            )}
          </div>
        </div>
        {onEdit && (
          <button
            onClick={() => onEdit(customer)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              cursor: 'pointer',
              color: '#3A9EFF',
              fontSize: '11px',
              fontWeight: 600,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(58,158,255,0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          >
            Edit
          </button>
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          background: 'rgba(255,255,255,0.08)',
          marginBottom: '10px',
        }}
      />

      {/* Details */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '7px',
          fontSize: '12px',
        }}
      >
        {/* Territory */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#4A5B7A' }}>Territory</span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: territoryColor,
              }}
            />
            <span style={{ color: territoryColor, fontWeight: 600 }}>
              {customer.territory_name || 'Assigned'}
            </span>
          </span>
        </div>

        {/* Sales Rep */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#4A5B7A' }}>Sales Rep</span>
          <span style={{ color: '#F0F4F8' }}>{customer.sales_rep_name || 'N/A'}</span>
        </div>

        {/* Phone */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#4A5B7A' }}>Phone</span>
          <span style={{ color: '#8B9CB8' }}>{customer.phone || 'N/A'}</span>
        </div>

        {/* Real Sales Data */}
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#4A5B7A' }}>Last 30 Days Sales</span>
            <span style={{ color: '#2ECC71', fontWeight: 600 }}>
              {salesLoading ? 'Loading...' : `৳${(salesSummary?.total_value || 0).toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Pipeline-specific rows */}
        {isRecurring ? (
          <>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4A5B7A' }}>Monthly Est.</span>
                <span style={{ color: '#F0F4F8', fontWeight: 600 }}>
                  {pipelineData?.monthly_sales?.reduce((s: number, b: any) => s + (b.monthlySales || 0), 0) || 0} tons
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4A5B7A' }}>Stage</span>
                <span style={{ color: '#D4A843', fontWeight: 600 }}>
                  {pipelineData?.construction_stage_percent || 0}%
                </span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4A5B7A' }}>Cement Need</span>
                <span style={{ color: '#2ECC71', fontWeight: 600 }}>
                  {pipelineData?.cement_requirement_tons || 0} tons
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function getOutcomeColor(outcome: string | VisitOutcome): string {
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
