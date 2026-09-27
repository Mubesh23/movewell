'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AIAssistant } from '@/components/assistant/AIAssistant';
import { PageHeader } from '@/components/movewell/PageHeader';
import { SectionHeader } from '@/components/movewell/SectionHeader';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { CaseOverview, CaseMemberRole } from '@/types';
import { UserPlus, MapPin, Clock, Trash2, CheckCircle2 } from 'lucide-react';

export default function FamilyPage() {
  const params = useParams();
  const caseId = params.caseId as string;

  const [overview, setOverview] = useState<CaseOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New member form state
  const [name, setName] = useState('');
  const [role, setRole] = useState<CaseMemberRole>('FAMILY');
  const [relationship, setRelationship] = useState('');
  const [city, setCity] = useState('');
  const [isLocal, setIsLocal] = useState(true);
  const [availability, setAvailability] = useState('');

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

  if (loading || !overview) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-forest border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { members, tasks, seniorProfile, daysUntilDischarge } = overview;
  const localCount = members.filter((m) => m.isLocal).length;
  const assignedTasksCount = tasks.filter((t) => t.assigneeId).length;

  const summaryItems = [
    { label: 'Care Team', value: `${members.length} members` },
    { label: 'Local Support', value: `${localCount} on-site` },
    { label: 'Assigned Work', value: `${assignedTasksCount} of ${tasks.length} tasks` },
  ];

  return (
    <div className="min-h-screen bg-canvas flex flex-col font-sans">
      <Navbar
        caseId={caseId}
        seniorName={`${seniorProfile.name}'s Family`}
        daysUntilDischarge={daysUntilDischarge}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        <PageHeader
          title="Care Team & Family"
          subtitle={`Coordinating ${seniorProfile.name}'s care network, local presence, and assigned responsibilities.`}
          statusLabel={`${members.length} Team Members`}
          statusVariant="info"
          summaryItems={summaryItems}
          action={
            <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </Button>
          }
        />

        {/* Directory of Members */}
        <div className="space-y-4">
          {members.map((member) => {
            const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
            const completedCount = memberTasks.filter((t) => t.status === 'COMPLETED').length;

            return (
              <Section key={member.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-forest/10 text-forest font-serif font-bold text-base flex items-center justify-center shrink-0">
                      {member.name.charAt(0)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-charcoal">{member.name}</h3>
                        <Badge variant={member.role === 'OWNER' ? 'forest' : 'outline'}>
                          {member.role === 'OWNER' ? 'Primary Lead' : member.role}
                        </Badge>
                        {member.relationship && (
                          <span className="text-xs text-muted font-medium">
                            · {member.relationship}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted flex-wrap">
                        {member.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-stone-text" />
                            {member.city} ({member.isLocal ? 'Local' : 'Remote'})
                          </span>
                        )}
                        {member.availability && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-stone-text" />
                            {member.availability}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    title="Remove member"
                    className="text-stone-text hover:text-status-critical p-1.5 rounded-md hover:bg-stone-subtle/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Assigned Tasks for this member */}
                <div className="mt-5 pt-4 border-t border-stone-line/70">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="font-semibold uppercase tracking-wider text-muted">
                      Assigned Responsibilities
                    </span>
                    <span className="text-muted">
                      {completedCount} of {memberTasks.length} completed
                    </span>
                  </div>

                  {memberTasks.length === 0 ? (
                    <p className="text-xs text-muted/70 italic">No tasks currently assigned to {member.name}.</p>
                  ) : (
                    <div className="space-y-2">
                      {memberTasks.map((t) => {
                        const isDone = t.status === 'COMPLETED';
                        return (
                          <div
                            key={t.id}
                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface border border-stone-line/60 text-xs"
                          >
                            <span className={isDone ? 'line-through text-muted' : 'text-charcoal font-medium'}>
                              {t.title}
                            </span>
                            <div className="flex items-center gap-2">
                              {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />}
                              <Badge variant={isDone ? 'completed' : 'outline'} className="text-[10px]">
                                {isDone ? 'Done' : t.status.toLowerCase().replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Section>
            );
          })}
        </div>
      </main>

      {/* Add Member Dialog */}
      <Dialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Care Team Member"
        description={`Add a family member, neighbor, or professional to coordinate ${seniorProfile.name}'s transition.`}
      >
        <form onSubmit={handleAddMember} className="space-y-4 mt-2">
          <Input
            label="Full Name *"
            required
            placeholder="e.g. Sarah Thompson"
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
              placeholder="e.g. Daughter"
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
              className="w-4 h-4 text-forest border-stone-border rounded focus:ring-forest accent-forest"
            />
            <label htmlFor="isLocal" className="text-xs text-charcoal font-medium cursor-pointer">
              Local to senior (available for in-person support)
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-line">
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

      <AIAssistant caseId={caseId} onPlanUpdated={fetchOverview} />
      <MobileNav caseId={caseId} />
    </div>
  );
}
