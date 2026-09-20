import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  Lock, 
  UserCheck, 
  Smartphone, 
  Key, 
  FileText, 
  Banknote, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, formatCurrency } from '../lib/api';

interface RbacProtocolPageProps {
  onNavigate: (page: string) => void;
}

export const RbacProtocolPage: React.FC<RbacProtocolPageProps> = ({ onNavigate }) => {
  const { user, login } = useAuth();

  const [activeTab, setActiveTab] = useState<'matrix' | 'submissions' | 'withdrawals' | 'users' | 'activation_payments'>('matrix');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // RBAC State
  const [rbacStatus, setRbacStatus] = useState<any>(null);
  const [auditQueue, setAuditQueue] = useState<{ pendingSubmissions: any[]; pendingWithdrawals: any[] }>({
    pendingSubmissions: [],
    pendingWithdrawals: []
  });
  const [userList, setUserList] = useState<any[]>([]);
  const [activationPayments, setActivationPayments] = useState<any[]>([]);
  const [switchingRole, setSwitchingRole] = useState(false);

  // Load RBAC Status and Audit data
  const loadRbacData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusRes = await apiRequest('/api/rbac/status');
      setRbacStatus(statusRes);

      // If user has admin or manager privileges, load audit queue and users
      if (['admin', 'manager'].includes(statusRes.role)) {
        const queueRes = await apiRequest('/api/admin/audit-queue');
        setAuditQueue(queueRes);

        const usersRes = await apiRequest('/api/admin/users');
        setUserList(usersRes.users || []);
      }

      if (statusRes.role === 'admin') {
        try {
          const actRes = await apiRequest('/api/admin/activation-payments');
          setActivationPayments(actRes.payments || []);
        } catch (actErr) {
          console.warn('Could not fetch activation payments:', actErr);
        }
      }
    } catch (err: any) {
      console.error('Failed to load RBAC protocol state:', err);
      setError(err.message || 'Failed to load RBAC protocol state.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRbacData();
  }, [user?.role]);

  // Handle Switch Role
  const handleSwitchRole = async (targetRole: string) => {
    setSwitchingRole(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiRequest('/api/rbac/switch-role', {
        method: 'POST',
        body: JSON.stringify({ role: targetRole }),
      });

      login(res.token, res.user);
      setSuccessMsg(`Switched role to ${targetRole.toUpperCase()}. Permissions updated.`);
      await loadRbacData();
    } catch (err: any) {
      setError(err.message || 'Failed to switch role.');
    } finally {
      setSwitchingRole(false);
    }
  };

  // Review Task Submission
  const handleReviewSubmission = async (submissionId: string, status: 'approved' | 'rejected') => {
    try {
      await apiRequest(`/api/admin/submissions/${submissionId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          feedback: status === 'approved' ? 'Verified by quality auditor. Requirements met.' : 'Incomplete proof provided.'
        }),
      });
      setSuccessMsg(`Submission #${submissionId.slice(0, 8)} ${status}.`);
      await loadRbacData();
    } catch (err: any) {
      setError(err.message || 'Review failed.');
    }
  };

  // Review Withdrawal Payout
  const handleReviewWithdrawal = async (withdrawalId: string, status: 'completed' | 'rejected') => {
    try {
      await apiRequest(`/api/admin/withdrawals/${withdrawalId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          adminNotes: status === 'completed' ? 'Disbursed via automated payout gateway.' : 'Account details verification failed.'
        }),
      });
      setSuccessMsg(`Withdrawal ${status}.`);
      await loadRbacData();
    } catch (err: any) {
      setError(err.message || 'Withdrawal review failed.');
    }
  };

  // Update specific user role
  const handleUpdateUserRole = async (targetUserId: string, newRole: string) => {
    try {
      await apiRequest(`/api/admin/users/${targetUserId}/role`, {
        method: 'POST',
        body: JSON.stringify({ role: newRole }),
      });
      setSuccessMsg(`User role successfully changed to ${newRole}.`);
      await loadRbacData();
    } catch (err: any) {
      setError(err.message || 'Failed to update user role.');
    }
  };

  // Review Performer Activation Payment (1500 PKR)
  const handleReviewActivationPayment = async (paymentId: number | string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      setLoading(true);
      await apiRequest(`/api/admin/activation-payments/${paymentId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          adminNotes: notes || (status === 'approved' ? 'Verified by Admin Muhammad Yasir. Performer dashboard unlocked.' : 'Invalid TRX ID / Proof.')
        }),
      });
      setSuccessMsg(`Performer 1500 PKR activation ${status === 'approved' ? 'APPROVED & UNLOCKED' : 'REJECTED'}.`);
      await loadRbacData();
    } catch (err: any) {
      setError(err.message || 'Failed to review activation payment.');
    } finally {
      setLoading(false);
    }
  };

  const currentRole = rbacStatus?.role || user?.role || 'performer';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Protocol Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4" />
              <span>RBSC Security & Access Control Protocol (RBAC)</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-stone-50 tracking-tight">
              Role-Based Access Control Architecture
            </h1>
            <p className="mt-1 text-sm text-stone-400 max-w-2xl">
              Strict multi-tier permission matrix governing task execution, proof auditing, OTP verification, and cash disbursements with real Pakistani user identities.
            </p>
          </div>

          {/* Active User Card */}
          <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-4 min-w-[260px]">
            <div className="text-xs text-stone-400 font-medium">Logged-In Performer:</div>
            <div className="text-base font-bold text-stone-100 mt-0.5">
              {user?.fullName || 'Muhammad Yasir'}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-stone-400">Active Role:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                currentRole === 'admin' 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : currentRole === 'manager'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {currentRole}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Role Switcher */}
        <div className="mt-6 pt-6 border-t border-stone-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-stone-400 font-medium">
            <Key className="w-4 h-4 text-emerald-400" />
            <span>Switch Role for Protocol Simulation:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              id="switch-role-admin"
              type="button"
              disabled={switchingRole}
              onClick={() => handleSwitchRole('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
              }`}
            >
              👑 Platform Admin (Full Control)
            </button>
            <button
              id="switch-role-manager"
              type="button"
              disabled={switchingRole}
              onClick={() => handleSwitchRole('manager')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentRole === 'manager'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
              }`}
            >
              🔍 Quality Auditor / Manager
            </button>
            <button
              id="switch-role-performer"
              type="button"
              disabled={switchingRole}
              onClick={() => handleSwitchRole('performer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentRole === 'performer'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
              }`}
            >
              ⚡ Verified Performer
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-800 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'matrix'
              ? 'border-emerald-500 text-emerald-400 font-bold'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          Permissions Matrix
        </button>
        {['admin', 'manager'].includes(currentRole) && (
          <>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'submissions'
                  ? 'border-emerald-500 text-emerald-400 font-bold'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>Submissions Audit Queue</span>
              {auditQueue.pendingSubmissions.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-xs border border-amber-500/40">
                  {auditQueue.pendingSubmissions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'withdrawals'
                  ? 'border-emerald-500 text-emerald-400 font-bold'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>Withdrawal Approvals</span>
              {auditQueue.pendingWithdrawals.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/40">
                  {auditQueue.pendingWithdrawals.length}
                </span>
              )}
            </button>
          </>
        )}
        {currentRole === 'admin' && (
          <>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'border-emerald-500 text-emerald-400 font-bold'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              Users & Roles Directory
            </button>
            <button
              onClick={() => setActiveTab('activation_payments')}
              className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'activation_payments'
                  ? 'border-emerald-500 text-emerald-400 font-bold'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>Activation Fees (PKR 1,500)</span>
              {activationPayments.filter((p: any) => p.status === 'pending').length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-stone-950 font-black text-xs">
                  {activationPayments.filter((p: any) => p.status === 'pending').length} Pending
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {/* TAB 1: PERMISSIONS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Admin Card */}
            <div className={`p-6 rounded-2xl border ${currentRole === 'admin' ? 'bg-rose-950/20 border-rose-700/80 shadow-md' : 'bg-stone-900 border-stone-800'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Level 3: Root Tier</span>
                <span className="p-2 rounded-lg bg-rose-500/20 text-rose-300">👑</span>
              </div>
              <h3 className="text-lg font-bold text-stone-100">Platform Administrator</h3>
              <p className="mt-1 text-xs text-stone-400">Complete governance over transactions, payouts, user roles, and security protocols.</p>
              <ul className="mt-4 space-y-2 text-xs text-stone-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Full Payout Approvals (Easypaisa/JazzCash)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> User Role Assignment & Suspension</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Task Quality Dispute Resolution</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Mobile OTP Gateway Configuration</li>
              </ul>
            </div>

            {/* Manager Card */}
            <div className={`p-6 rounded-2xl border ${currentRole === 'manager' ? 'bg-amber-950/20 border-amber-700/80 shadow-md' : 'bg-stone-900 border-stone-800'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Level 2: Quality Tier</span>
                <span className="p-2 rounded-lg bg-amber-500/20 text-amber-300">🔍</span>
              </div>
              <h3 className="text-lg font-bold text-stone-100">Task & Quality Manager</h3>
              <p className="mt-1 text-xs text-stone-400">Inspects performer proof submissions, validates data quality, and approves reward disbursements.</p>
              <ul className="mt-4 space-y-2 text-xs text-stone-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Audit Proof Screenshots & Links</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Approve / Reject Submissions</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> View KYC Identity Profiles</li>
                <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-stone-500" /> Cannot Disburse Bank Transfers</li>
              </ul>
            </div>

            {/* Performer Card */}
            <div className={`p-6 rounded-2xl border ${currentRole === 'performer' ? 'bg-emerald-950/20 border-emerald-700/80 shadow-md' : 'bg-stone-900 border-stone-800'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Level 1: Work Tier</span>
                <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">⚡</span>
              </div>
              <h3 className="text-lg font-bold text-stone-100">Verified Performer</h3>
              <p className="mt-1 text-xs text-stone-400">Performs micro-tasks, submits evidence, earns PKR balance, and executes authenticated cashouts.</p>
              <ul className="mt-4 space-y-2 text-xs text-stone-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Complete Micro-Tasks & Surveys</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Request Payout with SMS OTP</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Real-time Earnings Wallet</li>
                <li className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-stone-500" /> No Audit Queue Access</li>
              </ul>
            </div>
          </div>

          {/* Mobile OTP Security Enforcement Details */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-stone-100 flex items-center gap-2 mb-3">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <span>Mobile OTP Security Protocol Across Every Field</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-300">
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800">
                <div className="font-semibold text-emerald-400 mb-1">1. Passwordless Mobile Login</div>
                <p className="text-stone-400">Enter mobile number and receive instantaneous 6-digit SMS OTP token for secure zero-friction authentication.</p>
              </div>
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800">
                <div className="font-semibold text-emerald-400 mb-1">2. Payout Authorization OTP</div>
                <p className="text-stone-400">Withdrawals to Easypaisa or JazzCash mandate a fresh 6-digit SMS verification code before payout queues.</p>
              </div>
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800">
                <div className="font-semibold text-emerald-400 mb-1">3. Password Recovery OTP</div>
                <p className="text-stone-400">Credential reset requires verified SMS token confirmation delivered to the performer's registered SIM.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBMISSIONS AUDIT QUEUE */}
      {activeTab === 'submissions' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-100">Pending Task Proofs for Quality Review</h2>
              <p className="text-xs text-stone-400">Auditors review evidence before crediting reward to performer balance.</p>
            </div>
            <button
              onClick={loadRbacData}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {auditQueue.pendingSubmissions.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
              <span>Audit queue is empty. All task submissions have been audited!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {auditQueue.pendingSubmissions.map((sub: any) => (
                <div key={sub.id} className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-200">{sub.task_title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        ₨ {parseFloat(sub.reward_amount).toFixed(2)} PKR
                      </span>
                    </div>
                    <div className="text-xs text-stone-400">
                      Performer: <span className="font-semibold text-stone-200">{sub.performer_name}</span> ({sub.performer_mobile || sub.performer_email})
                    </div>
                    <div className="text-xs text-stone-300 bg-stone-900 p-2 rounded-md font-mono text-[11px] border border-stone-800">
                      Proof: {sub.proof_text || sub.proof_url || 'No textual proof notes provided'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReviewSubmission(sub.id, 'approved')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Credit
                    </button>
                    <button
                      onClick={() => handleReviewSubmission(sub.id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WITHDRAWAL APPROVALS */}
      {activeTab === 'withdrawals' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-100">Pending Withdrawal Payouts</h2>
              <p className="text-xs text-stone-400">Disburse funds to Easypaisa, JazzCash, or Bank Transfer accounts.</p>
            </div>
            <button
              onClick={loadRbacData}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {auditQueue.pendingWithdrawals.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
              <span>No pending withdrawal requests. All payouts disbursed!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {auditQueue.pendingWithdrawals.map((wd: any) => (
                <div key={wd.id} className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-200">
                        ₨ {parseFloat(wd.amount).toFixed(2)} PKR
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase border border-emerald-500/30">
                        {wd.payment_method}
                      </span>
                    </div>
                    <div className="text-xs text-stone-400">
                      Performer: <span className="font-semibold text-stone-200">{wd.performer_name}</span> | Account Title: <span className="font-semibold text-stone-200">{wd.account_title}</span>
                    </div>
                    <div className="text-xs text-stone-400 font-mono">
                      Account / Mobile: {wd.account_number} {wd.bank_name ? `(${wd.bank_name})` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReviewWithdrawal(wd.id, 'completed')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Disbursed
                    </button>
                    <button
                      onClick={() => handleReviewWithdrawal(wd.id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject & Refund
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: USERS & ROLES DIRECTORY */}
      {activeTab === 'users' && currentRole === 'admin' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-100">System Users & RBAC Directory</h2>
              <p className="text-xs text-stone-400">Real performer identities with assigned system authorization levels.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-800 text-stone-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Real Name & Email</th>
                  <th className="py-2.5 px-3">Mobile Number</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Available Balance</th>
                  <th className="py-2.5 px-3">Active Role</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {userList.map((u: any) => (
                  <tr key={u.id} className="hover:bg-stone-800/40">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-stone-200">{u.full_name}</div>
                      <div className="text-stone-500 text-[11px]">{u.email}</div>
                    </td>
                    <td className="py-3 px-3 text-stone-300 font-mono">
                      {u.mobile_number || 'N/A'}
                    </td>
                    <td className="py-3 px-3">
                      {u.is_verified ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                          Verified
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-700 text-stone-300">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      ₨ {parseFloat(u.available_balance || 0).toFixed(2)} PKR
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        u.role === 'admin' 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : u.role === 'manager'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {u.role || 'performer'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <select
                        value={u.role || 'performer'}
                        onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                        className="bg-stone-950 border border-stone-700 rounded-md py-1 px-2 text-[11px] text-stone-200 focus:outline-hidden"
                      >
                        <option value="performer">Performer</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ACTIVATION PAYMENTS AUDIT (1500 PKR GATE) */}
      {activeTab === 'activation_payments' && currentRole === 'admin' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
                <span>1500 PKR Mandatory Gate</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-100">
                Performer Activation Fee Submissions (1500 روپے ایکٹیویشن فیس)
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Every user must pay 1,500 PKR after login before accessing the dashboard. Verify transaction IDs below and click Accept to unlock.
              </p>
            </div>
            <button
              onClick={() => loadRbacData()}
              className="px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-700 hover:border-stone-600 text-stone-200 text-xs font-semibold flex items-center gap-2 self-start cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Submissions</span>
            </button>
          </div>

          {activationPayments.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-stone-800 rounded-xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-300">No activation submissions found.</p>
              <p className="text-xs text-stone-500 mt-1">When users submit 1500 PKR proofs, they appear here for verification.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-800 text-stone-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Performer</th>
                    <th className="py-3 px-3">Fee Amount</th>
                    <th className="py-3 px-3">Channel / Method</th>
                    <th className="py-3 px-3">Sender Details</th>
                    <th className="py-3 px-3">Transaction ID (TRX)</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {activationPayments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-stone-800/40">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-stone-200">{payment.performer_name || 'Performer'}</div>
                        <div className="text-stone-400 text-[11px] font-mono">{payment.performer_mobile || payment.performer_email}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-400">
                        Rs. {parseFloat(payment.amount).toLocaleString()} PKR
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize px-2 py-0.5 rounded-md bg-stone-950 border border-stone-800 font-medium text-stone-300">
                          {payment.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-stone-200">{payment.sender_name}</div>
                        <div className="text-stone-500 text-[11px] font-mono">{payment.sender_number}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {payment.trx_id}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          payment.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : payment.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-stone-400 text-[11px]">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {payment.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleReviewActivationPayment(payment.id, 'approved')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accept & Unlock</span>
                            </button>
                            <button
                              onClick={() => handleReviewActivationPayment(payment.id, 'rejected')}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-stone-500 text-[11px] italic">
                            Reviewed ({payment.status})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
