'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import {
  ArrowRight,
  CheckCircle2,
  Users,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  Zap,
  Clock3,
} from 'lucide-react';
import { BRAND_NAME } from '@/lib/brand';

export default function LandingPage() {
  const router = useRouter();
  const [loadingDemo, setLoadingDemo] = useState(false);

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
    <div className="min-h-screen bg-[#F7F8F5] text-[#183331] flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Mockup Hero Section - Clean, Warm & Unobstructed */}
        <section className="relative isolate overflow-hidden bg-[#173F39] text-white pt-12 pb-16 md:pt-20 md:pb-24 border-b border-[#12302C]">
          {/* Full-width Background Photo - Uncut and unobstructed */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/movewell-hero.png"
            alt="A family supporting their aging parent"
            className="absolute inset-0 -z-20 size-full object-cover object-center opacity-50 pointer-events-none"
          />
          {/* Mockup Vignette Gradient Overlay */}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(17,56,50,0.95)_0%,rgba(23,63,57,0.85)_40%,rgba(23,63,57,0.2)_100%)] pointer-events-none" />

          <div className="mx-auto flex min-h-[480px] max-w-6xl items-center px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#C8E1CE]">
                <Sparkles className="w-3.5 h-3.5 text-[#C8E1CE]" />
                <span>A CALMER WAY FORWARD</span>
              </div>

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-[-0.02em] text-white">
                When life changes, move through it together.
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-[#D6E6D9] md:text-xl">
                {BRAND_NAME} helps families understand what needs to happen, coordinate who&apos;s doing it, find the right help, track costs, and keep the plan current as life changes.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-[#1F4D45] shadow-lg hover:bg-[#F1F6F1] transition-all"
                >
                  <span>Get started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-white/30 bg-white/10 hover:bg-white/15 text-white font-semibold text-base backdrop-blur-sm transition-colors text-center"
                >
                  See how it works
                </a>

                <button
                  type="button"
                  onClick={handleExploreSamplePlan}
                  disabled={loadingDemo}
                  className="inline-flex items-center justify-center text-sm font-semibold text-[#B8D4BA] hover:text-white px-3 py-3 transition-colors text-center"
                >
                  {loadingDemo ? 'Loading demo...' : 'Explore sample plan →'}
                </button>
              </div>

              <div className="mt-8 flex items-center gap-6 text-sm text-[#B8D4BA]">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#A7C4B6]" />
                  Private family workspace
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#A7C4B6]" />
                  Coordinate care together
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Meet Nora Section: 3 Pillars from Design Mockup */}
        <section className="py-20 md:py-24 border-b border-[#E3E9E5] bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#56816D] mb-3">
                  <Sparkles className="w-4 h-4 text-[#56816D]" />
                  <span>Meet Nora</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#183331] tracking-tight leading-[1.15]">
                  Your AI transition assistant
                </h2>
                <p className="mt-4 text-base sm:text-lg text-[#667572] leading-relaxed max-w-lg">
                  Nora is {BRAND_NAME}&apos;s conversational AI assistant trained on senior care coordination, hospital discharge timelines, and family dynamics. Tell her what&apos;s happening in plain language, and she turns it into a clear, editable plan.
                </p>

                <div className="mt-8 space-y-5">
                  <div className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F3EA] text-[#4D775F]">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#183331]">Talk in plain language</h3>
                      <p className="mt-1 text-xs text-[#667572] leading-relaxed">
                        Share what&apos;s happening with your aging parent—Nora understands the medical, emotional, and logistical complexity.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F3EA] text-[#4D775F]">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#183331]">Get instant clarity</h3>
                      <p className="mt-1 text-xs text-[#667572] leading-relaxed">
                        Nora builds a clear plan with tasks, dates, costs, and local resources—all editable before you make anything permanent.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F3EA] text-[#4D775F]">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#183331]">Keep it current</h3>
                      <p className="mt-1 text-xs text-[#667572] leading-relaxed">
                        As circumstances change, tell Nora. She updates the plan and shows exactly what changed across your whole care circle.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <Link
                    href="/get-started"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1F4D45] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#163D37] shadow-xs transition-colors"
                  >
                    <span>Talk to Nora</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Nora Interactive Showcase Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1F4D45] to-[#173F39] p-7 text-white shadow-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#C8E1CE] mb-4">
                  <Sparkles className="w-4 h-4" />
                  <span>Real-time adaptive planning</span>
                </div>
                <h3 className="text-xl font-bold mb-2">From raw situation to structured steps</h3>
                <p className="text-xs text-[#D6E6D9] leading-relaxed mb-6">
                  Nora doesn&apos;t just chat—she builds an interconnected graph of family tasks, deadlines, and cost estimates.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-start gap-3">
                    <div className="size-6 rounded-full bg-[#D7AD77] text-[#183331] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <strong className="block text-white">Destination confirmation</strong>
                      <span className="text-[#C8E1CE]">Unlocks moving schedule &amp; transportation arrangements</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-start gap-3">
                    <div className="size-6 rounded-full bg-white/20 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <strong className="block text-white">Home safety assessment</strong>
                      <span className="text-[#C8E1CE]">Bathroom grab bars &amp; ground-floor bed placement</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-start gap-3">
                    <div className="size-6 rounded-full bg-white/20 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <strong className="block text-white">Care circle task distribution</strong>
                      <span className="text-[#C8E1CE]">Assigned to local and remote family members with clear due dates</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Transition Command Center Preview */}
        <section className="py-16 bg-[#F7F8F5] border-b border-[#E3E9E5]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-[#E3E9E5] bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#E3E9E5]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#667572] block mb-1">
                    Transition Command Center
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#183331]">
                    Everything in one calm, shared workspace
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
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
                <div className="bg-[#FBFAF7] p-4 rounded-xl border border-[#E3E9E5] flex items-start gap-3">
                  <span className="task-icon urgent text-sm font-bold">1</span>
                  <div>
                    <strong className="text-sm font-semibold text-[#183331] block">
                      Confirm discharge destination
                    </strong>
                    <span className="text-xs text-[#667572]">Safety first · Unlocks subsequent steps</span>
                  </div>
                </div>

                <div className="bg-[#FBFAF7] p-4 rounded-xl border border-[#E3E9E5] flex items-start gap-3">
                  <span className="task-icon warm text-sm font-bold">2</span>
                  <div>
                    <strong className="text-sm font-semibold text-[#183331] block">
                      Assess home safety &amp; stairs
                    </strong>
                    <span className="text-xs text-[#667572]">Grab bars, main-floor sleeping layout</span>
                  </div>
                </div>

                <div className="bg-[#FBFAF7] p-4 rounded-xl border border-[#E3E9E5] flex items-start gap-3">
                  <span className="task-icon sage text-sm font-bold">3</span>
                  <div>
                    <strong className="text-sm font-semibold text-[#183331] block">
                      Coordinate senior movers
                    </strong>
                    <span className="text-xs text-[#667572]">3 nearby vetted options identified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 md:py-28 border-b border-[#E3E9E5] bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-[#1F4D45] block mb-2">
                Simple &amp; Thoughtful Process
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#183331] tracking-tight mb-4">
                How {BRAND_NAME} works
              </h2>
              <p className="text-base text-[#667572] leading-relaxed">
                We remove the overwhelm of elder transitions by breaking high-stakes moments into guided, sequential clarity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-7 bg-[#FBFAF7] rounded-2xl border border-[#E3E9E5] shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-[#E7F0E9] text-[#1F4D45] flex items-center justify-center font-bold text-base mb-5">
                  1
                </div>
                <h3 className="text-xl font-bold text-[#183331] mb-2">Tell us what&apos;s happening</h3>
                <p className="text-sm text-[#667572] leading-relaxed">
                  Have a relaxed, one-question-at-a-time conversation with Nora. Share your parent&apos;s situation, discharge timing, mobility concerns, and budget without filling out tedious forms.
                </p>
              </div>

              <div className="p-7 bg-[#FBFAF7] rounded-2xl border border-[#E3E9E5] shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#92400E] flex items-center justify-center font-bold text-base mb-5">
                  2
                </div>
                <h3 className="text-xl font-bold text-[#183331] mb-2">Review a proposed plan</h3>
                <p className="text-sm text-[#667572] leading-relaxed">
                  {BRAND_NAME} generates a structured draft: sequenced priorities, clear family roles, estimated costs, and relevant local resources. Edit and tailor anything before starting.
                </p>
              </div>

              <div className="p-7 bg-[#FBFAF7] rounded-2xl border border-[#E3E9E5] shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-[#E7F0E9] text-[#1F4D45] flex items-center justify-center font-bold text-base mb-5">
                  3
                </div>
                <h3 className="text-xl font-bold text-[#183331] mb-2">Coordinate with confidence</h3>
                <p className="text-sm text-[#667572] leading-relaxed">
                  Keep family members, vendors, and deadlines aligned. As decisions change, {BRAND_NAME} adapts dates and assignments so everyone stays on the same page.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-[#E3E9E5] py-12 text-center text-xs text-[#667572]">
        <p>&copy; {new Date().getFullYear()} {BRAND_NAME}. Thoughtful transition coordination for families.</p>
      </footer>
    </div>
  );
}
