'use client';

import React from 'react';
import { TransitionPulseMetrics } from '@/types';
import { Activity, CheckCircle2, Clock, AlertTriangle, UserCheck, DollarSign } from 'lucide-react';

interface TransitionPulseProps {
  pulse?: TransitionPulseMetrics;
}

export const TransitionPulse: React.FC<TransitionPulseProps> = ({ pulse }) => {
  if (!pulse) return null;

  return (
    <div className="bg-white border border-line rounded-2xl p-5 shadow-2xs">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-line/70">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-evergreen" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink">Transition Pulse</h3>
        </div>
        <span className="text-[11px] text-muted-ink">Operational snapshot</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-line/70">
        {/* 1. Critical Decisions */}
        <div className="pt-2 sm:pt-0 sm:px-3 first:pl-0">
          <span className="text-[11px] text-muted-ink block mb-1">Critical decisions</span>
          <div className="flex items-baseline gap-1.5">
            <strong className="text-base font-bold text-ink">
              {pulse.criticalDecisions.resolved} / {pulse.criticalDecisions.total}
            </strong>
            <span className="text-[11px] text-muted-ink">resolved</span>
          </div>
        </div>

        {/* 2. This Week */}
        <div className="pt-2 sm:pt-0 sm:px-3">
          <span className="text-[11px] text-muted-ink block mb-1">This week</span>
          <div className="flex items-baseline gap-1.5">
            <strong className="text-base font-bold text-ink">
              {pulse.thisWeekTasksRemaining}
            </strong>
            <span className="text-[11px] text-muted-ink">remaining</span>
          </div>
        </div>

        {/* 3. Blocked */}
        <div className="pt-2 sm:pt-0 sm:px-3">
          <span className="text-[11px] text-muted-ink block mb-1">Blocked</span>
          <div className="flex items-baseline gap-1.5">
            <strong className={`text-base font-bold ${pulse.blockedCount > 0 ? 'text-amber' : 'text-muted-ink'}`}>
              {pulse.blockedCount}
            </strong>
            <span className="text-[11px] text-muted-ink">waiting</span>
          </div>
        </div>

        {/* 4. Unassigned */}
        <div className="pt-2 sm:pt-0 sm:px-3">
          <span className="text-[11px] text-muted-ink block mb-1">Unassigned</span>
          <div className="flex items-baseline gap-1.5">
            <strong className={`text-base font-bold ${pulse.unassignedCount > 0 ? 'text-amber' : 'text-muted-ink'}`}>
              {pulse.unassignedCount}
            </strong>
            <span className="text-[11px] text-muted-ink">tasks</span>
          </div>
        </div>

        {/* 5. Budget */}
        <div className="pt-2 sm:pt-0 sm:px-3 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-muted-ink block mb-1">Budget</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                pulse.budgetAssessment === 'Within planning range'
                  ? 'bg-evergreen'
                  : pulse.budgetAssessment === 'Exceeds budget'
                  ? 'bg-amber'
                  : 'bg-muted-ink'
              }`}
            />
            <strong className="text-xs font-semibold text-ink truncate" title={pulse.budgetAssessmentDetail}>
              {pulse.budgetAssessment}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
