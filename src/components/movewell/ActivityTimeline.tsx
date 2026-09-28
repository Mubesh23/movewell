import React from 'react';
import { cn } from '@/lib/utils';
import { CaseEvent } from '@/types';
import { Clock, CheckCircle2, User, DollarSign, MapPin, FileText } from 'lucide-react';

export interface ActivityTimelineProps {
  events: CaseEvent[];
  limit?: number;
  className?: string;
}

export function ActivityTimeline({ events, limit = 5, className }: ActivityTimelineProps) {
  const displayEvents = events.slice(0, limit);

  if (displayEvents.length === 0) {
    return (
      <div className={cn('py-4 text-center text-xs text-muted', className)}>
        No recent activity recorded.
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'TASK_COMPLETED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />;
      case 'BUDGET_UPDATED':
        return <DollarSign className="w-3.5 h-3.5 text-forest" />;
      case 'DESTINATION_CONFIRMED':
        return <MapPin className="w-3.5 h-3.5 text-clay" />;
      case 'QUOTE_APPLIED':
        return <FileText className="w-3.5 h-3.5 text-forest" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-muted" />;
    }
  };

  const renderEventDescription = (event: CaseEvent) => {
    const p = event.payload || {};
    switch (event.type) {
      case 'TASK_COMPLETED': {
        const note = p.completionNotes || p.note;
        const assignedTo = p.assignedTo;
        const completedBy = p.completedBy;
        const completedOnBehalf =
          assignedTo &&
          completedBy &&
          assignedTo.toLowerCase().trim() !== completedBy.toLowerCase().trim();

        return (
          <div className="space-y-1">
            <span className="font-semibold text-[#183331]">
              Completed &ldquo;{p.taskTitle || 'Task'}&rdquo;
            </span>
            {completedOnBehalf && (
              <div className="text-[11px] text-[#71847D]">
                Completed by <strong className="text-[#183331]">{completedBy}</strong> &bull; Assigned to <strong className="text-[#183331]">{assignedTo}</strong>
              </div>
            )}
            {note && (
              <div className="text-[11px] text-[#4F635B] italic bg-[#F4F7F5] px-2.5 py-1 rounded-lg border border-[#E3E9E5]">
                &ldquo;{note}&rdquo;
              </div>
            )}
          </div>
        );
      }
      case 'TASK_REOPENED':
        return <span>Reopened &ldquo;{p.taskTitle || 'Task'}&rdquo;</span>;
      case 'BUDGET_UPDATED':
        return <span>Case budget updated to ${p.budget?.toLocaleString()}</span>;
      case 'DESTINATION_CONFIRMED':
        return (
          <span>
            Discharge destination confirmed:{' '}
            <strong className="text-[#183331]">
              {p.destinationStatus === 'REHAB_FIRST'
                ? 'Short-term rehab first'
                : p.destinationStatus === 'RETURN_HOME'
                ? 'Direct return home'
                : p.destinationStatus}
            </strong>
          </span>
        );
      case 'TARGET_DATE_CHANGED':
        return <span>Target dates updated to {p.targetDate || p.dischargeDate}</span>;
      case 'TASK_ASSIGNED':
        return <span>Assigned task to <strong className="text-[#183331]">{p.assigneeName || 'team member'}</strong></span>;
      case 'QUOTE_APPLIED':
        return (
          <span>
            Applied ${p.amount?.toLocaleString()} {p.category || 'vendor'} quote from{' '}
            <strong className="text-[#183331]">{p.providerName || 'vendor'}</strong>
          </span>
        );
      case 'PLAN_GENERATED':
        return <span>Transition plan generated with ordered priorities</span>;
      default:
        return <span>{event.type.replace(/_/g, ' ').toLowerCase()}</span>;
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {displayEvents.map((evt) => {
        const actorLabel =
          evt.payload?.completedBy ||
          evt.payload?.updatedBy ||
          (evt.actorType === 'AI' ? 'Nora' : 'Family Care Circle');

        return (
          <div key={evt.id} className="flex items-start gap-3 text-xs">
            <div className="w-6 h-6 rounded-full bg-stone-subtle flex items-center justify-center shrink-0 mt-0.5">
              {getEventIcon(evt.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-charcoal leading-snug">
                {renderEventDescription(evt)}
              </div>
              <p className="text-[11px] text-muted mt-1">
                {actorLabel} &bull;{' '}
                {new Date(evt.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
