'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { TransitionTask, CaseMember } from '@/types';
import { StatusIndicator } from './StatusIndicator';
import { Button } from '@/components/ui/Button';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  User,
  AlertCircle,
  MessageSquare,
  DollarSign,
} from 'lucide-react';

export interface TaskRowProps {
  task: TransitionTask;
  allTasks?: TransitionTask[];
  members?: CaseMember[];
  onComplete?: (task: TransitionTask, note?: string) => void;
  onReopen?: (task: TransitionTask) => void;
  onAssign?: (taskId: string, memberId: string) => void;
  onAskNora?: (task: TransitionTask) => void;
  isUpdating?: boolean;
  className?: string;
  defaultExpanded?: boolean;
}

export function TaskRow({
  task,
  allTasks = [],
  members = [],
  onComplete,
  onReopen,
  onAssign,
  onAskNora,
  isUpdating,
  className,
  defaultExpanded = false,
}: TaskRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  const isCompleted = task.status === 'COMPLETED';
  const isBlocked = task.status === 'BLOCKED';

  // Resolve dependencies into titles
  const prereqTasks = allTasks.filter((t) => task.dependsOnTaskIds?.includes(t.id));

  const handleCompleteWithNote = () => {
    if (onComplete) {
      onComplete(task, noteText.trim() || undefined);
      setShowNoteInput(false);
      setNoteText('');
    }
  };

  return (
    <div
      className={cn(
        'group border-b border-stone-line/70 last:border-b-0 py-3.5 transition-colors',
        isCompleted && 'opacity-70',
        className
      )}
    >
      {/* Main Row */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        {/* Left: Expand icon + Check trigger + Title & Assignee */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 -ml-1 text-muted hover:text-charcoal transition-colors mt-0.5 sm:mt-0 shrink-0"
            aria-label={expanded ? 'Collapse task details' : 'Expand task details'}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Quick complete / circle icon */}
          <button
            type="button"
            disabled={isBlocked || isUpdating}
            onClick={() => {
              if (isCompleted && onReopen) onReopen(task);
              else if (!isCompleted && onComplete) onComplete(task);
            }}
            className={cn(
              'w-5 h-5 rounded-full border transition-all flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest',
              isCompleted
                ? 'bg-status-success border-status-success text-surface'
                : isBlocked
                ? 'border-stone-warm bg-stone-subtle cursor-not-allowed text-transparent'
                : 'border-stone-warm hover:border-forest text-transparent hover:text-forest/30'
            )}
            title={isCompleted ? 'Mark incomplete' : isBlocked ? 'Blocked by prerequisites' : 'Mark complete'}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>

          {/* Task Title & Quick Assignee */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                onClick={() => setExpanded(!expanded)}
                className={cn(
                  'text-sm font-medium text-charcoal hover:text-forest cursor-pointer transition-colors leading-snug',
                  isCompleted && 'line-through text-muted'
                )}
              >
                {task.title}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
              <span>{task.assignee ? task.assignee.name : 'Unassigned'}</span>
              {task.dueDate && (
                <>
                  <span className="text-stone-line" aria-hidden="true">&bull;</span>
                  <span>Due {task.dueDate}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Status Indicator & Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <StatusIndicator status={task.status} />

          {onAskNora && (
            <button
              type="button"
              onClick={() => onAskNora(task)}
              className="hidden sm:inline-flex p-1.5 rounded-md text-muted hover:text-forest hover:bg-forest/5 transition-colors"
              title="Ask Nora about this task"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details Drawer */}
      {expanded && (
        <div className="mt-3 ml-7 sm:ml-12 pl-3 border-l-2 border-stone-subtle space-y-3 text-xs text-muted pt-1 pb-2">
          {task.whyItMatters && (
            <div>
              <p className="font-semibold text-charcoal mb-0.5">Why this matters now</p>
              <p className="text-muted leading-relaxed">{task.whyItMatters}</p>
            </div>
          )}

          {task.description && task.description !== task.whyItMatters && (
            <div>
              <p className="font-semibold text-charcoal mb-0.5">Guidance & Details</p>
              <p className="text-muted leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Prerequisites / Blockers */}
          {prereqTasks.length > 0 && (
            <div className="space-y-1">
              <p className="font-semibold text-charcoal flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-status-warning" />
                <span>Prerequisites ({prereqTasks.length})</span>
              </p>
              <ul className="space-y-1 pl-4 list-disc text-muted">
                {prereqTasks.map((pt) => (
                  <li key={pt.id}>
                    <span className={pt.status === 'COMPLETED' ? 'line-through' : 'font-medium text-charcoal'}>
                      {pt.title}
                    </span>
                    <span className="ml-1.5 text-stone-warm">({pt.status.toLowerCase()})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Completion Note */}
          {task.completionNotes && (
            <div className="p-2.5 rounded-md bg-stone-subtle/70 text-charcoal">
              <p className="font-semibold text-[11px] uppercase tracking-wider text-muted mb-0.5">
                Completion Note
              </p>
              <p className="italic">{task.completionNotes}</p>
            </div>
          )}

          {/* Cost Estimates */}
          {(task.minEstimatedCost > 0 || task.maxEstimatedCost > 0) && (
            <div className="flex items-center gap-1.5 text-charcoal font-medium">
              <DollarSign className="w-3.5 h-3.5 text-forest" />
              <span>
                Estimated cost: ${task.minEstimatedCost.toLocaleString()} &ndash; ${task.maxEstimatedCost.toLocaleString()}
              </span>
            </div>
          )}

          {/* Actions inside expansion */}
          <div className="pt-2 flex items-center gap-3 flex-wrap">
            {onAssign && members.length > 0 && (
              <div className="inline-flex items-center gap-1.5">
                <span className="text-muted">Assign to:</span>
                <select
                  value={task.assigneeId || ''}
                  onChange={(e) => onAssign(task.id, e.target.value)}
                  className="h-7 px-2 text-xs rounded-md border border-stone-line bg-surface text-charcoal"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!isCompleted && !showNoteInput && onComplete && (
              <button
                type="button"
                onClick={() => setShowNoteInput(true)}
                className="text-forest hover:underline font-medium text-xs ml-auto"
              >
                Add completion note &rarr;
              </button>
            )}

            {showNoteInput && (
              <div className="w-full space-y-2 pt-2 border-t border-stone-line">
                <input
                  type="text"
                  placeholder="e.g. Confirmed with Dr. Miller that rehab is recommended for 2 weeks."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs rounded-md border border-stone-line bg-surface text-charcoal"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNoteInput(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleCompleteWithNote}
                  >
                    Mark complete with note
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
