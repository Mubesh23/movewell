'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CaseOverview } from '@/types';
import { Printer, CheckCircle2, Phone, Calendar, DollarSign, UserCheck, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PrintPlanPage() {
  const params = useParams();
  const caseId = params.caseId as string;

  const [overview, setOverview] = useState<CaseOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (caseId) {
      fetch(`/api/cases/${caseId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setOverview(data.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [caseId]);

  if (loading || !overview) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-8 font-sans">
        <p className="text-sm font-medium text-charcoal">Loading Printable Plan…</p>
      </div>
    );
  }

  const { caseData, seniorProfile, members, tasks, costSummary, costItems = [] } = overview;

  const primaryLead = members.find((m) => m.role === 'OWNER') || members[0];
  const localSupport = members.find((m) => m.isLocal && m.id !== primaryLead?.id) || members.find((m) => m.isLocal);

  // Group tasks into Next Actions (Ready/In Progress) and Later Tasks
  const nextActions = tasks.filter((t) => t.status === 'READY' || t.status === 'IN_PROGRESS');
  const otherTasks = tasks.filter((t) => t.status !== 'READY' && t.status !== 'IN_PROGRESS');

  return (
    <div className="min-h-screen bg-white text-charcoal font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
      {/* Print Action Bar (Hidden on print) */}
      <div className="print:hidden flex items-center justify-between pb-6 border-b border-stone-line">
        <div>
          <h1 className="text-xl font-serif font-bold text-charcoal">Printable Transition Plan</h1>
          <p className="text-xs text-muted">
            Share with family members, hospital discharge coordinators, or senior move managers.
          </p>
        </div>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" />
          <span>Print / Save to PDF</span>
        </Button>
      </div>

      {/* Printable Header */}
      <div className="border-b-2 border-forest pb-6 flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-serif font-bold text-2xl text-forest">MoveWell</span>
            <span className="text-[11px] text-muted uppercase tracking-widest font-semibold">
              · Living Transition Plan
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
            {seniorProfile.name}&apos;s Care &amp; Transition Plan
          </h2>
          <p className="text-xs text-muted mt-1.5 flex items-center gap-3">
            <span>Location: {caseData.zipCode && caseData.zipCode !== 'UNSET' ? `ZIP ${caseData.zipCode}` : 'Local area'}</span>
            <span>&bull;</span>
            <span>Target Move-in: {caseData.targetDate || 'Pending confirmation'}</span>
            <span>&bull;</span>
            <span>Printed: {new Date().toLocaleDateString()}</span>
          </p>
        </div>

        <div className="text-right space-y-1 shrink-0">
          <span className="inline-block px-3 py-1 bg-stone-subtle text-forest font-semibold text-xs rounded-full border border-stone-border">
            {caseData.urgency.replace('_', ' ')} PRIORITY
          </span>
          {caseData.dischargeDate && (
            <p className="text-xs text-charcoal font-bold">
              Discharge: {caseData.dischargeDate}
            </p>
          )}
        </div>
      </div>

      {/* Critical Contacts & Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-stone-line bg-canvas">
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
            Primary Coordinator
          </p>
          {primaryLead ? (
            <>
              <p className="text-sm font-semibold text-charcoal">
                {primaryLead.name} {primaryLead.relationship ? `(${primaryLead.relationship})` : ''}
              </p>
              <p className="text-xs text-muted">
                {primaryLead.city || 'Regional'} &bull; {primaryLead.isLocal ? 'In-Person / Local' : 'Coordinating Remotely'}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted italic">Not designated</p>
          )}
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
            Local Support / Family
          </p>
          {localSupport ? (
            <>
              <p className="text-sm font-semibold text-charcoal">
                {localSupport.name} {localSupport.relationship ? `(${localSupport.relationship})` : ''}
              </p>
              <p className="text-xs text-muted">
                {localSupport.city || 'Nearby'} &bull; In-Person Support
              </p>
            </>
          ) : (
            <p className="text-xs text-muted italic">No local members designated</p>
          )}
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
            Financial Ledger Summary
          </p>
          <p className="text-sm font-bold text-forest">
            ${costSummary.minTotal.toLocaleString()} &ndash; ${costSummary.maxTotal.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted">
            Target Budget: {costSummary.userBudget ? `$${costSummary.userBudget.toLocaleString()}` : 'Open / Unset'}
          </p>
        </div>
      </div>

      {/* 1. Next Important Actions (Priority Section) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-stone-line pb-2">
          <h3 className="text-base font-serif font-bold text-charcoal">
            Immediate Next Actions ({nextActions.length})
          </h3>
          <span className="text-[11px] text-muted font-medium">Ready for immediate attention</span>
        </div>

        <div className="space-y-2.5">
          {nextActions.map((task) => (
            <div key={task.id} className="p-3 rounded-lg border border-forest/30 bg-surface space-y-1 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded border-2 border-forest mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-sm text-charcoal block">{task.title}</strong>
                    {task.whyItMatters && (
                      <p className="text-muted text-[11px] mt-0.5">{task.whyItMatters}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-semibold text-forest text-[11px] block">
                    {task.assignee ? task.assignee.name : 'Unassigned'}
                  </span>
                  {task.dueDate && (
                    <span className="text-[10px] text-muted">Due: {task.dueDate}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. All Downstream Tasks */}
      <div className="space-y-3">
        <h3 className="text-base font-serif font-bold text-charcoal border-b border-stone-line pb-2">
          Subsequent Plan Milestones ({otherTasks.length})
        </h3>

        <div className="divide-y divide-stone-line/70">
          {otherTasks.map((task) => {
            const isDone = task.status === 'COMPLETED';
            return (
              <div key={task.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded border ${isDone ? 'bg-forest border-forest' : 'border-stone-text bg-white'}`} />
                  <span className={`font-medium ${isDone ? 'line-through text-muted' : 'text-charcoal'}`}>
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-muted text-[11px] shrink-0">
                  <span>{task.assignee ? task.assignee.name : 'Unassigned'}</span>
                  <span className="uppercase text-[10px] font-semibold">{task.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Directory & Emergency Contacts */}
      <div className="p-4 rounded-xl border border-stone-line bg-canvas space-y-2 text-xs">
        <h4 className="font-bold text-charcoal text-xs uppercase tracking-wider">
          Transition Directory &amp; Support Numbers
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <strong>Area Agency on Aging / Senior Helpline:</strong>
            <p className="text-muted">1-800-252-9240 (Free information &amp; public programs)</p>
          </div>
          <div>
            <strong>Hospital Social Work &amp; Discharge Desk:</strong>
            <p className="text-muted">Refer to hospital discharge folder for direct desk line</p>
          </div>
        </div>
      </div>

      {/* Disclaimer Footer */}
      <div className="pt-6 border-t border-stone-line text-center text-xs text-muted italic">
        &ldquo;{costSummary.disclaimer}&rdquo; &bull; Generated by MoveWell Transition Platform &bull; {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
