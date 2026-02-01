// ============================================================
// AMAN CEMENT CRM — Demand Heatmap Layer
// ============================================================

import { useEffect, useState } from 'react';
import { HeatmapLayer as GoogleHeatmapLayer } from '@react-google-maps/api';
import { useMapStore } from '@/store/mapStore';
import { HEATMAP_GRADIENT } from '@/lib/constants';

export function HeatmapLayer() {
  const { map, showHeatmap, filteredCustomers } = useMapStore();
  const [heatmapData, setHeatmapData] = useState<google.maps.visualization.WeightedLocation[]>([]);

  useEffect(() => {
    if (!showHeatmap || !filteredCustomers.length) {
      setHeatmapData([]);
      return;
    }

    // Create weighted heatmap points based on customer data
    const points = filteredCustomers
      .filter((customer) => customer.status !== 'archived')
      .map((customer) => {
        const position = new google.maps.LatLng(customer.latitude, customer.longitude);
        
        // Weight based on pipeline type
        let weight = 1;
        const pipelineData = customer.pipeline_data as any;
        
        if (customer.pipeline === 'recurring') {
          // Weight by monthly volume for recurring customers
          weight = pipelineData?.monthly_sales?.reduce(
            (sum: number, brand: any) => sum + (brand.monthlySales || 0), 
            0
          ) || 1;
        } else {
          // Weight by cement requirement for project customers
          weight = pipelineData?.cement_requirement_tons || 1;
        }

        return {
          location: position,
          weight: Math.max(weight, 1),
        };
      });

    setHeatmapData(points);
  }, [showHeatmap, filteredCustomers]);

  if (!map || !showHeatmap || heatmapData.length === 0) return null;

  return (
    <GoogleHeatmapLayer
      data={heatmapData}
      options={{
        radius: 45,
        opacity: 0.55,
        gradient: HEATMAP_GRADIENT,
      }}
    />
  );
}
