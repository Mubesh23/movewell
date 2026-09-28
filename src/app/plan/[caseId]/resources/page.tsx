'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { NoraReadCard } from '@/components/movewell/NoraReadCard';
import { openNoraWithPrompt } from '@/components/assistant/AIAssistant';
import { ServiceResource, TransitionCase, ResourceTrustLabel } from '@/types';
import {
  MapPin,
  Phone,
  ExternalLink,
  ShieldCheck,
  Search,
  Sparkles,
  HeartHandshake,
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
  const [searchZip, setSearchZip] = useState<string>('77004');
  const [editZipInput, setEditZipInput] = useState<string>('77004');
  const [isEditingZip, setIsEditingZip] = useState<boolean>(false);
  const [cityState, setCityState] = useState<string>('Houston, TX');

  const categories = [
    { id: 'ALL', label: 'All Services' },
    { id: 'senior_move_management', label: 'Senior Move Managers' },
    { id: 'moving', label: 'Movers' },
    { id: 'home_modification', label: 'Home Modifications' },
    { id: 'transportation', label: 'Transportation' },
    { id: 'donation', label: 'Donation & Decluttering' },
    { id: 'storage', label: 'Storage' },
  ];

  useEffect(() => {
    if (caseId) {
      fetch(`/api/cases/${caseId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            if (data.data.caseData) {
              setCaseData(data.data.caseData);
              if (data.data.caseData.zipCode) {
                setSearchZip(data.data.caseData.zipCode);
                setEditZipInput(data.data.caseData.zipCode);
              }
            }
            if (data.data.seniorProfile?.name) setSeniorName(data.data.seniorProfile.name);
            if (data.data.daysUntilDischarge !== undefined) setDaysUntilDischarge(data.data.daysUntilDischarge);
            if (data.data.seniorLocation?.city) {
              setCityState(`${data.data.seniorLocation.city}, ${data.data.seniorLocation.state || 'TX'}`);
            }
          }
        })
        .catch(() => {});
    }
  }, [caseId]);

  const fetchResources = async (cat: string, zip: string) => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams();
      if (cat && cat !== 'ALL') urlParams.append('category', cat);
      if (zip) urlParams.append('zipCode', zip);

      const res = await fetch(`/api/resources?${urlParams.toString()}`);
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
    fetchResources(selectedCategory, searchZip);
  }, [selectedCategory, searchZip]);

  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editZipInput.trim().length >= 5) {
      setSearchZip(editZipInput.trim());
      setIsEditingZip(false);
    }
  };

  const getStructuredProvenanceLabel = (res: ServiceResource): ResourceTrustLabel => {
    const nameLower = (res.name || '').toLowerCase();
    const descLower = (res.description || '').toLowerCase();
    const orgLower = (res.organizationName || '').toLowerCase();

    if (
      res.costType === 'free_public_service' ||
      nameLower.includes('metro') ||
      nameLower.includes('county') ||
      nameLower.includes('area agency') ||
      orgLower.includes('county')
    ) {
      return 'Public agency';
    }
    if (
      orgLower.includes('nonprofit') ||
      descLower.includes('nonprofit') ||
      descLower.includes('volunteer') ||
      res.costType === 'sliding_scale'
    ) {
      return 'Nonprofit';
    }
    if (res.verification?.verificationStatus?.toLowerCase().includes('verified')) {
      return 'BridgeWell-reviewed';
    }
    if (res.organizationName) {
      return 'Directory listing';
    }
    return 'Nearby option';
  };

  const getProvenanceBadgeStyle = (label: ResourceTrustLabel) => {
    switch (label) {
      case 'Public agency':
        return 'bg-[#EAF1F7] text-[#345B73] border-[#CDE0ED]';
      case 'Nonprofit':
        return 'bg-[#F2EDF8] text-[#5E3D82] border-[#DFD3EC]';
      case 'BridgeWell-reviewed':
        return 'bg-[#E8F3EA] text-[#366854] border-[#CCE0D1]';
      case 'Directory listing':
        return 'bg-[#F4F5F4] text-[#55635F] border-[#DFE2E0]';
      default:
        return 'bg-[#F7F8F5] text-[#667572] border-[#E3E9E5]';
    }
  };

  return (
    <WorkspaceShell
      caseId={caseId}
      seniorName={seniorName}
      daysUntilDischarge={daysUntilDischarge}
    >
      <div className="space-y-8">
        {/* Editorial Page Header with Visible Location */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#71847D]">
              <span>Family workspace</span>
              <span className="size-1 rounded-full bg-[#B8C8BD]" />
              <span>Curated for {seniorName}</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-[#183331]">
              Resources for the next step
            </h1>
            <p className="mt-1.5 max-w-xl text-xs sm:text-sm leading-relaxed text-[#71847D]">
              Local services and free support, matched to what your family needs right now.
            </p>

            {/* Location Banner with Interactive [ Change location ] */}
            <div className="mt-4 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E8F1EA] border border-[#CCE0D1] text-xs text-[#1F4D45]">
              <MapPin className="w-3.5 h-3.5 text-[#1F4D45]" />
              <span className="font-semibold">Near {seniorName}&apos;s home &bull; ZIP {searchZip}</span>
              {cityState && <span className="text-[#366854]">({cityState})</span>}

              {isEditingZip ? (
                <form onSubmit={handleZipSubmit} className="inline-flex items-center gap-1.5 ml-1">
                  <input
                    type="text"
                    maxLength={5}
                    value={editZipInput}
                    onChange={(e) => setEditZipInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="ZIP"
                    className="w-16 px-1.5 py-0.5 rounded bg-white text-xs border border-[#1F4D45] text-[#183331] focus:outline-none"
                    autoFocus
                  />
                  <button type="submit" className="font-bold underline text-[#1F4D45] cursor-pointer">
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingZip(false)}
                    className="text-[#71847D] cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditZipInput(searchZip);
                    setIsEditingZip(true);
                  }}
                  className="font-semibold underline ml-1 hover:text-[#163D37] cursor-pointer"
                >
                  Change location
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" aria-label="Filter resource categories">
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#1F4D45] text-white shadow-xs'
                    : 'bg-white border border-[#CBDCD0] text-[#71847D] hover:text-[#183331] hover:bg-[#F1F6F1]'
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
          <section className="rounded-2xl border border-[#E0E9E2] bg-white shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E7EEE8] px-5 py-4">
              <div>
                <h2 className="font-semibold text-base text-[#183331]">Recommended for your plan</h2>
                <p className="mt-0.5 text-xs text-[#879890]">
                  Matched near ZIP {searchZip} based on home preparation, mobility, and discharge.
                </p>
              </div>
              <span className="rounded-full bg-[#E8F1EA] px-2.5 py-1 text-xs font-semibold text-[#3F6C5C]">
                {resources.length} {resources.length === 1 ? 'match' : 'matches'}
              </span>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-2 border-[#1F4D45] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-[#71847D]">Loading nearby resources…</p>
              </div>
            ) : resources.length === 0 ? (
              <div className="text-center py-16 p-8">
                <p className="text-sm font-medium text-[#183331]">No providers found in this category.</p>
                <p className="text-xs text-[#71847D] mt-1">
                  Try selecting &ldquo;All Services&rdquo; or ask Nora to find local options for {seniorName}.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#EDF2EE]">
                {resources.map((res) => {
                  const trustLabel = getStructuredProvenanceLabel(res);
                  const isFree =
                    res.costType?.includes('free') ||
                    res.description.toLowerCase().includes('free') ||
                    res.category === 'donation';

                  return (
                    <article
                      key={res.id}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start transition-colors hover:bg-[#FAFBF9]"
                    >
                      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#EFF7F0] text-[#3F6C5C]">
                        <Building size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-[#183331]">{res.name}</h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${getProvenanceBadgeStyle(
                              trustLabel
                            )}`}
                          >
                            {trustLabel}
                          </span>
                        </div>

                        {res.organizationName && res.organizationName !== res.name && (
                          <p className="text-xs text-[#71847D] mt-0.5 font-medium flex items-center gap-1">
                            <Building size={12} className="text-[#A0AEA8]" />
                            {res.organizationName}
                          </p>
                        )}

                        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#71847D]">
                          {res.description}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#8A9B94]">
                          {res.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="text-[#A0AEA8]" />
                              {res.location.city ? `${res.location.city}, TX` : res.location.address}
                            </span>
                          )}
                          {res.location?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={12} className="text-[#A0AEA8]" />
                              <a
                                href={`tel:${res.location.phone.replace(/[^0-9]/g, '')}`}
                                className="hover:text-[#1F4D45] underline-offset-2 hover:underline"
                              >
                                {res.location.phone}
                              </a>
                            </span>
                          )}
                          {res.costType && (
                            <span className="text-[11px] font-medium text-[#4F635B]">
                              {res.costType === 'free_public_service'
                                ? 'Public program &bull; No cost'
                                : res.costType === 'sliding_scale'
                                ? 'Sliding-scale fee'
                                : 'Direct provider quote'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="self-end sm:self-start shrink-0">
                        {res.website ? (
                          <a
                            href={res.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#3F6C5C] hover:text-[#1F4D45] transition-colors p-1"
                            title={`Open ${res.name} website`}
                          >
                            <span>Visit</span>
                            <ExternalLink size={14} />
                          </a>
                        ) : res.location?.phone ? (
                          <a
                            href={`tel:${res.location.phone.replace(/[^0-9]/g, '')}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#3F6C5C] hover:text-[#1F4D45] transition-colors p-1"
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
            <NoraReadCard
              eyebrow="Nora's read"
              headline="Start with the free screening."
              explanation={`The county office and community aging services near ${searchZip} can help screen transportation and caregiver assistance before your family commits to paid support.`}
              actionLabel="See eligibility notes"
              onAction={() =>
                openNoraWithPrompt(
                  `What public programs or free benefits might ${seniorName} be eligible for in Texas/Harris County near ZIP ${searchZip}?`
                )
              }
            />

            <section className="rounded-2xl border border-[#E0E9E2] bg-white p-5 shadow-2xs">
              <div className="flex items-center gap-2 text-[#3F6C5C]">
                <HeartHandshake size={18} />
                <h2 className="font-semibold text-base text-[#183331]">Help that fits</h2>
              </div>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#71847D]">
                Tell Nora what feels hardest and she&apos;ll narrow this directory down without adding unnecessary noise.
              </p>
              <button
                type="button"
                onClick={() =>
                  openNoraWithPrompt(
                    `Which of these resources near ZIP ${searchZip} should our family reach out to first for ${seniorName}?`
                  )
                }
                className="mt-4 text-xs sm:text-sm font-semibold text-[#3F6C5C] hover:text-[#1F4D45] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
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
        <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#1F4D45] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResourcesContent />
    </Suspense>
  );
}
