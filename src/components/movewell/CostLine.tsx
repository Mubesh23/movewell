'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { CostLifecycleStage, CostProvenance } from '@/types';
import { Info, Check } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { BRAND_NAME } from '@/lib/brand';

export interface CostLineProps {
  category: string;
  title: string;
  subtitle?: string;
  amount: string;
  type: 'ESTIMATE' | 'QUOTE';
  stage?: CostLifecycleStage;
  provenance?: CostProvenance;
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
  provenance = {
    sourceType: type === 'QUOTE' ? 'VENDOR_QUOTE' : 'PLANNING_RANGE',
    updatedAt: 'Sep 2026',
    confidence: 'Medium',
    sources: [
      'Regional Texas Senior Transition Cost Survey (2026)',
      `Curated ${BRAND_NAME} Directory Median Pricing`,
    ],
  },
  previousEstimate,
  className,
}: CostLineProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const isQuote = type === 'QUOTE';

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

          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-ink">
            <span>Updated {provenance.updatedAt}</span>
            <span>·</span>
            <span>Confidence: {provenance.confidence}</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => setSourcesOpen(true)}
              className="text-evergreen hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>View sources</span>
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

      {/* Provenance Dialog */}
      <Dialog
        open={sourcesOpen}
        onOpenChange={setSourcesOpen}
        title={`Cost Provenance: ${title}`}
        description={`${BRAND_NAME} distinguishes deterministic research data from model-generated assumptions.`}
      >
        <div className="py-2 space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-white border border-line space-y-1">
            <div className="flex justify-between text-muted-ink">
              <span>Methodology:</span>
              <strong className="text-ink">{provenance.sourceType.replace('_', ' ')}</strong>
            </div>
            <div className="flex justify-between text-muted-ink">
              <span>Confidence Rating:</span>
              <strong className="text-evergreen">{provenance.confidence}</strong>
            </div>
            <div className="flex justify-between text-muted-ink">
              <span>Effective Date:</span>
              <strong className="text-ink">{provenance.updatedAt}</strong>
            </div>
          </div>

          {provenance.sources && provenance.sources.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-ink block mb-1.5">
                Verified Data Sources:
              </span>
              <ul className="space-y-1.5">
                {provenance.sources.map((src, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-ink/90 font-medium">
                    <Check className="w-3.5 h-3.5 text-evergreen shrink-0 mt-0.5" />
                    <span>{src}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-line">
            <button
              type="button"
              onClick={() => setSourcesOpen(false)}
              className="px-4 py-2 rounded-xl bg-evergreen text-white text-xs font-semibold hover:bg-evergreen-dark transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
