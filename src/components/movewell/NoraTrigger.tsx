import React from 'react';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

export interface NoraTriggerProps {
  onClick: () => void;
  isOpen?: boolean;
  className?: string;
  variant?: 'floating' | 'inline';
}

export function NoraTrigger({
  onClick,
  isOpen = false,
  className,
  variant = 'floating',
}: NoraTriggerProps) {
  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-forest/30 text-forest hover:bg-forest/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest',
          className
        )}
      >
        <span className="w-4 h-4 rounded-full bg-forest text-surface font-serif text-[10px] font-bold flex items-center justify-center">
          N
        </span>
        <span>Ask Nora</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open Nora transition assistant"
      aria-expanded={isOpen}
      className={cn(
        'fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-forest text-surface shadow-lg hover:bg-forest-deep transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2',
        isOpen && 'opacity-0 pointer-events-none translate-y-2',
        className
      )}
    >
      <span className="w-5 h-5 rounded-full bg-surface/20 text-surface font-serif text-xs font-bold flex items-center justify-center">
        N
      </span>
      <span className="text-sm font-medium pr-0.5">Ask Nora</span>
    </button>
  );
}
