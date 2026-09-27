'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Printer, Home, MessageSquare, ChevronDown, User } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { openNoraWithPrompt } from '@/components/assistant/AIAssistant';
import { BRAND_NAME } from '@/lib/brand';

interface NavbarProps {
  caseId?: string;
  draftId?: string;
  seniorName?: string;
  daysUntilDischarge?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  caseId,
  draftId,
  seniorName = 'Transition Plan',
  daysUntilDischarge,
}) => {
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);

  const isWorkspace = Boolean(caseId || draftId);

  const caseNavLinks = [
    { href: `/plan/${caseId}`, label: 'Today' },
    { href: `/plan/${caseId}/tasks`, label: 'Plan' },
    { href: `/plan/${caseId}/family`, label: 'Family' },
    { href: `/plan/${caseId}/budget`, label: 'Budget' },
    { href: `/plan/${caseId}/resources`, label: 'Resources' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-xs border-b border-line transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand + Context */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2.5 group">
                <span className="w-8 h-8 rounded-lg bg-evergreen text-white font-bold text-sm flex items-center justify-center tracking-tight shadow-xs group-hover:bg-evergreen-dark transition-colors">
                  <Home className="w-4 h-4" />
                </span>
                <span className="text-xl font-semibold text-ink tracking-[-0.04em]">
                  {BRAND_NAME}
                </span>
              </Link>

              {caseId && (
                <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-line text-xs">
                  <span className="font-bold text-ink flex items-center gap-1">
                    {seniorName}&apos;s transition
                    <ChevronDown className="w-3.5 h-3.5 text-muted-ink" />
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
                    href="/plan/case-maria-golden/resources"
                    className="text-sm font-medium text-muted-ink hover:text-ink transition-colors"
                  >
                    Resources
                  </Link>
                  <button
                    type="button"
                    onClick={() => setAuthOpen(true)}
                    className="text-sm font-medium text-muted-ink hover:text-ink transition-colors"
                  >
                    Sign in
                  </button>
                </div>
              )}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {caseId ? (
                <>
                  <button
                    type="button"
                    onClick={() => openNoraWithPrompt('What should our family focus on today?')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sage/60 hover:bg-sage border border-line text-xs font-semibold text-evergreen transition-colors"
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

                  <button
                    type="button"
                    onClick={() => setAuthOpen(true)}
                    className="w-8 h-8 rounded-full bg-evergreen text-white font-bold text-xs flex items-center justify-center hover:opacity-90 transition-opacity"
                    title="Account"
                  >
                    FM
                  </button>
                </>
              ) : draftId ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/"
                    className="text-xs font-medium text-muted-ink hover:text-ink px-2.5 py-1.5"
                  >
                    Save &amp; exit
                  </Link>
                </div>
              ) : (
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white text-sm font-semibold transition-colors shadow-2xs"
                >
                  Talk to Nora
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};
