import React, { useState, useEffect } from 'react';
import { History, Filter, ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock, XCircle, Search } from 'lucide-react';
import { apiRequest, formatCurrency, formatDate } from '../lib/api';
import { Transaction } from '../types';

export const TransactionHistoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadTransactions();
  }, [typeFilter, statusFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'All') params.append('type', typeFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);

      const res = await apiRequest(`/api/transactions?${params.toString()}`);
      setTransactions(res.transactions || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const types = ['All', 'task_earning', 'withdrawal', 'referral_bonus', 'service_fee'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-100 tracking-tight">Financial Transaction History</h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Complete audit record of every credit, debit, and task reward disbursement with unique transaction IDs.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-stone-400 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Type:</span>
        </span>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              typeFilter === t
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table Display */}
      {loading ? (
        <div className="p-12 text-center text-sm text-stone-400 animate-pulse">
          Loading ledger entries...
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-12 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-2">
          <History className="w-8 h-8 text-stone-500 mx-auto" />
          <h3 className="text-base font-semibold text-stone-200">No transactions recorded</h3>
          <p className="text-xs text-stone-400">
            Transactions will appear here once tasks are approved or withdrawal requests are processed.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950/60 text-[11px] text-stone-500 uppercase tracking-wider border-b border-stone-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Transaction ID</th>
                  <th className="py-3.5 px-4 font-semibold">Type</th>
                  <th className="py-3.5 px-4 font-semibold">Description</th>
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-stone-300">
                {transactions.map((t) => {
                  const isCredit = t.type !== 'withdrawal' && t.type !== 'service_fee';
                  return (
                    <tr key={t.id} className="hover:bg-stone-950/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-300">
                        {t.transaction_number}
                      </td>
                      <td className="py-3.5 px-4 capitalize">
                        <span className="inline-flex items-center gap-1.5">
                          {isCredit ? (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          <span>{t.type.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-200">
                        {t.description}
                      </td>
                      <td className="py-3.5 px-4 text-stone-500">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          t.status === 'pending' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-stone-800 text-stone-300'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold text-sm ${
                        isCredit ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isCredit ? '+' : '-'}
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
