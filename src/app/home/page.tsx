import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { repository } from '@/db/repository';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  ArrowRight,
  Sparkles,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  HeartHandshake,
} from 'lucide-react';
import { BRAND_NAME } from '@/lib/brand';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HomeCaseSummary {
  caseId: string;
  seniorName: string;
  city: string;
  completionPercent: number;
  completedTasks: number;
  totalTasks: number;
  nextTaskTitle: string;
}

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  let user: any = null;

  if (supabase) {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  }

  // If not logged in, redirect to get-started or login
  if (!user) {
    redirect('/get-started');
  }

  const userId = user.id;
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Family Coordinator';
  const firstName = fullName.split(' ')[0];

  // Fetch owned cases, shared cases, and drafts
  const ownedCases = await repository.getCasesByOwnerUserId(userId);
  const sharedCases = await repository.getCasesByMemberUserId(userId);
  const drafts = await repository.getPlanDraftsByOwnerUserId(userId);

  // Helper to build case summaries with real completion metrics
  const buildSummary = async (c: any): Promise<HomeCaseSummary> => {
    const senior = await repository.getSeniorProfileByCaseId(c.id);
    const tasks = await repository.getTasksByCaseId(c.id);
    const locations = await repository.getLocationsForCase(c.id);

    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const total = tasks.length;
    const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const readyTask = tasks.find((t) => t.status === 'READY') || tasks.find((t) => t.status !== 'COMPLETED');
    const nextTaskTitle = readyTask ? readyTask.title : 'All tasks completed';

    const homeLoc = locations.find((l) => l.type === 'HOME') || locations[0];
    const city = homeLoc?.city || (c.zipCode ? `ZIP ${c.zipCode}` : 'Houston, TX');

    return {
      caseId: c.id,
      seniorName: senior?.name || 'Family Senior',
      city,
      completionPercent,
      completedTasks: completed,
      totalTasks: total,
      nextTaskTitle,
    };
  };

  const ownedSummaries: HomeCaseSummary[] = [];
  for (const c of ownedCases) {
    ownedSummaries.push(await buildSummary(c));
  }

  const sharedSummaries: HomeCaseSummary[] = [];
  for (const c of sharedCases) {
    sharedSummaries.push(await buildSummary(c));
  }

  const hasAnyPlans = ownedSummaries.length > 0 || sharedSummaries.length > 0 || drafts.length > 0;

  return (
    <div className="min-h-screen bg-sand text-ink flex flex-col font-sans selection:bg-sage selection:text-ink">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-line mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-ink">Family Workspace</span>
            <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">
              Welcome back, {firstName}
            </h1>
          </div>

          <Link
            href="/get-started"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-semibold text-sm transition-all shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Start a new transition</span>
          </Link>
        </div>

        {!hasAnyPlans ? (
          /* Empty Account State */
          <div className="bg-white rounded-3xl border border-line p-8 sm:p-12 text-center max-w-2xl mx-auto my-12 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-sage/60 border border-evergreen/20 flex items-center justify-center text-evergreen mx-auto mb-5">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-ink mb-2">Welcome to {BRAND_NAME}</h2>
            <p className="text-sm text-muted-ink leading-relaxed mb-8 max-w-md mx-auto">
              You don&apos;t have an active family transition yet. Tell Nora what&apos;s happening to build a clear, sequenced plan in minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/get-started"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-semibold text-sm transition-all shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start a new transition with Nora</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* ACTIVE TRANSITIONS */}
            {ownedSummaries.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-ink">
                    Active Transitions ({ownedSummaries.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {ownedSummaries.map((s) => (
                    <div
                      key={s.caseId}
                      className="bg-white rounded-2xl border border-line p-6 hover:border-evergreen/40 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-xl font-bold text-ink">
                            {s.seniorName}&apos;s transition
                          </h3>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-sage text-evergreen">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{s.completionPercent}% complete</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-ink mb-5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{s.city}</span>
                          <span>&bull;</span>
                          <span>{s.completedTasks} of {s.totalTasks} tasks completed</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-cream/70 border border-line/60 mb-6">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-ink block mb-0.5">
                            Next milestone
                          </span>
                          <p className="text-xs font-semibold text-ink leading-snug">
                            {s.nextTaskTitle}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/plan/${s.caseId}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-semibold text-sm transition-all"
                      >
                        <span>Open workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SHARED WITH ME */}
            {sharedSummaries.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-ink mb-4">
                  Shared with me ({sharedSummaries.length})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {sharedSummaries.map((s) => (
                    <div
                      key={s.caseId}
                      className="bg-white rounded-2xl border border-line p-6 hover:border-evergreen/40 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-xl font-bold text-ink">
                            {s.seniorName}&apos;s transition
                          </h3>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-cream text-ink border border-line">
                            <Users className="w-3.5 h-3.5 text-evergreen" />
                            <span>Care Circle Member</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-ink mb-5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{s.city}</span>
                          <span>&bull;</span>
                          <span>{s.completionPercent}% complete</span>
                        </div>
                      </div>

                      <Link
                        href={`/plan/${s.caseId}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-semibold text-sm transition-all"
                      >
                        <span>Open workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* DRAFTS */}
            {drafts.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-ink mb-4">
                  Draft Proposals ({drafts.length})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {drafts.map((d) => (
                    <div
                      key={d.id}
                      className="bg-white rounded-2xl border border-line p-6 hover:border-evergreen/40 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-lg font-bold text-ink">
                            {d.seniorProfile.name}&apos;s transition proposal
                          </h3>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-bg text-amber border border-amber/30">
                            Draft
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-ink mb-4">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{d.proposedTasks.length} sequenced tasks</span>
                        </div>
                      </div>

                      <Link
                        href={`/draft/${d.id}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white hover:bg-cream border border-line text-ink font-semibold text-xs transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Review & Activate Draft</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
