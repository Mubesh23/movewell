'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, User, AlertCircle } from 'lucide-react';
import { TransitionTask } from '@/types';

interface TaskCompletionModalProps {
  isOpen: boolean;
  task: TransitionTask | null;
  currentMemberName?: string;
  onClose: () => void;
  onConfirm: (task: TransitionTask, note?: string) => Promise<void> | void;
}

export const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
  isOpen,
  task,
  currentMemberName = 'Family Coordinator',
  onClose,
  onConfirm,
}) => {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNote(task?.completionNotes || '');
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const assigneeName = task.assignee?.name || 'Unassigned';
  const isAssigned = Boolean(task.assignee?.name && task.assignee.name.trim().length > 0);
  const isAssignedToOther =
    isAssigned &&
    assigneeName.toLowerCase().trim() !== currentMemberName.toLowerCase().trim() &&
    assigneeName !== 'Unassigned';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAssignedToOther && !note.trim()) {
      setError(`This task is assigned to ${assigneeName}. Add a note so the family knows what happened.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(task, note.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to complete task');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-line p-6 sm:p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted-ink hover:text-ink transition-colors p-1"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-evergreen mb-2">
          <CheckCircle2 className="w-5 h-5 text-evergreen" />
          <span className="text-xs font-bold tracking-wider uppercase text-muted-ink">
            Task Completion
          </span>
        </div>

        <h3 className="text-xl font-bold text-ink tracking-tight mb-2">
          Mark task complete
        </h3>

        <div className="p-3.5 rounded-xl bg-[#F7F8F5] border border-[#E3E9E5] mb-5">
          <p className="text-sm font-semibold text-[#183331] leading-snug">
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-[#71847D] mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="mt-3 pt-3 border-t border-[#E3E9E5] flex flex-wrap items-center justify-between gap-2 text-xs text-[#52665F]">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#3F6C5C]" />
              <span>Assigned to: <strong className="text-[#183331] font-semibold">{assigneeName}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Completed by: <strong className="text-[#183331] font-semibold">{currentMemberName}</strong></span>
            </div>
          </div>
        </div>

        {isAssignedToOther && (
          <div className="mb-4 p-3 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/30 flex items-start gap-2.5 text-xs text-[#92400E]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              This task is assigned to <strong>{assigneeName}</strong>. Add a note so the family knows what happened.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-amber-bg border border-amber/30 text-xs text-amber font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">
              Completion Note {isAssignedToOther ? <span className="text-amber">* (Required)</span> : <span className="text-[#879890] font-normal">(Optional)</span>}
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                isAssignedToOther
                  ? `e.g., Spoke with ${assigneeName} and confirmed the details are settled.`
                  : 'Add a note for your family (e.g., details, quotes received, dates confirmed)...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-cream/40 text-ink text-sm focus:outline-none focus:border-evergreen focus:bg-white transition-all leading-relaxed"
              autoFocus={isAssignedToOther}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-line text-sm font-semibold text-muted-ink hover:text-ink hover:bg-cream transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting
                ? 'Completing...'
                : isAssignedToOther
                ? `Complete on ${assigneeName}'s behalf`
                : 'Complete task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
