import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, ArrowLeft, Receipt } from 'lucide-react';
import { apiRequest, formatCurrency, formatDate } from '../lib/api';
import { Withdrawal } from '../types';

interface WithdrawalsProps {
  onNavigate: (page: string) => void;
}

export const WithdrawalsListPage: React.FC<WithdrawalsProps> = ({ onNavigate }) => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/withdrawals');
      setWithdrawals(res.withdrawals || []);
    } catch (err) {
      console.error('Failed to load withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-100 tracking-tight">Withdrawal Requests & Payout Status</h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Audit trail of all requested and disbursed payouts to Easypaisa, JazzCash, and Bank accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('payment-proofs')}
            className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-emerald-500/40 text-emerald-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Live Payment Proofs</span>
          </button>
          <button
            onClick={() => onNavigate('withdraw')}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-xs transition-colors self-start sm:self-auto flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>New Withdrawal Request</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-stone-400 animate-pulse">
          Loading withdrawal records...
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="p-12 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-3">
          <ArrowUpRight className="w-8 h-8 text-stone-500 mx-auto" />
          <h3 className="text-base font-semibold text-stone-200">No withdrawals requested yet</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Once you reach the minimum PKR 500 threshold, you can submit a withdrawal request here.
          </p>
          <button
            onClick={() => onNavigate('tasks')}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold"
          >
            Complete Tasks to Earn
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((w) => (
            <div
              key={w.id}
              className="p-5 sm:p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-stone-400">
                    ID: <span className="font-mono text-stone-300">{w.withdrawal_number}</span> • Requested {formatDate(w.requested_at)}
                  </span>
                  <h3 className="text-base font-bold text-stone-100 uppercase tracking-tight">
                    {w.payment_method} Payout
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    w.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    w.status === 'pending' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    w.status === 'processing' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                    'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}>
                    {w.status}
                  </span>

                  <span className="text-lg font-extrabold text-stone-100">
                    {formatCurrency(w.amount)}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-300 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block">Account Title</span>
                  <span className="font-semibold text-stone-200">{w.account_title}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block">Account / Number</span>
                  <span className="font-mono text-stone-200">{w.account_number}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block">Disbursement Fee</span>
                  <span className="text-emerald-400 font-semibold">{formatCurrency(w.fee_amount)} (Free)</span>
                </div>
              </div>

              {w.admin_notes && (
                <div className="text-xs text-stone-400 italic">
                  Note: {w.admin_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
