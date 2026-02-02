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

// Create circle marker SVG for recurring customers
function createCircleMarkerSvg(color: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
      <ellipse cx="15" cy="36" rx="6" ry="2" fill="rgba(0,0,0,0.3)"/>
      <path d="M15 0C6.72 0 0 6.72 0 15c0 11.25 15 23 15 23s15-11.75 15-23C30 6.72 23.28 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="15" r="6.5" fill="#061A3A"/>
      <circle cx="15" cy="15" r="2.5" fill="rgba(255,255,255,0.25)"/>
    </svg>
  `;
}

// Create diamond marker SVG for project customers
function createDiamondMarkerSvg(color: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
      <ellipse cx="15" cy="36" rx="5" ry="2" fill="rgba(0,0,0,0.3)"/>
      <path d="M15 0 L28 14 L15 28 L2 14 Z" fill="${color}"/>
      <path d="M11 26 L15 35 L19 26" fill="${color}"/>
      <path d="M15 5 L23 14 L15 23 L7 14 Z" fill="#061A3A"/>
      <path d="M15 9 L19 14 L15 19 L11 14 Z" fill="rgba(255,255,255,0.15)"/>
    </svg>
  `;
}

// Get marker color based on customer status
// User requested "red color" for all pins.
// We will use shades of Red to maintain some distinction while adhering to the request.
const RED_COLORS = {
  active: '#FF0000', // Bright Red
  inactive: '#8B0000', // Dark Red
  default: '#D32F2F', // Standard Red
};

function getMarkerColor(customer: Customer): string {
  // Use Red for everything as requested, maybe vary slightly by status if needed
  // For now, uniformly Red or slightly varied
  if (customer.status === 'archived') return '#555555'; // Exception for archived
  return RED_COLORS.active;
}

// Create marker icon
function createMarkerIcon(customer: Customer): google.maps.Icon {
  const color = getMarkerColor(customer);
  const svg = customer.pipeline === 'recurring'
    ? createCircleMarkerSvg(color)
    : createDiamondMarkerSvg(color);

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(32, 42), // Slightly larger for visibility
    anchor: new google.maps.Point(16, 42),
    labelOrigin: new google.maps.Point(16, -10), // Position label above the pin
  };
}

export function CustomerMarkers() {
  const { map } = useMapStore();
  const { user } = useAuthStore();
  const { data: teamMembers = [] } = useTeam();
  const [activeMarker, setActiveMarker] = useState<Customer | null>(null);

  // Calculate generic hierarchy territory list
  const allTerritoryIds = useMemo(() => {
    // If country head, return undefined to fetch all
    if (user?.role === 'country_head') return undefined;

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

        // Prevent zooming in too far if only one point
        const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          if (map.getZoom()! > 16) map.setZoom(16);
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
            label={{
              text: customer.name,
              color: '#FFFFFF', // White text as requested
              fontSize: '11px',
              fontWeight: 'bold',
            }}
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
          <CustomerInfoContent customer={activeMarker} />
        </InfoWindow>
      )}
    </>
  );
}

// Customer Info Window Content
function CustomerInfoContent({ customer }: { customer: Customer }) {
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
      <div style={{ marginBottom: '12px' }}>
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
