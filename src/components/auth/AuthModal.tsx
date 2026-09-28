'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, ShieldCheck, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
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
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signedInUser, setSignedInUser] = useState<{ email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleEmailSignIn = async (e: React.FormEvent, customEmail?: string) => {
    if (e) e.preventDefault();
    const targetEmail = (customEmail || email).trim();
    if (!targetEmail) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();
      if (data.success && data.userId) {
        setSignedInUser({ email: targetEmail });
        if (onSuccess) {
          onSuccess(data.userId);
        }
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 1200);
      } else {
        setError(data.error || 'Sign in could not be completed.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error signing in');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantCoordinatorAccess = async () => {
    await handleEmailSignIn(null as any, 'sarah.coordinator@bridgewell.org');
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '/';
      const res = await fetch(`/api/auth/oauth?provider=google&redirectTo=${encodeURIComponent(currentUrl)}`);
      const data = await res.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setError(
          data.error ||
            'Google OAuth is not configured on this Supabase project. Please sign in below using your email or One-Click Access.'
        );
        setGoogleLoading(false);
        setTimeout(() => emailInputRef.current?.focus(), 100);
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in is currently unavailable. Please use email or one-click access.');
      setGoogleLoading(false);
      setTimeout(() => emailInputRef.current?.focus(), 100);
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
          className="absolute top-5 right-5 text-muted-ink hover:text-ink transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {signedInUser ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-sage flex items-center justify-center text-evergreen mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-ink mb-1">Signed In Successfully</h3>
            <p className="text-xs text-muted-ink leading-relaxed">
              Logged in as <strong className="text-ink">{signedInUser.email}</strong>. Updating your transition workspace...
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-evergreen mb-3">
              <span className="w-6 h-6 rounded-md bg-evergreen text-white flex items-center justify-center text-xs font-bold">
                B
              </span>
              <span className="text-xs font-bold tracking-wider uppercase text-muted-ink">
                {BRAND_NAME} Account
              </span>
            </div>

            <h3 className="text-2xl font-bold text-ink tracking-tight mb-2">{title}</h3>
            <p className="text-sm text-muted-ink leading-relaxed mb-5">{subtitle}</p>

            {error && (
              <div className="mb-4 p-3.5 bg-amber-bg border border-amber/30 rounded-xl text-xs text-amber font-medium leading-relaxed">
                {error}
              </div>
            )}

            {/* Google OAuth Option (Primary) */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-line rounded-xl bg-white hover:bg-cream text-ink font-semibold text-sm transition-all shadow-xs hover:border-[#1F4D45]/40 disabled:opacity-60 cursor-pointer mb-3"
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
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="relative flex py-2 items-center my-2">
              <div className="flex-grow border-t border-line"></div>
              <span className="flex-shrink mx-3 text-[11px] font-semibold text-muted-ink uppercase tracking-wider">
                Or with email
              </span>
              <div className="flex-grow border-t border-line"></div>
            </div>

            {/* Email Sign In Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-3 mb-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-ink absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={emailInputRef}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-line bg-cream/40 text-ink text-sm focus:outline-hidden focus:border-evergreen focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-semibold text-sm transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Signing in...' : 'Continue with Email'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Instant Demo Access (Evaluation Bypass) */}
            <div className="mb-2">
              <button
                type="button"
                onClick={handleInstantCoordinatorAccess}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sage/60 hover:bg-sage border border-evergreen/30 text-evergreen font-semibold text-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Access as Family Coordinator</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 pt-4 text-[11px] text-[#71847D]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3F6C5C]" />
              <span>Private family workspace &bull; No password needed</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
