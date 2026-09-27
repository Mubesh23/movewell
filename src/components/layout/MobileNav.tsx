'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, CheckSquare, BookOpen, DollarSign, Users } from 'lucide-react';

interface MobileNavProps {
  caseId?: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({ caseId }) => {
  const pathname = usePathname();

  if (!caseId) return null;

  const tabs = [
    { href: `/plan/${caseId}`, label: 'Overview', icon: Home },
    { href: `/plan/${caseId}/tasks`, label: 'Plan', icon: CheckSquare },
    { href: `/plan/${caseId}/budget`, label: 'Budget', icon: DollarSign },
    { href: `/plan/${caseId}/family`, label: 'Family', icon: Users },
    { href: `/plan/${caseId}/resources`, label: 'Resources', icon: BookOpen },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface/98 backdrop-blur-md border-t border-stone-line px-2 pb-safe"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] text-[11px] transition-colors',
                isActive
                  ? 'text-forest font-semibold'
                  : 'text-muted hover:text-charcoal'
              )}
            >
              <Icon className={cn('w-4 h-4 mb-0.5', isActive ? 'text-forest stroke-[2.2]' : 'text-muted')} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
