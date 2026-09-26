'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AIAssistant } from '@/components/assistant/AIAssistant';
import { CaseOverview, TransitionTask } from '@/types';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Calendar,
  Users,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Share2,
  Printer,
  ChevronRight,
} from 'lucide-react';

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

  const handleCompleteTask = async (taskId: string) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`/api/cases/${caseId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'COMPLETE', actorName: 'Sarah' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview(); // Refresh overview and dependency statuses
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-brand-950">Loading Transition Plan...</p>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen bg-sand-100 flex flex-col items-center justify-center px-4">
        <div className="bg-white p-6 rounded-3xl border border-rose-200 text-center max-w-md shadow-md">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-stone-900 mb-1">Plan Not Found</h2>
          <p className="text-xs text-stone-600 mb-4">{error || 'Could not load case data.'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-brand-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const { caseData, seniorProfile, members, tasks, events, costSummary, progressPercent, daysUntilDischarge, urgentTask } = overview;

  const urgentTasks = tasks.filter((t) => t.status === 'READY' || t.status === 'IN_PROGRESS');
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED');

  return (
    <div className="min-h-screen bg-sand-100 flex flex-col">
      <Navbar
        caseId={caseId}
        seniorName={`${seniorProfile.name}'s Transition`}
        daysUntilDischarge={daysUntilDischarge}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        {/* Top Command Banner */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brand-950 tracking-tight">
                {seniorProfile.name}&apos;s Transition
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                {caseData.urgency}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 font-medium">
              Post-hospital discharge &bull; ZIP {caseData.zipCode} &bull; {seniorProfile.homeType || 'Residential home'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push(`/plan/${caseId}/tasks`)}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center space-x-1.5"
            >
              <span>View Full Plan</span>
              <ChevronRight className="w-4 h-4 text-stone-500" />
            </button>
          </div>
        </div>

        {/* 4 Metric Badges Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1 */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-stone-900 leading-tight">
                {daysUntilDischarge ?? 5} <span className="text-xs font-normal text-stone-500">days</span>
              </p>
              <p className="text-[11px] text-stone-500 font-medium uppercase tracking-wide">until discharge</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-stone-900 leading-tight">{progressPercent}%</p>
              <p className="text-[11px] text-stone-500 font-medium uppercase tracking-wide">plan complete</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
                ${costSummary.minTotal.toLocaleString()} &ndash; ${costSummary.maxTotal.toLocaleString()}
              </p>
              <p className="text-[11px] text-stone-500 font-medium uppercase tracking-wide">estimated cost</p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-900 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
                {caseData.targetDate ? new Date(caseData.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
              </p>
              <p className="text-[11px] text-stone-500 font-medium uppercase tracking-wide">target date</p>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 cols): Guided Calm Hero & Tasks Needing Attention */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guided Calm Focus Hero Card */}
            {urgentTask && urgentTask.status !== 'COMPLETED' ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-brand-900 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-full opacity-50 -z-0 pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold tracking-wide">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>URGENT PRIORITY TODAY</span>
                    </span>
                    <span className="text-xs text-stone-500 font-medium">Due Today</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-950 mb-2">
                    {urgentTask.title}
                  </h2>

                  <p className="text-stone-600 text-sm leading-relaxed mb-6">
                    {urgentTask.whyItMatters || urgentTask.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleCompleteTask(urgentTask.id)}
                      disabled={updatingTaskId === urgentTask.id}
                      className="bg-brand-900 hover:bg-brand-800 text-white font-bold text-sm py-3 px-6 rounded-2xl shadow-md transition flex items-center space-x-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{updatingTaskId === urgentTask.id ? 'Updating...' : 'Mark Task Complete'}</span>
                    </button>

                    {urgentTask.assignee && (
                      <span className="text-xs text-stone-500 font-medium bg-sand-200/60 px-3 py-2 rounded-xl">
                        Assigned to: <strong>{urgentTask.assignee.name}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-200 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto mb-2" />
                <h3 className="font-bold text-emerald-950 text-lg">Top priority tasks completed!</h3>
                <p className="text-xs text-emerald-800">You are making steady progress on {seniorProfile.name}&apos;s transition plan.</p>
              </div>
            )}

            {/* Tasks Needing Attention */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-serif font-bold text-brand-950">Tasks Needing Attention</h3>
                <button
                  onClick={() => router.push(`/plan/${caseId}/tasks`)}
                  className="text-xs font-bold text-brand-900 hover:text-brand-700 flex items-center space-x-1"
                >
                  <span>View all tasks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {urgentTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl border border-stone-200 hover:border-brand-200 transition bg-sand-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <h4 className="font-bold text-sm text-stone-900">{task.title}</h4>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-1">{task.whyItMatters || task.description}</p>
                    </div>

                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      disabled={updatingTaskId === task.id}
                      className="bg-white hover:bg-stone-100 text-brand-900 border border-stone-300 font-bold text-xs px-3.5 py-2 rounded-xl transition flex-shrink-0"
                    >
                      Complete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Blocked Tasks Awareness */}
            {blockedTasks.length > 0 && (
              <div className="bg-amber-50/60 rounded-3xl p-5 border border-amber-200/80">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1.5 text-amber-700" />
                  <span>{blockedTasks.length} Tasks Waiting on Dependencies</span>
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed mb-3">
                  These tasks are deterministically locked until upstream discharge and destination decisions are finalized:
                </p>
                <div className="flex flex-wrap gap-2">
                  {blockedTasks.slice(0, 3).map((bt) => (
                    <span key={bt.id} className="bg-white px-3 py-1 rounded-full text-xs font-medium text-amber-900 border border-amber-200">
                      {bt.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (1 col): Family, Budget & Activity */}
          <div className="space-y-6">
            {/* Family Members Card */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-serif font-bold text-brand-950">Family Team</h3>
                <button
                  onClick={() => router.push(`/plan/${caseId}/family`)}
                  className="text-xs font-bold text-brand-900"
                >
                  Manage
                </button>
              </div>

              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl bg-sand-50 border border-stone-200/60">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-900 font-bold flex items-center justify-center text-xs">
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900">{member.name}</p>
                        <p className="text-xs text-stone-500">{member.relationship} &bull; {member.city}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-stone-200/70 text-stone-700">
                      {member.isLocal ? 'Local' : 'Remote'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Overview Widget */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif font-bold text-brand-950">Budget Overview</h3>
                <button
                  onClick={() => router.push(`/plan/${caseId}/budget`)}
                  className="text-xs font-bold text-brand-900"
                >
                  Details
                </button>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">Estimated Total</span>
                  <span className="text-lg font-bold text-brand-900">
                    ${costSummary.minTotal.toLocaleString()} &ndash; ${costSummary.maxTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">User Budget</span>
                  <span className="text-sm font-bold text-stone-800">${costSummary.userBudget.toLocaleString()}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-brand-900 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (costSummary.maxTotal / costSummary.userBudget) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Mandatory Product Disclaimer */}
              <div className="p-3 bg-sand-100 rounded-xl border border-sand-300">
                <p className="text-[11px] font-semibold text-stone-600 italic text-center">
                  &ldquo;{costSummary.disclaimer}&rdquo;
                </p>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs">
              <h3 className="text-lg font-serif font-bold text-brand-950 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {events.slice(0, 5).map((evt) => (
                  <div key={evt.id} className="text-xs border-l-2 border-brand-800 pl-3 py-1">
                    <p className="font-bold text-stone-800">
                      {evt.type === 'CASE_CREATED' && 'Case Created'}
                      {evt.type === 'PLAN_GENERATED' && 'Post-Hospital Plan Generated'}
                      {evt.type === 'TASK_COMPLETED' && `Task Completed: ${evt.payload.taskTitle}`}
                      {evt.type === 'TASK_REOPENED' && `Task Reopened: ${evt.payload.taskTitle}`}
                      {evt.type === 'TASK_ASSIGNED' && `Task Assigned: ${evt.payload.taskTitle}`}
                    </p>
                    {evt.type === 'TASK_COMPLETED' && evt.payload.completionNotes && (
                      <p className="text-[11px] text-stone-600 italic mt-0.5 bg-sand-50 p-1.5 rounded-md border border-stone-200">
                        Note: &ldquo;{evt.payload.completionNotes}&rdquo;
                      </p>
                    )}
                    <p className="text-stone-500 text-[10px] mt-0.5">
                      {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AIAssistant caseId={caseId} onPlanUpdated={fetchOverview} />
      <MobileNav caseId={caseId} />
    </div>
  );
}
