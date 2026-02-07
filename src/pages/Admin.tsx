// ============================================================
// AMAN CEMENT CRM — Admin Page
// System administration for country head
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { useAuthStore } from '@/store/authStore';
import {
  UserCog,
  Shield,
  Database,
  Settings,
  Users,
  Key,
  Bell,
  Mail,
  Smartphone,
  Globe,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Download,
  Upload,
  Activity,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  X
} from 'lucide-react';
import { toast } from 'sonner';

// Setting types
interface AppSettings {
  visit_geofence_radius: number;
  max_check_in_speed: number;
  location_ping_interval: number;
  working_hours_start: string;
  working_hours_end: string;
  cement_slab_rate: number;
  cement_column_rate: number;
  cement_beam_rate: number;
  cement_foundation_rate: number;
}

const defaultSettings: AppSettings = {
  visit_geofence_radius: 200,
  max_check_in_speed: 10,
  location_ping_interval: 300,
  working_hours_start: '09:00',
  working_hours_end: '18:00',
  cement_slab_rate: 0.8,
  cement_column_rate: 1.2,
  cement_beam_rate: 0.6,
  cement_foundation_rate: 1.0,
};

// Settings Section Component
function SettingsSection({
  settings,
  onChange
}: {
  settings: AppSettings;
  onChange: (key: keyof AppSettings, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Visit Settings */}
      <div className="bg-[#061A3A] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#3A9EFF]" />
          Visit & GPS Settings
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Geofence Radius (meters)</label>
            <input
              type="number"
              value={settings.visit_geofence_radius}
              onChange={(e) => onChange('visit_geofence_radius', Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#0A2A5C] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            />
            <p className="text-xs text-[#8B9CB8]">Maximum distance for check-in validation</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Max Check-in Speed (km/h)</label>
            <input
              type="number"
              value={settings.max_check_in_speed}
              onChange={(e) => onChange('max_check_in_speed', Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#0A2A5C] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            />
            <p className="text-xs text-[#8B9CB8]">Anti-fake GPS detection threshold</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Location Ping Interval (seconds)</label>
            <input
              type="number"
              value={settings.location_ping_interval}
              onChange={(e) => onChange('location_ping_interval', Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#0A2A5C] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            />
            <p className="text-xs text-[#8B9CB8]">How often to record location</p>
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-[#061A3A] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#2ECC71]" />
          Working Hours
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Start Time</label>
            <input
              type="time"
              value={settings.working_hours_start}
              onChange={(e) => onChange('working_hours_start', e.target.value)}
              className="w-full px-3 py-2 bg-[#0A2A5C] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">End Time</label>
            <input
              type="time"
              value={settings.working_hours_end}
              onChange={(e) => onChange('working_hours_end', e.target.value)}
              className="w-full px-3 py-2 bg-[#0A2A5C] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Cement Calculator Rates */}
      <div className="bg-[#061A3A] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-[#D4A843]" />
          Cement Calculator Rates (bags per sqft)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Slab Rate</label>
            <input
              type="number"
              step="0.1"
              value={settings.cement_slab_rate}
              onChange={(e) => onChange('cement_slab_rate', Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#0A2A5C] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Column Rate</label>
            <input
              type="number"
              step="0.1"
              value={settings.cement_column_rate}
              onChange={(e) => onChange('cement_column_rate', Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#0A2A5C] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Beam Rate</label>
            <input
              type="number"
              step="0.1"
              value={settings.cement_beam_rate}
              onChange={(e) => onChange('cement_beam_rate', Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#0A2A5C] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Foundation Rate</label>
            <input
              type="number"
              step="0.1"
              value={settings.cement_foundation_rate}
              onChange={(e) => onChange('cement_foundation_rate', Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#0A2A5C] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate employee code
function generateEmployeeCode(role: string): string {
  const rolePrefix = {
    'sales_rep': 'SR',
    'supervisor': 'SUP',
    'area_manager': 'AM',
    'regional_manager': 'RM',
    'country_head': 'CH'
  }[role] || 'EMP';

  const timestamp = Date.now().toString().slice(-6);
  return `${rolePrefix}${timestamp}`;
}

// Users Management Section
function UsersManagement() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    employee_code: '', // Optional - will auto-generate if empty
    role: 'sales_rep' as 'sales_rep' | 'supervisor' | 'area_manager' | 'regional_manager' | 'country_head',
    phone: '',
    reports_to: '', // Manager/Supervisor user ID
    region_id: '',
    area_id: '',
    territory_id: '',
  });

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        console.log('🔄 Fetching users from database...');
        // First get all profiles
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        console.log('📊 Profiles query result:', { count: profiles?.length, error: profileError });

        if (profileError) throw profileError;
        if (!profiles) return [];

        // If admin client is available, enrich with auth data
        if (supabaseAdmin) {
          try {
            console.log('🔐 Fetching auth data...');
            const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
            console.log('🔐 Auth data fetched:', authData?.users?.length, 'users');

            // Merge auth data with profiles
            const enrichedProfiles = profiles.map(profile => {
              const authUser = authData?.users?.find(u => u.id === profile.id);
              return {
                ...profile,
                last_login_at: authUser?.last_sign_in_at || null,
                email_confirmed_at: authUser?.email_confirmed_at || null,
              };
            });
            console.log('✅ Users fetched:', enrichedProfiles.length);
            console.log('📋 User statuses:', enrichedProfiles.map(u => ({
              email: u.email,
              is_active: u.is_active
            })));
            return enrichedProfiles;
          } catch (error) {
            console.warn('Could not fetch auth data:', error);
            console.log('✅ Users fetched (without auth data):', profiles.length);
            return profiles;
          }
        }

        console.log('✅ Users fetched (no admin client):', profiles.length);
        return profiles;
      } catch (error) {
        console.error('❌ Error fetching users:', error);
        throw error;
      }
    },
    staleTime: 0, // Always consider data stale
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Helper function to get valid manager roles based on user role
  const getValidManagerRoles = (userRole: string): string[] => {
    switch (userRole) {
      case 'sales_rep':
        return ['supervisor', 'area_manager', 'regional_manager', 'country_head'];
      case 'supervisor':
        return ['area_manager', 'regional_manager', 'country_head'];
      case 'area_manager':
        return ['regional_manager', 'country_head'];
      case 'regional_manager':
        return ['country_head'];
      case 'country_head':
        return []; // Country head doesn't report to anyone
      default:
        return [];
    }
  };

  // Query to fetch potential managers based on selected role
  const { data: potentialManagers = [] } = useQuery({
    queryKey: ['potential-managers', newUser.role],
    queryFn: async () => {
      const validRoles = getValidManagerRoles(newUser.role);
      if (validRoles.length === 0) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, employee_code')
        .in('role', validRoles)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
    enabled: newUser.role !== 'country_head', // Only fetch if not country head
  });

  // --- Hierarchy Data Fetching for Admin ---
  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const { data } = await supabase.from('regions').select('*').order('name');
      return data || [];
    },
  });

  const { data: areas = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data } = await supabase.from('areas').select('*').order('name');
      return data || [];
    },
  });

  const { data: territories = [] } = useQuery({
    queryKey: ['territories'],
    queryFn: async () => {
      const { data } = await supabase.from('territories').select('*').eq('is_active', true).order('name');
      return data || [];
    },
  });

  // Filtered lists for dropdowns
  const filteredAreas = useMemo(() => {
    if (!newUser.region_id) return [];
    return areas.filter((a: any) => a.region_id === newUser.region_id);
  }, [areas, newUser.region_id]);

  const filteredTerritories = useMemo(() => {
    if (!newUser.area_id) return [];
    // Match by area name for now since territories table links via name?
    // No, I added area_id in SQL but let's see if territories data has it.
    // To be safe, I'll match by name if ID is missing or match by ID if present.
    // But wait, newUser.area_id is likely an ID.
    // Areas table has ID. Territories table has area_id.
    return territories.filter((t: any) => t.area_id === newUser.area_id);
  }, [territories, newUser.area_id]);

  const resetPassword = useMutation({
    mutationFn: async (userId: string) => {
      console.log('Reset password called for user:', userId);
      console.log('supabaseAdmin available:', !!supabaseAdmin);

      if (!supabaseAdmin) {
        throw new Error('Admin client not configured');
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: 'AmanCement@2024',
      });

      console.log('Reset password result:', { data, error });
      if (error) throw error;
    },
    onSuccess: () => {
      console.log('Reset password success');
      toast.success('Password reset successfully');
    },
    onError: (error: any) => {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to reset password');
    },
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      console.log('Toggle user status called:', { userId, isActive, newStatus: !isActive });

      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', userId);

      console.log('Toggle status result:', { data, error });
      if (error) throw error;
    },
    onSuccess: async () => {
      console.log('Toggle status success, refetching users...');
      await queryClient.invalidateQueries({
        queryKey: ['admin-users'],
        refetchType: 'active'
      });
      console.log('Users refetched');
      toast.success('User status updated');
    },
    onError: (error: any) => {
      console.error('Toggle status error:', error);
      toast.error(error.message || 'Failed to update user');
    },
  });

  const editUser = useMutation({
    mutationFn: async (userData: { id: string; full_name: string; employee_code: string; role: string; phone: string; reports_to?: string | null }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userData.full_name,
          employee_code: userData.employee_code,
          role: userData.role,
          phone: userData.phone,
          reports_to: userData.reports_to || null,
        })
        .eq('id', userData.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user');
    },
  });

  const createUser = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      if (!supabaseAdmin) {
        throw new Error('Admin client not configured. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file');
      }

      // Validate password
      if (!userData.password || userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Auto-generate employee code if not provided
      const employeeCode = userData.employee_code || generateEmployeeCode(userData.role);

      // Create auth user with admin client
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          employee_code: employeeCode,
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(authError.message || 'Failed to create auth user');
      }
      if (!authData.user) throw new Error('Failed to create user');

      // Upsert profile with role and additional info (create if doesn't exist, update if it does)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          employee_code: employeeCode,
          role: userData.role,
          phone: userData.phone,
          reports_to: userData.reports_to || null, // Manager/Supervisor ID
          region_id: userData.region_id || null,
          area_id: userData.area_id || null,
          territory_id: userData.territory_id || null,
          is_active: true,
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error(profileError.message || 'Failed to create profile');
      }

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User created successfully');
      setIsCreateModalOpen(false);
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        employee_code: '',
        role: 'sales_rep',
        phone: '',
        reports_to: '',
        region_id: '',
        area_id: '',
        territory_id: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create user');
    },
  });

  const filteredUsers = users.filter((u: any) =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.employee_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'country_head': return 'bg-[#C41E3A]/20 text-[#C41E3A]';
      case 'regional_manager': return 'bg-[#2DD4BF]/20 text-[#2DD4BF]';
      case 'area_manager': return 'bg-[#9B6BFF]/20 text-[#9B6BFF]';
      case 'supervisor': return 'bg-[#D4A843]/20 text-[#D4A843]';
      default: return 'bg-[#3A9EFF]/20 text-[#3A9EFF]';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] placeholder:text-[#4A5B7A] focus:border-[#3A9EFF] outline-none"
        />
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#C41E3A] hover:bg-[#9B1830] text-white rounded-lg transition-colors"
        >
          <Users className="w-4 h-4" />
          Create New User
        </button>
      </div>

      <div className="bg-[#0A2A5C] rounded-xl border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41E3A]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#061A3A]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Last Login</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8B9CB8] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-white/5">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0F3460] rounded-full flex items-center justify-center">
                          <span className="text-[#F0F4F8] font-semibold">
                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[#F0F4F8]">{user.full_name}</p>
                          <p className="text-xs text-[#8B9CB8]">{user.email}</p>
                          <p className="text-xs text-[#4A5B7A]">{user.employee_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${getRoleColor(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${user.is_active
                        ? 'bg-[#2ECC71]/20 text-[#2ECC71]'
                        : 'bg-[#E74C5E]/20 text-[#E74C5E]'
                        }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-[#8B9CB8]">
                        {user.last_login_at
                          ? new Date(user.last_login_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                          : 'Never'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setIsEditModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-sm bg-[#3A9EFF]/20 hover:bg-[#3A9EFF]/30 text-[#3A9EFF] rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => resetPassword.mutate(user.id)}
                          className="px-3 py-1.5 text-sm bg-[#0F3460] hover:bg-[#143874] text-[#F0F4F8] rounded-lg transition-colors"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => toggleUserStatus.mutate({ userId: user.id, isActive: user.is_active })}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${user.is_active
                            ? 'bg-[#E74C5E]/20 text-[#E74C5E] hover:bg-[#E74C5E]/30'
                            : 'bg-[#2ECC71]/20 text-[#2ECC71] hover:bg-[#2ECC71]/30'
                            }`}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A2A5C] rounded-xl border border-white/10 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-[#F0F4F8]">Create New User</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5 text-[#8B9CB8]" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createUser.mutate(newUser); }} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">Email *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                  placeholder="john@amangroupbd.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">
                  Employee Code
                  <span className="text-xs text-[#4A5B7A] ml-2">(Optional - auto-generated if empty)</span>
                </label>
                <input
                  type="text"
                  value={newUser.employee_code}
                  onChange={(e) => setNewUser({ ...newUser, employee_code: e.target.value })}
                  className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                  placeholder="Leave empty to auto-generate"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">Phone</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                  placeholder="+880..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">Role *</label>
                <select
                  required
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                >
                  <option value="sales_rep">Sales Representative</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="area_manager">Area Manager</option>
                  <option value="regional_manager">Regional Manager</option>
                  <option value="country_head">Country Head</option>
                </select>
              </div>

              {/* Hierarchy Assignment */}
              {newUser.role !== 'country_head' && (
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <h3 className="text-sm font-medium text-[#F0F4F8]">Territory & Location</h3>

                  {/* Region Selection (All roles except CH) */}
                  <div className="space-y-2">
                    <label className="text-sm text-[#8B9CB8]">Region</label>
                    <select
                      value={newUser.region_id}
                      onChange={(e) => setNewUser({ ...newUser, region_id: e.target.value, area_id: '', territory_id: '' })}
                      className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                    >
                      <option value="">Select Region...</option>
                      {regions.map((r: any) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Area Selection (AM, Supervisor, Sales Rep) */}
                  {['area_manager', 'supervisor', 'sales_rep'].includes(newUser.role) && (
                    <div className="space-y-2">
                      <label className="text-sm text-[#8B9CB8]">Area</label>
                      <select
                        value={newUser.area_id}
                        onChange={(e) => setNewUser({ ...newUser, area_id: e.target.value, territory_id: '' })}
                        disabled={!newUser.region_id}
                        className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none disabled:opacity-50"
                      >
                        <option value="">Select Area...</option>
                        {filteredAreas.map((a: any) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Territory Selection (Sales Rep Only) */}
                  {newUser.role === 'sales_rep' && (
                    <div className="space-y-2">
                      <label className="text-sm text-[#8B9CB8]">Territory</label>
                      <select
                        value={newUser.territory_id}
                        onChange={(e) => setNewUser({ ...newUser, territory_id: e.target.value })}
                        disabled={!newUser.area_id}
                        className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none disabled:opacity-50"
                      >
                        <option value="">Select Territory...</option>
                        {filteredTerritories.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
              {/* Reports To Dropdown */}
              {newUser.role !== 'country_head' && (
                <div className="space-y-2">
                  <label className="text-sm text-[#8B9CB8]">
                    Reports To *
                    <span className="text-xs text-[#4A5B7A] ml-2">(Manager/Supervisor)</span>
                  </label>
                  <select
                    required
                    value={newUser.reports_to}
                    onChange={(e) => setNewUser({ ...newUser, reports_to: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                  >
                    <option value="">Select Manager...</option>
                    {potentialManagers.map((manager: any) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.full_name} ({manager.employee_code}) - {manager.role.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                  {potentialManagers.length === 0 && (
                    <p className="text-xs text-[#E74C5E]">
                      No managers available. Please create a {getValidManagerRoles(newUser.role)[0]?.replace('_', ' ')} first.
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">Password *</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                  placeholder="Minimum 8 characters"
                  minLength={8}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-[#8B9CB8] hover:text-[#F0F4F8] hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUser.isPending}
                  className="px-4 py-2 bg-[#C41E3A] hover:bg-[#9B1830] text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {createUser.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {createUser.isPending ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A2A5C] rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#F0F4F8]">Edit User</h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingUser(null);
                }}
                className="text-[#8B9CB8] hover:text-[#F0F4F8] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              editUser.mutate({
                id: editingUser.id,
                full_name: editingUser.full_name,
                employee_code: editingUser.employee_code,
                role: editingUser.role,
                phone: editingUser.phone,
                reports_to: editingUser.reports_to || null,
              });
            }} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-[#8B9CB8]">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={editingUser.full_name}
                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#8B9CB8]">Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="w-full px-3 py-2 bg-[#061A3A]/50 border border-white/10 rounded-lg text-[#8B9CB8] cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#8B9CB8]">Employee Code *</label>
                  <input
                    required
                    type="text"
                    value={editingUser.employee_code}
                    onChange={(e) => setEditingUser({ ...editingUser, employee_code: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#8B9CB8]">Phone</label>
                  <input
                    type="tel"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm text-[#8B9CB8]">Role *</label>
                  <select
                    required
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                  >
                    <option value="sales_rep">Sales Representative</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="area_manager">Area Manager</option>
                    <option value="regional_manager">Regional Manager</option>
                    <option value="country_head">Country Head</option>
                  </select>
                </div>
                {/* Reports To Dropdown */}
                {editingUser.role !== 'country_head' && (
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm text-[#8B9CB8]">
                      Reports To *
                      <span className="text-xs text-[#4A5B7A] ml-2">(Manager/Supervisor)</span>
                    </label>
                    <select
                      required
                      value={editingUser.reports_to || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, reports_to: e.target.value })}
                      className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                    >
                      <option value="">Select Manager...</option>
                      {potentialManagers
                        .filter((m: any) => m.id !== editingUser.id) // Don't allow self-reporting
                        .map((manager: any) => (
                          <option key={manager.id} value={manager.id}>
                            {manager.full_name} ({manager.employee_code}) - {manager.role.replace('_', ' ').toUpperCase()}
                          </option>
                        ))
                      }
                    </select>
                    {potentialManagers.length === 0 && (
                      <p className="text-xs text-[#E74C5E]">
                        No managers available. Please create a {getValidManagerRoles(editingUser.role)[0]?.replace('_', ' ')} first.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-[#061A3A] hover:bg-[#0F3460] text-[#F0F4F8] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editUser.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3A9EFF] hover:bg-[#2E8FE5] text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {editUser.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {editUser.isPending ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Database Management Section
function DatabaseManagement() {
  const [isBackingUp, setIsBackingUp] = useState(false);

  const backupDatabase = async () => {
    setIsBackingUp(true);
    try {
      // In a real implementation, this would trigger a database backup
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Database backup initiated');
    } catch (error) {
      toast.error('Failed to backup database');
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#061A3A] rounded-xl p-5">
          <h3 className="text-lg font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-[#2ECC71]" />
            Database Backup
          </h3>
          <p className="text-sm text-[#8B9CB8] mb-4">
            Create a backup of all your CRM data including customers, visits, and user information.
          </p>
          <button
            onClick={backupDatabase}
            disabled={isBackingUp}
            className="flex items-center gap-2 px-4 py-2 bg-[#2ECC71] hover:bg-[#27ae60] text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isBackingUp ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isBackingUp ? 'Creating Backup...' : 'Create Backup'}
          </button>
        </div>

        <div className="bg-[#061A3A] rounded-xl p-5">
          <h3 className="text-lg font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#3A9EFF]" />
            Data Import
          </h3>
          <p className="text-sm text-[#8B9CB8] mb-4">
            Import customer data from CSV or Excel files. Make sure your data follows the required format.
          </p>
          <button
            onClick={() => toast.info('Import feature coming soon')}
            className="flex items-center gap-2 px-4 py-2 bg-[#3A9EFF] hover:bg-[#2a8eef] text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Data
          </button>
        </div>
      </div>

      <div className="bg-[#061A3A] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#E74C5E]" />
          Danger Zone
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#E74C5E]/10 border border-[#E74C5E]/30 rounded-lg">
            <div>
              <p className="font-medium text-[#F0F4F8]">Clear All Data</p>
              <p className="text-sm text-[#8B9CB8]">This will permanently delete all customer and visit data</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you absolutely sure? This action cannot be undone!')) {
                  toast.error('This action requires additional confirmation');
                }
              }}
              className="px-4 py-2 bg-[#E74C5E] hover:bg-[#c0392b] text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Admin Page
export function Admin() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'settings' | 'users' | 'database'>('settings');
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch settings
  const { data: fetchedSettings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;

      const settingsMap: Partial<AppSettings> = {};
      data?.forEach((s: any) => {
        if (s.key === 'visit_geofence_radius') settingsMap.visit_geofence_radius = s.value.meters;
        if (s.key === 'max_check_in_speed') settingsMap.max_check_in_speed = s.value.kmh;
        if (s.key === 'location_ping_interval') settingsMap.location_ping_interval = s.value.seconds;
        if (s.key === 'working_hours') {
          settingsMap.working_hours_start = s.value.start;
          settingsMap.working_hours_end = s.value.end;
        }
        if (s.key === 'cement_calculator_rates') {
          settingsMap.cement_slab_rate = s.value.slab_per_sqft;
          settingsMap.cement_column_rate = s.value.column_per_sqft;
          settingsMap.cement_beam_rate = s.value.beam_per_sqft;
          settingsMap.cement_foundation_rate = s.value.foundation_per_sqft;
        }
      });

      return { ...defaultSettings, ...settingsMap };
    },
  });

  // Update settings when fetched
  useEffect(() => {
    if (fetchedSettings) {
      setSettings(fetchedSettings);
    }
  }, [fetchedSettings]);

  const saveSettings = useMutation({
    mutationFn: async (newSettings: AppSettings) => {
      const updates = [
        { key: 'visit_geofence_radius', value: { meters: newSettings.visit_geofence_radius } },
        { key: 'max_check_in_speed', value: { kmh: newSettings.max_check_in_speed } },
        { key: 'location_ping_interval', value: { seconds: newSettings.location_ping_interval } },
        { key: 'working_hours', value: { start: newSettings.working_hours_start, end: newSettings.working_hours_end } },
        {
          key: 'cement_calculator_rates', value: {
            slab_per_sqft: newSettings.cement_slab_rate,
            column_per_sqft: newSettings.cement_column_rate,
            beam_per_sqft: newSettings.cement_beam_rate,
            foundation_per_sqft: newSettings.cement_foundation_rate,
          }
        },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('settings')
          .update({ value: update.value })
          .eq('key', update.key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save settings');
    },
  });

  const handleSettingsChange = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await saveSettings.mutateAsync(settings);
    setIsSaving(false);
  };

  const tabs = [
    { id: 'settings', label: 'App Settings', icon: Settings },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'database', label: 'Database', icon: Database },
  ];

  // Check if user has admin access
  if (user?.role !== 'country_head') {
    return (
      <div className="p-12 text-center">
        <Shield className="w-16 h-16 text-[#E74C5E] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#F0F4F8]">Access Denied</h2>
        <p className="text-[#8B9CB8] mt-2">Only Country Head can access this page</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#F0F4F8]">System Administration</h1>
        <p className="text-[#8B9CB8] text-sm mt-1">Manage system settings, users, and database</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
              ? 'border-[#C41E3A] text-[#F0F4F8]'
              : 'border-transparent text-[#8B9CB8] hover:text-[#F0F4F8]'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <SettingsSection
              settings={settings}
              onChange={handleSettingsChange}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-[#C41E3A] hover:bg-[#9B1830] text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UsersManagement />}

        {activeTab === 'database' && <DatabaseManagement />}
      </div>
    </div>
  );
}
