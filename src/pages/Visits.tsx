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
  Calendar as CalendarIcon,
  Plus,
  MapPin,
  Clock,
  MoreVertical,
  CheckCircle2,
  X,
  AlertCircle,
  Navigation,
  ArrowRight,
  TrendingUp,
  Play,
  CalendarCheck,
  Search,
  Filter,
  Calendar,
  User,
  Building2
} from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/useSettings';
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

// Haversine distance calculation (in meters)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
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
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinRange, setIsWithinRange] = useState<boolean>(false);

  // ... (inside CheckInModal)
  const { data: settings } = useSettings();

  // Validate location against customer coordinates
  const validateLocation = (currentLat: number, currentLng: number) => {
    console.log('Validating Location:', {
      current: { lat: currentLat, lng: currentLng },
      customer: { lat: visit?.customer_lat, lng: visit?.customer_lng },
      settings: settings
    });

    if (visit?.customer_lat && visit?.customer_lng) {
      const dist = calculateDistance(currentLat, currentLng, visit.customer_lat, visit.customer_lng);
      const radius = settings?.visit_geofence_radius || 200;

      console.log('Distance Calc:', { dist, radius, isWithin: dist <= radius });

      setDistance(dist);
      setIsWithinRange(dist <= radius);
    } else {
      console.log('No customer coordinates, bypassing strict check');
      // STRICT MODE: If customer has no location, we cannot verify range, so we BLOCK check-in
      setDistance(null);
      setIsWithinRange(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const speed = pos.coords.speed ? pos.coords.speed * 3.6 : 0; // Convert m/s to km/h

        setLocation({ lat, lng });
        setLocationError('');

        // Speed Validation
        if (settings?.max_check_in_speed && speed > settings.max_check_in_speed) {
          setLocationError(`Speed too high (${speed.toFixed(1)} km/h). Max allowed: ${settings.max_check_in_speed} km/h. Please stop moving to check in.`);
          return; // Prevent setting location if speed is too high
        }

        validateLocation(lat, lng);
      },
      (err) => setLocationError(err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!location || !visit) throw new Error('Location required');

      const { error } = await supabase.from('visits').update({
        checked_in_at: new Date().toISOString(),
        check_in_lat: location.lat,
        check_in_lng: location.lng,
        check_in_accuracy: distance, // Storing distance as accuracy for now or create specific column
        distance_from_customer: distance,
        is_within_geofence: isWithinRange,
        status: 'in_progress'
      }).eq('id', visit.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-list'] });
      toast.success(isWithinRange ? 'Checked in successfully' : 'Checked in with Location Warning');
      onClose();
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      // Re-validate location on check-out
      if (!location) throw new Error('Location required for check-out');

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
      }).eq('id', visit?.id);
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
  const isCheckedIn = !!visit.checked_in_at;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A2A5C] rounded-xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-white/10 flex justify-between">
          <h2 className="text-lg font-semibold text-[#F0F4F8]">{isCheckedIn ? 'Complete Visit' : 'Check In'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-[#8B9CB8]" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-[#061A3A] p-3 rounded-lg">
            <p className="text-[#F0F4F8] font-medium">{visit.customer_name}</p>
            <p className="text-sm text-[#8B9CB8] mb-1">{visit.scheduled_at ? format(parseISO(visit.scheduled_at), 'h:mm a') : ''}</p>
            {visit.customer_lat && visit.customer_lng ? (
              <div className="flex items-center gap-1 text-xs text-[#8B9CB8]">
                <MapPin className="w-3 h-3" />
                Store Location: {visit.customer_lat.toFixed(4)}, {visit.customer_lng.toFixed(4)}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-[#D4A843]">
                <AlertCircle className="w-3 h-3" />
                Store location not set
              </div>
            )}
          </div>

          {/* Working Hours Warning */}
          {(() => {
            if (!settings) return null;
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const [startH, startM] = settings.working_hours_start.split(':').map(Number);
            const [endH, endM] = settings.working_hours_end.split(':').map(Number);
            const startTime = startH * 60 + startM;
            const endTime = endH * 60 + endM;

            if (currentTime < startTime || currentTime > endTime) {
              return (
                <div className="flex items-center gap-2 p-2 bg-[#D4A843]/10 border border-[#D4A843]/30 rounded-lg text-[#D4A843] text-xs">
                  <Clock className="w-4 h-4" />
                  <span>Outside Working Hours ({settings.working_hours_start} - {settings.working_hours_end})</span>
                </div>
              );
            }
            return null;
          })()}

          {!location ? (
            <Button onClick={getCurrentLocation} variant="outline" className="w-full border-[#3A9EFF] text-[#3A9EFF]">
              <MapPin className="w-4 h-4 mr-2" /> Get My Location
            </Button>
          ) : (
            <div className={`flex flex-col gap-2 p-3 rounded-lg border ${isWithinRange ? 'bg-[#2ECC71]/10 border-[#2ECC71]/30' : 'bg-[#E74C5E]/10 border-[#E74C5E]/30'}`}>
              <div className="flex items-center gap-2">
                {isWithinRange ? <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" /> : <AlertCircle className="w-4 h-4 text-[#E74C5E]" />}
                <span className={`text-sm font-medium ${isWithinRange ? 'text-[#2ECC71]' : 'text-[#E74C5E]'}`}>
                  {isWithinRange ? 'Location Verified' : distance === null ? 'Shop Location Missing' : 'Location Mismatch'}
                </span>
              </div>
              {distance !== null ? (
                <p className="text-xs text-[#8B9CB8] ml-6">
                  Distance from shop: <span className="text-[#F0F4F8]">{Math.round(distance)} meters</span>
                  <br />
                  (Allowed range: {settings?.visit_geofence_radius || 200}m)
                </p>
              ) : (
                <p className="text-xs text-[#E74C5E] ml-6">
                  Cannot verify location. Please set shop location in customer details.
                </p>
              )}
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
              <Button
                onClick={() => checkInMutation.mutate()}
                disabled={!location || !isWithinRange}
                className={`text-white ${isWithinRange ? 'bg-[#2ECC71] hover:bg-[#27ae60]' : 'bg-[#8B9CB8] cursor-not-allowed opacity-50'}`}
              >
                {isWithinRange ? 'Check In' : distance === null ? 'Check In Blocked' : 'Move Closer to Check In'}
              </Button>
            ) : (
              <Button onClick={() => checkOutMutation.mutate()} disabled={!location} className="bg-[#C41E3A] hover:bg-[#9B1830]">Complete Visit</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Error Modal
function ErrorModal({ isOpen, onClose, title, message }: { isOpen: boolean; onClose: () => void; title: string; message: string }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0A2A5C] rounded-xl border border-[#E74C5E]/50 w-full max-w-sm shadow-[0_0_50px_-12px_rgba(231,76,94,0.5)]">
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#E74C5E]/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-[#E74C5E]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#F0F4F8] mb-2">{title}</h3>
            <p className="text-[#8B9CB8] text-sm">{message}</p>
          </div>
          <Button onClick={onClose} className="w-full bg-[#E74C5E] hover:bg-[#C41E3A] text-white">
            Understood
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Visits() {
  const { user } = useAuthStore();
  const { data: settings } = useSettings(); // Need settings for instant visit check
  const [viewMode, setViewMode] = useState<'shops' | 'schedule'>('shops');
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isInstantVisiting, setIsInstantVisiting] = useState(false);
  // Default 'mine' for sales reps so they see only their own shops by default
  const [priorityFilter, setPriorityFilter] = useState<'mine' | 'all'>(
    user?.role === 'sales_rep' ? 'mine' : 'all'
  );

  // Error Modal State
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const queryClient = useQueryClient();

  // Helper to log notification
  const logErrorNotification = async (title: string, message: string) => {
    try {
      await supabase.from('notifications').insert({
        user_id: user?.id,
        title: title,
        message: message,
        type: 'alert',
        is_read: false
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (e) {
      console.error('Failed to log notification', e);
    }
  };

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
      try { loc = await getLoc(); } catch (e) {
        throw new Error('Could not get location. Location is required for visit.');
      }

      // 2. Validate Geofence (Strict Check)
      if (customer.lat && customer.lng) {
        const dist = calculateDistance(loc.lat, loc.lng, customer.lat, customer.lng);
        const radius = settings?.visit_geofence_radius || 200;

        console.log('Instant Visit Check:', {
          shop: customer.name,
          userLoc: loc,
          shopLoc: { lat: customer.lat, lng: customer.lng },
          distance: dist,
          radius: radius,
          allowed: dist <= radius
        });

        if (dist > radius) {
          const title = 'Location Mismatch';
          const msg = `You are ${Math.round(dist)}m away from ${customer.name}. Allowed range is ${radius}m. Please move closer to check in.`;

          setErrorTitle(title);
          setErrorMessage(msg);
          setErrorModalOpen(true);
          logErrorNotification(title, msg);

          throw new Error('GE_ERROR'); // Custom error to skip toast in catch block
        }
      } else {
        // STRICT MODE: Block if no location
        const title = 'Shop Location Missing';
        const msg = `${customer.name} does not have a set location. You cannot perform a visit check-in until the location is updated.`;

        setErrorTitle(title);
        setErrorMessage(msg);
        setErrorModalOpen(true);
        logErrorNotification(title, msg);

        throw new Error('GE_ERROR');
      }

      // 3. Create Visit
      const { data, error } = await supabase.from('visits').insert({
        customer_id: customer.id,
        sales_rep_id: user?.id, // Always assign instant visits to the current user
        status: 'in_progress',
        scheduled_at: new Date().toISOString(),
        checked_in_at: new Date().toISOString(),
        check_in_lat: loc.lat || null,
        check_in_lng: loc.lng || null,
        check_in_accuracy: 0,
        distance_from_customer: 0,
        is_within_geofence: true,
        purpose: 'Instant Visit'
      }).select().single();

      if (error) throw error;

      // 4. Open CheckInModal
      // Transform to Visit type
      const visit: Visit = {
        ...data,
        customer_name: customer.name,
        customer_pipeline: customer.pipeline,
        customer_lat: customer.lat, // Pass customer coords for validation
        customer_lng: customer.lng
      };
      setSelectedVisit(visit);
      setCheckInModalOpen(true);
      toast.success(`Started visit for ${customer.name}`);

    } catch (err: any) {
      console.error('Instant Visit Error:', err);
      // Only show generic toast if it's NOT our custom GE_ERROR
      if (err.message !== 'GE_ERROR') {
        toast.error(err.message);
      }
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
        .select('*, customers(name, area, pipeline, lat, lng)') // Fetch lat, lng
        .eq('sales_rep_id', user?.id)
        .gte('scheduled_at', new Date().toISOString().split('T')[0]) // From today
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      return data.map((v: any) => ({
        ...v,
        customer_name: v.customers?.name,
        customer_pipeline: v.customers?.pipeline,
        customer_lat: v.customers?.lat,
        customer_lng: v.customers?.lng,
        // Map db fields
        checked_in_at: v.checked_in_at // Handle mapping if distinct
      })) as Visit[];
    },
    enabled: !!user?.id
  });

  // 2. Fetch Visit Stats — monthly total + today breakdown, scoped to current user for sales reps
  const { data: stats } = useQuery({
    queryKey: ['visit-stats-summary', user?.id, user?.role],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      let query = supabase
        .from('visits')
        .select('id, status, scheduled_at, checked_in_at')
        .gte('scheduled_at', startOfMonth); // This month only

      // Sales reps only see their own visits in stats
      if (user?.role === 'sales_rep' && user?.id) {
        query = query.eq('sales_rep_id', user.id);
      }

      const { data } = await query;
      const visits = data || [];

      const todayVisits = visits.filter(v =>
        v.scheduled_at && new Date(v.scheduled_at) >= new Date(startOfToday)
      );

      return {
        monthly: visits.length,
        today: todayVisits.length,
        scheduled: visits.filter(v => v.status === 'scheduled').length,
        inProgress: visits.filter(v => v.status === 'in_progress').length,
        completed: visits.filter(v => v.status === 'completed').length,
        todayDone: todayVisits.filter(v => v.status === 'completed').length,
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  // Filter Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.sales_rep_name?.toLowerCase().includes(searchQuery.toLowerCase());

      // For sales reps: 'mine' = only shops they created; 'all' = everyone
      const matchOwner =
        priorityFilter === 'all' || user?.role !== 'sales_rep'
          ? true
          : (c as any).created_by === user?.id;

      return matchSearch && matchOwner;
    });
  }, [customers, searchQuery, priorityFilter, user]);

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          icon={<CalendarCheck className="text-[#3A9EFF]" />}
          label="Monthly Visits"
          value={stats?.monthly ?? 0}
          color="bg-[#3A9EFF]"
        />
        <StatsCard
          icon={<Calendar className="text-[#2ECC71]" />}
          label="Today's Visits"
          value={stats?.today ?? 0}
          color="bg-[#2ECC71]"
        />
        <StatsCard
          icon={<CheckCircle2 className="text-[#9B6BFF]" />}
          label="Done Today"
          value={stats?.todayDone ?? 0}
          color="bg-[#9B6BFF]"
        />
        <StatsCard
          icon={<Clock className="text-[#D4A843]" />}
          label="Scheduled"
          value={stats?.scheduled ?? 0}
          color="bg-[#D4A843]"
        />
        <StatsCard
          icon={<TrendingUp className="text-[#FF7C3A]" />}
          label="In Progress"
          value={stats?.inProgress ?? 0}
          color="bg-[#FF7C3A]"
        />
        <StatsCard
          icon={<CheckCircle2 className="text-[#C41E3A]" />}
          label="Completed"
          value={stats?.completed ?? 0}
          color="bg-[#C41E3A]"
        />
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
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value as 'mine' | 'all')}
                className="bg-[#061A3A] border border-white/10 text-[#F0F4F8] rounded-lg px-3 py-2 outline-none focus:border-[#3A9EFF]"
              >
                {user?.role === 'sales_rep' && (
                  <option value="mine">My Shops</option>
                )}
                <option value="all">All Priorities</option>
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

      <ErrorModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title={errorTitle}
        message={errorMessage}
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
