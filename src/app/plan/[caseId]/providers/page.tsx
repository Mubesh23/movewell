'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Building2, Search, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';

export default function ProvidersPage() {
  const params = useParams();
  const caseId = (params.caseId as string) || '';

  return (
    <WorkspaceShell caseId={caseId}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1e9e3] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#183331]">
                BridgeWell Provider Network
              </h1>
              <span className="text-[11px] font-semibold tracking-wider text-[#9aa9a3] uppercase bg-[#edf2ee] px-2 py-0.5 rounded-full">
                Coming soon
              </span>
            </div>
            <p className="mt-1 text-sm text-[#71847d]">
              Curated network of licensed senior movers, home safety contractors, and short-term rehabilitation partners.
            </p>
          </div>

          <Link
            href={`/plan/${caseId}/resources`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1f4d45] hover:text-[#153c36] bg-[#e8f1ea] px-3.5 py-2 rounded-xl transition-colors shrink-0"
          >
            <span>View Active Resources</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Informational Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-[#e1e9e3] bg-white p-5 shadow-xs">
            <div className="grid size-10 place-items-center rounded-xl bg-[#e8f1ea] text-[#1f4d45] mb-3">
              <ShieldCheck size={20} />
            </div>
            <h2 className="text-base font-semibold text-[#183331]">Credential Verification</h2>
            <p className="mt-2 text-xs leading-5 text-[#71847d]">
              Every network partner is checked for state licensing, bonded liability insurance, and background checks.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e1e9e3] bg-white p-5 shadow-xs">
            <div className="grid size-10 place-items-center rounded-xl bg-[#e8f1ea] text-[#1f4d45] mb-3">
              <HeartHandshake size={20} />
            </div>
            <h2 className="text-base font-semibold text-[#183331]">Senior Move Specialist (NASMM)</h2>
            <p className="mt-2 text-xs leading-5 text-[#71847d]">
              Specialized movers experienced with dementia care, downsizing sensitivity, and floor plan staging.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e1e9e3] bg-white p-5 shadow-xs">
            <div className="grid size-10 place-items-center rounded-xl bg-[#e8f1ea] text-[#1f4d45] mb-3">
              <Search size={20} />
            </div>
            <h2 className="text-base font-semibold text-[#183331]">Transparent Pricing</h2>
            <p className="mt-2 text-xs leading-5 text-[#71847d]">
              Binding estimates and standard rates with zero surprise fees or hidden middleman charges.
            </p>
          </div>
        </div>

        {/* Existing Resource Directory CTA */}
        <div className="rounded-2xl bg-[#fafbfa] border border-[#e1e9e3] p-6 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e8f1ea] text-[#1f4d45] mb-3">
            <Building2 size={24} />
          </div>
          <h2 className="text-base font-bold text-[#183331]">
            Looking for Local Services Right Now?
          </h2>
          <p className="mt-1.5 text-xs text-[#71847d] max-w-md mx-auto leading-relaxed">
            While direct booking is coming soon, you can browse verified public agency programs, nonprofit resources, and directory listings in your loved one&apos;s area right now.
          </p>
          <div className="mt-4">
            <Link
              href={`/plan/${caseId}/resources`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1f4d45] hover:bg-[#153c36] text-white text-xs font-semibold px-4 py-2.5 shadow-xs transition-colors"
            >
              <span>Explore Community Resources</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
