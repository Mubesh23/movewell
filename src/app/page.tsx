'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, AlertCircle, CheckCircle2, ChevronRight, MapPin, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';

export default function LandingPage() {
  const router = useRouter();
  const [situation, setSituation] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState(false);
  const [candidatePlan, setCandidatePlan] = useState<any | null>(null);
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);

  // Editable candidate fields for explicit confirmation
  const [customZip, setCustomZip] = useState('');
  const [customBudget, setCustomBudget] = useState('8000');

  const handleAnalyzeSituation = async (customText?: string) => {
    const textToAnalyze = customText || situation;
    if (!textToAnalyze.trim()) return;

    setAnalyzing(true);
    setCandidatePlan(null);
    setIntakeError(null);

    try {
      const res = await fetch('/api/ai/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToAnalyze }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCandidatePlan(data.data);
        if (data.data.zipCode) setCustomZip(data.data.zipCode);
        if (data.data.budget) setCustomBudget(String(data.data.budget));
      } else {
        setIntakeError(data.error || "I couldn't confidently extract the transition details.");
      }
    } catch (err: any) {
      setIntakeError('Error analyzing situation: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreatePlanFromCandidate = async () => {
    if (!candidatePlan) return;
    setCreatingPlan(true);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transitionType: candidatePlan.transitionType || 'POST_HOSPITAL',
          seniorName: candidatePlan.seniorName,
          ageRange: candidatePlan.ageRange || '75-80',
          budget: Number(customBudget) || candidatePlan.budget || 8000,
          zipCode: customZip.trim() || candidatePlan.zipCode || '77004',
          livesAlone: candidatePlan.livesAlone !== false,
          mobilityConstraint: candidatePlan.mobilityConstraint !== false,
          stairsConstraint: candidatePlan.stairsConstraint !== false,
          userName: candidatePlan.userName || 'Family Coordinator',
          localHelperName: candidatePlan.localHelperName || 'Local Helper',
        }),
      });
      const data = await res.json();
      if (data.success && data.caseId) {
        router.push(`/plan/${data.caseId}`);
      } else {
        alert('Failed to create plan: ' + data.error);
        setCreatingPlan(false);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
      setCreatingPlan(false);
    }
  };

  const handleLoadMariaScenario = async () => {
    setLoadingPreset(true);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: 'MARIA_GOLDEN_SCENARIO' }),
      });
      const data = await res.json();
      if (data.success && data.caseId) {
        router.push(`/plan/${data.caseId}`);
      } else {
        alert('Failed to load Maria scenario: ' + data.error);
        setLoadingPreset(false);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
      setLoadingPreset(false);
    }
  };

  const samplePrompt =
    'My mom Maria is 78. She had a fall and is in the hospital in Houston. They expect to discharge her in 5 days. She lives alone in a two-story house and cannot safely use stairs anymore. I live in Chicago, but my sister Jennifer lives nearby. We have around $8,000 to work with.';

  return (
    <div className="min-h-screen bg-canvas text-charcoal flex flex-col justify-between selection:bg-terracotta-subtle selection:text-cocoa font-sans">
      {/* Editorial Header */}
      <header className="border-b border-stone-line bg-surface/90 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-md bg-forest text-surface font-serif font-bold text-sm flex items-center justify-center">
              M
            </span>
            <span className="text-xl font-serif font-bold text-charcoal tracking-tight">
              MoveWell
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <Link
              href="/start"
              className="text-xs font-semibold text-terracotta hover:text-terracotta-hover transition-colors"
            >
              Use guided intake &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section: Two-column editorial layout */}
      <main className="max-w-6xl mx-auto px-6 py-12 sm:py-16 flex-1 w-full space-y-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column (7 cols): Editorial Narrative + Conversational Intake */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-terracotta font-sans">
                Hospital Discharge &amp; Family Care Coordination
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-serif font-bold text-charcoal tracking-tight leading-[1.12]">
                A calmer way through what comes next.
              </h1>
              <p className="text-base sm:text-lg text-stone-text leading-relaxed max-w-xl">
                When a parent suddenly needs more support, MoveWell helps your family understand what needs to happen, coordinate who&apos;s doing it, and keep the transition moving.
              </p>
            </div>

            {/* Conversational Intake Form */}
            <div className="rounded-xl border border-stone-line bg-surface p-5 sm:p-6 shadow-2xs space-y-4">
              <label
                htmlFor="situation-input"
                className="block text-xs font-semibold uppercase tracking-wider text-muted"
              >
                Tell us what&apos;s happening
              </label>

              <Textarea
                id="situation-input"
                rows={4}
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="e.g. My mom Maria is 78. She had a fall and is hospitalized in Houston. Discharge is in 5 days, but she can't safely use stairs at home anymore..."
                className="text-sm placeholder:text-muted/60"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSituation(samplePrompt);
                    handleAnalyzeSituation(samplePrompt);
                  }}
                  className="text-xs text-forest hover:text-terracotta underline underline-offset-4 text-left font-medium transition-colors"
                >
                  Use sample situation (Maria, 78 &bull; Houston)
                </button>

                <Button
                  type="button"
                  variant="default"
                  size="default"
                  isLoading={analyzing}
                  disabled={!situation.trim()}
                  onClick={() => handleAnalyzeSituation()}
                  className="w-full sm:w-auto"
                >
                  <span>Build my plan</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <p className="text-[12px] text-muted">
                No account or payment needed to create your transition plan.
              </p>

              {/* Recoverable Intake Error */}
              {intakeError && (
                <div className="p-3.5 bg-status-critical-bg border border-status-critical/20 rounded-lg text-xs text-status-critical space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="font-medium">{intakeError}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs pt-1 border-t border-status-critical/10">
                    <button
                      type="button"
                      onClick={() => handleAnalyzeSituation()}
                      className="underline font-semibold"
                    >
                      Try again
                    </button>
                    <span>&bull;</span>
                    <button
                      type="button"
                      onClick={() => router.push('/start')}
                      className="underline font-semibold"
                    >
                      Use guided form instead
                    </button>
                  </div>
                </div>
              )}

              {/* Candidate Plan Summary after Nora Analysis */}
              {candidatePlan && (
                <div className="mt-4 pt-5 border-t border-stone-line space-y-4 animate-in fade-in">
                  <div className="rounded-lg bg-surface border border-stone-line p-4 text-xs space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-forest text-surface font-serif text-[10px] font-bold flex items-center justify-center">
                          N
                        </span>
                        <span className="font-semibold text-charcoal text-sm">
                          Transition Assessment for {candidatePlan.seniorName}
                        </span>
                      </div>

                      {candidatePlan.dischargeDays && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ochre-text bg-ochre-subtle border border-ochre-border px-2 py-0.5 rounded-full">
                          <Calendar className="w-3 h-3" />
                          {candidatePlan.dischargeDays} days to discharge
                        </span>
                      )}
                    </div>

                    <p className="text-charcoal/90 leading-relaxed">
                      {candidatePlan.summaryText}
                    </p>

                    {/* Explicit Confirmation of Extracted Fields / Assumptions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-line/60">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">
                          Location / ZIP {candidatePlan.zipCode ? '(Detected)' : '(Required for Local Providers)'}
                        </label>
                        <Input
                          value={customZip}
                          onChange={(e) => setCustomZip(e.target.value)}
                          placeholder="e.g. 77005 (Houston)"
                          className="h-8 text-xs"
                        />
                        {!candidatePlan.zipCode && (
                          <p className="text-[10px] text-terracotta mt-0.5">
                            ZIP code wasn&apos;t explicitly mentioned. Defaults to Houston pilot if blank.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">
                          Family Stated Budget ($)
                        </label>
                        <Input
                          value={customBudget}
                          onChange={(e) => setCustomBudget(e.target.value)}
                          placeholder="e.g. 8000"
                          className="h-8 text-xs"
                        />
                        {!candidatePlan.budget && (
                          <p className="text-[10px] text-muted mt-0.5">
                            No budget mentioned. Baseline contingency of $8,000 assumed.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <Button
                      type="button"
                      variant="default"
                      size="default"
                      isLoading={creatingPlan}
                      onClick={handleCreatePlanFromCandidate}
                      className="flex-1 font-semibold"
                    >
                      <span>Create Transition Plan for {candidatePlan.seniorName}</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="default"
                      onClick={() => router.push('/start')}
                    >
                      Edit in guided form
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Editorial Photography */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-stone-line shadow-xs aspect-[4/3] sm:aspect-[16/11]">
              <Image
                src="/images/family-transition.jpg"
                alt="Adult daughter and aging parent reviewing paperwork in a warm home setting"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
            
            {/* Neutral Product Copy (Replaced fabricated testimonial) */}
            <p className="text-xs text-stone-text leading-relaxed text-center sm:text-left">
              Designed to give families one shared place to coordinate the days before and after discharge.
            </p>

            {/* Clearly Separated Demo Scenario Box */}
            <div className="rounded-xl border border-stone-line border-l-4 border-l-terracotta bg-surface p-4 space-y-2 mt-6 shadow-2xs">
              <p className="text-xs font-semibold text-charcoal">
                Evaluating MoveWell?
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Explore our full sample transition scenario for Maria Thompson ($8,000 budget, 5 days to discharge in Houston).
              </p>
              <button
                type="button"
                disabled={loadingPreset}
                onClick={handleLoadMariaScenario}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta-hover transition-colors pt-1"
              >
                {loadingPreset ? (
                  <span>Loading demo case...</span>
                ) : (
                  <>
                    <span>Explore sample scenario</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section: Below the Fold — Editorial Narrative with horizontal dividers */}
        <section className="pt-12 border-t border-stone-line space-y-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-terracotta mb-1">
              One plan. Everyone aligned.
            </p>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal tracking-tight">
              Designed for the realities of modern senior transitions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 pt-2">
            <div className="space-y-2">
              <span className="font-serif text-2xl font-bold text-terracotta">01</span>
              <h3 className="font-serif font-semibold text-lg text-charcoal">
                Understand what matters now
              </h3>
              <p className="text-sm text-stone-text leading-relaxed">
                MoveWell identifies the critical path decision that must be resolved first—such as post-hospital destination confirmation—before downstream actions can unlock.
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-serif text-2xl font-bold text-terracotta">02</span>
              <h3 className="font-serif font-semibold text-lg text-charcoal">
                Coordinate the whole family
              </h3>
              <p className="text-sm text-stone-text leading-relaxed">
                Clear task ownership whether family members are coordinating remotely from another state or helping hands-on locally.
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-serif text-2xl font-bold text-terracotta">03</span>
              <h3 className="font-serif font-semibold text-lg text-charcoal">
                Adapt as reality changes
              </h3>
              <p className="text-sm text-stone-text leading-relaxed">
                When discharge decisions evolve, tasks are marked complete, or moving quotes arrive, the transition plan adapts dynamically without losing budget integrity.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Product Preview Snippet */}
        <section className="pt-10 border-t border-stone-line space-y-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-serif font-semibold text-charcoal">
              What the family sees each day
            </h3>
            <span className="text-xs text-muted">Command center preview</span>
          </div>

          <div className="rounded-xl border border-stone-line border-l-4 border-l-terracotta bg-surface p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-semibold uppercase tracking-wider text-terracotta font-sans">
                Immediate Focus Task
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-ochre-subtle text-ochre-text border border-ochre-border">
                <span className="w-1.5 h-1.5 rounded-full bg-ochre" />
                Ready to decide
              </span>
            </div>

            <h4 className="text-xl font-serif font-bold text-charcoal">
              Confirm where Maria will go after hospital discharge
            </h4>

            <p className="text-sm text-stone-text max-w-2xl leading-relaxed">
              Maria cannot safely navigate the two-story stairs at home. The social worker needs to confirm short-term rehab vs return-home support before movers or equipment can be scheduled.
            </p>

            <div className="pt-3 border-t border-stone-line/60 flex items-center justify-between text-xs text-muted">
              <span>Sarah &bull; Due today</span>
              <span className="text-forest font-semibold">Unlocks 4 downstream tasks &rarr;</span>
            </div>
          </div>
        </section>
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-stone-line py-8 bg-surface/50 text-xs text-muted">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-charcoal">MoveWell</span>
            <span>&bull;</span>
            <span>A calmer path forward for senior housing transitions</span>
          </div>
          <p className="text-muted/70">
            &copy; {new Date().getFullYear()} MoveWell. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
