import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-stone-line bg-surface px-3.5 py-2.5 text-sm text-charcoal shadow-2xs placeholder:text-muted/60 transition-colors focus-visible:outline-none focus-visible:border-forest focus-visible:ring-1 focus-visible:ring-forest disabled:cursor-not-allowed disabled:opacity-50 resize-y leading-relaxed',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
