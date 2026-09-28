'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { NoraReadCard } from '@/components/movewell/NoraReadCard';
import { openNoraWithPrompt } from '@/components/assistant/AIAssistant';
import { CaseOverview, TaskPhase, TransitionTask } from '@/types';
import { TaskRow } from '@/components/movewell/TaskRow';
import { TaskCompletionModal } from '@/components/movewell/TaskCompletionModal';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Plus, Sparkles } from 'lucide-react';

export default function TasksPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const [overview, setOverview] = useState<CaseOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  // Completion note dialog state
  const [completingTask, setCompletingTask] = useState<TransitionTask | null>(null);
  const [completionNote, setCompletionNote] = useState('');

  const fetchOverview = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (caseId) fetchOverview();
  }, [caseId, fetchOverview]);

  const handleTaskAction = async (taskId: string, action: 'COMPLETE' | 'REOPEN', note?: string) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`/api/cases/${caseId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, actorName: 'Family Coordinator', note }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingTaskId(null);
      setCompletingTask(null);
      setCompletionNote('');
    }
  };

  const handleAssignTask = async (taskId: string, memberId: string) => {
    setUpdatingTaskId(taskId);
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
    } finally {
      setUpdatingTaskId(null);
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

  if (loading || !overview) {
    return (
      <div className="min-h-screen bg-[#f7f8f5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1f4d45] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { tasks, members, seniorProfile, daysUntilDischarge, progressPercent } = overview;

  const phaseMeta: Record<TaskPhase, { title: string; subtitle: string; tone: string }> = {
    RIGHT_NOW: { title: 'Right Now', subtitle: 'Confirm the next 72 hours', tone: 'bg-[#fff2df] text-[#a15d28]' },
    THIS_WEEK: { title: 'This Week', subtitle: 'Prepare home safety & resources', tone: 'bg-[#eaf1f7] text-[#4d6e83]' },
    NEXT: { title: 'Next Up', subtitle: 'Moving logistics & inventory', tone: 'bg-[#e8f3ea] text-[#4d775f]' },
    MOVE_WEEK: { title: 'Move Week', subtitle: 'Physical move and day-of discharge', tone: 'bg-[#e8f1ea] text-[#3f6c5c]' },
    AFTER_MOVE: { title: 'After Move', subtitle: 'Settle into a supported home rhythm', tone: 'bg-[#f0f2f1] text-[#718078]' },
  };

  const phases: TaskPhase[] = ['RIGHT_NOW', 'THIS_WEEK', 'NEXT', 'MOVE_WEEK', 'AFTER_MOVE'];

  const tabsList = [
    { id: 'ALL', label: 'All Tasks', count: tasks.length },
    ...phases.map((p) => ({
      id: p,
      label: phaseMeta[p].title,
      count: tasks.filter((t) => t.phase === p).length,
    })),
    {
      id: 'COMPLETED',
      label: 'Completed',
      count: tasks.filter((t) => t.status === 'COMPLETED').length,
    },
  ];

  const visiblePhases =
    activeTab === 'ALL'
      ? phases
      : activeTab === 'COMPLETED'
      ? phases
      : phases.filter((p) => p === activeTab);

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const remainingCount = tasks.length - completedCount;

  return (
    <WorkspaceShell
      caseId={caseId}
      seniorName={seniorProfile.name}
      daysUntilDischarge={daysUntilDischarge}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#71847d]">
              <span>Living transition plan</span>
              <span className="size-1 rounded-full bg-[#b8c8bd]" />
              <span>{tasks.length} tasks across phases</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.055em] text-[#183331]">
              {seniorProfile.name}&apos;s transition plan
            </h1>
            <p className="mt-1.5 max-w-xl text-xs sm:text-sm leading-relaxed text-[#71847d]">
              A clear, dependency-aware path from discharge preparation to a supported first month at home.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              openNoraWithPrompt(`I want to add a task to ${seniorProfile.name}'s transition plan.`)
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#1f4d45] hover:bg-[#153c36] px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors self-start md:self-auto"
          >
            <Plus size={15} />
            <span>Add task</span>
          </button>
        </div>

        {/* 2-Column Grid: Plan List + Contextual Insights */}
        <div className="grid gap-6 xl:grid-cols-[1fr_320px] items-start">
          {/* Main Tasks List */}
          <section className="rounded-2xl border border-[#e0e9e2] bg-white p-5 md:p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4">
              <div>
                <h2 className="font-semibold text-sm sm:text-base text-[#183331]">
                  Plan by phase
                </h2>
                <p className="mt-0.5 text-xs text-[#879890]">
                  Nora keeps this list current as details and dates evolve.
                </p>
              </div>
              <span className="rounded-full bg-[#e8f1ea] px-2.5 py-1 text-xs font-semibold text-[#3f6c5c]">
                {progressPercent}% on track
              </span>
            </div>

            {/* Filter Tabs */}
            <Tabs
              tabs={tabsList}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="underline"
            />

            {/* Phase Groups with Structured Rows */}
            <div className="space-y-8 pt-2">
              {visiblePhases.map((phase) => {
                let phaseTasks = tasks.filter((t) => t.phase === phase);
                if (activeTab === 'COMPLETED') {
                  phaseTasks = phaseTasks.filter((t) => t.status === 'COMPLETED');
                }
                if (phaseTasks.length === 0) return null;

                return (
                  <div key={phase} className="space-y-3">
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${phaseMeta[phase].tone}`}>
                          {phaseMeta[phase].title}
                        </span>
                        <h3 className="text-xs sm:text-sm font-semibold text-[#183331]">
                          {phaseMeta[phase].subtitle}
                        </h3>
                      </div>
                      <span className="text-xs text-[#91a39c]">
                        {phaseTasks.length} {phaseTasks.length === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>

                    <div className="rounded-xl border border-[#edf2ee] bg-[#fdfefd] px-3 sm:px-4 divide-y divide-[#edf2ee]">
                      {phaseTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          allTasks={tasks}
                          members={members}
                          onComplete={(t) => setCompletingTask(t)}
                          onReopen={(t) => handleTaskAction(t.id, 'REOPEN')}
                          onAssign={handleAssignTask}
                          onUpdateDueDate={handleUpdateDueDate}
                          onAskNora={(t) =>
                            openNoraWithPrompt(
                              `Can you explain what needs to happen for "${t.title}" and who should take it on?`
                            )
                          }
                          isUpdating={updatingTaskId === task.id}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Column: Nora's Read & Plan Health */}
          <aside className="flex flex-col gap-6">
            <NoraReadCard
              eyebrow="Nora's read"
              headline="The next decision is the discharge date."
              explanation="Once discharge timing is confirmed with the hospital team, downstream safety visits and transport will automatically update their due dates."
              actionLabel="Ask Nora about dependencies"
              onAction={() =>
                openNoraWithPrompt(`Which tasks should our family prioritize first for ${seniorProfile.name}?`)
              }
            />

            <section className="rounded-2xl border border-[#e0e9e2] bg-white p-5 shadow-2xs">
              <h2 className="font-semibold text-sm sm:text-base text-[#183331]">
                Plan health
              </h2>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-3xl font-semibold text-[#183331]">
                  {progressPercent}%
                </span>
                <span className="text-xs font-medium text-[#71847d]">
                  on track
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#edf2ee]">
                <div
                  className="h-full rounded-full bg-[#1f4d45] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-[#8a9b94]">
                <span>{completedCount} completed</span>
                <span>{remainingCount} remaining</span>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* Unified Task Completion Modal */}
      <TaskCompletionModal
        isOpen={Boolean(completingTask)}
        task={completingTask}
        currentMemberName={overview?.members?.find((m) => m.role === 'OWNER')?.name || 'Sarah'}
        onClose={() => setCompletingTask(null)}
        onConfirm={async (task, note) => {
          await handleTaskAction(task.id, 'COMPLETE', note);
        }}
      />
    </WorkspaceShell>
  );
}
