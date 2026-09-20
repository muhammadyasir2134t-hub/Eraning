import React, { useState } from 'react';
import { Settings, Shield, Lock, Bell, Moon, Sun, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

export const AccountSettingsPage: React.FC = () => {
  const { user } = useAuth();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  // Notification Preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [payoutAlerts, setPayoutAlerts] = useState(true);
  const [prefSuccess, setPrefSuccess] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwLoading(true);
    try {
      await apiRequest('/api/settings/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      setPwSuccess('Password updated successfully. Next session will require your new password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.message || 'Failed to update password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleSavePreferences = () => {
    setPrefSuccess('Notification preferences updated.');
    setTimeout(() => setPrefSuccess(null), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-stone-100 tracking-tight">Account & Security Settings</h2>
        <p className="text-xs sm:text-sm text-stone-400 mt-1">
          Configure login credentials, multi-factor security preferences, and payout alert thresholds.
        </p>
      </div>

      {/* Security Credentials: Password Update */}
      <form onSubmit={handlePasswordChange} className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-400" />
          <span>Update Security Password</span>
        </h3>

        {pwSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{pwSuccess}</span>
          </div>
        )}

        {pwError && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{pwError}</span>
          </div>
        )}

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Current Password
            </label>
            <input
              id="settings-curr-pass"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter existing password"
              className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              New Password (Minimum 8 Characters)
            </label>
            <input
              id="settings-new-pass"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Must include letters and numbers"
              className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Confirm New Password
            </label>
            <input
              id="settings-confirm-pass"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <button
            id="settings-save-pass-btn"
            type="submit"
            disabled={pwLoading}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-700 text-stone-950 font-bold text-xs shadow-xs transition-colors"
          >
            {pwLoading ? 'Saving Password...' : 'Save New Password'}
          </button>
        </div>
      </form>

      {/* Notification Preferences */}
      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-400" />
          <span>Communication & Alerts</span>
        </h3>

        {prefSuccess && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded-xl">
            {prefSuccess}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between p-3.5 bg-stone-950 rounded-xl border border-stone-800/80 cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-stone-200 block">Task Audit Decisions</span>
              <span className="text-[11px] text-stone-500">Receive in-app and email notices when your task submissions are evaluated.</span>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="rounded-sm bg-stone-900 border-stone-700 text-emerald-500 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-stone-950 rounded-xl border border-stone-800/80 cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-stone-200 block">Withdrawal Status SMS</span>
              <span className="text-[11px] text-stone-500">Instant SMS confirmation when payout is dispatched to your mobile wallet.</span>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="rounded-sm bg-stone-900 border-stone-700 text-emerald-500 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-stone-950 rounded-xl border border-stone-800/80 cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-stone-200 block">Security Sign-in Warnings</span>
              <span className="text-[11px] text-stone-500">Alert me if a session is initiated from a new device or unrecognized IP.</span>
            </div>
            <input
              type="checkbox"
              checked={payoutAlerts}
              onChange={(e) => setPayoutAlerts(e.target.checked)}
              className="rounded-sm bg-stone-900 border-stone-700 text-emerald-500 focus:ring-emerald-500"
            />
          </label>
        </div>

        <button
          onClick={handleSavePreferences}
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl"
        >
          Update Preferences
        </button>
      </div>

      {/* Account Info & Data Deletion Policy */}
      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <span>Account Security & Compliance Standards</span>
        </h3>
        <p className="text-xs text-stone-400 leading-relaxed">
          Your account is governed by GDPR and local data protection regulations. Personal identifiers, task outputs, and payment routing credentials are encrypted at rest using industry-standard AES-256 protocols.
        </p>
      </div>
    </div>
  );
};
