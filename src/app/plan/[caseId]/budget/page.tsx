'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { NoraReadCard } from '@/components/movewell/NoraReadCard';
import { QuoteUploader } from '@/components/documents/QuoteUploader';
import { QuoteSummary } from '@/components/movewell/QuoteSummary';
import { CostLine } from '@/components/movewell/CostLine';
import { openNoraWithPrompt } from '@/components/assistant/AIAssistant';
import { evidenceService } from '@/services/evidence-service';
import { CaseOverview } from '@/types';
import {
  WalletCards,
  Check,
  CircleHelp,
  FileText,
  UploadCloud,
  ArrowUpRight,
  TrendingDown,
  DollarSign,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export default function BudgetPage() {
  const params = useParams();
  const caseId = params.caseId as string;
  const quoteUploaderRef = useRef<HTMLDivElement>(null);

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

  const scrollToQuoteUploader = () => {
    if (quoteUploaderRef.current) {
      quoteUploaderRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading || !overview) {
    return (
      <div className="min-h-screen bg-[#f7f8f5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1f4d45] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { costSummary, tasks, seniorProfile, daysUntilDischarge, costItems = [] } = overview;
  const hasBudget = typeof costSummary.userBudget === 'number' && costSummary.userBudget > 0;
  const isOver = hasBudget && costSummary.budgetGap > 0;

  // Calculate confirmed quote total
  const confirmedQuotesTotal = costItems.reduce((acc, item) => acc + (item.amount || 0), 0);

  return (
    <WorkspaceShell
      caseId={caseId}
      seniorName={seniorProfile.name}
      daysUntilDischarge={daysUntilDischarge}
    >
      <div className="space-y-8">
        {/* Editorial Page Header */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#71847d]">
              <span>Family workspace</span>
              <span className="size-1 rounded-full bg-[#b8c8bd]" />
              <span>Living budget</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-[#183331]">
              Costs & decisions
            </h1>
            <p className="mt-1.5 max-w-xl text-xs sm:text-sm leading-relaxed text-[#71847d]">
              Keep estimates, quotes, and confirmed expenses together so the family can make decisions with confidence.
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToQuoteUploader}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-[#1f4d45] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#153c36] transition-colors md:self-auto shadow-2xs"
          >
            <UploadCloud size={16} />
            <span>Add vendor quote</span>
          </button>
        </div>

        {/* 3 Summary Stat Cards */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between text-[#82928b]">
              <span className="text-xs font-semibold uppercase tracking-wider">Estimated total</span>
              <div className="grid size-8 place-items-center rounded-lg bg-[#eff7f0] text-[#3f6c5c]">
                <WalletCards size={16} />
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-[#183331]">
              ${costSummary.minTotal.toLocaleString()} &ndash; ${costSummary.maxTotal.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-[#71847d]">
              {confirmedQuotesTotal > 0 ? 'Includes confirmed quotes' : 'Through post-hospital transition'}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between text-[#82928b]">
              <span className="text-xs font-semibold uppercase tracking-wider">Confirmed quotes</span>
              <div className="grid size-8 place-items-center rounded-lg bg-[#eff7f0] text-[#3f6c5c]">
                <Check size={16} />
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-[#183331]">
              ${confirmedQuotesTotal.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-[#71847d]">
              {costItems.length} {costItems.length === 1 ? 'quote' : 'quotes'} applied to plan
            </p>
          </div>

          <div className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between text-[#82928b]">
              <span className="text-xs font-semibold uppercase tracking-wider">Budget health</span>
              <div className="grid size-8 place-items-center rounded-lg bg-[#eff7f0] text-[#3f6c5c]">
                <CircleHelp size={16} />
              </div>
            </div>
            <p
              className={`mt-3 text-2xl sm:text-3xl font-semibold tracking-[-0.03em] ${
                !hasBudget
                  ? 'text-[#183331]'
                  : isOver
                  ? 'text-[#b9382c]'
                  : 'text-[#356553]'
              }`}
            >
              {!hasBudget
                ? 'Open ledger'
                : isOver
                ? `+$${costSummary.budgetGap.toLocaleString()} Over`
                : 'Within budget'}
            </p>
            <p className="mt-1 text-xs text-[#71847d]">
              {!hasBudget
                ? 'No family budget cap set'
                : isOver
                ? 'Exceeds stated family budget'
                : `$${Math.abs(costSummary.budgetGap).toLocaleString()} remaining`}
            </p>
          </div>
        </section>

        {/* 2-Column Responsive Workspace Grid */}
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          {/* Main Left Column */}
          <div className="space-y-6">
            {/* Quote Intelligence / Intake */}
            <div ref={quoteUploaderRef}>
              <section className="rounded-2xl border border-[#e0e9e2] bg-white p-5 md:p-6 shadow-2xs">
                <div className="border-b border-[#e7eee8] pb-4 mb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-base text-[#183331]">Vendor quote intake</h2>
                      <p className="mt-0.5 text-xs text-[#879890]">
                        Upload or paste vendor estimates. BridgeWell extracts amounts and line items to refine your plan without overwriting your stated budget.
                      </p>
                    </div>
                    <span className="hidden sm:inline-block rounded-full bg-[#e8f1ea] px-2.5 py-1 text-xs font-semibold text-[#3f6c5c]">
                      AI quote extraction
                    </span>
                  </div>
                </div>

                <QuoteUploader
                  caseId={caseId}
                  currentBudget={costSummary.userBudget}
                  onBudgetUpdated={() => fetchOverview()}
                />
              </section>
            </div>

            {/* Applied Confirmed Quotes */}
            {costItems.length > 0 && (
              <section className="rounded-2xl border border-[#e0e9e2] bg-white p-5 md:p-6 shadow-2xs">
                <div className="border-b border-[#e7eee8] pb-4 mb-4">
                  <h2 className="font-semibold text-base text-[#183331]">Confirmed vendor quotes</h2>
                  <p className="mt-0.5 text-xs text-[#879890]">
                    These confirmed quotes have replaced planning estimates in your total expected costs.
                  </p>
                </div>
                <div className="space-y-3">
                  {costItems.map((quote) => (
                    <QuoteSummary key={quote.id} quote={quote} />
                  ))}
                </div>
              </section>
            )}

            {/* Task Cost Breakdown */}
            <section className="rounded-2xl border border-[#e0e9e2] bg-white p-5 md:p-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#e7eee8] pb-4 mb-2">
                <div>
                  <h2 className="font-semibold text-base text-[#183331]">Transition costs by task</h2>
                  <p className="mt-0.5 text-xs text-[#879890]">
                    BridgeWell keeps estimates separate from confirmed costs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openNoraWithPrompt(`Can you explain the breakdown of estimated expenses for ${seniorProfile.name}?`)}
                  className="text-xs font-semibold text-[#3f6c5c] hover:text-[#1f4d45] transition-colors"
                >
                  Analyze costs &rarr;
                </button>
              </div>

              <div className="divide-y divide-[#edf2ee]">
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

                    const evidence = evidenceService.getEvidenceForCategory(
                      t.templateId || t.title,
                      overview.caseData.zipCode
                    );

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
                          evidenceSummary={evidence || undefined}
                          caseId={caseId}
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
                        evidenceSummary={evidence || undefined}
                        caseId={caseId}
                      />
                    );
                  })}
              </div>
            </section>
          </div>

          {/* Right Aside Column */}
          <aside className="flex flex-col gap-6">
            {/* Nora Read Card */}
            <NoraReadCard
              eyebrow="Nora's read"
              headline={
                isOver
                  ? 'Budget gap identified'
                  : costItems.length > 0
                  ? 'One decision is ready.'
                  : 'Planning estimates are set.'
              }
              explanation={
                isOver
                  ? `Expected expenses exceed your family target by $${costSummary.budgetGap.toLocaleString()}. Nora can help find county assistance, slide-scale options, or adjust scope.`
                  : costItems.length > 0
                  ? `Confirmed quotes have locked in $${confirmedQuotesTotal.toLocaleString()} of your plan. Reviewing remaining items keeps the transition on track.`
                  : `Deterministic cost ranges give your family an upfront forecast. Upload vendor quotes as you receive them to lock in exact pricing.`
              }
              actionLabel={
                isOver
                  ? 'Ask Nora for lower-cost options'
                  : costItems.length > 0
                  ? 'Review remaining tasks'
                  : 'Explore cost-saving resources'
              }
              onAction={() =>
                openNoraWithPrompt(
                  isOver
                    ? `How can our family reduce costs for ${seniorProfile.name}'s transition without compromising safety?`
                    : costItems.length > 0
                    ? `Review our budget for ${seniorProfile.name} and tell me what financial decisions remain.`
                    : `What free or subsidized resources are available for ${seniorProfile.name}'s care and transition?`
                )
              }
            />

            {/* Financial Ledger Health Card */}
            <section className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-2xs">
              <h2 className="font-semibold text-[#183331]">Financial ledger overview</h2>
              <p className="mt-1 text-xs text-[#71847d]">
                Deterministic planning ranges vs family stated budget
              </p>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-[#edf2ee]">
                  <span className="text-[#71847d]">Stated budget:</span>
                  <span className="font-semibold text-[#183331]">
                    {hasBudget ? `$${costSummary.userBudget!.toLocaleString()}` : 'Open / Unset'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#edf2ee]">
                  <span className="text-[#71847d]">Calculated range:</span>
                  <span className="font-semibold text-[#1f4d45]">
                    ${costSummary.minTotal.toLocaleString()} &ndash; ${costSummary.maxTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#edf2ee]">
                  <span className="text-[#71847d]">Confirmed quotes:</span>
                  <span className="font-semibold text-[#183331]">
                    ${confirmedQuotesTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="mt-5 pt-4 border-t border-[#edf2ee] flex items-start gap-2.5 text-xs text-[#668077]">
                <ShieldCheck size={16} className="text-[#3f6c5c] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Provenance & Integrity:</strong> Quotes are never invented or silently overwritten. Every number tracks back to an uploaded document or regional market survey.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </WorkspaceShell>
  );
}
