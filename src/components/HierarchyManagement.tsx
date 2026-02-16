import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, MapPin, Map, Loader2, Layers } from 'lucide-react';

interface Region {
    id: string;
    name: string;
}

interface Area {
    id: string;
    name: string;
    region_id: string;
}

export function HierarchyManagement() {
    const queryClient = useQueryClient();
    const [newDivisionName, setNewDivisionName] = useState('');
    const [newRegionName, setNewRegionName] = useState('');
    const [newAreaName, setNewAreaName] = useState('');

    const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
    const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

    // Fetch Divisions
    const { data: divisions = [], isLoading: isLoadingDivisions } = useQuery({
        queryKey: ['divisions'],
        queryFn: async () => {
            const { data, error } = await supabase.from('divisions').select('*').order('name');
            if (error) throw error;
            return data as { id: string; name: string }[];
        },
    });

    // Fetch Regions
    const { data: regions = [], isLoading: isLoadingRegions } = useQuery({
        queryKey: ['regions'],
        queryFn: async () => {
            const { data, error } = await supabase.from('regions').select('*').order('name');
            if (error) throw error;
            return data as { id: string; name: string; division_id: string }[];
        },
    });

    // Fetch Areas
    const { data: areas = [], isLoading: isLoadingAreas } = useQuery({
        queryKey: ['areas'],
        queryFn: async () => {
            const { data, error } = await supabase.from('areas').select('*').order('name');
            if (error) throw error;
            return data as Area[];
        },
    });

    // Create Division Mutation
    const createDivision = useMutation({
        mutationFn: async (name: string) => {
            const { error } = await supabase.from('divisions').insert([{ name }]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['divisions'] });
            setNewDivisionName('');
            toast.success('Division created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create division');
        },
    });

    // Create Region Mutation (Updated to include division_id)
    const createRegion = useMutation({
        mutationFn: async ({ name, division_id }: { name: string; division_id: string }) => {
            const { error } = await supabase.from('regions').insert([{ name, division_id }]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['regions'] });
            setNewRegionName('');
            toast.success('Region created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create region');
        },
    });

    // Create Area Mutation
    const createArea = useMutation({
        mutationFn: async ({ name, region_id }: { name: string; region_id: string }) => {
            const { error } = await supabase.from('areas').insert([{ name, region_id }]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            setNewAreaName('');
            toast.success('Area created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create area');
        },
    });

    // Delete Division Mutation
    const deleteDivision = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('divisions').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['divisions'] });
            if (selectedDivisionId === deleteDivision.variables) setSelectedDivisionId(null);
            toast.success('Division deleted');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete division');
        },
    });

    // Delete Region Mutation
    const deleteRegion = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('regions').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['regions'] });
            if (selectedRegionId === deleteRegion.variables) setSelectedRegionId(null);
            toast.success('Region deleted');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete region');
        },
    });

    // Delete Area Mutation
    const deleteArea = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('areas').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            toast.success('Area deleted');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete area');
        },
    });

    const handleCreateDivision = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDivisionName.trim()) return;
        createDivision.mutate(newDivisionName.trim());
    };

    const handleCreateRegion = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRegionName.trim() || !selectedDivisionId) {
            toast.error('Please select a division and enter a region name');
            return;
        }
        createRegion.mutate({ name: newRegionName.trim(), division_id: selectedDivisionId });
    };

    const handleCreateArea = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAreaName.trim() || !selectedRegionId) {
            toast.error('Please select a region and enter an area name');
            return;
        }
        createArea.mutate({ name: newAreaName.trim(), region_id: selectedRegionId });
    };

    const filteredRegions = useMemo(() => {
        if (!selectedDivisionId) return [];
        return regions.filter((r: any) => r.division_id === selectedDivisionId);
    }, [regions, selectedDivisionId]);

    const filteredAreas = useMemo(() => {
        if (!selectedRegionId) return [];
        return areas.filter(a => a.region_id === selectedRegionId);
    }, [areas, selectedRegionId]);

    // reset selections when parent changes
    useMemo(() => {
        setSelectedRegionId(null);
    }, [selectedDivisionId]);

    return (
        <div className="space-y-8 p-4">
            <div className="grid md:grid-cols-3 gap-6">

                {/* DIVISIONS */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Layers className="w-5 h-5 text-[#9B6BFF]" />
                        <h2 className="text-xl font-semibold text-[#F0F4F8]">Divisions</h2>
                    </div>

                    <form onSubmit={handleCreateDivision} className="flex gap-2">
                        <Input
                            placeholder="New Division Name"
                            value={newDivisionName}
                            onChange={(e) => setNewDivisionName(e.target.value)}
                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                        />
                        <Button
                            type="submit"
                            disabled={createDivision.isPending || !newDivisionName.trim()}
                            className="bg-[#9B6BFF] hover:bg-[#8A5CF5]"
                        >
                            {createDivision.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </Button>
                    </form>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {isLoadingDivisions ? (
                            <div className="text-center py-4 text-[#8B9CB8]">Loading...</div>
                        ) : divisions.length === 0 ? (
                            <div className="text-center py-4 text-[#8B9CB8] border border-dashed border-white/10 rounded-lg">No divisions found</div>
                        ) : (
                            divisions.map(division => (
                                <div
                                    key={division.id}
                                    onClick={() => setSelectedDivisionId(division.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors flex justify-between items-center group ${selectedDivisionId === division.id
                                        ? 'bg-[#9B6BFF]/20 border-[#9B6BFF]'
                                        : 'bg-[#0A2A5C] border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <span className="text-[#F0F4F8]">{division.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete division "${division.name}"? This deletes all regions/areas inside.`)) deleteDivision.mutate(division.id);
                                        }}
                                        className="h-8 w-8 text-[#8B9CB8] hover:text-[#E74C5E] hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* REGIONS */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Map className="w-5 h-5 text-[#3A9EFF]" />
                        <h2 className="text-xl font-semibold text-[#F0F4F8]">
                            Regions {selectedDivisionId ? `in ${divisions.find(d => d.id === selectedDivisionId)?.name}` : ''}
                        </h2>
                    </div>

                    <form onSubmit={handleCreateRegion} className="flex gap-2">
                        <Input
                            placeholder="New Region Name"
                            value={newRegionName}
                            onChange={(e) => setNewRegionName(e.target.value)}
                            disabled={!selectedDivisionId}
                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                        />
                        <Button
                            type="submit"
                            disabled={createRegion.isPending || !newRegionName.trim() || !selectedDivisionId}
                            className="bg-[#3A9EFF] hover:bg-[#2D7FCC]"
                        >
                            {createRegion.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </Button>
                    </form>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {!selectedDivisionId ? (
                            <div className="text-center py-8 text-[#8B9CB8] border border-dashed border-white/10 rounded-lg">Select a division first</div>
                        ) : isLoadingRegions ? (
                            <div className="text-center py-4 text-[#8B9CB8]">Loading regions...</div>
                        ) : filteredRegions.length === 0 ? (
                            <div className="text-center py-4 text-[#8B9CB8] border border-dashed border-white/10 rounded-lg">No regions in this division</div>
                        ) : (
                            filteredRegions.map((region: any) => (
                                <div
                                    key={region.id}
                                    onClick={() => setSelectedRegionId(region.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors flex justify-between items-center group ${selectedRegionId === region.id
                                        ? 'bg-[#3A9EFF]/20 border-[#3A9EFF]'
                                        : 'bg-[#0A2A5C] border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <span className="text-[#F0F4F8]">{region.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete region "${region.name}"? This updates areas.`)) deleteRegion.mutate(region.id);
                                        }}
                                        className="h-8 w-8 text-[#8B9CB8] hover:text-[#E74C5E] hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* AREAS */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-[#2ECC71]" />
                        <h2 className="text-xl font-semibold text-[#F0F4F8]">
                            Areas {selectedRegionId ? `in ${regions.find((r: any) => r.id === selectedRegionId)?.name}` : ''}
                        </h2>
                    </div>

                    <form onSubmit={handleCreateArea} className="flex gap-2">
                        <Input
                            placeholder="New Area Name"
                            value={newAreaName}
                            onChange={(e) => setNewAreaName(e.target.value)}
                            disabled={!selectedRegionId}
                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                        />
                        <Button
                            type="submit"
                            disabled={createArea.isPending || !newAreaName.trim() || !selectedRegionId}
                            className="bg-[#2ECC71] hover:bg-[#27AE60]"
                        >
                            {createArea.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </Button>
                    </form>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {!selectedRegionId ? (
                            <div className="text-center py-8 text-[#8B9CB8] border border-dashed border-white/10 rounded-lg">
                                Select a region first
                            </div>
                        ) : isLoadingAreas ? (
                            <div className="text-center py-4 text-[#8B9CB8]">Loading areas...</div>
                        ) : filteredAreas.length === 0 ? (
                            <div className="text-center py-4 text-[#8B9CB8] border border-dashed border-white/10 rounded-lg">No areas in this region</div>
                        ) : (
                            filteredAreas.map(area => (
                                <div
                                    key={area.id}
                                    className="p-3 bg-[#0A2A5C] rounded-lg border border-white/10 flex justify-between items-center group hover:border-white/20"
                                >
                                    <span className="text-[#F0F4F8]">{area.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            if (confirm(`Delete area "${area.name}"?`)) deleteArea.mutate(area.id);
                                        }}
                                        className="h-8 w-8 text-[#8B9CB8] hover:text-[#E74C5E] hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
