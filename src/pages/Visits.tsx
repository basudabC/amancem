// ============================================================
// AMAN CEMENT CRM — Visits Page
// Complete visit management with scheduling, check-in/out, and tracking
// ============================================================

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Customer, Visit, VisitOutcome } from '@/types';
import {
  CalendarCheck,
  Search,
  Plus,
  Filter,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Phone,
  Navigation,
  Mic,
  FileText,
  X,
  Calendar,
  User
} from 'lucide-react';
import { format, isToday, isPast, isFuture, parseISO } from 'date-fns';
import { toast } from 'sonner';

// Visit Form Modal
interface VisitFormData {
  customer_id: string;
  scheduled_at: string;
  scheduled_duration: number;
  purpose: string;
  notes: string;
}

const initialFormData: VisitFormData = {
  customer_id: '',
  scheduled_at: '',
  scheduled_duration: 30,
  purpose: '',
  notes: '',
};

const outcomes: { value: VisitOutcome; label: string; color: string }[] = [
  { value: 'new', label: 'New Prospect', color: 'bg-[#3A9EFF]' },
  { value: 'interested', label: 'Interested', color: 'bg-[#2ECC71]' },
  { value: 'progressive', label: 'Progressive', color: 'bg-[#D4A843]' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-[#E74C5E]' },
  { value: 'stagnant', label: 'Stagnant', color: 'bg-[#8B9CB8]' },
];

function VisitModal({
  isOpen,
  onClose,
  visit,
  customers
}: {
  isOpen: boolean;
  onClose: () => void;
  visit?: Visit | null;
  customers: Customer[];
}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<VisitFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useState(() => {
    if (visit) {
      setFormData({
        customer_id: visit.customer_id,
        scheduled_at: visit.scheduled_at ? format(parseISO(visit.scheduled_at), "yyyy-MM-dd'T'HH:mm") : '',
        scheduled_duration: 30,
        purpose: '',
        notes: visit.note || '',
      });
    } else {
      setFormData(initialFormData);
    }
  });

  const saveVisit = useMutation({
    mutationFn: async (data: VisitFormData) => {
      const visitData = {
        customer_id: data.customer_id,
        sales_rep_id: user?.id,
        scheduled_at: data.scheduled_at ? new Date(data.scheduled_at).toISOString() : null,
        scheduled_duration: data.scheduled_duration,
        purpose: data.purpose,
        notes: data.notes,
        status: 'scheduled',
      };

      if (visit) {
        const { error } = await supabase
          .from('visits')
          .update(visitData)
          .eq('id', visit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('visits').insert([visitData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast.success(visit ? 'Visit updated successfully' : 'Visit scheduled successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save visit');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await saveVisit.mutateAsync(formData);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A2A5C] rounded-xl border border-white/10 w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-[#F0F4F8]">
            {visit ? 'Edit Visit' : 'Schedule New Visit'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-[#8B9CB8]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Customer *</label>
            <select
              required
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[#8B9CB8]">Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#8B9CB8]">Duration (minutes)</label>
              <select
                value={formData.scheduled_duration}
                onChange={(e) => setFormData({ ...formData, scheduled_duration: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Purpose</label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="e.g., Follow-up on order, New product demo"
              className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none resize-none"
            />
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
                <CalendarCheck className="w-4 h-4" />
              )}
              {visit ? 'Update Visit' : 'Schedule Visit'}
            </button>
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
  const [outcome, setOutcome] = useState<VisitOutcome>('new');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string>('');

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError('');
      },
      (error) => {
        setLocationError('Unable to retrieve your location: ' + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!location || !visit) throw new Error('Location required');

      const { error } = await supabase
        .from('visits')
        .update({
          checked_in_at: new Date().toISOString(),
          check_in_lat: location.lat,
          check_in_lng: location.lng,
          status: 'in_progress',
        })
        .eq('id', visit.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast.success('Checked in successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to check in');
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (!location || !visit) throw new Error('Location required');

      const { error } = await supabase
        .from('visits')
        .update({
          checked_out_at: new Date().toISOString(),
          check_out_lat: location.lat,
          check_out_lng: location.lng,
          outcome,
          note: notes,
          status: 'completed',
          completed: true,
        })
        .eq('id', visit.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast.success('Visit completed successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to complete visit');
    },
  });

  if (!isOpen || !visit) return null;

  const isCheckedIn = !!visit.checkin_at;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A2A5C] rounded-xl border border-white/10 w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-[#F0F4F8]">
            {isCheckedIn ? 'Complete Visit' : 'Check In'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-[#8B9CB8]" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Visit Info */}
          <div className="bg-[#061A3A] rounded-lg p-4">
            <p className="font-medium text-[#F0F4F8]">{visit.customer_name}</p>
            <p className="text-sm text-[#8B9CB8]">
              Scheduled: {visit.scheduled_at ? format(parseISO(visit.scheduled_at), 'MMM d, h:mm a') : 'N/A'}
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Your Location</label>
            {!location ? (
              <button
                onClick={getCurrentLocation}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] hover:bg-[#0F3460] transition-colors"
              >
                <MapPin className="w-5 h-5 text-[#C41E3A]" />
                Get Current Location
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 bg-[#2ECC71]/10 border border-[#2ECC71]/30 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-[#2ECC71]" />
                <span className="text-[#F0F4F8]">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </span>
              </div>
            )}
            {locationError && (
              <p className="text-sm text-[#E74C5E]">{locationError}</p>
            )}
          </div>

          {/* Outcome (for check-out) */}
          {isCheckedIn && (
            <>
              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">Visit Outcome *</label>
                <div className="grid grid-cols-2 gap-2">
                  {outcomes.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setOutcome(o.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${outcome === o.value
                        ? `${o.color} text-white`
                        : 'bg-[#061A3A] text-[#8B9CB8] hover:bg-[#0F3460]'
                        }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#8B9CB8]">Visit Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="What happened during the visit?"
                  className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none resize-none"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[#8B9CB8] hover:text-[#F0F4F8] hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {!isCheckedIn ? (
              <button
                onClick={() => checkInMutation.mutate()}
                disabled={!location || checkInMutation.isPending}
                className="px-4 py-2 bg-[#2ECC71] hover:bg-[#27ae60] text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {checkInMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                Check In
              </button>
            ) : (
              <button
                onClick={() => checkOutMutation.mutate()}
                disabled={!location || checkOutMutation.isPending}
                className="px-4 py-2 bg-[#C41E3A] hover:bg-[#9B1830] text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {checkOutMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Complete Visit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Visits Page
export function Visits() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'upcoming' | 'past'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Fetch visits with customer details
  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['visits'],
    queryFn: async () => {
      let query = supabase
        .from('visits')
        .select(`
          *,
          customers:customer_id (name, phone, area, pipeline)
        `)
        .order('scheduled_at', { ascending: true });

      // Apply role-based filtering
      if (user?.role === 'sales_rep') {
        query = query.eq('sales_rep_id', user.id);
      } else if (user?.role === 'supervisor') {
        const { data: teamIds } = await supabase
          .from('profiles')
          .select('id')
          .eq('reports_to', user.id);
        if (teamIds) {
          query = query.in('sales_rep_id', teamIds.map(t => t.id));
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Visit[];
    },
  });

  // Fetch customers for scheduling
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-for-visits'],
    queryFn: async () => {
      let query = supabase.from('customers').select('*').eq('status', 'active');

      if (user?.role === 'sales_rep') {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data as Customer[];
    },
  });

  // Delete mutation
  const deleteVisit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('visits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      toast.success('Visit deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete visit');
    },
  });

  // Filter visits
  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      // Search filter
      const matchesSearch =
        (visit.customers as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (visit.customers as any)?.area?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = filterStatus === 'all' || visit.status === filterStatus;

      // Date filter
      let matchesDate = true;
      const scheduledDate = visit.scheduled_at ? parseISO(visit.scheduled_at) : null;
      if (filterDate === 'today' && scheduledDate) matchesDate = isToday(scheduledDate);
      if (filterDate === 'upcoming' && scheduledDate) matchesDate = isFuture(scheduledDate);
      if (filterDate === 'past' && scheduledDate) matchesDate = isPast(scheduledDate) && !isToday(scheduledDate);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [visits, searchQuery, filterStatus, filterDate]);

  // Stats
  const stats = useMemo(() => {
    const total = visits.length;
    const scheduled = visits.filter(v => v.status === 'scheduled').length;
    const inProgress = visits.filter(v => v.status === 'in_progress').length;
    const completed = visits.filter(v => v.status === 'completed').length;
    const todayVisits = visits.filter(v => v.scheduled_at && isToday(parseISO(v.scheduled_at))).length;

    return { total, scheduled, inProgress, completed, todayVisits };
  }, [visits]);

  const handleSchedule = () => {
    setSelectedVisit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (visit: Visit) => {
    setSelectedVisit(visit);
    setIsModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleCheckIn = (visit: Visit) => {
    setSelectedVisit(visit);
    setIsCheckInModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this visit?')) {
      await deleteVisit.mutateAsync(id);
    }
    setActionMenuOpen(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <span className="px-2 py-1 bg-[#3A9EFF]/20 text-[#3A9EFF] text-xs rounded-full">Scheduled</span>;
      case 'in_progress':
        return <span className="px-2 py-1 bg-[#D4A843]/20 text-[#D4A843] text-xs rounded-full">In Progress</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-[#2ECC71]/20 text-[#2ECC71] text-xs rounded-full">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-[#E74C5E]/20 text-[#E74C5E] text-xs rounded-full">Cancelled</span>;
      default:
        return <span className="px-2 py-1 bg-[#8B9CB8]/20 text-[#8B9CB8] text-xs rounded-full">{status}</span>;
    }
  };

  const getOutcomeBadge = (outcome?: VisitOutcome) => {
    if (!outcome) return null;
    const o = outcomes.find(x => x.value === outcome);
    if (!o) return null;
    return <span className={`px-2 py-1 ${o.color}/20 text-white text-xs rounded-full`}>{o.label}</span>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F0F4F8]">Visit Management</h1>
          <p className="text-[#8B9CB8] text-sm mt-1">Schedule, track, and manage customer visits</p>
        </div>
        <button
          onClick={handleSchedule}
          className="flex items-center gap-2 px-4 py-2 bg-[#C41E3A] hover:bg-[#9B1830] text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Schedule Visit
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3A9EFF]/20 rounded-lg flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-[#3A9EFF]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F0F4F8]">{stats.total}</p>
              <p className="text-xs text-[#8B9CB8]">Total Visits</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4A843]/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#D4A843]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F0F4F8]">{stats.scheduled}</p>
              <p className="text-xs text-[#8B9CB8]">Scheduled</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF7C3A]/20 rounded-lg flex items-center justify-center">
              <Navigation className="w-5 h-5 text-[#FF7C3A]" />
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
              <p className="text-2xl font-bold text-[#F0F4F8]">{stats.completed}</p>
              <p className="text-xs text-[#8B9CB8]">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0A2A5C] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C41E3A]/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#C41E3A]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F0F4F8]">{stats.todayVisits}</p>
              <p className="text-xs text-[#8B9CB8]">Today</p>
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
            placeholder="Search visits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] placeholder:text-[#4A5B7A] focus:border-[#3A9EFF] outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8B9CB8]" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#8B9CB8]" />
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value as any)}
            className="px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>
      </div>

      {/* Visits Table */}
      <div className="bg-[#0A2A5C] rounded-xl border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C41E3A]" />
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarCheck className="w-16 h-16 text-[#4A5B7A] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#F0F4F8]">No visits found</h3>
            <p className="text-[#8B9CB8] text-sm mt-1">Schedule your first visit to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#061A3A]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Scheduled</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Outcome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Check-in</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Notes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8B9CB8] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredVisits.map((visit) => {
                  const customer = visit.customers as any;
                  const isScheduled = visit.status === 'scheduled';
                  const isInProgress = visit.status === 'in_progress';

                  return (
                    <tr key={visit.id} className="hover:bg-white/5">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#3A9EFF]/20 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-[#3A9EFF]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#F0F4F8]">{customer?.name || 'Unknown'}</p>
                            <p className="text-xs text-[#8B9CB8]">{customer?.pipeline || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {visit.scheduled_at ? (
                          <div>
                            <p className="text-sm text-[#F0F4F8]">
                              {format(parseISO(visit.scheduled_at), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-[#8B9CB8]">
                              {format(parseISO(visit.scheduled_at), 'h:mm a')}
                              {visit.scheduled_duration && ` (${visit.scheduled_duration} min)`}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-[#8B9CB8]">Not scheduled</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(visit.status)}
                      </td>
                      <td className="px-4 py-4">
                        {getOutcomeBadge(visit.outcome) || (
                          <span className="text-sm text-[#8B9CB8]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {visit.checkin_at ? (
                          <div>
                            <p className="text-sm text-[#F0F4F8]">
                              {format(parseISO(visit.checkin_at), 'h:mm a')}
                            </p>
                            {visit.check_in_lat && (
                              <p className="text-xs text-[#8B9CB8]">
                                {visit.check_in_lat.toFixed(4)}, {visit.check_in_lng?.toFixed(4)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-[#8B9CB8]">Not checked in</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {visit.note ? (
                          <p className="text-sm text-[#F0F4F8] truncate max-w-[150px]">{visit.note}</p>
                        ) : (
                          <span className="text-sm text-[#8B9CB8]">No notes</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="relative flex items-center justify-end gap-2">
                          {(isScheduled || isInProgress) && (
                            <button
                              onClick={() => handleCheckIn(visit)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isInProgress
                                ? 'bg-[#C41E3A] text-white hover:bg-[#9B1830]'
                                : 'bg-[#2ECC71] text-white hover:bg-[#27ae60]'
                                }`}
                            >
                              {isInProgress ? 'Complete' : 'Check In'}
                            </button>
                          )}
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === visit.id ? null : visit.id)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-[#8B9CB8]" />
                          </button>
                          {actionMenuOpen === visit.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-[#0F3460] rounded-lg border border-white/10 shadow-xl z-10">
                              <button
                                onClick={() => handleEdit(visit)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#F0F4F8] hover:bg-white/10"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(visit.id)}
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

      {/* Modals */}
      <VisitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        visit={selectedVisit}
        customers={customers}
      />

      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        visit={selectedVisit}
      />
    </div>
  );
}
