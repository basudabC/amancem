// ============================================================
// AMAN CEMENT CRM — Top Header Component
// ============================================================

import { useState } from 'react';
import { APP_CONFIG } from '@/lib/constants';
import { Bell, Search, Menu, X, MapPin } from 'lucide-react';

export function Header() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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

        {/* Notifications */}
        <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-[#8B9CB8]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#C41E3A] rounded-full" />
        </button>

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
