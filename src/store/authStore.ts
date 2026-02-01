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
            setTimeout(() => reject(new Error('User refresh timeout')), 3000);
          });
          const userPromise = getCurrentUser();
          const user = await Promise.race([userPromise, timeoutPromise]) as any;
          console.log('✅ User refreshed:', user?.email || 'No user');
          set({ user, isAuthenticated: !!user });
        } catch (error: any) {
          console.error('❌ Refresh user failed:', error?.message);
          set({ user: null, isAuthenticated: false });
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
    // Add timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Auth initialization timeout')), 5000);
    });

    const authPromise = (async () => {
      // Check for existing session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw sessionError;
      }

      if (session) {
        console.log('✅ Session found, loading user profile...');
        store.setSession(session);
        await store.refreshUser();
      } else {
        console.log('ℹ️ No active session found');
      }
    })();

    await Promise.race([authPromise, timeoutPromise]);
  } catch (error: any) {
    console.error('❌ Auth initialization failed:', error?.message || error);
    // Don't throw - just continue with no user
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
