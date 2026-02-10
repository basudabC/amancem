// ============================================================
// AMAN CEMENT CRM — Google Maps Container Component
// ============================================================

import { useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useMapStore } from '@/store/mapStore';
import { MAP_CONFIG, AMAN_MAP_STYLES } from '@/lib/constants';
import { TerritoryPolygons } from './TerritoryPolygons';
import { CustomerMarkers } from './CustomerMarkers';
import { HeatmapLayer } from './HeatmapLayer';
import { MapControls } from './MapControls';
import { TerritoryPanel } from './TerritoryPanel';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

export function MapContainer() {
  const { setMap } = useMapStore();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: window.env?.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['visualization', 'geometry'],
  });

  // Create mapOptions only after Google Maps API is loaded
  const mapOptions: google.maps.MapOptions | undefined = useMemo(() => {
    if (!isLoaded) return undefined;

    return {
      center: MAP_CONFIG.defaultCenter,
      zoom: MAP_CONFIG.defaultZoom,
      styles: AMAN_MAP_STYLES,
      mapTypeId: 'roadmap',
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      scaleControl: false,
      gestureHandling: 'greedy',
    };
  }, [isLoaded]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, [setMap]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, [setMap]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-[#061A3A]">
        <div className="text-center p-8">
          <div className="text-[#E74C5E] text-4xl mb-4">⚠️</div>
          <h3 className="text-[#F0F4F8] text-lg font-semibold mb-2">
            Failed to load Google Maps
          </h3>
          <p className="text-[#8B9CB8] text-sm">
            Please check your API key and internet connection.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-[#061A3A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C41E3A] mb-4 mx-auto"></div>
          <p className="text-[#8B9CB8] text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        <TerritoryPolygons />
        <CustomerMarkers />
        <HeatmapLayer />
      </GoogleMap>

      {/* Map Controls Overlay */}
      <MapControls />

      {/* Territory Info Panel */}
      <TerritoryPanel />
    </div>
  );
}
