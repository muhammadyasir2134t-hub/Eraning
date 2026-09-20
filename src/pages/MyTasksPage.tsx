import React, { useState, useEffect } from 'react';
import { ListTodo, CheckCircle2, Clock, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { apiRequest, formatCurrency, formatDate } from '../lib/api';
import { TaskSubmission } from '../types';

interface MyTasksProps {
  onNavigate: (page: string, params?: any) => void;
}

export const MyTasksPage: React.FC<MyTasksProps> = ({ onNavigate }) => {
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadSubmissions();
  }, [statusFilter]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'All' ? '/api/my-tasks' : `/api/my-tasks?status=${statusFilter}`;
      const res = await apiRequest(url);
      setSubmissions(res.submissions || []);
    } catch (err) {
      console.error('Failed to load user submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filters = ['All', 'under_review', 'approved', 'rejected', 'paid'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-100 tracking-tight">My Task Submissions</h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Track real-time audit statuses, reviewer notes, and credited rewards.
          </p>
        </div>

        <button
          onClick={() => onNavigate('tasks')}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          Find More Tasks
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              statusFilter === filter
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            {filter.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="p-12 text-center text-sm text-stone-400 animate-pulse">
          Loading submission history...
        </div>
      ) : submissions.length === 0 ? (
        <div className="p-12 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-3">
          <ListTodo className="w-8 h-8 text-stone-500 mx-auto" />
          <h3 className="text-base font-semibold text-stone-200">No submissions found</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            You haven't submitted any tasks under this filter yet. Browse available tasks to start earning.
          </p>
          <button
            onClick={() => onNavigate('tasks')}
            className="mt-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold"
          >
            Browse Available Tasks
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const isApproved = sub.status === 'approved' || sub.status === 'paid';
            const isReview = sub.status === 'under_review' || sub.status === 'submitted';
            const isRejected = sub.status === 'rejected';

            return (
              <div
                key={sub.id}
                className="p-5 sm:p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-stone-400">
                      {sub.task_category} • Submitted on {formatDate(sub.submitted_at)}
                    </span>
                    <h3 className="text-base font-bold text-stone-100">
                      {sub.task_title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isApproved ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      isReview ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      isRejected ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      'bg-stone-800 text-stone-300'
                    }`}>
                      {sub.status.replace('_', ' ')}
                    </span>

                    <span className="text-base font-extrabold text-emerald-400">
                      {formatCurrency(sub.reward_amount)}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800/80 text-xs text-stone-300 font-mono">
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-sans mb-0.5">
                    Your Submitted Output:
                  </span>
                  {sub.proof_submission}
                </div>

                {sub.feedback && (
                  <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 text-xs text-stone-300">
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider block mb-0.5">
                      Auditor Feedback:
                    </span>
                    <span className="italic text-emerald-300">"{sub.feedback}"</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
