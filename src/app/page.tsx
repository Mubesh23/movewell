'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Heart, Sparkles, ShieldAlert, CheckCircle2, Clock, Users, DollarSign } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLoadMariaScenario = async () => {
    setLoading(true);
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
        setLoading(false);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-100 flex flex-col justify-between">
      {/* Header / Brand */}
      <header className="px-6 py-6 border-b border-stone-200/60 bg-white/60 backdrop-blur">
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
            className="text-sm font-semibold text-brand-900 hover:text-brand-700 transition"
          >
            Start Intake &rarr;
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-12 text-center flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-900 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-brand-700" />
          <span>Housing transition management for aging parents</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-brand-950 tracking-tight leading-tight max-w-3xl mb-6">
          Tell us what happened. <br className="hidden sm:inline" />
          We&apos;ll show you what to do next.
        </h1>

        <p className="text-lg text-stone-600 max-w-2xl leading-relaxed mb-8">
          MoveWell turns a chaotic housing transition into a clear, structured plan with ordered priorities, task dependencies, family roles, and transparent planning estimates.
        </p>

        {/* Primary CTA Box */}
        <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-xl border border-stone-200/80 mb-12">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-3">
            Golden Demo Scenario
          </p>
          <div className="bg-sand-50 rounded-2xl p-4 border border-sand-300 text-left mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-stone-900 text-sm">Maria Thompson (Age 78)</span>
              <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                Discharge in 5 days
              </span>
            </div>
            <p className="text-xs text-stone-600 mb-2 leading-relaxed">
              Hospitalized after a fall in Houston, TX. Cannot safely navigate stairs in her two-story home. Daughter Sarah coordinates remotely from Chicago.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-stone-700">
              <span className="bg-white px-2 py-1 rounded-md border border-stone-200">Budget: $8,000</span>
              <span className="bg-white px-2 py-1 rounded-md border border-stone-200">Target: Nov 7</span>
              <span className="bg-white px-2 py-1 rounded-md border border-stone-200">Post-Hospital</span>
            </div>
          </div>

          <button
            onClick={handleLoadMariaScenario}
            disabled={loading}
            className="w-full bg-brand-900 hover:bg-brand-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 text-base"
          >
            {loading ? (
              <span>Generating Plan...</span>
            ) : (
              <>
                <span>Load Maria&apos;s Post-Hospital Scenario</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="mt-4 pt-3 border-t border-stone-100">
            <button
              onClick={() => router.push('/start')}
              className="text-xs text-stone-500 hover:text-stone-800 font-semibold underline"
            >
              Or start custom intake from scratch
            </button>
          </div>
        </div>

        {/* Feature Pill Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/70 shadow-xs">
            <Clock className="w-6 h-6 text-brand-800 mb-2" />
            <h3 className="font-bold text-stone-900 text-sm mb-1">Attention-First Dashboard</h3>
            <p className="text-xs text-stone-500 leading-normal">
              Always shows today&apos;s single most urgent priority so Sarah knows what to do first.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/70 shadow-xs">
            <CheckCircle2 className="w-6 h-6 text-brand-800 mb-2" />
            <h3 className="font-bold text-stone-900 text-sm mb-1">Deterministic Dependencies</h3>
            <p className="text-xs text-stone-500 leading-normal">
              Downstream tasks unlock automatically as upstream milestones are completed.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/70 shadow-xs">
            <DollarSign className="w-6 h-6 text-brand-800 mb-2" />
            <h3 className="font-bold text-stone-900 text-sm mb-1">Planning Cost Models</h3>
            <p className="text-xs text-stone-500 leading-normal">
              Calculates expected moving, packing, and repair range estimates against family budget.
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
