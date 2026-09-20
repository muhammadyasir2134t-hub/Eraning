import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Info, AlertTriangle, Shield, Check } from 'lucide-react';
import { apiRequest, formatDate } from '../lib/api';
import { NotificationItem } from '../types';

interface NotificationsProps {
  onNavigate: (page: string) => void;
  onRefreshCount: () => void;
}

export const NotificationsPage: React.FC<NotificationsProps> = ({ onNavigate, onRefreshCount }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/notifications');
      setNotifications(res.notifications || []);
      onRefreshCount();
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/api/notifications/mark-read', { method: 'POST', body: JSON.stringify({}) });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      onRefreshCount();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      await apiRequest('/api/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ id: notif.id }),
      });
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n));
      onRefreshCount();
    }

    if (notif.link) {
      const pageId = notif.link.replace('/', '');
      onNavigate(pageId);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-100 tracking-tight">System & Account Notifications</h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Real-time updates on task review approvals, earnings credits, and withdrawal status dispatches.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold self-start sm:self-auto flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-stone-400 animate-pulse">
          Loading alerts...
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-3">
          <Bell className="w-8 h-8 text-stone-500 mx-auto" />
          <h3 className="text-base font-semibold text-stone-200">No notifications</h3>
          <p className="text-xs text-stone-400">
            You're all caught up! New alerts regarding your submissions and payouts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isRead = n.is_read;
            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  isRead
                    ? 'bg-stone-900/60 border-stone-800/80 text-stone-300'
                    : 'bg-stone-900 border-emerald-800/50 shadow-xs text-stone-100'
                }`}
              >
                <div className="p-2 rounded-xl bg-stone-950 border border-stone-800 shrink-0 text-emerald-400">
                  {n.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                   n.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-400" /> :
                   <Info className="w-5 h-5 text-cyan-400" />}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold tracking-tight">
                      {n.title}
                    </h4>
                    <span className="text-[11px] text-stone-500 shrink-0">
                      {formatDate(n.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {n.message}
                  </p>
                </div>

                {!isRead && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
