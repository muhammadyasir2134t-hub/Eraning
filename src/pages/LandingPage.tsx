import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp, 
  Wallet, 
  Lock, 
  Award,
  Users,
  Clock,
  ChevronRight
} from 'lucide-react';

interface LandingProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-emerald-500 selection:text-stone-950">
      {/* Navigation */}
      <header className="border-b border-stone-800/80 bg-stone-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-stone-950 flex items-center justify-center font-bold text-xl shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-stone-100">WorkPoint</span>
              <span className="block text-[11px] text-stone-400 font-medium">Task Performer Portal</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-300">
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</a>
            <a href="#disclosures" className="hover:text-emerald-400 transition-colors">Fair Terms & Disclosures</a>
            <a href="#payouts" className="hover:text-emerald-400 transition-colors">Payout Methods</a>
            <button
              onClick={() => onNavigate('payment-proofs')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Proofs</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="landing-login-btn"
              onClick={() => onNavigate('login')}
              className="px-4 py-2 text-sm font-medium text-stone-200 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              id="landing-register-btn"
              onClick={() => onNavigate('register')}
              className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-semibold text-sm shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 lg:pt-28 lg:pb-32 overflow-hidden border-b border-stone-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Transparent & Legitimate Micro-Work</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-50 tracking-tight leading-[1.15]">
              Earn fair rewards by completing real digital tasks.
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-stone-400 leading-relaxed max-w-2xl">
              Perform search evaluation, audio transcription verification, app usability reviews, and market research. No deposit required. No recruitment mandates.
            </p>

            {/* Mandatory Regulatory Transparency Notice */}
            <div className="mt-8 p-4 rounded-xl bg-stone-900/90 border border-stone-800 text-xs text-stone-400 leading-normal flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-200">Ethical Platform Commitment:</strong> Earnings depend strictly upon individual task accuracy, availability, and client approval. We never promise guaranteed passive returns, do not charge mandatory activation fees, and do not enforce recruitment schemes.
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                id="hero-register-btn"
                onClick={() => onNavigate('register')}
                className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Free Registration</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                id="hero-login-btn"
                onClick={() => onNavigate('login')}
                className="px-6 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-semibold text-base transition-all text-center cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Sign In (Google / Email)</span>
              </button>
            </div>

            {/* Auth Options Preview Badges */}
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-stone-400">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 border border-stone-800">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Google OAuth 2.0
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 border border-stone-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Email & Mobile Login
              </span>
              <button
                onClick={() => onNavigate('payment-proofs')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:text-emerald-200 transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Real-Time Live Payment Proofs</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section id="how-it-works" className="py-20 bg-stone-900/40 border-b border-stone-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-50 tracking-tight">
              A transparent, task-based earning workflow
            </h2>
            <p className="mt-2 text-stone-400 text-base">
              Every workflow step is tracked in your personal dashboard with complete audit trails.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/40 flex items-center justify-center font-bold text-lg mb-5">
                01
              </div>
              <h3 className="text-lg font-semibold text-stone-100 mb-2">Browse Open Tasks</h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                Review task requirements, estimated time (10–30 mins), and verified reward rates in PKR before starting.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/40 flex items-center justify-center font-bold text-lg mb-5">
                02
              </div>
              <h3 className="text-lg font-semibold text-stone-100 mb-2">Submit Verified Proof</h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                Provide your audit outputs, transcription corrections, or test reports. Submissions enter immediate quality review.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/40 flex items-center justify-center font-bold text-lg mb-5">
                03
              </div>
              <h3 className="text-lg font-semibold text-stone-100 mb-2">Direct Local Payouts</h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                Approved funds credit immediately to your available balance. Request withdrawals directly to Easypaisa, JazzCash, or Bank.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclosures & Safety */}
      <section id="disclosures" className="py-16 border-b border-stone-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-stone-900 border border-stone-800 p-8 lg:p-12">
            <h3 className="text-xl font-bold text-stone-100 mb-4">
              Our Safety, Privacy & Fair-Pay Disclosures
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-stone-300">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong className="text-stone-100 block mb-1">Zero Upfront Investment</strong>
                  You will never be asked to pay an activation fee or subscription package to unlock tasks.
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong className="text-stone-100 block mb-1">No Mandatory Referral Quotas</strong>
                  Earnings come strictly from task work performed. You are never penalized for not recruiting others.
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong className="text-stone-100 block mb-1">Realistic & Verified Balances</strong>
                  Our system maintains a strict separation between available balance, pending balance, and paid disbursements.
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong className="text-stone-100 block mb-1">Data Privacy & Minimal Collection</strong>
                  We collect only necessary operational information. No sensitive card numbers or PINs are ever stored.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 bg-stone-950 border-t border-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-stone-950 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-semibold text-stone-200">WorkPoint Platform</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-stone-400">
            <button onClick={() => onNavigate('terms')} className="hover:text-stone-200">Terms & Conditions</button>
            <button onClick={() => onNavigate('privacy')} className="hover:text-stone-200">Privacy Policy</button>
            <button onClick={() => onNavigate('support')} className="hover:text-stone-200">Support Center</button>
          </div>

          <div className="text-xs text-stone-500">
            © {new Date().getFullYear()} WorkPoint Platform. User Panel v1.0.0
          </div>
        </div>
      </footer>
    </div>
  );
};
