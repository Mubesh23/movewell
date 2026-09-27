import React from 'react';
import { cn } from '@/lib/utils';
import { CostSummary, CostItem } from '@/types';

export interface BudgetSummaryProps {
  costSummary: CostSummary;
  costItems?: CostItem[];
  className?: string;
}

export function BudgetSummary({ costSummary, costItems = [], className }: BudgetSummaryProps) {
  const isOver = costSummary.budgetGap > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 3-column financial ledger overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-4 border-y border-stone-line">
        <div className="space-y-0.5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium">Family Available Budget</p>
          <p className="text-2xl font-serif font-bold text-charcoal">
            ${costSummary.userBudget.toLocaleString()}
          </p>
          <p className="text-xs text-muted">Allocated for transition</p>
        </div>

        <div className="space-y-0.5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium">Expected Expenses</p>
          <p className="text-2xl font-serif font-bold text-forest">
            ${costSummary.minTotal.toLocaleString()} &ndash; ${costSummary.maxTotal.toLocaleString()}
          </p>
          <p className="text-xs text-muted">
            {costSummary.confirmedQuotesTotal ? 'Includes confirmed quotes' : 'Planning estimates'}
          </p>
        </div>

        <div className="space-y-0.5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium">Budget Status</p>
          <p
            className={cn(
              'text-2xl font-serif font-bold',
              isOver ? 'text-status-warning' : 'text-status-success'
            )}
          >
            {isOver
              ? `+$${costSummary.budgetGap.toLocaleString()} Over`
              : 'Within Budget'}
          </p>
          <p className="text-xs text-muted">
            {isOver
              ? 'Review high-cost tasks or adjustments'
              : `$${Math.abs(costSummary.budgetGap).toLocaleString()} contingency remaining`}
          </p>
        </div>
      </div>

      {costSummary.disclaimer && (
        <p className="text-xs text-muted/80 italic">
          &ldquo;{costSummary.disclaimer}&rdquo;
        </p>
      )}
    </div>
  );
}
