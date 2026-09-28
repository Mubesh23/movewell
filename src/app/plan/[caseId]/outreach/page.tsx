'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { Send, Sparkles, Copy, Check, Clock, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function OutreachPage() {
  const params = useParams();
  const caseId = (params.caseId as string) || '';

  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [serviceType, setServiceType] = useState('Home Care Aide');
  const [notes, setNotes] = useState('Looking for morning assistance with mobility and meal prep starting around discharge.');

  const sampleDraftMessage = `Hello, I am coordinating the post-hospital discharge transition for my family member in Houston, TX (ZIP 77004). Target start date is in approximately 7 days. We are seeking availability for: ${serviceType}. Additional notes: ${notes}`;

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
                AI-Assisted Provider Outreach
              </h1>
              <span className="text-[11px] font-semibold tracking-wider text-[#9aa9a3] uppercase bg-[#edf2ee] px-2 py-0.5 rounded-full">
                Coming soon
              </span>
            </div>
            <p className="mt-1 text-sm text-[#71847d]">
              Prepare clear inquiry drafts for local home health agencies, rehab facilities, and movers without endless phone calls.
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
            <h2 className="text-base font-semibold text-[#183331]">Standardized Inquiries</h2>
            <p className="mt-2 text-xs leading-5 text-[#71847d]">
              Nora formats your loved one&apos;s non-clinical logistics (ZIP, target timeline, requested schedule) into concise inquiries.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e1e9e3] bg-white p-5 shadow-xs">
            <div className="grid size-10 place-items-center rounded-xl bg-[#e8f1ea] text-[#1f4d45] mb-3">
              <Clock size={20} />
            </div>
            <h2 className="text-base font-semibold text-[#183331]">Response Tracking</h2>
            <p className="mt-2 text-xs leading-5 text-[#71847d]">
              Track who has replied, compare estimated turnaround dates, and centralize notes in one family view.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e1e9e3] bg-white p-5 shadow-xs">
            <div className="grid size-10 place-items-center rounded-xl bg-[#e8f1ea] text-[#1f4d45] mb-3">
              <ShieldCheck size={20} />
            </div>
            <h2 className="text-base font-semibold text-[#183331]">You Stay in Control</h2>
            <p className="mt-2 text-xs leading-5 text-[#71847d]">
              No automated bots calling on your behalf without permission. Every inquiry is reviewed and sent by you.
            </p>
          </div>
        </div>

        {/* Banner */}
        <div className="rounded-2xl bg-[#f1f6f1] border border-[#d6e5d8] p-5">
          <div className="flex items-start gap-3">
            <Send size={18} className="text-[#1f4d45] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-[#183331]">Early Preview Mode</h3>
              <p className="mt-1 text-xs text-[#527063] leading-relaxed">
                Direct integration with provider directories and outbound email dispatch is currently in development. You can prepare and copy inquiry templates right now to paste into email or contact forms.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Prepare Outreach Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-[#e1e9e3] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-[#e8f1ea] text-[#1f4d45]">
                  <Send size={16} />
                </span>
                <h3 className="text-base font-bold text-[#183331]">Prepare Outreach Message</h3>
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
              <div>
                <label className="block text-xs font-semibold text-[#183331] mb-1">
                  Service Requested
                </label>
                <input
                  type="text"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full rounded-xl border border-[#cbdcd0] px-3.5 py-2 text-sm text-[#183331] focus:border-[#1f4d45] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#183331] mb-1">
                  Family Notes / Specific Requests
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-[#cbdcd0] px-3.5 py-2 text-sm text-[#183331] focus:border-[#1f4d45] focus:outline-none"
                />
              </div>

              <div className="rounded-xl bg-[#fafbfa] border border-[#e1e9e3] p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#71847d]">
                    Generated Inquiry Draft
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1f4d45] hover:text-[#153c36]"
                  >
                    {copied ? <Check size={14} className="text-[#3f6c5c]" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy message'}</span>
                  </button>
                </div>
                <p className="text-xs text-[#4a5f57] font-mono leading-relaxed select-all">
                  {sampleDraftMessage}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="text-xs font-semibold"
              >
                Close
              </Button>
              <Button
                onClick={handleCopy}
                className="bg-[#1f4d45] hover:bg-[#153c36] text-white text-xs font-semibold"
              >
                {copied ? 'Copied to clipboard' : 'Copy message'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
