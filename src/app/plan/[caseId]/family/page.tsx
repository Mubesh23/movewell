'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AIAssistant } from '@/components/assistant/AIAssistant';
import { CaseOverview } from '@/types';
import { Users, UserPlus, CheckCircle2, MapPin } from 'lucide-react';

export default function FamilyPage() {
  const params = useParams();
  const caseId = params.caseId as string;

  const [overview, setOverview] = useState<CaseOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}`);
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
              Coordinating Maria&apos;s transition across Chicago and Houston
            </p>
          </div>
          <button className="bg-brand-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-xs">
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        </div>

        {/* Member Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {members.map((member) => {
            const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
            const completedCount = memberTasks.filter((t) => t.status === 'COMPLETED').length;

            return (
              <div key={member.id} className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-900 font-bold text-base flex items-center justify-center border border-brand-200">
                    {member.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-stone-900">{member.name}</h3>
                    <p className="text-xs text-stone-500 font-semibold">{member.relationship}</p>
                    <p className="text-[11px] text-stone-400 flex items-center mt-0.5">
                      <MapPin className="w-3 h-3 mr-1 text-stone-400" />
                      {member.city} ({member.isLocal ? 'Local Support' : 'Remote Coordinator'})
                    </p>
                  </div>
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

      <AIAssistant caseId={caseId} onPlanUpdated={fetchOverview} />
      <MobileNav caseId={caseId} />
    </div>
  );
}
