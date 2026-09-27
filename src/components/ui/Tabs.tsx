'use client';

import React from 'react';
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
        'flex items-center gap-1 overflow-x-auto scrollbar-none',
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
              'inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-forest',
              variant === 'underline' && [
                'py-2.5 px-3 border-b-2 -mb-px',
                isActive
                  ? 'border-forest text-forest font-semibold'
                  : 'border-transparent text-muted hover:text-charcoal hover:border-stone-warm',
              ],
              variant === 'pill' && [
                'py-1.5 px-3 rounded-md text-xs',
                isActive
                  ? 'bg-forest text-surface font-semibold shadow-2xs'
                  : 'bg-surface text-muted border border-stone-line hover:text-charcoal hover:bg-stone-subtle/50',
              ]
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-xs px-1.5 py-0.2 rounded-full',
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
