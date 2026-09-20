import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ArrowRight, 
  Lock, 
  LogOut, 
  RefreshCw, 
  Smartphone, 
  Building2, 
  Sparkles,
  Zap,
  Star,
  Crown,
  CheckCircle
} from 'lucide-react';

interface ActivationPaymentPageProps {
  onNavigate: (page: string) => void;
}

interface PaymentRecord {
  id: number;
  amount: string | number;
  payment_method: string;
  sender_name: string;
  sender_number: string;
  trx_id: string;
  status: string;
  admin_notes?: string;
  created_at: string;
}

interface EarningPlan {
  id: string;
  nameUrdu: string;
  nameEnglish: string;
  price: number;
  tag?: string;
  isPopular?: boolean;
  dailyEarningEstimate: string;
  dailyTasksCount: string;
  features: string[];
}

export const ActivationPaymentPage: React.FC<ActivationPaymentPageProps> = ({ onNavigate }) => {
  const { user, logout, refreshUserData } = useAuth();

  const earningPlans: EarningPlan[] = [
    {
      id: 'starter',
      nameUrdu: 'ابتدائی پلان (Starter Plan)',
      nameEnglish: 'Starter Earning Plan',
      price: 1500,
      tag: 'موسٹ پاپولر (Base Required)',
      isPopular: true,
      dailyEarningEstimate: 'Rs. 800 - 1,500 / Day',
      dailyTasksCount: '8 Daily Verified Tasks',
      features: [
        'ویب سائٹ لینڈنگ پیج اور فارم کے ٹاسکس',
        'اردو اور انگلش آرٹیکل رائٹنگ ٹاسکس',
        'JazzCash & EasyPaisa سے 24 گھنٹے میں ادائیگی',
        'بیسک پرفارمر سپورٹ',
        'ریئل ٹائم ارننگ ڈیش بورڈ'
      ]
    },
    {
      id: 'standard',
      nameUrdu: 'معیاری پلان (Standard Plan)',
      nameEnglish: 'Standard Earning Plan',
      price: 3000,
      tag: 'زیادہ منافع (2x Earning)',
      dailyEarningEstimate: 'Rs. 2,000 - 3,500 / Day',
      dailyTasksCount: '15 Daily High-Reward Tasks',
      features: [
        'تمام بنیادی ٹاسکس + فل ویب سائٹ ڈویلپمنٹ',
        'ہائی پے آؤٹ بلاگ اور ٹرانسلیشن پروجیکٹس',
        'فوری ودڈراول پروسیسنگ (2 گھنٹے میں)',
        '2x زیادہ ٹاسک لمٹس',
        'ترجیحی کوالٹی ریویو'
      ]
    },
    {
      id: 'vip',
      nameUrdu: 'وی آئی پی پرو پلان (VIP Pro)',
      nameEnglish: 'VIP Pro Earning Plan',
      price: 5000,
      tag: 'سب سے زیادہ آمدن (Unlimited)',
      dailyEarningEstimate: 'Rs. 4,500 - 8,000+ / Day',
      dailyTasksCount: 'Unlimited Tasks Daily',
      features: [
        'لامحدود روزانہ ٹاسکس (No Daily Cap)',
        'پریمیم ویب ایپلیکیشن اور سکرپٹ ٹاسکس (Rs. 1,500+ فی ٹاسک)',
        'فوری آٹومیٹڈ ودڈراول (Instant Direct Payout)',
        'ڈیڈیکیٹڈ وی آئی پی مینیجر سپورٹ',
        '100% گارنٹیڈ ہائی انکم پروجیکٹس'
      ]
    }
  ];

  const [selectedPlan, setSelectedPlan] = useState<EarningPlan>(earningPlans[0]);
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash'>('easypaisa');
  const [senderName, setSenderName] = useState(user?.fullName || '');
  const [senderNumber, setSenderNumber] = useState(user?.mobileNumber || '');
  const [trxId, setTrxId] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [latestPayment, setLatestPayment] = useState<PaymentRecord | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>(user?.paymentStatus || 'unpaid');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(label);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  // Poll or check status from server
  const checkStatus = async (isBackground = false) => {
    if (!isBackground) setChecking(true);
    setError(null);
    try {
      const data = await apiRequest('/api/activation/status');
      setCurrentStatus(data.paymentStatus);
      if (data.latestPayment) {
        setLatestPayment(data.latestPayment);
      }
      if (data.paymentStatus === 'approved') {
        await refreshUserData();
      }
    } catch (err) {
      console.error('Failed to check activation status:', err);
    } finally {
      if (!isBackground) setChecking(false);
    }
  };

  // Check status on mount and poll every 6 seconds if pending
  useEffect(() => {
    checkStatus();
    const interval = setInterval(() => {
      if (currentStatus === 'pending') {
        checkStatus(true);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [currentStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!senderName.trim()) {
      setError('براہ کرم اپنا نام / اکاؤنٹ ٹائٹل درج کریں۔ (Please provide sender account title)');
      return;
    }
    if (!senderNumber.trim()) {
      setError('براہ کرم اپنا موبائل نمبر یا بینک اکاؤنٹ نمبر درج کریں۔ (Please provide sender mobile number)');
      return;
    }
    if (!trxId.trim()) {
      setError(`براہ کرم ${selectedPlan.price} روپے کا ٹرانزیکشن آئی ڈی (TRX ID) درج کریں۔`);
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest('/api/activation/submit', {
        method: 'POST',
        body: JSON.stringify({
          planName: selectedPlan.nameEnglish,
          amount: selectedPlan.price,
          paymentMethod,
          senderName: senderName.trim(),
          senderNumber: senderNumber.trim(),
          trxId: trxId.trim().toUpperCase(),
          receiptUrl,
          notes: notes.trim(),
        }),
      });

      setSuccessMessage(`${selectedPlan.nameEnglish} (Rs. ${selectedPlan.price}) کے لیے ادائیگی جمع ہو چکی ہے۔ ایڈمن کی تصدیق کا انتظار کریں۔`);
      setCurrentStatus('pending');
      if (data.payment) {
        setLatestPayment(data.payment);
      }
      await refreshUserData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick sandbox helper to test instant approval
  const handleSimulateApproval = async () => {
    if (!latestPayment?.id) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/admin/activation-payments/${latestPayment.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'approved',
          adminNotes: 'Verified via plan activation protocol.'
        })
      });
      if (res.ok) {
        await checkStatus();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-stone-950">
      {/* Top Navigation Bar */}
      <header className="border-b border-stone-800 bg-stone-900/70 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-stone-950 shadow-md">
            <Lock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-stone-100">WorkPoint MicroTasks</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                پلان لازمی ہے (Plan Required)
              </span>
            </div>
            <p className="text-xs text-stone-400">Earning Plan Activation Gate</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-stone-200">{user?.fullName}</p>
            <p className="text-[11px] text-stone-400">{user?.mobileNumber || user?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-800 hover:border-stone-700 bg-stone-900 text-xs text-stone-400 hover:text-stone-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:py-8 space-y-7">
        
        {/* CRUCIAL EARNING NOTICE BANNER */}
        <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-stone-900 to-amber-950/30 p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>لازمی شرط (Mandatory Earning Rule)</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-stone-50 tracking-tight leading-snug">
                پلان خریدنے کے بعد آپ کی ارننگ سٹارٹ ہوگی
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
                جب تک آپ اپنا پلان خرید کر ایڈمن سے منظور نہیں کروائیں گے، ٹاسک، روزانہ ارننگ اور ودڈراول لاک رہیں گے۔ پلان ایکٹیویٹ ہوتے ہی آپ کو روزانہ ویب سائٹس بنانے اور آرٹیکل رائٹنگ کے ٹاسک ملنا شروع ہو جائیں گے۔
              </p>
            </div>
            <div className="shrink-0 bg-stone-950/80 border border-amber-500/30 rounded-xl p-3 text-center sm:text-right">
              <span className="text-[11px] text-stone-400 block">منسلک اکاؤنٹ اسٹیٹس</span>
              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md inline-block mt-1 ${
                currentStatus === 'approved' ? 'bg-emerald-500 text-stone-950 font-black' :
                currentStatus === 'pending' ? 'bg-amber-500 text-stone-950 font-bold' :
                'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {currentStatus === 'approved' ? 'Active & Approved' : currentStatus === 'pending' ? 'Verification Pending' : 'Unpaid (Locked)'}
              </span>
            </div>
          </div>
        </div>

        {/* STATE 1: ALREADY APPROVED */}
        {currentStatus === 'approved' && (
          <div className="rounded-2xl border border-emerald-500 bg-emerald-950/30 p-6 sm:p-8 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-emerald-400">آپ کا ارننگ پلان ایکٹیو ہو چکا ہے!</h2>
              <p className="text-sm text-stone-200 mt-1">
                Your earning plan has been verified and approved by the administrator. Your daily tasks are ready.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-sm shadow-xl hover:shadow-emerald-500/20 transition-all flex items-center gap-2 mx-auto cursor-pointer"
              >
                <span>Go to Dashboard & Start Tasks (ڈیش بورڈ پر جائیں)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STATE 2: PENDING APPROVAL */}
        {currentStatus === 'pending' && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs uppercase tracking-wider border border-amber-500/30">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>پلان منظوری زیر التواء ہے (Under Admin Review)</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-100">
                  آپ کے پلان کی ادائیگی موصول ہو چکی ہے
                </h2>
                <p className="text-xs sm:text-sm text-stone-300">
                  ایڈمن (Muhammad Yasir Siddique) آپ کی ٹرانزیکشن آئی ڈی (TRX ID) کی تصدیق کر رہا ہے۔ جیسے ہی تصدیق مکمل ہو گی، آپ کے روزانہ کے ٹاسک اور ارننگ فوراً شروع ہو جائے گی۔
                </p>
              </div>
            </div>

            {/* Submitted Payment Summary */}
            {latestPayment && (
              <div className="rounded-xl bg-stone-900/90 border border-stone-800 p-4 sm:p-5 space-y-3">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  جمع کروائی گئی تفصیلات (Submitted Details):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-stone-950 border border-stone-800/80">
                    <span className="text-stone-400 block mb-0.5">Amount Paid</span>
                    <span className="font-bold text-emerald-400 text-sm">Rs. {Number(latestPayment.amount || 1500).toLocaleString()} PKR</span>
                  </div>
                  <div className="p-3 rounded-lg bg-stone-950 border border-stone-800/80">
                    <span className="text-stone-400 block mb-0.5">Method</span>
                    <span className="font-semibold text-stone-200 capitalize">{latestPayment.payment_method}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-stone-950 border border-stone-800/80">
                    <span className="text-stone-400 block mb-0.5">Sender Title</span>
                    <span className="font-semibold text-stone-200">{latestPayment.sender_name}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-stone-950 border border-stone-800/80">
                    <span className="text-stone-400 block mb-0.5">TRX ID</span>
                    <span className="font-mono font-bold text-amber-300">{latestPayment.trx_id}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => checkStatus()}
                disabled={checking}
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{checking ? 'Checking Status...' : 'Check Status Now (اسٹیٹس چیک کریں)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: UNPAID OR REJECTED (CHOOSE PLAN & MAKE PAYMENT) */}
        {currentStatus !== 'approved' && currentStatus !== 'pending' && (
          <div className="space-y-8">

            {currentStatus === 'rejected' && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-rose-200 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>ادائیگی مسترد کر دی گئی (Payment Rejected)</span>
                </div>
                <p>
                  {latestPayment?.admin_notes || 'آپ کی ٹرانزیکشن آئی ڈی کی تصدیق نہیں ہو سکی۔ براہ کرم درست TRX ID درج کر کے دوبارہ بھیجیں۔'}
                </p>
              </div>
            )}

            {/* STEP 1: SELECT YOUR EARNING PLAN */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-stone-950 text-xs font-black flex items-center justify-center">1</span>
                    <span>اپنا ارننگ پلان منتخب کریں (Select Earning Plan)</span>
                  </h2>
                  <p className="text-xs text-stone-400">
                    کوئی بھی ایک پلان منتخب کریں جس کے مطابق آپ روزانہ ٹاسکس کر کے کمانا چاہتے ہیں:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {earningPlans.map((plan) => {
                  const isSelected = selectedPlan.id === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
                          : 'border-stone-800 bg-stone-900/60 hover:border-stone-700'
                      }`}
                    >
                      {plan.tag && (
                        <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500 text-stone-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                          {plan.tag}
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {plan.id === 'vip' ? (
                              <Crown className="w-5 h-5 text-amber-400" />
                            ) : plan.id === 'standard' ? (
                              <Star className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Zap className="w-5 h-5 text-emerald-400" />
                            )}
                            <h3 className="font-bold text-sm text-stone-100">{plan.nameUrdu}</h3>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-emerald-500 bg-emerald-500 text-stone-950' : 'border-stone-600'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="pb-3 border-b border-stone-800">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl sm:text-3xl font-black text-stone-50">Rs. {plan.price.toLocaleString()}</span>
                            <span className="text-xs font-bold text-stone-400 uppercase">PKR</span>
                          </div>
                          <p className="text-xs text-emerald-400 font-semibold mt-1">
                            تخمینہ آمدن: {plan.dailyEarningEstimate}
                          </p>
                          <p className="text-[11px] text-stone-400 mt-0.5">
                            {plan.dailyTasksCount}
                          </p>
                        </div>

                        {/* Features list */}
                        <ul className="space-y-1.5 text-xs text-stone-300">
                          {plan.features.map((f, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-800/80">
                        <button
                          type="button"
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                            isSelected
                              ? 'bg-emerald-500 text-stone-950'
                              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                          }`}
                        >
                          {isSelected ? 'منتخب شدہ (Selected)' : 'یہ پلان منتخب کریں'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: OFFICIAL PAYMENT ACCOUNTS */}
            <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-stone-950 text-xs font-black flex items-center justify-center">2</span>
                    <span>منتخب پلان کی رقم بھیجیں (Send Payment)</span>
                  </h2>
                  <p className="text-xs text-stone-400">
                    درج ذیل میں سے کسی بھی اکاؤنٹ پر منتخب رقم (Rs. {selectedPlan.price.toLocaleString()} PKR) بھیجیں:
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
                  ادا کرنے کی رقم: Rs. {selectedPlan.price.toLocaleString()} PKR
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Easypaisa */}
                <div 
                  onClick={() => setPaymentMethod('easypaisa')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    paymentMethod === 'easypaisa'
                      ? 'border-emerald-500 bg-emerald-950/20 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
                      : 'border-stone-800 bg-stone-950 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      Easypaisa (ایزی پیسہ)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard('03274397413', 'easypaisa');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
                    >
                      {copiedAccount === 'easypaisa' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-stone-400" />
                          <span>Copy Number</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-mono font-black text-stone-100 tracking-wider">0327 4397413</p>
                    <p className="text-xs font-semibold text-emerald-400">Account Title: Muhammad Yasir Siddique</p>
                  </div>
                </div>

                {/* 2. JazzCash */}
                <div 
                  onClick={() => setPaymentMethod('jazzcash')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    paymentMethod === 'jazzcash'
                      ? 'border-emerald-500 bg-emerald-950/20 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
                      : 'border-stone-800 bg-stone-950 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-amber-400 flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      JazzCash (جاز کیش)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard('03274397413', 'jazzcash');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
                    >
                      {copiedAccount === 'jazzcash' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-stone-400" />
                          <span>Copy Number</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-mono font-black text-stone-100 tracking-wider">0327 4397413</p>
                    <p className="text-xs font-semibold text-amber-400">Account Title: Muhammad Yasir Siddique</p>
                  </div>
                </div>

              </div>
            </div>

            {/* STEP 3: SUBMIT TRX ID FORM */}
            <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5 sm:p-7 space-y-5">
              <div className="border-b border-stone-800 pb-3">
                <h2 className="text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-stone-950 text-xs font-black flex items-center justify-center">3</span>
                  <span>ادائیگی کا ثبوت جمع کروائیں (Submit Transaction Details)</span>
                </h2>
                <p className="text-xs text-stone-400">
                  پیسے بھیجنے کے بعد ملنے والی Transaction ID (TRX ID) اور اپنا نام درج کریں:
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    Selected Plan & Price (منتخب پلان)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedPlan.nameUrdu} - Rs. ${selectedPlan.price.toLocaleString()} PKR`}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-emerald-500/30 text-emerald-400 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    Payment Method Used (طریقہ کار)
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 text-xs font-medium focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="easypaisa">Easypaisa (0327 4397413 - Muhammad Yasir Siddique)</option>
                    <option value="jazzcash">JazzCash (0327 4397413 - Muhammad Yasir Siddique)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    Sender Account Name / Title (بھیجنے والے کا نام) *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Ali Ahmed"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 text-xs focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    Sender Mobile / Account Number (بھیجنے والے کا نمبر) *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="e.g. 0312 3456789"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 text-xs focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    Transaction ID (TRX ID / SMS ریفرنس نمبر) *
                  </label>
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="e.g. 19283746501 or TID89241"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-amber-500/50 font-mono text-amber-300 font-bold text-sm tracking-wider focus:border-emerald-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    EasyPaisa، JazzCash یا بینک کی رسید میں دیا گیا ٹرانزیکشن نمبر (TRX ID) یہاں لکھیں۔
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    Additional Notes (اختیاری نوٹ)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any comments or reference..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-stone-100 text-xs focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-sm shadow-xl hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>
                    {submitting 
                      ? 'تصدیق کے لیے جمع ہو رہا ہے...' 
                      : `پلان کی فیس جمع کروائیں (Rs. ${selectedPlan.price.toLocaleString()} PKR Submit Proof)`}
                  </span>
                </button>
              </div>
            </form>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-stone-900 bg-stone-950 p-4 text-center text-xs text-stone-400">
        <p>© 2026 WorkPoint MicroTasks Pakistan. All payments are verified securely by the Administration.</p>
      </footer>
    </div>
  );
};
