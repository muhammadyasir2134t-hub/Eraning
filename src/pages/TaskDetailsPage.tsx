import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Send,
  FileCheck
} from 'lucide-react';
import { apiRequest, formatCurrency, formatDate } from '../lib/api';
import { Task } from '../types';

interface TaskDetailsProps {
  taskId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const TaskDetailsPage: React.FC<TaskDetailsProps> = ({ taskId, onNavigate }) => {
  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [proofText, setProofText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`/api/tasks/${taskId}`);
      setTask(res.task);
    } catch (err: any) {
      setError(err.message || 'Failed to load task details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofText || proofText.trim().length < 10) {
      setError('Please provide at least 10 characters of detailed proof or completion text.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest(`/api/tasks/${taskId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ proofSubmission: proofText }),
      });

      setSuccess('Task proof submitted successfully! Your submission is now under review.');
      await loadTask();
    } catch (err: any) {
      setError(err.message || 'Failed to submit task proof.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-stone-400 animate-pulse">
        Loading task instructions...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="text-rose-400 font-semibold text-base">Task not found</div>
        <button
          onClick={() => onNavigate('tasks')}
          className="px-4 py-2 bg-stone-800 text-stone-200 text-xs font-semibold rounded-lg"
        >
          Return to Task Catalog
        </button>
      </div>
    );
  }

  const hasSubmitted = !!task.submission_id;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => onNavigate('tasks')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-stone-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Available Tasks</span>
      </button>

      {/* Task Header Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-sm bg-stone-800 text-stone-300 font-medium">
              {task.category}
            </span>
            <span className="text-xs text-stone-400 font-medium">
              Level: {task.difficulty}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-stone-500 block">Verified Reward</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              {formatCurrency(task.reward_amount)}
            </span>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-stone-50 tracking-tight">
          {task.title}
        </h2>

        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-stone-800 text-xs text-stone-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-stone-500" />
            <span>Est. Duration: <strong>{task.estimated_minutes} minutes</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-stone-500" />
            <span>Available Openings: <strong>{task.remaining_slots} / {task.total_slots}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Proof Type: <strong>{task.required_proof_type}</strong></span>
          </div>
        </div>
      </div>

      {/* Requirements & Description */}
      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wider mb-2">
            Task Overview & Background
          </h3>
          <p className="text-sm text-stone-300 leading-relaxed">
            {task.description}
          </p>
        </div>

        <div className="pt-4 border-t border-stone-800">
          <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wider mb-3">
            Step-by-Step Instructions
          </h3>
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800/80 text-xs sm:text-sm text-stone-300 whitespace-pre-line leading-relaxed font-sans">
            {task.instructions}
          </div>
        </div>
      </div>

      {/* Submission Area */}
      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wider">
          Submit Work Proof
        </h3>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {hasSubmitted ? (
          <div className="p-5 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-400">Submission Status:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                task.submission_status === 'approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                task.submission_status === 'under_review' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                task.submission_status === 'rejected' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                'bg-stone-800 text-stone-300'
              }`}>
                {task.submission_status}
              </span>
            </div>

            <div className="pt-2 border-t border-stone-800">
              <span className="text-[11px] text-stone-500 block mb-1">Your Submitted Proof:</span>
              <div className="p-3 bg-stone-900 rounded-lg text-xs text-stone-300 whitespace-pre-wrap font-mono">
                {task.proof_submission}
              </div>
            </div>

            {task.feedback && (
              <div className="pt-2 border-t border-stone-800">
                <span className="text-[11px] text-stone-500 block mb-1">Reviewer Feedback:</span>
                <p className="text-xs text-emerald-300 italic">
                  "{task.feedback}"
                </p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmitProof} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Required Proof Output / Verification Details <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="task-proof-input"
                rows={5}
                required
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="Paste the completion token, transcript correction text, test report notes, or shared evaluation document link as requested in instructions above..."
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="p-3 bg-stone-950/70 rounded-lg border border-stone-800/80 text-[11px] text-stone-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Submissions are audited by client reviewers against task quality criteria. Accurate completions credit immediately upon approval.
              </span>
            </div>

            <button
              id="submit-proof-btn"
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-700 text-stone-950 font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <span>Submitting Work...</span>
              ) : (
                <>
                  <span>Submit Task for Review</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
