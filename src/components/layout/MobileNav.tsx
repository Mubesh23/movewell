'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CheckSquare, BookOpen, DollarSign, Users, MoreHorizontal } from 'lucide-react';

interface MobileNavProps {
  caseId?: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({ caseId }) => {
  const pathname = usePathname();

  if (!caseId) return null;

  const tabs = [
    { href: `/plan/${caseId}`, label: 'Home', icon: Home },
    { href: `/plan/${caseId}/tasks`, label: 'Tasks', icon: CheckSquare },
    { href: `/plan/${caseId}/resources`, label: 'Resources', icon: BookOpen },
    { href: `/plan/${caseId}/budget`, label: 'Budget', icon: DollarSign },
    { href: `/plan/${caseId}/family`, label: 'Family', icon: Users },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-lg px-2 pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors ${
                isActive ? 'text-brand-900 font-bold' : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-brand-900' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
