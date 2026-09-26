'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AIAssistant } from '@/components/assistant/AIAssistant';
import { CaseOverview, TaskPhase, TransitionTask } from '@/types';
import {
  CheckCircle2,
  Lock,
  Clock,
  User,
  DollarSign,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  FileText,
  X,
} from 'lucide-react';

export default function TasksPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const [overview, setOverview] = useState<CaseOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [filterPhase, setFilterPhase] = useState<string>('ALL');

  // Completion note modal state
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
        body: JSON.stringify({ action, actorName: 'Sarah', note }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview(); // Recalculates dependencies dynamically
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingTaskId(null);
      setCompletingTask(null);
      setCompletionNote('');
    }
  };

  const handleAssignTask = async (taskId: string, memberId: string, memberName: string) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`/api/cases/${caseId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN',
          assigneeId: memberId,
          assigneeName: memberName,
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
      <div className="min-h-screen bg-sand-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { tasks, members, seniorProfile, daysUntilDischarge } = overview;

  const phaseLabels: Record<TaskPhase, string> = {
    RIGHT_NOW: 'Right Now (Critical)',
    THIS_WEEK: 'This Week',
    NEXT: 'Next Up',
    MOVE_WEEK: 'Move Week',
    AFTER_MOVE: 'After Move',
  };

  const phases: TaskPhase[] = ['RIGHT_NOW', 'THIS_WEEK', 'NEXT', 'MOVE_WEEK', 'AFTER_MOVE'];

  const filteredTasks =
    filterPhase === 'ALL'
      ? tasks
      : filterPhase === 'COMPLETED'
      ? tasks.filter((t) => t.status === 'COMPLETED')
      : tasks.filter((t) => t.phase === filterPhase);

  return (
    <div className="min-h-screen bg-sand-100 flex flex-col">
      <Navbar
        caseId={caseId}
        seniorName={`${seniorProfile.name}'s Plan`}
        daysUntilDischarge={daysUntilDischarge}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-brand-950">
              Transition Tasks &amp; Action Plan
            </h1>
            <p className="text-xs text-stone-500 font-medium mt-1">
              Smart deterministic workflow for {seniorProfile.name}. Downstream tasks unblock automatically upon completion.
            </p>
          </div>

          {/* Phase Filter */}
          <div className="flex items-center space-x-2 self-start md:self-auto">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Filter:</span>
            <select
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
              className="bg-sand-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-700"
            >
              <option value="ALL">All Phases</option>
              {phases.map((p) => (
                <option key={p} value={p}>
                  {phaseLabels[p]}
                </option>
              ))}
              <option value="COMPLETED">Completed Only</option>
            </select>
          </div>
        </div>

        {/* Task List Grouped by Phase */}
        <div className="space-y-6">
          {phases
            .filter((phase) => filterPhase === 'ALL' || filterPhase === phase || filterPhase === 'COMPLETED')
            .map((phase) => {
              const phaseTasks = filteredTasks.filter((t) => t.phase === phase);
              if (phaseTasks.length === 0) return null;

              return (
                <div key={phase} className="space-y-3">
                  <div className="flex items-center space-x-2 px-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      {phaseLabels[phase]}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                      {phaseTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {phaseTasks.map((task) => {
                      const isBlocked = task.status === 'BLOCKED';
                      const isCompleted = task.status === 'COMPLETED';

                      // Find dependency titles if blocked
                      const blockingDependencies = (task.dependsOnTaskIds || [])
                        .map((depId) => tasks.find((t) => t.id === depId))
                        .filter((t) => t && t.status !== 'COMPLETED' && t.status !== 'SKIPPED');

                      return (
                        <div
                          key={task.id}
                          className={`bg-white rounded-3xl p-5 border transition shadow-xs ${
                            isCompleted
                              ? 'border-emerald-200/80 bg-emerald-50/20'
                              : isBlocked
                              ? 'border-stone-200 bg-stone-50/70'
                              : 'border-stone-200 hover:border-brand-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            {/* Task Content */}
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                {isBlocked ? (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Blocked
                                  </span>
                                ) : isCompleted ? (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Completed
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-900 border border-brand-200">
                                    {task.status}
                                  </span>
                                )}

                                {task.priority <= 2 && !isCompleted && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                                    High Priority
                                  </span>
                                )}
                              </div>

                              <h3
                                className={`text-base font-serif font-bold ${
                                  isCompleted ? 'line-through text-stone-400' : 'text-stone-900'
                                }`}
                              >
                                {task.title}
                              </h3>

                              {task.description && (
                                <p className="text-xs text-stone-600 leading-relaxed">
                                  {task.description}
                                </p>
                              )}

                              {task.whyItMatters && !isCompleted && (
                                <p className="text-[11px] text-brand-900 bg-brand-50/60 p-2.5 rounded-xl border border-brand-100 font-medium italic">
                                  💡 Why it matters: {task.whyItMatters}
                                </p>
                              )}

                              {/* Completion Note display */}
                              {isCompleted && task.completionNotes && (
                                <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-950 font-medium flex items-start space-x-2">
                                  <FileText className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold text-emerald-900">Completion Record: </span>
                                    <span>{task.completionNotes}</span>
                                  </div>
                                </div>
                              )}

                              {/* Blocking dependencies notice */}
                              {isBlocked && blockingDependencies.length > 0 && (
                                <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-start space-x-1.5">
                                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold">Waiting on: </span>
                                    {blockingDependencies.map((d) => d?.title).join(', ')}
                                  </div>
                                </div>
                              )}

                              {/* Metadata footer */}
                              <div className="flex items-center space-x-4 text-xs text-stone-500 pt-1 flex-wrap gap-y-1">
                                {task.dueDate && (
                                  <span className="flex items-center font-medium">
                                    <Clock className="w-3.5 h-3.5 mr-1 text-stone-400" />
                                    Due: {task.dueDate}
                                  </span>
                                )}

                                {(task.minEstimatedCost > 0 || task.maxEstimatedCost > 0) && (
                                  <span className="flex items-center font-semibold text-stone-700">
                                    <DollarSign className="w-3.5 h-3.5 mr-0.5 text-stone-400" />
                                    ${task.minEstimatedCost} - ${task.maxEstimatedCost}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions & Assignee */}
                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3 flex-shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100">
                              {/* Assignee Selector */}
                              <div className="flex items-center space-x-1.5 text-xs">
                                <User className="w-3.5 h-3.5 text-stone-400" />
                                <select
                                  value={task.assigneeId || ''}
                                  onChange={(e) => {
                                    const m = members.find((mem) => mem.id === e.target.value);
                                    if (m) handleAssignTask(task.id, m.id, m.name);
                                  }}
                                  className="bg-stone-100 border border-stone-200 text-stone-800 text-xs font-semibold px-2 py-1 rounded-lg focus:outline-none"
                                >
                                  <option value="">Unassigned</option>
                                  {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name} ({m.role})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Complete / Reopen Buttons */}
                              {isCompleted ? (
                                <button
                                  onClick={() => handleTaskAction(task.id, 'REOPEN')}
                                  disabled={updatingTaskId === task.id}
                                  className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center space-x-1"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Reopen</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setCompletingTask(task);
                                    setCompletionNote('');
                                  }}
                                  disabled={updatingTaskId === task.id || isBlocked}
                                  className={`text-xs font-bold px-4 py-2 rounded-xl transition flex items-center space-x-1.5 ${
                                    isBlocked
                                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                      : 'bg-brand-900 hover:bg-brand-800 text-white shadow-xs'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Complete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Completion Note Modal */}
      {completingTask && (
        <div className="fixed inset-0 z-50 bg-brand-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-stone-200 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif font-bold text-stone-900">Mark Task Complete</h3>
              <button
                onClick={() => setCompletingTask(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-sand-50 p-3.5 rounded-2xl border border-stone-200 text-xs">
              <p className="font-bold text-stone-900">{completingTask.title}</p>
              {completingTask.description && (
                <p className="text-stone-500 mt-0.5 line-clamp-2">{completingTask.description}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Record / Completion Note (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Confirmed rate of $1,200 with mover. Safe destination approved by social worker."
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                This note creates a record in {seniorProfile.name}&apos;s transition history.
              </p>
            </div>

            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleTaskAction(completingTask.id, 'COMPLETE')}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50"
              >
                Complete Without Note
              </button>
              <button
                type="button"
                onClick={() => handleTaskAction(completingTask.id, 'COMPLETE', completionNote)}
                className="px-4 py-2.5 rounded-xl bg-brand-900 text-white font-bold text-xs hover:bg-brand-800 shadow-xs"
              >
                Save &amp; Complete
              </button>
            </div>
          </div>
        </div>
      )}

      <AIAssistant caseId={caseId} onPlanUpdated={fetchOverview} />
      <MobileNav caseId={caseId} />
    </div>
  );
}
