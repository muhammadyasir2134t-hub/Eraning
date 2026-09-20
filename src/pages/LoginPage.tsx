import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Phone, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone, 
  KeyRound, 
  RefreshCw,
  UserCheck,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { FirebaseGoogleLoginButton } from '../components/FirebaseGoogleLoginButton';

interface LoginProps {
  onNavigate: (page: string, params?: any) => void;
}

export const LoginPage: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  
  // Login method tabs: 'mobile-otp' | 'password' | 'google'
  const [activeTab, setActiveTab] = useState<'mobile-otp' | 'password' | 'google'>('mobile-otp');

  // Mobile OTP States
  const [mobileNumber, setMobileNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [smsDelivery, setSmsDelivery] = useState<{ otpCode: string; text: string; sender: string } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password Login States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Common States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Resend cooldown timer
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Mobile OTP Request
  const handleSendMobileOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mobileNumber.trim()) {
      setError('Please enter a valid mobile number.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/send-mobile-otp', {
        method: 'POST',
        body: JSON.stringify({
          mobileNumber: mobileNumber.trim(),
          fullName: fullName.trim() || 'Muhammad Yasir',
        }),
      });

      setSmsDelivery(res.smsDelivery);
      setOtpStep('verify');
      setResendCooldown(res.cooldownSeconds || 60);
      setSuccessMsg(res.message || 'Verification code sent via SMS.');
      
      // Pre-fill digits for quick testing
      if (res.smsDelivery?.otpCode) {
        const chars = res.smsDelivery.otpCode.split('').slice(0, 6);
        setOtpDigits(chars);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch mobile OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit change with auto-focus next
  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste of complete 6-digit code
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || '';
        }
        setOtpDigits(newDigits);
        const nextIndex = Math.min(pasted.length, 5);
        digitInputRefs.current[nextIndex]?.focus();
        return;
      }
    }

    const cleanChar = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanChar;
    setOtpDigits(newDigits);

    if (cleanChar && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation between digit boxes
  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Mobile OTP Verification & Login
  const handleVerifyMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit OTP received via SMS.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/verify-mobile-otp', {
        method: 'POST',
        body: JSON.stringify({
          mobileNumber: mobileNumber.trim(),
          otpCode,
          fullName: fullName.trim() || 'Muhammad Yasir',
        }),
      });

      login(res.token, res.user);

      if (!res.profileCompleted) {
        onNavigate('profile-setup');
      } else if (res.user.paymentStatus !== 'approved') {
        onNavigate('activation-payment');
      } else {
        onNavigate('dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Standard Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });

      login(res.token, res.user);

      if (!res.user.isVerified) {
        onNavigate('otp-verification', { email: res.user.email, isNewAccount: false });
      } else if (!res.profileCompleted) {
        onNavigate('profile-setup');
      } else if (res.user.paymentStatus !== 'approved') {
        onNavigate('activation-payment');
      } else {
        onNavigate('dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify email/phone and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (data: any) => {
    if (!data.user.isVerified) {
      onNavigate('otp-verification', { email: data.user.email, isNewAccount: true });
    } else if (!data.profileCompleted) {
      onNavigate('profile-setup');
    } else if (data.user?.paymentStatus !== 'approved') {
      onNavigate('activation-payment');
    } else {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div 
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2.5 cursor-pointer mb-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-stone-950 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-stone-50">WorkPoint</span>
        </div>
        <h2 className="text-2xl font-bold text-stone-100 tracking-tight">Performer Authentication Portal</h2>
        <p className="mt-1.5 text-xs text-stone-400">
          Secure mobile OTP & password sign-in for verified performers
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-stone-900 py-7 px-5 sm:px-8 rounded-2xl border border-stone-800 shadow-xl space-y-5">
          
          {/* Login Tabs */}
          <div className="grid grid-cols-3 p-1 bg-stone-950 rounded-xl border border-stone-800 text-xs font-semibold">
            <button
              type="button"
              id="tab-mobile-otp"
              onClick={() => { setActiveTab('mobile-otp'); setError(null); }}
              className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'mobile-otp' 
                  ? 'bg-emerald-600 text-white shadow-xs font-bold' 
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>Mobile OTP</span>
            </button>
            <button
              type="button"
              id="tab-password"
              onClick={() => { setActiveTab('password'); setError(null); }}
              className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'password' 
                  ? 'bg-emerald-600 text-white shadow-xs font-bold' 
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span>Password</span>
            </button>
            <button
              type="button"
              id="tab-google"
              onClick={() => { setActiveTab('google'); setError(null); }}
              className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'google' 
                  ? 'bg-emerald-600 text-white shadow-xs font-bold' 
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span>Google</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/70 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: MOBILE OTP LOGIN SYSTEM */}
          {activeTab === 'mobile-otp' && (
            <div className="space-y-4">
              {otpStep === 'request' ? (
                <form onSubmit={handleSendMobileOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Performer Full Name (Real Name)
                    </label>
                    <input
                      id="mobile-login-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Muhammad Yasir"
                      className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Mobile Number (موبائل نمبر)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        id="mobile-login-number"
                        type="text"
                        required
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="0300 1234567 or +92 300 1234567"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <span className="text-[11px] text-stone-400 mt-1 block">
                      A 6-digit verification code will be sent to this number via SMS.
                    </span>
                  </div>

                  <button
                    id="send-mobile-otp-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-700 text-stone-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching SMS OTP...
                      </span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send 6-Digit Mobile OTP</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyMobileOtp} className="space-y-4">
                  {/* Real Dispatched SMS Notification Toast */}
                  {smsDelivery && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/80 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-emerald-400 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5" /> SMS Received: {smsDelivery.sender}
                        </span>
                        <span className="text-[10px] text-emerald-300 font-mono">Just Now</span>
                      </div>
                      <div className="text-stone-200 text-[11px] bg-stone-900/80 p-2 rounded-md font-mono border border-emerald-900/50">
                        {smsDelivery.text}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-stone-300">
                        Enter 6-Digit Verification Code
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpStep('request')}
                        className="text-xs text-emerald-400 hover:underline"
                      >
                        Change Number
                      </button>
                    </div>

                    {/* 6 Individual Digit Inputs */}
                    <div className="flex gap-2 justify-between">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { digitInputRefs.current[idx] = el; }}
                          type="text"
                          maxLength={6}
                          inputMode="numeric"
                          value={digit}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                          className="w-11 h-12 text-center text-lg font-mono font-bold bg-stone-950 border border-stone-700 focus:border-emerald-500 rounded-lg text-stone-50 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    id="verify-mobile-otp-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-700 text-stone-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Verifying OTP...
                      </span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Sign In</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-stone-400">Didn't receive code?</span>
                    {resendCooldown > 0 ? (
                      <span className="text-stone-500">Resend in {resendCooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendMobileOtp()}
                        className="text-emerald-400 hover:underline font-semibold"
                      >
                        Resend SMS Code
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: EMAIL & PASSWORD SIGN-IN */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@domain.com or 03001234567"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-300">
                    Password
                  </label>
                  <button
                    type="button"
                    id="forgot-password-link"
                    onClick={() => onNavigate('forgot-password')}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-stone-400 hover:text-stone-200"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-700 text-stone-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In with Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: GOOGLE AUTHENTICATION */}
          {activeTab === 'google' && (
            <div className="space-y-3 py-1">
              <span className="block text-xs text-stone-400 text-center mb-1">
                Sign in securely with your authorized Google Account
              </span>
              <FirebaseGoogleLoginButton
                text="signin_with"
                showFirebaseBadge={false}
                onSuccess={handleGoogleSuccess}
                onError={(err) => setError(err)}
              />
            </div>
          )}

          {/* Registration link */}
          <div className="pt-3 border-t border-stone-800/80 text-center text-xs text-stone-400">
            Don't have an account?{' '}
            <button
              id="goto-register-btn"
              onClick={() => onNavigate('register')}
              className="font-semibold text-emerald-400 hover:underline ml-1"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
