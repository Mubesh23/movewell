'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
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
} from 'lucide-react';

export default function TasksPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const [overview, setOverview] = useState<CaseOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [filterPhase, setFilterPhase] = useState<string>('ALL');

  const fetchOverview = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}`);
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

  const handleTaskAction = async (taskId: string, action: 'COMPLETE' | 'REOPEN') => {
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`/api/cases/${caseId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, actorName: 'Sarah' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview(); // Recalculates dependencies dynamically
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingTaskId(null);
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

  const phases: { id: TaskPhase; label: string; desc: string }[] = [
    { id: 'RIGHT_NOW', label: 'Right now', desc: 'Critical decisions before hospital discharge' },
    { id: 'THIS_WEEK', label: 'This week', desc: 'Housing feasibility & moving estimates' },
    { id: 'NEXT', label: 'Next', desc: 'Belongings strategy & booking services' },
    { id: 'MOVE_WEEK', label: 'Move week', desc: 'Packing, home prep & execution' },
    { id: 'AFTER_MOVE', label: 'After the move', desc: 'Settling in & final cleanout' },
  ];

  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  return (
    <div className="min-h-screen bg-sand-100 flex flex-col">
      <Navbar
        caseId={caseId}
        seniorName={`${seniorProfile.name}'s Tasks`}
        daysUntilDischarge={daysUntilDischarge}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-brand-950">Transition Task Plan</h1>
            <p className="text-xs text-stone-500 font-medium mt-1">
              Ordered phases &bull; Deterministic dependency evaluation &bull; Real-time readiness updates
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-stone-600">Filter:</span>
            <select
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold bg-white text-stone-800 focus:outline-none"
            >
              <option value="ALL">All Phases</option>
              {phases.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Phase Groups */}
        <div className="space-y-8">
          {phases
            .filter((p) => filterPhase === 'ALL' || filterPhase === p.id)
            .map((phase) => {
              const phaseTasks = tasks.filter((t) => t.phase === phase.id);
              if (phaseTasks.length === 0) return null;

              return (
                <div key={phase.id} className="space-y-4">
                  <div className="border-b border-stone-200 pb-2">
                    <h2 className="text-lg font-serif font-bold text-brand-950 flex items-center space-x-2">
                      <span>{phase.label}</span>
                      <span className="text-xs font-sans font-normal text-stone-500 bg-stone-200/60 px-2.5 py-0.5 rounded-full">
                        {phaseTasks.length} tasks
                      </span>
                    </h2>
                    <p className="text-xs text-stone-500">{phase.desc}</p>
                  </div>

                  <div className="space-y-3">
                    {phaseTasks.map((task) => {
                      const isCompleted = task.status === 'COMPLETED';
                      const isBlocked = task.status === 'BLOCKED';
                      const isReady = task.status === 'READY' || task.status === 'IN_PROGRESS';

                      // Find blocking task names
                      const blockingTaskNames = (task.dependsOnTaskIds || [])
                        .map((depId) => taskMap.get(depId))
                        .filter((t) => t && t.status !== 'COMPLETED' && t.status !== 'SKIPPED')
                        .map((t) => t?.title);

                      return (
                        <div
                          key={task.id}
                          className={`p-5 rounded-2xl border transition-all ${
                            isCompleted
                              ? 'bg-stone-50/80 border-stone-200 opacity-80'
                              : isBlocked
                              ? 'bg-amber-50/40 border-amber-200/80'
                              : 'bg-white border-stone-200 shadow-xs hover:border-brand-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Status Pill */}
                                {isCompleted && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                    Completed
                                  </span>
                                )}
                                {isBlocked && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Blocked
                                  </span>
                                )}
                                {isReady && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-900">
                                    Ready
                                  </span>
                                )}

                                <h3 className={`font-bold text-base ${isCompleted ? 'line-through text-stone-500' : 'text-stone-900'}`}>
                                  {task.title}
                                </h3>
                              </div>

                              {task.description && (
                                <p className="text-xs text-stone-600 leading-relaxed">
                                  {task.description}
                                </p>
                              )}

                              {task.whyItMatters && (
                                <div className="p-2.5 rounded-xl bg-sand-50 border border-sand-300 text-[11px] text-stone-700 font-medium">
                                  <strong>Why it matters:</strong> {task.whyItMatters}
                                </div>
                              )}

                              {/* Blocking Warning */}
                              {isBlocked && blockingTaskNames.length > 0 && (
                                <div className="text-xs text-amber-800 font-medium flex items-center space-x-1">
                                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-700" />
                                  <span>Blocked by: {blockingTaskNames.join(', ')}</span>
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
                                {task.dueDate && (
                                  <span className="flex items-center">
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
                                  onClick={() => handleTaskAction(task.id, 'COMPLETE')}
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

      <MobileNav caseId={caseId} />
    </div>
  );
}
