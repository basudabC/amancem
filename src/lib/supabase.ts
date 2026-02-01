// ============================================================
// AMAN CEMENT CRM — Supabase Client Configuration
// ============================================================

import { createClient } from '@supabase/supabase-js';

// Supabase configuration - Replace with your actual credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client without strict typing
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Auth helpers
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      return null;
    }

    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getCurrentUser:', error);
    return null;
  }
};

// Real-time subscriptions
export const subscribeToLocationPings = (callback: (payload: any) => void) => {
  return supabase
    .channel('location_pings')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'location_pings' },
      callback
    )
    .subscribe();
};

export const subscribeToVisits = (callback: (payload: any) => void) => {
  return supabase
    .channel('visits')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'visits' },
      callback
    )
    .subscribe();
};
