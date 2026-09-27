'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  Home,
  ShieldAlert,
  Users,
  DollarSign,
  MapPin,
  Edit2,
  Sparkles,
  Check,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  PlanDraft,
  ProposedTask,
  ProposedMember,
  CaseLocation,
  ResourceCandidate,
} from '@/types';

export default function DraftReviewPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params?.draftId as string;

  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modals / States
  const [editingSection, setEditingSection] = useState<
    'senior' | 'discharge' | 'location' | 'safety' | 'family' | 'budget' | null
  >(null);

  // Edit Form Fields
  const [seniorName, setSeniorName] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationZip, setLocationZip] = useState('');
  const [mobilityConstraint, setMobilityConstraint] = useState(false);
  const [stairsConstraint, setStairsConstraint] = useState(false);
  const [coordinatorName, setCoordinatorName] = useState('');
  const [helperName, setHelperName] = useState('');
  const [budgetAmount, setBudgetAmount] = useState<number | ''>('');
  const [budgetStatus, setBudgetStatus] = useState<'SET' | 'UNSET'>('UNSET');

  // Resource viewer modal state
  const [viewingCategory, setViewingCategory] = useState<string | null>(null);
  const [nearbyResources, setNearbyResources] = useState<ResourceCandidate[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Activation & Auth
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    async function loadDraft() {
      if (!draftId) return;
      try {
        const res = await fetch(`/api/drafts/${draftId}`);
        const data = await res.json();
        if (data.success && data.draft) {
          setDraft(data.draft);
          // Pre-populate edit states
          setSeniorName(data.draft.seniorProfile.name);
          setDischargeDate(data.draft.dischargeTiming?.date || '');
          const loc = data.draft.proposedLocations[0];
          setLocationCity(loc?.city || '');
          setLocationZip(loc?.zipCode || '');
          setMobilityConstraint(data.draft.seniorProfile.mobilityConstraint);
          setStairsConstraint(data.draft.seniorProfile.stairsConstraint);
          const owner = data.draft.proposedMembers.find((m: ProposedMember) => m.role === 'OWNER');
          setCoordinatorName(owner?.name || 'You');
          const helper = data.draft.proposedMembers.find((m: ProposedMember) => m.role === 'FAMILY');
          setHelperName(helper?.name || '');
          setBudgetAmount(data.draft.proposedBudget || '');
          setBudgetStatus(data.draft.budgetStatus);
        } else {
          setError(data.error || 'Failed to load draft');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading draft');
      } finally {
        setLoading(false);
      }
    }
    loadDraft();
  }, [draftId]);

  const handleSaveSection = async () => {
    if (!draft) return;
    setSavingEdit(true);

    const updates: Partial<PlanDraft> = {};

    if (editingSection === 'senior' || editingSection === 'safety') {
      updates.seniorProfile = {
        ...draft.seniorProfile,
        name: seniorName.trim() || draft.seniorProfile.name,
        mobilityConstraint,
        stairsConstraint,
      };
    }

    if (editingSection === 'discharge') {
      updates.dischargeTiming = {
        ...draft.dischargeTiming,
        date: dischargeDate,
      };
    }

    if (editingSection === 'location') {
      const updatedLoc: CaseLocation = {
        ...draft.proposedLocations[0],
        id: draft.proposedLocations[0]?.id || 'loc-home',
        planDraftId: draft.id,
        type: 'HOME',
        label: `${seniorName || draft.seniorProfile.name}'s Home`,
        city: locationCity.trim() || undefined,
        zipCode: locationZip.trim() || undefined,
      };
      updates.proposedLocations = [updatedLoc];
    }

    if (editingSection === 'family') {
      const updatedMembers: ProposedMember[] = [
        {
          id: 'mem-coord',
          name: coordinatorName.trim() || 'You',
          relationship: 'Primary Coordinator',
          isLocal: true,
          role: 'OWNER',
        },
      ];
      if (helperName.trim()) {
        updatedMembers.push({
          id: 'mem-helper',
          name: helperName.trim(),
          relationship: 'Local Support',
          isLocal: true,
          role: 'FAMILY',
        });
      }
      updates.proposedMembers = updatedMembers;
    }

    if (editingSection === 'budget') {
      updates.budgetStatus = budgetStatus;
      updates.proposedBudget =
        budgetStatus === 'SET' && budgetAmount !== '' ? Number(budgetAmount) : undefined;
    }

    try {
      const res = await fetch(`/api/drafts/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.draft) {
        setDraft(data.draft);
        setEditingSection(null);
      } else {
        alert(data.error || 'Failed to update section');
      }
    } catch (e: any) {
      alert('Error updating draft: ' + e.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleTaskApplicable = async (taskId: string) => {
    if (!draft) return;
    const updatedTasks = draft.proposedTasks.map((t) =>
      t.id === taskId ? { ...t, applicable: !t.applicable } : t
    );
    setDraft({ ...draft, proposedTasks: updatedTasks });

    await fetch(`/api/drafts/${draft.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposedTasks: updatedTasks }),
    });
  };

  const handleViewResources = async (category: string) => {
    setViewingCategory(category);
    setLoadingResources(true);
    try {
      const zip = draft?.proposedLocations[0]?.zipCode || '77004';
      const res = await fetch(`/api/resources?category=${encodeURIComponent(category)}&zipCode=${zip}`);
      const data = await res.json();
      if (data.success && data.resources) {
        const candidates: ResourceCandidate[] = data.resources.map((r: any) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          description: r.description,
          phone: r.location?.phone,
          address: r.location?.address,
          city: r.location?.city,
          state: r.location?.state,
          zipCode: r.location?.zipCode,
          trustLabel: r.verification?.verificationStatus?.includes('Verified')
            ? 'MoveWell-reviewed'
            : 'Nearby option',
          website: r.website,
        }));
        setNearbyResources(candidates);
      }
    } catch (e) {
      console.error('Error fetching resources:', e);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleActivatePlan = async (authenticatedUserId?: string) => {
    if (!draft) return;

    // Check if user has an established non-anon auth or if we should show the auth modal
    const cookieUserId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('movewell_user_id='))
      ?.split('=')[1];

    if (!authenticatedUserId && (!cookieUserId || cookieUserId.startsWith('anon-'))) {
      setIsAuthOpen(true);
      return;
    }

    setActivating(true);
    try {
      const res = await fetch(`/api/drafts/${draft.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success && data.caseId) {
        router.push(`/plan/${data.caseId}`);
      } else {
        throw new Error(data.error || 'Failed to activate plan');
      }
    } catch (err: any) {
      alert('Activation error: ' + err.message);
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-ink text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-evergreen animate-ping" />
            <span>Loading proposed plan...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="p-4 bg-amber-bg border border-amber/30 rounded-xl text-sm text-amber font-medium mb-4">
            {error || 'Draft not found'}
          </div>
          <Link href="/get-started" className="text-evergreen underline font-semibold text-sm">
            ← Return to intake
          </Link>
        </div>
      </div>
    );
  }

  const primaryLoc = draft.proposedLocations[0];

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 mb-8 border-b border-line">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-bg text-amber text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-dot" />
              Proposed Plan · Review before starting
            </div>
            <h1 className="text-3xl font-extrabold text-ink tracking-tight">
              {draft.seniorProfile.name}&apos;s transition proposal
            </h1>
            <p className="text-sm text-muted-ink mt-1">
              Review and adjust details. Nothing is operational until you choose to start.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleActivatePlan()}
              disabled={activating}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-bold text-sm transition-all shadow-sm"
            >
              <span>{activating ? 'Starting plan...' : 'Start this plan'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Structured Review Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {/* Card: Discharge Timing */}
          <div className="p-5 bg-white rounded-2xl border border-line shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-ink flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-evergreen" />
                  Discharge Timing
                </span>
                <button
                  onClick={() => setEditingSection('discharge')}
                  className="text-xs font-semibold text-evergreen hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </div>
              <strong className="text-lg font-bold text-ink block mb-1">
                {draft.dischargeTiming?.date || 'Target unset'}
              </strong>
              <p className="text-xs text-muted-ink leading-relaxed">
                {draft.dischargeTiming?.description
                  ? `Expected ${draft.dischargeTiming.description}`
                  : 'Earliest projected departure from hospital or acute care.'}
              </p>
            </div>
          </div>

          {/* Card: Home & Location */}
          <div className="p-5 bg-white rounded-2xl border border-line shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-ink flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-evergreen" />
                  Home &amp; Location
                </span>
                <button
                  onClick={() => setEditingSection('location')}
                  className="text-xs font-semibold text-evergreen hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </div>
              <strong className="text-lg font-bold text-ink block mb-1">
                {primaryLoc?.city || 'City unset'} {primaryLoc?.zipCode ? `(${primaryLoc.zipCode})` : ''}
              </strong>
              <p className="text-xs text-muted-ink leading-relaxed">
                {draft.seniorProfile.homeType || 'Residential residence'} ·{' '}
                {draft.seniorProfile.livesAlone ? 'Lives alone' : 'Lives with family'}
              </p>
            </div>
          </div>

          {/* Card: Safety & Mobility */}
          <div className="p-5 bg-white rounded-2xl border border-line shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-ink flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber" />
                  Safety &amp; Mobility
                </span>
                <button
                  onClick={() => setEditingSection('safety')}
                  className="text-xs font-semibold text-evergreen hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </div>
              <strong className="text-lg font-bold text-ink block mb-1">
                {draft.seniorProfile.mobilityConstraint ? 'Mobility assistance' : 'Independent mobility'}
              </strong>
              <p className="text-xs text-muted-ink leading-relaxed">
                {draft.seniorProfile.stairsConstraint
                  ? 'Stairs hazard / Bedroom upstairs'
                  : 'Single-level accessibility'}
              </p>
            </div>
          </div>

          {/* Card: Family & Coordination */}
          <div className="p-5 bg-white rounded-2xl border border-line shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-ink flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-evergreen" />
                  Family Coordination
                </span>
                <button
                  onClick={() => setEditingSection('family')}
                  className="text-xs font-semibold text-evergreen hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </div>
              <strong className="text-lg font-bold text-ink block mb-1">
                {draft.proposedMembers.length} family member
                {draft.proposedMembers.length > 1 ? 's' : ''}
              </strong>
              <div className="text-xs text-muted-ink space-y-0.5">
                {draft.proposedMembers.map((m) => (
                  <div key={m.id} className="flex justify-between">
                    <span className="font-semibold text-ink">{m.name}</span>
                    <span>{m.relationship || m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card: Budget Planning */}
          <div className="p-5 bg-white rounded-2xl border border-line shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-ink flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-evergreen" />
                  Budget Status
                </span>
                <button
                  onClick={() => setEditingSection('budget')}
                  className="text-xs font-semibold text-evergreen hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </div>
              <strong className="text-lg font-bold text-ink block mb-1">
                {draft.budgetStatus === 'SET' && draft.proposedBudget
                  ? `$${draft.proposedBudget.toLocaleString()}`
                  : 'Open (Not set)'}
              </strong>
              <p className="text-xs text-muted-ink leading-relaxed">
                {draft.budgetStatus === 'SET'
                  ? 'Fixed target for moving and modification estimates.'
                  : 'No artificial limit forced. You can assign numbers anytime.'}
              </p>
            </div>
          </div>

          {/* Card: Nearby Resources Preview */}
          <div className="p-5 bg-sage/40 rounded-2xl border border-line shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-evergreen flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-evergreen" />
                  Local Resources
                </span>
              </div>
              <strong className="text-lg font-bold text-ink block mb-1">
                {draft.proposedResourceNeeds.length} Service Categories
              </strong>
              <p className="text-xs text-muted-ink leading-relaxed">
                Matched to proposed tasks like movers and grab bar installers.
              </p>
            </div>
          </div>
        </div>

        {/* Proposed Task Sequence */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-ink block mb-0.5">
                Initial Action Sequence
              </span>
              <h2 className="text-xl font-bold text-ink">What should happen first</h2>
            </div>
            <span className="text-xs text-muted-ink">
              Check tasks to keep or skip before activation
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-line divide-y divide-line overflow-hidden shadow-2xs">
            {draft.proposedTasks.map((t, idx) => {
              const isApplicable = t.applicable !== false;
              return (
                <div
                  key={t.id}
                  className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                    !isApplicable ? 'opacity-50 bg-cream/30' : 'hover:bg-cream/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleTaskApplicable(t.id)}
                    className={`w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      isApplicable
                        ? 'bg-evergreen border-evergreen text-white'
                        : 'border-line bg-white text-transparent'
                    }`}
                    title={isApplicable ? 'Click to exclude' : 'Click to include'}
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-muted-ink">{idx + 1}.</span>
                      <strong
                        className={`text-sm font-semibold ${
                          isApplicable ? 'text-ink' : 'line-through text-muted-ink'
                        }`}
                      >
                        {t.title}
                      </strong>
                      <span className="text-xs text-muted-ink">·</span>
                      <span className="text-xs text-muted-ink">Assigned to {t.assigneeName}</span>
                    </div>

                    {t.description && (
                      <p className="text-xs text-muted-ink leading-relaxed max-w-2xl mb-2">
                        {t.description}
                      </p>
                    )}

                    {t.whyItMatters && (
                      <span className="text-[11px] font-medium text-evergreen block">
                        Why: {t.whyItMatters}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Progressive Resource Needs Disclosure */}
        {draft.proposedResourceNeeds.length > 0 && (
          <section className="mb-14">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-ink block mb-0.5">
                Targeted Local Help
              </span>
              <h2 className="text-xl font-bold text-ink">Nearby support options</h2>
              <p className="text-xs text-muted-ink mt-0.5">
                Surfaced only for tasks requiring outside professionals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {draft.proposedResourceNeeds.map((need) => (
                <div
                  key={need.category}
                  className="p-5 bg-white rounded-2xl border border-line shadow-2xs flex items-center justify-between"
                >
                  <div>
                    <strong className="text-sm font-bold text-ink block mb-0.5">
                      {need.label}
                    </strong>
                    <span className="text-xs text-muted-ink">
                      Nearby options available in {primaryLoc?.city || primaryLoc?.zipCode || 'your area'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleViewResources(need.category)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-cream hover:bg-white text-xs font-semibold text-evergreen transition-colors"
                  >
                    <span>View options</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Activation Bar */}
        <div className="sticky bottom-4 p-5 bg-white/95 backdrop-blur-md rounded-2xl border border-line shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <strong className="text-base font-bold text-ink block">
              Ready to start coordinating?
            </strong>
            <span className="text-xs text-muted-ink">
              Activating creates your workspace and unlocks task updates, family invites, and full Nora advice.
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleActivatePlan()}
            disabled={activating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-bold text-sm transition-all shadow-sm"
          >
            <span>{activating ? 'Starting plan...' : 'Start this plan'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Edit Modal */}
        {editingSection && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
            onClick={() => setEditingSection(null)}
          >
            <div
              className="w-full max-w-md bg-white rounded-2xl p-6 border border-line shadow-xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-ink">
                Edit {editingSection.charAt(0).toUpperCase() + editingSection.slice(1)} Details
              </h3>

              {editingSection === 'senior' && (
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Senior Name</label>
                  <input
                    type="text"
                    value={seniorName}
                    onChange={(e) => setSeniorName(e.target.value)}
                    className="w-full px-3 py-2 border border-line rounded-lg text-sm"
                  />
                </div>
              )}

              {editingSection === 'discharge' && (
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Discharge Date</label>
                  <input
                    type="date"
                    value={dischargeDate}
                    onChange={(e) => setDischargeDate(e.target.value)}
                    className="w-full px-3 py-2 border border-line rounded-lg text-sm"
                  />
                </div>
              )}

              {editingSection === 'location' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">City &amp; State</label>
                    <input
                      type="text"
                      value={locationCity}
                      onChange={(e) => setLocationCity(e.target.value)}
                      placeholder="e.g. Houston, TX"
                      className="w-full px-3 py-2 border border-line rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={locationZip}
                      onChange={(e) => setLocationZip(e.target.value)}
                      placeholder="e.g. 77004"
                      className="w-full px-3 py-2 border border-line rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}

              {editingSection === 'safety' && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mobilityConstraint}
                      onChange={(e) => setMobilityConstraint(e.target.checked)}
                      className="rounded text-evergreen"
                    />
                    <span>Requires walker or mobility assistance</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stairsConstraint}
                      onChange={(e) => setStairsConstraint(e.target.checked)}
                      className="rounded text-evergreen"
                    />
                    <span>Stairs hazard (bedroom upstairs)</span>
                  </label>
                </div>
              )}

              {editingSection === 'family' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Primary Coordinator Name
                    </label>
                    <input
                      type="text"
                      value={coordinatorName}
                      onChange={(e) => setCoordinatorName(e.target.value)}
                      className="w-full px-3 py-2 border border-line rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Local In-Person Helper Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={helperName}
                      onChange={(e) => setHelperName(e.target.value)}
                      placeholder="e.g. Sister Jennifer"
                      className="w-full px-3 py-2 border border-line rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}

              {editingSection === 'budget' && (
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="radio"
                        checked={budgetStatus === 'SET'}
                        onChange={() => setBudgetStatus('SET')}
                      />
                      <span>Set numeric budget</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="radio"
                        checked={budgetStatus === 'UNSET'}
                        onChange={() => {
                          setBudgetStatus('UNSET');
                          setBudgetAmount('');
                        }}
                      />
                      <span>Leave open</span>
                    </label>
                  </div>

                  {budgetStatus === 'SET' && (
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">
                        Budget amount ($)
                      </label>
                      <input
                        type="number"
                        value={budgetAmount}
                        onChange={(e) =>
                          setBudgetAmount(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="e.g. 8000"
                        className="w-full px-3 py-2 border border-line rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 border border-line rounded-lg text-xs font-semibold text-muted-ink hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSection}
                  disabled={savingEdit}
                  className="px-4 py-2 bg-evergreen hover:bg-evergreen-dark text-white rounded-lg text-xs font-semibold"
                >
                  {savingEdit ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resources Modal */}
        {viewingCategory && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
            onClick={() => setViewingCategory(null)}
          >
            <div
              className="w-full max-w-lg bg-white rounded-2xl p-6 border border-line shadow-xl space-y-4 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-3 border-b border-line">
                <h3 className="text-lg font-bold text-ink">Nearby Resource Options</h3>
                <button
                  onClick={() => setViewingCategory(null)}
                  className="text-xs text-muted-ink hover:text-ink font-semibold"
                >
                  Close
                </button>
              </div>

              {loadingResources ? (
                <div className="py-8 text-center text-xs text-muted-ink">
                  Finding nearby options...
                </div>
              ) : nearbyResources.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-ink">
                  No directory listings currently loaded for this category.
                </div>
              ) : (
                <div className="space-y-3">
                  {nearbyResources.map((r) => (
                    <div key={r.id} className="p-4 bg-cream/40 rounded-xl border border-line">
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-sm font-bold text-ink">{r.name}</strong>
                        <span className="px-2 py-0.5 rounded-full bg-sage text-evergreen text-[10px] font-bold">
                          {r.trustLabel}
                        </span>
                      </div>
                      <p className="text-xs text-muted-ink leading-relaxed mb-2">{r.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-ink">
                        <span>{r.phone || r.city || 'Nearby'}</span>
                        {r.website && (
                          <a
                            href={r.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-evergreen hover:underline font-semibold"
                          >
                            <span>Visit site</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(userId) => {
            setIsAuthOpen(false);
            handleActivatePlan(userId);
          }}
          title="Save &amp; Start Your Plan"
          subtitle="Create your MoveWell account with Google or email to activate and coordinate."
        />
      </main>
    </div>
  );
}
