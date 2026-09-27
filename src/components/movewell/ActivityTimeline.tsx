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

  const getEventDescription = (event: CaseEvent) => {
    const p = event.payload || {};
    switch (event.type) {
      case 'TASK_COMPLETED':
        return `Completed "${p.taskTitle || 'Task'}"${p.note ? ` — "${p.note}"` : ''}`;
      case 'BUDGET_UPDATED':
        return `Case budget updated to $${p.budget?.toLocaleString()}`;
      case 'DESTINATION_CONFIRMED':
        return `Discharge destination confirmed: ${p.destinationStatus}`;
      case 'TARGET_DATE_CHANGED':
        return `Target dates updated to ${p.targetDate || p.dischargeDate}`;
      case 'TASK_ASSIGNED':
        return `Assigned task to ${p.assigneeName || 'team member'}`;
      case 'QUOTE_APPLIED':
        return `Applied $${p.amount?.toLocaleString()} ${p.category || 'vendor'} quote from ${p.providerName || 'vendor'}`;
      case 'PLAN_GENERATED':
        return 'Transition plan generated with ordered priorities';
      default:
        return event.type.replace(/_/g, ' ').toLowerCase();
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {displayEvents.map((evt) => (
        <div key={evt.id} className="flex items-start gap-3 text-xs">
          <div className="w-6 h-6 rounded-full bg-stone-subtle flex items-center justify-center shrink-0 mt-0.5">
            {getEventIcon(evt.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-charcoal font-medium leading-snug">
              {getEventDescription(evt)}
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              {evt.actorType === 'AI' ? 'Nora (AI)' : 'Family coordinator'} &bull;{' '}
              {new Date(evt.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
