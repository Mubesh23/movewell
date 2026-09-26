'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { CaseOverview } from '@/types';
import { DollarSign, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function BudgetPage() {
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
        });
    }
  }, [caseId]);

  if (loading || !overview) {
    return (
      <div className="min-h-screen bg-sand-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { costSummary, tasks, seniorProfile, daysUntilDischarge } = overview;

  return (
    <div className="min-h-screen bg-sand-100 flex flex-col">
      <Navbar
        caseId={caseId}
        seniorName={`${seniorProfile.name}'s Budget`}
        daysUntilDischarge={daysUntilDischarge}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs">
          <h1 className="text-2xl font-serif font-bold text-brand-950">Cost &amp; Budget Estimation</h1>
          <p className="text-xs text-stone-500 font-medium mt-1">
            Deterministic planning ranges for Maria&apos;s post-hospital transition
          </p>
        </div>

        {/* Disclaimer Alert Box */}
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0" />
          <p className="text-xs text-amber-900 font-semibold italic">
            &ldquo;{costSummary.disclaimer}&rdquo;
          </p>
        </div>

        {/* Budget Comparison Card */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-sand-50 border border-sand-300">
              <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">User Budget</p>
              <p className="text-2xl font-bold text-stone-900">${costSummary.userBudget.toLocaleString()}</p>
            </div>

            <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200">
              <p className="text-xs text-brand-800 font-bold uppercase tracking-wider mb-1">Estimated Range</p>
              <p className="text-2xl font-bold text-brand-950">
                ${costSummary.minTotal.toLocaleString()} &ndash; ${costSummary.maxTotal.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sand-50 border border-sand-300">
              <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Max Budget Status</p>
              <p className={`text-xl font-bold ${costSummary.budgetGap > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {costSummary.budgetGap > 0
                  ? `+$${costSummary.budgetGap.toLocaleString()} Over`
                  : `Within Budget`}
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-4">
          <h3 className="text-lg font-serif font-bold text-brand-950">Task Cost Breakdown</h3>
          <div className="space-y-3">
            {tasks
              .filter((t) => t.minEstimatedCost > 0 || t.maxEstimatedCost > 0)
              .map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-sand-50 border border-stone-200">
                  <div>
                    <p className="font-bold text-sm text-stone-900">{t.title}</p>
                    <p className="text-xs text-stone-500">{t.phase.replace('_', ' ')}</p>
                  </div>
                  <p className="font-bold text-sm text-brand-900">
                    ${t.minEstimatedCost} &ndash; ${t.maxEstimatedCost}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>

      <MobileNav caseId={caseId} />
    </div>
  );
}
