import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  divided?: boolean;
}

export function Section({
  as: Component = 'section',
  divided = true,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <Component
      className={cn(
        'py-8 sm:py-10',
        divided && 'border-b border-stone-line last:border-b-0',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
