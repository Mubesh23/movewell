'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AIAssistant } from '@/components/assistant/AIAssistant';
import { QuoteUploader } from '@/components/documents/QuoteUploader';
import { PageHeader } from '@/components/movewell/PageHeader';
import { SectionHeader } from '@/components/movewell/SectionHeader';
import { BudgetSummary } from '@/components/movewell/BudgetSummary';
import { CostLine } from '@/components/movewell/CostLine';
import { QuoteSummary } from '@/components/movewell/QuoteSummary';
import { Section } from '@/components/ui/Section';
import { CaseOverview } from '@/types';

export default function BudgetPage() {
  const params = useParams();
  const caseId = params.caseId as string;

  const [overview, setOverview] = useState<CaseOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setOverview(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (caseId) fetchOverview();
  }, [caseId, fetchOverview]);

  if (loading || !overview) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-forest border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { costSummary, tasks, seniorProfile, daysUntilDischarge, costItems = [] } = overview;
  const isOver = costSummary.budgetGap > 0;

  const summaryItems = [
    { label: 'Available Budget', value: `$${costSummary.userBudget.toLocaleString()}` },
    {
      label: 'Expected Total',
      value: `$${costSummary.minTotal.toLocaleString()} \u2013 $${costSummary.maxTotal.toLocaleString()}`,
    },
    {
      label: 'Status',
      value: isOver
        ? `+$${costSummary.budgetGap.toLocaleString()} Over`
        : 'Funded',
    },
  ];

  return (
    <div className="min-h-screen bg-canvas flex flex-col font-sans">
      <Navbar
        caseId={caseId}
        seniorName={`${seniorProfile.name}'s Budget`}
        daysUntilDischarge={daysUntilDischarge}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        <PageHeader
          title="Cost & Budget Ledger"
          subtitle={`Deterministic planning ranges and confirmed vendor quotes for ${seniorProfile.name}'s post-hospital transition.`}
          statusLabel={isOver ? `+$${costSummary.budgetGap.toLocaleString()} Over` : 'Within Budget'}
          statusVariant={isOver ? 'warning' : 'completed'}
          summaryItems={summaryItems}
        />

        {/* Ledger Overview */}
        <Section>
          <SectionHeader
            eyebrow="Financial Ledger"
            title="Overview & Contingency"
            subtitle="Comparing family budget against calculated ranges and confirmed vendor quotes."
          />
          <div className="mt-4">
            <BudgetSummary costSummary={costSummary} costItems={costItems} />
          </div>
        </Section>

        {/* Quote Intelligence */}
        <Section>
          <SectionHeader
            eyebrow="Quote Intelligence"
            title="Vendor Quote Intake"
            subtitle="Upload or paste vendor estimates. MoveWell extracts amounts and line items to refine your plan without overwriting your stated budget."
          />
          <div className="mt-4">
            <QuoteUploader
              caseId={caseId}
              currentBudget={costSummary.userBudget}
              onBudgetUpdated={() => fetchOverview()}
            />
          </div>
        </Section>

        {/* Applied Quotes */}
        {costItems.length > 0 && (
          <Section>
            <SectionHeader
              eyebrow="Confirmed Quotes"
              title="Applied Vendor Quotes"
              subtitle="These confirmed quotes have replaced planning estimates in your total expected costs."
            />
            <div className="mt-4 space-y-3">
              {costItems.map((quote) => (
                <QuoteSummary key={quote.id} quote={quote} />
              ))}
            </div>
          </Section>
        )}

        {/* Task Cost Breakdown */}
        <Section>
          <SectionHeader
            eyebrow="Itemized Breakdown"
            title="Task Cost Estimates"
            subtitle="Individual cost ranges assigned to action items across all transition phases. Applied quotes supersede planning estimates."
          />
          <div className="mt-4 divide-y divide-stone-line/60">
            {tasks
              .filter((t) => t.minEstimatedCost > 0 || t.maxEstimatedCost > 0)
              .map((t) => {
                const isMovingTask =
                  t.templateId?.includes('move') ||
                  t.title.toLowerCase().includes('mover') ||
                  t.title.toLowerCase().includes('moving');

                const appliedQuote = isMovingTask
                  ? costItems.find((ci) => ci.category === 'moving')
                  : undefined;

                if (appliedQuote && appliedQuote.amount) {
                  return (
                    <CostLine
                      key={t.id}
                      category={t.phase.replace('_', ' ')}
                      title={t.title}
                      subtitle={`Replaced by applied quote: ${appliedQuote.providerName || 'Vendor'}`}
                      amount={`$${appliedQuote.amount.toLocaleString()}`}
                      type="QUOTE"
                      previousEstimate={`$${t.minEstimatedCost.toLocaleString()} \u2013 $${t.maxEstimatedCost.toLocaleString()}`}
                    />
                  );
                }

                return (
                  <CostLine
                    key={t.id}
                    category={t.phase.replace('_', ' ')}
                    title={t.title}
                    subtitle={t.whyItMatters || t.description}
                    amount={`$${t.minEstimatedCost.toLocaleString()} \u2013 $${t.maxEstimatedCost.toLocaleString()}`}
                    type="ESTIMATE"
                  />
                );
              })}
          </div>
        </Section>
      </main>

      <AIAssistant caseId={caseId} onPlanUpdated={fetchOverview} />
      <MobileNav caseId={caseId} />
    </div>
  );
}
