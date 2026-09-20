import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User, Phone, Tag, ArrowRight, AlertCircle, CheckCircle2, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { FirebaseGoogleLoginButton } from '../components/FirebaseGoogleLoginButton';

interface RegisterProps {
  onNavigate: (page: string, params?: any) => void;
}

export const RegisterPage: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    ageConsent: false,
    termsConsent: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!formData.ageConsent) {
      setError('You must confirm you are at least 18 years old to join.');
      return;
    }

    if (!formData.termsConsent) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      login(res.token, res.user);

      // Transition to Verification Page
      onNavigate('otp-verification', {
        email: res.user.email,
        isNewAccount: true,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please review your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (data: any) => {
    onNavigate('otp-verification', {
      email: data.user.email,
      isNewAccount: true,
    });
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
        <h2 className="text-2xl font-bold text-stone-100 tracking-tight">Free Performer Registration</h2>
        <p className="mt-2 text-xs text-stone-400">
          Join our verified digital task network. 100% free account creation.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-stone-900 py-8 px-6 sm:px-10 rounded-2xl border border-stone-800 shadow-xl space-y-6">
          {/* 100% Free Guarantee Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-stone-300">
              <span className="font-semibold text-emerald-400 block">100% Free Registration</span>
              <span>No registration fee, activation charge, or deposit required.</span>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Option A: Quick Sign up with Google */}
          <div className="space-y-2">
            <FirebaseGoogleLoginButton
              text="signup_with"
              showFirebaseBadge={false}
              onSuccess={handleGoogleSuccess}
              onError={(err) => setError(err)}
            />
          </div>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-stone-800"></div>
            <span className="shrink mx-4 text-xs text-stone-500 font-medium">Or register with details</span>
            <div className="grow border-t border-stone-800"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="reg-full-name"
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Muhammad Yasir"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Mobile Number <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="reg-mobile"
                  type="tel"
                  name="mobileNumber"
                  required
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="0300 1234567"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="reg-password"
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Confirm Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="reg-confirm-password"
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Referral Code (Optional - Non-Mandatory) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-stone-300">
                  Referral Code
                </label>
                <span className="text-[11px] text-stone-500 font-medium">Optional</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                  <Tag className="w-4 h-4" />
                </div>
                <input
                  id="reg-referral-code"
                  type="text"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleChange}
                  placeholder="EARN-XXXXXX (Optional)"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 uppercase font-mono"
                />
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                No mandatory referral required to register or perform tasks.
              </p>
            </div>

            {/* Consents */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-2.5 text-xs text-stone-300 cursor-pointer">
                <input
                  id="reg-age-consent"
                  type="checkbox"
                  name="ageConsent"
                  checked={formData.ageConsent}
                  onChange={handleChange}
                  className="mt-0.5 rounded-sm bg-stone-950 border-stone-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <span>I confirm that I am at least 18 years old and eligible to perform digital tasks.</span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-stone-300 cursor-pointer">
                <input
                  id="reg-terms-consent"
                  type="checkbox"
                  name="termsConsent"
                  checked={formData.termsConsent}
                  onChange={handleChange}
                  className="mt-0.5 rounded-sm bg-stone-950 border-stone-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <span>
                  I agree to the <button type="button" onClick={() => onNavigate('terms')} className="text-emerald-400 hover:underline">Terms of Service</button> and <button type="button" onClick={() => onNavigate('privacy')} className="text-emerald-400 hover:underline">Privacy Policy</button>.
                </span>
              </label>
            </div>

            <button
              id="reg-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-700 text-stone-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Creating Free Account...</span>
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-stone-800/80 text-center text-xs text-stone-400">
            Already have an account?{' '}
            <button
              id="goto-login-btn"
              onClick={() => onNavigate('login')}
              className="font-semibold text-emerald-400 hover:underline ml-1"
            >
              Sign In here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
