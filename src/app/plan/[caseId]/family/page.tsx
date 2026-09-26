'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AIAssistant } from '@/components/assistant/AIAssistant';
import { CaseOverview, CaseMemberRole } from '@/types';
import { Users, UserPlus, CheckCircle2, MapPin, Trash2, X, Clock } from 'lucide-react';

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
        // Reset form and close modal
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
      <div className="min-h-screen bg-sand-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { members, tasks, seniorProfile, daysUntilDischarge } = overview;

  return (
    <div className="min-h-screen bg-sand-100 flex flex-col">
      <Navbar
        caseId={caseId}
        seniorName={`${seniorProfile.name}'s Family`}
        daysUntilDischarge={daysUntilDischarge}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-brand-950">Family Team &amp; Coordination</h1>
            <p className="text-xs text-stone-500 font-medium mt-1">
              Coordinating {seniorProfile.name}&apos;s care network and tasks
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-brand-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-xs hover:bg-brand-800 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        </div>

        {/* Member Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {members.map((member) => {
            const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
            const completedCount = memberTasks.filter((t) => t.status === 'COMPLETED').length;

            return (
              <div key={member.id} className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-4 relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-900 font-bold text-base flex items-center justify-center border border-brand-200 shrink-0">
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-serif font-bold text-stone-900">{member.name}</h3>
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-sand-200 text-stone-700 border border-stone-300">
                          {member.role}
                        </span>
                      </div>
                      {member.relationship && (
                        <p className="text-xs text-stone-500 font-semibold">{member.relationship}</p>
                      )}
                      {member.city && (
                        <p className="text-[11px] text-stone-400 flex items-center mt-0.5">
                          <MapPin className="w-3 h-3 mr-1 text-stone-400 shrink-0" />
                          {member.city} ({member.isLocal ? 'Local Support' : 'Remote Coordinator'})
                        </p>
                      )}
                      {member.availability && (
                        <p className="text-[11px] text-stone-400 flex items-center mt-0.5">
                          <Clock className="w-3 h-3 mr-1 text-stone-400 shrink-0" />
                          {member.availability}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    title="Remove Team Member"
                    className="text-stone-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-sand-50 p-3.5 rounded-2xl border border-stone-200 text-xs flex justify-between">
                  <span className="text-stone-600 font-medium">Assigned Tasks</span>
                  <span className="font-bold text-brand-950">{completedCount} / {memberTasks.length} Done</span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-stone-700 uppercase tracking-wide">Assigned Work</p>
                  {memberTasks.length === 0 ? (
                    <p className="text-xs text-stone-400 italic">No tasks currently assigned.</p>
                  ) : (
                    memberTasks.map((t) => (
                      <div key={t.id} className="text-xs p-2.5 rounded-xl bg-sand-100/60 border border-stone-200 flex justify-between items-center">
                        <span className={`font-medium ${t.status === 'COMPLETED' ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                          {t.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-stone-200">
                          {t.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-brand-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-stone-200 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-stone-900">Add Team Member</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Thompson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as CaseMemberRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="FAMILY">Family</option>
                    <option value="OWNER">Primary Caregiver / Owner</option>
                    <option value="HELPER">Helper / Neighbor</option>
                    <option value="PROFESSIONAL">Professional / Case Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Daughter"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Houston, TX"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Availability
                </label>
                <input
                  type="text"
                  placeholder="e.g. Evenings & Weekends"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isLocal"
                  checked={isLocal}
                  onChange={(e) => setIsLocal(e.target.checked)}
                  className="w-4 h-4 text-brand-900 border-stone-300 rounded focus:ring-brand-500"
                />
                <label htmlFor="isLocal" className="text-xs font-semibold text-stone-700">
                  Local to Senior (Can provide hands-on help)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-brand-900 text-white font-bold text-xs hover:bg-brand-800 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AIAssistant caseId={caseId} onPlanUpdated={fetchOverview} />
      <MobileNav caseId={caseId} />
    </div>
  );
}
