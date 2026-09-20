import React, { useState } from 'react';
import { ShieldCheck, User, MapPin, Briefcase, Wallet, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

interface UserProfileSetupProps {
  onNavigate: (page: string) => void;
}

const AVAILABLE_SKILLS = [
  'Data Quality & AI Evaluation',
  'Audio & Voice Transcription',
  'QA & Mobile App Testing',
  'Market Research & Surveys',
  'Data Entry & Validation',
  'Content Proofreading',
];

const PAKISTAN_CITIES = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Other',
];

export const UserProfileSetupPage: React.FC<UserProfileSetupProps> = ({ onNavigate }) => {
  const { user, profile, markProfileCompleted, refreshUserData } = useAuth();

  const [city, setCity] = useState(profile?.city || 'Lahore');
  const [bio, setBio] = useState(profile?.bio || 'Dedicated digital task specialist & reviewer.');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    profile?.skills ? profile.skills.split(', ') : ['Data Quality & AI Evaluation', 'QA & Mobile App Testing']
  );
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || '');
  const [payoutMethod, setPayoutMethod] = useState<'easypaisa' | 'jazzcash' | 'bank_transfer'>('easypaisa');
  const [accountTitle, setAccountTitle] = useState(user?.fullName || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiRequest('/api/auth/profile-setup', {
        method: 'POST',
        body: JSON.stringify({
          city,
          bio,
          skills: selectedSkills.join(', '),
          mobileNumber,
          preferredPayoutMethod: payoutMethod,
          preferredAccountTitle: accountTitle,
        }),
      });

      markProfileCompleted();
      await refreshUserData();
      if (user?.paymentStatus !== 'approved') {
        onNavigate('activation-payment');
      } else {
        onNavigate('dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    markProfileCompleted();
    if (user?.paymentStatus !== 'approved') {
      onNavigate('activation-payment');
    } else {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-stone-950 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-stone-50">WorkPoint</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-semibold mb-3">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Account Verified • Final Setup Step</span>
        </div>
        <h2 className="text-2xl font-bold text-stone-100 tracking-tight">Performer Profile Setup</h2>
        <p className="mt-1 text-xs text-stone-400">
          Personalize your preferences so we can match you with relevant micro-tasks.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-stone-900 py-8 px-6 sm:px-10 rounded-2xl border border-stone-800 shadow-xl space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* Primary Location */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>Primary City / Location</span>
              </label>
              <select
                id="profile-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {PAKISTAN_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Confirmation */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>Contact Mobile Number</span>
              </label>
              <input
                id="profile-mobile"
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="0300 1234567"
                className="w-full py-2.5 px-3.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Core Task Skills */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-stone-400" />
                <span>Task Specializations (Select all that apply)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_SKILLS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`p-2.5 rounded-lg border text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/50 border-emerald-600 text-emerald-300'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <span className="truncate mr-2">{skill}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Performer Bio / Experience Note
              </label>
              <textarea
                id="profile-bio"
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Briefly state your task review experience..."
                className="w-full py-2 px-3.5 bg-stone-950 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Preferred Payout Channel */}
            <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 space-y-3">
              <label className="block text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Preferred Withdrawal Method</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easypaisa', 'jazzcash', 'bank_transfer'] as const).map((method) => (
                  <button
                    type="button"
                    key={method}
                    onClick={() => setPayoutMethod(method)}
                    className={`py-2 px-2 text-center rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                      payoutMethod === method
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {method === 'bank_transfer' ? 'Bank' : method}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <button
                id="save-profile-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-700 text-stone-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span>Saving Profile...</span>
                ) : (
                  <>
                    <span>Save & Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                id="skip-profile-btn"
                onClick={handleSkip}
                className="w-full py-2 text-xs text-stone-400 hover:text-stone-200 transition-colors"
              >
                Skip for now and go to Dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
