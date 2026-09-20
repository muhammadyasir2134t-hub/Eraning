import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { apiRequest } from './lib/api';

// Public & Auth Flow Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { OtpVerificationPage as PasswordResetOtpPage } from './pages/OtpVerificationPage';
import { VerificationPage } from './pages/VerificationPage';
import { UserProfileSetupPage } from './pages/UserProfileSetupPage';

// Authenticated User Panel Pages
import { UserDashboardPage } from './pages/UserDashboardPage';
import { AvailableTasksPage } from './pages/AvailableTasksPage';
import { TaskDetailsPage } from './pages/TaskDetailsPage';
import { MyTasksPage } from './pages/MyTasksPage';
import { EarningsDashboardPage } from './pages/EarningsDashboardPage';
import { WalletPage } from './pages/WalletPage';
import { WithdrawalRequestPage } from './pages/WithdrawalRequestPage';
import { WithdrawalsListPage } from './pages/WithdrawalsListPage';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { HelpSupportPage } from './pages/HelpSupportPage';
import { AccountSettingsPage } from './pages/AccountSettingsPage';
import { TermsConditionsPage, PrivacyPolicyPage } from './pages/LegalPages';
import { LivePaymentProofsPage } from './pages/LivePaymentProofsPage';
import { ActivationPaymentPage } from './pages/ActivationPaymentPage';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [pageParams, setPageParams] = useState<any>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // When user logs in, set default initial page appropriately
  useEffect(() => {
    if (user) {
      if (user.role !== 'admin' && user.paymentStatus !== 'approved') {
        setCurrentPage('activation-payment');
      } else if (!user.isVerified) {
        setCurrentPage('verify');
      } else if (!user.profileCompleted && currentPage === 'landing') {
        setCurrentPage('profile-setup');
      } else if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'register') {
        setCurrentPage('dashboard');
      }
    }
  }, [user?.id, user?.isVerified, user?.paymentStatus, user?.role]);

  // Poll or fetch unread notifications count when user is logged in
  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await apiRequest('/api/notifications');
      const unread = (res.notifications || []).filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (e) {
      // ignore silently
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleNavigate = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-stone-400 font-medium">Securing WorkPoint session...</span>
        </div>
      </div>
    );
  }

  // 1. If user is NOT authenticated: public pages and authentication flows
  if (!user) {
    switch (currentPage) {
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'register':
        return <RegisterPage onNavigate={handleNavigate} />;
      case 'forgot-password':
        return <ForgotPasswordPage onNavigate={handleNavigate} />;
      case 'reset-password':
        return <PasswordResetOtpPage onNavigate={handleNavigate} navigationParams={pageParams} />;
      case 'verify':
      case 'otp-verification':
        return <VerificationPage onNavigate={handleNavigate} navigationParams={pageParams} />;
      case 'payment-proofs':
        return (
          <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
            <header className="border-b border-stone-800 bg-stone-900/80 px-6 py-4 flex items-center justify-between">
              <button onClick={() => handleNavigate('landing')} className="text-emerald-400 font-bold text-lg">
                WorkPoint
              </button>
              <div className="flex items-center gap-3">
                <button onClick={() => handleNavigate('login')} className="text-xs text-stone-300 hover:text-white">
                  Sign In
                </button>
                <button onClick={() => handleNavigate('register')} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-stone-950 font-bold text-xs">
                  Register Free
                </button>
              </div>
            </header>
            <div className="flex-1">
              <LivePaymentProofsPage onNavigate={handleNavigate} />
            </div>
          </div>
        );
      case 'terms':
        return (
          <div className="min-h-screen bg-stone-950 text-stone-100">
            <TermsConditionsPage onNavigate={() => handleNavigate('landing')} />
          </div>
        );
      case 'privacy':
        return (
          <div className="min-h-screen bg-stone-950 text-stone-100">
            <PrivacyPolicyPage onNavigate={() => handleNavigate('landing')} />
          </div>
        );
      case 'landing':
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  }

  // 2. Protected flow: If user IS authenticated but NOT verified, enforce FREE Verification step
  if (!user.isVerified) {
    if (currentPage === 'terms') {
      return (
        <div className="min-h-screen bg-stone-950 text-stone-100">
          <TermsConditionsPage onNavigate={() => handleNavigate('verify')} />
        </div>
      );
    }
    if (currentPage === 'privacy') {
      return (
        <div className="min-h-screen bg-stone-950 text-stone-100">
          <PrivacyPolicyPage onNavigate={() => handleNavigate('verify')} />
        </div>
      );
    }
    return <VerificationPage onNavigate={handleNavigate} navigationParams={{ email: user.email, ...pageParams }} />;
  }

  // 3. Post-Verification Profile Setup (Step between Free Verification and User Dashboard)
  if (currentPage === 'profile-setup') {
    return <UserProfileSetupPage onNavigate={handleNavigate} />;
  }

  // 4. Mandatory Plan Payment Activation Gate:
  // Any user logging in must pay plan amount first, and admin must approve before accessing dashboard
  const isPaid = user.paymentStatus === 'approved';

  if (!isPaid || currentPage === 'activation-payment') {
    if (currentPage === 'terms') {
      return (
        <div className="min-h-screen bg-stone-950 text-stone-100">
          <TermsConditionsPage onNavigate={() => handleNavigate(isPaid ? 'dashboard' : 'activation-payment')} />
        </div>
      );
    }
    if (currentPage === 'privacy') {
      return (
        <div className="min-h-screen bg-stone-950 text-stone-100">
          <PrivacyPolicyPage onNavigate={() => handleNavigate(isPaid ? 'dashboard' : 'activation-payment')} />
        </div>
      );
    }
    return <ActivationPaymentPage onNavigate={handleNavigate} />;
  }

  // 5. Authenticated & Verified & Approved User Panel (Dashboard, Tasks, Wallet, Withdrawals, Profile)
  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Performer Dashboard';
      case 'activation-payment':
        return 'Account Activation & 1500 PKR Gate';
      case 'tasks':
        return 'Available Tasks';
      case 'task-details':
        return 'Task Specifications & Proof Submission';
      case 'my-tasks':
        return 'My Task Submissions';
      case 'earnings':
        return 'Earnings Analytics & Audits';
      case 'wallet':
        return 'Digital Wallet & Balances';
      case 'payment-proofs':
        return 'Real-Time Live Payment Proofs';
      case 'withdraw':
        return 'Request Funds Withdrawal';
      case 'withdrawals':
        return 'Withdrawal Requests History';
      case 'transactions':
        return 'Financial Ledger History';
      case 'notifications':
        return 'System & Activity Notifications';
      case 'profile':
        return 'User Profile & Identity';
      case 'settings':
        return 'Security & Account Settings';
      case 'support':
        return 'Help Desk & Support Tickets';
      case 'terms':
        return 'Terms of Service';
      case 'privacy':
        return 'Privacy Policy';
      default:
        return 'WorkPoint User Panel';
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <UserDashboardPage onNavigate={handleNavigate} />;
      case 'activation-payment':
        return <ActivationPaymentPage onNavigate={handleNavigate} />;
      case 'tasks':
        return <AvailableTasksPage onNavigate={handleNavigate} />;
      case 'task-details':
        return <TaskDetailsPage taskId={pageParams?.taskId} onNavigate={handleNavigate} />;
      case 'my-tasks':
        return <MyTasksPage onNavigate={handleNavigate} />;
      case 'earnings':
        return <EarningsDashboardPage onNavigate={handleNavigate} />;
      case 'wallet':
        return <WalletPage onNavigate={handleNavigate} />;
      case 'payment-proofs':
        return <LivePaymentProofsPage onNavigate={handleNavigate} />;
      case 'withdraw':
        return <WithdrawalRequestPage onNavigate={handleNavigate} />;
      case 'withdrawals':
        return <WithdrawalsListPage onNavigate={handleNavigate} />;
      case 'transactions':
        return <TransactionHistoryPage />;
      case 'notifications':
        return <NotificationsPage onNavigate={handleNavigate} onRefreshCount={fetchUnreadCount} />;
      case 'profile':
        return <UserProfilePage />;
      case 'settings':
        return <AccountSettingsPage />;
      case 'support':
        return <HelpSupportPage />;
      case 'terms':
        return <TermsConditionsPage onNavigate={handleNavigate} />;
      case 'privacy':
        return <PrivacyPolicyPage onNavigate={handleNavigate} />;
      default:
        return <UserDashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        unreadCount={unreadCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72 flex flex-col flex-1">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNavigate={handleNavigate}
          unreadCount={unreadCount}
          title={getPageTitle()}
        />

        <main className="flex-1 pb-16">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
