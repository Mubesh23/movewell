import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  subtitle,
  action,
  className,
}: SectionHeaderProps) {
  const desc = description || subtitle;
  return (
    <div className={cn('flex items-baseline justify-between gap-4 pb-3 mb-4 border-b border-stone-line/70', className)}>
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold tracking-wider uppercase text-muted/90 mb-0.5">
            {eyebrow}
          </p>
        )}
        <h2 className="text-lg sm:text-xl font-serif font-semibold text-charcoal tracking-tight">
          {title}
        </h2>
        {desc && (
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            {desc}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 text-sm">{action}</div>}
    </div>
  );
}
