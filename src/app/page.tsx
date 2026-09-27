'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, CheckCircle2, Clock, ShieldCheck, DollarSign, AlertCircle } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [situation, setSituation] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState(false);
  const [candidatePlan, setCandidatePlan] = useState<any | null>(null);
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);

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
          budget: candidatePlan.budget || 8000,
          zipCode: candidatePlan.zipCode || '77004',
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

  const samplePrompt = "My mom Maria is 78. She had a fall and is in the hospital in Houston. They expect to discharge her in 5 days. She lives alone in a two-story house and cannot safely use stairs anymore. I live in Chicago, but my sister Jennifer lives nearby. We have around $8,000 to work with.";

  return (
    <div className="min-h-screen bg-sand-100 flex flex-col justify-between text-stone-900">
      {/* Header / Brand */}
      <header className="px-6 py-6 border-b border-stone-200/70 bg-white/70 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
              M
            </div>
            <div>
              <span className="text-2xl font-serif font-bold text-brand-900 tracking-tight block">
                MoveWell
              </span>
              <span className="text-xs text-stone-500 font-medium tracking-wide uppercase block">
                A calmer path forward
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push('/start')}
            className="text-xs font-bold text-brand-900 hover:text-brand-700 transition bg-brand-50 px-4 py-2 rounded-xl border border-brand-200"
          >
            Guided Form Intake &rarr;
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-900 text-xs font-bold mb-6">
          <Sparkles className="w-4 h-4 text-brand-700" />
          <span>Conversational Senior Housing Transition Management</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-brand-950 tracking-tight leading-tight max-w-3xl mb-4">
          When a parent suddenly needs to move, knowing what to do next is hard.
        </h1>

        <p className="text-base sm:text-lg text-stone-600 max-w-2xl leading-relaxed mb-8">
          Tell us what&apos;s happening. MoveWell turns your family&apos;s situation into a clear, coordinated transition plan with ordered priorities, task dependencies, and budget ranges.
        </p>

        {/* Primary Conversational Input Card */}
        <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-xl border border-stone-200/90 text-left mb-8">
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-900 mb-2">
            Tell us what&apos;s happening
          </label>

          <textarea
            rows={4}
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="e.g. My mom Maria is 78. She had a fall and is in the hospital in Houston. They expect to discharge her in 5 days. She lives alone in a two-story house and cannot safely use stairs. I live in Chicago, but my sister Jennifer lives nearby. We have around $8,000 to work with."
            className="w-full bg-sand-50/70 border border-stone-200 rounded-2xl p-4 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-brand-800 transition mb-3"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => {
                setSituation(samplePrompt);
                handleAnalyzeSituation(samplePrompt);
              }}
              className="text-xs text-brand-800 hover:text-brand-900 font-semibold underline flex items-center space-x-1"
            >
              <span>Paste Sample Scenario (Maria, 78)</span>
            </button>

            <button
              onClick={() => handleAnalyzeSituation()}
              disabled={analyzing || !situation.trim()}
              className="w-full sm:w-auto bg-brand-900 hover:bg-brand-800 text-white font-bold py-3 px-6 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 text-sm"
            >
              {analyzing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Analyzing Situation...</span>
                </>
              ) : (
                <>
                  <span>Build My Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Recoverable Intake Error */}
          {intakeError && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <p className="font-semibold">{intakeError}</p>
              </div>
              <div className="flex items-center space-x-3 text-[11px] pt-1 border-t border-rose-100">
                <button
                  onClick={() => handleAnalyzeSituation()}
                  className="underline font-bold text-rose-900"
                >
                  Try again
                </button>
                <span>&bull;</span>
                <button
                  onClick={() => router.push('/start')}
                  className="underline font-bold text-rose-900"
                >
                  Use guided form
                </button>
              </div>
            </div>
          )}

          {/* Candidate Plan Summary Card after Nora analysis */}
          {candidatePlan && (
            <div className="mt-6 pt-6 border-t border-stone-200 space-y-4">
              <div className="bg-brand-50/70 rounded-2xl p-4 border border-brand-200 text-xs text-brand-950">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-brand-900 text-white flex items-center justify-center font-bold text-xs">
                    N
                  </div>
                  <span className="font-bold text-sm text-brand-950">Nora&apos;s Transition Assessment</span>
                </div>
                <p className="text-stone-700 leading-relaxed mb-3">
                  {candidatePlan.summaryText}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-medium text-stone-800">
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-stone-200">
                    <span className="text-stone-400 block text-[10px]">Senior</span>
                    <strong>{candidatePlan.seniorName} {candidatePlan.ageRange ? `(${candidatePlan.ageRange})` : ''}</strong>
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-stone-200">
                    <span className="text-stone-400 block text-[10px]">Discharge Timeline</span>
                    <strong>{candidatePlan.dischargeDays} Days (Urgent)</strong>
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-stone-200">
                    <span className="text-stone-400 block text-[10px]">Budget Available</span>
                    <strong>${candidatePlan.budget?.toLocaleString()}</strong>
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-stone-200">
                    <span className="text-stone-400 block text-[10px]">Primary Coordinator</span>
                    <strong>{candidatePlan.userName} {candidatePlan.userCity ? `(${candidatePlan.userCity})` : ''}</strong>
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-stone-200">
                    <span className="text-stone-400 block text-[10px]">Local Helper</span>
                    <strong>{candidatePlan.localHelperName || 'Family/Support'} {candidatePlan.localHelperCity ? `(${candidatePlan.localHelperCity})` : ''}</strong>
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-stone-200">
                    <span className="text-stone-400 block text-[10px]">Primary Safety Risk</span>
                    <strong>{candidatePlan.stairsConstraint ? 'Stairs / Mobility' : 'Mobility Support'}</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCreatePlanFromCandidate}
                  disabled={creatingPlan}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-5 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 text-sm"
                >
                  {creatingPlan ? (
                    <span>Generating Plan...</span>
                  ) : (
                    <>
                      <span>Create Transition Plan for {candidatePlan.seniorName}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => router.push('/start')}
                  className="bg-sand-100 hover:bg-sand-200 text-stone-800 font-semibold py-3 px-4 rounded-2xl border border-stone-300 transition text-xs"
                >
                  Edit in Guided Form
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preset Button Bar */}
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-12">
          <span className="text-xs text-stone-500 font-medium">Or skip intake &amp; load preset:</span>
          <button
            onClick={handleLoadMariaScenario}
            disabled={loadingPreset}
            className="text-xs font-bold text-brand-900 bg-white hover:bg-stone-50 px-4 py-2 rounded-xl border border-stone-300 shadow-xs transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            {loadingPreset ? (
              <span>Loading Maria Scenario...</span>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Explore Maria Thompson Scenario ($8,000 budget, 5-day discharge)</span>
              </>
            )}
          </button>
        </div>

        {/* Feature Value Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
            <Clock className="w-7 h-7 text-brand-800 mb-3" />
            <h3 className="font-bold text-stone-900 text-base mb-1">What Matters Today</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Always highlights your single top priority so remote caregivers know what to tackle first.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
            <ShieldCheck className="w-7 h-7 text-brand-800 mb-3" />
            <h3 className="font-bold text-stone-900 text-base mb-1">Deterministic Dependencies</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Downstream tasks unlock automatically when discharge destination &amp; accessibility decisions are finalized.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
            <DollarSign className="w-7 h-7 text-brand-800 mb-3" />
            <h3 className="font-bold text-stone-900 text-base mb-1">Quote Intelligence</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Upload vendor moving quotes to compare actual prices against planning estimates without altering your budget.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-stone-200 text-center text-xs text-stone-400">
        MoveWell &copy; 2026. A calmer path forward for senior housing transitions.
      </footer>
    </div>
  );
}
