'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Sparkles,
  ShieldCheck,
  Clock,
  Compass,
  FileText,
  ChevronRight,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [noraPreview, setNoraPreview] = useState<string | null>(null);

  const handleHomepageNoraSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialPrompt.trim()) return;
    setNoraPreview("I can help you work through that. I'll ask a few focused questions so I can build a plan around her situation.");
  };

  const handleContinueWithNora = () => {
    if (!initialPrompt.trim()) return;
    router.push(`/get-started?initial=${encodeURIComponent(initialPrompt.trim())}`);
  };

  const handleExploreSamplePlan = async () => {
    setLoadingDemo(true);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: 'MARIA_GOLDEN_SCENARIO' }),
      });
      const data = await res.json();
      if (data.success && data.caseId) {
        router.push(`/plan/${data.caseId}`);
      }
    } catch (e) {
      console.error('Failed to load sample plan:', e);
      setLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 border-b border-line overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage text-evergreen text-xs font-semibold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-evergreen" />
                Senior Transition Planning &amp; Coordination
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink tracking-tight leading-[1.1] mb-6">
                A calmer way through what comes next.
              </h1>

              <p className="text-lg sm:text-xl text-muted-ink leading-relaxed mb-9 max-w-2xl">
                When an aging parent needs more support, MoveWell helps your family understand what
                needs to happen, in what order, what it may cost, and who can help.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-semibold text-base transition-all shadow-sm hover:shadow"
                >
                  <span>See how MoveWell can help</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={handleExploreSamplePlan}
                  disabled={loadingDemo}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-line bg-white hover:bg-cream text-ink font-semibold text-base transition-colors"
                >
                  <span>{loadingDemo ? 'Loading demo...' : 'Explore a sample plan'}</span>
                  <span className="text-evergreen">→</span>
                </button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted-ink">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-evergreen" />
                  No sign-up required to get started
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-evergreen" />
                  Proposed plan before any commitment
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-evergreen" />
                  Built for families coordinating near or far
                </span>
              </div>

              {/* Lightweight Nora Entry Point */}
              <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-white border border-line shadow-2xs max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-evergreen" />
                  <span className="text-xs font-bold uppercase tracking-wider text-evergreen">
                    Not sure where to start?
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-ink mb-1">
                  Tell Nora what&apos;s happening.
                </h3>
                <p className="text-xs text-muted-ink mb-4">
                  Share what&apos;s going on with your parent. Nora will ask a few focused questions and propose a structured plan.
                </p>

                {!noraPreview ? (
                  <form onSubmit={handleHomepageNoraSubmit} className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={initialPrompt}
                        onChange={(e) => setInitialPrompt(e.target.value)}
                        placeholder="My mom is being discharged Friday and lives alone..."
                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-line bg-cream text-ink text-sm placeholder:text-muted-ink/70 focus:outline-none focus:ring-2 focus:ring-evergreen/20 focus:border-evergreen transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!initialPrompt.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-evergreen hover:bg-evergreen-dark text-white flex items-center justify-center transition-colors disabled:opacity-40"
                        title="Start with Nora"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Suggestion Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        'My mom fell and is being discharged Friday.',
                        'Mom lives alone and stairs are becoming unsafe.',
                        'Need to find short-term rehab and local movers.',
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setInitialPrompt(chip);
                            setNoraPreview("I can help you work through that. I'll ask a few focused questions so I can build a plan around her situation.");
                          }}
                          className="text-[11px] px-3 py-1 rounded-full border border-line bg-white hover:bg-sage text-muted-ink hover:text-evergreen transition-colors text-left"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 pt-1">
                    <div className="p-3 rounded-xl bg-sage/50 border border-line/80 text-xs leading-relaxed text-ink space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-evergreen">
                        <span>✦</span>
                        <span>Nora:</span>
                      </div>
                      <p>{noraPreview}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleContinueWithNora}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-semibold text-xs shadow-2xs transition-all"
                      >
                        <span>Continue with Nora</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setNoraPreview(null)}
                        className="text-xs text-muted-ink hover:text-ink underline"
                      >
                        Edit note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Product Preview Card */}
        <section className="py-14 bg-white border-b border-line">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-line bg-cream p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-line">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-ink block mb-1">
                    Transition Command Center
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-ink">
                    Everything in one calm, shared workspace
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-bg text-amber text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-dot" />
                    Targeted milestones
                  </span>
                </div>
              </div>

              {/* Sample Two-Tone Banner Preview */}
              <div className="transition-hero mb-6">
                <div className="hero-main">
                  <div className="flex items-center gap-2 text-xs text-[#D7E7D9] mb-3">
                    <span className="w-2 h-2 rounded-full bg-amber-dot" />
                    <span className="font-semibold text-white">Discharge in 5 days</span>
                    <span>·</span>
                    <span>High Priority</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Maria&apos;s transition</h3>
                  <p className="text-sm text-[#BED2C8] leading-relaxed max-w-md">
                    A clear, phased path forward after hospital discharge — from home safety to moving support.
                  </p>
                  <div className="mt-5 max-w-sm">
                    <div className="flex justify-between text-xs text-[#CFE0D4] mb-1.5">
                      <span>Overall plan progress</span>
                      <strong className="text-white">35%</strong>
                    </div>
                    <div className="h-2 rounded-full bg-[#163D37] overflow-hidden">
                      <div className="h-full bg-[#D7AD77] rounded-full w-[35%]" />
                    </div>
                  </div>
                </div>

                <div className="hero-stats">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-[#A7C4B6] uppercase block mb-1">
                      Expected Cost Range
                    </span>
                    <strong className="text-xl text-white font-bold">$5,800 – $9,400</strong>
                    <span className="text-xs text-[#B7D1C5] block mt-0.5">Budget tracking &amp; quotes</span>
                  </div>
                  <div className="h-px bg-[#477368] w-full" />
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-[#A7C4B6] uppercase block mb-1">
                      Immediate Focus
                    </span>
                    <strong className="text-base text-white font-bold">Confirm safe destination</strong>
                    <span className="text-xs text-[#B7D1C5] block mt-0.5">Assigned to Sarah · Due today</span>
                  </div>
                </div>
              </div>

              {/* Sample Task Sequence */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-line flex items-start gap-3">
                  <span className="task-icon urgent text-sm font-bold">1</span>
                  <div>
                    <strong className="text-sm font-semibold text-ink block">
                      Confirm discharge destination
                    </strong>
                    <span className="text-xs text-muted-ink">Safety first · Unlocks subsequent steps</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-line flex items-start gap-3">
                  <span className="task-icon warm text-sm font-bold">2</span>
                  <div>
                    <strong className="text-sm font-semibold text-ink block">
                      Assess home safety &amp; stairs
                    </strong>
                    <span className="text-xs text-muted-ink">Grab bars, main-floor sleeping layout</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-line flex items-start gap-3">
                  <span className="task-icon sage text-sm font-bold">3</span>
                  <div>
                    <strong className="text-sm font-semibold text-ink block">
                      Coordinate senior movers
                    </strong>
                    <span className="text-xs text-muted-ink">3 nearby vetted options identified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 md:py-28 border-b border-line">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-evergreen block mb-2">
                Simple &amp; Thoughtful Process
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-ink tracking-tight mb-4">
                How MoveWell works
              </h2>
              <p className="text-base text-muted-ink leading-relaxed">
                We remove the overwhelm of elder transitions by breaking high-stakes moments into
                guided, sequential clarity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-7 bg-white rounded-2xl border border-line shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-sage text-evergreen flex items-center justify-center font-bold text-base mb-5">
                  1
                </div>
                <h3 className="text-xl font-bold text-ink mb-2">Tell us what&apos;s happening</h3>
                <p className="text-sm text-muted-ink leading-relaxed">
                  Have a relaxed, one-question-at-a-time conversation with Nora. Share your parent&apos;s
                  situation, discharge timing, mobility concerns, and budget without filling out tedious forms.
                </p>
              </div>

              <div className="p-7 bg-white rounded-2xl border border-line shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-amber-bg text-amber flex items-center justify-center font-bold text-base mb-5">
                  2
                </div>
                <h3 className="text-xl font-bold text-ink mb-2">Review a proposed plan</h3>
                <p className="text-sm text-muted-ink leading-relaxed">
                  MoveWell generates a structured draft: sequenced priorities, clear family roles,
                  estimated costs, and relevant local resources. Edit and tailor anything before starting.
                </p>
              </div>

              <div className="p-7 bg-white rounded-2xl border border-line shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-sage text-evergreen flex items-center justify-center font-bold text-base mb-5">
                  3
                </div>
                <h3 className="text-xl font-bold text-ink mb-2">Coordinate with confidence</h3>
                <p className="text-sm text-muted-ink leading-relaxed">
                  Activate your plan to enter a dedicated command center. Keep family on the same page,
                  track quotes, and consult Nora anytime unexpected changes happen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What MoveWell Brings Together */}
        <section className="py-20 bg-white border-b border-line">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-evergreen block mb-2">
                Unified Coordination
              </span>
              <h2 className="text-3xl font-bold text-ink tracking-tight mb-4">
                What MoveWell brings together
              </h2>
              <p className="text-base text-muted-ink leading-relaxed">
                Rather than juggling separate notes, group texts, spreadsheets, and search tabs,
                MoveWell integrates every facet of the transition.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-line bg-cream/50">
                <div className="w-9 h-9 rounded-lg bg-evergreen text-white flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-ink mb-1.5">Actionable Tasks</h4>
                <p className="text-xs text-muted-ink leading-relaxed">
                  Sequenced by deterministic dependencies so your family focuses only on what needs
                  attention right now.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-line bg-cream/50">
                <div className="w-9 h-9 rounded-lg bg-evergreen text-white flex items-center justify-center mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-ink mb-1.5">Family Coordination</h4>
                <p className="text-xs text-muted-ink leading-relaxed">
                  Clarifies who is driving locally and who is coordinating remotely, avoiding duplicated
                  effort and dropped balls.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-line bg-cream/50">
                <div className="w-9 h-9 rounded-lg bg-evergreen text-white flex items-center justify-center mb-4">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-ink mb-1.5">Cost Planning &amp; Quotes</h4>
                <p className="text-xs text-muted-ink leading-relaxed">
                  Clear budget baselines and structured quote extraction from mover estimates and contractor bids.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-line bg-cream/50">
                <div className="w-9 h-9 rounded-lg bg-evergreen text-white flex items-center justify-center mb-4">
                  <MapPin className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-ink mb-1.5">Relevant Local Resources</h4>
                <p className="text-xs text-muted-ink leading-relaxed">
                  Surfaced specifically for tasks that need outside help — like movers, grab bar installers,
                  and donation pickup.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-line bg-cream/50">
                <div className="w-9 h-9 rounded-lg bg-evergreen text-white flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-ink mb-1.5">Nora Guidance</h4>
                <p className="text-xs text-muted-ink leading-relaxed">
                  An on-demand assistant ready to explain medical discharge terminology, suggest next
                  priorities, or summarize progress.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-line bg-cream/50">
                <div className="w-9 h-9 rounded-lg bg-evergreen text-white flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-ink mb-1.5">Transparent Provenance</h4>
                <p className="text-xs text-muted-ink leading-relaxed">
                  Honest labeling of public agencies, reviewed directories, and nearby options without
                  inflated verification claims.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="py-20 bg-evergreen text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Bring clarity to your family&apos;s next step.
            </h2>
            <p className="text-base sm:text-lg text-[#BED2C8] max-w-xl mx-auto mb-8 leading-relaxed">
              Start with a few sentences about your parent&apos;s situation. Nora will guide you through
              building a proposed plan in minutes.
            </p>
            <Link
              href="/get-started"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white hover:bg-cream text-evergreen font-bold text-base transition-colors shadow-sm"
            >
              <span>See how MoveWell can help</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-cream border-t border-line text-xs text-muted-ink">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-evergreen text-white flex items-center justify-center text-[10px] font-bold">
              M
            </span>
            <span className="font-semibold text-ink">MoveWell</span>
            <span>· Calm transition coordination for families</span>
          </div>
          <div>© {new Date().getFullYear()} MoveWell. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
