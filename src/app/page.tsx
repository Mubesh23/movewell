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
  Send,
  HelpCircle,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [noraPreview, setNoraPreview] = useState<{
    userMessage: string;
    noraReply: string;
  } | null>(null);

  const handleHomepageNoraSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialPrompt.trim()) return;
    setNoraPreview({
      userMessage: initialPrompt.trim(),
      noraReply:
        "I'm on it. Tell me a little more about who you're planning for, and I'll help you find the right next step.",
    });
  };

  const handleChipClick = (promptText: string) => {
    setInitialPrompt(promptText);
    setNoraPreview({
      userMessage: promptText,
      noraReply:
        "I'm on it. Tell me a little more about who you're planning for, and I'll help you find the right next step.",
    });
  };

  const handleContinueWithNora = () => {
    const text = noraPreview?.userMessage || initialPrompt.trim();
    if (!text) return;
    router.push(`/get-started?initial=${encodeURIComponent(text)}`);
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
        {/* Signature Editorial Two-Column Hero Section */}
        <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-line overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column (7 cols): Brand Narrative & Main CTAs */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sage/60 text-evergreen text-xs font-semibold tracking-wide border border-evergreen/10">
                  <Sparkles className="w-3.5 h-3.5 text-evergreen" />
                  <span>SUPPORT FOR LIFE&apos;S TRANSITIONS</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold text-[#183331] tracking-[-0.05em] leading-[1.1]">
                  When life changes,{' '}
                  <span className="text-[#b96c2c]">
                    you don&apos;t have to figure it out alone.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-muted-ink leading-relaxed max-w-xl">
                  MoveWell helps families navigate caregiving, recovery, and moving with a clear plan, trusted guidance, and the right support at every step.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('nora-input-field');
                      el?.focus();
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-semibold text-sm transition-all shadow-sm"
                  >
                    <span>Talk to Nora</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-line bg-white hover:bg-cream text-ink font-semibold text-sm transition-colors text-center"
                  >
                    See how it works
                  </a>

                  <button
                    type="button"
                    onClick={handleExploreSamplePlan}
                    disabled={loadingDemo}
                    className="text-xs font-semibold text-muted-ink hover:text-ink px-2 py-3 transition-colors text-center"
                  >
                    {loadingDemo ? 'Loading demo...' : 'Explore sample plan →'}
                  </button>
                </div>

                <div className="flex items-center gap-6 pt-3 text-xs text-muted-ink font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-evergreen" />
                    Private &amp; secure
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-evergreen" />
                    Built for families
                  </span>
                </div>
              </div>

              {/* Right Column (5 cols): Functional Nora Preview Card */}
              <div className="lg:col-span-5">
                <div className="rounded-3xl border border-line bg-white p-5 sm:p-6 shadow-md shadow-stone-200/50 relative">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-line/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-evergreen text-white flex items-center justify-center font-bold text-xs">
                        ✦
                      </div>
                      <div>
                        <strong className="text-sm font-bold text-ink block leading-none">
                          Nora
                        </strong>
                        <span className="text-[11px] text-muted-ink leading-tight">
                          MoveWell&apos;s AI planning guide
                        </span>
                      </div>
                    </div>
                    <div
                      className="text-muted-ink hover:text-ink cursor-pointer"
                      title="Nora helps with planning and coordination. She doesn't provide medical, legal, or financial advice."
                    >
                      <HelpCircle className="w-4 h-4 text-muted-ink/70" />
                    </div>
                  </div>

                  {/* Speech Bubbles */}
                  <div className="space-y-3 mb-4 min-h-[170px] flex flex-col justify-end">
                    {/* Nora Welcome Bubble */}
                    <div className="p-3.5 rounded-2xl bg-cream/70 border border-line text-xs text-ink leading-relaxed self-start max-w-[90%]">
                      Hi, I&apos;m Nora. I can help you make sense of what&apos;s next and turn a big transition into a clear, doable plan.
                    </div>

                    {noraPreview && (
                      <>
                        {/* User Bubble */}
                        <div className="p-3 rounded-2xl bg-evergreen text-white text-xs leading-relaxed self-end max-w-[85%] font-medium">
                          {noraPreview.userMessage}
                        </div>

                        {/* Nora Response Bubble */}
                        <div className="p-3.5 rounded-2xl bg-cream/70 border border-line text-xs text-ink leading-relaxed self-start max-w-[90%]">
                          {noraPreview.noraReply}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Interaction Area */}
                  {noraPreview ? (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleContinueWithNora}
                        className="w-full py-3 px-4 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs"
                      >
                        <span>Continue with Nora</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Quick Prompts */}
                      <div className="flex flex-col gap-1.5">
                        {[
                          'My parent needs to move',
                          'My parent is leaving the hospital',
                          "I'm not sure what help we need",
                        ].map((prompt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleChipClick(prompt)}
                            className="text-left px-3 py-2 rounded-xl bg-sage/40 hover:bg-sage border border-line/60 text-xs font-medium text-evergreen hover:text-evergreen-dark transition-colors"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>

                      {/* Custom input */}
                      <form onSubmit={handleHomepageNoraSubmit} className="relative pt-1">
                        <input
                          id="nora-input-field"
                          type="text"
                          value={initialPrompt}
                          onChange={(e) => setInitialPrompt(e.target.value)}
                          placeholder="Tell Nora what's going on..."
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-line bg-cream/50 text-xs text-ink placeholder:text-muted-ink/70 focus:outline-none focus:ring-2 focus:ring-evergreen/20 focus:border-evergreen transition-all"
                        />
                        <button
                          type="submit"
                          disabled={!initialPrompt.trim()}
                          className="absolute right-1.5 top-2 w-7 h-7 rounded-lg bg-evergreen hover:bg-evergreen-dark text-white flex items-center justify-center transition-colors disabled:opacity-30"
                          title="Send to Nora"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  )}

                  <p className="text-[10px] text-muted-ink text-center mt-3">
                    Nora offers planning guidance, not medical, legal, or financial advice.
                  </p>
                </div>
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
                  Keep family members, vendors, and deadlines aligned. As decisions change, MoveWell adapts
                  dates and assignments so everyone stays on the same page.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-line py-12 text-center text-xs text-muted-ink">
        <p>&copy; {new Date().getFullYear()} MoveWell. Thoughtful transition coordination for families.</p>
      </footer>
    </div>
  );
}
