'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { NoraReadCard } from '@/components/movewell/NoraReadCard';
import { openNora } from '@/components/assistant/AIAssistant';
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
  Edit2,
  Info,
  RotateCcw,
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

  // Saved case location vs Temporary search location
  const [savedZip, setSavedZip] = useState<string>('77004');
  const [searchZip, setSearchZip] = useState<string>('77004');
  const [cityState, setCityState] = useState<string>('Houston, TX');

  // Search another ZIP dialog state
  const [isSearchingAnotherZip, setIsSearchingAnotherZip] = useState<boolean>(false);
  const [anotherZipInput, setAnotherZipInput] = useState<string>('');

  // Permanent saved location edit modal state
  const [isEditingSavedLocation, setIsEditingSavedLocation] = useState<boolean>(false);
  const [savedZipInput, setSavedZipInput] = useState<string>('77004');
  const [savingLocation, setSavingLocation] = useState<boolean>(false);

  const categories = [
    { id: 'ALL', label: 'All Services' },
    { id: 'senior_move_management', label: 'Senior Move Managers' },
    { id: 'moving', label: 'Movers' },
    { id: 'home_modification', label: 'Home Modifications' },
    { id: 'transportation', label: 'Transportation' },
    { id: 'donation', label: 'Donation & Decluttering' },
    { id: 'storage', label: 'Storage' },
  ];

  const loadCase = () => {
    if (caseId) {
      fetch(`/api/cases/${caseId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            if (data.data.caseData) {
              setCaseData(data.data.caseData);
              const z = data.data.caseData.zipCode && data.data.caseData.zipCode !== 'UNSET'
                ? data.data.caseData.zipCode
                : '77004';
              setSavedZip(z);
              setSearchZip(z);
              setSavedZipInput(z);
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
  };

  useEffect(() => {
    loadCase();
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

  // Handle temporary search override
  const handleApplyAnotherZip = (e: React.FormEvent) => {
    e.preventDefault();
    if (anotherZipInput.trim().length >= 5) {
      setSearchZip(anotherZipInput.trim());
      setIsSearchingAnotherZip(false);
    }
  };

  const handleResetToSavedLocation = () => {
    setSearchZip(savedZip);
    setIsSearchingAnotherZip(false);
  };

  // Handle permanent saved case location update
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savedZipInput.trim().length < 5) return;

    setSavingLocation(true);
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: savedZipInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        const newZip = savedZipInput.trim();
        setSavedZip(newZip);
        setSearchZip(newZip);
        setIsEditingSavedLocation(false);
        loadCase();
      }
    } catch (err) {
      console.error('Failed to update saved location:', err);
    } finally {
      setSavingLocation(false);
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

  const isTemporaryOverride = searchZip !== savedZip;
  const isOutsidePilot = searchZip.length >= 5 && !searchZip.startsWith('770') && !searchZip.startsWith('773') && !searchZip.startsWith('774') && !searchZip.startsWith('775');

  return (
    <WorkspaceShell
      caseId={caseId}
      seniorName={seniorName}
      daysUntilDischarge={daysUntilDischarge}
    >
      <div className="space-y-8">
        {/* Editorial Page Header with Location & Pilot Transparency */}
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

            {/* Saved Family Location & Temporary Search Bar */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E8F1EA] border border-[#CCE0D1] text-xs text-[#1F4D45]">
                <MapPin className="w-3.5 h-3.5 text-[#1F4D45]" />
                <span className="font-semibold">{seniorName}&apos;s saved location: ZIP {savedZip}</span>
                {cityState && <span className="text-[#366854]">({cityState})</span>}

                <button
                  type="button"
                  onClick={() => {
                    setSavedZipInput(savedZip);
                    setIsEditingSavedLocation(true);
                  }}
                  className="font-semibold underline ml-1 hover:text-[#163D37] cursor-pointer inline-flex items-center gap-1"
                  title="Permanently update senior's home location in plan"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit saved location</span>
                </button>
              </div>

              {/* Temporary Search Override Badge */}
              {isTemporaryOverride ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-bg border border-amber/30 text-xs text-amber font-semibold">
                  <span>Searching near: ZIP {searchZip}</span>
                  <button
                    type="button"
                    onClick={handleResetToSavedLocation}
                    className="underline hover:opacity-80 cursor-pointer ml-1 inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to saved location</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAnotherZipInput('');
                    setIsSearchingAnotherZip(true);
                  }}
                  className="text-xs font-semibold text-muted-ink hover:text-ink px-3 py-1.5 rounded-xl border border-line bg-white hover:bg-cream transition-colors cursor-pointer"
                >
                  Search another ZIP
                </button>
              )}
            </div>

            {/* Inline Temporary Search Input */}
            {isSearchingAnotherZip && (
              <form onSubmit={handleApplyAnotherZip} className="mt-3 inline-flex items-center gap-2 p-2 bg-white border border-line rounded-xl shadow-2xs">
                <span className="text-xs font-medium text-muted-ink">Temporary search:</span>
                <input
                  type="text"
                  maxLength={5}
                  value={anotherZipInput}
                  onChange={(e) => setAnotherZipInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter ZIP (e.g. 78701)"
                  className="w-28 px-2 py-1 rounded bg-cream text-xs border border-line text-ink focus:outline-none focus:border-evergreen"
                  autoFocus
                />
                <button type="submit" className="px-3 py-1 rounded-lg bg-evergreen text-white text-xs font-semibold cursor-pointer">
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setIsSearchingAnotherZip(false)}
                  className="text-xs text-muted-ink hover:text-ink px-1 cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Unsupported Pilot Location Notice */}
        {isOutsidePilot && (
          <div className="p-4 bg-amber-bg border border-amber/30 rounded-2xl flex items-start gap-3 text-xs text-amber leading-relaxed shadow-2xs">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-ink mb-0.5">Pilot Resource Coverage Notice</p>
              <p>
                No curated local BridgeWell records are currently available for ZIP {searchZip}. Our pilot resource coverage is focused on Harris County / Greater Houston. Broader Texas and national resources are shown below where applicable.
              </p>
            </div>
          </div>
        )}

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

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {res.location?.phone && (
                            <a
                              href={`tel:${res.location.phone}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBDCD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#183331] transition hover:bg-[#F1F6F1]"
                            >
                              <Phone size={13} className="text-[#1F4D45]" />
                              <span>{res.location.phone}</span>
                            </a>
                          )}

                          {res.website && (
                            <a
                              href={res.website}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F4D45] hover:underline"
                            >
                              <span>Official website</span>
                              <ExternalLink size={12} />
                            </a>
                          )}

                          {isFree && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D6A4F] bg-[#E8F5E9] px-2.5 py-1 rounded-md">
                              <HeartHandshake size={13} />
                              <span>Free Public / Community Service</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right Sidebar Rail: Nora Guidance & Pilot Scope */}
          <aside className="space-y-5">
            <NoraReadCard
              headline="Vetted community help"
              explanation={`Resources shown near ${searchZip} are cross-referenced with public agencies, nonprofit services, and verified providers for senior safety.`}
              actionLabel="Ask Nora about resources"
              onAction={() => openNora({ context: { surface: 'RESOURCES', category: selectedCategory } })}
            />

            <div className="rounded-2xl border border-[#E0E9E2] bg-white p-5 shadow-2xs text-xs space-y-3">
              <div className="flex items-center gap-2 font-semibold text-[#183331]">
                <ShieldCheck size={16} className="text-[#1F4D45]" />
                <span>Pilot Resource Directory Scope</span>
              </div>
              <p className="text-[#71847D] leading-relaxed">
                BridgeWell is currently piloting in Harris County (Greater Houston). All records carry clear provenance badges indicating whether they are a public agency, nonprofit, or directory listing.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Edit Saved Location Modal */}
      {isEditingSavedLocation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
          onClick={() => setIsEditingSavedLocation(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-line p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-ink mb-1">
              Update {seniorName}&apos;s saved location
            </h3>
            <p className="text-xs text-muted-ink leading-relaxed mb-5">
              Changing {seniorName}&apos;s home ZIP will refresh nearby resources, location-sensitive cost benchmarks, and record this change in What Changed.
            </p>

            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1">
                  Home ZIP Code
                </label>
                <input
                  type="text"
                  maxLength={5}
                  required
                  value={savedZipInput}
                  onChange={(e) => setSavedZipInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 77025"
                  className="w-full p-2.5 rounded-xl border border-line bg-cream text-sm text-ink focus:outline-none focus:border-evergreen"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingSavedLocation(false)}
                  className="px-4 py-2 rounded-xl bg-cream hover:bg-line text-ink text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLocation || savedZipInput.trim().length < 5}
                  className="px-4 py-2 rounded-xl bg-evergreen hover:bg-evergreen-dark disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                >
                  {savingLocation ? 'Updating location...' : 'Update location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-ink">Loading resources...</div>}>
      <ResourcesContent />
    </Suspense>
  );
}
