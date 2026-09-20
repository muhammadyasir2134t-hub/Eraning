import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  ListTodo, 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  History, 
  Bell, 
  HelpCircle, 
  User, 
  Settings, 
  LogOut,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  FileText,
  Lock,
  Receipt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/api';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  unreadCount?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, unreadCount = 0, isOpen, onClose }) => {
  const { user, wallet, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Available Tasks', icon: CheckSquare },
    { id: 'my-tasks', label: 'My Submissions', icon: ListTodo },
    { id: 'earnings', label: 'Earnings Overview', icon: TrendingUp },
    { id: 'wallet', label: 'Wallet & Payouts', icon: Wallet },
    { id: 'payment-proofs', label: 'Live Payment Proofs', icon: Receipt },
    { id: 'withdraw', label: 'Request Withdrawal', icon: ArrowUpRight },
    { id: 'transactions', label: 'Transaction History', icon: History },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'settings', label: 'Account Settings', icon: Settings },
    { id: 'support', label: 'Help & Support', icon: HelpCircle },
  ];

  const secondaryItems = [
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy', icon: Lock },
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-stone-900 text-stone-200 flex flex-col border-r border-stone-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Header */}
        <div className="p-6 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNav('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-stone-950 flex items-center justify-center font-bold text-lg shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight text-stone-50 block leading-tight">WorkPoint</span>
              <span className="text-xs text-stone-400 font-normal">Verified User Portal</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="lg:hidden text-stone-400 hover:text-stone-100 p-1 rounded-md"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* User Balance Snapshot Card */}
        {user && (
          <div className="mx-4 mt-4 p-4 rounded-xl bg-stone-800/80 border border-stone-700/60">
            <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Available Balance</div>
            <div className="text-xl font-bold text-emerald-400">
              {wallet ? formatCurrency(wallet.availableBalance, wallet.currency) : '0.00 PKR'}
            </div>
            <div className="mt-2 pt-2 border-t border-stone-700/50 flex justify-between items-center text-xs text-stone-400">
              <span>Pending:</span>
              <span className="font-semibold text-amber-300">
                {wallet ? formatCurrency(wallet.pendingBalance, wallet.currency) : '0.00 PKR'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-1 text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-stone-300 hover:bg-stone-800/70 hover:text-stone-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-emerald-500 text-stone-950 text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 px-3 pb-1 text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Information
          </div>
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive 
                    ? 'bg-stone-800 text-emerald-400' 
                    : 'text-stone-400 hover:bg-stone-800/40 hover:text-stone-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-3.5 h-3.5 text-stone-500" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-3 h-3 text-stone-600" />
              </button>
            );
          })}
        </div>

        {/* Footer & Logout */}
        <div className="p-4 border-t border-stone-800 bg-stone-900/90">
          <button
            id="nav-logout-btn"
            onClick={async () => {
              await logout();
              onNavigate('landing');
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
