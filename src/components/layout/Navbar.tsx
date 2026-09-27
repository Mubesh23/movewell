'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Printer } from 'lucide-react';

interface NavbarProps {
  caseId?: string;
  seniorName?: string;
  daysUntilDischarge?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  caseId,
  seniorName = 'Transition Plan',
  daysUntilDischarge,
}) => {
  const pathname = usePathname();

  const navLinks = caseId
    ? [
        { href: `/plan/${caseId}`, label: 'Overview' },
        { href: `/plan/${caseId}/tasks`, label: 'Plan' },
        { href: `/plan/${caseId}/budget`, label: 'Budget' },
        { href: `/plan/${caseId}/family`, label: 'Family' },
        { href: `/plan/${caseId}/resources`, label: 'Resources' },
      ]
    : [{ href: '/start', label: 'Start Intake' }];

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-xs border-b border-stone-line transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Left: Brand + Context */}
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="w-7 h-7 rounded-md bg-forest text-surface font-serif font-bold text-sm flex items-center justify-center tracking-tight shadow-2xs group-hover:bg-forest-deep transition-colors">
                M
              </span>
              <span className="text-lg font-serif font-bold text-charcoal tracking-tight">
                MoveWell
              </span>
            </Link>

            {caseId && (
              <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-stone-line text-xs text-muted">
                <span className="font-medium text-charcoal">{seniorName}</span>
                {daysUntilDischarge !== undefined && (
                  <>
                    <span className="text-stone-line" aria-hidden="true">&bull;</span>
                    <span className="text-status-critical font-medium">
                      {daysUntilDischarge}d to discharge
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Center / Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3.5 py-1.5 text-sm transition-colors relative font-medium',
                    isActive
                      ? 'text-forest font-semibold after:absolute after:bottom-[-13px] after:left-3 after:right-3 after:h-0.5 after:bg-forest'
                      : 'text-muted hover:text-charcoal'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {caseId ? (
              <Link
                href={`/plan/${caseId}/print`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-charcoal px-2.5 py-1.5 rounded-md hover:bg-stone-subtle/50 transition-colors"
                title="Printable Plan"
              >
                <Printer className="w-3.5 h-3.5 text-muted" />
                <span className="hidden sm:inline">Print plan</span>
              </Link>
            ) : (
              <Link
                href="/start"
                className="text-xs font-semibold text-forest hover:text-forest-deep underline-offset-4 hover:underline"
              >
                Use guided intake &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
