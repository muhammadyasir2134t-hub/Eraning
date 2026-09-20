import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, CheckSquare, ArrowRight, Tag, AlertCircle } from 'lucide-react';
import { apiRequest, formatCurrency } from '../lib/api';
import { Task } from '../types';

interface AvailableTasksProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AvailableTasksPage: React.FC<AvailableTasksProps> = ({ onNavigate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTasks();
  }, [category, difficulty]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (category !== 'All') queryParams.append('category', category);
      if (difficulty !== 'All') queryParams.append('difficulty', difficulty);
      if (search.trim()) queryParams.append('search', search.trim());

      const res = await apiRequest(`/api/tasks?${queryParams.toString()}`);
      setTasks(res.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTasks();
  };

  const categories = [
    'All',
    'Website Building & Development',
    'Article Writing & Translation',
    'Data Quality & AI Evaluation',
    'Transcription & Linguistics',
    'QA & App Testing',
    'Market Research',
    'Data Validation',
    'Proofreading & Editing',
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-100 tracking-tight">Available Earning Tasks</h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Choose from client-verified tasks. Complete according to requirements to receive direct wallet rewards.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="tasks-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by title, keywords or requirements..."
              className="w-full pl-9 pr-3.5 py-2 bg-stone-950 border border-stone-700 rounded-lg text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-800/80">
          <span className="text-xs font-semibold text-stone-400 mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Category:</span>
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="p-12 text-center text-sm text-stone-400 animate-pulse">
          Loading available tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-stone-500 mx-auto" />
          <h3 className="text-base font-semibold text-stone-200">No matching tasks found</h3>
          <p className="text-xs text-stone-400">
            Try adjusting your category filters or search query to see other active assignments.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tasks.map((task) => {
            const hasSubmitted = !!task.user_submission_status;
            return (
              <div
                key={task.id}
                className="p-6 rounded-2xl bg-stone-900 border border-stone-800 hover:border-stone-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-sm bg-stone-800 text-stone-300">
                      {task.category}
                    </span>
                    <span className="text-xs font-bold text-stone-400">
                      {task.difficulty}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-100 tracking-tight">
                    {task.title}
                  </h3>

                  <p className="text-xs text-stone-400 line-clamp-3 leading-relaxed">
                    {task.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] text-stone-500">Reward per completion</div>
                    <div className="text-lg font-extrabold text-emerald-400">
                      {formatCurrency(task.reward_amount)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-[11px] text-stone-500">Time estimate</div>
                      <div className="text-xs font-medium text-stone-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{task.estimated_minutes} mins</span>
                      </div>
                    </div>

                    <button
                      id={`view-task-${task.id}`}
                      onClick={() => onNavigate('task-details', { taskId: task.id })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                        hasSubmitted
                          ? 'bg-stone-800 text-amber-300 border border-stone-700'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950'
                      }`}
                    >
                      {hasSubmitted ? (
                        <span>Status: {task.user_submission_status}</span>
                      ) : (
                        <>
                          <span>View & Start</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
