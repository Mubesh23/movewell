'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TransitionTask, CaseMember } from '@/types';
import { StatusIndicator } from './StatusIndicator';
import { Button } from '@/components/ui/Button';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Check,
  Clock,
  User,
  AlertCircle,
  MessageSquare,
  DollarSign,
  Lock,
  Home,
  ShieldAlert,
  FileText,
  MapPin,
} from 'lucide-react';

export interface TaskRowProps {
  task: TransitionTask;
  allTasks?: TransitionTask[];
  members?: CaseMember[];
  onComplete?: (task: TransitionTask, note?: string) => void;
  onReopen?: (task: TransitionTask) => void;
  onAssign?: (taskId: string, memberId: string) => void;
  onUpdateDueDate?: (taskId: string, dueDate: string) => void;
  onAskNora?: (task: TransitionTask) => void;
  isUpdating?: boolean;
  className?: string;
  defaultExpanded?: boolean;
}

function formatFriendlyDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (year && month && day) {
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch {}
  return dateStr;
}

function getMatchingResourceLink(task: TransitionTask): { label: string; href: string } | null {
  const tStr = `${task.templateId || ''} ${task.title}`.toLowerCase();
  if (tStr.includes('move manager') || tStr.includes('downsize')) {
    return { label: 'Explore senior move managers', href: `/plan/${task.caseId}/resources?category=senior_move_management` };
  }
  if (tStr.includes('mover') || tStr.includes('moving')) {
    return { label: 'View nearby moving options', href: `/plan/${task.caseId}/resources?category=moving` };
  }
  if (
    tStr.includes('accessibility') ||
    tStr.includes('safety') ||
    tStr.includes('grab bar') ||
    tStr.includes('ramp') ||
    tStr.includes('stair')
  ) {
    return { label: 'Explore home modifications & safety', href: `/plan/${task.caseId}/resources?category=home_modification` };
  }
  if (tStr.includes('donation') || tStr.includes('donate')) {
    return { label: 'Find donation pickup & decluttering', href: `/plan/${task.caseId}/resources?category=donation` };
  }
  if (tStr.includes('transport') || tStr.includes('ride')) {
    return { label: 'View transportation options', href: `/plan/${task.caseId}/resources?category=transportation` };
  }
  if (tStr.includes('storage')) {
    return { label: 'Explore storage facilities', href: `/plan/${task.caseId}/resources?category=storage` };
  }
  return null;
}

