import React from 'react';
import { cn } from '@/lib/utils';
import { CaseMember, TransitionTask } from '@/types';
import { User, MapPin, CheckCircle2 } from 'lucide-react';

export interface PersonSummaryProps {
  member: CaseMember;
  tasks?: TransitionTask[];
  onSelect?: (member: CaseMember) => void;
  className?: string;
}

export function PersonSummary({
  member,
  tasks = [],
  onSelect,
  className,
}: PersonSummaryProps) {
  const assignedTasks = tasks.filter((t) => t.assigneeId === member.id);
  const completedTasks = assignedTasks.filter((t) => t.status === 'COMPLETED');

  return (
    <div
      onClick={() => onSelect && onSelect(member)}
      className={cn(
        'flex items-center justify-between py-3.5 border-b border-stone-line/70 last:border-b-0 text-sm transition-colors',
        onSelect && 'cursor-pointer hover:bg-stone-subtle/30 px-2 -mx-2 rounded-lg',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-forest/10 text-forest font-semibold text-xs flex items-center justify-center shrink-0">
          {member.name.charAt(0)}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-charcoal truncate">{member.name}</span>
            {member.role === 'OWNER' && (
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 bg-forest/10 text-forest rounded">
                Owner
              </span>
            )}
          </div>
          <p className="text-xs text-muted truncate">
            {member.relationship || 'Support coordinator'}
            {member.city ? ` · ${member.city}` : ''}
            {member.isLocal ? ' (Local)' : ' (Remote)'}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className="text-xs font-medium text-charcoal">
          {assignedTasks.length} {assignedTasks.length === 1 ? 'task' : 'tasks'}
        </span>
        {assignedTasks.length > 0 && (
          <p className="text-[11px] text-muted">
            {completedTasks.length} done
          </p>
        )}
      </div>
    </div>
  );
}
