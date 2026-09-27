'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CaseOverview } from '@/types';
import { Printer, CheckCircle2 } from 'lucide-react';
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

  const { caseData, seniorProfile, members, tasks, costSummary } = overview;

  const primaryLead = members.find((m) => m.role === 'OWNER') || members[0];
  const localSupport = members.find((m) => m.isLocal && m.id !== primaryLead?.id) || members.find((m) => m.isLocal);

  return (
    <div className="min-h-screen bg-white text-charcoal font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
      {/* Print Action Bar (Hidden on print) */}
      <div className="print:hidden flex items-center justify-between pb-6 border-b border-stone-line">
        <div>
          <h1 className="text-xl font-serif font-bold text-charcoal">Printable Transition Plan</h1>
          <p className="text-xs text-muted">Share with family, hospital discharge coordinators, or move managers</p>
        </div>
        <Button
          onClick={() => window.print()}
          className="gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save to PDF</span>
        </Button>
      </div>

      {/* Printable Header */}
      <div className="border-b-2 border-forest pb-6 flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-serif font-bold text-2xl text-forest">MoveWell</span>
            <span className="text-[11px] text-muted uppercase tracking-widest font-semibold">· Transition Plan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
            {seniorProfile.name}&apos;s Transition Plan
          </h2>
          <p className="text-xs text-muted mt-1.5">
            Post-Hospital Transition &bull; Area ZIP: {caseData.zipCode} &bull; Target Move: {caseData.targetDate || 'Pending target'}
          </p>
        </div>

        <div className="text-right space-y-1 shrink-0">
          <span className="inline-block px-3 py-1 bg-stone-subtle text-forest font-semibold text-xs rounded-full border border-stone-border">
            {caseData.urgency.replace('_', ' ')}
          </span>
          {caseData.dischargeDate && (
            <p className="text-xs text-muted font-medium">
              Discharge: {caseData.dischargeDate}
            </p>
          )}
        </div>
      </div>

      {/* Key Details Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-stone-line bg-canvas">
        <div>
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Primary Coordinator</p>
          {primaryLead ? (
            <>
              <p className="text-sm font-semibold text-charcoal">{primaryLead.name} {primaryLead.relationship ? `(${primaryLead.relationship})` : ''}</p>
              <p className="text-xs text-muted">{primaryLead.city || 'Location unlisted'} ({primaryLead.isLocal ? 'Local' : 'Remote'})</p>
            </>
          ) : (
            <p className="text-xs text-muted italic">Not designated</p>
          )}
        </div>

        <div>
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Local Support</p>
          {localSupport ? (
            <>
              <p className="text-sm font-semibold text-charcoal">{localSupport.name} {localSupport.relationship ? `(${localSupport.relationship})` : ''}</p>
              <p className="text-xs text-muted">{localSupport.city || 'Local Area'} (In-Person)</p>
            </>
          ) : (
            <p className="text-xs text-muted italic">No local members designated</p>
          )}
        </div>

        <div>
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Estimated Budget</p>
          <p className="text-sm font-bold text-forest">
            ${costSummary.minTotal.toLocaleString()} &ndash; ${costSummary.maxTotal.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted">
            Stated budget: {costSummary.userBudget ? `$${costSummary.userBudget.toLocaleString()}` : 'Not set'}
          </p>
        </div>
      </div>

      {/* Task Checklist */}
      <div className="space-y-4">
        <h3 className="text-lg font-serif font-bold text-charcoal border-b border-stone-line pb-2">
          Transition Action Items ({tasks.length})
        </h3>

        <div className="space-y-3">
          {tasks.map((task) => {
            const isDone = task.status === 'COMPLETED';
            return (
              <div key={task.id} className="p-3.5 rounded-lg border border-stone-line space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full border ${isDone ? 'bg-forest border-forest' : 'border-stone-text bg-white'}`} />
                    <span className={`font-semibold text-sm ${isDone ? 'line-through text-muted' : 'text-charcoal'}`}>
                      {task.title}
                    </span>
                  </div>
                  <span className="font-semibold text-muted bg-stone-subtle px-2 py-0.5 rounded text-[10px] uppercase">
                    {task.status}
                  </span>
                </div>

                {task.whyItMatters && (
                  <p className="text-muted pl-5 text-[11px] leading-relaxed">
                    <strong className="text-charcoal">Why:</strong> {task.whyItMatters}
                  </p>
                )}

                <div className="flex items-center gap-4 pl-5 text-[11px] text-muted flex-wrap">
                  {task.dueDate && <span>Due: {task.dueDate}</span>}
                  {task.assignee && <span>Assigned: {task.assignee.name}</span>}
                  {(task.minEstimatedCost > 0 || task.maxEstimatedCost > 0) && (
                    <span>Est: ${task.minEstimatedCost.toLocaleString()} &ndash; ${task.maxEstimatedCost.toLocaleString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer Footer */}
      <div className="pt-6 border-t border-stone-line text-center text-xs text-muted italic">
        &ldquo;{costSummary.disclaimer}&rdquo; &bull; Generated by MoveWell Transition Platform &bull; {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
