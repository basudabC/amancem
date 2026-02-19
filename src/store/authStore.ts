// ============================================================
// AMAN CEMENT CRM — Authentication State Management (Zustand)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, getCurrentUser } from '@/lib/supabase';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<{ error: any | null }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  canAccessTerritory: (territoryId: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setSession: (session) => set({ session }),

      setLoading: (isLoading) => set({ isLoading }),

      login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ isLoading: false });
            return { error };
          }

          if (!data.user) {
            set({ isLoading: false });
            return { error: new Error('No user data returned') };
          }

          // Fetch user details from profiles table
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (userError) {
            console.error('Profile fetch error:', userError);
            set({ isLoading: false });
            return { error: userError };
          }

          if (!userData) {
            set({ isLoading: false });
            return { error: new Error('Profile not found') };
          }

          set({
            user: userData as User,
            session: data.session,
            isAuthenticated: true,
            isLoading: false,
          });

          return { error: null };
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          return { error };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        await supabase.auth.signOut();
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      refreshUser: async () => {
        console.log('🔄 Refreshing user profile...');
        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('User refresh timeout')), 10000); // Increased to 10s
          });
          const userPromise = getCurrentUser();
          const user = await Promise.race([userPromise, timeoutPromise]) as any;

          if (user) {
            console.log('✅ User refreshed:', user.email);
            set({ user, isAuthenticated: true });
          } else {
            console.warn('⚠️ User refresh returned null, but not logging out immediately');
            // Check if we have a session but failed to get profile
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              set({ user: null, isAuthenticated: false });
            }
          }
        } catch (error: any) {
          console.error('❌ Refresh user failed:', error?.message);
          // Do NOT log out on timeout/error, trust the persisted state for now
          // unless proper auth error handling suggests otherwise
          if (error?.message === 'User refresh timeout') {
            console.log('ℹ️ Keeping existing user state due to timeout');
          } else {
            // For other errors, we might want to be more careful, but better to stay logged in than out
            // unless it's a 401
          }
        }
      },

      hasRole: (roles: UserRole[]) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },

      canAccessTerritory: (territoryId: string) => {
        const { user } = get();
        if (!user) return false;

        // Country head can access all territories
        if (user.role === 'country_head') return true;

        // Check if user's territories include the requested one
        return user.territory_ids?.includes(territoryId) ?? false;
      },
    }),
    {
      name: 'aman-auth-storage',
      partialize: (state) => ({ user: state.user, session: state.session }),
    }
  )
);

// Initialize auth state on app load
export const initializeAuth = async () => {
  const store = useAuthStore.getState();

  console.log('🔐 Initializing authentication...');
  store.setLoading(true);

  try {
    // Add timeout to prevent infinite loading - Increased to 15s for mobile
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Auth initialization timeout')), 15000);
    });

    const authPromise = (async () => {
      // Check for existing session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw sessionError;
      }

      if (session) {
        console.log('✅ Session found, verifying user...');
        store.setSession(session);
        // Attempt to refresh, but don't block everything if it fails (refreshUser handles its own errors)
        await store.refreshUser();
      } else {
        console.log('ℹ️ No active session found');
        // Clear state if definitely no session
        store.setUser(null);
        store.setSession(null);
      }
    })();

    await Promise.race([authPromise, timeoutPromise]);
  } catch (error: any) {
    console.error('❌ Auth initialization failed/timed out:', error?.message || error);
    // On timeout, if we have persisted user, let them stay logic
    const currentUser = store.user;
    if (currentUser) {
      console.log('⚠️ Recovering from timeout with persisted user');
      // Ensure isAuthenticated is true if we have a user
      useAuthStore.setState({ isAuthenticated: true });
    }
  } finally {
    console.log('✅ Auth initialization complete');
    store.setLoading(false);
  }

  // Listen for auth state changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔄 Auth state changed:', event);
    store.setSession(session);

    if (event === 'SIGNED_IN' && session) {
      await store.refreshUser();
    } else if (event === 'SIGNED_OUT') {
      store.setUser(null);
    }
  });
};
