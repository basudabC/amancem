// ============================================================
// AMAN CEMENT CRM — Map State Management (Zustand)
// ============================================================

import { create } from 'zustand';
import type { MapFilterState, Customer, Territory } from '@/types';

interface MapState extends MapFilterState {
  // Map instance
  map: google.maps.Map | null;
  
  // Data
  customers: Customer[];
  territories: Territory[];
  filteredCustomers: Customer[];
  
  // UI State
  selectedCustomer: Customer | null;
  selectedTerritory: Territory | null;
  infoWindowOpen: boolean;
  territoryPanelOpen: boolean;
  
  // Loading states
  isLoadingCustomers: boolean;
  isLoadingTerritories: boolean;
  
  // Actions
  setMap: (map: google.maps.Map | null) => void;
  setCustomers: (customers: Customer[]) => void;
  setTerritories: (territories: Territory[]) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  setSelectedTerritory: (territory: Territory | null) => void;
  setInfoWindowOpen: (open: boolean) => void;
  setTerritoryPanelOpen: (open: boolean) => void;
  
  // Filter actions
  toggleRecurring: () => void;
  toggleProjects: () => void;
  toggleArchived: () => void;
  toggleTerritory: (territoryId: string) => void;
  toggleHeatmap: () => void;
  toggleLiveReps: () => void;
  selectAllTerritories: () => void;
  deselectAllTerritories: () => void;
  
  // Apply filters
  applyFilters: () => void;
  
  // Loading
  setLoadingCustomers: (loading: boolean) => void;
  setLoadingTerritories: (loading: boolean) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  // Initial filter state
  showRecurring: true,
  showProjects: true,
  showArchived: false,
  selectedTerritories: [],
  showHeatmap: false,
  showLiveReps: false,
  
  // Map instance
  map: null,
  
  // Data
  customers: [],
  territories: [],
  filteredCustomers: [],
  
  // UI State
  selectedCustomer: null,
  selectedTerritory: null,
  infoWindowOpen: false,
  territoryPanelOpen: false,
  
  // Loading
  isLoadingCustomers: false,
  isLoadingTerritories: false,
  
  // Actions
  setMap: (map) => set({ map }),
  
  setCustomers: (customers) => {
    set({ customers });
    get().applyFilters();
  },
  
  setTerritories: (territories) => {
    set({ territories });
    // Auto-select all territories initially
    if (get().selectedTerritories.length === 0) {
      set({ selectedTerritories: territories.map(t => t.id) });
    }
  },
  
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
  setSelectedTerritory: (territory) => set({ selectedTerritory: territory }),
  setInfoWindowOpen: (open) => set({ infoWindowOpen: open }),
  setTerritoryPanelOpen: (open) => set({ territoryPanelOpen: open }),
  
  // Filter actions
  toggleRecurring: () => {
    set((state) => ({ showRecurring: !state.showRecurring }));
    get().applyFilters();
  },
  
  toggleProjects: () => {
    set((state) => ({ showProjects: !state.showProjects }));
    get().applyFilters();
  },
  
  toggleArchived: () => {
    set((state) => ({ showArchived: !state.showArchived }));
    get().applyFilters();
  },
  
  toggleTerritory: (territoryId: string) => {
    set((state) => ({
      selectedTerritories: state.selectedTerritories.includes(territoryId)
        ? state.selectedTerritories.filter(id => id !== territoryId)
        : [...state.selectedTerritories, territoryId],
    }));
    get().applyFilters();
  },
  
  toggleHeatmap: () => set((state) => ({ showHeatmap: !state.showHeatmap })),
  toggleLiveReps: () => set((state) => ({ showLiveReps: !state.showLiveReps })),
  
  selectAllTerritories: () => {
    const { territories } = get();
    set({ selectedTerritories: territories.map(t => t.id) });
    get().applyFilters();
  },
  
  deselectAllTerritories: () => {
    set({ selectedTerritories: [] });
    get().applyFilters();
  },
  
  applyFilters: () => {
    const { customers, showRecurring, showProjects, showArchived, selectedTerritories } = get();
    
    const filtered = customers.filter((customer) => {
      // Pipeline filter
      if (!showRecurring && customer.pipeline === 'recurring') return false;
      if (!showProjects && customer.pipeline === 'one_time') return false;
      
      // Status filter
      if (!showArchived && customer.status === 'archived') return false;
      if (showArchived && customer.status !== 'archived') return false;
      
      // Territory filter
      if (selectedTerritories.length > 0 && !selectedTerritories.includes(customer.territory_id)) {
        return false;
      }
      
      return true;
    });
    
    set({ filteredCustomers: filtered });
  },
  
  setLoadingCustomers: (loading) => set({ isLoadingCustomers: loading }),
  setLoadingTerritories: (loading) => set({ isLoadingTerritories: loading }),
}));
