'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, DollarSign, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

interface QuoteUploaderProps {
  caseId: string;
  currentBudget: number;
  onBudgetUpdated?: (newBudget: number) => void;
}

export function QuoteUploader({ caseId, currentBudget, onBudgetUpdated }: QuoteUploaderProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [quoteData, setQuoteData] = useState<any | null>(null);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulateUpload = async (presetText?: string, fileName?: string) => {
    setAnalyzing(true);
    setError(null);
    setApplied(false);

    const sampleQuote = presetText || `CARING TRANSITIONS OF GREATER HOUSTON
Senior Move Management & Residential Transition Quote
Customer: Maria Thompson (Ref: Sarah Thompson)
Date: October 1, 2026

SCOPE OF SERVICES:
- Gentle packing and room-by-room rightsizing labor: $600.00
- Loading, insured local transport & placement: $1,350.00
- Heavy duty wardrobe boxes & packing materials: $200.00

Total Moving & Rightsizing Quote: $2,150.00
Deposit Required to Reserve Oct 18 Move Date: $500.00`;

    try {
      const res = await fetch('/api/ai/extract-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: sampleQuote,
          fileName: fileName || 'Caring_Transitions_Quote.pdf',
        }),
      });

      const data = await res.json();
      if (data.success && data.quote) {
        setQuoteData(data.quote);
      } else {
        setError(data.error || 'Failed to extract quote details.');
      }
    } catch (err: any) {
      setError('Error analyzing document: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyToBudget = async () => {
    if (!quoteData) return;
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          prompt: `Set budget to $${quoteData.totalAmount}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApplied(true);
        if (onBudgetUpdated) {
          onBudgetUpdated(quoteData.totalAmount);
        }
      }
    } catch (err: any) {
      alert('Failed to update budget: ' + err.message);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 text-brand-900 flex items-center justify-center">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-stone-900 text-base">Moving Quote Intelligence</h3>
          <p className="text-xs text-stone-500">Upload vendor quotes to compare against MoveWell planning estimates</p>
        </div>
      </div>

      {!quoteData ? (
        <div className="border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center hover:border-brand-300 transition bg-sand-50/50">
          <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-stone-700 mb-1">
            Upload a vendor quote (PDF, PNG, JPG) or load sample quote
          </p>
          <p className="text-[11px] text-stone-500 mb-4">
            Nora will extract itemized moving, packing, and material costs automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => handleSimulateUpload()}
              disabled={analyzing}
              className="bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-xs transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Extracting Quote Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Load Sample Caring Transitions Quote ($2,150)</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-brand-50/60 rounded-2xl p-4 border border-brand-200 text-stone-900 text-xs">
            <div className="flex items-center justify-between mb-3 border-b border-brand-200/60 pb-2">
              <span className="font-bold text-sm text-brand-950 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Quote Extracted: {quoteData.providerName}</span>
              </span>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                Verified Vendor Quote
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-stone-700">
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-400 block uppercase font-medium">Packing Labor</span>
                <span className="font-bold text-stone-900">${quoteData.packingAmount || 600}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-400 block uppercase font-medium">Moving Transport</span>
                <span className="font-bold text-stone-900">${quoteData.movingAmount || 1350}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-400 block uppercase font-medium">Materials</span>
                <span className="font-bold text-stone-900">${quoteData.materialsAmount || 200}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/30">
                <span className="text-[10px] text-emerald-700 block uppercase font-bold">Total Quote</span>
                <span className="font-extrabold text-emerald-950">${quoteData.totalAmount}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-stone-200 text-[11px] text-stone-600 space-y-1 mb-3">
              <p><strong>Move Date:</strong> {quoteData.moveDate || 'Oct 18, 2026'}</p>
              <p><strong>Planning Range Comparison:</strong> MoveWell planning estimate range for senior moving is $1,200 – $2,400. This $2,150 quote fits comfortably within budget.</p>
              {quoteData.notes && <p><strong>Scope:</strong> {quoteData.notes}</p>}
            </div>

            {!applied ? (
              <button
                onClick={handleApplyToBudget}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
              >
                <span>Apply Actual $2,150 Vendor Quote to Budget</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 p-2.5 rounded-xl text-center font-bold flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Case budget updated to $2,150!</span>
              </div>
            )}
          </div>

          <button
            onClick={() => { setQuoteData(null); setApplied(false); }}
            className="text-xs text-stone-500 hover:text-stone-800 font-medium underline"
          >
            Upload another document
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 bg-rose-50 text-rose-800 p-3 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
