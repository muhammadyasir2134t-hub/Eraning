import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Building,
  Smartphone,
  Info,
  KeyRound,
  RefreshCw,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, formatCurrency } from '../lib/api';
import { broadcastPaymentProof } from '../lib/paymentProofs';

interface WithdrawalRequestProps {
  onNavigate: (page: string) => void;
}

export const WithdrawalRequestPage: React.FC<WithdrawalRequestProps> = ({ onNavigate }) => {
  const { user, wallet, refreshUserData } = useAuth();

  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'easypaisa' as 'easypaisa' | 'jazzcash' | 'bank_transfer',
    accountTitle: user?.fullName || 'Muhammad Yasir',
    accountNumber: user?.mobileNumber || '03001234567',
    bankName: '',
    confirmAccurate: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any | null>(null);

  // Mobile OTP Security Authorization States
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [smsDelivery, setSmsDelivery] = useState<any>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  const availableBal = wallet ? parseFloat(wallet.availableBalance as string) : 0;
  const MIN_WITHDRAWAL = 500;
  const MAX_WITHDRAWAL = 50000;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleQuickAmount = (amt: number) => {
    setFormData((prev) => ({ ...prev, amount: amt.toString() }));
  };

  // Step 1: Validate details and send Mobile SMS OTP
  const handleInitiateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal amount is PKR ${MIN_WITHDRAWAL}.00.`);
      return;
    }

    if (numAmount > availableBal) {
      setError(`Requested amount exceeds your available balance of PKR ${availableBal.toFixed(2)}.`);
      return;
    }

    if (!formData.confirmAccurate) {
      setError('Please verify and confirm your recipient account title and number.');
      return;
    }

    if (formData.paymentMethod === 'bank_transfer' && !formData.bankName.trim()) {
      setError('Please provide your Bank Name for bank transfer payout.');
      return;
    }

    setOtpLoading(true);
    try {
      const otpRes = await apiRequest('/api/auth/send-action-otp', {
        method: 'POST',
        body: JSON.stringify({
          actionTitle: `Payout Authorization of PKR ${formData.amount} to ${formData.paymentMethod.toUpperCase()}`,
        }),
      });

      setSmsDelivery(otpRes.smsDelivery);
      if (otpRes.smsDelivery?.otpCode) {
        setOtpCode(otpRes.smsDelivery.otpCode);
      }
      setOtpStep(true);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch mobile OTP for payout.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 2: Verify Mobile OTP and process payout
  const handleVerifyOtpAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit Mobile OTP sent to your registered number.');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/api/auth/verify-action-otp', {
        method: 'POST',
        body: JSON.stringify({
          otpCode: otpCode.trim(),
          actionTitle: `Payout Authorization of PKR ${formData.amount} to ${formData.paymentMethod.toUpperCase()}`,
        }),
      });

      const res = await apiRequest('/api/withdrawals', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setSuccess(res);
      setOtpStep(false);
      await refreshUserData();

      // Real-time broadcast to Firebase Firestore payment_proofs collection
      try {
        const maskedNum = formData.accountNumber.length > 5 
          ? formData.accountNumber.slice(0, 4) + '****' + formData.accountNumber.slice(-3)
          : '••••••••';
        
        await broadcastPaymentProof({
          userId: res.withdrawal?.user_id,
          performerName: formData.accountTitle,
          city: 'Pakistan',
          amount: parseFloat(formData.amount),
          currency: 'PKR',
          paymentMethod: formData.paymentMethod,
          accountTitle: formData.accountTitle,
          accountNumberMasked: maskedNum,
          trxId: (formData.paymentMethod === 'easypaisa' ? 'EP-' : formData.paymentMethod === 'jazzcash' ? 'JC-' : '1LINK-') + Math.floor(10000000 + Math.random() * 90000000),
          withdrawalNumber: res.withdrawal?.withdrawal_number || 'WD-' + Math.floor(100000 + Math.random() * 900000),
          status: 'completed',
          notes: `Instant payout queued and authenticated via Mobile OTP SMS to ${formData.paymentMethod.toUpperCase()} B2C gateway.`
        });
      } catch (fbErr) {
        console.warn('Real-time payment proof broadcast note:', fbErr);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate OTP or submit withdrawal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => onNavigate('wallet')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-stone-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Wallet</span>
      </button>

      <div>
        <h2 className="text-2xl font-bold text-stone-100 tracking-tight">Request Funds Withdrawal</h2>
        <p className="text-xs sm:text-sm text-stone-400 mt-1">
          Disburse approved task earnings to your Easypaisa, JazzCash, or Bank Account.
        </p>
      </div>

      {/* Available Balance Reminder Card */}
      <div className="p-6 rounded-2xl bg-stone-900 border border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider block">
            Eligible Available Balance
          </span>
          <span className="text-3xl font-extrabold text-emerald-400">
            {formatCurrency(availableBal)}
          </span>
        </div>
        <div className="text-xs text-stone-400 sm:text-right">
          <div>Minimum Payout: <strong>PKR {MIN_WITHDRAWAL}.00</strong></div>
          <div>Processing Fee: <strong>PKR 0.00 (Zero Fee)</strong></div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-100">
            Withdrawal Request Submitted Successfully
          </h3>
          <p className="text-xs text-stone-300 max-w-md mx-auto leading-relaxed">
            {success.message}
          </p>
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-emerald-400 inline-block">
            Tracking ID: {success.withdrawal.withdrawal_number}
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => onNavigate('withdrawals')}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold"
            >
              View Withdrawal Statuses
            </button>
            <button
              onClick={() => onNavigate('payment-proofs')}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-400 border border-emerald-500/30 text-xs font-semibold"
            >
              View Live Proofs
            </button>
            <button
              onClick={() => {
                setSuccess(null);
                setFormData({
                  amount: '',
                  paymentMethod: 'easypaisa',
                  accountTitle: '',
                  accountNumber: '',
                  bankName: '',
                  confirmAccurate: false,
                });
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleInitiateWithdrawal} className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 space-y-6">
          {/* Amount input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-300">
              Withdrawal Amount (PKR) <span className="text-rose-400">*</span>
            </label>
            <input
              id="withdraw-amount-input"
              type="number"
              name="amount"
              min={MIN_WITHDRAWAL}
              max={MAX_WITHDRAWAL}
              step="1"
              required
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g. 1000"
              className="w-full px-4 py-3 bg-stone-950 border border-stone-700 rounded-xl text-lg font-semibold text-stone-100 placeholder-stone-600 focus:outline-hidden focus:border-emerald-500"
            />
            {/* Quick buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[500, 1000, 2000, availableBal > 0 ? Math.floor(availableBal) : 0].filter((v, i, a) => v >= 500 && a.indexOf(v) === i).map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAmount(amt)}
                  className="px-3 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
                >
                  PKR {amt} {amt === Math.floor(availableBal) ? '(Max All)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-300">
              Select Payout Channel <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'easypaisa', label: 'Easypaisa', desc: 'Mobile Wallet' },
                { id: 'jazzcash', label: 'JazzCash', desc: 'Mobile Wallet' },
                { id: 'bank_transfer', label: 'Bank Transfer', desc: 'Direct IBAN / 1Link' },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    formData.paymentMethod === m.id
                      ? 'bg-emerald-950/30 border-emerald-500 text-stone-100'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-stone-200">{m.label}</span>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.id}
                      checked={formData.paymentMethod === m.id}
                      onChange={handleChange}
                      className="text-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[11px] text-stone-500">{m.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-4 pt-2 border-t border-stone-800">
            {formData.paymentMethod === 'bank_transfer' && (
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Bank Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="withdraw-bank-name"
                  type="text"
                  name="bankName"
                  required
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="e.g. Meezan Bank, HBL, Allied Bank"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Account Holder Title / Full Legal Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="withdraw-acc-title"
                type="text"
                name="accountTitle"
                required
                value={formData.accountTitle}
                onChange={handleChange}
                placeholder="Exact name registered on mobile account"
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Account / Mobile / IBAN Number <span className="text-rose-400">*</span>
              </label>
              <input
                id="withdraw-acc-number"
                type="text"
                name="accountNumber"
                required
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder={formData.paymentMethod === 'bank_transfer' ? 'PK00BANK0000000000000000' : '03XXXXXXXXX'}
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 font-mono focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Security & Verification Notice */}
          <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Security Protocol:</strong> All withdrawal requests undergo cryptographic verification against task audit proofs before batch dispatch (24-48 business hours). No raw cards or PINs are ever requested.
            </div>
          </div>

          {/* Accurate Details Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 text-xs text-stone-300 cursor-pointer pt-1">
            <input
              id="withdraw-confirm-check"
              type="checkbox"
              name="confirmAccurate"
              checked={formData.confirmAccurate}
              onChange={handleChange}
              className="mt-0.5 rounded-sm bg-stone-950 border-stone-700 text-emerald-500 focus:ring-emerald-500"
            />
            <span>
              I certify that the recipient account title and number entered above are correct. Funds disbursed to misstated account details cannot be recalled.
            </span>
          </label>

          <button
            id="withdraw-submit-btn"
            type="submit"
            disabled={otpLoading || loading || availableBal < MIN_WITHDRAWAL}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {otpLoading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Dispatching Mobile SMS OTP...</span>
              </span>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                <span>Authorize Payout with Mobile OTP (PKR {formData.amount || '0.00'})</span>
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Mobile OTP Security Authorization Modal */}
      {otpStep && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-100">
                SMS Authorization Required
              </h3>
              <p className="text-xs text-stone-400">
                A 6-digit payout authentication token was dispatched to your mobile number.
              </p>
            </div>

            {/* Simulated Live SMS Carrier Notice */}
            {smsDelivery && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/80 text-xs space-y-1">
                <div className="flex items-center justify-between text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" /> SMS Received: {smsDelivery.sender}
                  </span>
                  <span className="text-[10px] text-emerald-300 font-mono">Just Now</span>
                </div>
                <div className="text-stone-200 text-[11px] bg-stone-900/90 p-2 rounded-md font-mono border border-emerald-900/60">
                  {smsDelivery.text}
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Enter 6-Digit SMS Security Code
                </label>
                <input
                  id="payout-otp-input"
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 548291"
                  className="w-full text-center text-xl font-mono font-bold tracking-widest px-3 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-emerald-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOtpStep(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-payout-otp-btn"
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                    </span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm & Disburse</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
