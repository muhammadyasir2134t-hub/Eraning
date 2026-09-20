import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, CheckCircle2, ArrowUpRight, BarChart3, PieChart } from 'lucide-react';
import { apiRequest, formatCurrency } from '../lib/api';

interface EarningsDashboardProps {
  onNavigate: (page: string) => void;
}

export const EarningsDashboardPage: React.FC<EarningsDashboardProps> = ({ onNavigate }) => {
  const [data, setData] = useState<{
    wallet: any;
    categoryBreakdown: { category: string; total_earned: string; count: string }[];
    earningsHistory: { date: string; earned: string; withdrawn: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/earnings-overview');
      setData(res);
    } catch (err) {
      console.error('Failed to load earnings overview:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-sm text-stone-400 animate-pulse">
        Loading earnings statistics...
      </div>
    );
  }

  const { wallet, categoryBreakdown, earningsHistory } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-100 tracking-tight">Earnings Analytics & Ledger</h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Comprehensive audit breakdown of all verified tasks and completed wallet payouts.
          </p>
        </div>

        <button
          onClick={() => onNavigate('withdraw')}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-xs transition-colors self-start sm:self-auto flex items-center gap-1.5"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Request Payout</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">
            Lifetime Gross Earnings
          </div>
          <div className="text-3xl font-extrabold text-stone-50">
            {formatCurrency(wallet.total_earned, wallet.currency)}
          </div>
          <p className="text-[11px] text-stone-500 mt-2">
            Total approved work delivered since account opening
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-stone-900 border border-emerald-900/40">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            Available for Disbursement
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {formatCurrency(wallet.available_balance, wallet.currency)}
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            Net balance ready for immediate withdrawal request
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1">
            Currently Under Review
          </div>
          <div className="text-3xl font-extrabold text-amber-300">
            {formatCurrency(wallet.pending_balance, wallet.currency)}
          </div>
          <p className="text-[11px] text-stone-500 mt-2">
            Funds awaiting client audit sign-off
          </p>
        </div>
      </div>

      {/* Category Performance Breakdown */}
      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 space-y-6">
        <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-emerald-400" />
          <span>Earnings by Task Domain</span>
        </h3>

        {categoryBreakdown.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400">
            Complete approved tasks to view category breakdown statistics.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryBreakdown.map((cat, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-stone-950 border border-stone-800/80 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-semibold text-stone-200">{cat.category}</h4>
                  <span className="text-xs text-stone-500">{cat.count} completed tasks</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-emerald-400">
                    {formatCurrency(cat.total_earned)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 30-Day Activity Table */}
      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <span>Recent 30-Day Credits & Debits Audit</span>
        </h3>

        {earningsHistory.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-400">
            No transaction records in the last 30 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-stone-500 uppercase tracking-wider border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Earned Credits (+)</th>
                  <th className="py-3 px-4">Withdrawn Debits (-)</th>
                  <th className="py-3 px-4 text-right">Net Flow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-stone-300">
                {earningsHistory.map((row, idx) => {
                  const earned = parseFloat(row.earned) || 0;
                  const withdrawn = parseFloat(row.withdrawn) || 0;
                  const net = earned - withdrawn;

                  return (
                    <tr key={idx} className="hover:bg-stone-950/40">
                      <td className="py-3 px-4 font-mono">{row.date}</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">
                        {earned > 0 ? `+${formatCurrency(earned)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-rose-400 font-semibold">
                        {withdrawn > 0 ? `-${formatCurrency(withdrawn)}` : '-'}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${
                        net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {formatCurrency(net)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
