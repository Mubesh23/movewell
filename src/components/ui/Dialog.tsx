'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleClose = React.useCallback(() => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  }, [onClose, onOpenChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={handleClose}
      />

      {/* Surface */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        className={cn(
          'relative w-full max-w-lg rounded-2xl bg-surface border border-stone-line p-6 shadow-xl transition-all z-10 animate-in zoom-in-95',
          className
        )}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-muted hover:text-charcoal hover:bg-stone-subtle transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {title && (
          <div className="mb-4 pr-6">
            <h3 id="dialog-title" className="text-xl font-serif font-semibold text-charcoal tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-muted">
                {description}
              </p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
