import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AppSettings {
    visit_geofence_radius: number;
    max_check_in_speed: number;
    location_ping_interval: number;
    working_hours_start: string;
    working_hours_end: string;
    cement_slab_rate: number;
    cement_column_rate: number;
    cement_beam_rate: number;
    cement_foundation_rate: number;
}

export const defaultSettings: AppSettings = {
    visit_geofence_radius: 200,
    max_check_in_speed: 10,
    location_ping_interval: 300,
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    cement_slab_rate: 0.8,
    cement_column_rate: 1.2,
    cement_beam_rate: 0.6,
    cement_foundation_rate: 1.0,
};

export function useSettings() {
    return useQuery({
        queryKey: ['app-settings'],
        queryFn: async () => {
            const { data, error } = await supabase.from('settings').select('*');
            if (error) {
                console.error('Error fetching settings:', error);
                return defaultSettings;
            }

            const settingsMap: Partial<AppSettings> = {};
            data?.forEach((s: any) => {
                if (s.key === 'visit_geofence_radius') settingsMap.visit_geofence_radius = s.value.meters;
                if (s.key === 'max_check_in_speed') settingsMap.max_check_in_speed = s.value.kmh;
                if (s.key === 'location_ping_interval') settingsMap.location_ping_interval = s.value.seconds;
                if (s.key === 'working_hours') {
                    settingsMap.working_hours_start = s.value.start;
                    settingsMap.working_hours_end = s.value.end;
                }
                if (s.key === 'cement_calculator_rates') {
                    settingsMap.cement_slab_rate = s.value.slab_per_sqft;
                    settingsMap.cement_column_rate = s.value.column_per_sqft;
                    settingsMap.cement_beam_rate = s.value.beam_per_sqft;
                    settingsMap.cement_foundation_rate = s.value.foundation_per_sqft;
                }
            });

            return { ...defaultSettings, ...settingsMap };
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
}
