'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange?: (id: string) => void;
  onChange?: (id: string) => void;
  className?: string;
  variant?: 'underline' | 'pill';
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  onChange,
  className,
  variant = 'underline',
}: TabsProps) {
  const handleChange = (id: string) => {
    if (onChange) onChange(id);
    if (onTabChange) onTabChange(id);
  };

  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1 overflow-x-auto scrollbar-none relative',
        variant === 'underline' && 'border-b border-stone-line pb-px',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleChange(tab.id)}
            className={cn(
              'relative inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-forest cursor-pointer z-10',
              variant === 'underline' && [
                'py-2.5 px-3',
                isActive
                  ? 'text-[#1f4d45] font-semibold'
                  : 'text-muted hover:text-charcoal',
              ],
              variant === 'pill' && [
                'py-1.5 px-3 rounded-md text-xs',
                isActive
                  ? 'text-surface font-semibold'
                  : 'bg-surface text-muted border border-stone-line hover:text-charcoal hover:bg-stone-subtle/50',
              ]
            )}
          >
            {isActive && variant === 'underline' && (
              <motion.div
                layoutId="tabs-underline-active"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-terracotta -mb-px"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            {isActive && variant === 'pill' && (
              <motion.div
                layoutId="tabs-pill-active"
                className="absolute inset-0 rounded-md bg-forest -z-10 shadow-2xs"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-xs px-1.5 py-0.2 rounded-full transition-colors',
                  isActive
                    ? variant === 'pill'
                      ? 'bg-surface/20 text-surface'
                      : 'bg-forest/10 text-forest'
                    : 'bg-stone-subtle text-muted'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
