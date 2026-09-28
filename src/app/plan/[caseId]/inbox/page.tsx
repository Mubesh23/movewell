'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { MessageSquare, Users, Sparkles, BellRing } from 'lucide-react';
import { openNoraWithPrompt } from '@/components/assistant/AIAssistant';

export default function InboxPage() {
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
                Family & Provider Inbox
              </h1>
              <span className="text-[11px] font-semibold tracking-wider text-[#9aa9a3] uppercase bg-[#edf2ee] px-2 py-0.5 rounded-full">
                Coming soon
              </span>
            </div>
            <p className="mt-1 text-sm text-[#71847d]">
              Unified communication thread for family updates, coordinator messages, and incoming provider replies.
            </p>
          </div>
        </div>

        {/* Empty State / Coming Soon Explainer */}
        <div className="rounded-2xl border border-[#e1e9e3] bg-white p-8 text-center max-w-xl mx-auto my-8">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e8f1ea] text-[#1f4d45] mb-4">
            <MessageSquare size={24} />
          </div>
          <h2 className="text-lg font-bold text-[#183331]">No Active Messages</h2>
          <p className="mt-2 text-sm text-[#71847d] leading-relaxed">
            Centralized family chat and provider messaging threads are coming in an upcoming release. In the meantime, task comments and Nora activity history keep everyone aligned in real time.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openNoraWithPrompt('Summarize what our family has completed and what is currently pending.')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1f4d45] hover:bg-[#153c36] text-white text-xs font-semibold px-4 py-2.5 shadow-xs transition-colors"
            >
              <Sparkles size={14} className="text-[#c8e1ce]" />
              <span>Ask Nora for a status summary</span>
            </button>
          </div>
        </div>

        {/* Preview Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-[#e1e9e3] bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#183331] mb-2">
              <Users size={16} className="text-[#1f4d45]" />
              <span>Family Decision Threads</span>
            </div>
            <p className="text-xs text-[#71847d] leading-5">
              Discuss specific tasks with your care circle without scattering decisions across group text messages and buried emails.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e1e9e3] bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#183331] mb-2">
              <BellRing size={16} className="text-[#1f4d45]" />
              <span>Timely Reminders</span>
            </div>
            <p className="text-xs text-[#71847d] leading-5">
              Notification digests keep remote family members updated when milestones are achieved without alert fatigue.
            </p>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
