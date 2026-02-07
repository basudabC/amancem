import { useState } from 'react';
import { APP_CONFIG } from '@/lib/constants';
import { Bell, Search, Menu, X, MapPin, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';

export function Header() {
  const { user } = useAuthStore();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Poll every 30s
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user?.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <header className="h-16 bg-[#0A2A5C] border-b border-white/10 flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center gap-6">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {showMobileMenu ? (
            <X className="w-5 h-5 text-[#F0F4F8]" />
          ) : (
            <Menu className="w-5 h-5 text-[#F0F4F8]" />
          )}
        </button>

        {/* Page Title & Date */}
        <div>
          <h1 className="text-[#F0F4F8] font-semibold text-lg">
            {APP_CONFIG.name}
          </h1>
          <p className="text-[#8B9CB8] text-xs">{currentDate}</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center bg-[#0F3460] rounded-lg px-3 py-2 border border-white/10">
          <Search className="w-4 h-4 text-[#8B9CB8] mr-2" />
          <input
            type="text"
            placeholder="Search customers, territories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-[#F0F4F8] text-sm placeholder-[#4A5B7A] outline-none w-64"
          />
        </div>

        {/* Location Indicator */}
        <div className="hidden lg:flex items-center gap-2 text-[#8B9CB8]">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">Dhaka, Bangladesh</span>
        </div>

        {/* Notifications Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors outline-none">
              <Bell className="w-5 h-5 text-[#8B9CB8]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#C41E3A] rounded-full animate-pulse" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-[#0A2A5C] border-white/10 mr-4" align="end">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-[#F0F4F8]">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs text-[#3A9EFF] hover:text-[#2D7FCC] flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[#8B9CB8]">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notification: any) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-white/5 transition-colors cursor-pointer ${!notification.is_read ? 'bg-[#3A9EFF]/5' : ''}`}
                      onClick={() => !notification.is_read && markAsRead.mutate(notification.id)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-sm ${!notification.is_read ? 'text-[#F0F4F8] font-medium' : 'text-[#8B9CB8]'}`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && <span className="w-1.5 h-1.5 bg-[#3A9EFF] rounded-full mt-1.5 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-[#8B9CB8] mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-[#4A5B7A] mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Company Logo */}
        <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right">
            <p className="text-[#F0F4F8] text-sm font-medium">
              {APP_CONFIG.company}
            </p>
            <p className="text-[#8B9CB8] text-[10px]">
              {APP_CONFIG.parentGroup}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
