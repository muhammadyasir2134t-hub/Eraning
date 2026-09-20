import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageSquare, Plus, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { apiRequest, formatDate } from '../lib/api';
import { SupportTicket } from '../types';

export const HelpSupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'Task Submission Inquiry',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/support-tickets');
      setTickets(res.tickets || []);
    } catch (err) {
      console.error('Failed to load support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest('/api/support-tickets', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setSuccess('Support ticket created successfully. Our team will review your inquiry shortly.');
      setShowNewTicket(false);
      setFormData({
        subject: '',
        category: 'Task Submission Inquiry',
        priority: 'Medium',
        message: '',
      });
      await loadTickets();
    } catch (err: any) {
      setError(err.message || 'Failed to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'How long does task review and reward crediting take?',
      a: 'Client auditors evaluate submissions within 12 to 24 hours. Once your submitted proof is confirmed accurate, your reward credits immediately to your Available Balance.'
    },
    {
      q: 'What are the minimum withdrawal requirements?',
      a: 'The minimum withdrawal threshold is PKR 500.00. Payouts can be requested at any time to Easypaisa, JazzCash, or Pakistani Bank Accounts with 0% platform service fee.'
    },
    {
      q: 'Do I need to pay any membership or activation fee?',
      a: 'No. WorkPoint is strictly free for task performers. We never require activation packages, VIP tiers, or upfront deposits.'
    },
    {
      q: 'Are there mandatory referral quotas to withdraw earnings?',
      a: 'Absolutely not. You can complete tasks, earn rewards, and withdraw 100% of your earnings without ever referring anyone.'
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-100 tracking-tight">Help, Knowledge Base & Support</h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Browse answers to common questions or submit an official support ticket to our assistance desk.
          </p>
        </div>

        <button
          id="new-ticket-btn"
          onClick={() => setShowNewTicket(!showNewTicket)}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-xs transition-colors self-start sm:self-auto flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{showNewTicket ? 'Close Ticket Form' : 'Open New Ticket'}</span>
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Ticket Creation Modal / Form */}
      {showNewTicket && (
        <form onSubmit={handleTicketSubmit} className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
          <h3 className="text-base font-bold text-stone-100">Submit an Official Help Ticket</h3>

          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Inquiry Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="Task Submission Inquiry">Task Submission & Audit</option>
                <option value="Withdrawal & Payout">Withdrawal & Payout</option>
                <option value="Account & KYC">Account & Profile Verification</option>
                <option value="Technical Issue">Technical & Bug Report</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="Low">Low (General guidance)</option>
                <option value="Medium">Medium (Normal inquiry)</option>
                <option value="High">High (Payment or submission issue)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Subject Line
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g. Question regarding Task #881 audio transcription guidelines"
              className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Detailed Description
            </label>
            <textarea
              rows={4}
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Please explain the issue or question thoroughly. Include any relevant task IDs or payment references..."
              className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowNewTicket(false)}
              className="px-4 py-2 bg-stone-800 text-stone-300 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold rounded-lg"
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      )}

      {/* Frequently Asked Questions */}
      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          <span>Frequently Asked Questions</span>
        </h3>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-stone-950 border border-stone-800/80 cursor-pointer"
                onClick={() => setExpandedFaq(isExpanded ? null : idx)}
              >
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-stone-200">
                  <span>{faq.q}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
                </div>
                {isExpanded && (
                  <p className="mt-3 text-xs text-stone-400 leading-relaxed pt-2 border-t border-stone-800/60">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Your Support Tickets History */}
      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-400" />
          <span>Your Support Ticket History</span>
        </h3>

        {loading ? (
          <div className="p-8 text-center text-xs text-stone-400">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-400">
            No support tickets submitted yet. If you ever need help, feel free to open one above.
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => {
              let parsedReplies: any[] = [];
              try {
                parsedReplies = JSON.parse(t.replies);
              } catch (e) {}

              return (
                <div key={t.id} className="p-5 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono text-stone-400">
                        {t.ticket_number} • {t.category} • {formatDate(t.created_at)}
                      </span>
                      <h4 className="text-sm font-bold text-stone-100">{t.subject}</h4>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold self-start sm:self-auto capitalize ${
                      t.status === 'answered' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      t.status === 'open' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-stone-800 text-stone-300'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  {parsedReplies.length > 0 && (
                    <div className="pt-3 border-t border-stone-800/80 space-y-2">
                      <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Conversation:</span>
                      {parsedReplies.map((r, rIdx) => (
                        <div key={rIdx} className={`p-3 rounded-lg text-xs ${
                          r.sender === 'User' ? 'bg-stone-900 border border-stone-800 text-stone-300' : 'bg-emerald-950/30 border border-emerald-800/40 text-emerald-200'
                        }`}>
                          <span className="font-bold text-[11px] block text-stone-400 mb-0.5">{r.sender}:</span>
                          <span>{r.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
