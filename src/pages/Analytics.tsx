// ============================================================
// AMAN CEMENT CRM — Analytics Page
// Comprehensive analytics and reporting dashboard
// ============================================================

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { startOfMonth } from 'date-fns';

export function Analytics() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // State for Target Distribution
  const [isDistributing, setIsDistributing] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [showDistributeModal, setShowDistributeModal] = useState(false);


  // 1. Fetch Manager's Team Performance (Direct Reports with Aggregated Downline Stats)
  // We use the RPC 'get_manager_team_performance' which returns:
  // user_id, full_name, role, target_monthly, achieved_monthly (sum of downline), etc.
  const { data: teamPerformance = [] } = useQuery({
    queryKey: ['team-performance', user?.id],
    queryFn: async () => {
      const startOfMonthStr = startOfMonth(new Date()).toISOString();
      console.log('Fetching Manager Team Performance V2:', { manager_id: user?.id, start_date: startOfMonthStr });

      const { data, error } = await supabase
        .rpc('get_manager_team_performance_v2', {
          p_manager_id: user?.id,
          p_month_start: startOfMonthStr
        });

      if (error) {
        console.error('RPC Error details:', error);
        throw error;
      };
      return data;
    },
    enabled: !!user?.id
  });

  // Real-time Updates: Listen for new Sales AND Target changes
  useEffect(() => {
    const channel = supabase
      .channel('analytics-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversions' },
        (payload) => {
          console.log('Real-time update (Conversions):', payload);
          toast.info('New sale recorded! Refreshing dashboard...');
          queryClient.invalidateQueries({ queryKey: ['team-performance'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Real-time update (Profiles):', payload);
          queryClient.invalidateQueries({ queryKey: ['team-performance'] });
        }
      )
      .subscribe((status) => {
        console.log('Realtime Subscription Status:', status);
        if (status === 'SUBSCRIBED') {
          // toast.success('Live Dashboard Active 🟢'); // Optional: quiet success
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Calculate Overall Stats (My Team's Total)
  const stats = useMemo(() => {
    // Summing up the Direct Reports' stats gives the total for this Manager's Downline
    const totalTarget = teamPerformance.reduce((sum: number, m: any) => sum + (m.target_monthly || 0), 0);
    const totalAchieved = teamPerformance.reduce((sum: number, m: any) => sum + (m.achieved_monthly || 0), 0);
    const percent = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
    return { totalTarget, totalAchieved, percent };
  }, [teamPerformance]);

  // Distribute Target Handler
  const handleDistributeTarget = async () => {
    if (!newTarget || isNaN(Number(newTarget))) return;
    setIsDistributing(true);
    try {
      console.log('Distributing Target V2:', { manager_id: user?.id, amount: Number(newTarget) });
      // This RPC updates the manager's target and recursively distributes it
      const { error } = await supabase.rpc('distribute_targets_recursive_v2', {
        p_manager_id: user?.id,
        p_amount: Number(newTarget)
      });
      if (error) throw error;

      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['team-performance'] });
      setShowDistributeModal(false);
      setNewTarget('');
    } catch (err) {
      console.error('Error distributing targets:', err);
      alert('Failed to distribute targets. Please check console.');
    } finally {
      setIsDistributing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F0F4F8]">Performance Analytics</h1>
          <p className="text-[#8B9CB8] text-sm mt-1">Manager View: Team Overview & Goals</p>
        </div>

        {/* Distribute Target Button - Only for Managers */}
        {user?.role !== 'sales_rep' && (
          <button
            onClick={() => setShowDistributeModal(true)}
            className="px-4 py-2 bg-[#C41E3A] hover:bg-[#9B1830] text-white rounded-lg transition-colors text-sm font-medium"
          >
            Set Monthly Target
          </button>
        )}
      </div>

      {/* Overall Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0A2A5C] p-4 rounded-xl border border-white/10">
          <p className="text-[#8B9CB8] text-sm">Total Team Target</p>
          <p className="text-2xl font-bold text-white mt-1">৳{stats.totalTarget.toLocaleString()}</p>
        </div>
        <div className="bg-[#0A2A5C] p-4 rounded-xl border border-white/10">
          <p className="text-[#8B9CB8] text-sm">Total Achieved</p>
          <p className="text-2xl font-bold text-[#2ECC71] mt-1">৳{stats.totalAchieved.toLocaleString()}</p>
        </div>
        <div className="bg-[#0A2A5C] p-4 rounded-xl border border-white/10">
          <p className="text-[#8B9CB8] text-sm">Achievement Rate</p>
          <p className={`text-2xl font-bold mt-1 ${stats.percent >= 100 ? 'text-[#2ECC71]' : 'text-[#3A9EFF]'}`}>
            {stats.percent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Distribute Modal */}
      {showDistributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A2A5C] rounded-xl border border-white/10 w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Set Team Monthly Target</h3>
            <p className="text-sm text-[#8B9CB8]">This will automatically distribute the target amount equally among your direct reports and cascade down.</p>

            <input
              type="number"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              placeholder="Enter Amount (BDT)"
              className="w-full bg-[#061A3A] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#3A9EFF]"
            />

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDistributeModal(false)}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDistributeTarget}
                disabled={isDistributing}
                className="flex-1 px-4 py-2 bg-[#3A9EFF] hover:bg-[#2A8EEF] text-white rounded-lg disabled:opacity-50"
              >
                {isDistributing ? 'Distributing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Table */}
      <div className="bg-[#0A2A5C] rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#061A3A]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Direct Report</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8B9CB8] uppercase">Role</th>

                <th className="px-4 py-3 text-center text-xs font-medium text-[#3A9EFF] uppercase border-l border-white/5">
                  Team Target
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#3A9EFF] uppercase">
                  Team Achieved
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#3A9EFF] uppercase">
                  %
                </th>

                <th className="px-4 py-3 text-center text-xs font-medium text-[#2ECC71] uppercase border-l border-white/5">
                  Daily Est.
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#2ECC71] uppercase">
                  Today
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teamPerformance.map((m: any) => (
                <tr key={m.user_id} className="hover:bg-white/5">
                  <td className="px-4 py-4">
                    <div className="font-medium text-[#F0F4F8]">{m.full_name}</div>
                    <div className="text-xs text-[#8B9CB8]">{m.employee_code}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full bg-white/10 text-white`}>
                      {m.role?.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Monthly */}
                  <td className="px-4 py-4 text-center text-[#F0F4F8] border-l border-white/5">
                    ৳{m.target_monthly?.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-center text-[#F0F4F8]">
                    ৳{m.achieved_monthly?.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`font-bold ${((m.achieved_monthly / m.target_monthly) * 100 || 0) >= 100 ? 'text-[#2ECC71]' : 'text-[#E74C5E]'}`}>
                      {((m.achieved_monthly / m.target_monthly) * 100 || 0).toFixed(1)}%
                    </span>
                  </td>

                  {/* Daily */}
                  <td className="px-4 py-4 text-center text-[#F0F4F8] border-l border-white/5">
                    ৳{m.daily_target?.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-center text-[#F0F4F8]">
                    ৳{m.daily_achieved?.toLocaleString()}
                  </td>
                </tr>
              ))}
              {teamPerformance.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#8B9CB8]">
                    No direct reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
