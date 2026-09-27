'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AIAssistant, openNoraWithPrompt } from '@/components/assistant/AIAssistant';
import { CaseOverview, TransitionTask } from '@/types';
import { PageHeader } from '@/components/movewell/PageHeader';
import { SectionHeader } from '@/components/movewell/SectionHeader';
import { PriorityAction } from '@/components/movewell/PriorityAction';
import { TaskRow } from '@/components/movewell/TaskRow';
import { PersonSummary } from '@/components/movewell/PersonSummary';
import { BudgetSummary } from '@/components/movewell/BudgetSummary';
import { ActivityTimeline } from '@/components/movewell/ActivityTimeline';
import { Button } from '@/components/ui/Button';
import { AlertCircle, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const [overview, setOverview] = useState<CaseOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchOverview = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      } else {
        setError(data.error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-forest border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted font-medium">Opening transition plan...</p>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
        <div className="bg-surface p-6 rounded-xl border border-stone-line text-center max-w-md shadow-2xs space-y-3">
          <AlertCircle className="w-8 h-8 text-status-critical mx-auto" />
          <h2 className="text-lg font-serif font-bold text-charcoal">Plan Not Found</h2>
          <p className="text-xs text-muted">{error || 'Could not load case data.'}</p>
          <Button variant="default" size="sm" onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const {
    caseData,
    seniorProfile,
    members,
    tasks,
    events,
    costSummary,
    progressPercent,
    daysUntilDischarge,
    urgentTask,
    costItems,
  } = overview;

  // Up next tasks (ready tasks excluding the urgent priority)
  const upNextTasks = tasks.filter(
    (t) => t.status === 'READY' && t.id !== urgentTask?.id
  );
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED');

  const summaryStrip = [
    {
      label: 'Hospital discharge',
      value: daysUntilDischarge !== undefined ? `In ${daysUntilDischarge} days` : 'Pending',
      tone: (daysUntilDischarge !== undefined && daysUntilDischarge <= 5) ? ('urgent' as const) : ('default' as const),
    },
    {
      label: 'Progress',
      value: `${progressPercent}% complete`,
      tone: progressPercent > 50 ? ('success' as const) : ('default' as const),
    },
    {
      label: 'Estimated cost',
      value: `$${costSummary.minTotal.toLocaleString()}–$${costSummary.maxTotal.toLocaleString()}`,
      tone: 'default' as const,
    },
    {
      label: 'Target move',
      value: caseData.targetDate ? caseData.targetDate : 'TBD',
      tone: 'default' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-canvas flex flex-col text-charcoal selection:bg-forest/10 selection:text-forest-deep">
      <Navbar
        caseId={caseId}
        seniorName={seniorProfile.name}
        daysUntilDischarge={daysUntilDischarge}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* Mockup-Inspired Signature Split Evergreen Hero Banner */}
        <section className="transition-hero" aria-label="Transition Overview Banner">
          <div className="hero-main">
            <div className="flex items-center gap-2 text-xs text-[#D7E7D9] mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-dot" />
              <span className="font-semibold text-white">
                {daysUntilDischarge !== undefined ? `Discharge in ${daysUntilDischarge} days` : 'Post-hospital discharge'}
              </span>
              <span>·</span>
              <span>{caseData.urgency === 'URGENT' ? 'High Priority' : 'Standard'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              {seniorProfile.name}&apos;s transition
            </h1>
            <p className="text-xs sm:text-sm text-[#BED2C8] leading-relaxed max-w-lg mb-6">
              A calm, structured command center to coordinate housing, safety modifications, family assignments, and local resources.
            </p>
            <div className="max-w-md">
              <div className="flex justify-between text-xs text-[#CFE0D4] mb-2">
                <span>Overall transition progress</span>
                <strong className="text-white font-semibold">{progressPercent}%</strong>
              </div>
              <div className="h-2 rounded-full bg-[#163D37] overflow-hidden">
                <div
                  className="h-full bg-[#D7AD77] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#B9CEC4] mt-2">
                <span>Target move-in: <strong className="text-white">{caseData.targetDate || 'TBD'}</strong></span>
                <span>{tasks.filter((t) => t.status === 'COMPLETED').length} of {tasks.length} tasks complete</span>
              </div>
            </div>
          </div>

          <div className="hero-stats">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#A7C4B6] uppercase block mb-1">
                Estimated Plan Cost
              </span>
              <strong className="text-xl sm:text-2xl text-white font-bold tracking-tight">
                ${costSummary.minTotal.toLocaleString()} – ${costSummary.maxTotal.toLocaleString()}
              </strong>
              <span className="text-xs text-[#B7D1C5] block mt-1">
                {caseData.budget ? `of $${caseData.budget.toLocaleString()} target budget` : 'Budget open (no numerical ceiling)'}
              </span>
            </div>
            <div className="h-px bg-[#477368] w-full" />
            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#A7C4B6] uppercase block mb-1">
                Immediate Next Milestone
              </span>
              <strong className="text-base sm:text-lg text-white font-bold">
                {urgentTask?.title || 'Safe discharge destination'}
              </strong>
              <span className="text-xs text-[#B7D1C5] block mt-1">
                {urgentTask?.dueDate ? `Due ${urgentTask.dueDate}` : 'Top attention priority'}
              </span>
            </div>
          </div>
        </section>

        {/* Main Editorial Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column (8 cols): Primary Focus & Next Tasks */}
          <div className="lg:col-span-8 space-y-10">
            {/* 1. What Needs Attention Today */}
            <section aria-labelledby="section-priority">
              <SectionHeader
                eyebrow="What needs attention"
                title="Today's Primary Decision"
                description="Resolving this item unlocks downstream scheduling and care coordination."
              />

              {urgentTask && urgentTask.status !== 'COMPLETED' ? (
                <PriorityAction
                  task={urgentTask}
                  seniorName={seniorProfile.name}
                  onComplete={() => handleCompleteTask(urgentTask)}
                  onAskNora={() =>
                    openNoraWithPrompt(
                      `How do I confirm the discharge destination for ${seniorProfile.name}?`
                    )
                  }
                  isUpdating={updatingTaskId === urgentTask.id}
                />
              ) : (
                <div className="p-6 rounded-xl border border-forest/20 bg-surface text-center space-y-2">
                  <CheckCircle2 className="w-7 h-7 text-forest mx-auto" />
                  <h3 className="font-serif font-bold text-charcoal text-lg">
                    Critical path decisions complete
                  </h3>
                  <p className="text-xs text-muted max-w-md mx-auto">
                    The safe discharge destination has been confirmed. You can now proceed with downstream accessibility, inventory, and moving logistics.
                  </p>
                </div>
              )}
            </section>

            {/* 2. Up Next Tasks */}
            <section aria-labelledby="section-up-next">
              <SectionHeader
                eyebrow="Up next"
                title="Ready for Attention"
                description="Tasks that can be worked on right now without waiting on other decisions."
                action={
                  <Link
                    href={`/plan/${caseId}/tasks`}
                    className="text-xs font-semibold text-forest hover:text-forest-deep inline-flex items-center gap-1"
                  >
                    <span>View all {tasks.length} tasks</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />

              {upNextTasks.length > 0 ? (
                <div className="rounded-xl border border-stone-line bg-surface px-5 shadow-2xs divide-y divide-stone-line/70">
                  {upNextTasks.slice(0, 4).map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      allTasks={tasks}
                      members={members}
                      onComplete={handleCompleteTask}
                      onReopen={handleReopenTask}
                      onAssign={handleAssignTask}
                      onAskNora={(t) =>
                        openNoraWithPrompt(
                          `Can you help explain the task "${t.title}" and what needs to be done next?`
                        )
                      }
                      isUpdating={updatingTaskId === task.id}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted italic">All currently ready tasks are complete.</p>
              )}

              {/* Inline Nora Prompt Box */}
              <div className="ai-prompt-box flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-evergreen text-white flex items-center justify-center font-bold text-sm shrink-0">
                    ✦
                  </span>
                  <div>
                    <strong className="text-xs font-bold text-ink block">Not sure where to start?</strong>
                    <span className="text-[11px] text-muted-ink">Ask Nora what to focus on today.</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openNoraWithPrompt(`Compare discharge and housing options for ${seniorProfile.name}`)}
                    className="px-2.5 py-1 rounded-full bg-white border border-line text-[11px] font-medium text-evergreen hover:bg-sage transition-colors"
                  >
                    Compare options
                  </button>
                  <button
                    type="button"
                    onClick={() => openNoraWithPrompt(`Make me a call list for the hospital discharge planner regarding ${seniorProfile.name}`)}
                    className="px-2.5 py-1 rounded-full bg-white border border-line text-[11px] font-medium text-evergreen hover:bg-sage transition-colors"
                  >
                    Hospital call list
                  </button>
                  <button
                    type="button"
                    onClick={() => openNoraWithPrompt('What can our family helpers take care of this week?')}
                    className="px-2.5 py-1 rounded-full bg-white border border-line text-[11px] font-medium text-evergreen hover:bg-sage transition-colors"
                  >
                    Family delegation
                  </button>
                </div>
              </div>
            </section>

            {/* 3. Blocked / Waiting Awareness (Subtle) */}
            {blockedTasks.length > 0 && (
              <section className="pt-2">
                <div className="rounded-xl border border-stone-line/80 bg-surface/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Waiting on Prerequisites ({blockedTasks.length})
                    </p>
                    <span className="text-[11px] text-muted">Automatically unlocks when dependencies finish</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {blockedTasks.slice(0, 3).map((bt) => (
                      <span
                        key={bt.id}
                        className="text-xs px-2.5 py-1 rounded-md bg-stone-subtle text-muted border border-stone-line"
                      >
                        {bt.title}
                      </span>
                    ))}
                    {blockedTasks.length > 3 && (
                      <span className="text-xs px-2.5 py-1 text-muted">
                        +{blockedTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Column (4 cols): Budget, Family & Activity */}
          <div className="lg:col-span-4 space-y-8">
            {/* Budget Ledger Preview */}
            <section>
              <SectionHeader
                eyebrow="Financial ledger"
                title="Budget &amp; Costs"
                action={
                  <Link
                    href={`/plan/${caseId}/budget`}
                    className="text-xs font-semibold text-forest hover:text-forest-deep"
                  >
                    Details &rarr;
                  </Link>
                }
              />

              <div className="rounded-xl border border-stone-line bg-surface p-5 shadow-2xs space-y-4">
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-muted">Available Budget</span>
                    <span className="font-serif font-bold text-charcoal">
                      {costSummary.userBudget ? `$${costSummary.userBudget.toLocaleString()}` : 'Open / Unset'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-muted">Expected Range</span>
                    <span className="font-serif font-bold text-forest">
                      ${costSummary.minTotal.toLocaleString()} &ndash; ${costSummary.maxTotal.toLocaleString()}
                    </span>
                  </div>

                  {costSummary.confirmedQuotesTotal ? (
                    <div className="flex items-baseline justify-between text-xs pt-1 border-t border-stone-line/60">
                      <span className="text-forest font-medium">Confirmed Quotes</span>
                      <span className="font-serif font-bold text-forest">
                        ${costSummary.confirmedQuotesTotal.toLocaleString()}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="pt-2 border-t border-stone-line/60">
                  <button
                    type="button"
                    onClick={() =>
                      openNoraWithPrompt(
                        'What are the largest expected costs in our transition plan and how is the budget allocated?'
                      )
                    }
                    className="text-xs text-forest hover:text-forest-deep underline underline-offset-4 font-medium text-left"
                  >
                    Ask Nora to analyze our budget breakdown &rarr;
                  </button>
                </div>
              </div>
            </section>

            {/* Family Coordination Summary */}
            <section>
              <SectionHeader
                eyebrow="Family team"
                title="Coordination"
                action={
                  <Link
                    href={`/plan/${caseId}/family`}
                    className="text-xs font-semibold text-forest hover:text-forest-deep"
                  >
                    Manage &rarr;
                  </Link>
                }
              />

              <div className="rounded-xl border border-stone-line bg-surface p-4 shadow-2xs divide-y divide-stone-line/70">
                {members.map((member) => (
                  <PersonSummary
                    key={member.id}
                    member={member}
                    tasks={tasks}
                    onSelect={() => router.push(`/plan/${caseId}/family`)}
                  />
                ))}
              </div>
            </section>

            {/* Recent Activity Trail */}
            <section>
              <SectionHeader eyebrow="Audit log" title="Recent Activity" />
              <div className="rounded-xl border border-stone-line bg-surface p-4 shadow-2xs">
                <ActivityTimeline events={events} limit={4} />
              </div>
            </section>
          </div>
        </div>
      </div>

      <AIAssistant caseId={caseId} onPlanUpdated={fetchOverview} />
      <MobileNav caseId={caseId} />
    </div>
  );
}
