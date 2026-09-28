'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Home,
  ClipboardList,
  CalendarDays,
  Users,
  WalletCards,
  FileText,
  ShieldCheck,
  FileDown,
  Sparkles,
  MessageSquare,
  Send,
  Building2,
} from 'lucide-react';
import { BRAND_NAME } from '@/lib/brand';
import { AIAssistant, openNora } from '@/components/assistant/AIAssistant';
import { AccountMenu } from '@/components/layout/AccountMenu';

interface WorkspaceShellProps {
  caseId: string;
  seniorName?: string;
  daysUntilDischarge?: number;
  children: React.ReactNode;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  caseId,
  seniorName = 'Family Member',
  daysUntilDischarge,
  children,
}) => {
  const pathname = usePathname();

  const navItems = [
    { href: `/plan/${caseId}`, label: 'Today', icon: ClipboardList, exact: true },
    { href: `/plan/${caseId}/tasks`, label: 'Plan', icon: CalendarDays },
    { href: `/plan/${caseId}/family`, label: 'Family', icon: Users },
    { href: `/plan/${caseId}/budget`, label: 'Budget', icon: WalletCards },
    { href: `/plan/${caseId}/resources`, label: 'Resources', icon: FileText },
  ];

  const isCurrentActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#183331]">
      {/* Desktop Persistent Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[238px] border-r border-[#e1e9e3] bg-white px-5 py-6 lg:block z-30">
        <Link href="/home" className="flex items-center gap-3 px-2 group" aria-label={`${BRAND_NAME} transitions`}>
          <span className="grid size-9 place-items-center rounded-xl bg-[#1f4d45] text-white shadow-xs group-hover:bg-[#153c36] transition-colors">
            <Home size={18} />
          </span>
          <span className="text-xl font-semibold tracking-[-0.04em] text-[#183331]">
            {BRAND_NAME}
          </span>
        </Link>

        <div className="mt-8 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#91a39c]">
          Family workspace
        </div>

        <nav className="mt-3 flex flex-col gap-1 relative" aria-label="Workspace navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isCurrentActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors z-10',
                  active
                    ? 'text-[#1f4d45] font-semibold'
                    : 'text-[#71847d] hover:text-[#183331]'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="workspace-nav-active-desktop"
                    className="absolute inset-0 rounded-lg bg-[#e8f1ea] -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon size={17} className={active ? 'text-[#1f4d45]' : 'text-[#71847d]'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#91a39c]">
          Coming soon
        </div>

        <nav className="mt-2 flex flex-col gap-1" aria-label="Upcoming features">
          {[
            { href: `/plan/${caseId}/outreach`, label: 'Outreach', icon: Send },
            { href: `/plan/${caseId}/inbox`, label: 'Inbox', icon: MessageSquare },
            { href: `/plan/${caseId}/providers`, label: 'Providers', icon: Building2 },
          ].map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition',
                  active
                    ? 'bg-[#e8f1ea] text-[#1f4d45] font-semibold'
                    : 'text-[#859891] hover:bg-[#f2f6f2] hover:text-[#183331]'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={active ? 'text-[#1f4d45]' : 'text-[#9cb0a8]'} />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] font-semibold tracking-wider text-[#9aa9a3] uppercase bg-[#edf2ee] px-1.5 py-0.5 rounded">
                  Soon
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Private Family Space Trust Badge */}
        <div className="absolute bottom-6 left-5 right-5 rounded-2xl bg-[#f1f6f1] p-4 border border-[#e2ece4]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#3f6c5c]">
            <ShieldCheck size={15} />
            <span>Private family space</span>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-[#789087]">
            Only invited family members can see this transition plan.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-[238px] flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-[70px] sm:h-[74px] items-center justify-between border-b border-[#e1e9e3] bg-white/95 backdrop-blur-xs px-4 sm:px-6 md:px-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#91a39c]">
              Family workspace
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-sm font-bold text-[#183331]">
                {seniorName}&apos;s transition
              </span>
              {daysUntilDischarge !== undefined && (
                <span className="px-2 py-0.5 rounded-full bg-[#fff2df] text-[#a15d28] text-[11px] font-semibold">
                  {daysUntilDischarge}d to discharge
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => openNora()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1f4d45] hover:bg-[#153c36] px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles size={15} className="text-[#c8e1ce]" />
              <span>Ask Nora</span>
            </button>

            <Link
              href={`/plan/${caseId}/print?autoprint=1`}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#71847d] hover:text-[#183331] px-3 py-2 rounded-lg border border-[#cbdcd0] bg-white hover:bg-[#f1f6f1] transition-colors font-semibold shadow-2xs"
              title="Download PDF or print discharge binder"
            >
              <FileDown size={14} className="text-[#1f4d45]" />
              <span>Export PDF / Print</span>
            </Link>

            <AccountMenu />
          </div>
        </header>

        {/* Mobile Horizontal Navigation Tabs */}
        <nav
          className="flex gap-1 overflow-x-auto border-b border-[#e1e9e3] bg-white px-4 py-2 lg:hidden scrollbar-none"
          aria-label="Mobile workspace navigation"
        >
          {navItems.map((item) => {
            const active = isCurrentActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  active
                    ? 'text-[#1f4d45]'
                    : 'text-[#71847d] hover:text-[#183331]'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="workspace-nav-active-mobile"
                    className="absolute inset-0 rounded-lg bg-[#e8f1ea] -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Page Content with subtle transition */}
        <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Floating Nora Assistant */}
      <AIAssistant caseId={caseId} />
    </div>
  );
};
