// ============================================================
// GPS Validation Hook — For Visit Check-ins
// Validates sales rep is within 200m and not moving too fast
// ============================================================

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { GPSValidationResult } from '@/types';

interface UseGPSValidationProps {
    customerLat: number;
    customerLng: number;
}

export function useGPSValidation({ customerLat, customerLng }: UseGPSValidationProps) {
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<GPSValidationResult | null>(null);

    const validateCheckIn = async (
        checkInLat: number,
        checkInLng: number,
        speed: number = 0
    ): Promise<GPSValidationResult> => {
        setIsValidating(true);

        try {
            const { data, error } = await supabase.rpc('validate_gps_checkin', {
                p_customer_lat: customerLat,
                p_customer_lng: customerLng,
                p_checkin_lat: checkInLat,
                p_checkin_lng: checkInLng,
                p_speed: speed,
            });

            if (error) throw error;

            const result: GPSValidationResult = data[0];
            setValidationResult(result);
            return result;
        } catch (error) {
            console.error('GPS validation error:', error);
            throw error;
        } finally {
            setIsValidating(false);
        }
    };

    const getCurrentPosition = (): Promise<{ lat: number; lng: number; speed: number }> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        speed: position.coords.speed ? position.coords.speed * 3.6 : 0, // Convert m/s to km/h
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        });
    };

    return {
        validateCheckIn,
        getCurrentPosition,
        isValidating,
        validationResult,
    };
}
