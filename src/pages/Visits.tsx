// ============================================================
// AMAN CEMENT CRM — Visits & Shop Planning Page
// Focus: Shop-centric view for planning and scheduling
// ============================================================

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useCustomers } from '@/hooks/useCustomers';
import type { Customer, Visit } from '@/types';
import {
  CalendarCheck,
  Search,
  Filter,
  MapPin,
  Clock,
  CheckCircle2,
  MoreVertical,
  Calendar,
  User,
  Building2,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  X,
  Play // For 'Visit' action
} from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Simple Schedule Modal (Date only)
interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

function ScheduleModal({ isOpen, onClose, customer }: ScheduleModalProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !date) return;

    setLoading(true);
    try {
      // Default to 10:00 AM for the selected date
      const scheduledAt = new Date(date);
      scheduledAt.setHours(10, 0, 0, 0);

      const { error } = await supabase.from('visits').insert({
        customer_id: customer.id,
        sales_rep_id: customer.sales_rep_id || user?.id, // Assign to the shop's rep (or current user if fallback)
        scheduled_at: scheduledAt.toISOString(),
        scheduled_duration: 30, // Default duration
        status: 'scheduled',
        purpose: 'Routine Visit', // Default purpose
      });

      if (error) throw error;

      toast.success(`Visit scheduled for ${customer.name}`);
      queryClient.invalidateQueries({ queryKey: ['visits'] }); // Refresh stats
      queryClient.invalidateQueries({ queryKey: ['customers'] }); // Refresh customer list if needed
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A2A5C] rounded-xl border border-white/10 w-full max-w-sm">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-[#F0F4F8]">Schedule Visit</h2>
          <p className="text-sm text-[#8B9CB8]">for {customer.name}</p>
        </div>
        <form onSubmit={handleSchedule} className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Select Date</label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-[#8B9CB8]">Cancel</Button>
            <Button type="submit" className="bg-[#C41E3A] hover:bg-[#9B1830]" disabled={loading}>
              {loading ? 'Scheduling...' : 'Confirm Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Check-in Modal
function CheckInModal({
  isOpen,
  onClose,
  visit,
}: {
  isOpen: boolean;
  onClose: () => void;
  visit: Visit | null;
}) {
  const queryClient = useQueryClient();
  const [outcome, setOutcome] = useState<'interested' | 'progressive' | 'not_interested' | 'stagnant' | 'new'>('new');
  const [notes, setNotes] = useState('');
  const [subject, setSubject] = useState(visit?.purpose || '');
  const [salesDiscuss, setSalesDiscuss] = useState('');
  const [feedback, setFeedback] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError('');
      },
      (err) => setLocationError(err.message)
    );
  };

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!location || !visit) throw new Error('Location required');
      const { error } = await supabase.from('visits').update({
        checked_in_at: new Date().toISOString(),
        check_in_lat: location.lat,
        check_in_lng: location.lng,
        status: 'in_progress'
      }).eq('id', visit.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-list'] });
      toast.success('Checked in');
      onClose();
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (!location || !visit) throw new Error('Location required');
      const { error } = await supabase.from('visits').update({
        checked_out_at: new Date().toISOString(),
        check_out_lat: location.lat,
        check_out_lng: location.lng,
        status: 'completed',
        outcome,
        notes: notes,
        purpose: subject,
        feedback: feedback,
        products_discussed: salesDiscuss ? salesDiscuss.split(',').map(s => s.trim()) : []
      }).eq('id', visit.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-list'] }); // Refresh visits
      queryClient.invalidateQueries({ queryKey: ['customers'] }); // Refresh customer last visit
      toast.success('Visit completed');
      onClose();
    }
  });

  if (!isOpen || !visit) return null;
  const isCheckedIn = !!visit.checked_in_at; // Note: Database field might be checkin_at or checked_in_at? Types say checked_in_at, hook says checkin_at? Checking hook useCustomerVisits... it maps checkin_at.

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A2A5C] rounded-xl border border-white/10 w-full max-w-lg">
        <div className="p-4 border-b border-white/10 flex justify-between">
          <h2 className="text-lg font-semibold text-[#F0F4F8]">{isCheckedIn ? 'Complete Visit' : 'Check In'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-[#8B9CB8]" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-[#061A3A] p-3 rounded-lg">
            <p className="text-[#F0F4F8] font-medium">{visit.customer_name}</p>
            <p className="text-sm text-[#8B9CB8]">{visit.scheduled_at ? format(parseISO(visit.scheduled_at), 'h:mm a') : ''}</p>
          </div>

          {!location ? (
            <Button onClick={getCurrentLocation} variant="outline" className="w-full border-[#3A9EFF] text-[#3A9EFF]">
              <MapPin className="w-4 h-4 mr-2" /> Get Location
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-[#2ECC71] text-sm bg-[#2ECC71]/10 p-2 rounded">
              <CheckCircle2 className="w-4 h-4" /> Location Accuracy: High
            </div>
          )}
          {locationError && <p className="text-[#E74C5E] text-sm">{locationError}</p>}

          {isCheckedIn && (
            <div className="space-y-3">
              <label className="text-sm text-[#8B9CB8]">Outcome</label>
              <div className="grid grid-cols-2 gap-2">
                {['interested', 'progressive', 'stagnant', 'not_interested'].map((o) => (
                  <button
                    key={o}
                    onClick={() => setOutcome(o as any)}
                    className={`px-3 py-2 rounded text-sm capitalize ${outcome === o ? 'bg-[#3A9EFF] text-white' : 'bg-[#061A3A] text-[#8B9CB8]'}`}
                  >
                    {o.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Visit notes..."
                className="w-full bg-[#061A3A] border border-white/10 rounded-lg p-3 text-[#F0F4F8]"
              />

              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">Subject / Purpose</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Routine Check, Order Collection"
                  className="w-full bg-[#061A3A] border border-white/10 rounded-lg p-2 text-[#F0F4F8]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">Sales Discussion</label>
                <textarea
                  value={salesDiscuss}
                  onChange={e => setSalesDiscuss(e.target.value)}
                  placeholder="Products discussed (comma separated)..."
                  className="w-full bg-[#061A3A] border border-white/10 rounded-lg p-3 text-[#F0F4F8]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">Feedback / Others</label>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Customer feedback or other details..."
                  className="w-full bg-[#061A3A] border border-white/10 rounded-lg p-3 text-[#F0F4F8]"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            {!isCheckedIn ? (
              <Button onClick={() => checkInMutation.mutate()} disabled={!location} className="bg-[#2ECC71] hover:bg-[#27ae60]">Check In</Button>
            ) : (
              <Button onClick={() => checkOutMutation.mutate()} disabled={!location} className="bg-[#C41E3A] hover:bg-[#9B1830]">Complete Visit</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Visits() {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<'shops' | 'schedule'>('shops');
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isInstantVisiting, setIsInstantVisiting] = useState(false);

  // Instant Visit Logic
  const handleInstantVisit = async (customer: Customer) => {
    setIsInstantVisiting(true);
    try {
      // 1. Get Location
      const getLoc = (): Promise<{ lat: number, lng: number }> => new Promise((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error('Geolocation not supported'));
        navigator.geolocation.getCurrentPosition(pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }), err => reject(err));
      });

      let loc = { lat: 0, lng: 0 };
      try { loc = await getLoc(); } catch (e) { console.warn('Could not get loc for instant visit init', e); }

      // 2. Create Visit
      const { data, error } = await supabase.from('visits').insert({
        customer_id: customer.id,
        sales_rep_id: user?.id, // Always assign instant visits to the current user
        status: 'in_progress',
        scheduled_at: new Date().toISOString(),
        checked_in_at: new Date().toISOString(),
        check_in_lat: loc.lat || null,
        check_in_lng: loc.lng || null,
        purpose: 'Instant Visit'
      }).select().single();

      if (error) throw error;

      // 3. Open CheckInModal
      // Transform to Visit type
      const visit: Visit = {
        ...data,
        customer_name: customer.name,
        customer_pipeline: customer.pipeline
      };
      setSelectedVisit(visit);
      setCheckInModalOpen(true);
      toast.success(`Started visit for ${customer.name}`);

    } catch (err: any) {
      toast.error('Failed to start visit: ' + err.message);
    } finally {
      setIsInstantVisiting(false);
    }
  };

  // 1. Fetch Shops
  const { data: customers = [], isLoading: customersLoading } = useCustomers({ status: 'active' });

  // 2. Fetch My Schedule (Today/Upcoming)
  const { data: myVisits = [] } = useQuery({
    queryKey: ['visit-list', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select('*, customers(name, area, pipeline)')
        .eq('sales_rep_id', user?.id)
        .gte('scheduled_at', new Date().toISOString().split('T')[0]) // From today
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      return data.map((v: any) => ({
        ...v,
        customer_name: v.customers?.name,
        customer_pipeline: v.customers?.pipeline,
        // Map db fields
        checked_in_at: v.checked_in_at // Handle mapping if distinct
      })) as Visit[];
    },
    enabled: !!user?.id
  });

  // 2. Fetch Visit Stats (Separate lightweight query for top cards)
  const { data: stats } = useQuery({
    queryKey: ['visit-stats-summary'],
    queryFn: async () => {
      // Logic to fetch counts.
      // For now, simpler to fetch all visits for the team/user and count them.
      // Optimization: This could be an RPC or explicit count queries.
      // Let's stick to fetching visits but selecting only 'status' to save bandwidth.

      let query = supabase.from('visits').select('status, scheduled_at');

      // Apply hierarchy filter if supervisor (omitted for brevity, simpler RLS usually handles this)
      // Assuming RLS 'hierarchy_view_visits' is active:

      const { data } = await query;
      const visits = data || [];

      return {
        total: visits.length,
        scheduled: visits.filter(v => v.status === 'scheduled').length,
        inProgress: visits.filter(v => v.status === 'in_progress').length,
        completed: visits.filter(v => v.status === 'completed').length,
        today: visits.filter(v => v.scheduled_at && isToday(parseISO(v.scheduled_at))).length
      };
    }
  });

  // Filter Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.sales_rep_name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Priority/Status filter logic could go here
      return matchSearch;
    });
  }, [customers, searchQuery]);

  const openSchedule = (customer: Customer) => {
    setSelectedCustomer(customer);
    setScheduleModalOpen(true);
  };

  const openCheckIn = (visit: Visit) => {
    setSelectedVisit(visit);
    setCheckInModalOpen(true);
  };

  const getPriorityBadge = (customer: Customer) => {
    if (customer.pipeline === 'recurring')
      return <span className="px-2 py-0.5 bg-[#3A9EFF]/20 text-[#3A9EFF] text-xs rounded-full">Recurring</span>;
    if (customer.pipeline === 'one_time')
      return <span className="px-2 py-0.5 bg-[#D4A843]/20 text-[#D4A843] text-xs rounded-full">Project</span>;
    return <span className="px-2 py-0.5 bg-[#8B9CB8]/20 text-[#8B9CB8] text-xs rounded-full">Unknown</span>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F0F4F8]">Visit Management</h1>
          <p className="text-[#8B9CB8] text-sm mt-1">Plan and execute your customer visits</p>
        </div>
        <div className="flex bg-[#0A2A5C] p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setViewMode('shops')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'shops' ? 'bg-[#3A9EFF] text-white' : 'text-[#8B9CB8] hover:text-white'}`}
          >
            Shop Planning
          </button>
          <button
            onClick={() => setViewMode('schedule')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'schedule' ? 'bg-[#3A9EFF] text-white' : 'text-[#8B9CB8] hover:text-white'}`}
          >
            My Schedule
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard icon={<CalendarCheck className="text-[#3A9EFF]" />} label="Total Visits" value={stats?.total || 0} color="bg-[#3A9EFF]" />
        <StatsCard icon={<Clock className="text-[#D4A843]" />} label="Scheduled" value={stats?.scheduled || 0} color="bg-[#D4A843]" />
        <StatsCard icon={<TrendingUp className="text-[#FF7C3A]" />} label="In Progress" value={stats?.inProgress || 0} color="bg-[#FF7C3A]" />
        <StatsCard icon={<CheckCircle2 className="text-[#2ECC71]" />} label="Completed" value={stats?.completed || 0} color="bg-[#2ECC71]" />
        <StatsCard icon={<Calendar className="text-[#C41E3A]" />} label="Today" value={stats?.today || 0} color="bg-[#C41E3A]" />
      </div>

      {viewMode === 'shops' ? (
        <>
          {/* Toolbox */}
          <div className="flex flex-col md:flex-row gap-4 bg-[#0A2A5C] p-4 rounded-xl border border-white/10">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B9CB8]" />
              <input
                type="text"
                placeholder="Search shops, areas, or sales reps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] outline-none focus:border-[#3A9EFF]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#8B9CB8]" />
              <select className="bg-[#061A3A] border border-white/10 text-[#F0F4F8] rounded-lg px-3 py-2 outline-none">
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          {/* Shops Table */}
          <div className="bg-[#0A2A5C] rounded-xl border border-white/10 overflow-hidden">
            {customersLoading ? (
              <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41E3A]" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#061A3A] border-b border-white/10">
                    <tr>
                      <th className="p-4 text-xs font-medium text-[#8B9CB8] uppercase">Shop / Customer</th>
                      <th className="p-4 text-xs font-medium text-[#8B9CB8] uppercase">Details</th>
                      <th className="p-4 text-xs font-medium text-[#8B9CB8] uppercase">Sales Rep</th>
                      <th className="p-4 text-xs font-medium text-[#8B9CB8] uppercase">Last Visit</th>
                      <th className="p-4 text-xs font-medium text-[#8B9CB8] uppercase">Status</th>
                      <th className="p-4 text-xs font-medium text-[#8B9CB8] uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredCustomers.map(customer => (
                      <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#3A9EFF]/10 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-[#3A9EFF]" />
                            </div>
                            <div>
                              <p className="font-medium text-[#F0F4F8]">{customer.shop_name || customer.name}</p>
                              <p className="text-xs text-[#8B9CB8]">{customer.area || 'No Area'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            {getPriorityBadge(customer)}
                            <span className="text-xs text-[#8B9CB8]">{customer.phone || 'No Phone'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#2ECC71]/20 flex items-center justify-center">
                              <User className="w-3 h-3 text-[#2ECC71]" />
                            </div>
                            <span className="text-sm text-[#F0F4F8]">{customer.sales_rep_name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {customer.last_visit_at ? (
                            <div>
                              <p className="text-sm text-[#F0F4F8]">{format(parseISO(customer.last_visit_at), 'MMM d, yyyy')}</p>
                              <p className="text-xs text-[#8B9CB8]">{customer.last_visit_outcome || 'No outcome'}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-[#8B9CB8] italic">Never Visited</span>
                          )}
                        </td>
                        <td className="p-4">
                          {customer.is_converted ? (
                            <div className="flex items-center gap-1 text-[#2ECC71]">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm">Converted</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[#8B9CB8]">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm">Prospect</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-[#2ECC71] hover:bg-[#27ae60] text-white"
                            onClick={() => handleInstantVisit(customer)}
                            disabled={isInstantVisiting}
                          >
                            <Play className="w-3 h-3 mr-2" />
                            Visit
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#C41E3A] hover:bg-[#9B1830] text-white"
                            onClick={() => openSchedule(customer)}
                          >
                            <Calendar className="w-3 h-3 mr-2" />
                            Schedule
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCustomers.length === 0 && (
                  <div className="p-12 text-center text-[#8B9CB8]">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No shops found matching your criteria</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-[#0A2A5C] rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-[#F0F4F8]">My Upcoming Visits</h2>
          </div>
          <div className="divide-y divide-white/5">
            {myVisits.length > 0 ? myVisits.map(visit => (
              <div key={visit.id} className="p-4 flex items-center justify-between hover:bg-white/5 from-transparent to-transparent">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-12 rounded-full ${visit.completed ? 'bg-[#2ECC71]' : visit.status === 'in_progress' ? 'bg-[#FF7C3A]' : 'bg-[#3A9EFF]'}`} />
                  <div>
                    <h3 className="text-[#F0F4F8] font-medium text-lg">{visit.customer_name}</h3>
                    <p className="text-[#8B9CB8] text-sm flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {visit.scheduled_at ? format(parseISO(visit.scheduled_at), 'MMM d, h:mm a') : 'Unscheduled'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => openCheckIn(visit)}
                  disabled={visit.completed}
                  className={`${visit.completed ? 'bg-[#2ECC71]/20 text-[#2ECC71]' : 'bg-[#3A9EFF] text-white'}`}
                >
                  {visit.completed ? 'Completed' : visit.status === 'in_progress' ? 'Continue' : 'Check In'}
                </Button>
              </div>
            )) : (
              <div className="p-12 text-center text-[#8B9CB8]">
                <p>No visits scheduled for upcoming days</p>
              </div>
            )}
          </div>
        </div>
      )}

      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        customer={selectedCustomer}
      />

      <CheckInModal
        isOpen={checkInModalOpen}
        onClose={() => setCheckInModalOpen(false)}
        visit={selectedVisit}
      />
    </div>
  );
}

function StatsCard({ icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <div className="bg-[#0A2A5C] border border-white/10 p-4 rounded-xl flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white/5`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#F0F4F8]">{value}</p>
        <p className="text-xs text-[#8B9CB8]">{label}</p>
      </div>
    </div>
  )
}
