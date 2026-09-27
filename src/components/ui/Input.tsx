import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, helperText, id, ...props }, ref) => {
    const inputElement = (
      <input
        type={type}
        id={id}
        className={cn(
          'flex h-10 w-full rounded-lg border border-stone-line bg-surface px-3.5 py-2 text-sm text-charcoal shadow-2xs placeholder:text-muted/60 transition-colors focus-visible:outline-none focus-visible:border-forest focus-visible:ring-1 focus-visible:ring-forest disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );

    if (label || helperText) {
      return (
        <div className="space-y-1.5 w-full">
          {label && (
            <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-muted">
              {label}
            </label>
          )}
          {inputElement}
          {helperText && (
            <p className="text-xs text-muted">{helperText}</p>
          )}
        </div>
      );
    }

    return inputElement;
  }
);
Input.displayName = 'Input';
