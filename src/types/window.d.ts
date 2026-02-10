export { };

declare global {
    interface Window {
        env: {
            VITE_SUPABASE_URL: string;
            VITE_SUPABASE_ANON_KEY: string;
            VITE_SUPABASE_SERVICE_ROLE_KEY: string;
            VITE_GOOGLE_MAPS_API_KEY: string;
            VITE_APP_NAME: string;
            VITE_APP_VERSION: string;
            VITE_NODE_ENV: string;
        };
    }
}
