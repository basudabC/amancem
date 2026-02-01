// ============================================================
// AMAN CEMENT CRM — Projects Page
// Full management of project-based customers (construction sites)
// ============================================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type {
  Customer,
  ProjectCustomerData,
  StructureType,
  VisitOutcome
} from '@/types/index';
import {
  Building2,
  Search,
  Plus,
  Filter,
  MapPin,
  Phone,
  TrendingUp,
  Calendar,
  HardHat,
  Layers,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Project Form Modal
interface ProjectFormData {
  name: string;
  owner_name: string;
  phone: string;
  area: string;
  territory_id: string;
  built_up_area_sqft: number;
  number_of_floors: number;
  structure_type: StructureType;
  construction_stage_percent: number;
  cement_requirement_tons: number;
  cement_consumed_tons: number;
  current_brand?: string;
  project_started: boolean;
  latitude: number;
  longitude: number;
}

const initialFormData: ProjectFormData = {
  name: '',
  owner_name: '',
  phone: '',
  area: '',
  territory_id: '',
  built_up_area_sqft: 0,
  number_of_floors: 1,
  structure_type: 'RCC',
  construction_stage_percent: 0,
  cement_requirement_tons: 0,
  cement_consumed_tons: 0,
  current_brand: '',
  project_started: false,
  latitude: 23.8103,
  longitude: 90.4125,
};

function ProjectModal({
  isOpen,
  onClose,
  project,
  territories
}: {
  isOpen: boolean;
  onClose: () => void;
  project?: Customer | null;
  territories: any[];
}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useState(() => {
    if (project) {
      const data = project.pipeline_data as ProjectCustomerData;
      setFormData({
        name: project.name,
        owner_name: project.owner_name || '',
        phone: project.phone || '',
        area: project.area || '',
        territory_id: project.territory_id,
        built_up_area_sqft: data.built_up_area_sqft,
        number_of_floors: data.number_of_floors,
        structure_type: data.structure_type,
        construction_stage_percent: data.construction_stage_percent,
        cement_requirement_tons: data.cement_requirement_tons,
        cement_consumed_tons: data.cement_consumed_tons,
        current_brand: data.current_brand || '',
        project_started: data.project_started,
        latitude: project.latitude,
        longitude: project.longitude,
      });
    } else {
      setFormData(initialFormData);
    }
  });

  const saveProject = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const pipelineData: ProjectCustomerData = {
        built_up_area_sqft: data.built_up_area_sqft,
        number_of_floors: data.number_of_floors,
        structure_type: data.structure_type,
        construction_stage_percent: data.construction_stage_percent,
        cement_requirement_tons: data.cement_requirement_tons,
        cement_consumed_tons: data.cement_consumed_tons,
        current_brand: data.current_brand,
        project_started: data.project_started,
      };

      const customerData = {
        name: data.name,
        owner_name: data.owner_name,
        phone: data.phone,
        area: data.area,
        territory_id: data.territory_id,
        pipeline: 'one_time',
        status: 'active',
        latitude: data.latitude,
        longitude: data.longitude,
        pipeline_data: pipelineData as any,
        assigned_to: user?.id,
      };

      if (project) {
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', project.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([{ ...customerData, created_by: user?.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(project ? 'Project updated successfully' : 'Project created successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save project');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await saveProject.mutateAsync(formData);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A2A5C] rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-[#F0F4F8]">
            {project ? 'Edit Project' : 'New Construction Project'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-[#8B9CB8]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[#8B9CB8]">Project Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                placeholder="e.g., Skyline Tower"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#8B9CB8]">Owner/Builder Name</label>
              <input
                type="text"
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <label className="text-sm text-[#8B9CB8]">Area/Location</label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                placeholder="e.g., Gulshan"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Territory *</label>
            <select
              required
              value={formData.territory_id}
              onChange={(e) => setFormData({ ...formData, territory_id: e.target.value })}
              className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            >
              <option value="">Select Territory</option>
              {territories.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Project Specifications */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-sm font-medium text-[#F0F4F8] mb-4 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-[#C41E3A]" />
              Project Specifications
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">Built-up Area (sqft)</label>
                <input
                  type="number"
                  value={formData.built_up_area_sqft}
                  onChange={(e) => setFormData({ ...formData, built_up_area_sqft: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">Number of Floors</label>
                <input
                  type="number"
                  value={formData.number_of_floors}
                  onChange={(e) => setFormData({ ...formData, number_of_floors: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">Structure Type</label>
                <select
                  value={formData.structure_type}
                  onChange={(e) => setFormData({ ...formData, structure_type: e.target.value as StructureType })}
                  className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                >
                  <option value="RCC">RCC (Reinforced Cement Concrete)</option>
                  <option value="Steel">Steel Structure</option>
                  <option value="Mixed">Mixed Structure</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">Construction Stage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.construction_stage_percent}
                  onChange={(e) => setFormData({ ...formData, construction_stage_percent: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Cement Details */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-sm font-medium text-[#F0F4F8] mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D4A843]" />
              Cement Requirements
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">Total Requirement (tons)</label>
                <input
                  type="number"
                  value={formData.cement_requirement_tons}
                  onChange={(e) => setFormData({ ...formData, cement_requirement_tons: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">Already Consumed (tons)</label>
                <input
                  type="number"
                  value={formData.cement_consumed_tons}
                  onChange={(e) => setFormData({ ...formData, cement_consumed_tons: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-sm text-[#8B9CB8]">Current Brand (if any)</label>
              <input
                type="text"
                value={formData.current_brand}
                onChange={(e) => setFormData({ ...formData, current_brand: e.target.value })}
                className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                placeholder="e.g., Shah Cement, Bashundhara"
              />
            </div>
          </div>

          {/* Status */}
          <div className="border-t border-white/10 pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.project_started}
                onChange={(e) => setFormData({ ...formData, project_started: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-[#061A3A] text-[#C41E3A] focus:ring-[#C41E3A]"
              />
              <span className="text-[#F0F4F8]">Project has started construction</span>
            </label>
          </div>

          {/* Actions */}
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
              {project ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Projects Page
export function Projects() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<'all' | 'not_started' | 'in_progress' | 'near_complete'>('all');
  const [filterTerritory, setFilterTerritory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Customer | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Fetch projects (one_time pipeline customers)
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select(`
          *,
          territories:territory_id (name, color),
          profiles:assigned_to (full_name)
        `)
        .eq('pipeline', 'one_time');

      // Apply role-based filtering
      if (user?.role === 'sales_rep') {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as Customer[];
    },
  });

  // Fetch territories for filter and form
  const { data: territories = [] } = useQuery({
    queryKey: ['territories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('territories').select('*').eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  // Delete mutation
  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete project');
    },
  });

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const data = project.pipeline_data as ProjectCustomerData;
      if (!data) return false; // Skip projects without pipeline_data

      // Search filter
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.area?.toLowerCase().includes(searchQuery.toLowerCase());

      // Stage filter
      let matchesStage = true;
      if (filterStage === 'not_started') matchesStage = data.construction_stage_percent === 0;
      if (filterStage === 'in_progress') matchesStage = data.construction_stage_percent > 0 && data.construction_stage_percent < 80;
      if (filterStage === 'near_complete') matchesStage = data.construction_stage_percent >= 80;

      // Territory filter
      const matchesTerritory = filterTerritory === 'all' || project.territory_id === filterTerritory;

      return matchesSearch && matchesStage && matchesTerritory;
    });
  }, [projects, searchQuery, filterStage, filterTerritory]);

  // Stats
  const stats = useMemo(() => {
    const total = projects.length;
    const notStarted = projects.filter(p => (p.pipeline_data as ProjectCustomerData)?.construction_stage_percent === 0).length;
    const inProgress = projects.filter(p => {
      const stage = (p.pipeline_data as ProjectCustomerData)?.construction_stage_percent || 0;
      return stage > 0 && stage < 80;
    }).length;
    const nearComplete = projects.filter(p => (p.pipeline_data as ProjectCustomerData)?.construction_stage_percent >= 80).length;
    const totalRequirement = projects.reduce((sum, p) => sum + ((p.pipeline_data as ProjectCustomerData)?.cement_requirement_tons || 0), 0);

    return { total, notStarted, inProgress, nearComplete, totalRequirement };
  }, [projects]);

  const handleEdit = (project: Customer) => {
    setSelectedProject(project);
    setIsModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject.mutateAsync(id);
    }
    setActionMenuOpen(null);
  };

  const handleAddNew = () => {
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const getStageBadge = (percent: number) => {
    if (percent === 0) return <span className="px-2 py-1 bg-[#8B9CB8]/20 text-[#8B9CB8] text-xs rounded-full">Not Started</span>;
    if (percent < 80) return <span className="px-2 py-1 bg-[#3A9EFF]/20 text-[#3A9EFF] text-xs rounded-full">In Progress ({percent}%)</span>;
    return <span className="px-2 py-1 bg-[#2ECC71]/20 text-[#2ECC71] text-xs rounded-full">Near Complete ({percent}%)</span>;
  };

  const getProgressColor = (consumed: number, required: number) => {
    const ratio = required > 0 ? consumed / required : 0;
    if (ratio < 0.3) return 'bg-[#2ECC71]';
    if (ratio < 0.7) return 'bg-[#D4A843]';
    return 'bg-[#C41E3A]';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F0F4F8]">Construction Projects</h1>
          <p className="text-[#8B9CB8] text-sm mt-1">Manage project-based customers and track cement requirements</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#C41E3A] hover:bg-[#9B1830] text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3A9EFF]/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#3A9EFF]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F0F4F8]">{stats.total}</p>
              <p className="text-xs text-[#8B9CB8]">Total Projects</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8B9CB8]/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#8B9CB8]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F0F4F8]">{stats.notStarted}</p>
              <p className="text-xs text-[#8B9CB8]">Not Started</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4A843]/20 rounded-lg flex items-center justify-center">
              <HardHat className="w-5 h-5 text-[#D4A843]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F0F4F8]">{stats.inProgress}</p>
              <p className="text-xs text-[#8B9CB8]">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2ECC71]/20 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#2ECC71]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F0F4F8]">{stats.nearComplete}</p>
              <p className="text-xs text-[#8B9CB8]">Near Complete</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C41E3A]/20 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-[#C41E3A]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F0F4F8]">{stats.totalRequirement.toLocaleString()}</p>
              <p className="text-xs text-[#8B9CB8]">Total Tons Required</p>
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
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] placeholder:text-[#4A5B7A] focus:border-[#3A9EFF] outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8B9CB8]" />
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value as any)}
            className="px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
          >
            <option value="all">All Stages</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="near_complete">Near Complete</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#8B9CB8]" />
          <select
            value={filterTerritory}
            onChange={(e) => setFilterTerritory(e.target.value)}
            className="px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
          >
            <option value="all">All Territories</option>
            {territories.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-[#0A2A5C] rounded-xl border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41E3A]" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-16 h-16 text-[#4A5B7A] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#F0F4F8]">No projects found</h3>
            <p className="text-[#8B9CB8] text-sm mt-1">Add your first construction project to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#061A3A]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Cement Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Current Brand</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Last Visit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8B9CB8] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProjects.map((project) => {
                  const data = project.pipeline_data as ProjectCustomerData;
                  const cementProgress = data.cement_requirement_tons > 0
                    ? (data.cement_consumed_tons / data.cement_requirement_tons) * 100
                    : 0;

                  return (
                    <tr key={project.id} className="hover:bg-white/5">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#C41E3A]/20 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-[#C41E3A]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#F0F4F8]">{project.name}</p>
                            <p className="text-xs text-[#8B9CB8]">{project.owner_name || 'No owner'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-[#8B9CB8]">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{project.area || 'N/A'}</span>
                        </div>
                        <p className="text-xs text-[#4A5B7A] mt-1">
                          {(project.territories as any)?.name || 'Unknown territory'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {getStageBadge(data.construction_stage_percent)}
                        <p className="text-xs text-[#8B9CB8] mt-1">
                          {data.number_of_floors} floors • {data.structure_type}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-full max-w-[150px]">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#8B9CB8]">{data.cement_consumed_tons.toFixed(1)}t</span>
                            <span className="text-[#F0F4F8]">{data.cement_requirement_tons.toFixed(1)}t</span>
                          </div>
                          <div className="h-2 bg-[#061A3A] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getProgressColor(data.cement_consumed_tons, data.cement_requirement_tons)} transition-all`}
                              style={{ width: `${Math.min(cementProgress, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-[#8B9CB8] mt-1">{cementProgress.toFixed(1)}% consumed</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {data.current_brand ? (
                          <span className="text-sm text-[#F0F4F8]">{data.current_brand}</span>
                        ) : (
                          <span className="text-sm text-[#8B9CB8]">No brand</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {project.last_visit_at ? (
                          <div>
                            <p className="text-sm text-[#F0F4F8]">
                              {format(new Date(project.last_visit_at), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-[#8B9CB8] capitalize">
                              {project.last_visit_outcome?.replace('_', ' ')}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-[#8B9CB8]">No visits</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === project.id ? null : project.id)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-[#8B9CB8]" />
                          </button>
                          {actionMenuOpen === project.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-[#0F3460] rounded-lg border border-white/10 shadow-xl z-10">
                              <button
                                onClick={() => navigate(`/customers?id=${project.id}`)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#F0F4F8] hover:bg-white/10"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => handleEdit(project)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#F0F4F8] hover:bg-white/10"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(project.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#E74C5E] hover:bg-[#E74C5E]/10"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
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

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={selectedProject}
        territories={territories}
      />
    </div>
  );
}
