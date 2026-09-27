import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'bg-stone-subtle text-charcoal',
        ready: 'bg-sage-subtle text-forest border border-sage-border/50',
        'in-progress': 'bg-status-warning-bg text-status-warning border border-status-warning/20',
        blocked: 'bg-stone-subtle text-muted border border-stone-line',
        completed: 'bg-status-success-bg text-status-success border border-status-success/20',
        urgent: 'bg-status-critical-bg text-status-critical border border-status-critical/20',
        warning: 'bg-status-warning-bg text-status-warning border border-status-warning/20',
        info: 'bg-sage-subtle text-forest border border-sage-border/50',
        clay: 'bg-clay-subtle text-clay border border-clay-border/30',
        terracotta: 'bg-terracotta-subtle text-terracotta border border-terracotta-border',
        ochre: 'bg-ochre-subtle text-ochre-text border border-ochre-border',
        outline: 'border border-stone-line text-muted bg-transparent',
        forest: 'bg-forest text-surface',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props}>
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', {
            'bg-forest': variant === 'ready' || variant === 'info' || variant === 'forest',
            'bg-status-warning': variant === 'in-progress' || variant === 'warning',
            'bg-muted': variant === 'blocked',
            'bg-status-success': variant === 'completed',
            'bg-status-critical': variant === 'urgent',
            'bg-clay': variant === 'clay' || variant === 'terracotta',
            'bg-ochre': variant === 'ochre',
            'bg-charcoal': variant === 'default' || variant === 'outline',
          })}
        />
      )}
      {children}
    </span>
  );
}
