import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, label, helperText, options, id, ...props }, ref) => {
    const selectElement = (
      <div className="relative w-full">
        <select
          id={id}
          className={cn(
            'flex h-10 w-full appearance-none rounded-lg border border-stone-line bg-surface px-3.5 pr-9 py-2 text-sm text-charcoal shadow-2xs transition-colors focus-visible:outline-none focus-visible:border-forest focus-visible:ring-1 focus-visible:ring-forest disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          ref={ref}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
      </div>
    );

    if (label || helperText) {
      return (
        <div className="space-y-1.5 w-full">
          {label && (
            <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-muted">
              {label}
            </label>
          )}
          {selectElement}
          {helperText && (
            <p className="text-xs text-muted">{helperText}</p>
          )}
        </div>
      );
    }

    return selectElement;
  }
);
Select.displayName = 'Select';
