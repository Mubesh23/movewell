'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CostLifecycleStage, CostProvenance, EstimateEvidenceSummary } from '@/types';
import { Info, Check, ExternalLink, Sparkles, Send } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';

export interface CostLineProps {
  category: string;
  title: string;
  subtitle?: string;
  amount: string;
  type: 'ESTIMATE' | 'QUOTE';
  stage?: CostLifecycleStage;
  provenance?: CostProvenance;
  evidenceSummary?: EstimateEvidenceSummary;
  caseId?: string;
  previousEstimate?: string;
  className?: string;
}

export function CostLine({
  category,
  title,
  subtitle,
  amount,
  type,
  stage = type === 'QUOTE' ? 'QUOTED' : 'ESTIMATED',
  provenance,
  evidenceSummary,
  caseId,
  previousEstimate,
  className,
}: CostLineProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const isQuote = type === 'QUOTE';

  // Use real evidenceSummary if provided, otherwise check provenance, otherwise neutral fallback
  const resolvedEvidence = evidenceSummary || provenance?.evidenceSummary;
  const confidence = resolvedEvidence?.confidence || provenance?.confidence || 'Medium';
  const updatedAt = resolvedEvidence?.newestObservedDate || provenance?.updatedAt || 'Current';

  const defaultSources = isQuote
    ? ['Vendor Quote on file']
    : resolvedEvidence && resolvedEvidence.sources.length > 0
    ? resolvedEvidence.sources.map((s) => `${s.publisher}: ${s.title}`)
    : ['Planning estimate · Source details unavailable'];

  const sourcesList = provenance?.sources && provenance.sources.length > 0
    ? provenance.sources
    : defaultSources;

  return (
    <>
      <div className={cn('py-3.5 border-b border-stone-line/70 last:border-b-0 flex items-start justify-between gap-4', className)}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              {category}
            </span>
            <span className="text-muted/40">·</span>
            <span className="text-[10px] font-semibold text-evergreen">
              Stage: {stage}
            </span>
          </div>

          <p className="text-sm font-semibold text-charcoal truncate">{title}</p>
          {subtitle && <p className="text-xs text-muted truncate mt-0.5">{subtitle}</p>}

          {previousEstimate && (
            <p className="text-xs text-muted/70 mt-1 line-through">
              Replaced estimate: {previousEstimate}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-ink flex-wrap">
            <span>Updated {updatedAt}</span>
            <span>·</span>
            <span>Confidence: {confidence}</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => setSourcesOpen(true)}
              className="text-evergreen hover:underline font-semibold inline-flex items-center gap-1"
            >
              <Info size={12} className="text-[#1f4d45]" />
              <span>Why this estimate?</span>
            </button>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className={cn('text-base font-semibold', isQuote ? 'text-[#1f4d45] font-semibold text-lg tracking-[-0.03em]' : 'text-[#183331]')}>
            {amount}
          </p>
          <div className="mt-1">
            {stage === 'ESTIMATED' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                ESTIMATED
              </span>
            )}
            {stage === 'QUOTED' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
                QUOTED
              </span>
            )}
            {stage === 'COMMITTED' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EEF2FF] text-[#3730A3] border border-[#C7D2FE]">
                COMMITTED
              </span>
            )}
            {stage === 'PAID' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                PAID
              </span>
            )}
          </div>
        </div>
      </div>

      {/* External Evidence & Provenance Modal */}
      <Dialog
        open={sourcesOpen}
        onOpenChange={setSourcesOpen}
        title={`Estimate Evidence: ${title}`}
        description="Grounded in published regional tariffs, public rate sheets, and local provider benchmarks."
      >
        <div className="py-2 space-y-4 text-xs">
          {/* Metadata Grid */}
          <div className="p-3.5 rounded-xl bg-[#fafbfa] border border-[#e1e9e3] space-y-2">
            <div className="flex justify-between items-center text-[#71847d]">
              <span>Geography:</span>
              <strong className="text-[#183331] font-semibold">
                {resolvedEvidence?.geography || 'Houston, Texas'}
              </strong>
            </div>
            <div className="flex justify-between items-center text-[#71847d]">
              <span>Evidence Basis:</span>
              <strong className="text-[#183331] font-semibold">
                {resolvedEvidence?.observationCount
                  ? `${resolvedEvidence.observationCount} relevant observation${resolvedEvidence.observationCount > 1 ? 's' : ''}`
                  : 'Workflow Planning Baseline'}
              </strong>
            </div>
            <div className="flex justify-between items-center text-[#71847d]">
              <span>Newest Evidence Date:</span>
              <strong className="text-[#183331] font-semibold">{updatedAt}</strong>
            </div>
            <div className="flex justify-between items-center text-[#71847d]">
              <span>Confidence Rating:</span>
              <span className="px-2 py-0.5 rounded-md bg-[#e8f1ea] text-[#1f4d45] font-bold text-[11px]">
                {confidence}
              </span>
            </div>
          </div>

          {/* Rationale explanation if available */}
          {resolvedEvidence?.rationale && (
            <p className="text-xs text-[#527063] leading-relaxed bg-[#f2f7f3] p-3 rounded-xl border border-[#dcebe0]">
              {resolvedEvidence.rationale}
            </p>
          )}

          {/* Real External Sources with Clickable URLs */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#71847d] block mb-2">
              External Sources & Rate Sheets:
            </span>

            {resolvedEvidence && resolvedEvidence.sources.length > 0 ? (
              <div className="space-y-2">
                {resolvedEvidence.sources.map((src) => (
                  <div
                    key={src.id}
                    className="p-3 rounded-xl border border-[#e1e9e3] bg-white hover:border-[#1f4d45] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-[#183331] flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#1f4d45] shrink-0" />
                          <span>{src.publisher}</span>
                        </div>
                        <p className="text-[11px] text-[#71847d] mt-0.5">{src.title}</p>
                        <p className="text-[10px] text-[#9aa9a3] mt-1">
                          Coverage: {src.geography} · Last verified: {src.lastCheckedAt}
                        </p>
                      </div>

                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1f4d45] hover:text-[#153c36] bg-[#e8f1ea] px-2 py-1 rounded-lg shrink-0 mt-0.5"
                      >
                        <span>View source</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-1.5">
                {sourcesList.map((src, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#183331] font-medium">
                    <Check className="w-3.5 h-3.5 text-[#1f4d45] shrink-0 mt-0.5" />
                    <span>{src}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cost Confirmation Guidance Banner */}
          <div className="rounded-xl bg-[#fafbfa] border border-[#e1e9e3] p-3 text-xs text-[#71847d] leading-relaxed">
            <p>
              Published pricing is useful for planning, but the final cost depends on the exact job. Confirming with local providers will give your family a firm current quote.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#edf2ee]">
            {caseId ? (
              <Link
                href={`/plan/${caseId}/outreach`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1f4d45] hover:text-[#153c36]"
              >
                <Send size={13} />
                <span>Prepare provider outreach</span>
              </Link>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={() => setSourcesOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#1f4d45] text-white text-xs font-semibold hover:bg-[#153c36] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
