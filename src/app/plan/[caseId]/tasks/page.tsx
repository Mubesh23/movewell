'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AIAssistant, openNoraWithPrompt } from '@/components/assistant/AIAssistant';
import { CaseOverview, TaskPhase, TransitionTask } from '@/types';
import { PageHeader } from '@/components/movewell/PageHeader';
import { SectionHeader } from '@/components/movewell/SectionHeader';
import { TaskRow } from '@/components/movewell/TaskRow';
import { Tabs } from '@/components/ui/Tabs';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { CheckCircle2 } from 'lucide-react';

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

  if (loading || !overview) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-forest border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { tasks, members, seniorProfile, daysUntilDischarge, progressPercent } = overview;

  const phaseMeta: Record<TaskPhase, { title: string; subtitle: string }> = {
    RIGHT_NOW: { title: 'Right Now', subtitle: 'Critical decisions before move preparation' },
    THIS_WEEK: { title: 'This Week', subtitle: 'Belongings inventory and preliminary assessments' },
    NEXT: { title: 'Next Up', subtitle: 'Vendor selection and rightsizing plans' },
    MOVE_WEEK: { title: 'Move Week', subtitle: 'Packing, transportation, and home transition' },
    AFTER_MOVE: { title: 'After Move', subtitle: 'Unpacking, home settling, and document finalization' },
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

  return (
    <div className="min-h-screen bg-canvas flex flex-col text-charcoal selection:bg-forest/10 selection:text-forest-deep">
      <Navbar
        caseId={caseId}
        seniorName={seniorProfile.name}
        daysUntilDischarge={daysUntilDischarge}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* Editorial Header */}
        <PageHeader
          title="Transition Plan"
          subtitle={`Structured transition workflow for ${seniorProfile.name}. Downstream dependencies unlock dynamically.`}
          summaryItems={[
            {
              label: 'Overall Progress',
              value: `${progressPercent}% complete`,
              tone: 'success',
            },
            {
              label: 'Completed',
              value: `${tasks.filter((t) => t.status === 'COMPLETED').length} of ${tasks.length} tasks`,
              tone: 'default',
            },
            {
              label: 'Hospital discharge',
              value: daysUntilDischarge !== undefined ? `In ${daysUntilDischarge} days` : 'Pending',
              tone: (daysUntilDischarge !== undefined && daysUntilDischarge <= 5) ? 'urgent' : 'default',
            },
          ]}
        />

        {/* Phase Filter Tabs */}
        <Tabs
          tabs={tabsList}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="underline"
        />

        {/* Phase Groups with Structured Rows */}
        <div className="space-y-10">
          {visiblePhases.map((phase) => {
            let phaseTasks = tasks.filter((t) => t.phase === phase);
            if (activeTab === 'COMPLETED') {
              phaseTasks = phaseTasks.filter((t) => t.status === 'COMPLETED');
            }
            if (phaseTasks.length === 0) return null;

            return (
              <section key={phase} aria-labelledby={`phase-title-${phase}`} className="space-y-2">
                <SectionHeader
                  eyebrow={phaseMeta[phase].title}
                  title={phaseMeta[phase].title}
                  description={phaseMeta[phase].subtitle}
                />

                <div className="rounded-xl border border-stone-line bg-surface px-5 shadow-2xs divide-y divide-stone-line/70">
                  {phaseTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      allTasks={tasks}
                      members={members}
                      onComplete={(t, note) => {
                        if (note) {
                          handleTaskAction(t.id, 'COMPLETE', note);
                        } else {
                          setCompletingTask(t);
                          setCompletionNote('');
                        }
                      }}
                      onReopen={(t) => handleTaskAction(t.id, 'REOPEN')}
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
              </section>
            );
          })}
        </div>
      </div>

      {/* Completion Note Dialog */}
      <Dialog
        open={Boolean(completingTask)}
        onOpenChange={(open) => !open && setCompletingTask(null)}
        title="Complete Task"
        description={completingTask ? `Mark "${completingTask.title}" as completed.` : undefined}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Add a completion note (optional)
            </label>
            <Textarea
              rows={3}
              placeholder="e.g. Confirmed with Dr. Miller that rehab is needed for 2 weeks."
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              className="text-sm"
              autoFocus
            />
            <p className="text-xs text-muted mt-1">
              Notes are recorded in the transition timeline and referenced by Nora.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="default"
              onClick={() => setCompletingTask(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="default"
              isLoading={updatingTaskId === completingTask?.id}
              onClick={() => {
                if (completingTask) {
                  handleTaskAction(completingTask.id, 'COMPLETE', completionNote.trim() || undefined);
                }
              }}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Complete Task
            </Button>
          </div>
        </div>
      </Dialog>

      <AIAssistant caseId={caseId} onPlanUpdated={fetchOverview} />
      <MobileNav caseId={caseId} />
    </div>
  );
}
