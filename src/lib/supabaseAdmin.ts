// ============================================================
// SUPABASE ADMIN CLIENT
// Uses service role key for admin operations
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = window.env?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = window.env?.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    // console.warn('Missing VITE_SUPABASE_URL environment variable - Admin client disabled');
}

if (!supabaseServiceRoleKey) {
    console.warn('Missing VITE_SUPABASE_SERVICE_ROLE_KEY - admin features will be limited');
}

// Admin client with service role privileges
// ONLY use this for admin operations like creating users
export const supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;
