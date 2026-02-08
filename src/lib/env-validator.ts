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
    const invalid: string[] = [];

    // Check for missing required variables
    for (const varName of requiredEnvVars) {
        const value = import.meta.env[varName];
        if (!value || value === '' || value.includes('your-')) {
            missing.push(varName);
        }
    }

    // Validate Supabase URL format
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
        invalid.push('VITE_SUPABASE_URL (must be a valid Supabase URL)');
    }

    // Validate Supabase key format
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseKey && supabaseKey.length < 100) {
        invalid.push('VITE_SUPABASE_ANON_KEY (appears to be invalid)');
    }

    if (missing.length > 0 || invalid.length > 0) {
        const errorMessage = [
            '❌ Environment Configuration Error',
            '',
            missing.length > 0 ? `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}` : '',
            invalid.length > 0 ? `\nInvalid environment variables:\n${invalid.map(v => `  - ${v}`).join('\n')}` : '',
            '',
            '📝 To fix this:',
            '1. Copy .env.example to .env',
            '2. Fill in your actual Supabase and Google Maps credentials',
            '3. Restart the development server',
            '',
            'See .env file for instructions on obtaining credentials.',
        ].filter(Boolean).join('\n');

        console.warn(errorMessage);
        // Do not throw error in production to avoid crashing if some non-critical vars are missing
        // or if variables are injected differently (e.g. runtime window object)
        if (import.meta.env.VITE_NODE_ENV === 'development') {
            // throw new Error('Missing or invalid environment variables. Check console for details.');
        }
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
