import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Phone, CheckCircle2, AlertCircle, RefreshCw, Clock, ArrowRight, Sparkles, Lock } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface VerificationPageProps {
  onNavigate: (page: string, params?: any) => void;
  navigationParams?: {
    email?: string;
    demoOtp?: string;
    isNewAccount?: boolean;
  };
}

export const VerificationPage: React.FC<VerificationPageProps> = ({ onNavigate, navigationParams }) => {
  const { user, markUserVerified } = useAuth();

  const userEmail = navigationParams?.email || user?.email || 'user@example.com';
  const [verificationChannel, setVerificationChannel] = useState<'email' | 'mobile'>('email');
  const [otpCode, setOtpCode] = useState('');

  // Cooldown & Expiry Timers
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [expirySeconds, setExpirySeconds] = useState(600); // 10 minutes
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Timer countdown effects
  useEffect(() => {
    const timer = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (expirySeconds <= 0) {
      setError('Verification code has expired. Please click "Resend Code" to get a fresh code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: userEmail,
          otpCode: otpCode.trim(),
        }),
      });

      setSuccess(true);
      markUserVerified();

      // After verification -> Redirect to User Profile Setup or Payment Activation
      setTimeout(() => {
        if (!res.profileCompleted) {
          onNavigate('profile-setup');
        } else {
          onNavigate('activation-payment');
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your code.');
      if (err.remainingAttempts !== undefined) {
        setAttemptsRemaining(err.remainingAttempts);
      } else {
        setAttemptsRemaining((prev) => Math.max(0, prev - 1));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0) return;

    setError(null);
    setResending(true);

    try {
      await apiRequest('/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email: userEmail }),
      });

      setCooldownSeconds(60);
      setExpirySeconds(600);
      setAttemptsRemaining(5);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div 
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2.5 cursor-pointer mb-4"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-stone-950 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-stone-50">WorkPoint</span>
        </div>
        <h2 className="text-2xl font-bold text-stone-100 tracking-tight">Free User Verification</h2>
        <p className="mt-2 text-xs text-stone-400">
          Verify your account to access micro-tasks and your earnings wallet.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-stone-900 py-8 px-6 sm:px-10 rounded-2xl border border-stone-800 shadow-xl space-y-6">
          {/* Zero Charge Notice */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>100% Free Verification</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              No Payment Required
            </span>
          </div>

          {/* Verification Code Notice */}
          <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="text-xs text-stone-300">
              <span className="font-semibold text-stone-200 block">Verification Code Dispatched</span>
              <span className="text-stone-400">Please enter the 6-digit code received on your email/mobile.</span>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="py-6 text-center space-y-4 animate-in fade-in">
              <div className="w-14 h-14 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-700">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-50">Account Verified!</h3>
                <p className="mt-1 text-xs text-stone-400">
                  Verification status updated. Redirecting to Profile Setup...
                </p>
              </div>
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              {/* Channel Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-stone-950 rounded-xl border border-stone-800">
                <button
                  type="button"
                  onClick={() => setVerificationChannel('email')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    verificationChannel === 'email'
                      ? 'bg-stone-800 text-stone-100 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationChannel('mobile')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    verificationChannel === 'mobile'
                      ? 'bg-stone-800 text-stone-100 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Mobile SMS</span>
                </button>
              </div>

              <div className="text-xs text-stone-400 text-center">
                Code dispatched to <span className="font-semibold text-stone-200">{userEmail}</span>
              </div>

              {/* 6-Digit Code Input */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-2 text-center">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  id="verification-otp-input"
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtpCode(val);
                    if (val.length === 6) {
                      setError(null);
                    }
                  }}
                  placeholder="••••••"
                  className="w-full text-center tracking-[0.6em] font-mono text-2xl py-3 px-4 bg-stone-950 border border-stone-700 rounded-xl text-emerald-400 placeholder-stone-600 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Status and Timers Bar */}
              <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  <span>Expires in:</span>
                  <span className={`font-mono font-bold ${expirySeconds < 60 ? 'text-rose-400' : 'text-stone-200'}`}>
                    {formatTime(expirySeconds)}
                  </span>
                </div>

                <div className="text-[11px] text-stone-500 font-medium">
                  Attempts: <span className="text-stone-300 font-semibold">{attemptsRemaining}/5</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="verify-submit-btn"
                type="submit"
                disabled={loading || otpCode.length !== 6 || expirySeconds <= 0}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend Cooldown Button */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  id="resend-otp-btn"
                  onClick={handleResend}
                  disabled={cooldownSeconds > 0 || resending}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 disabled:text-stone-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  {cooldownSeconds > 0 ? (
                    <span>Resend Code in {cooldownSeconds}s</span>
                  ) : (
                    <span>Resend Verification Code</span>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="pt-2 border-t border-stone-800/80 text-center">
            <button
              onClick={() => onNavigate('login')}
              className="text-xs text-stone-400 hover:text-stone-200 transition-colors"
            >
              Sign out & return to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
