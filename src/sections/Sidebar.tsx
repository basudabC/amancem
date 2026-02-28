// ============================================================
// AMAN CEMENT CRM — Navigation Sidebar
// ============================================================

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { APP_CONFIG } from '@/lib/constants';
import {
  LayoutDashboard,
  Map,
  Users,
  Store,
  Building2,
  Route,
  CalendarCheck,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  UserCog,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';


interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['sales_rep', 'supervisor', 'area_manager', 'regional_manager', 'division_head', 'country_head'] },
  { path: '/map', label: 'Territory Map', icon: <Map className="w-5 h-5" />, roles: ['sales_rep', 'supervisor', 'area_manager', 'regional_manager', 'division_head', 'country_head'] },
  { path: '/customers', label: 'Customers', icon: <Store className="w-5 h-5" />, roles: ['sales_rep', 'supervisor', 'area_manager', 'regional_manager', 'division_head', 'country_head'] },
  { path: '/sales', label: 'Sales', icon: <DollarSign className="w-5 h-5" />, roles: ['sales_rep', 'supervisor', 'area_manager', 'regional_manager', 'division_head', 'country_head'] },
  { path: '/projects', label: 'Projects', icon: <Building2 className="w-5 h-5" />, roles: ['sales_rep', 'supervisor', 'area_manager', 'regional_manager', 'division_head', 'country_head'] },
  { path: '/routes', label: 'My Routes', icon: <Route className="w-5 h-5" />, roles: ['sales_rep'] },
  { path: '/visits', label: 'Visits', icon: <CalendarCheck className="w-5 h-5" />, roles: ['sales_rep', 'supervisor', 'area_manager', 'regional_manager', 'division_head', 'country_head'] },
  { path: '/team', label: 'Team', icon: <Users className="w-5 h-5" />, roles: ['supervisor', 'area_manager', 'regional_manager', 'division_head', 'country_head'] },
  { path: '/analytics', label: 'Analytics', icon: <TrendingUp className="w-5 h-5" />, roles: ['supervisor', 'area_manager', 'regional_manager', 'division_head', 'country_head'] },
  { path: '/detailed-analytics', label: 'Field Analytics', icon: <BarChart3 className="w-5 h-5" />, roles: ['sales_rep', 'supervisor', 'area_manager', 'regional_manager', 'division_head', 'country_head'] },
  { path: '/market-intelligence', label: 'Market Intelligence', icon: <PieChartIcon className="w-5 h-5" />, roles: ['supervisor', 'area_manager', 'regional_manager', 'division_head', 'country_head'] },
  { path: '/territories', label: 'Territories', icon: <Shield className="w-5 h-5" />, roles: ['supervisor', 'area_manager', 'regional_manager', 'division_head', 'country_head'] },
  { path: '/admin', label: 'Admin', icon: <UserCog className="w-5 h-5" />, roles: ['country_head'] }, // Admin is likely only for country_head or explicit admins
  { path: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, roles: ['sales_rep', 'supervisor', 'area_manager', 'regional_manager', 'division_head', 'country_head'] },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();

  const filteredNavItems = navItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <aside
      className={`h-screen bg-[#0A2A5C] border-r border-white/10 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
        }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#C41E3A] to-[#9B1830] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AC</span>
            </div>
            <div>
              <span className="text-[#F0F4F8] font-bold text-sm block leading-tight">
                {APP_CONFIG.shortName}
              </span>
              <span className="text-[#8B9CB8] text-[10px] block">CRM</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-[#C41E3A] to-[#9B1830] rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">AC</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 hover:bg-white/10 rounded-lg transition-colors ${collapsed ? 'absolute -right-3 bg-[#0A2A5C] border border-white/10' : ''
            }`}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-[#8B9CB8]" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-[#8B9CB8]" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                ? 'bg-[#C41E3A] text-white'
                : 'text-[#8B9CB8] hover:bg-white/5 hover:text-[#F0F4F8]'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t border-white/10 p-4">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0F3460] rounded-full flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#F0F4F8] font-semibold">
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#F0F4F8] text-sm font-medium truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-[#8B9CB8] text-xs capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[#E74C5E] hover:bg-[#E74C5E]/10 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 text-[#E74C5E] hover:bg-[#E74C5E]/10 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
