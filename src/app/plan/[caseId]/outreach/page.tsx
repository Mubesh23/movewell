'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Send, Sparkles, Copy, Check, Clock, ShieldCheck, X, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function OutreachPage() {
  const params = useParams();
  const caseId = (params.caseId as string) || '';

  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [seniorName, setSeniorName] = useState('Family Member');
  const [coordinatorName, setCoordinatorName] = useState('Family Transition Coordinator');
  const [serviceType, setServiceType] = useState('Senior Mover & Downsizing Crew');
  const [targetZip, setTargetZip] = useState('');
  const [targetDate, setTargetDate] = useState('Within 5–7 days');
  const [logistics, setLogistics] = useState('2-bedroom single-story transition to assisted living apartment; 1 flight of stairs at current home.');

  React.useEffect(() => {
    if (caseId) {
      fetch(`/api/cases/${caseId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data) {
            if (data.data.seniorProfile?.name) setSeniorName(data.data.seniorProfile.name);
            if (data.data.caseData?.zipCode && data.data.caseData.zipCode !== 'UNSET') {
              setTargetZip(data.data.caseData.zipCode);
            }
            if (data.data.caseData?.targetDate) {
              setTargetDate(new Date(data.data.caseData.targetDate).toLocaleDateString());
            }
          }
        })
        .catch(() => {});
    }
  }, [caseId]);

  const sampleDraftMessage = `Hello,

I am coordinating the transition for ${seniorName}${targetZip ? ` (ZIP ${targetZip})` : ''}. We are seeking availability and binding pricing for: ${serviceType}.

Target Timeline: ${targetDate}
Logistics: ${logistics}

Could you please confirm:
1. Availability for our target timeframe?
2. Estimated cost or standard rate breakdown (hourly rate, crew size, minimums)?
3. What is included in your standard fee (packing blankets, disassembly, travel)?
4. Any potential additional fees (stair carry, heavy items, cancellation policy)?

Thank you for your time and guidance,
${coordinatorName}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleDraftMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <WorkspaceShell caseId={caseId}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e1e9e3] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#183331]">
                Provider Outreach & Quote Preparation
              </h1>
              <span className="text-[11px] font-semibold tracking-wider text-[#9aa9a3] uppercase bg-[#edf2ee] px-2 py-0.5 rounded-full">
                Coming soon
              </span>
            </div>
            <p className="mt-1 text-sm text-[#71847d]">
              Prepare clear, standardized inquiries for Harris County providers without unsolicited spam or phone tag.
            </p>
          </div>

          <Button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#1f4d45] hover:bg-[#153c36] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs shrink-0"
          >
            <Sparkles size={16} className="text-[#c8e1ce]" />
            <span>Prepare outreach</span>
          </Button>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-[#e1e9e3] bg-white p-5 shadow-xs">
            <div className="grid size-10 place-items-center rounded-xl bg-[#e8f1ea] text-[#1f4d45] mb-3">
              <Sparkles size={20} />
            </div>
            <h2 className="text-base font-semibold text-[#183331]">Standardized Questions</h2>
            <p className="mt-2 text-xs leading-5 text-[#71847d]">
              Asks the 4 critical questions: current availability, all-in cost breakdown, included services, and surprise extra fees.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e1e9e3] bg-white p-5 shadow-xs">
            <div className="grid size-10 place-items-center rounded-xl bg-[#e8f1ea] text-[#1f4d45] mb-3">
              <Clock size={20} />
            </div>
            <h2 className="text-base font-semibold text-[#183331]">Response Tracking</h2>
            <p className="mt-2 text-xs leading-5 text-[#71847d]">
              Compare turnaround dates, upload quotes into your budget, and replace planning estimates with firm numbers.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e1e9e3] bg-white p-5 shadow-xs">
            <div className="grid size-10 place-items-center rounded-xl bg-[#e8f1ea] text-[#1f4d45] mb-3">
              <ShieldCheck size={20} />
            </div>
            <h2 className="text-base font-semibold text-[#183331]">Zero Autonomous Calls</h2>
            <p className="mt-2 text-xs leading-5 text-[#71847d]">
              No AI bots calling on your behalf. You review, copy, and send inquiries directly through your family email or provider contact forms.
            </p>
          </div>
        </div>

        {/* Privacy & Transparency Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#dcebe0] bg-[#f4f8f5] p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1f4d45] mb-2.5">
              <Eye size={15} />
              <span>Information Shared With Providers</span>
            </div>
            <ul className="space-y-1.5 text-xs text-[#446356]">
              <li className="flex items-center gap-1.5">
                <Check size={13} className="text-[#1f4d45]" />
                <span>General neighborhood / ZIP code ({targetZip})</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={13} className="text-[#1f4d45]" />
                <span>Target transition timeline ({targetDate})</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={13} className="text-[#1f4d45]" />
                <span>Logistics scope (stairs, room count, item categories)</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#fadcd5] bg-[#fff6f4] p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9b3b2b] mb-2.5">
              <EyeOff size={15} />
              <span>Information NOT Shared</span>
            </div>
            <ul className="space-y-1.5 text-xs text-[#7e392c]">
              <li className="flex items-center gap-1.5">
                <span className="font-bold">&times;</span>
                <span>No private medical records or diagnostic details</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="font-bold">&times;</span>
                <span>No family financial accounts or budget ceilings</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="font-bold">&times;</span>
                <span>No exact home address until you confirm a provider</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Prepare Outreach Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-[#e1e9e3] animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-[#e8f1ea] text-[#1f4d45]">
                  <Send size={16} />
                </span>
                <h3 className="text-base font-bold text-[#183331]">Prepare Outreach Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-[#9aa9a3] hover:bg-[#f0f4f1] hover:text-[#183331]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#183331] mb-1">
                    Service Requested
                  </label>
                  <input
                    type="text"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full rounded-xl border border-[#cbdcd0] px-3 py-2 text-xs text-[#183331] focus:border-[#1f4d45] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#183331] mb-1">
                    Case ZIP Code
                  </label>
                  <input
                    type="text"
                    value={targetZip}
                    onChange={(e) => setTargetZip(e.target.value)}
                    className="w-full rounded-xl border border-[#cbdcd0] px-3 py-2 text-xs text-[#183331] focus:border-[#1f4d45] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183331] mb-1">
                  Target Timing
                </label>
                <input
                  type="text"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-xl border border-[#cbdcd0] px-3 py-2 text-xs text-[#183331] focus:border-[#1f4d45] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183331] mb-1">
                  Logistics & Home Scope
                </label>
                <textarea
                  rows={2}
                  value={logistics}
                  onChange={(e) => setLogistics(e.target.value)}
                  className="w-full rounded-xl border border-[#cbdcd0] px-3 py-2 text-xs text-[#183331] focus:border-[#1f4d45] focus:outline-none"
                />
              </div>

              <div className="rounded-xl bg-[#fafbfa] border border-[#e1e9e3] p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#71847d]">
                    Formatted Inquiry Request
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1f4d45] hover:text-[#153c36]"
                  >
                    {copied ? <Check size={14} className="text-[#3f6c5c]" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy request'}</span>
                  </button>
                </div>
                <pre className="text-xs text-[#4a5f57] font-sans whitespace-pre-wrap leading-relaxed select-all bg-white p-3 rounded-lg border border-[#e8eee9]">
                  {sampleDraftMessage}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5 border-t border-[#edf2ee] pt-3">
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="text-xs font-semibold"
              >
                Close
              </Button>
              <Button
                onClick={handleCopy}
                className="bg-[#1f4d45] hover:bg-[#153c36] text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied to clipboard' : 'Copy request'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
