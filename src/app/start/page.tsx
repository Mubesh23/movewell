'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { ArrowRight, ArrowLeft, Check, Sparkles, AlertCircle } from 'lucide-react';
import { formatLocalDateYYYYMMDD } from '@/types';
import { BRAND_NAME } from '@/lib/brand';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Progress } from '@/components/ui/Progress';

export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const dDischarge = new Date(now);
  dDischarge.setDate(dDischarge.getDate() + 5);
  const defaultDischarge = formatLocalDateYYYYMMDD(dDischarge);

  const dTarget = new Date(now);
  dTarget.setDate(dTarget.getDate() + 12);
  const defaultTarget = formatLocalDateYYYYMMDD(dTarget);

  // Generic neutral defaults (Maria demo values removed from standard form initialization)
  const [formData, setFormData] = useState({
    seniorName: '',
    ageRange: '',
    livesAlone: true,
    transitionType: 'POST_HOSPITAL',
    dischargeDate: defaultDischarge,
    stairsConstraint: false,
    mobilityConstraint: false,
    zipCode: '',
    homeType: 'Single-story house',
    ownsHome: true,
    destinationStatus: 'UNDECIDED',
    targetDate: defaultTarget,
    budget: 8000,
    userName: '',
    userCity: '',
    localHelperName: '',
    localHelperCity: '',
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

  const handlePopulateMariaDemo = () => {
    setFormData({
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
  };

  const handleSubmitCustom = async () => {
    if (!formData.seniorName.trim()) {
      alert('Please provide your parent or senior’s name.');
      setStep(1);
      return;
    }

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
      } else {
        alert('Failed to create plan: ' + data.error);
        setSubmitting(false);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between text-charcoal">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 w-full flex-1 flex flex-col justify-center">
        {/* Clearly Separated Demo Option */}
        <div className="mb-6 bg-surface border border-stone-line rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div>
            <p className="text-xs font-semibold text-charcoal">
              Exploring {BRAND_NAME} for the first time?
            </p>
            <p className="text-xs text-muted">
              Pre-fill with Maria Thompson&apos;s demo situation ($8,000 budget, 5-day discharge).
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePopulateMariaDemo}
              className="text-xs"
            >
              Fill form
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              isLoading={submitting}
              onClick={handleQuickLoadMaria}
              className="text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              1-click demo
            </Button>
          </div>
        </div>

        {/* Quiet Progress Bar */}
        <div className="mb-6 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-semibold text-charcoal">Step {step} of 4</span>
            <span>
              {step === 1 && 'Senior & Situation'}
              {step === 2 && 'Safety & Housing'}
              {step === 3 && 'Timeline & Budget'}
              {step === 4 && 'Family & Coordination'}
            </span>
          </div>
          <Progress value={(step / 4) * 100} className="h-1" />
        </div>

        {/* Wizard Form Surface */}
        <div className="bg-surface rounded-xl p-6 sm:p-8 border border-stone-line shadow-2xs">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-semibold text-[#183331] tracking-[-0.04em]">
                  Who are you helping transition?
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Basic details about your parent or family member to organize their plan.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                    Parent / Senior Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.seniorName}
                    onChange={(e) => setFormData({ ...formData, seniorName: e.target.value })}
                    placeholder="e.g. Robert Smith"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Age
                    </label>
                    <Input
                      type="text"
                      value={formData.ageRange}
                      onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                      placeholder="e.g. 78"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Lives Alone?
                    </label>
                    <Select
                      value={formData.livesAlone ? 'yes' : 'no'}
                      onChange={(e) => setFormData({ ...formData, livesAlone: e.target.value === 'yes' })}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                    Primary Transition Context
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: 'POST_HOSPITAL', label: 'Post-Hospital Discharge', desc: 'Transition following recent hospital stay or fall', status: 'Available' },
                      { id: 'PLANNED_DOWNSIZE', label: 'Planned Downsize', desc: 'Moving to smaller residence within several months', status: 'Coming Soon' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        disabled={type.status !== 'Available'}
                        onClick={() => setFormData({ ...formData, transitionType: type.id })}
                        className={`p-3.5 rounded-lg border text-left transition-all ${
                          formData.transitionType === type.id
                            ? 'border-forest bg-forest/5 ring-1 ring-forest'
                            : 'border-stone-line bg-surface hover:border-stone-warm'
                        }`}
                      >
                        <p className="font-semibold text-sm text-charcoal">{type.label}</p>
                        <p className="text-xs text-muted mt-0.5 leading-snug">{type.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-semibold text-[#183331] tracking-[-0.04em]">
                  Safety &amp; Housing Situation
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Understand home mobility constraints and discharge timelines.
                </p>
              </div>

              <div className="space-y-4">
                {formData.transitionType === 'POST_HOSPITAL' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Expected Hospital Discharge Date
                    </label>
                    <Input
                      type="date"
                      value={formData.dischargeDate}
                      onChange={(e) => setFormData({ ...formData, dischargeDate: e.target.value })}
                    />
                    <p className="text-xs text-muted mt-1">Discharge in ~5 days sets priority attention flags.</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                      ZIP Code (Current Home)
                    </label>
                    <Input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder="e.g. 77004"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Home Type
                    </label>
                    <Select
                      value={formData.homeType}
                      onChange={(e) => setFormData({ ...formData, homeType: e.target.value })}
                    >
                      <option value="Two-story house">Two-story house</option>
                      <option value="Single-story house">Single-story house</option>
                      <option value="Apartment / Condo">Apartment / Condo</option>
                      <option value="Assisted Living">Assisted Living</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-stone-line bg-canvas/60 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.stairsConstraint}
                      onChange={(e) => setFormData({ ...formData, stairsConstraint: e.target.checked })}
                      className="mt-0.5 w-4 h-4 text-forest rounded border-stone-line focus:ring-forest"
                    />
                    <div>
                      <span className="text-sm font-semibold text-charcoal block">Stairs Hazard</span>
                      <span className="text-xs text-muted block">Parent cannot safely use stairs (requires single-floor living or ramps)</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.mobilityConstraint}
                      onChange={(e) => setFormData({ ...formData, mobilityConstraint: e.target.checked })}
                      className="mt-0.5 w-4 h-4 text-forest rounded border-stone-line focus:ring-forest"
                    />
                    <div>
                      <span className="text-sm font-semibold text-charcoal block">Mobility Support Needed</span>
                      <span className="text-xs text-muted block">Uses walker, wheelchair, or assistance for daily activities</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-semibold text-[#183331] tracking-[-0.04em]">
                  Timeline &amp; Available Budget
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {BRAND_NAME} will compare expected transition expenses against your family budget.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                    Target Transition Date
                  </label>
                  <Input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                    Family Available Budget ($)
                  </label>
                  <Input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    placeholder="8000"
                  />
                  <p className="text-xs text-muted mt-1">
                    Total funds allocated for moving, packing, home prep, and cleanout.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-semibold text-[#183331] tracking-[-0.04em]">
                  Family Team &amp; Roles
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Identify who is helping coordinate from nearby or remotely.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-stone-line bg-canvas/60 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Primary Coordinator (You)
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Input
                      type="text"
                      value={formData.userName}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      placeholder="Your name"
                    />
                    <Input
                      type="text"
                      value={formData.userCity}
                      onChange={(e) => setFormData({ ...formData, userCity: e.target.value })}
                      placeholder="Your city (e.g. Chicago, IL)"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-stone-line bg-canvas/60 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Local Helper / Support (Optional)
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Input
                      type="text"
                      value={formData.localHelperName}
                      onChange={(e) => setFormData({ ...formData, localHelperName: e.target.value })}
                      placeholder="Helper name"
                    />
                    <Input
                      type="text"
                      value={formData.localHelperCity}
                      onChange={(e) => setFormData({ ...formData, localHelperCity: e.target.value })}
                      placeholder="Helper city (e.g. Houston, TX)"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation */}
          <div className="mt-8 flex items-center justify-between pt-5 border-t border-stone-line">
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="default"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={() => {
                  if (step === 1 && !formData.seniorName.trim()) {
                    alert('Please enter your parent or senior’s name.');
                    return;
                  }
                  setStep(step + 1);
                }}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                size="default"
                isLoading={submitting}
                onClick={handleSubmitCustom}
              >
                <span>Generate Transition Plan</span>
                <Check className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-stone-line py-6 text-center text-xs text-muted">
        {BRAND_NAME} &bull; A calmer path forward for senior housing transitions
      </footer>
    </div>
  );
}
