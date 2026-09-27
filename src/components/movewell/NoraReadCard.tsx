'use client';

import React from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';

interface NoraReadCardProps {
  eyebrow?: string;
  headline: string;
  explanation: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const NoraReadCard: React.FC<NoraReadCardProps> = ({
  eyebrow = "Nora's read",
  headline,
  explanation,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`rounded-2xl border border-[#d8e6db] bg-[#eff7f0] p-5 shadow-2xs ${className}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#56816d]">
        <Sparkles size={15} />
        <span>{eyebrow}</span>
      </div>
      <h3 className="mt-3 text-base sm:text-lg font-semibold text-[#315d50] leading-snug">
        {headline}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#668077]">
        {explanation}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#3f6c5c] hover:text-[#1f4d45] transition-colors"
        >
          <span>{actionLabel}</span>
          <ArrowUpRight size={14} />
        </button>
      )}
    </div>
  );
};
