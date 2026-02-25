// ============================================================
// AMAN CEMENT CRM — Territory Polygons (3-layer boundary system)
// Layer 1: Territory boundaries (thin, per-territory color)
// Layer 2: Area boundaries (medium, grouped by territory.area)
// Layer 3: Region boundaries (thick, grouped by territory.region)
// ============================================================

import { useEffect, useState, useMemo } from 'react';
import { Polygon, Polyline } from '@react-google-maps/api';
import { useMapStore } from '@/store/mapStore';
import { TERRITORY_COLORS } from '@/lib/constants';
import type { Territory } from '@/types';

// ── Unique color per territory ID (golden-ratio HSL) ─────────
function hashStringToHue(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash * 137.508) % 360;
}

function getTerritoryUniqueColor(territory: Territory): { fill: string; stroke: string } {
  // Always generate unique hue from territory.id — ignores the 8-slot color_key palette
  // Supports unlimited territories with no color collisions
  const hue = hashStringToHue(territory.id || territory.name);
  return {
    stroke: `hsl(${hue.toFixed(0)}, 85%, 62%)`,
    fill: `hsl(${hue.toFixed(0)}, 70%, 50%)`,
  };
}


// ─── Color palettes for area and region layers ────────────────
const AREA_COLORS = [
  '#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C',
  '#4DABF7', '#748FFC', '#E599F7', '#F783AC',
  '#63E6BE', '#A9E34B',
];

const REGION_COLORS = [
  '#E03131', '#E8590C', '#F08C00', '#2F9E44',
  '#1971C2', '#6741D9', '#C2255C', '#0C8599',
];

interface PolygonData {
  territory: Territory;
  paths: google.maps.LatLngLiteral[];
}

function geoToLatLng(coordinates: number[][]): google.maps.LatLngLiteral[] {
  return coordinates.map((coord) => ({ lat: coord[1], lng: coord[0] }));
}

// Merge all territory polygons within a group into a flat list of paths
// For outlines we just draw each territory's polygon outline individually but
// with the shared group color — real polygon union would need JSTS which isn't available.
function buildGroupPolygons(territories: Territory[]): { label: string; paths: google.maps.LatLngLiteral[][] }[] {
  return territories
    .filter(t => t.boundary?.coordinates)
    .map(t => ({
      label: t.name,
      paths: [geoToLatLng(t.boundary.coordinates[0])],
    }));
}

export function TerritoryPolygons() {
  const {
    map,
    territories,
    showTerritoryBoundaries,
    showAreaBoundaries,
    showRegionBoundaries,
    setSelectedTerritory,
    setTerritoryPanelOpen,
  } = useMapStore();

  const [territoryPolygons, setTerritoryPolygons] = useState<PolygonData[]>([]);

  // Build per-territory polygon data
  useEffect(() => {
    if (!territories.length) return;
    const polys = territories
      .filter(t => t.boundary?.coordinates)
      .map(t => ({
        territory: t,
        paths: geoToLatLng(t.boundary.coordinates[0]),
      }));
    setTerritoryPolygons(polys);
  }, [territories]);

  // ── Area layer: group territories by .area, assign palette colors ──
  const areaGroups = useMemo(() => {
    const map = new Map<string, Territory[]>();
    territories.forEach(t => {
      const key = t.area || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries()).map(([area, terrs], idx) => ({
      area,
      color: AREA_COLORS[idx % AREA_COLORS.length],
      territories: terrs,
    }));
  }, [territories]);

  // ── Region layer: group territories by .region ────────────────
  const regionGroups = useMemo(() => {
    const map = new Map<string, Territory[]>();
    territories.forEach(t => {
      const key = t.region || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries()).map(([region, terrs], idx) => ({
      region,
      color: REGION_COLORS[idx % REGION_COLORS.length],
      territories: terrs,
    }));
  }, [territories]);

  if (!map) return null;

  return (
    <>
      {/* ── Layer 1: Territory boundaries (thin, unique per-territory color) ── */}
      {showTerritoryBoundaries && territoryPolygons.map(({ territory, paths }) => {
        const colors = getTerritoryUniqueColor(territory);
        return (
          <Polygon
            key={`terr-${territory.id}`}
            paths={paths}
            options={{
              strokeColor: colors.stroke,
              strokeOpacity: 0.85,
              strokeWeight: 2,
              fillColor: colors.fill,
              fillOpacity: 0.12,
              clickable: true,
              zIndex: 1,
            }}
            onClick={() => {
              setSelectedTerritory(territory);
              setTerritoryPanelOpen(true);
            }}
            onMouseOver={() => map.setOptions({ draggableCursor: 'pointer' })}
            onMouseOut={() => map.setOptions({ draggableCursor: null })}
          />
        );
      })}

      {/* ── Layer 2: Area boundaries (medium line, grouped color) ── */}
      {showAreaBoundaries && areaGroups.map(({ area, color, territories: areaTerms }) =>
        areaTerms
          .filter(t => t.boundary?.coordinates)
          .map(t => (
            <Polyline
              key={`area-${area}-${t.id}`}
              path={geoToLatLng(t.boundary.coordinates[0])}
              options={{
                strokeColor: color,
                strokeOpacity: 1.0,
                strokeWeight: 4,
                zIndex: 5,
                icons: [{
                  icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
                  offset: '0',
                  repeat: '18px',
                }],
              }}
            />
          ))
      )}

      {/* ── Layer 3: Region boundaries (thickest, solid) ── */}
      {showRegionBoundaries && regionGroups.map(({ region, color, territories: regTerms }) =>
        regTerms
          .filter(t => t.boundary?.coordinates)
          .map(t => (
            <Polyline
              key={`region-${region}-${t.id}`}
              path={geoToLatLng(t.boundary.coordinates[0])}
              options={{
                strokeColor: color,
                strokeOpacity: 0.9,
                strokeWeight: 7,
                zIndex: 10,
              }}
            />
          ))
      )}
    </>
  );
}
