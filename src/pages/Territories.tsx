// ============================================================
// AMAN CEMENT CRM — Territories Page
// Territory management with GeoJSON boundaries
// ============================================================

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { TerritoryColorKey } from '@/types';
import {
  Shield,
  Search,
  Plus,
  Filter,
  MapPin,
  Users,
  Target,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  Map,
  MoreVertical,
  CheckCircle2,
  X,
  Palette,
  Navigation,
  Layers,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HierarchyManagement } from '@/components/HierarchyManagement';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Territory Form Modal
interface TerritoryFormData {
  name: string;
  code: string;
  color: TerritoryColorKey;
  region: string;
  area: string;
  supervisor_id: string;
  center_lat: number;
  center_lng: number;
  zoom_level: number;
  target_monthly: number;
  geojson: string;
}

const initialFormData: TerritoryFormData = {
  name: '',
  code: '',
  color: 'territory_a',
  region: '',
  area: '',
  supervisor_id: '',
  center_lat: 23.8103,
  center_lng: 90.4125,
  zoom_level: 12,
  target_monthly: 0,
  geojson: '',
};

const territoryColors: { key: TerritoryColorKey; label: string; fill: string; stroke: string }[] = [
  { key: 'territory_a', label: 'Blue', fill: '#3A9EFF', stroke: '#3A9EFF' },
  { key: 'territory_b', label: 'Red', fill: '#C41E3A', stroke: '#C41E3A' },
  { key: 'territory_c', label: 'Green', fill: '#2ECC71', stroke: '#2ECC71' },
  { key: 'territory_d', label: 'Purple', fill: '#9B6BFF', stroke: '#9B6BFF' },
  { key: 'territory_e', label: 'Gold', fill: '#D4A843', stroke: '#D4A843' },
  { key: 'territory_f', label: 'Orange', fill: '#FF7C3A', stroke: '#FF7C3A' },
  { key: 'territory_g', label: 'Teal', fill: '#2DD4BF', stroke: '#2DD4BF' },
  { key: 'territory_h', label: 'Pink', fill: '#E74C5E', stroke: '#E74C5E' },
];

