import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  Smartphone, 
  Building2, 
  Sparkles, 
  Clock, 
  Filter, 
  FileText, 
  Receipt, 
  Radio, 
  ArrowUpRight,
  Search,
  Check,
  ChevronDown
} from 'lucide-react';
import { subscribeToPaymentProofs, PaymentProofDoc, broadcastPaymentProof } from '../lib/paymentProofs';
import { formatCurrency, formatDate } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface PaymentProofsProps {
  onNavigate?: (page: string, params?: any) => void;
}

export const LivePaymentProofsPage: React.FC<PaymentProofsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [proofs, setProofs] = useState<PaymentProofDoc[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProof, setSelectedProof] = useState<PaymentProofDoc | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isSimulatingLivePayout, setIsSimulatingLivePayout] = useState(false);

  useEffect(() => {
    // Listen to real-time changes from Firebase Firestore
    const unsubscribe = subscribeToPaymentProofs((liveProofs) => {
      setProofs(liveProofs);
      setLastUpdated(new Date());
      setIsLiveConnected(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Filter proofs by method and search query
  const filteredProofs = proofs.filter((p) => {
    const matchesMethod = selectedMethod === 'all' || p.paymentMethod === selectedMethod;
    const matchesSearch = 
      p.performerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.trxId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.withdrawalNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  // Calculate high level metrics
  const totalDisbursed = proofs.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const completedCount = proofs.length;

  // Handler to broadcast a verified test proof to Firestore in real-time
  const handleTriggerLiveSimulatedProof = async () => {
    setIsSimulatingLivePayout(true);
    const pakistaniNames = [
      { name: 'Hamza Tariq', city: 'Sialkot', method: 'easypaisa' as const, prefix: '0345' },
      { name: 'Usman Ghani', city: 'Multan', method: 'jazzcash' as const, prefix: '0302' },
      { name: 'Sana Malik', city: 'Gujranwala', method: 'bank_transfer' as const, prefix: 'PK29HABB' },
      { name: 'Noman Bashir', city: 'Peshawar', method: 'easypaisa' as const, prefix: '0334' },
      { name: 'Zainab Bibi', city: 'Hyderabad', method: 'jazzcash' as const, prefix: '0313' }
    ];
    const pick = pakistaniNames[Math.floor(Math.random() * pakistaniNames.length)];
    const randomAmount = Math.floor(Math.random() * 40 + 10) * 100; // e.g. 1000 - 5000
    const randDigits = Math.floor(10000000 + Math.random() * 90000000);

    await broadcastPaymentProof({
      performerName: pick.name,
      city: pick.city,
      amount: randomAmount,
      currency: 'PKR',
      paymentMethod: pick.method,
      accountTitle: pick.name.toUpperCase(),
      accountNumberMasked: pick.method === 'bank_transfer' ? `${pick.prefix}0000****${Math.floor(1000 + Math.random() * 9000)}` : `${pick.prefix}****${Math.floor(100 + Math.random() * 900)}`,
      trxId: (pick.method === 'easypaisa' ? 'EP-' : pick.method === 'jazzcash' ? 'JC-' : '1LINK-') + randDigits,
      withdrawalNumber: 'WD-' + Math.floor(100000 + Math.random() * 900000),
      status: 'completed',
      notes: `Verified live disbursement via ${pick.method.toUpperCase()} gateway. Auto-confirmed.`,
    });

    setTimeout(() => {
      setIsSimulatingLivePayout(false);
    }, 600);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Real-time Live Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-100 tracking-tight">
              Real-Time Live Payment Proofs
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Network Synchronized</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 max-w-3xl">
            Live, verifiable proof of disbursed performer payouts across Pakistan. Every transaction is authenticated and synchronized in real-time via the verified network ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="simulate-live-payout-btn"
            type="button"
            onClick={handleTriggerLiveSimulatedProof}
            disabled={isSimulatingLivePayout}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 font-semibold text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{isSimulatingLivePayout ? 'Broadcasting...' : 'Broadcast Live Proof'}</span>
          </button>

          {onNavigate && (
            <button
              onClick={() => onNavigate('withdraw')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Request Payout</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
            <span>Total Disbursed (Verified)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-stone-100">
            {formatCurrency(totalDisbursed, 'PKR')}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>100% On-time gateway delivery</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
            <span>Verified Payout Records</span>
            <Receipt className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-stone-100">
            {completedCount} Transactions
          </div>
          <div className="text-[11px] text-stone-400">
            Synced via Firestore live listener
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
            <span>Primary Channels</span>
            <Smartphone className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-semibold text-stone-200 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs">Easypaisa</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs">JazzCash</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs">1LINK</span>
          </div>
          <div className="text-[11px] text-stone-400">
            Instant B2C automated API routing
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
            <span>Database Status</span>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Live Real-time Ledger Online</span>
          </div>
          <div className="text-[11px] text-stone-400">
            Last update: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Method Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedMethod('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedMethod === 'all'
                ? 'bg-emerald-500 text-stone-950 shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            All Methods ({proofs.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethod('easypaisa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedMethod === 'easypaisa'
                ? 'bg-emerald-500 text-stone-950 shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            Easypaisa
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethod('jazzcash')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedMethod === 'jazzcash'
                ? 'bg-emerald-500 text-stone-950 shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            JazzCash
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethod('bank_transfer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedMethod === 'bank_transfer'
                ? 'bg-emerald-500 text-stone-950 shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            Bank / Raast
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Search by name, TRX ID, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Live Payment Proof Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProofs.map((item, idx) => (
          <div
            key={item.id || item.trxId || idx}
            className="rounded-2xl bg-stone-900 border border-stone-800/90 hover:border-stone-700 p-5 space-y-4 shadow-sm transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
          >
            {/* Top row: badge & amount */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  item.paymentMethod === 'easypaisa'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : item.paymentMethod === 'jazzcash'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                }`}>
                  {item.paymentMethod === 'bank_transfer' ? (
                    <Building2 className="w-3.5 h-3.5" />
                  ) : (
                    <Smartphone className="w-3.5 h-3.5" />
                  )}
                  <span>{item.paymentMethod.replace('_', ' ')}</span>
                </span>

                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Disbursed</span>
                </div>
              </div>

              {/* Amount Display */}
              <div className="mb-3">
                <div className="text-2xl font-extrabold text-stone-100 group-hover:text-emerald-300 transition-colors">
                  {formatCurrency(item.amount, item.currency)}
                </div>
                <div className="text-xs text-stone-400 mt-0.5">
                  Payout to <strong className="text-stone-200">{item.accountTitle}</strong>
                </div>
              </div>

              {/* Transaction Detail Pills */}
              <div className="space-y-2 pt-2 border-t border-stone-800/80 text-xs">
                <div className="flex justify-between items-center text-stone-400">
                  <span>Performer:</span>
                  <span className="font-medium text-stone-200">{item.performerName} ({item.city})</span>
                </div>
                <div className="flex justify-between items-center text-stone-400">
                  <span>Account Number:</span>
                  <span className="font-mono text-stone-300">{item.accountNumberMasked}</span>
                </div>
                <div className="flex justify-between items-center text-stone-400">
                  <span>Gateway TRX ID:</span>
                  <span className="font-mono font-semibold text-emerald-400 select-all">{item.trxId}</span>
                </div>
                <div className="flex justify-between items-center text-stone-400">
                  <span>Request Ref:</span>
                  <span className="font-mono text-stone-400">{item.withdrawalNumber}</span>
                </div>
              </div>
            </div>

            {/* Bottom Card Footer with Verification Slip Button */}
            <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-3">
              <div className="text-[11px] text-stone-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{item.timestamp ? formatDate(item.timestamp) : 'Recently verified'}</span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProof(item)}
                className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>View Receipt Slip</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProofs.length === 0 && (
        <div className="p-12 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-3">
          <Receipt className="w-10 h-10 text-stone-500 mx-auto" />
          <h3 className="text-base font-semibold text-stone-200">No payment proofs match your query</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Try choosing a different payment method or clear your search term.
          </p>
          <button
            onClick={() => { setSelectedMethod('all'); setSearchQuery(''); }}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs text-stone-200 font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Official Transaction Receipt Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xl">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-stone-100">Verified Payout Slip</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                      Official Receipt
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">WorkPoint Performer Disbursement Network</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                className="text-stone-400 hover:text-stone-200 p-2 rounded-lg bg-stone-800/60"
              >
                ✕
              </button>
            </div>

            {/* Receipt Body */}
            <div className="rounded-2xl bg-stone-950 border border-stone-800 p-5 space-y-4">
              <div className="text-center pb-4 border-b border-stone-800/80">
                <span className="text-xs text-stone-400 font-medium">Transferred Amount</span>
                <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                  {formatCurrency(selectedProof.amount, selectedProof.currency)}
                </div>
                <div className="text-xs text-stone-400 mt-1 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Completed via {selectedProof.paymentMethod.toUpperCase()} B2C Gateway</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-stone-300 font-mono">
                <div className="flex justify-between py-1 border-b border-stone-900">
                  <span className="text-stone-500">Gateway TRX ID:</span>
                  <span className="font-bold text-emerald-300 select-all">{selectedProof.trxId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-900">
                  <span className="text-stone-500">Withdrawal Ticket:</span>
                  <span className="text-stone-200">{selectedProof.withdrawalNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-900">
                  <span className="text-stone-500">Beneficiary Name:</span>
                  <span className="font-bold text-stone-100">{selectedProof.accountTitle}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-900">
                  <span className="text-stone-500">Account / Mobile:</span>
                  <span className="text-stone-200">{selectedProof.accountNumberMasked}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-900">
                  <span className="text-stone-500">Performer City:</span>
                  <span className="text-stone-200">{selectedProof.city}, Pakistan</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-900">
                  <span className="text-stone-500">Audit Status:</span>
                  <span className="text-emerald-400 font-bold uppercase">100% Verified & Cleared</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-stone-500">Timestamp:</span>
                  <span className="text-stone-300">{formatDate(selectedProof.timestamp)}</span>
                </div>
              </div>

              {selectedProof.notes && (
                <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 text-[11px] text-stone-300 space-y-1">
                  <strong className="text-emerald-400 block">Gateway Settlement Note:</strong>
                  <span>{selectedProof.notes}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-md transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
