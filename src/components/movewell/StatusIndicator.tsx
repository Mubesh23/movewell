import React from 'react';
import { cn } from '@/lib/utils';
import { TaskStatus } from '@/types';
import { Check } from 'lucide-react';

export interface StatusIndicatorProps {
  status: TaskStatus;
  className?: string;
  showIcon?: boolean;
}

export function StatusIndicator({ status, className, showIcon = true }: StatusIndicatorProps) {
  const configs: Record<TaskStatus, { label: string; dotClass: string; textClass: string; bgClass: string }> = {
    READY: {
      label: 'Ready',
      dotClass: 'bg-forest',
      textClass: 'text-forest',
      bgClass: 'bg-sage-subtle border-sage-border/40',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      dotClass: 'bg-status-warning',
      textClass: 'text-status-warning',
      bgClass: 'bg-status-warning-bg border-status-warning/20',
    },
    BLOCKED: {
      label: 'Blocked',
      dotClass: 'bg-muted/70',
      textClass: 'text-muted',
      bgClass: 'bg-stone-subtle border-stone-line',
    },
    COMPLETED: {
      label: 'Complete',
      dotClass: 'bg-status-success',
      textClass: 'text-status-success',
      bgClass: 'bg-status-success-bg border-status-success/20',
    },
    NOT_STARTED: {
      label: 'Planned',
      dotClass: 'bg-stone-warm',
      textClass: 'text-muted',
      bgClass: 'bg-stone-subtle border-stone-line',
    },
    SKIPPED: {
      label: 'Skipped',
      dotClass: 'bg-stone-warm',
      textClass: 'text-muted/60 line-through',
      bgClass: 'bg-stone-subtle border-stone-line opacity-60',
    },
  };

  const current = configs[status] || configs.NOT_STARTED;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border transition-colors select-none',
        current.bgClass,
        current.textClass,
        className
      )}
    >
      {showIcon && status === 'COMPLETED' ? (
        <Check className="w-3 h-3 text-status-success shrink-0 stroke-[2.5]" />
      ) : showIcon ? (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', current.dotClass)} />
      ) : null}
      {current.label}
    </span>
  );
}
