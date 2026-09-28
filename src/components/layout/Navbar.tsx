'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Printer, Home, MessageSquare, ChevronDown, User, LogOut, LayoutGrid, Plus } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { openNora } from '@/components/assistant/AIAssistant';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { BRAND_NAME } from '@/lib/brand';

interface NavbarProps {
  caseId?: string;
  draftId?: string;
  seniorName?: string;
  familyName?: string;
  daysUntilDischarge?: number;
}

interface AuthUserState {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  caseId,
  draftId,
  seniorName = 'Transition Plan',
  familyName,
  daysUntilDischarge,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUserState | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          const u = data.user;
          const name =
            u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            u.email?.split('@')[0] ||
            'Family Coordinator';
          const avatarUrl = u.user_metadata?.avatar_url || u.user_metadata?.picture;
          setAuthUser({
            id: u.id,
            email: u.email,
            name,
            avatarUrl,
          });
        } else {
          setAuthUser(null);
        }
      });
    }
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    const supabase = createBrowserSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setAuthUser(null);
    window.location.href = '/';
  };

  const caseNavLinks = [
    { href: `/plan/${caseId}`, label: 'Today' },
    { href: `/plan/${caseId}/tasks`, label: 'Plan' },
    { href: `/plan/${caseId}/family`, label: 'Family' },
    { href: `/plan/${caseId}/budget`, label: 'Budget' },
    { href: `/plan/${caseId}/resources`, label: 'Resources' },
  ];

  const userInitial = authUser?.name ? authUser.name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-xs border-b border-line transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand + Context */}
            <div className="flex items-center gap-4">
              <Link href={authUser ? '/home' : '/'} className="flex items-center gap-2.5 group">
                <span className="w-8 h-8 rounded-lg bg-evergreen text-white font-bold text-sm flex items-center justify-center tracking-tight shadow-xs group-hover:bg-evergreen-dark transition-colors">
                  <Home className="w-4 h-4" />
                </span>
                <span className="text-xl font-semibold text-ink tracking-[-0.04em]">
                  {BRAND_NAME}
                </span>
              </Link>

              {caseId && (
                <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-line text-xs">
                  <span className="text-[#667572] font-medium">Family workspace &mdash;</span>
                  <span className="font-bold text-ink flex items-center gap-1">
                    {familyName ? `The ${familyName} family / ` : ''}{seniorName}&apos;s transition
                  </span>
                  {daysUntilDischarge !== undefined && (
                    <>
                      <span className="text-line" aria-hidden="true">&bull;</span>
                      <span className="text-amber font-semibold">
                        {daysUntilDischarge}d to discharge
                      </span>
                    </>
                  )}
                </div>
              )}

              {draftId && !caseId && (
                <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-line text-xs">
                  <span className="font-semibold text-ink">
                    {seniorName}&apos;s draft proposal
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-bg text-amber text-[10px] font-bold">
                    Draft
                  </span>
                </div>
              )}
            </div>

            {/* Center / Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              {caseId ? (
                caseNavLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'px-3.5 py-1.5 text-sm transition-colors relative font-medium',
                        isActive
                          ? 'text-evergreen font-semibold after:absolute after:bottom-[-17px] after:left-3 after:right-3 after:h-0.5 after:bg-evergreen'
                          : 'text-muted-ink hover:text-ink'
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })
              ) : draftId ? null : (
                <div className="flex items-center gap-8">
                  <a
                    href="/#how-it-works"
                    className="text-sm font-medium text-muted-ink hover:text-ink transition-colors"
                  >
                    How it works
                  </a>
                  <a
                    href="/#for-families"
                    className="text-sm font-medium text-muted-ink hover:text-ink transition-colors"
                  >
                    For families
                  </a>
                  <Link
                    href="/resources"
                    className="text-sm font-medium text-muted-ink hover:text-ink transition-colors"
                  >
                    Resources
                  </Link>
                  {!authUser && (
                    <button
                      type="button"
                      onClick={() => setAuthOpen(true)}
                      className="text-sm font-medium text-muted-ink hover:text-ink transition-colors cursor-pointer"
                    >
                      Sign in
                    </button>
                  )}
                </div>
              )}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {caseId && (
                <>
                  <button
                    type="button"
                    onClick={() => openNora()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sage/60 hover:bg-sage border border-line text-xs font-semibold text-evergreen transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask Nora</span>
                  </button>

                  <Link
                    href={`/plan/${caseId}/print`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-ink hover:text-ink px-3 py-1.5 rounded-lg border border-line hover:bg-white transition-colors"
                    title="Printable Plan"
                  >
                    <Printer className="w-3.5 h-3.5 text-muted-ink" />
                    <span className="hidden sm:inline font-medium">Print</span>
                  </Link>
                </>
              )}

              {/* User Identity / Menu */}
              {authUser ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 py-1 px-2 rounded-xl hover:bg-cream border border-transparent hover:border-line transition-colors cursor-pointer"
                    aria-label="User account menu"
                  >
                    {authUser.avatarUrl ? (
                      <img
                        src={authUser.avatarUrl}
                        alt={authUser.name || 'User avatar'}
                        className="w-8 h-8 rounded-full object-cover border border-evergreen/30"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-evergreen text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                        {userInitial}
                      </span>
                    )}
                    <span className="hidden sm:inline text-xs font-semibold text-ink max-w-[120px] truncate">
                      {authUser.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-ink" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-line p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-line mb-1">
                        <p className="text-xs font-bold text-ink truncate">{authUser.name}</p>
                        <p className="text-[11px] text-muted-ink truncate">{authUser.email}</p>
                      </div>

                      <Link
                        href="/home"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-cream transition-colors"
                      >
                        <LayoutGrid className="w-4 h-4 text-evergreen" />
                        <span>My plans</span>
                      </Link>

                      <Link
                        href="/get-started"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-cream transition-colors"
                      >
                        <Plus className="w-4 h-4 text-evergreen" />
                        <span>Start a new transition</span>
                      </Link>

                      <div className="border-t border-line my-1" />

                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : !caseId && !draftId ? (
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white text-sm font-semibold transition-colors shadow-2xs"
                >
                  Talk to Nora
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="w-8 h-8 rounded-full bg-evergreen text-white font-bold text-xs flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                  title="Sign in"
                >
                  <User className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};
