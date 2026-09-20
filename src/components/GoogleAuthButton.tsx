import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, HelpCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (notification?: any) => void;
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  onSuccess: (data: { user: any; token: string; isNewUser?: boolean; demoOtp?: string }) => void;
  onError?: (error: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  className?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  text = 'continue_with',
  className = '',
}) => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Read Google Client ID from environment variables
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const handleCredentialResponse = async (response: any) => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          credential: response.credential,
        }),
      });

      login(res.token, res.user);
      onSuccess(res);
    } catch (err: any) {
      console.error('Google authentication failed:', err);
      const errMsg = err.message || 'Failed to authenticate with Google.';
      if (onError) onError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If Google GSI library is loaded and client ID exists, render official Google button
    if (clientId && window.google?.accounts?.id && googleBtnContainerRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          logo_alignment: 'left',
          width: '100%',
        });
      } catch (err) {
        console.warn('Google GSI initialization notice:', err);
      }
    }
  }, [clientId]);

  // Handler for custom button click (or when client ID is being configured)
  const handleCustomClick = async () => {
    if (clientId && window.google?.accounts?.id) {
      // Trigger Google prompt if available
      window.google.accounts.id.prompt();
      return;
    }

    // If client ID is not configured in .env yet, show informational guide
    setShowConfigModal(true);
  };

  const handleDevSandboxGoogleLogin = async () => {
    setLoading(true);
    setShowConfigModal(false);
    try {
      // Simulate real OAuth payload with Google verified metadata
      const res = await apiRequest('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          userInfo: {
            email: 'google.performer@gmail.com',
            name: 'Google Verified User',
            sub: 'g_oauth_' + Math.random().toString(36).substring(2, 10),
            picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          }
        }),
      });

      login(res.token, res.user);
      onSuccess(res);
    } catch (err: any) {
      if (onError) onError(err.message || 'Google authentication test failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`w-full ${className}`}>
        {clientId && (
          <div ref={googleBtnContainerRef} className="w-full flex justify-center mb-1" />
        )}

        {(!clientId || !window.google?.accounts?.id) && (
          <button
            type="button"
            id="google-signin-btn"
            onClick={handleCustomClick}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-semibold text-xs transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>
              {text === 'signup_with'
                ? 'Sign up with Google'
                : text === 'signin_with'
                ? 'Sign in with Google'
                : 'Continue with Google'}
            </span>
          </button>
        )}
      </div>

      {/* Google OAuth Configuration & Guidance Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-stone-100">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-100">Google OAuth 2.0 Setup</h3>
                <p className="text-xs text-stone-400">Environment variable configuration</p>
              </div>
            </div>

            <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-300 space-y-2">
              <p>
                To enable live Google OAuth sign-in, configure your Google Web Client ID in <code className="text-emerald-400 font-mono">.env.example</code>:
              </p>
              <div className="p-2 bg-stone-900 rounded font-mono text-[11px] text-stone-300 select-all">
                VITE_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
              </div>
              <p className="text-[11px] text-stone-400">
                Authorized JavaScript origins must include this app's domain.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                id="dev-google-test-btn"
                onClick={handleDevSandboxGoogleLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Test Google OAuth Flow (Sandbox)</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="w-full py-2 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-xs transition-colors cursor-pointer"
              >
                Close & Use Email/Mobile Login
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
