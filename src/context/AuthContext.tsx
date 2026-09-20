import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Profile, Wallet } from '../types';
import { apiRequest } from '../lib/api';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  wallet: Wallet | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  markUserVerified: () => void;
  markProfileCompleted: () => void;
  markPaymentSubmitted: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async (currentToken: string) => {
    try {
      const data = await apiRequest('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      const rawUser = data.user || {};
      setUser({
        id: rawUser.id?.toString(),
        fullName: rawUser.fullName || rawUser.full_name || 'User',
        email: rawUser.email,
        mobileNumber: rawUser.mobileNumber || rawUser.mobile_number || '',
        referralCode: rawUser.referralCode || rawUser.referral_code || '',
        role: rawUser.role || 'performer',
        isVerified: !!(rawUser.isVerified ?? rawUser.is_verified),
        paymentStatus: rawUser.paymentStatus || rawUser.payment_status || 'unpaid',
        profileCompleted: data.profileCompleted,
        createdAt: rawUser.createdAt || rawUser.created_at,
      });
      setProfile(data.profile || null);
      if (data.wallet) {
        setWallet({
          id: data.wallet.id?.toString(),
          userId: data.wallet.user_id?.toString(),
          availableBalance: data.wallet.available_balance,
          pendingBalance: data.wallet.pending_balance,
          totalEarned: data.wallet.total_earned,
          totalWithdrawn: data.wallet.total_withdrawn,
          currency: data.wallet.currency,
        });
      }
    } catch (err) {
      console.error('Failed to load user profile session:', err);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    fetchCurrentUser(newToken);
  };

  const markUserVerified = () => {
    setUser((prev) => prev ? { ...prev, isVerified: true } : null);
    if (token) {
      fetchCurrentUser(token);
    }
  };

  const markProfileCompleted = () => {
    setUser((prev) => prev ? { ...prev, profileCompleted: true } : null);
    if (token) {
      fetchCurrentUser(token);
    }
  };

  const markPaymentSubmitted = () => {
    setUser((prev) => prev ? { ...prev, paymentStatus: 'pending' } : null);
    if (token) {
      fetchCurrentUser(token);
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setProfile(null);
      setWallet(null);
    }
  };

  const refreshUserData = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      wallet,
      token,
      isLoading,
      login,
      logout,
      markUserVerified,
      markProfileCompleted,
      markPaymentSubmitted,
      refreshUserData,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
