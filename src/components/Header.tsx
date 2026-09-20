import React from 'react';
import { Menu, Bell, User, ArrowUpRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/api';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigate: (page: string) => void;
  unreadCount?: number;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onNavigate, unreadCount = 0, title }) => {
  const { user, wallet } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-stone-300 hover:text-white rounded-lg hover:bg-stone-800 focus:outline-hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg lg:text-xl font-semibold text-stone-50 tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3 lg:gap-5">
        {/* Quick action: Withdraw */}
        {wallet && (
          <button
            id="header-withdraw-btn"
            onClick={() => onNavigate('withdraw')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Withdraw</span>
          </button>
        )}

        {/* RBSC Protocol / Role Badge Button */}
        <button
          id="header-rbac-btn"
          onClick={() => onNavigate('rbac-protocol')}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="capitalize">{user?.role || 'Performer'}</span>
        </button>

        {/* Notifications Icon Button */}
        <button
          id="header-notifs-btn"
          onClick={() => onNavigate('notifications')}
          className="relative p-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-stone-900" />
          )}
        </button>

        {/* Profile Avatar / Link */}
        <button
          id="header-profile-btn"
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-2.5 pl-2 py-1 text-left rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'M'}
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-semibold text-stone-200 leading-tight">
              {user?.fullName || 'Muhammad Yasir'}
            </div>
            <div className="text-[10px] text-stone-400 capitalize">
              {user?.role === 'admin' ? 'Platform Administrator' : user?.role === 'manager' ? 'Quality Manager' : 'Verified Performer'}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
