import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export interface CostLineProps {
  category: string;
  title: string;
  subtitle?: string;
  amount: string;
  type: 'ESTIMATE' | 'QUOTE';
  previousEstimate?: string;
  className?: string;
}

export function CostLine({
  category,
  title,
  subtitle,
  amount,
  type,
  previousEstimate,
  className,
}: CostLineProps) {
  const isQuote = type === 'QUOTE';

  return (
    <div className={cn('py-3.5 border-b border-stone-line/70 last:border-b-0 flex items-start justify-between gap-4', className)}>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-0.5">
          {category}
        </p>
        <p className="text-sm font-semibold text-charcoal truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted truncate mt-0.5">{subtitle}</p>}
        {previousEstimate && (
          <p className="text-xs text-muted/70 mt-1 line-through">
            Previously estimated: {previousEstimate}
          </p>
        )}
      </div>

      <div className="text-right shrink-0">
        <p className={cn('text-base font-semibold', isQuote ? 'text-forest font-serif font-bold text-lg' : 'text-charcoal')}>
          {amount}
        </p>
        <div className="mt-1">
          <Badge variant={isQuote ? 'completed' : 'outline'} className="text-[11px]">
            {isQuote ? 'Confirmed Quote' : 'Planning Estimate'}
          </Badge>
        </div>
      </div>
    </div>
  );
}