export function TaskRow({
  task,
  allTasks = [],
  members = [],
  onComplete,
  onReopen,
  onAssign,
  onUpdateDueDate,
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
  const uncompletedPrereqs = prereqTasks.filter((pt) => pt.status !== 'COMPLETED');

  const handleCompleteWithNote = () => {
    if (onComplete) {
      onComplete(task, noteText.trim() || undefined);
      setShowNoteInput(false);
      setNoteText('');
    }
  };

  // Determine category tone & icon
  let tone = 'sage';
  let IconComponent = CheckCircle2;
  const tStr = `${task.templateId || ''} ${task.title}`.toLowerCase();
  if (tStr.includes('discharge') || tStr.includes('destination')) {
    tone = 'urgent';
    IconComponent = Home;
  } else if (
    tStr.includes('safety') ||
    tStr.includes('accessibility') ||
    tStr.includes('stair') ||
    tStr.includes('housing-duration')
  ) {
    tone = 'warm';
    IconComponent = ShieldAlert;
  } else if (
    tStr.includes('mover') ||
    tStr.includes('moving') ||
    tStr.includes('cost') ||
    tStr.includes('storage') ||
    tStr.includes('donation')
  ) {
    tone = 'sage';
    IconComponent = DollarSign;
  }

  return (
    <div
      className={cn(
        'group border-b border-stone-line/70 last:border-b-0 py-3.5 transition-colors',
        isCompleted && 'opacity-75',
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
            className="p-1 -ml-1 text-muted hover:text-charcoal transition-colors mt-0.5 sm:mt-0 shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center rounded"
            aria-label={expanded ? `Collapse details for ${task.title}` : `Expand details for ${task.title}`}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-charcoal" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted group-hover:text-charcoal" />
            )}
          </button>

          {/* Quick complete / circle icon */}
          {isCompleted ? (
            <motion.button
              type="button"
              disabled={isUpdating}
              whileTap={{ scale: 0.88 }}
              onClick={() => onReopen && onReopen(task)}
              className="w-5 h-5 rounded-full bg-status-success text-surface flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-2xs hover:bg-status-success/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
              title="Completed — Click to reopen"
              aria-label={`Task "${task.title}" is completed. Click to reopen.`}
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </motion.button>
          ) : isBlocked ? (
            <button
              type="button"
              disabled
              className="w-5 h-5 rounded-full border border-ochre/40 bg-ochre-subtle text-ochre flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 cursor-not-allowed"
              title="Blocked by incomplete prerequisites"
              aria-label={`Task "${task.title}" is blocked by prerequisite tasks.`}
            >
              <Lock className="w-2.5 h-2.5 text-ochre" />
            </button>
          ) : (
            <motion.button
              type="button"
              disabled={isUpdating}
              whileTap={{ scale: 0.88 }}
              onClick={() => onComplete && onComplete(task)}
              className="w-5 h-5 rounded-full border-2 border-stone-border hover:border-forest text-transparent hover:text-forest/60 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
              title="Click to mark complete"
              aria-label={`Mark task "${task.title}" complete`}
            >
              <Check className="w-3 h-3 text-transparent hover:text-forest" />
            </motion.button>
          )}

          {/* Tinted Category Icon Square */}
          <span className={cn('task-icon shrink-0 hidden sm:grid', tone)}>
            <IconComponent className="w-4 h-4" />
          </span>

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

            <div className="flex items-center gap-2.5 text-xs text-muted mt-0.5 flex-wrap">
              {onAssign && members.length > 0 ? (
                <select
                  value={task.assigneeId || ''}
                  onChange={(e) => onAssign(task.id, e.target.value)}
                  className="text-xs font-semibold text-charcoal bg-stone-100/80 hover:bg-stone-200/80 rounded-md px-2 py-0.5 border border-stone-line cursor-pointer focus:outline-none focus:ring-1 focus:ring-forest transition-colors"
                  aria-label={`Assignee for ${task.title}`}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{task.assignee ? task.assignee.name : 'Unassigned'}</span>
              )}
              {onUpdateDueDate ? (
                <>
                  <span className="text-stone-line" aria-hidden="true">&bull;</span>
                  <div className="inline-flex items-center gap-1">
                    <span className="text-[11px] text-[#71847d]">Due:</span>
                    <input
                      type="date"
                      value={task.dueDate || ''}
                      onChange={(e) => onUpdateDueDate(task.id, e.target.value)}
                      className="text-[11px] font-medium text-[#183331] bg-[#edf3ef] hover:bg-[#e1ece3] rounded px-1.5 py-0.5 border border-[#d2e0d5] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1f4d45] transition-colors"
                      title="Click to shift due date"
                      aria-label={`Due date for ${task.title}`}
                    />
                  </div>
                </>
              ) : task.dueDate ? (
                <>
                  <span className="text-stone-line" aria-hidden="true">&bull;</span>
                  <span>Due {formatFriendlyDate(task.dueDate)}</span>
                </>
              ) : null}
              {isBlocked && (
                <>
                  <span className="text-stone-line" aria-hidden="true">&bull;</span>
                  <span className="text-ochre-text font-medium">Blocked by {uncompletedPrereqs.length} prerequisite{uncompletedPrereqs.length === 1 ? '' : 's'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Status Indicator & Action */}
        <div className="flex items-center gap-2 shrink-0">
          <StatusIndicator status={task.status} />

          {onAskNora && (
            <button
              type="button"
              onClick={() => onAskNora(task)}
              className="hidden sm:inline-flex p-1.5 rounded-md text-muted hover:text-forest hover:bg-forest/5 transition-colors"
              title="Ask Nora about this task"
              aria-label={`Ask Nora about ${task.title}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details Drawer */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 ml-7 sm:ml-10 pl-3 border-l-2 border-stone-line space-y-3 text-xs text-muted pt-1 pb-2">
              {task.whyItMatters && (
                <div>
                  <p className="font-semibold text-charcoal mb-0.5 font-sans">Why this matters now</p>
                  <p className="text-muted leading-relaxed">{task.whyItMatters}</p>
                </div>
              )}

              {task.description && task.description !== task.whyItMatters && (
                <div>
                  <p className="font-semibold text-charcoal mb-0.5 font-sans">Guidance & Details</p>
                  <p className="text-muted leading-relaxed">{task.description}</p>
                </div>
              )}

              {/* Stronger Blocked / Prerequisites Explanation */}
              {isBlocked && uncompletedPrereqs.length > 0 && (
                <div className="p-3 rounded-lg border border-ochre-border bg-ochre-subtle text-xs space-y-1.5">
                  <p className="font-semibold text-ochre-text flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-ochre shrink-0" />
                    <span>Prerequisites must be completed before starting:</span>
                  </p>
                  <ul className="space-y-1 pl-5 list-disc text-charcoal">
                    {uncompletedPrereqs.map((pt) => (
                      <li key={pt.id}>
                        <span className="font-medium">{pt.title}</span>{' '}
                        <span className="text-muted">({pt.status.toLowerCase().replace('_', ' ')})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Completed Prerequisites if all done */}
              {!isBlocked && prereqTasks.length > 0 && (
                <div className="space-y-1 text-xs text-muted">
                  <p className="font-semibold text-charcoal flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                    <span>Prerequisites fulfilled ({prereqTasks.length})</span>
                  </p>
                </div>
              )}

              {/* Completion Note */}
              {task.completionNotes && (
                <div className="p-2.5 rounded-md bg-stone-subtle text-charcoal">
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
                    Planning estimate: ${task.minEstimatedCost.toLocaleString()} &ndash; ${task.maxEstimatedCost.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Contextual Resource Directory Link */}
              {(() => {
                const resourceLink = getMatchingResourceLink(task);
                if (!resourceLink) return null;
                return (
                  <div className="pt-1">
                    <div className="p-2.5 rounded-xl bg-[#EFF7F0] border border-[#CCE0D1] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-[#1F4D45] shrink-0" />
                        <span className="font-semibold text-[#183331]">Help near case location</span>
                        <span className="text-[#56816D]">&bull; {resourceLink.label}</span>
                      </div>
                      <Link
                        href={resourceLink.href}
                        className="text-xs font-semibold text-[#1F4D45] hover:text-[#153C36] hover:underline transition-colors shrink-0"
                      >
                        View nearby help &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })()}

              {/* Actions inside expansion */}
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                {onAssign && members.length > 0 && (
                  <div className="inline-flex items-center gap-1.5">
                    <span className="text-muted">Assign to:</span>
                    <select
                      value={task.assigneeId || ''}
                      onChange={(e) => onAssign(task.id, e.target.value)}
                      className="h-8 px-2 text-xs rounded-md border border-stone-line bg-surface text-charcoal focus:outline-none focus:ring-1 focus:ring-forest"
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
                    className="text-forest hover:text-forest-deep underline underline-offset-2 font-medium text-xs ml-auto min-h-[36px] flex items-center"
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
                      className="w-full h-9 px-3 text-xs rounded-md border border-stone-line bg-surface text-charcoal focus:outline-none focus:ring-1 focus:ring-forest"
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
