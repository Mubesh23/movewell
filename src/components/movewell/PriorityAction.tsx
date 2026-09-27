import React from 'react';
import { cn } from '@/lib/utils';
import { TransitionTask } from '@/types';
import { Button } from '@/components/ui/Button';
import { StatusIndicator } from './StatusIndicator';
import { CheckCircle2, MessageSquare, User, Calendar } from 'lucide-react';

export interface PriorityActionProps {
  task: TransitionTask;
  seniorName?: string;
  onComplete: (task: TransitionTask) => void;
  onAskNora: (task: TransitionTask) => void;
  isUpdating?: boolean;
  className?: string;
}

export function PriorityAction({
  task,
  seniorName = 'the senior',
  onComplete,
  onAskNora,
  isUpdating,
  className,
}: PriorityActionProps) {
  const isCompleted = task.status === 'COMPLETED';

  return (
    <div
      className={cn(
        'rounded-xl border border-forest/20 bg-surface p-6 sm:p-7 shadow-xs relative overflow-hidden transition-all',
        isCompleted && 'border-stone-line bg-surface/80',
        className
      )}
    >
      {/* Top eyebrow & status */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-forest">
          Needs attention today
        </span>
        <StatusIndicator status={task.status} />
      </div>

      {/* Main task title */}
      <h3 className={cn(
        'text-xl sm:text-2xl font-serif font-bold text-charcoal tracking-tight',
        isCompleted && 'line-through text-muted'
      )}>
        {task.title}
      </h3>

      {/* Why it matters / Context description */}
      <p className="mt-2.5 text-sm sm:text-base text-muted leading-relaxed max-w-3xl">
        {task.whyItMatters || task.description || `${seniorName} needs this priority resolved before downstream transition steps can move forward.`}
      </p>

      {/* Metadata strip: Assignee & Due date */}
      <div className="mt-5 pt-4 border-t border-stone-line/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-muted">
          <div className="inline-flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-stone-warm" />
            <span>
              {task.assignee ? task.assignee.name : 'Unassigned'}
            </span>
          </div>

          <span className="text-stone-line" aria-hidden="true">&bull;</span>

          <div className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-warm" />
            <span>
              {task.dueDate ? `Due ${task.dueDate}` : 'Priority today'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAskNora(task)}
            className="text-xs font-medium"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Ask Nora about this
          </Button>

          {!isCompleted && (
            <Button
              type="button"
              variant="default"
              size="sm"
              isLoading={isUpdating}
              onClick={() => onComplete(task)}
              className="text-xs font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
