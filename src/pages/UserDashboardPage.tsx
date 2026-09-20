import React, { useEffect, useState } from 'react';
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight, 
  CheckSquare, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, formatCurrency, formatDate } from '../lib/api';
import { Task, Transaction, Withdrawal } from '../types';

interface DashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const UserDashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    wallet: any;
    stats: { completedTasks: number; pendingTasks: number };
    latestWithdrawal: Withdrawal | null;
    recentTransactions: Transaction[];
    availableTasks: Task[];
  } | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-stone-400 text-sm animate-pulse">Loading dashboard metrics...</div>
      </div>
    );
  }

  const { wallet, stats, latestWithdrawal, recentTransactions, availableTasks } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Task Performer Account</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-50 tracking-tight">
            Welcome back, {user?.fullName || 'Performer'}!
          </h2>
          <p className="mt-1 text-sm text-stone-400 max-w-xl">
            Review your verified earnings, submit completed task proofs, or request a withdrawal to your mobile wallet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="dash-browse-tasks-btn"
            onClick={() => onNavigate('tasks')}
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-colors flex items-center gap-2"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Browse Tasks (ٹاسک دیکھیں)</span>
          </button>
          <button
            id="dash-withdraw-btn"
            onClick={() => onNavigate('withdraw')}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Request Withdrawal</span>
          </button>
        </div>
      </div>

      {/* Core Financial Overview (Strictly clearly distinguishing balances) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Available Balance */}
        <div className="p-5 rounded-xl bg-stone-900 border border-emerald-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Available Balance</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
            {formatCurrency(wallet.available_balance, wallet.currency)}
          </div>
          <div className="mt-2 text-[11px] text-stone-400">
            Available immediately for payout
          </div>
        </div>

        {/* Pending Balance */}
        <div className="p-5 rounded-xl bg-stone-900 border border-stone-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300 tracking-tight">
            {formatCurrency(wallet.pending_balance, wallet.currency)}
          </div>
          <div className="mt-2 text-[11px] text-stone-400">
            {stats.pendingTasks} submissions under client audit
          </div>
        </div>

        {/* Total Earned */}
        <div className="p-5 rounded-xl bg-stone-900 border border-stone-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Total Earned</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-stone-100 tracking-tight">
            {formatCurrency(wallet.total_earned, wallet.currency)}
          </div>
          <div className="mt-2 text-[11px] text-stone-400">
            {stats.completedTasks} tasks approved & credited
          </div>
        </div>

        {/* Total Withdrawn */}
        <div className="p-5 rounded-xl bg-stone-900 border border-stone-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Total Withdrawn</span>
            <ArrowUpRight className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-extrabold text-stone-200 tracking-tight">
            {formatCurrency(wallet.total_withdrawn, wallet.currency)}
          </div>
          <div className="mt-2 text-[11px] text-stone-400">
            Successfully disbursed to wallets
          </div>
        </div>
      </div>

      {/* Latest Withdrawal Banner (if exists) */}
      {latestWithdrawal && (
        <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              latestWithdrawal.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
              latestWithdrawal.status === 'pending' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
              'bg-stone-800 text-stone-300'
            }`}>
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-stone-400">Latest Payout Request:</div>
              <div className="text-sm font-semibold text-stone-200">
                {formatCurrency(latestWithdrawal.amount)} via {latestWithdrawal.payment_method.toUpperCase()} ({latestWithdrawal.account_number})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
              latestWithdrawal.status === 'completed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
              latestWithdrawal.status === 'pending' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
              'bg-stone-800 text-stone-300'
            }`}>
              Status: {latestWithdrawal.status}
            </span>
            <button
              onClick={() => onNavigate('withdrawals')}
              className="text-xs text-emerald-400 hover:underline font-medium"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Main Sections: Available Tasks & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommended Tasks (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>Recommended Available Tasks</span>
            </h3>
            <button
              id="dash-view-all-tasks"
              onClick={() => onNavigate('tasks')}
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>View All Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {availableTasks.length === 0 ? (
              <div className="p-8 rounded-xl bg-stone-900 border border-stone-800 text-center text-sm text-stone-400">
                No new unassigned tasks right now. Check back shortly for newly published batches.
              </div>
            ) : (
              availableTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-5 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-sm bg-stone-800 text-stone-300 font-medium">
                        {task.category}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Est. {task.estimated_minutes} mins
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-stone-100">
                      {task.title}
                    </h4>
                    <p className="text-xs text-stone-400 line-clamp-1">
                      {task.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-800">
                    <span className="text-base font-bold text-emerald-400">
                      {formatCurrency(task.reward_amount)}
                    </span>
                    <button
                      id={`start-task-${task.id}`}
                      onClick={() => onNavigate('task-details', { taskId: task.id })}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                    >
                      Start Task
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions (1 Column) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-100">Recent Transactions</h3>
            <button
              id="dash-view-all-txns"
              onClick={() => onNavigate('transactions')}
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              View History
            </button>
          </div>

          <div className="rounded-xl bg-stone-900 border border-stone-800 divide-y divide-stone-800/80">
            {recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">
                No recorded transactions yet. Complete tasks to receive earnings.
              </div>
            ) : (
              recentTransactions.map((txn) => (
                <div key={txn.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-stone-200">
                      {txn.description}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {formatDate(txn.created_at)}
                    </div>
                  </div>
                  <div className={`font-bold shrink-0 ${
                    txn.type === 'withdrawal' ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {txn.type === 'withdrawal' ? '-' : '+'}
                    {formatCurrency(txn.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