function TerritoryModal({
  isOpen,
  onClose,
  territory,
  supervisors
}: {
  isOpen: boolean;
  onClose: () => void;
  territory?: any | null;
  supervisors: any[];
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<TerritoryFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geojsonError, setGeojsonError] = useState('');

  /* Fetch Regions */
  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const { data } = await supabase.from('regions').select('*').order('name');
      return data || [];
    },
  });

  /* Fetch Areas */
  const { data: areas = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data } = await supabase.from('areas').select('*').order('name');
      return data || [];
    },
  });

  const filteredAreas = (() => {
    const selectedRegion = regions.find((r: any) => r.name === formData.region);
    if (!selectedRegion) return [];
    return areas.filter((a: any) => a.region_id === selectedRegion.id);
  })();

  const handleRegionChange = (regionName: string) => {
    setFormData({ ...formData, region: regionName, area: '' }); // Reset area on region change
  };

  useState(() => {
    if (territory) {
      setFormData({
        name: territory.name,
        code: territory.code,
        color: territory.color,
        region: territory.region,
        area: territory.area,
        supervisor_id: territory.supervisor_id || '',
        center_lat: territory.center_lat,
        center_lng: territory.center_lng,
        zoom_level: territory.zoom_level,
        target_monthly: territory.target_monthly,
        geojson: territory.geojson ? JSON.stringify(territory.geojson, null, 2) : '',
      });
    } else {
      setFormData(initialFormData);
    }
  });

  const validateGeoJSON = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.type !== 'Polygon' && parsed.type !== 'MultiPolygon') {
        setGeojsonError('GeoJSON must be a Polygon or MultiPolygon');
        return false;
      }
      if (!parsed.coordinates || !Array.isArray(parsed.coordinates)) {
        setGeojsonError('Invalid coordinates format');
        return false;
      }
      setGeojsonError('');
      return true;
    } catch (e) {
      setGeojsonError('Invalid JSON format');
      return false;
    }
  };

  const saveTerritory = useMutation({
    mutationFn: async (data: TerritoryFormData) => {
      if (!validateGeoJSON(data.geojson)) {
        throw new Error('Invalid GeoJSON');
      }

      const territoryData = {
        name: data.name,
        code: data.code,
        color: data.color,
        region: data.region,
        area: data.area,
        supervisor_id: data.supervisor_id || null,
        center_lat: data.center_lat,
        center_lng: data.center_lng,
        zoom_level: data.zoom_level,
        target_monthly: data.target_monthly,
        geojson: JSON.parse(data.geojson),
      };

      if (territory) {
        const { error } = await supabase
          .from('territories')
          .update(territoryData)
          .eq('id', territory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('territories').insert([territoryData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
      toast.success(territory ? 'Territory updated' : 'Territory created');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save territory');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await saveTerritory.mutateAsync(formData);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A2A5C] rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-[#F0F4F8]">
            {territory ? 'Edit Territory' : 'Create Territory'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-[#8B9CB8]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[#8B9CB8]">Territory Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                placeholder="e.g., Gulshan North"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#8B9CB8]">Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
                placeholder="e.g., DHK-GUL-N"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[#8B9CB8]">Region *</label>
              <Select
                value={formData.region}
                onValueChange={handleRegionChange}
              >
                <SelectTrigger className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8]">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A2A5C] border-white/10">
                  {regions.map((r: any) => (
                    <SelectItem key={r.id} value={r.name} className="text-[#F0F4F8]">{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#8B9CB8]">Area *</label>
              <Select
                value={formData.area}
                onValueChange={(v) => setFormData({ ...formData, area: v })}
                disabled={!formData.region}
              >
                <SelectTrigger className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8]">
                  <SelectValue placeholder="Select Area" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A2A5C] border-white/10">
                  {filteredAreas.map((a: any) => (
                    <SelectItem key={a.id} value={a.name} className="text-[#F0F4F8]">{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Supervisor</label>
            <select
              value={formData.supervisor_id}
              onChange={(e) => setFormData({ ...formData, supervisor_id: e.target.value })}
              className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            >
              <option value="">Select Supervisor</option>
              {supervisors.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Color</label>
            <div className="flex flex-wrap gap-2">
              {territoryColors.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c.key })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${formData.color === c.key
                    ? 'border-[#3A9EFF] bg-[#3A9EFF]/10'
                    : 'border-white/10 hover:border-white/30'
                    }`}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: c.fill }}
                  />
                  <span className="text-sm text-[#F0F4F8]">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[#8B9CB8]">Center Lat</label>
              <input
                type="number"
                step="0.0001"
                value={formData.center_lat}
                onChange={(e) => setFormData({ ...formData, center_lat: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#8B9CB8]">Center Lng</label>
              <input
                type="number"
                step="0.0001"
                value={formData.center_lng}
                onChange={(e) => setFormData({ ...formData, center_lng: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#8B9CB8]">Zoom Level</label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.zoom_level}
                onChange={(e) => setFormData({ ...formData, zoom_level: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">GeoJSON Boundary *</label>
            <textarea
              required
              value={formData.geojson}
              onChange={(e) => {
                setFormData({ ...formData, geojson: e.target.value });
                validateGeoJSON(e.target.value);
              }}
              rows={6}
              placeholder={`{\n  "type": "Polygon",\n  "coordinates": [[[90.4, 23.8], [90.42, 23.8], [90.42, 23.82], [90.4, 23.82], [90.4, 23.8]]]\n}`}
              className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none resize-none font-mono text-xs"
            />
            {geojsonError && (
              <p className="text-sm text-[#E74C5E]">{geojsonError}</p>
            )}
            <p className="text-xs text-[#8B9CB8]">
              Paste GeoJSON Polygon or MultiPolygon coordinates
            </p>
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
              disabled={isSubmitting || !!geojsonError}
              className="px-4 py-2 bg-[#C41E3A] hover:bg-[#9B1830] text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {territory ? 'Update Territory' : 'Create Territory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Territories Page
export function Territories() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState<any | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Fetch territories
  const { data: territories = [], isLoading } = useQuery({
    queryKey: ['territories', user?.id, user?.role],
    queryFn: async () => {
      let query = supabase
        .from('territories')
        .select(`
          *,
          profiles:supervisor_id (full_name)
        `)
        .eq('is_active', true);

      if (user?.role === 'area_manager') {
        // Use ilike for case-insensitive matching. Fallback to dummy to prevent leaking all data if profile is incomplete.
        query = query.ilike('area', user.area || '___NO_AREA___');
      } else if (user?.role === 'regional_manager') {
        query = query.ilike('region', user.region || '___NO_REGION___');
      } else if (user?.role === 'supervisor') {
        // Supervisor sees only their assigned territory
        query = query.eq('supervisor_id', user.id);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch supervisors for assignment
  const { data: supervisors = [] } = useQuery({
    queryKey: ['supervisors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'supervisor')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch territory stats
  const { data: territoryStats = {} } = useQuery({
    queryKey: ['territory-stats'],
    queryFn: async () => {
      const territoryIds = territories.map(t => t.id);
      if (territoryIds.length === 0) return {};

      const { data: customers } = await supabase
        .from('customers')
        .select('territory_id, is_converted')
        .in('territory_id', territoryIds);

      const { data: visits } = await supabase
        .from('visits')
        .select('customer_id, customers!inner(territory_id)')
        .in('customers.territory_id', territoryIds);

      const { data: reps } = await supabase
        .from('profiles')
        .select('id, territory_ids')
        .eq('role', 'sales_rep')
        .eq('is_active', true);

      const stats: Record<string, { customers: number; visits: number; conversions: number; reps: number }> = {};

      territoryIds.forEach(id => {
        stats[id] = { customers: 0, visits: 0, conversions: 0, reps: 0 };
      });

      customers?.forEach((c: any) => {
        if (stats[c.territory_id]) {
          stats[c.territory_id].customers++;
          if (c.is_converted) stats[c.territory_id].conversions++;
        }
      });

      reps?.forEach((r: any) => {
        if (r.territory_ids && Array.isArray(r.territory_ids)) {
          r.territory_ids.forEach((tid: string) => {
            if (stats[tid]) {
              stats[tid].reps++;
            }
          });
        }
      });

      return stats;
    },
    enabled: territories.length > 0,
  });

  // Delete mutation
  const deleteTerritory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('territories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
      toast.success('Territory deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete territory');
    },
  });

  // Filter territories
  const filteredTerritories = useMemo(() => {
    return territories.filter((territory) => {
      const matchesSearch =
        territory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        territory.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        territory.region.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRegion = filterRegion === 'all' || territory.region === filterRegion;

      return matchesSearch && matchesRegion;
    });
  }, [territories, searchQuery, filterRegion]);

  // Get unique regions for filter
  const regions = useMemo(() => {
    return [...new Set(territories.map(t => t.region))];
  }, [territories]);

  // Stats
  const stats = useMemo(() => {
    const total = territories.length;
    const totalTarget = territories.reduce((sum, t) => sum + (t.target_monthly || 0), 0);
    const totalCustomers = Object.values(territoryStats).reduce((sum: number, s: any) => sum + s.customers, 0);
    const totalConversions = Object.values(territoryStats).reduce((sum: number, s: any) => sum + s.conversions, 0);

    return { total, totalTarget, totalCustomers, totalConversions };
  }, [territories, territoryStats]);

  const handleEdit = (territory: any) => {
    setSelectedTerritory(territory);
    setIsModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this territory?')) {
      await deleteTerritory.mutateAsync(id);
    }
    setActionMenuOpen(null);
  };

  const handleAddNew = () => {
    setSelectedTerritory(null);
    setIsModalOpen(true);
  };

  const getColorStyle = (colorKey: TerritoryColorKey) => {
    const color = territoryColors.find(c => c.key === colorKey);
    return color || territoryColors[0];
  };

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="territories" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#F0F4F8]">Territory Management</h1>
            <p className="text-[#8B9CB8] text-sm mt-1">Manage geographic territories and boundaries</p>
          </div>
          <TabsList className="bg-[#0A2A5C] border border-white/10">
            <TabsTrigger value="territories" className="data-[state=active]:bg-[#3A9EFF]">
              <MapPin className="w-4 h-4 mr-2" />
              Territories
            </TabsTrigger>
            {['country_head', 'regional_manager', 'area_manager'].includes(user?.role || '') && (
              <TabsTrigger value="hierarchy" className="data-[state=active]:bg-[#2ECC71]">
                <Layers className="w-4 h-4 mr-2" />
                Hierarchy Management
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="territories" className="space-y-6">
          {/* Header Action */}
          <div className="flex justify-end">
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-4 py-2 bg-[#C41E3A] hover:bg-[#9B1830] text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Territory
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3A9EFF]/20 rounded-lg flex items-center justify-center">
                  <Map className="w-5 h-5 text-[#3A9EFF]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#F0F4F8]">{stats.total}</p>
                  <p className="text-xs text-[#8B9CB8]">Total Territories</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2ECC71]/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#2ECC71]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#F0F4F8]">{stats.totalCustomers}</p>
                  <p className="text-xs text-[#8B9CB8]">Total Customers</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#C41E3A]/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#C41E3A]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#F0F4F8]">{stats.totalConversions}</p>
                  <p className="text-xs text-[#8B9CB8]">Conversions</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#D4A843]/20 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#D4A843]" />
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
                placeholder="Search territories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] placeholder:text-[#4A5B7A] focus:border-[#3A9EFF] outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#8B9CB8]" />
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
              >
                <option value="all">All Regions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Territories Grid */}
          <div className="grid grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-3 p-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41E3A]" />
              </div>
            ) : filteredTerritories.length === 0 ? (
              <div className="col-span-3 p-12 text-center bg-[#0A2A5C] rounded-xl border border-white/10">
                <Map className="w-16 h-16 text-[#4A5B7A] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#F0F4F8]">No territories found</h3>
                <p className="text-[#8B9CB8] text-sm mt-1">Create your first territory to get started</p>
              </div>
            ) : (
              filteredTerritories.map((territory) => {
                const color = getColorStyle(territory.color);
                const stats = territoryStats[territory.id] || { customers: 0, visits: 0, conversions: 0, reps: 0 };

                return (
                  <div key={territory.id} className="bg-[#0A2A5C] rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-colors">
                    {/* Color Header */}
                    <div
                      className="h-2"
                      style={{ backgroundColor: color.fill }}
                    />

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-[#F0F4F8]">{territory.name}</h3>
                          <p className="text-xs text-[#8B9CB8]">{territory.code}</p>
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === territory.id ? null : territory.id)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-[#8B9CB8]" />
                          </button>
                          {actionMenuOpen === territory.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-[#0F3460] rounded-lg border border-white/10 shadow-xl z-10">
                              <button
                                onClick={() => handleEdit(territory)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#F0F4F8] hover:bg-white/10"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(territory.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#E74C5E] hover:bg-[#E74C5E]/10"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-[#8B9CB8]" />
                          <span className="text-[#F0F4F8]">{territory.region}</span>
                          {territory.area && (
                            <span className="text-[#8B9CB8]">• {territory.area}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4 text-[#8B9CB8]" />
                          <span className="text-[#F0F4F8]">
                            {(territory.profiles as any)?.full_name || 'No supervisor'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Target className="w-4 h-4 text-[#8B9CB8]" />
                          <span className="text-[#F0F4F8]">
                            ৳{(territory.target_monthly || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/10">
                        <div className="text-center">
                          <p className="text-lg font-bold text-[#F0F4F8]">{stats.reps}</p>
                          <p className="text-[10px] text-[#8B9CB8]">Reps</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-[#3A9EFF]">{stats.customers}</p>
                          <p className="text-[10px] text-[#8B9CB8]">Cust.</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-[#D4A843]">{stats.visits}</p>
                          <p className="text-[10px] text-[#8B9CB8]">Visits</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-[#2ECC71]">{stats.conversions}</p>
                          <p className="text-[10px] text-[#8B9CB8]">Conv.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {['country_head', 'regional_manager', 'area_manager'].includes(user?.role || '') && (
          <TabsContent value="hierarchy">
            <HierarchyManagement />
          </TabsContent>
        )}
      </Tabs>

      {/* Territory Modal */}
      <TerritoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        territory={selectedTerritory}
        supervisors={supervisors}
      />
    </div>
  );
}
