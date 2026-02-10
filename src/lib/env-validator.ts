// ============================================================
// AMAN CEMENT CRM — Environment Variable Validator
// ============================================================

interface EnvConfig {
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
    VITE_GOOGLE_MAPS_API_KEY: string;
    VITE_APP_NAME?: string;
    VITE_APP_VERSION?: string;
    VITE_NODE_ENV?: string;
}

const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_GOOGLE_MAPS_API_KEY',
] as const;

export function validateEnv(): EnvConfig {
    // Start with hardcoded fallbacks (matching supabase.ts)
    const fallbackUrl = 'https://iefcremzlaaauhapqhim.supabase.co';
    const fallbackAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllZmNyZW16bGFhYXVoYXBxaGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDIxOTEsImV4cCI6MjA4NTUxODE5MX0.CiceBaHMNGzdKZqzB2Ey7-MzHq1lEk5HGWE8HdsFHnI';

    // Explicitly check for Google Maps key availability
    const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    // Log warning only if Google Maps key is missing (since Supabase has fallbacks)
    if (!googleMapsKey) {
        console.warn('⚠️ Missing VITE_GOOGLE_MAPS_API_KEY - Maps features may not work');
    }

    return {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || fallbackUrl,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackAnonKey,
        VITE_GOOGLE_MAPS_API_KEY: googleMapsKey,
        VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'Aman Cement CRM',
        VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
        VITE_NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
    };
}

// Validate on module load
export const env = validateEnv();
