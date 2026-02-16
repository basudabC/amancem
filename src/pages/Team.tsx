// ============================================================
// AMAN CEMENT CRM — Team Page
// Team management for supervisors and managers
// ============================================================

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';
import {
  Users,
  Search,
  Plus,
  Filter,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  Target,
  CalendarCheck,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Shield,
  Award,
  X,
  CheckCircle2,
  Map,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Team Member Form Modal
interface TeamFormData {
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  employee_code: string;
  territory_ids: string[];
  target_monthly: number;
  division: string;
  region: string;
  area: string;
}

const initialFormData: TeamFormData = {
  full_name: '',
  email: '',
  phone: '',
  role: 'sales_rep',
  employee_code: '',
  territory_ids: [],
  target_monthly: 0,
  division: '',
  region: '',
  area: '',
};

const roles: { value: UserRole; label: string; color: string }[] = [
  { value: 'sales_rep', label: 'Sales Representative', color: 'bg-[#3A9EFF]' },
  { value: 'supervisor', label: 'Supervisor', color: 'bg-[#D4A843]' },
  { value: 'area_manager', label: 'Area Manager', color: 'bg-[#9B6BFF]' },
  { value: 'regional_manager', label: 'Regional Manager', color: 'bg-[#2DD4BF]' },
  { value: 'division_head', label: 'Division Head', color: 'bg-[#F97316]' }, // Orange
  { value: 'country_head', label: 'Country Head', color: 'bg-[#C41E3A]' },
];

function TeamMemberModal({
  isOpen,
  onClose,
  member,
  territories
}: {
  isOpen: boolean;
  onClose: () => void;
  member?: any | null;
  territories: any[];
}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Determine which roles can be assigned based on current user's role
  const availableRoles = useMemo(() => {
    if (user?.role === 'country_head') return roles;
    if (user?.role === 'division_head') return roles.filter(r => ['sales_rep', 'supervisor', 'area_manager', 'regional_manager'].includes(r.value));
    if (user?.role === 'regional_manager') return roles.filter(r => ['sales_rep', 'supervisor', 'area_manager'].includes(r.value));
    if (user?.role === 'area_manager') return roles.filter(r => ['sales_rep', 'supervisor'].includes(r.value));
    if (user?.role === 'supervisor') return roles.filter(r => r.value === 'sales_rep');
    return [];
  }, [user?.role]);

  const [formData, setFormData] = useState<TeamFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Hierarchy Data
  const { data: divisions = [] } = useQuery({
    queryKey: ['divisions'],
    queryFn: async () => {
      const { data } = await supabase.from('divisions').select('*').order('name');
      return data || [];
    },
  });

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

  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('');

  // Filtered Lists
  const filteredRegions = useMemo(() => {
    if (!selectedDivisionId) return [];
    return regions.filter((r: any) => r.division_id === selectedDivisionId);
  }, [regions, selectedDivisionId]);

  const filteredAreas = useMemo(() => {
    if (!formData.region) return [];
    const regionObj = regions.find((r: any) => r.name === formData.region);
    if (!regionObj) return [];
    return areas.filter((a: any) => a.region_id === regionObj.id);
  }, [areas, formData.region, regions]);


  useEffect(() => {
    if (member) {
      // Find division id from member's division name or imply from region
      let divId = '';
      if (member.region) {
        const regionObj = regions.find((r: any) => r.name === member.region);
        if (regionObj) divId = regionObj.division_id;
      }
      // If member has explicit division (after our migration), use that if available
      // For now relying on region implication is safer for old data, but new data will have it.

      setSelectedDivisionId(divId);

      setFormData({
        full_name: member.full_name || '',
        email: member.email || '',
        phone: member.phone || '',
        role: member.role || 'sales_rep',
        employee_code: member.employee_code || '',
        territory_ids: member.territory_ids || [],
        target_monthly: member.target_monthly || 0,
        division: member.division || '',
        region: member.region || '',
        area: member.area || '',
      });
    } else {
      setFormData(initialFormData);
      setSelectedDivisionId('');
    }
  }, [member, regions]);

  const saveMember = useMutation({
    mutationFn: async (data: TeamFormData) => {
      const profileData = {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        employee_code: data.employee_code,
        territory_ids: data.territory_ids,
        target_monthly: data.target_monthly,
        reports_to: user?.id,
        division: data.division,
        region: data.region,
        area: data.area,
      };

      if (member) {
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', member.id);
        if (error) throw error;
      } else {
        // Create auth user first (this would typically be done via edge function)
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: data.email,
          password: 'AmanCement@2024', // Default password
          email_confirm: true,
          user_metadata: {
            full_name: data.full_name,
            role: data.role,
            employee_code: data.employee_code,
          },
        });

        if (authError) {
          // Fallback: just create profile (requires manual auth setup)
          const { error } = await supabase.from('profiles').insert([profileData]);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success(member ? 'Team member updated' : 'Team member added');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save team member');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await saveMember.mutateAsync(formData);
    setIsSubmitting(false);
  };

  const toggleTerritory = (territoryId: string) => {
    setFormData(prev => ({
      ...prev,
      territory_ids: prev.territory_ids.includes(territoryId)
        ? prev.territory_ids.filter(id => id !== territoryId)
        : [...prev.territory_ids, territoryId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A2A5C] rounded-xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-[#F0F4F8]">
            {member ? 'Edit Team Member' : 'Add Team Member'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-[#8B9CB8]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[#8B9CB8]">Full Name *</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#8B9CB8]">Employee Code *</label>
              <input
                type="text"
                required
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                placeholder="EMP-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
              placeholder="+880..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Role *</label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            >
              {availableRoles.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* HIERARCHY FIELDS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[#8B9CB8]">Division</label>
              <select
                value={selectedDivisionId}
                onChange={(e) => {
                  const divId = e.target.value;
                  const divName = divisions.find((d: any) => d.id === divId)?.name || '';
                  setSelectedDivisionId(divId);
                  setFormData({ ...formData, division: divName, region: '', area: '' });
                }}
                className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
              >
                <option value="">Select Division</option>
                {divisions.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[#8B9CB8]">Region</label>
              <select
                value={formData.region}
                disabled={!selectedDivisionId}
                onChange={(e) => setFormData({ ...formData, region: e.target.value, area: '' })}
                className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none disabled:opacity-50"
              >
                <option value="">Select Region</option>
                {filteredRegions.map((r: any) => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Area</label>
            <select
              value={formData.area}
              disabled={!formData.region}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none disabled:opacity-50"
            >
              <option value="">Select Area</option>
              {filteredAreas.map((a: any) => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
          {/* END HIERARCHY FIELDS */}

          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Monthly Target (BDT)</label>
            <input
              type="number"
              value={formData.target_monthly}
              onChange={(e) => setFormData({ ...formData, target_monthly: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Assigned Territories</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-[#061A3A] rounded-lg border border-white/10">
              {territories.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-2 p-2 hover:bg-white/5 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.territory_ids.includes(t.id)}
                    onChange={() => toggleTerritory(t.id)}
                    className="w-4 h-4 rounded border-white/20 bg-[#061A3A] text-[#C41E3A]"
                  />
                  <span className="text-sm text-[#F0F4F8]">{t.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#8B9CB8] hover:text-[#F0F4F8] hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#C41E3A] hover:bg-[#9B1830] text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {member ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Team Page
export function Team() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Fetch team members
  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true);

      // Hierarchical visibility with recursive RPC
      if (user?.role !== 'country_head') {
        const { data: subordinates, error: rpcError } = await supabase
          .rpc('get_recursive_subordinates', { manager_id: user.id });

        if (rpcError) {
          console.error('Error fetching hierarchy:', rpcError);
          // Fallback to direct reports if RPC fails
          query = query.eq('reports_to', user.id);
        } else {
          // The RFC returns `id` as the column name
          const subordinateIds = subordinates.map((s: any) => s.id).filter(Boolean);
          // Include user and all recursive subordinates
          query = query.in('id', [user.id, ...subordinateIds]);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch territories
  const { data: territories = [] } = useQuery({
    queryKey: ['territories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('territories').select('*').eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch team performance stats
  const { data: performanceStats = {} } = useQuery({
    queryKey: ['team-performance'],
    queryFn: async () => {
      const memberIds = teamMembers.map(m => m.id);
      if (memberIds.length === 0) return {};

      // Get visit counts
      const { data: visits } = await supabase
        .from('visits')
        .select('sales_rep_id, status')
        .in('sales_rep_id', memberIds);

      // Get customer counts
      const { data: customers } = await supabase
        .from('customers')
        .select('assigned_to, is_converted')
        .in('assigned_to', memberIds);

      const stats: Record<string, { visits: number; customers: number; conversions: number }> = {};

      memberIds.forEach(id => {
        stats[id] = { visits: 0, customers: 0, conversions: 0 };
      });

      visits?.forEach(v => {
        if (stats[v.sales_rep_id]) {
          stats[v.sales_rep_id].visits++;
        }
      });

      customers?.forEach(c => {
        if (stats[c.assigned_to]) {
          stats[c.assigned_to].customers++;
          if (c.is_converted) stats[c.assigned_to].conversions++;
        }
      });

      return stats;
    },
    enabled: teamMembers.length > 0,
  });

  // Delete mutation
  const deactivateMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Team member deactivated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to deactivate');
    },
  });

  // Filter members
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      const matchesSearch =
        member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.employee_code?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = filterRole === 'all' || member.role === filterRole;

      return matchesSearch && matchesRole;
    });
  }, [teamMembers, searchQuery, filterRole]);

  // Stats
  const stats = useMemo(() => {
    const total = teamMembers.length;
    const salesReps = teamMembers.filter(m => m.role === 'sales_rep').length;
    const supervisors = teamMembers.filter(m => m.role === 'supervisor').length;
    const managers = teamMembers.filter(m => ['area_manager', 'regional_manager'].includes(m.role)).length;
    const totalTarget = teamMembers.reduce((sum, m) => sum + (m.target_monthly || 0), 0);

    return { total, salesReps, supervisors, managers, totalTarget };
  }, [teamMembers]);

  const handleEdit = (member: any) => {
    setSelectedMember(member);
    setIsModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleDeactivate = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this team member?')) {
      await deactivateMember.mutateAsync(id);
    }
    setActionMenuOpen(null);
  };

  const handleAddNew = () => {
    setSelectedMember(null);
    setIsModalOpen(true);
  };

  const getRoleBadge = (role: UserRole) => {
    const r = roles.find(x => x.value === role);
    if (!r) return null;
    return <span className={`px-2 py-1 ${r.color}/20 text-white text-xs rounded-full`}>{r.label}</span>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F0F4F8]">Team Management</h1>
          <p className="text-[#8B9CB8] text-sm mt-1">Manage your sales team and track performance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3A9EFF]/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-[#3A9EFF]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F0F4F8]">{stats.total}</p>
              <p className="text-xs text-[#8B9CB8]">Total Members</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2ECC71]/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#2ECC71]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F0F4F8]">{stats.salesReps}</p>
              <p className="text-xs text-[#8B9CB8]">Sales Reps</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4A843]/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#D4A843]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F0F4F8]">{stats.supervisors}</p>
              <p className="text-xs text-[#8B9CB8]">Supervisors</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#9B6BFF]/20 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-[#9B6BFF]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F0F4F8]">{stats.managers}</p>
              <p className="text-xs text-[#8B9CB8]">Managers</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C41E3A]/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-[#C41E3A]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F0F4F8]">৳{(stats.totalTarget / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-[#8B9CB8]">Total Target</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-[#0A2A5C] p-4 rounded-xl border border-white/10">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B9CB8]" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] placeholder:text-[#4A5B7A] focus:border-[#3A9EFF] outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8B9CB8]" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
          >
            <option value="all">All Roles</option>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-[#0A2A5C] rounded-xl border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41E3A]" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-[#4A5B7A] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#F0F4F8]">No team members found</h3>
            <p className="text-[#8B9CB8] text-sm mt-1">Add your first team member to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#061A3A]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Member</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Territories</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Performance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Last Login</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8B9CB8] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMembers.map((member) => {
                  const memberStats = performanceStats[member.id] || { visits: 0, customers: 0, conversions: 0 };
                  const memberTerritories = member.territory_ids?.map((id: string) =>
                    territories.find((t: any) => t.id === id)
                  ).filter(Boolean) || [];

                  return (
                    <tr key={member.id} className="hover:bg-white/5">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#3A9EFF]/20 rounded-full flex items-center justify-center">
                            <span className="text-[#3A9EFF] font-semibold">
                              {member.full_name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[#F0F4F8]">{member.full_name}</p>
                            <p className="text-xs text-[#8B9CB8]">{member.employee_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getRoleBadge(member.role)}
                      </td>
                      <td className="px-4 py-4">
                        {memberTerritories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {memberTerritories.slice(0, 2).map((t: any) => (
                              <span key={t.id} className="px-2 py-0.5 bg-[#0F3460] text-[#8B9CB8] text-xs rounded">
                                {t.name}
                              </span>
                            ))}
                            {memberTerritories.length > 2 && (
                              <span className="px-2 py-0.5 bg-[#0F3460] text-[#8B9CB8] text-xs rounded">
                                +{memberTerritories.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-[#8B9CB8]">No territories</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-[#8B9CB8]">
                            <CalendarCheck className="w-4 h-4" />
                            <span>{memberStats.visits}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#8B9CB8]">
                            <Users className="w-4 h-4" />
                            <span>{memberStats.customers}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#2ECC71]">
                            <TrendingUp className="w-4 h-4" />
                            <span>{memberStats.conversions}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#F0F4F8]">
                            ৳{(member.target_monthly || 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-[#8B9CB8]">
                            Daily: ৳{Math.round((member.target_monthly || 0) / 30).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {member.last_login_at ? (
                          <span className="text-sm text-[#8B9CB8]">
                            {format(new Date(member.last_login_at), 'MMM d, h:mm a')}
                          </span>
                        ) : (
                          <span className="text-sm text-[#8B9CB8]">Never</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === member.id ? null : member.id)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-[#8B9CB8]" />
                          </button>
                          {actionMenuOpen === member.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-[#0F3460] rounded-lg border border-white/10 shadow-xl z-10">
                              <button
                                onClick={() => handleEdit(member)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#F0F4F8] hover:bg-white/10"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeactivate(member.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#E74C5E] hover:bg-[#E74C5E]/10"
                              >
                                <Trash2 className="w-4 h-4" />
                                Deactivate
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Team Member Modal */}
      <TeamMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        member={selectedMember}
        territories={territories}
      />
    </div >
  );
}
