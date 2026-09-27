'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlanChangeRecord } from '@/types';
import { Sparkles, ArrowRight, X, History, Check } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';

interface WhatChangedProps {
  change?: PlanChangeRecord;
  onDismiss?: () => void;
}

export const WhatChanged: React.FC<WhatChangedProps> = ({ change, onDismiss }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!change || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#FFFBF5] border border-[#EADBCC] rounded-2xl p-4 sm:p-5 shadow-2xs relative"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-amber-bg text-amber flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
              ✦
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <strong className="text-xs font-bold text-ink uppercase tracking-wider">
                  {change.title || 'Plan updated'}
                </strong>
                <span className="text-[10px] text-muted-ink">
                  {new Date(change.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Summary bullets */}
              <ul className="space-y-1 mb-3">
                {change.summaryBullets.map((bullet, i) => (
                  <li key={i} className="text-xs text-ink/90 font-medium flex items-center gap-1.5">
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-evergreen hover:text-evergreen-dark underline underline-offset-4"
              >
                <span>See what changed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-muted-ink hover:text-ink p-1 rounded-lg hover:bg-cream transition-colors"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Expanded Before vs Now Comparison Dialog */}
      {/* Expanded Before vs Now Comparison Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title=""
        description=""
      >
        <div className="py-1 space-y-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber block mb-1">
              PLAN UPDATE
            </span>
            <h3 className="text-2xl font-bold text-ink tracking-tight mb-2">
              What changed
            </h3>
            <p className="text-xs text-muted-ink leading-relaxed">
              {(change as any).causality || "Nora made these updates based on your conversation. You're always in control."}
            </p>
          </div>

          <div className="space-y-4">
            {change.diffs && change.diffs.length > 0 ? (
              change.diffs.map((diff, i) => (
                <div key={i} className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-ink block">
                    {diff.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-100 text-xs text-muted-ink font-medium">
                      {diff.before}
                    </div>
                    <span className="text-amber font-bold text-sm shrink-0">→</span>
                    <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FBF0E4] border border-[#F2DECA] text-xs text-ink font-semibold flex items-center gap-1.5">
                      {diff.after.toLowerCase().includes('completed') && (
                        <Check className="w-3.5 h-3.5 text-evergreen shrink-0" />
                      )}
                      <span>{diff.after}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-xs text-muted-ink italic">No structural diffs recorded.</div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="w-full py-3.5 px-4 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-bold text-sm transition-colors shadow-2xs mt-2"
          >
            Review updated plan
          </button>
        </div>
      </Dialog>
    </>
  );
};
