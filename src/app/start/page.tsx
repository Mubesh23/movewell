'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { ArrowRight, ArrowLeft, Check, Sparkles, AlertCircle, Building, User, Calendar, DollarSign, Users } from 'lucide-react';

export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const defaultDischarge = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const defaultTarget = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Form State initialized with defaults pre-populated for convenience
  const [formData, setFormData] = useState({
    seniorName: 'Maria Thompson',
    ageRange: '78',
    livesAlone: true,
    transitionType: 'POST_HOSPITAL',
    dischargeDate: defaultDischarge,
    stairsConstraint: true,
    mobilityConstraint: true,
    zipCode: '77004',
    homeType: 'Two-story house',
    ownsHome: true,
    destinationStatus: 'UNDECIDED',
    targetDate: defaultTarget,
    budget: 8000,
    userName: 'Sarah',
    userCity: 'Chicago, IL',
    localHelperName: 'Jennifer',
    localHelperCity: 'Houston, TX',
  });

  const handleQuickLoadMaria = async () => {
    setSubmitting(true);
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
    } catch (err: any) {
      alert('Error: ' + err.message);
      setSubmitting(false);
    }
  };

  const handleSubmitCustom = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success && data.caseId) {
        router.push(`/plan/${data.caseId}`);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-100 flex flex-col">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8 w-full flex-1 flex flex-col justify-center">
        {/* Top Banner / Preset Quick Load */}
        <div className="mb-6 bg-brand-50 border border-brand-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-brand-800 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-brand-950">Testing Maria&apos;s Scenario?</p>
              <p className="text-[11px] text-brand-800">1-click create Maria post-hospital transition case</p>
            </div>
          </div>
          <button
            onClick={handleQuickLoadMaria}
            disabled={submitting}
            className="bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-xs transition flex-shrink-0"
          >
            Load Maria Scenario
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-2">
            <span>Step {step} of 4</span>
            <span>
              {step === 1 && 'Senior & Situation'}
              {step === 2 && 'Safety & Housing'}
              {step === 3 && 'Timeline & Budget'}
              {step === 4 && 'Family & Coordination'}
            </span>
          </div>
          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-900 h-full transition-all duration-300 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Wizard Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200/80">
          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-serif font-bold text-brand-950 mb-2">
                What&apos;s happening with your parent?
              </h2>
              <p className="text-sm text-stone-600 mb-6">
                Tell us about your parent and their immediate situation.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Parent&apos;s Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.seniorName}
                    onChange={(e) => setFormData({ ...formData, seniorName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-700 text-sm font-medium"
                    placeholder="e.g. Maria Thompson"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Age
                    </label>
                    <input
                      type="text"
                      value={formData.ageRange}
                      onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-700 text-sm font-medium"
                      placeholder="e.g. 78"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Lives Alone?
                    </label>
                    <select
                      value={formData.livesAlone ? 'yes' : 'no'}
                      onChange={(e) => setFormData({ ...formData, livesAlone: e.target.value === 'yes' })}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-700 text-sm font-medium bg-white"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Primary Situation
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'POST_HOSPITAL', label: 'Post-Hospital Discharge', desc: 'Transition following recent hospital stay or fall', status: 'Available' },
                      { id: 'PLANNED_DOWNSIZE', label: 'Planned Downsize', desc: 'Moving to smaller residence within several months', status: 'Coming Soon' },
                      { id: 'AGE_IN_PLACE', label: 'Age in Place', desc: 'Home modifications to remain safely at home', status: 'Coming Soon' },
                      { id: 'EMERGENCY_DISPLACEMENT', label: 'Emergency Displacement', desc: 'Sudden displacement due to emergency', status: 'Coming Soon' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        disabled={type.status !== 'Available'}
                        onClick={() => setFormData({ ...formData, transitionType: type.id })}
                        className={`p-3.5 rounded-2xl border text-left transition ${
                          formData.transitionType === type.id
                            ? 'border-brand-900 bg-brand-50/60 ring-2 ring-brand-900/20'
                            : type.status === 'Available'
                            ? 'border-stone-200 hover:border-stone-300 bg-white'
                            : 'border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-bold text-sm text-stone-900">{type.label}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            type.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                          }`}>
                            {type.status}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 leading-tight mt-0.5">{type.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-serif font-bold text-brand-950 mb-2">
                Safety &amp; Housing Details
              </h2>
              <p className="text-sm text-stone-600 mb-6">
                Understand mobility, stairs, and current home configuration.
              </p>

              <div className="space-y-4">
                {formData.transitionType === 'POST_HOSPITAL' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Expected Hospital Discharge Date
                    </label>
                    <input
                      type="date"
                      value={formData.dischargeDate}
                      onChange={(e) => setFormData({ ...formData, dischargeDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-700 text-sm font-medium"
                    />
                    <p className="text-[11px] text-stone-500 mt-1">Discharge in ~5 days triggers Urgent planning priorities.</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-700 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Current Home Type
                    </label>
                    <select
                      value={formData.homeType}
                      onChange={(e) => setFormData({ ...formData, homeType: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-700 text-sm font-medium bg-white"
                    >
                      <option value="Two-story house">Two-story house</option>
                      <option value="Single-story house">Single-story house</option>
                      <option value="Apartment / Condo">Apartment / Condo</option>
                      <option value="Assisted Living Facility">Assisted Living Facility</option>
                      <option value="Other / Senior Housing">Other / Senior Housing</option>
                    </select>
                  </div>
                </div>

                <div className="bg-sand-50 p-4 rounded-2xl border border-sand-300 space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.stairsConstraint}
                      onChange={(e) => setFormData({ ...formData, stairsConstraint: e.target.checked })}
                      className="w-4 h-4 text-brand-900 rounded focus:ring-brand-700"
                    />
                    <div>
                      <span className="text-sm font-bold text-stone-900 block">Stairs Constraint</span>
                      <span className="text-xs text-stone-500 block">Parent cannot safely navigate stairs (e.g. 2-story home)</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.mobilityConstraint}
                      onChange={(e) => setFormData({ ...formData, mobilityConstraint: e.target.checked })}
                      className="w-4 h-4 text-brand-900 rounded focus:ring-brand-700"
                    />
                    <div>
                      <span className="text-sm font-bold text-stone-900 block">Mobility Limits</span>
                      <span className="text-xs text-stone-500 block">Uses walker/cane or needs assistance</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-serif font-bold text-brand-950 mb-2">
                Timeline &amp; Budget
              </h2>
              <p className="text-sm text-stone-600 mb-6">
                Set realistic targets for move completion and available funds.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Target Transition Date
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-700 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Approximate Transition Budget ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-stone-400 font-bold">$</span>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-700 text-sm font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">Covers moving services, packing, home prep, and cleaning.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-serif font-bold text-brand-950 mb-2">
                Family &amp; Coordination
              </h2>
              <p className="text-sm text-stone-600 mb-6">
                Who will be involved in coordinating this transition?
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-sand-50 rounded-2xl border border-sand-300">
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-800 mb-2">Primary Coordinator (You)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.userName}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      placeholder="Your name"
                      className="px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-medium"
                    />
                    <input
                      type="text"
                      value={formData.userCity}
                      onChange={(e) => setFormData({ ...formData, userCity: e.target.value })}
                      placeholder="Your city"
                      className="px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="p-4 bg-sand-50 rounded-2xl border border-sand-300">
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-800 mb-2">Local Helper / Support</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.localHelperName}
                      onChange={(e) => setFormData({ ...formData, localHelperName: e.target.value })}
                      placeholder="Helper name"
                      className="px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-medium"
                    />
                    <input
                      type="text"
                      value={formData.localHelperCity}
                      onChange={(e) => setFormData({ ...formData, localHelperCity: e.target.value })}
                      placeholder="Helper city"
                      className="px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between pt-4 border-t border-stone-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center space-x-1.5 text-stone-600 hover:text-stone-900 font-semibold text-sm px-4 py-2.5 rounded-xl transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div></div>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center space-x-2 bg-brand-900 hover:bg-brand-800 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-md transition"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitCustom}
                disabled={submitting}
                className="flex items-center space-x-2 bg-brand-900 hover:bg-brand-800 text-white font-bold text-sm px-7 py-3 rounded-2xl shadow-md transition disabled:opacity-50"
              >
                {submitting ? (
                  <span>Generating Plan...</span>
                ) : (
                  <>
                    <span>Generate Transition Plan</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
