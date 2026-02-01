// ============================================================
// AMAN CEMENT CRM — Customer Markers Component
// ============================================================

import { useState, useCallback } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import { useMapStore } from '@/store/mapStore';
import { useAuthStore } from '@/store/authStore';
import { useMapCustomers } from '@/hooks/useCustomers';
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
function getMarkerColor(customer: Customer): string {
  if (customer.pipeline === 'recurring') {
    switch (customer.last_outcome as VisitOutcome) {
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
  } else {
    // Project customers
    const projectData = customer.pipeline_data as any;
    const stage = projectData?.construction_stage_percent || 0;

    if (customer.status === 'archived') return STATUS_COLORS.archived;
    if (stage >= 75) return STATUS_COLORS.nearing_completion;
    if (stage >= 40) return STATUS_COLORS.mid_construction;
    return STATUS_COLORS.early_stage;
  }
}

// Create marker icon
function createMarkerIcon(customer: Customer): google.maps.Icon {
  const color = getMarkerColor(customer);
  const svg = customer.pipeline === 'recurring'
    ? createCircleMarkerSvg(color)
    : createDiamondMarkerSvg(color);

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(26, 34),
    anchor: new google.maps.Point(13, 34),
  };
}

export function CustomerMarkers() {
  const { map } = useMapStore();
  const { user } = useAuthStore();
  const [activeMarker, setActiveMarker] = useState<Customer | null>(null);

  // Fetch customers based on user permissions
  const { data: customersData, isLoading } = useMapCustomers(
    user?.role === 'country_head' ? undefined : user?.territory_ids
  );

  const handleMarkerClick = useCallback((customer: Customer) => {
    setActiveMarker(customer);
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setActiveMarker(null);
  }, []);

  if (!map || isLoading || !customersData) return null;

  // Filter customers with valid coordinates
  const validCustomers = customersData.filter(customer => {
    const lat = Number(customer.latitude);
    const lng = Number(customer.longitude);
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  });

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
            lat: activeMarker.latitude,
            lng: activeMarker.longitude,
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
    ? TERRITORY_COLORS[customer.territory_color_key]?.fill
    : '#3A9EFF';

  const isRecurring = customer.pipeline === 'recurring';
  const pipelineData = customer.pipeline_data as any;

  return (
    <div
      style={{
        fontFamily: 'Nunito Sans, sans-serif',
        background: '#0A2A5C',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '12px',
        padding: '16px 18px',
        minWidth: '240px',
        maxWidth: '280px',
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
          {customer.last_outcome && (
            <span
              style={{
                background: `${getOutcomeColor(customer.last_outcome)}18`,
                color: getOutcomeColor(customer.last_outcome),
                fontSize: '9px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                padding: '3px 8px',
                borderRadius: '4px',
                border: `1px solid ${getOutcomeColor(customer.last_outcome)}33`,
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
              {customer.territory_name}
            </span>
          </span>
        </div>

        {/* Area */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#4A5B7A' }}>Area</span>
          <span style={{ color: '#F0F4F8' }}>{customer.area || 'N/A'}</span>
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

        {/* Pipeline-specific rows */}
        {isRecurring ? (
          <>
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4A5B7A' }}>Monthly Volume</span>
                <span style={{ color: '#2ECC71', fontWeight: 600 }}>
                  {pipelineData?.monthly_sales?.reduce((s: number, b: any) => s + (b.monthlySales || 0), 0) || 0} tons
                </span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4A5B7A' }}>Credit Practice</span>
                <span style={{ color: '#F0F4F8' }}>
                  {pipelineData?.credit_practice === 'cash' ? 'Cash' : `Credit — ${pipelineData?.credit_days} days`}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4A5B7A' }}>Construction Stage</span>
                <span style={{ color: '#D4A843', fontWeight: 600 }}>
                  {pipelineData?.construction_stage_percent || 0}% Complete
                </span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4A5B7A' }}>Cement Needed</span>
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
