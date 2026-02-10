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
    const missing: string[] = [];

    // Check for missing required variables
    for (const varName of requiredEnvVars) {
        // Use import.meta.env directly
        const value = import.meta.env[varName];
        if (!value || value === '' || value.includes('your-')) {
            missing.push(varName);
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing or invalid environment variables: ${missing.join(', ')}. ` +
            `Please check your .env file or environment configuration.`
        );
    }

    return {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
        VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'Aman Cement CRM',
        VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
        VITE_NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
    };
}

// Validate on module load
export const env = validateEnv();
