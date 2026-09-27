import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center font-sans font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] select-none',
  {
    variants: {
      variant: {
        default:
          'bg-forest text-surface hover:bg-forest-deep active:bg-forest-deep shadow-xs',
        secondary:
          'bg-surface text-charcoal border border-stone-line hover:bg-stone-subtle/70 active:bg-stone-subtle',
        outline:
          'border border-forest/25 text-forest hover:bg-forest/5 active:bg-forest/10',
        ghost:
          'text-charcoal hover:bg-stone-subtle/60 active:bg-stone-subtle',
        clay:
          'bg-clay text-surface hover:bg-clay/90 active:bg-clay/95 shadow-xs',
        destructive:
          'bg-status-critical text-surface hover:bg-status-critical/90',
        link:
          'text-forest underline-offset-4 hover:underline p-0 h-auto font-normal',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm rounded-lg gap-2',
        sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
        lg: 'h-11 px-5 text-sm rounded-lg gap-2 font-semibold',
        icon: 'h-9 w-9 p-0 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading && (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
