import React from 'react';
import { cn } from '@/lib/utils';
import { CostItem } from '@/types';
import { CheckCircle2, FileText } from 'lucide-react';

export interface QuoteSummaryProps {
  quote: CostItem;
  className?: string;
}

export function QuoteSummary({ quote, className }: QuoteSummaryProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl border border-forest/20 bg-surface shadow-2xs flex items-start justify-between gap-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center shrink-0 mt-0.5">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-charcoal">{quote.providerName || quote.description}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-forest bg-forest/10 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Applied
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5 capitalize">
            {quote.category} quote {quote.documentName ? `· ${quote.documentName}` : ''}
          </p>
          <p className="text-xs text-muted/80 mt-1">
            Replaced estimated range in plan cost calculations.
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-lg font-semibold tracking-[-0.03em] text-[#1f4d45]">
          ${quote.amount?.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
