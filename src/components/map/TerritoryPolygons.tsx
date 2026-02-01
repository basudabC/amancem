// ============================================================
// AMAN CEMENT CRM — Territory Polygons Component
// ============================================================

import { useEffect, useState } from 'react';
import { Polygon } from '@react-google-maps/api';
import { useMapStore } from '@/store/mapStore';
import { TERRITORY_COLORS } from '@/lib/constants';
import type { Territory } from '@/types';

interface PolygonData {
  territory: Territory;
  paths: google.maps.LatLngLiteral[];
}

export function TerritoryPolygons() {
  const { map, territories, setSelectedTerritory, setTerritoryPanelOpen } = useMapStore();
  const [polygons, setPolygons] = useState<PolygonData[]>([]);

  useEffect(() => {
    if (!territories.length) return;

    const polygonData = territories
      .filter(t => t.boundary && t.boundary.coordinates)
      .map((territory) => {
        // Convert GeoJSON coordinates to Google Maps LatLng
        const coords = territory.boundary.coordinates[0];
        const paths = coords.map((coord: number[]) => ({
          lat: coord[1], // GeoJSON is [lng, lat]
          lng: coord[0],
        }));

        return { territory, paths };
      });

    setPolygons(polygonData);
  }, [territories]);

  const handlePolygonClick = (territory: Territory) => {
    setSelectedTerritory(territory);
    setTerritoryPanelOpen(true);
  };

  if (!map) return null;

  return (
    <>
      {polygons.map(({ territory, paths }) => {
        const colors = TERRITORY_COLORS[territory.color_key] || TERRITORY_COLORS.territory_a;
        
        return (
          <Polygon
            key={territory.id}
            paths={paths}
            options={{
              strokeColor: colors.stroke,
              strokeOpacity: 0.9,
              strokeWeight: 2.5,
              fillColor: colors.fill,
              fillOpacity: 0.18,
              clickable: true,
              zIndex: 1,
            }}
            onClick={() => handlePolygonClick(territory)}
            onMouseOver={() => {
              if (map) {
                map.setOptions({ draggableCursor: 'pointer' });
              }
            }}
            onMouseOut={() => {
              if (map) {
                map.setOptions({ draggableCursor: null });
              }
            }}
          />
        );
      })}
    </>
  );
}
