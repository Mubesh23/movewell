'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';
import { AuthModal } from '@/components/auth/AuthModal';
import { Users, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function InviteAcceptancePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    async function checkToken() {
      if (!token) return;
      try {
        const res = await fetch(`/api/invitations/${token}`);
        const data = await res.json();
        if (data.success && data.data) {
          setInvitation(data.data);
        } else {
          setError(data.error || 'This invitation link is invalid or has expired.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to verify invitation link.');
      } finally {
        setLoading(false);
      }
    }
    checkToken();
  }, [token]);

  const handleAccept = async (userId?: string) => {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.status === 401 || data.code === 'AUTH_REQUIRED') {
        setIsAuthOpen(true);
        setAccepting(false);
        return;
      }
      if (data.success && data.caseId) {
        router.push(`/plan/${data.caseId}`);
      } else {
        setError(data.error || 'Failed to accept invitation');
        setAccepting(false);
      }
    } catch (err: any) {
      setError(err.message || 'Network error while accepting invitation');
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFAF7] flex flex-col justify-between text-[#183331]">
      <header className="px-6 py-5 border-b border-[#E3E9E5] bg-white/80 backdrop-blur-xs flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-[#1F4D45]">
          <span className="w-7 h-7 rounded-lg bg-[#1F4D45] text-white flex items-center justify-center text-xs font-bold">
            B
          </span>
          <span>{BRAND_NAME}</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E3E9E5] shadow-lg p-6 sm:p-8 text-center">
          {loading ? (
            <div className="py-12 space-y-4">
              <div className="w-10 h-10 border-3 border-[#1F4D45] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-[#667572]">Verifying invitation link...</p>
            </div>
          ) : error ? (
            <div className="py-8 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#FDF2EC] text-[#C86F4A] flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-[#183331]">Invitation Unavailable</h1>
              <p className="text-sm text-[#667572] max-w-sm mx-auto leading-relaxed">{error}</p>
              <div className="pt-4">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#1F4D45] text-white text-sm font-semibold hover:bg-[#163D37] transition-colors"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          ) : invitation ? (
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-[#E7F0E9] text-[#1F4D45] flex items-center justify-center mx-auto shadow-2xs">
                <Users className="w-7 h-7" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#667572] block mb-1">
                  Care Circle Invitation
                </span>
                <h1 className="text-2xl font-bold text-[#183331] tracking-tight">
                  Join {invitation.seniorName}&apos;s Care Circle
                </h1>
                <p className="text-sm text-[#667572] mt-2 leading-relaxed">
                  You were invited as{' '}
                  <strong className="text-[#183331]">
                    {invitation.relationship || invitation.role}
                  </strong>{' '}
                  to coordinate and assist with {invitation.seniorName}&apos;s upcoming discharge.
                </p>
              </div>

              {searchParams?.get('mismatch') === 'true' && (
                <div className="p-4 rounded-xl bg-amber-bg border border-amber/30 text-xs text-amber font-medium text-left leading-relaxed">
                  <p className="font-bold text-ink mb-1">Account Email Mismatch</p>
                  This invitation was sent to <strong>{searchParams.get('invited')}</strong>. You&apos;re currently signed in as <strong>{searchParams.get('current')}</strong>. Please sign in using the invited Google account to accept.
                </div>
              )}

              <div className="p-4 rounded-xl bg-[#F7F8F5] border border-[#E3E9E5] text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#667572]">Invited Member:</span>
                  <span className="font-semibold text-[#183331]">{invitation.recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667572]">Role:</span>
                  <span className="font-semibold text-[#183331]">{invitation.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667572]">Security:</span>
                  <span className="font-medium text-[#1F4D45] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Single-use verified link
                  </span>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => handleAccept()}
                isLoading={accepting}
                className="w-full py-3 bg-[#1F4D45] hover:bg-[#163D37] text-white font-semibold text-sm rounded-xl shadow-xs"
              >
                <span>Accept &amp; Open Transition Plan</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>

              <p className="text-[11px] text-[#667572]">
                By joining, you will have access to view and update tasks assigned to you on the transition plan.
              </p>
            </div>
          ) : null}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[#667572] border-t border-[#E3E9E5]">
        &copy; {new Date().getFullYear()} {BRAND_NAME}. Private family coordination.
      </footer>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        intent="accept_invite"
        token={token}
        title={`Sign in to join ${invitation?.seniorName || 'Care Circle'}`}
        subtitle="Continue with Google to verify your identity and join this family care circle."
      />
    </div>
  );
}
