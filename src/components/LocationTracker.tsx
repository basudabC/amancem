import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function LocationTracker() {
    const { user } = useAuthStore();
    const { data: settings } = useSettings();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // Cleanup previous interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Only track for sales_rep and if settings are loaded
        if (!user || user.role !== 'sales_rep' || !settings) return;

        const trackLocation = async () => {
            // 1. Check Working Hours
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const [startH, startM] = settings.working_hours_start.split(':').map(Number);
            const [endH, endM] = settings.working_hours_end.split(':').map(Number);
            const startTime = startH * 60 + startM;
            const endTime = endH * 60 + endM;

            if (currentTime < startTime || currentTime > endTime) {
                console.log('Skipping location ping: Outside working hours');
                return;
            }

            // 2. Get Location
            if (!navigator.geolocation) return;

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude, accuracy, speed, heading } = pos.coords;

                    try {
                        // 3. Insert into Supabase
                        const { error } = await supabase.from('location_pings').insert({
                            user_id: user.id,
                            lat: latitude,
                            lng: longitude,
                            accuracy,
                            speed: speed ? speed * 3.6 : 0, // km/h
                            heading,
                            battery_level: (await (navigator as any).getBattery?.())?.level * 100 || null,
                            is_moving: (speed || 0) > 0.5, // Moving if > 0.5 m/s
                            activity_type: (speed || 0) > 2 ? 'moving' : 'stationary'
                        });

                        if (error) {
                            console.error('Failed to log location:', error);
                        } else {
                            console.log('Location ping logged');
                        }
                    } catch (err) {
                        console.error('Error in location tracker:', err);
                    }
                },
                (err) => console.error('Geolocation error:', err),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        };

        // Initial ping
        trackLocation();

        // Set interval based on settings (convert seconds to ms)
        const intervalMs = (settings.location_ping_interval || 300) * 1000;
        intervalRef.current = setInterval(trackLocation, intervalMs);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [user, settings]);

    return null; // This component renders nothing
}
