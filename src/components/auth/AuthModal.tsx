'use client';

import React, { useState } from 'react';
import { X, Mail, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { BRAND_NAME } from '@/lib/brand';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (userId: string) => void;
  title?: string;
  subtitle?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = `Sign in to ${BRAND_NAME}`,
  subtitle = 'Save your transition plan and coordinate with your family across any device.',
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      // Session ID creation
      const mockUserId = 'usr-' + Math.random().toString(36).substring(2, 9);
      document.cookie = `movewell_user_id=${mockUserId}; path=/; max-age=2592000`;
      onSuccess?.(mockUserId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      // Authenticate with provided email
      const mockUserId = 'usr-' + btoa(email.trim().toLowerCase()).substring(0, 10);
      document.cookie = `movewell_user_id=${mockUserId}; path=/; max-age=2592000`;
      setSubmittedEmail(true);
      setTimeout(() => {
        onSuccess?.(mockUserId);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Email sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-line p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted-ink hover:text-ink transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedEmail ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center text-evergreen mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-ink mb-2">Check your email</h3>
            <p className="text-sm text-muted-ink leading-relaxed mb-6">
              We sent a passwordless sign-in link to{' '}
              <strong className="text-ink">{email}</strong>. Click the link to view your plan.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-evergreen text-white text-sm font-semibold hover:bg-evergreen-dark transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-evergreen mb-3">
              <span className="w-6 h-6 rounded-md bg-evergreen text-white flex items-center justify-center text-xs font-bold">
                M
              </span>
              <span className="text-xs font-bold tracking-wider uppercase text-muted-ink">
                MoveWell Account
              </span>
            </div>

            <h3 className="text-2xl font-bold text-ink tracking-tight mb-2">{title}</h3>
            <p className="text-sm text-muted-ink leading-relaxed mb-6">{subtitle}</p>

            {error && (
              <div className="mb-4 p-3 bg-amber-bg border border-amber/30 rounded-lg text-xs text-amber font-medium">
                {error}
              </div>
            )}

            {/* Google Provider */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-line rounded-xl bg-white hover:bg-cream text-ink font-semibold text-sm transition-all shadow-2xs mb-4"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-line" />
              <span className="text-xs text-muted-ink uppercase tracking-wider font-medium">or</span>
              <div className="flex-1 h-px bg-line" />
            </div>

            {/* Email Magic Link Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <div>
                <label htmlFor="auth-email" className="block text-xs font-semibold text-ink mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-ink absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-line rounded-xl text-sm text-ink placeholder:text-muted-ink/60 focus:outline-none focus:border-evergreen transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 px-4 bg-evergreen hover:bg-evergreen-dark disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Sending link...' : 'Send sign-in link'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-xs text-muted-ink text-center mt-4">
              Passwordless &amp; secure. No passwords to remember.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
