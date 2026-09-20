import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ShieldCheck, CheckCircle2, AlertCircle, Info, History } from 'lucide-react';
import { apiRequest, formatCurrency, formatDate } from '../lib/api';
import { Transaction } from '../types';

interface WalletPageProps {
  onNavigate: (page: string) => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<{
    wallet: any;
    recentTransactions: Transaction[];
    rules: {
      minimumWithdrawal: number;
      maximumWithdrawal: number;
      serviceFeePercentage: number;
      supportedMethods: string[];
      processingTime: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/wallet');
      setData(res);
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-sm text-stone-400 animate-pulse">
        Loading wallet balance & ledger...
      </div>
    );
  }

  const { wallet, recentTransactions, rules } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-100 tracking-tight">Performer Digital Wallet</h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Real-time balance, verified payout channels, and strict cryptographic transaction logging.
          </p>
        </div>

        <button
          id="wallet-request-payout-btn"
          onClick={() => onNavigate('withdraw')}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Submit Withdrawal Request</span>
        </button>
      </div>

      {/* Primary Balance Display */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-stone-900 border border-emerald-900/50">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Available Balance</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {formatCurrency(wallet.available_balance, wallet.currency)}
          </div>
          <div className="text-[11px] text-stone-400 mt-2">
            Disbursable on demand
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Pending Audits</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-300">
            {formatCurrency(wallet.pending_balance, wallet.currency)}
          </div>
          <div className="text-[11px] text-stone-500 mt-2">
            In quality review
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
            Total Earned
          </div>
          <div className="text-3xl font-extrabold text-stone-100">
            {formatCurrency(wallet.total_earned, wallet.currency)}
          </div>
          <div className="text-[11px] text-stone-500 mt-2">
            Approved tasks cumulative
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
            Total Paid Out
          </div>
          <div className="text-3xl font-extrabold text-stone-300">
            {formatCurrency(wallet.total_withdrawn, wallet.currency)}
          </div>
          <div className="text-[11px] text-stone-500 mt-2">
            Completed cash payouts
          </div>
        </div>
      </div>

      {/* Clear Rules & Disclosures Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
          <Info className="w-5 h-5 text-emerald-400" />
          <span>Platform Payout Terms & Fair Disclosure</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-300 pt-2">
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800/80 space-y-1">
            <span className="text-stone-400 block font-semibold">Minimum Withdrawal Threshold</span>
            <span className="text-lg font-bold text-emerald-400">PKR {rules.minimumWithdrawal.toFixed(2)}</span>
            <p className="text-[11px] text-stone-500">
              Protects against small transaction overhead fees.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800/80 space-y-1">
            <span className="text-stone-400 block font-semibold">Service / Processing Fee</span>
            <span className="text-lg font-bold text-emerald-400">0.00% (Free of Charge)</span>
            <p className="text-[11px] text-stone-500">
              No hidden deductions or arbitrary platform maintenance cuts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800/80 space-y-1">
            <span className="text-stone-400 block font-semibold">Verification & Turnaround</span>
            <span className="text-sm font-bold text-stone-200 block">24 to 48 Hours</span>
            <p className="text-[11px] text-stone-500">
              Batched for fraud detection and balance audit.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions in Wallet */}
      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <span>Wallet Transaction Audit Log</span>
          </h3>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-semibold text-emerald-400 hover:underline"
          >
            Full Transaction History
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-stone-500 uppercase tracking-wider border-b border-stone-800">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 text-stone-300">
              {recentTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-stone-950/40">
                  <td className="py-3 px-4 font-mono text-[11px] text-stone-400">{t.transaction_number}</td>
                  <td className="py-3 px-4 capitalize font-medium">{t.type.replace('_', ' ')}</td>
                  <td className="py-3 px-4">{t.description}</td>
                  <td className="py-3 px-4 text-stone-500">{formatDate(t.created_at)}</td>
                  <td className={`py-3 px-4 text-right font-bold ${
                    t.type === 'withdrawal' ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {t.type === 'withdrawal' ? '-' : '+'}
                    {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
