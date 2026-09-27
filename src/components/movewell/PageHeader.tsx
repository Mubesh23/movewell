import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  urgency?: 'PLANNED' | 'URGENT' | 'IMMEDIATE' | string;
  statusLabel?: string;
  statusVariant?: 'completed' | 'warning' | 'info' | 'urgent' | 'outline' | 'forest';
  badge?: React.ReactNode;
  summaryItems?: Array<{
    label: string;
    value: string;
    tone?: 'default' | 'urgent' | 'success' | 'warning';
  }>;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  urgency,
  statusLabel,
  statusVariant = 'outline',
  badge,
  summaryItems,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('pb-6 border-b border-stone-line space-y-4', className)}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal tracking-tight">
              {title}
            </h1>
            {badge ? (
              badge
            ) : statusLabel ? (
              <Badge variant={statusVariant} dot>
                {statusLabel}
              </Badge>
            ) : urgency ? (
              <Badge
                variant={urgency === 'URGENT' || urgency === 'IMMEDIATE' ? 'urgent' : 'outline'}
                dot
              >
                {urgency === 'IMMEDIATE' ? 'Immediate priority' : urgency === 'URGENT' ? 'Urgent' : 'Planned'}
              </Badge>
            ) : null}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-muted">
              {subtitle}
            </p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      {summaryItems && summaryItems.length > 0 && (
        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap text-xs sm:text-sm text-muted pt-1">
          {summaryItems.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-stone-warm select-none" aria-hidden="true">&bull;</span>}
              <span className="inline-flex items-baseline gap-1.5">
                <span className="text-muted/80">{item.label}</span>
                <span
                  className={cn('font-semibold text-charcoal', {
                    'text-status-critical': item.tone === 'urgent',
                    'text-forest': item.tone === 'success',
                    'text-status-warning': item.tone === 'warning',
                  })}
                >
                  {item.value}
                </span>
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
    </header>
  );
}
