// ============================================================
// AMAN CEMENT CRM — Visit & Check-in Hooks
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { MAP_CONFIG } from '@/lib/constants';
import type { Visit } from '@/types';

// Calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Validate check-in location
export function validateCheckIn(
  customerLat: number,
  customerLng: number,
  checkInLat: number,
  checkInLng: number,
  speed?: number
): { valid: boolean; distance: number; message?: string } {
  const distance = calculateDistance(customerLat, customerLng, checkInLat, checkInLng);

  // Check distance
  if (distance > MAP_CONFIG.checkInRadius) {
    return {
      valid: false,
      distance,
      message: `You are ${Math.round(distance)} meters away from the customer location. Must be within ${MAP_CONFIG.checkInRadius} meters.`,
    };
  }

  // Check speed (anti-fake)
  if (speed !== undefined && speed > MAP_CONFIG.maxCheckInSpeed) {
    return {
      valid: false,
      distance,
      message: `Cannot check in while moving at ${Math.round(speed)} km/h. Please stop and try again.`,
    };
  }

  return { valid: true, distance };
}

// Fetch today's visits (for single rep OR team based on RLS)
export const useTodayVisits = (salesRepId?: string, includeTeam: boolean = false) => {
  return useQuery({
    queryKey: ['today-visits', salesRepId, includeTeam],
    queryFn: async (): Promise<Visit[]> => {
      const today = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('visits')
        .select(`
          *,
          customers:customer_id (name, pipeline, lat, lng)
        `)
        .gte('created_at', today)
        .order('created_at', { ascending: false });

      if (salesRepId) {
        query = query.eq('sales_rep_id', salesRepId);
      }
      // If no salesRepId provided, RLS handles visibility (e.g. for supervisors seeing team)

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        customer_id: item.customer_id,
        sales_rep_id: item.sales_rep_id,
        checkin_lat: item.checkin_lat,
        checkin_lng: item.checkin_lng,
        checkin_at: item.checkin_at,
        outcome: item.outcome,
        note: item.note,
        voice_memo_url: item.voice_memo_url,
        completed: item.status === 'completed',
        status: item.status || 'in_progress',
        created_at: item.created_at,
        updated_at: item.created_at, // Fallback if missing
        customer_name: item.customers?.name,
        customer_pipeline: item.customers?.pipeline,
        // Map available coordinates
        customer_lat: item.customers?.lat || item.customers?.latitude,
        customer_lng: item.customers?.lng || item.customers?.longitude,
      })) as Visit[];
    },
    // Enabled if salesRepId is provided OR includeTeam is true
    enabled: !!salesRepId || includeTeam,
  });
};

// Fetch visits by date range
export const useVisitsByDateRange = (
  salesRepId?: string,
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: ['visits-range', salesRepId, startDate, endDate],
    queryFn: async (): Promise<Visit[]> => {
      if (!salesRepId || !startDate || !endDate) return [];

      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          customers:customer_id (name, pipeline)
        `)
        .eq('sales_rep_id', salesRepId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        customer_id: item.customer_id,
        sales_rep_id: item.sales_rep_id,
        checkin_lat: item.checkin_lat,
        checkin_lng: item.checkin_lng,
        checkin_at: item.checkin_at,
        outcome: item.outcome,
        note: item.note,
        voice_memo_url: item.voice_memo_url,
        completed: item.status === 'completed',
        status: item.status || 'in_progress',
        created_at: item.created_at,
        updated_at: item.created_at,
        customer_name: item.customers?.name,
        customer_pipeline: item.customers?.pipeline,
      })) as Visit[];
    },
    enabled: !!salesRepId && !!startDate && !!endDate,
  });
};

// Start visit with check-in
export const useStartVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      salesRepId,
      checkInLat,
      checkInLng,
    }: {
      customerId: string;
      salesRepId: string;
      checkInLat: number;
      checkInLng: number;
    }) => {
      const { data, error } = await supabase
        .from('visits')
        .insert({
          customer_id: customerId,
          sales_rep_id: salesRepId,
          checkin_lat: checkInLat,
          checkin_lng: checkInLng,
          checkin_at: new Date().toISOString(),
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-visits'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
};

// Complete visit with outcome
export const useCompleteVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      visitId,
      outcome,
      note,
    }: {
      visitId: string;
      outcome: string;
      note?: string;
    }) => {
      const { data, error } = await supabase
        .from('visits')
        .update({
          outcome,
          note,
          completed: true,
        })
        .eq('id', visitId)
        .select()
        .single();

      if (error) throw error;

      // Update customer's last outcome
      const { data: visit } = await supabase
        .from('visits')
        .select('customer_id')
        .eq('id', visitId)
        .single();

      if (visit) {
        await supabase
          .from('customers')
          .update({ last_outcome: outcome })
          .eq('id', (visit as any).customer_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-visits'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

// Get current GPS position
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

// Watch position for live tracking
export const watchPosition = (
  callback: (position: GeolocationPosition) => void,
  errorCallback?: (error: GeolocationPositionError) => void
): number => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser');
  }

  return navigator.geolocation.watchPosition(
    callback,
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
};

// Clear position watch
export const clearPositionWatch = (watchId: number) => {
  navigator.geolocation.clearWatch(watchId);
};
