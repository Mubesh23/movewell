'use client';

import React, { useState } from 'react';
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
      <div className="bg-[#FFFBF5] border border-[#EADBCC] rounded-2xl p-4 sm:p-5 shadow-2xs relative">
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
      </div>

      {/* Expanded Before vs Now Comparison Dialog */}
      {/* Expanded Before vs Now Comparison Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="What changed in your transition plan"
        description="MoveWell automatically adapts your milestones, task readiness, and dependencies when reality changes."
      >
        <div className="py-2 space-y-4">
          <div className="rounded-xl border border-line bg-white overflow-hidden shadow-2xs divide-y divide-line">
            <div className="grid grid-cols-2 bg-sage/40 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-ink">
              <div>Before</div>
              <div>Now</div>
            </div>

            {change.diffs && change.diffs.length > 0 ? (
              change.diffs.map((diff, i) => (
                <div key={i} className="grid grid-cols-2 px-4 py-3 text-xs gap-3">
                  <div className="text-muted-ink">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-ink/70 mb-0.5">
                      {diff.label}
                    </span>
                    <span className="line-through decoration-muted-ink/50">{diff.before}</span>
                  </div>
                  <div className="text-ink font-semibold flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-evergreen shrink-0 mt-0.5" />
                    <span>{diff.after}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-xs text-muted-ink italic">No structural diffs recorded.</div>
            )}
          </div>

          <div className="rounded-xl bg-sage/60 p-3 text-xs text-evergreen leading-relaxed">
            <strong>Living Coordination Guarantee:</strong> Downstream dates and partner recommendations reflect this updated reality so nobody works off stale assumptions.
          </div>

          <div className="flex justify-end pt-2 border-t border-line">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-evergreen text-white text-xs font-semibold hover:bg-evergreen-dark transition-colors"
            >
              Done reviewing
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
};
