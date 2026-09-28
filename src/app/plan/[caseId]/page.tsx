'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { MilestoneTimelineStrip } from '@/components/movewell/MilestoneTimelineStrip';
import { WhatChanged } from '@/components/movewell/WhatChanged';
import { TaskRow } from '@/components/movewell/TaskRow';
import { ActivityTimeline } from '@/components/movewell/ActivityTimeline';
import { openNoraWithPrompt } from '@/components/assistant/AIAssistant';
import { CaseEvent, CaseOverview, TransitionTask } from '@/types';
import { TaskCompletionModal } from '@/components/movewell/TaskCompletionModal';
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Home,
  MessageCircle,
  Plus,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react';

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const [overview, setOverview] = useState<CaseOverview | null>(null);
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [showChanges, setShowChanges] = useState(false);
  const [completingTask, setCompletingTask] = useState<TransitionTask | null>(null);

  const fetchOverview = React.useCallback(async () => {
    try {
      const [caseRes, eventsRes] = await Promise.all([
        fetch(`/api/cases/${caseId}`, { cache: 'no-store' }),
        fetch(`/api/cases/${caseId}/events`, { cache: 'no-store' }),
      ]);
      const caseData = await caseRes.json();
      const eventsData = await eventsRes.json().catch(() => ({ events: [] }));
      if (caseData.success) {
        setOverview(caseData.data);
      } else {
        setError(caseData.error);
      }
      if (eventsData.success) {
        setEvents(eventsData.events || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (caseId) fetchOverview();
  }, [caseId, fetchOverview]);

  const handleCompleteTask = async (task: TransitionTask, note?: string) => {
    setUpdatingTaskId(task.id);
    try {
      const res = await fetch(`/api/cases/${caseId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COMPLETE',
          actorName: 'Family Coordinator',
          completionNotes: note,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleReopenTask = async (task: TransitionTask) => {
    setUpdatingTaskId(task.id);
    try {
      const res = await fetch(`/api/cases/${caseId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REOPEN',
          actorName: 'Family Coordinator',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleAssignTask = async (taskId: string, memberId: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN',
          assigneeId: memberId || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDueDate = async (taskId: string, dueDate: string) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`/api/cases/${caseId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SET_DUE_DATE',
          dueDate: dueDate || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8f5] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#1f4d45] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#71847d] font-medium">Opening family workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen bg-[#f7f8f5] flex flex-col items-center justify-center px-4">
        <div className="bg-white p-6 rounded-2xl border border-[#e0e9e2] text-center max-w-md shadow-2xs space-y-3">
          <AlertCircle className="w-8 h-8 text-[#b96c2c] mx-auto" />
          <h2 className="text-lg font-bold text-[#183331]">Plan Not Found</h2>
          <p className="text-xs text-[#71847d]">{error || 'Could not load case data.'}</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-xl bg-[#1f4d45] text-white text-xs font-semibold hover:bg-[#153c36] transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const {
    caseData,
    seniorProfile,
    members,
    tasks,
    costSummary,
    daysUntilDischarge,
    urgentTask,
    latestChange,
  } = overview;

  const openTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const readyTasks = tasks.filter((t) => t.status === 'READY');
  const displayTasks = tasks.slice(0, 5);

  return (
    <WorkspaceShell
      caseId={caseId}
      seniorName={seniorProfile.name}
      daysUntilDischarge={daysUntilDischarge}
    >
      <div className="space-y-8">
        {/* Editorial Page Header with Actions */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#71847d]">
              <span className="font-semibold text-[#1f4d45]">Active transition</span>
              <span className="size-1 rounded-full bg-[#b8c8bd]" />
              <span>
                {daysUntilDischarge !== undefined ? `Discharge in ${daysUntilDischarge} days` : 'Plan active'}
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-[#183331]">
              Helping {seniorProfile.name} move home
            </h1>
            <p className="mt-1.5 max-w-xl text-xs sm:text-sm leading-relaxed text-[#71847d]">
              A shared family plan for {seniorProfile.name}&apos;s recovery, discharge, and next chapter at home.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {latestChange && (
              <button
                type="button"
                onClick={() => setShowChanges(!showChanges)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#cbdcd0] bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#2d594d] hover:bg-[#f1f6f1] transition-colors shadow-2xs"
              >
                <Clock3 size={15} />
                <span>{showChanges ? 'Hide changes' : 'What changed?'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => openNoraWithPrompt(`What is the highest priority decision for ${seniorProfile.name}'s transition today?`)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1f4d45] hover:bg-[#153c36] px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors"
            >
              <Sparkles size={15} className="text-[#c8e1ce]" />
              <span>Ask Nora</span>
            </button>
          </div>
        </div>

        {/* What Changed Highlight Banner (collapsible with smooth height motion) */}
        <AnimatePresence>
          {latestChange && showChanges && (
            <motion.div
              key="what-changed-banner"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pb-1">
                <WhatChanged change={latestChange} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3 Summary Stat Cards */}
        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3" aria-label="Key transition metrics">
          <div className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a9b94]">
                Next milestone
              </p>
              <Home size={17} className="text-[#7e9d8a]" />
            </div>
            <p className="mt-3 text-xl sm:text-2xl font-semibold tracking-[-0.04em] text-[#183331]">
              {urgentTask ? urgentTask.title : 'Confirm discharge'}
            </p>
            <p className="mt-1 text-xs text-[#84958d]">
              {daysUntilDischarge !== undefined ? `${daysUntilDischarge} days away` : 'Top attention priority'}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a9b94]">
                Open tasks
              </p>
              <ClipboardList size={17} className="text-[#7e9d8a]" />
            </div>
            <p className="mt-3 text-xl sm:text-2xl font-semibold tracking-[-0.04em] text-[#183331]">
              {openTasks.length} tasks
            </p>
            <p className="mt-1 text-xs text-[#84958d]">
              {readyTasks.length} ready for attention
            </p>
          </div>

          <div className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-2xs sm:col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a9b94]">
                Estimated costs
              </p>
              <WalletCards size={17} className="text-[#7e9d8a]" />
            </div>
            <p className="mt-3 text-xl sm:text-2xl font-semibold tracking-[-0.04em] text-[#183331]">
              ${costSummary.minTotal.toLocaleString()} – ${costSummary.maxTotal.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-[#84958d]">
              {caseData.budget
                ? `of $${caseData.budget.toLocaleString()} target`
                : 'Budget open (no set ceiling)'}
            </p>
          </div>
        </section>

        {/* 2-Column Operational Grid */}
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr] items-start">
          {/* Left Column: Attention-First Plan */}
          <section className="rounded-2xl border border-[#e0e9e2] bg-white shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#edf2ee] px-5 py-4">
              <div>
                <h2 className="font-semibold text-base text-[#183331]">
                  Your plan
                </h2>
                <p className="mt-0.5 text-xs text-[#879890]">
                  The next right steps, in one calm place
                </p>
              </div>
              <Link
                href={`/plan/${caseId}/tasks`}
                className="text-xs font-semibold text-[#3f6c5c] hover:text-[#1f4d45] inline-flex items-center gap-1 transition-colors"
              >
                <span>View full plan</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>

            <div className="divide-y divide-[#edf2ee] px-2 sm:px-4">
              {displayTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  allTasks={tasks}
                  members={members}
                  onComplete={(task) => setCompletingTask(task)}
                  onReopen={handleReopenTask}
                  onAssign={handleAssignTask}
                  onUpdateDueDate={handleUpdateDueDate}
                  onAskNora={(t) =>
                    openNoraWithPrompt(
                      `Can you help explain the task "${t.title}" and what needs to be done next?`
                    )
                  }
                  isUpdating={updatingTaskId === task.id}
                />
              ))}
            </div>

            <div className="bg-[#fbfcfa] border-t border-[#edf2ee] p-4 text-center">
              <Link
                href={`/plan/${caseId}/tasks`}
                className="text-xs font-semibold text-[#3f6c5c] hover:underline"
              >
                See all {tasks.length} tasks across phases &rarr;
              </Link>
            </div>
          </section>

          {/* Right Column: Contextual Nora & Family Team */}
          <div className="flex flex-col gap-6">
            {/* Dark Forest Nora Sidecard */}
            <section className="rounded-2xl border border-[#163a34] bg-[#1f4d45] p-5 sm:p-6 text-white shadow-xs">
              <div className="flex items-center justify-between">
                <div className="grid size-9 place-items-center rounded-full bg-white/15 text-white">
                  <Sparkles size={17} />
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#c8e1ce]">
                  Nora
                </span>
              </div>
              <h2 className="mt-5 text-lg font-semibold leading-snug">
                Need a hand with the next step?
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#c4d9ce]">
                Ask Nora to adjust the plan, find verified local help, or coordinate family responsibilities.
              </p>
              <button
                type="button"
                onClick={() =>
                  openNoraWithPrompt(`What's the best next step for our family today regarding ${seniorProfile.name}?`)
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#1f4d45] hover:bg-[#eef5f0] transition-colors shadow-2xs"
              >
                <span>Open conversation</span>
                <MessageCircle size={15} />
              </button>
            </section>

            {/* Family Team Block */}
            <section className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
                <div>
                  <h2 className="font-semibold text-sm sm:text-base text-[#183331]">
                    Family team
                  </h2>
                  <p className="text-xs text-[#879890]">Care circle aligned</p>
                </div>
                <Link
                  href={`/plan/${caseId}/family`}
                  className="text-xs font-semibold text-[#3f6c5c] hover:text-[#1f4d45] inline-flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>Manage</span>
                </Link>
              </div>

              <div className="mt-4 flex items-center">
                {members.slice(0, 4).map((member, idx) => {
                  const initials = member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  const colors = [
                    'bg-[#d7e6d9] text-[#356553]',
                    'bg-[#f1ddcd] text-[#9a5d38]',
                    'bg-[#d9e0ed] text-[#4d6180]',
                    'bg-[#e8dff5] text-[#5c4380]',
                  ];
                  return (
                    <div
                      key={member.id}
                      className={`grid size-9 place-items-center rounded-full border-2 border-white text-xs font-bold ${
                        colors[idx % colors.length]
                      } ${idx > 0 ? '-ml-2' : ''}`}
                      title={`${member.name} (${member.role})`}
                    >
                      {initials}
                    </div>
                  );
                })}
                <span className="ml-3 text-xs font-medium text-[#82928b]">
                  {members.length} {members.length === 1 ? 'person' : 'people'} aligned
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-[#edf2ee] space-y-1.5">
                {members.slice(0, 3).map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#183331]">{m.name}</span>
                    <span className="text-[#879890]">{m.relationship || m.role}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Updates & Decisions Log */}
            {events.length > 0 && (
              <section className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#edf2ee]">
                  <div>
                    <h2 className="font-semibold text-sm text-[#183331]">
                      Updates &amp; decisions
                    </h2>
                    <p className="text-[11px] text-[#879890]">Recent plan evolution</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowChanges(!showChanges)}
                    className="text-xs font-semibold text-[#3f6c5c] hover:text-[#1f4d45] transition-colors"
                  >
                    {showChanges ? 'Hide changes' : 'What changed'}
                  </button>
                </div>
                <div className="mt-4">
                  <ActivityTimeline events={events} limit={5} />
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Milestone Timeline Strip */}
        <MilestoneTimelineStrip
          caseId={caseId}
          dischargeDate={caseData.dischargeDate || caseData.targetDate}
          daysUntilDischarge={daysUntilDischarge}
        />
      </div>

      <TaskCompletionModal
        isOpen={Boolean(completingTask)}
        task={completingTask}
        currentMemberName={overview?.members?.find((m) => m.role === 'OWNER')?.name || 'Family Coordinator'}
        onClose={() => setCompletingTask(null)}
        onConfirm={handleCompleteTask}
      />
    </WorkspaceShell>
  );
}
