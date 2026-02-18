// ============================================================
// AMAN CEMENT CRM — Main Dashboard Page
// ============================================================

import { useAuthStore } from '@/store/authStore';
import { DashboardRep } from '@/sections/DashboardRep';
import { DashboardManagement } from '@/sections/DashboardManagement';
import { DashboardSupervisor } from '@/sections/DashboardSupervisor';

export function Dashboard() {
  const { user } = useAuthStore();

  // Render different dashboard based on user role
  const renderDashboard = () => {
    switch (user?.role) {
      case 'sales_rep':
        return <DashboardRep />;
      case 'supervisor':
        return <DashboardSupervisor />;
      case 'area_manager':
      case 'regional_manager':
      case 'division_head':
      case 'country_head':
        return <DashboardManagement />;
      default:
        return <DashboardRep />;
    }
  };

  return (
    <div className="p-6">
      {renderDashboard()}
    </div>
  );
}
