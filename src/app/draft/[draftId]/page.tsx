'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { AuthModal } from '@/components/auth/AuthModal';
import { WhatChanged } from '@/components/movewell/WhatChanged';
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
  ChevronDown,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Send,
  X,
  Plus,
  Mail,
  Phone,
} from 'lucide-react';
import {
  PlanDraft,
  ProposedTask,
  ProposedMember,
  CaseLocation,
  ResourceCandidate,
  CaseMemberRole,
  PlanChangeRecord,
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
    'senior' | 'discharge' | 'location' | 'safety' | 'budget' | null
  >(null);

  // Edit Form Fields
  const [seniorName, setSeniorName] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationZip, setLocationZip] = useState('');
  const [mobilityConstraint, setMobilityConstraint] = useState(false);
  const [stairsConstraint, setStairsConstraint] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState<number | ''>('');
  const [budgetStatus, setBudgetStatus] = useState<'SET' | 'UNSET'>('UNSET');

  // Assignee dropdown state
  const [assigneeDropdownTaskId, setAssigneeDropdownTaskId] = useState<string | null>(null);

  // Add Member Modal State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRelationship, setNewMemberRelationship] = useState('Daughter');
  const [newMemberCity, setNewMemberCity] = useState('');
  const [newMemberIsLocal, setNewMemberIsLocal] = useState(true);
  const [newMemberRole, setNewMemberRole] = useState<CaseMemberRole>('FAMILY');
  const [newMemberShouldInvite, setNewMemberShouldInvite] = useState(false);
  const [newMemberChannel, setNewMemberChannel] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [newMemberContact, setNewMemberContact] = useState('');

  // Nora Draft Chat state
  const [noraInput, setNoraInput] = useState('');
  const [noraSubmitting, setNoraSubmitting] = useState(false);
  const [noraPendingConfirmation, setNoraPendingConfirmation] = useState<{
    assistantMessage: string;
    previewTitle: string;
    pendingChanges: any[];
  } | null>(null);
  const [whatChangedModalData, setWhatChangedModalData] = useState<PlanChangeRecord | null>(null);

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
          setSeniorName(data.draft.seniorProfile.name);
          setDischargeDate(data.draft.dischargeTiming?.date || '');
          const loc = data.draft.proposedLocations[0];
          setLocationCity(loc?.city || '');
          setLocationZip(loc?.zipCode || '');
          setMobilityConstraint(data.draft.seniorProfile.mobilityConstraint);
          setStairsConstraint(data.draft.seniorProfile.stairsConstraint);
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

  const handleAssignDraftTask = async (taskId: string, newAssignee: string) => {
    if (!draft) return;
    const updatedTasks = draft.proposedTasks.map((t) =>
      t.id === taskId ? { ...t, assigneeName: newAssignee } : t
    );
    setDraft({ ...draft, proposedTasks: updatedTasks });
    setAssigneeDropdownTaskId(null);

    try {
      await fetch(`/api/drafts/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposedTasks: updatedTasks }),
      });
    } catch (e) {
      console.error('Failed to update task assignee:', e);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !newMemberName.trim()) return;

    const newMember: ProposedMember = {
      id: 'pmem-' + Math.random().toString(36).substring(2, 9),
      name: newMemberName.trim(),
      relationship: newMemberRelationship.trim() || 'Helper',
      city: newMemberCity.trim() || undefined,
      isLocal: newMemberIsLocal,
      role: newMemberRole,
      email: newMemberShouldInvite && newMemberChannel === 'EMAIL' ? newMemberContact.trim() : undefined,
      phone: newMemberShouldInvite && newMemberChannel === 'SMS' ? newMemberContact.trim() : undefined,
      invitation:
        newMemberShouldInvite && newMemberContact.trim()
          ? {
              channel: newMemberChannel,
              email: newMemberChannel === 'EMAIL' ? newMemberContact.trim() : undefined,
              phone: newMemberChannel === 'SMS' ? newMemberContact.trim() : undefined,
              status: 'DRAFT',
            }
          : undefined,
    };

    const updatedMembers = [...draft.proposedMembers, newMember];
    setDraft({ ...draft, proposedMembers: updatedMembers });
    setIsAddMemberOpen(false);
    setNewMemberName('');
    setNewMemberRelationship('Daughter');
    setNewMemberCity('');
    setNewMemberContact('');
    setNewMemberShouldInvite(false);

    try {
      await fetch(`/api/drafts/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposedMembers: updatedMembers }),
      });
    } catch (e) {
      console.error('Failed to add member:', e);
    }
  };

  const handleNoraChatSubmit = async (promptOverride?: string) => {
    const query = (promptOverride || noraInput).trim();
    if (!draft || !query || noraSubmitting) return;

    setNoraSubmitting(true);
    try {
      const res = await fetch(`/api/drafts/${draft.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.requiresConfirmation) {
          setNoraPendingConfirmation({
            assistantMessage: data.assistantMessage,
            previewTitle: data.previewTitle,
            pendingChanges: data.pendingChanges,
          });
        } else if (data.draft) {
          setDraft(data.draft);
          if (data.whatChanged) {
            setWhatChangedModalData({
              id: 'change-' + Date.now(),
              caseId: draft.id,
              timestamp: new Date().toISOString(),
              title: data.whatChanged.title || 'Draft updated',
              summaryBullets: [data.whatChanged.causality || "You asked Nora to update the plan."],
              diffs: data.whatChanged.diffs || [],
            });
          }
        }
      }
    } catch (e) {
      console.error('Nora draft chat error:', e);
    } finally {
      setNoraSubmitting(false);
      setNoraInput('');
    }
  };

  const handleApplyNoraChanges = async () => {
    if (!draft || !noraPendingConfirmation) return;
    setNoraSubmitting(true);
    try {
      const res = await fetch(`/api/drafts/${draft.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPLY_CHANGES',
          pendingChanges: noraPendingConfirmation.pendingChanges,
        }),
      });
      const data = await res.json();
      if (data.success && data.draft) {
        setDraft(data.draft);
        setNoraPendingConfirmation(null);
        if (data.whatChanged) {
          setWhatChangedModalData({
            id: 'change-' + Date.now(),
            caseId: draft.id,
            timestamp: new Date().toISOString(),
            title: data.whatChanged.title || 'Draft updated',
            summaryBullets: [data.whatChanged.causality || "You asked Nora to update the plan."],
            diffs: data.whatChanged.diffs || [],
          });
        }
      }
    } catch (e) {
      console.error('Failed to apply Nora changes:', e);
    } finally {
      setNoraSubmitting(false);
    }
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
      <Navbar draftId={draft.id} seniorName={draft.seniorProfile.name} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-line">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-bg text-amber text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-dot" />
              Proposed Plan · Review before starting
            </div>
            <h1 className="text-3xl font-semibold text-ink tracking-[-0.04em]">
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

          {/* Card: Targeted Local Help */}
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

        {/* Family & Care Circle Section */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-ink block mb-0.5">
                Care Circle
              </span>
              <h2 className="text-xl font-bold text-ink">Family &amp; Helpers</h2>
              <p className="text-xs text-muted-ink">
                People coordinating or helping in person. You can stage invitations to MoveWell now.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddMemberOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line bg-white hover:bg-cream text-xs font-semibold text-ink transition-colors shadow-2xs self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 text-evergreen" />
              <span>Add someone who can help</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {draft.proposedMembers.map((m) => (
              <div
                key={m.id}
                className="p-5 bg-white rounded-2xl border border-line shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-evergreen/10 text-evergreen font-bold text-sm flex items-center justify-center">
                        {m.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <strong className="text-sm font-bold text-ink block">{m.name}</strong>
                        <span className="text-xs text-muted-ink block">{m.relationship || m.role}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-sage/60 text-[10px] font-bold text-evergreen">
                      {m.role === 'OWNER' ? 'Coordinator' : m.isLocal ? 'Local Support' : 'Remote'}
                    </span>
                  </div>

                  <div className="text-xs text-muted-ink space-y-1">
                    {m.city && <div>📍 {m.city}</div>}
                    {m.invitation ? (
                      <div className="p-2.5 rounded-xl bg-orange-50/80 border border-orange-200/60 text-[11px] text-amber-950 font-medium">
                        ✉️ Invite staged: {m.invitation.email || m.invitation.phone || m.email || m.phone}
                        <span className="block text-[10px] text-muted-ink mt-0.5">Sends when plan starts</span>
                      </div>
                    ) : m.role !== 'OWNER' ? (
                      <div className="text-[11px] text-muted-ink italic">
                        Collaborating without an app account
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Conversational Nora Draft Assistant Card */}
        <section className="mb-12">
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-line shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-8 h-8 rounded-full bg-evergreen text-white flex items-center justify-center text-xs font-bold">
                ✦
              </span>
              <div>
                <strong className="text-sm font-bold text-ink block leading-none">
                  Adjust your plan with Nora
                </strong>
                <span className="text-xs text-muted-ink">
                  Ask Nora to reassign tasks, change budget, or update destination in plain language.
                </span>
              </div>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2 my-3">
              {[
                draft.proposedMembers.length > 1
                  ? `Have ${draft.proposedMembers[1].name} handle everything local`
                  : 'Assign local tasks to helper',
                'Move the mover calls to me',
                'We actually have a $12,000 budget',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleNoraChatSubmit(chip)}
                  disabled={noraSubmitting}
                  className="px-3 py-1.5 rounded-xl bg-cream/70 hover:bg-sage border border-line text-xs font-medium text-ink transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Multi-Task Change Confirmation Box */}
            {noraPendingConfirmation && (
              <div className="my-4 p-4 rounded-2xl bg-amber-bg/60 border border-amber/30 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber" />
                  <strong className="text-xs font-bold text-ink">
                    {noraPendingConfirmation.previewTitle}
                  </strong>
                </div>
                <div className="text-xs text-ink whitespace-pre-line leading-relaxed">
                  {noraPendingConfirmation.assistantMessage}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleApplyNoraChanges}
                    disabled={noraSubmitting}
                    className="px-4 py-2 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-semibold text-xs transition-colors"
                  >
                    Apply changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoraPendingConfirmation(null)}
                    disabled={noraSubmitting}
                    className="px-4 py-2 rounded-xl border border-line bg-white hover:bg-cream text-ink text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNoraChatSubmit();
              }}
              className="relative mt-2"
            >
              <input
                type="text"
                value={noraInput}
                onChange={(e) => setNoraInput(e.target.value)}
                placeholder="e.g. Have Jennifer handle moving quotes, or set budget to $6,000..."
                disabled={noraSubmitting}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-line bg-cream/50 text-xs text-ink placeholder:text-muted-ink focus:outline-none focus:ring-2 focus:ring-evergreen/20 focus:border-evergreen"
              />
              <button
                type="submit"
                disabled={!noraInput.trim() || noraSubmitting}
                className="absolute right-2 top-2 w-8 h-8 rounded-lg bg-evergreen hover:bg-evergreen-dark text-white flex items-center justify-center transition-colors disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </section>

        {/* Proposed Task Sequence with Interactive Assignee Selector */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-ink block mb-0.5">
                Initial Action Sequence
              </span>
              <h2 className="text-xl font-bold text-ink">What should happen first</h2>
            </div>
            <span className="text-xs text-muted-ink">
              Click assignee to reassign or check to keep/skip
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-line divide-y divide-line overflow-visible shadow-2xs">
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
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-muted-ink">{idx + 1}.</span>
                      <strong
                        className={`text-sm font-semibold ${
                          isApplicable ? 'text-ink' : 'line-through text-muted-ink'
                        }`}
                      >
                        {t.title}
                      </strong>

                      {/* Interactive Assignee Picker */}
                      <div className="relative inline-block ml-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssigneeDropdownTaskId(assigneeDropdownTaskId === t.id ? null : t.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-cream hover:bg-sage/40 border border-line text-xs font-medium text-ink transition-colors"
                        >
                          <span className="w-4 h-4 rounded-full bg-evergreen/10 text-evergreen font-bold text-[10px] flex items-center justify-center">
                            {(t.assigneeName || 'U').charAt(0)}
                          </span>
                          <span>{t.assigneeName || 'Unassigned'}</span>
                          <ChevronDown className="w-3 h-3 text-muted-ink" />
                        </button>

                        {assigneeDropdownTaskId === t.id && (
                          <div
                            className="absolute left-0 mt-1 w-56 bg-white rounded-xl border border-line shadow-lg py-1 z-30 divide-y divide-line/40"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-ink">
                              Assign to
                            </div>
                            <div className="py-1">
                              {draft.proposedMembers.map((member) => (
                                <button
                                  key={member.id}
                                  type="button"
                                  onClick={() => handleAssignDraftTask(t.id, member.name)}
                                  className="w-full text-left px-3 py-1.5 text-xs text-ink hover:bg-sage/40 flex items-center justify-between transition-colors"
                                >
                                  <span className="font-medium">
                                    {member.name} ({member.relationship || member.role})
                                  </span>
                                  {t.assigneeName === member.name && (
                                    <Check className="w-3.5 h-3.5 text-evergreen" />
                                  )}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => handleAssignDraftTask(t.id, 'Unassigned')}
                                className="w-full text-left px-3 py-1.5 text-xs text-muted-ink hover:bg-cream flex items-center justify-between transition-colors"
                              >
                                <span>Unassigned</span>
                                {(!t.assigneeName || t.assigneeName === 'Unassigned') && (
                                  <Check className="w-3.5 h-3.5 text-evergreen" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
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
                    className="px-3.5 py-1.5 rounded-xl border border-line bg-cream hover:bg-white text-xs font-semibold text-evergreen transition-colors"
                  >
                    View options
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Edit Modals */}
        {editingSection && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4"
            onClick={() => setEditingSection(null)}
          >
            <div
              className="w-full max-w-md bg-white rounded-2xl p-6 border border-line shadow-xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-2 border-b border-line">
                <h3 className="text-lg font-bold text-ink">
                  {editingSection === 'senior' && 'Edit Senior Profile'}
                  {editingSection === 'discharge' && 'Edit Discharge Timing'}
                  {editingSection === 'location' && 'Edit Location'}
                  {editingSection === 'safety' && 'Edit Safety & Mobility'}
                  {editingSection === 'budget' && 'Edit Budget'}
                </h3>
                <button
                  onClick={() => setEditingSection(null)}
                  className="text-xs text-muted-ink hover:text-ink font-semibold"
                >
                  Cancel
                </button>
              </div>

              {editingSection === 'discharge' && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-muted-ink">Target Date</label>
                  <input
                    type="date"
                    value={dischargeDate}
                    onChange={(e) => setDischargeDate(e.target.value)}
                    className="w-full px-3 py-2 border border-line rounded-xl text-sm"
                  />
                </div>
              )}

              {editingSection === 'location' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-ink mb-1">City, State</label>
                    <input
                      type="text"
                      value={locationCity}
                      onChange={(e) => setLocationCity(e.target.value)}
                      placeholder="e.g. Houston, TX"
                      className="w-full px-3 py-2 border border-line rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-ink mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={locationZip}
                      onChange={(e) => setLocationZip(e.target.value)}
                      placeholder="e.g. 77004"
                      className="w-full px-3 py-2 border border-line rounded-xl text-sm"
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
                      className="rounded text-evergreen focus:ring-evergreen"
                    />
                    <span>Requires walker, wheelchair, or assistance walking</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stairsConstraint}
                      onChange={(e) => setStairsConstraint(e.target.checked)}
                      className="rounded text-evergreen focus:ring-evergreen"
                    />
                    <span>Home has stairs / bedroom upstairs hazard</span>
                  </label>
                </div>
              )}

              {editingSection === 'budget' && (
                <div className="space-y-3">
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                      <input
                        type="radio"
                        checked={budgetStatus === 'SET'}
                        onChange={() => setBudgetStatus('SET')}
                        className="text-evergreen"
                      />
                      <span>Set numeric budget</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                      <input
                        type="radio"
                        checked={budgetStatus === 'UNSET'}
                        onChange={() => setBudgetStatus('UNSET')}
                        className="text-evergreen"
                      />
                      <span>Leave open</span>
                    </label>
                  </div>
                  {budgetStatus === 'SET' && (
                    <input
                      type="number"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 5000"
                      className="w-full px-3 py-2 border border-line rounded-xl text-sm"
                    />
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handleSaveSection}
                  disabled={savingEdit}
                  className="px-4 py-2 bg-evergreen text-white text-xs font-semibold rounded-xl hover:bg-evergreen-dark transition-colors"
                >
                  {savingEdit ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Family Member Modal */}
        {isAddMemberOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4"
            onClick={() => setIsAddMemberOpen(false)}
          >
            <div
              className="w-full max-w-md bg-white rounded-2xl p-6 border border-line shadow-xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-2 border-b border-line">
                <h3 className="text-lg font-bold text-ink">Add Someone Who Can Help</h3>
                <button
                  onClick={() => setIsAddMemberOpen(false)}
                  className="text-xs text-muted-ink hover:text-ink font-semibold"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-ink mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="e.g. Jennifer"
                    className="w-full px-3 py-2 border border-line rounded-xl text-sm text-ink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-ink mb-1">
                    Relationship to {draft.seniorProfile.name}
                  </label>
                  <input
                    type="text"
                    required
                    value={newMemberRelationship}
                    onChange={(e) => setNewMemberRelationship(e.target.value)}
                    placeholder="e.g. Daughter, Son, Neighbor, Friend"
                    className="w-full px-3 py-2 border border-line rounded-xl text-sm text-ink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-ink mb-1">Where are they located?</label>
                  <input
                    type="text"
                    value={newMemberCity}
                    onChange={(e) => setNewMemberCity(e.target.value)}
                    placeholder="e.g. Houston, TX (or leave blank)"
                    className="w-full px-3 py-2 border border-line rounded-xl text-sm text-ink"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMemberIsLocal}
                    onChange={(e) => setNewMemberIsLocal(e.target.checked)}
                    className="rounded text-evergreen focus:ring-evergreen"
                  />
                  <span>Available in person (local support)</span>
                </label>

                {/* Conditional Invitation Section */}
                <div className="pt-2 border-t border-line space-y-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMemberShouldInvite}
                      onChange={(e) => setNewMemberShouldInvite(e.target.checked)}
                      className="rounded text-evergreen focus:ring-evergreen"
                    />
                    <span>Invite them to collaborate in MoveWell</span>
                  </label>

                  {newMemberShouldInvite && (
                    <div className="space-y-3 pl-6">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                          <input
                            type="radio"
                            checked={newMemberChannel === 'EMAIL'}
                            onChange={() => setNewMemberChannel('EMAIL')}
                            className="text-evergreen"
                          />
                          <span>Email</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                          <input
                            type="radio"
                            checked={newMemberChannel === 'SMS'}
                            onChange={() => setNewMemberChannel('SMS')}
                            className="text-evergreen"
                          />
                          <span>Text message (SMS)</span>
                        </label>
                      </div>

                      <input
                        type={newMemberChannel === 'EMAIL' ? 'email' : 'tel'}
                        required={newMemberShouldInvite}
                        value={newMemberContact}
                        onChange={(e) => setNewMemberContact(e.target.value)}
                        placeholder={
                          newMemberChannel === 'EMAIL'
                            ? 'jennifer@example.com'
                            : '(555) 123-4567'
                        }
                        className="w-full px-3 py-2 border border-line rounded-xl text-sm text-ink"
                      />
                      <p className="text-[11px] text-muted-ink">
                        Invitation will be staged and sent when you choose to start the plan.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-evergreen text-white text-xs font-semibold rounded-xl hover:bg-evergreen-dark transition-colors"
                  >
                    Add member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* What Changed Modal */}
        {whatChangedModalData && (
          <WhatChanged
            change={whatChangedModalData}
            onDismiss={() => setWhatChangedModalData(null)}
          />
        )}

        {/* Resource Viewer Modal */}
        {viewingCategory && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4"
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
