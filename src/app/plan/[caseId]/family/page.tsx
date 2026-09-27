'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { NoraReadCard } from '@/components/movewell/NoraReadCard';
import { openNoraWithPrompt } from '@/components/assistant/AIAssistant';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { CaseOverview, CaseMemberRole, TransitionTask } from '@/types';
import {
  UserPlus,
  MapPin,
  Clock,
  Trash2,
  CheckCircle2,
  Users,
  Check,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Mail,
} from 'lucide-react';

const AVATAR_TONES = [
  'bg-[#d7e6d9] text-[#356553]',
  'bg-[#f1ddcd] text-[#9a5d38]',
  'bg-[#d9e0ed] text-[#4d6180]',
  'bg-[#ede4d9] text-[#7d5e38]',
  'bg-[#e2e0ed] text-[#554d80]',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return (name.substring(0, 2) || 'FM').toUpperCase();
}

export default function FamilyPage() {
  const params = useParams();
  const caseId = params.caseId as string;

  const [overview, setOverview] = useState<CaseOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  // New member form state
  const [name, setName] = useState('');
  const [role, setRole] = useState<CaseMemberRole>('FAMILY');
  const [relationship, setRelationship] = useState('');
  const [city, setCity] = useState('');
  const [isLocal, setIsLocal] = useState(true);
  const [availability, setAvailability] = useState('');
  const [email, setEmail] = useState('');
  const [sendInvite, setSendInvite] = useState(false);

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

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role,
          relationship: relationship.trim() || undefined,
          city: city.trim() || undefined,
          isLocal,
          availability: availability.trim() || undefined,
          email: sendInvite && email.trim() ? email.trim() : (email.trim() || undefined),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setName('');
        setRole('FAMILY');
        setRelationship('');
        setCity('');
        setIsLocal(true);
        setAvailability('');
        setEmail('');
        setSendInvite(false);
        setIsAddModalOpen(false);
        await fetchOverview();
      } else {
        alert(data.error || 'Failed to add team member');
      }
    } catch (err) {
      console.error('Add member error:', err);
      alert('Error adding team member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;

    try {
      const res = await fetch(`/api/cases/${caseId}/members/${memberId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      } else {
        alert(data.error || 'Failed to remove team member');
      }
    } catch (err) {
      console.error('Delete member error:', err);
      alert('Error removing team member');
    }
  };

  const handleToggleTaskComplete = async (task: TransitionTask) => {
    const isDone = task.status === 'COMPLETED';
    try {
      const res = await fetch(`/api/cases/${caseId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isDone ? 'REOPEN' : 'COMPLETE',
          actorName: 'Family Member',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  if (loading || !overview) {
    return (
      <div className="min-h-screen bg-[#f7f8f5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1f4d45] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { members, tasks, seniorProfile, daysUntilDischarge } = overview;
  const localCount = members.filter((m) => m.isLocal).length;
  const assignedTasksCount = tasks.filter((t) => t.assigneeId).length;
  const completedTasksCount = tasks.filter((t) => t.status === 'COMPLETED').length;

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
              <span>{members.length} {members.length === 1 ? 'person' : 'people'}</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-[#183331]">
              People & responsibilities
            </h1>
            <p className="mt-1.5 max-w-xl text-xs sm:text-sm leading-relaxed text-[#71847d]">
              Keep everyone aligned on who is doing what for {seniorProfile.name}, and make it easy to ask for help.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-[#1f4d45] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#153c36] transition-colors md:self-auto shadow-2xs"
          >
            <UserPlus size={16} />
            <span>Invite family</span>
          </button>
        </div>

        {/* 2-Column Responsive Workspace Grid */}
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          {/* Main Left Column: Your Family Team */}
          <section className="rounded-2xl border border-[#e0e9e2] bg-white overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#e7eee8] px-5 py-4">
              <div>
                <h2 className="font-semibold text-base text-[#183331]">Your family team</h2>
                <p className="mt-0.5 text-xs text-[#879890]">
                  Everyone coordinating {seniorProfile.name}&apos;s transition plan
                </p>
              </div>
              <span className="rounded-full bg-[#e8f1ea] px-2.5 py-1 text-xs font-semibold text-[#3f6c5c]">
                {localCount} on-site
              </span>
            </div>

            <div className="divide-y divide-[#edf2ee]">
              {members.map((member, idx) => {
                const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
                const completedCount = memberTasks.filter((t) => t.status === 'COMPLETED').length;
                const tone = AVATAR_TONES[idx % AVATAR_TONES.length];
                const initials = getInitials(member.name);
                const isExpanded = expandedMemberId === member.id;

                let statusBadgeText = 'Available';
                let statusBadgeClass = 'bg-[#f0f2f1] text-[#71847d]';

                if (member.role === 'OWNER') {
                  statusBadgeText = 'Primary lead';
                  statusBadgeClass = 'bg-[#e8f3ea] text-[#4d775f]';
                } else if (memberTasks.length > 0 && completedCount === memberTasks.length) {
                  statusBadgeText = 'All tasks done';
                  statusBadgeClass = 'bg-[#e8f3ea] text-[#4d775f]';
                } else if (memberTasks.length > 0) {
                  statusBadgeText = 'On track';
                  statusBadgeClass = 'bg-[#e8f1ea] text-[#3f6c5c]';
                }

                return (
                  <div key={member.id} className="p-5 transition-colors hover:bg-[#fafbfa]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Avatar + Info */}
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                        <div
                          className={`grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold ${tone}`}
                        >
                          {initials}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-[#183331]">{member.name}</h3>
                            <span className="text-xs text-[#82928b]">
                              {member.role === 'OWNER'
                                ? 'You · Coordinator'
                                : member.relationship || member.role}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-3 text-xs text-[#71847d] flex-wrap">
                            <span>
                              {memberTasks.length} {memberTasks.length === 1 ? 'task' : 'tasks'} · {completedCount} completed
                            </span>
                            {member.email && (
                              <span className="inline-flex items-center gap-1 text-[#3f6c5c]">
                                <Mail size={12} className="text-[#3f6c5c]" />
                                {member.email}
                              </span>
                            )}
                            {member.city && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={12} className="text-[#a0aea8]" />
                                {member.city} ({member.isLocal ? 'Local' : 'Remote'})
                              </span>
                            )}
                            {member.availability && (
                              <span className="inline-flex items-center gap-1">
                                <Clock size={12} className="text-[#a0aea8]" />
                                {member.availability}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status + Actions */}
                      <div className="flex items-center gap-2.5 self-end sm:self-center">
                        {member.invitationStatus === 'PENDING' && (
                          <span className="w-fit rounded-full px-2.5 py-1 text-[11px] font-medium bg-[#e8f1ea] text-[#3f6c5c] inline-flex items-center gap-1">
                            <Mail size={11} />
                            Invited via email
                          </span>
                        )}
                        <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-medium ${statusBadgeClass}`}>
                          {statusBadgeText}
                        </span>

                        {memberTasks.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                            className="p-1.5 rounded-lg text-[#71847d] hover:bg-[#edf2ee] hover:text-[#183331] transition-colors"
                            title={isExpanded ? 'Hide tasks' : 'View tasks'}
                            aria-label={isExpanded ? `Hide tasks for ${member.name}` : `View tasks for ${member.name}`}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        )}

                        {member.role !== 'OWNER' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(member.id, member.name)}
                            title="Remove member"
                            className="text-[#a0aea8] hover:text-[#b9382c] p-1.5 rounded-lg hover:bg-[#fbedeb] transition-colors"
                            aria-label={`Remove ${member.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Member Assigned Tasks Drawer */}
                    {isExpanded && memberTasks.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[#edf2ee] pl-4 sm:pl-14 space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#91a39c] mb-2">
                          Assigned tasks for {member.name}
                        </p>
                        <div className="space-y-1.5">
                          {memberTasks.map((task) => {
                            const isDone = task.status === 'COMPLETED';
                            return (
                              <div
                                key={task.id}
                                className="flex items-center justify-between py-2 px-3 rounded-xl border border-[#edf2ee] bg-white text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleTaskComplete(task)}
                                    className={`size-4 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                                      isDone
                                        ? 'bg-[#1f4d45] border-[#1f4d45] text-white'
                                        : 'border-[#bcd0c2] hover:border-[#56816d]'
                                    }`}
                                  >
                                    {isDone && <Check size={11} strokeWidth={3} />}
                                  </button>
                                  <span
                                    className={`font-medium truncate ${
                                      isDone ? 'line-through text-[#91a39c]' : 'text-[#183331]'
                                    }`}
                                  >
                                    {task.title}
                                  </span>
                                </div>
                                {task.dueDate && (
                                  <span className="text-[11px] text-[#82928b] shrink-0 ml-2">
                                    Due {task.dueDate}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Aside Column */}
          <aside className="flex flex-col gap-6">
            {/* Nora Read Card */}
            <NoraReadCard
              eyebrow="Nora's suggestion"
              headline="Share the next update"
              explanation={`Your care circle has ${members.length} members coordinating ${seniorProfile.name}'s transition. A quick note about upcoming milestones keeps everyone aligned without extra meetings.`}
              actionLabel="Draft an update"
              onAction={() =>
                openNoraWithPrompt(
                  `Help me draft a clear, empathetic update to share with our family care circle about ${seniorProfile.name}'s transition.`
                )
              }
            />

            {/* Care Circle Rhythm Card */}
            <section className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-2xs">
              <h2 className="font-semibold text-[#183331]">Care circle rhythm</h2>
              <p className="mt-1 text-xs text-[#71847d]">
                {assignedTasksCount} of {tasks.length} tasks assigned across {members.length} members
              </p>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-[#71847d] mb-1.5 font-medium">
                  <span>Task coverage</span>
                  <span>{Math.round((assignedTasksCount / (tasks.length || 1)) * 100)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#edf2ee] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#1f4d45] transition-all duration-300"
                    style={{
                      width: `${Math.round((assignedTasksCount / (tasks.length || 1)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-[11px] text-[#8a9b94]">
                  <span>{completedTasksCount} completed</span>
                  <span>{tasks.length - completedTasksCount} remaining</span>
                </div>
              </div>

              {/* Staged Collaboration Note */}
              <div className="mt-5 pt-4 border-t border-[#edf2ee] flex items-start gap-2.5 text-xs text-[#668077]">
                <ShieldCheck size={16} className="text-[#3f6c5c] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Staged collaboration:</strong> Assign tasks to family members now. When you invite them, they&apos;ll see exactly what&apos;s on their plate.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Invite Family or Helper"
        description={`Add a family member, neighbor, or professional to coordinate ${seniorProfile.name}'s transition.`}
      >
        <form onSubmit={handleAddMember} className="space-y-4 mt-2">
          <Input
            label="Full Name *"
            required
            placeholder="e.g. Sarah Miller"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Role *"
              value={role}
              onChange={(e) => setRole(e.target.value as CaseMemberRole)}
              options={[
                { value: 'FAMILY', label: 'Family Member' },
                { value: 'OWNER', label: 'Primary Lead / Owner' },
                { value: 'HELPER', label: 'Helper / Neighbor' },
                { value: 'PROFESSIONAL', label: 'Professional / Care Manager' },
              ]}
            />

            <Input
              label="Relationship"
              placeholder="e.g. Daughter, Son, Sister"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Location / City"
              placeholder="e.g. Houston, TX"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <Input
              label="Availability"
              placeholder="e.g. Evenings & Weekends"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="isLocal"
              checked={isLocal}
              onChange={(e) => setIsLocal(e.target.checked)}
              className="w-4 h-4 text-[#1f4d45] border-[#cbdcd0] rounded focus:ring-[#1f4d45] accent-[#1f4d45]"
            />
            <label htmlFor="isLocal" className="text-xs text-[#183331] font-medium cursor-pointer">
              Local to {seniorProfile.name} (available for in-person support)
            </label>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-[#edf2ee]">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. sarah@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex items-center gap-2.5 pt-0.5">
              <input
                type="checkbox"
                id="sendInvite"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="w-4 h-4 text-[#1f4d45] border-[#cbdcd0] rounded focus:ring-[#1f4d45] accent-[#1f4d45]"
              />
              <label htmlFor="sendInvite" className="text-xs text-[#183331] font-medium cursor-pointer">
                Send an email invitation to collaborate on this plan
              </label>
            </div>
            {sendInvite && (
              <p className="text-[11px] text-[#71847d] pl-6">
                They will receive an email invite with access to their assigned tasks.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#e0e9e2]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Add Team Member'}
            </Button>
          </div>
        </form>
      </Dialog>
    </WorkspaceShell>
  );
}
