'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { NoraReadCard } from '@/components/movewell/NoraReadCard';
import { openNoraWithPrompt } from '@/components/assistant/AIAssistant';
import { ServiceResource, TransitionCase } from '@/types';
import {
  MapPin,
  Phone,
  ExternalLink,
  ShieldCheck,
  Search,
  Sparkles,
  HeartHandshake,
  Info,
  CheckCircle2,
  Building,
} from 'lucide-react';

function ResourcesContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const caseId = params.caseId as string;
  const initialCategory = searchParams.get('category') || 'ALL';

  const [resources, setResources] = useState<ServiceResource[]>([]);
  const [caseData, setCaseData] = useState<TransitionCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [seniorName, setSeniorName] = useState<string>('Family Member');
  const [daysUntilDischarge, setDaysUntilDischarge] = useState<number | undefined>(undefined);

  const categories = [
    { id: 'ALL', label: 'All Services' },
    { id: 'senior_move_management', label: 'Senior Move Managers' },
    { id: 'moving', label: 'Movers' },
    { id: 'donation', label: 'Donation' },
    { id: 'junk_removal', label: 'Junk Removal' },
    { id: 'home_modification', label: 'Home Modifications' },
    { id: 'storage', label: 'Storage' },
  ];

  useEffect(() => {
    if (caseId) {
      fetch(`/api/cases/${caseId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            if (data.data.caseData) setCaseData(data.data.caseData);
            if (data.data.seniorProfile?.name) setSeniorName(data.data.seniorProfile.name);
            if (data.data.daysUntilDischarge !== undefined) setDaysUntilDischarge(data.data.daysUntilDischarge);
          }
        })
        .catch(() => {});
    }
  }, [caseId]);

  const fetchResources = async (cat?: string) => {
    setLoading(true);
    try {
      const url = cat && cat !== 'ALL' ? `/api/resources?category=${cat}` : '/api/resources';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setResources(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources(selectedCategory);
  }, [selectedCategory]);

  const isHoustonArea =
    !caseData?.zipCode ||
    caseData.zipCode.startsWith('770') ||
    caseData.zipCode.startsWith('772') ||
    caseData.zipCode.startsWith('773') ||
    caseData.zipCode.startsWith('774') ||
    caseData.zipCode.startsWith('775');

  return (
    <WorkspaceShell
      caseId={caseId}
      seniorName={seniorName}
      daysUntilDischarge={daysUntilDischarge}
    >
      <div className="space-y-8">
        {/* Editorial Page Header */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#71847d]">
              <span>Family workspace</span>
              <span className="size-1 rounded-full bg-[#b8c8bd]" />
              <span>Curated for {seniorName}</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-[#183331]">
              Resources for the next step
            </h1>
            <p className="mt-1.5 max-w-xl text-xs sm:text-sm leading-relaxed text-[#71847d]">
              Local services and free support, matched to what your family needs right now.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              openNoraWithPrompt(
                `Can you recommend the top 2 resources for ${seniorName} based on our transition plan?`
              )
            }
            className="inline-flex items-center gap-2 self-start rounded-lg border border-[#cbdcd0] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#2d594d] hover:bg-[#f1f6f1] transition-colors md:self-auto shadow-2xs"
          >
            <Sparkles size={16} className="text-[#3f6c5c]" />
            <span>Ask Nora for recommendations</span>
          </button>
        </div>

        {/* Location Notice if case ZIP is outside pilot seed or unset */}
        {!isHoustonArea && caseData?.zipCode && (
          <div className="p-4 rounded-2xl border border-[#cbdcd0] bg-[#eff7f0] text-xs text-[#183331] flex items-start gap-3 shadow-2xs">
            <Info className="w-4 h-4 text-[#3f6c5c] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-[#183331]">
                Location-Aware Provider Notice (ZIP: {caseData.zipCode})
              </p>
              <p className="text-[#71847d] leading-relaxed">
                Bridgewell connects families with local resources based on case location. In this pilot, curated community providers are active in Greater Houston, with nationwide coverage expanding. You can always use Nora to research providers in your area or add custom vendor quotes directly to your budget ledger.
              </p>
            </div>
          </div>
        )}

        {/* Category Filter Pill Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist">
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#1f4d45] text-white shadow-xs'
                    : 'bg-white border border-[#cbdcd0] text-[#71847d] hover:text-[#183331] hover:bg-[#f1f6f1]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 2-Column Responsive Workspace Grid */}
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          {/* Main Left Column: Provider Listings */}
          <section className="rounded-2xl border border-[#e0e9e2] bg-white shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#e7eee8] px-5 py-4">
              <div>
                <h2 className="font-semibold text-base text-[#183331]">Recommended for your plan</h2>
                <p className="mt-0.5 text-xs text-[#879890]">
                  Bridgewell matched these based on home preparation, mobility, and discharge.
                </p>
              </div>
              <span className="rounded-full bg-[#e8f1ea] px-2.5 py-1 text-xs font-semibold text-[#3f6c5c]">
                {resources.length} {resources.length === 1 ? 'match' : 'matches'}
              </span>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-2 border-[#1f4d45] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-[#71847d]">Loading verified providers…</p>
              </div>
            ) : resources.length === 0 ? (
              <div className="text-center py-16 p-8">
                <p className="text-sm font-medium text-[#183331]">No providers found in this category.</p>
                <p className="text-xs text-[#71847d] mt-1">
                  Try selecting &ldquo;All Services&rdquo; or ask Nora to find local options for {seniorName}.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#edf2ee]">
                {resources.map((res) => {
                  const isFree =
                    res.costType?.includes('free') ||
                    res.description.toLowerCase().includes('free') ||
                    res.category === 'donation';

                  return (
                    <article
                      key={res.id}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start transition-colors hover:bg-[#fafbfa]"
                    >
                      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eff7f0] text-[#3f6c5c]">
                        <MapPin size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-[#183331]">{res.name}</h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                              isFree
                                ? 'bg-[#eaf1f7] text-[#4d6e83]'
                                : 'bg-[#e8f3ea] text-[#4d775f]'
                            }`}
                          >
                            {isFree ? 'Free Program' : 'Verified Provider'}
                          </span>
                        </div>

                        {res.organizationName && res.organizationName !== res.name && (
                          <p className="text-xs text-[#71847d] mt-0.5 font-medium flex items-center gap-1">
                            <Building size={12} className="text-[#a0aea8]" />
                            {res.organizationName}
                          </p>
                        )}

                        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#71847d]">
                          {res.description}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#8a9b94]">
                          {res.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="text-[#a0aea8]" />
                              {res.location.city ? `${res.location.city}, TX` : res.location.address}
                            </span>
                          )}
                          {res.location?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={12} className="text-[#a0aea8]" />
                              <a
                                href={`tel:${res.location.phone.replace(/[^0-9]/g, '')}`}
                                className="hover:text-[#1f4d45] underline-offset-2 hover:underline"
                              >
                                {res.location.phone}
                              </a>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[#4d775f] font-medium">
                            <ShieldCheck size={13} />
                            <span>Open Referral HSDS verified</span>
                          </span>
                        </div>
                      </div>

                      <div className="self-end sm:self-start shrink-0">
                        {res.website ? (
                          <a
                            href={res.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#3f6c5c] hover:text-[#1f4d45] transition-colors p-1"
                            title={`Open ${res.name} website`}
                          >
                            <span>Visit</span>
                            <ExternalLink size={14} />
                          </a>
                        ) : res.location?.phone ? (
                          <a
                            href={`tel:${res.location.phone.replace(/[^0-9]/g, '')}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#3f6c5c] hover:text-[#1f4d45] transition-colors p-1"
                          >
                            <span>Call</span>
                            <Phone size={13} />
                          </a>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right Aside Column */}
          <aside className="flex flex-col gap-6">
            {/* Nora Read Card */}
            <NoraReadCard
              eyebrow="Nora's read"
              headline="Start with the free screening."
              explanation={`The county office and community aging services may help identify transportation and caregiver programs before your family commits to paid support.`}
              actionLabel="See eligibility notes"
              onAction={() =>
                openNoraWithPrompt(
                  `What public programs or free benefits might ${seniorName} be eligible for in Texas/Harris County?`
                )
              }
            />

            {/* Help That Fits Card */}
            <section className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-2xs">
              <div className="flex items-center gap-2 text-[#3f6c5c]">
                <HeartHandshake size={18} />
                <h2 className="font-semibold text-base text-[#183331]">Help that fits</h2>
              </div>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#71847d]">
                Tell Nora what feels hardest and she&apos;ll narrow this directory down without adding unnecessary noise.
              </p>
              <button
                type="button"
                onClick={() =>
                  openNoraWithPrompt(
                    `Which of these resources should our family reach out to first for ${seniorName}?`
                  )
                }
                className="mt-4 text-xs sm:text-sm font-semibold text-[#3f6c5c] hover:text-[#1f4d45] transition-colors inline-flex items-center gap-1.5"
              >
                <span>Ask Nora to recommend a provider</span>
                <ExternalLink size={13} />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </WorkspaceShell>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f8f5] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#1f4d45] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResourcesContent />
    </Suspense>
  );
}
