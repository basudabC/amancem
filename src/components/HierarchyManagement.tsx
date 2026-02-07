import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, MapPin, Map, Loader2 } from 'lucide-react';

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
    const [newRegionName, setNewRegionName] = useState('');
    const [newAreaName, setNewAreaName] = useState('');
    const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

    // Fetch Regions
    const { data: regions = [], isLoading: isLoadingRegions } = useQuery({
        queryKey: ['regions'],
        queryFn: async () => {
            const { data, error } = await supabase.from('regions').select('*').order('name');
            if (error) throw error;
            return data as Region[];
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

    // Create Region Mutation
    const createRegion = useMutation({
        mutationFn: async (name: string) => {
            const { error } = await supabase.from('regions').insert([{ name }]);
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

    // Delete Region Mutation
    const deleteRegion = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('regions').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['regions'] });
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

    const handleCreateRegion = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRegionName.trim()) return;
        createRegion.mutate(newRegionName.trim());
    };

    const handleCreateArea = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAreaName.trim() || !selectedRegionId) {
            toast.error('Please select a region and enter an area name');
            return;
        }
        createArea.mutate({ name: newAreaName.trim(), region_id: selectedRegionId });
    };

    const filteredAreas = useMemo(() => {
        if (!selectedRegionId) return [];
        return areas.filter(a => a.region_id === selectedRegionId);
    }, [areas, selectedRegionId]);

    return (
        <div className="space-y-8 p-4">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Regions Management */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Map className="w-5 h-5 text-[#3A9EFF]" />
                        <h2 className="text-xl font-semibold text-[#F0F4F8]">Regions</h2>
                    </div>

                    <form onSubmit={handleCreateRegion} className="flex gap-2">
                        <Input
                            placeholder="New Region Name"
                            value={newRegionName}
                            onChange={(e) => setNewRegionName(e.target.value)}
                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                        />
                        <Button
                            type="submit"
                            disabled={createRegion.isPending || !newRegionName.trim()}
                            className="bg-[#3A9EFF] hover:bg-[#2D7FCC]"
                        >
                            {createRegion.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </Button>
                    </form>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {isLoadingRegions ? (
                            <div className="text-center py-4 text-[#8B9CB8]">Loading regions...</div>
                        ) : regions.length === 0 ? (
                            <div className="text-center py-4 text-[#8B9CB8] border border-dashed border-white/10 rounded-lg">No regions found</div>
                        ) : (
                            regions.map(region => (
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

                {/* Areas Management */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-[#2ECC71]" />
                        <h2 className="text-xl font-semibold text-[#F0F4F8]">
                            Areas {selectedRegionId ? `in ${regions.find(r => r.id === selectedRegionId)?.name}` : '(Select a Region)'}
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
                                Select a region to view and manage areas
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
