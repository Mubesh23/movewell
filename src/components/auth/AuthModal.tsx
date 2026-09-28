'use client';

import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
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
  title = `Sign in to ${BRAND_NAME}`,
  subtitle = 'Sign in or create your BridgeWell account to save your transition plan and coordinate with your family across any device.',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '/';
      const res = await fetch(`/api/auth/oauth?provider=google&redirectTo=${encodeURIComponent(currentUrl)}`);
      const data = await res.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Google sign-in could not be initiated.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
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

        <div className="flex items-center gap-2 text-evergreen mb-3">
          <span className="w-6 h-6 rounded-md bg-evergreen text-white flex items-center justify-center text-xs font-bold">
            B
          </span>
          <span className="text-xs font-bold tracking-wider uppercase text-muted-ink">
            {BRAND_NAME} Account
          </span>
        </div>

        <h3 className="text-2xl font-bold text-ink tracking-tight mb-2">{title}</h3>
        <p className="text-sm text-muted-ink leading-relaxed mb-6">{subtitle}</p>

        {error && (
          <div className="mb-5 p-3.5 bg-amber-bg border border-amber/30 rounded-xl text-xs text-amber font-medium leading-relaxed">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="rounded-xl bg-[#F4F7F5] border border-[#E1EAE3] p-4 text-xs text-[#4F635B] leading-relaxed">
            <strong className="block text-[#183331] font-semibold mb-1">
              One account for your whole transition
            </strong>
            Sign in or create your {BRAND_NAME} account to start this plan, invite your family care circle, and keep everyone aligned.
          </div>

          {/* Google Auth Button: Handles both sign in and account creation */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-line rounded-xl bg-white hover:bg-cream text-ink font-semibold text-sm transition-all shadow-xs hover:border-[#1F4D45]/40 disabled:opacity-60 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>{loading ? 'Connecting with Google...' : 'Continue with Google'}</span>
          </button>

          <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-[#71847D]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3F6C5C]" />
            <span>Private family workspace &bull; No password needed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
