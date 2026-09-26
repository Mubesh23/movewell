'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CheckSquare,
  BookOpen,
  Users,
  DollarSign,
  MoreHorizontal,
  ChevronDown,
  Clock,
  Sparkles,
  Printer,
} from 'lucide-react';

interface NavbarProps {
  caseId?: string;
  seniorName?: string;
  daysUntilDischarge?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  caseId,
  seniorName = "Maria's Transition",
  daysUntilDischarge = 5,
}) => {
  const pathname = usePathname();

  const navLinks = caseId
    ? [
        { href: `/plan/${caseId}`, label: 'Home', icon: Home },
        { href: `/plan/${caseId}/tasks`, label: 'Tasks', icon: CheckSquare },
        { href: `/plan/${caseId}/resources`, label: 'Resources', icon: BookOpen },
        { href: `/plan/${caseId}/budget`, label: 'Budget', icon: DollarSign },
        { href: `/plan/${caseId}/family`, label: 'Family', icon: Users },
        { href: `/plan/${caseId}/print`, label: 'Print', icon: Printer },
      ]
    : [{ href: '/start', label: 'Start Intake', icon: Sparkles }];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand logo */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-xl bg-brand-900 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-brand-800 transition">
                M
              </div>
              <div>
                <span className="text-xl font-serif font-bold text-brand-900 tracking-tight block leading-none">
                  MoveWell
                </span>
                <span className="text-[10px] text-stone-500 font-medium tracking-wide uppercase block">
                  A calmer path forward
                </span>
              </div>
            </Link>

            {/* Case Selector Dropdown Pill */}
            {caseId && (
              <div className="hidden md:flex items-center space-x-3 pl-4 border-l border-stone-200">
                <button className="flex items-center space-x-2 bg-stone-100 hover:bg-stone-200/70 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-800 transition">
                  <span>{seniorName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                </button>

                {daysUntilDischarge !== undefined && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 animate-pulse">
                    <Clock className="w-3 h-3 mr-1" />
                    {daysUntilDischarge} days until discharge
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Center: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-900 font-semibold'
                      : 'text-stone-600 hover:text-brand-900 hover:bg-stone-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-700' : 'text-stone-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: User Avatar */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 pl-2">
              <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-900 border border-brand-200 flex items-center justify-center font-bold text-xs shadow-xs">
                SS
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-stone-800 leading-tight">Sarah</p>
                <p className="text-[10px] text-stone-500 font-medium">Primary Coordinator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
