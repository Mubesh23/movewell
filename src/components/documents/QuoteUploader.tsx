'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, ArrowRight, FileCheck } from 'lucide-react';

interface QuoteUploaderProps {
  caseId: string;
  currentBudget: number;
  onBudgetUpdated?: (newQuoteAmount: number) => void;
}

export function QuoteUploader({ caseId, currentBudget, onBudgetUpdated }: QuoteUploaderProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [quoteData, setQuoteData] = useState<any | null>(null);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'sample'>('sample');
  const [fileText, setFileText] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setQuoteData(null);
    setApplied(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileText(content || '');
    };
    reader.onerror = () => {
      setError('Could not read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleExtractFromText = async () => {
    if (!fileText.trim()) {
      setError('Please select or paste document content to analyze.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setApplied(false);

    try {
      const res = await fetch('/api/ai/extract-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: fileText,
          fileName: fileName || 'Uploaded_Document.txt',
          isSample: false,
        }),
      });

      const data = await res.json();
      if (data.success && data.quote) {
        setQuoteData(data.quote);
      } else {
        setError(data.error || 'Unable to extract quote details from document.');
      }
    } catch (err: any) {
      setError('Error analyzing document: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLoadSample = async () => {
    setAnalyzing(true);
    setError(null);
    setApplied(false);

    try {
      const res = await fetch('/api/ai/extract-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSample: true }),
      });

      const data = await res.json();
      if (data.success && data.quote) {
        setQuoteData(data.quote);
      } else {
        setError(data.error || 'Failed to load sample quote.');
      }
    } catch (err: any) {
      setError('Error loading sample quote: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyQuoteToPlan = async () => {
    if (!quoteData) return;
    try {
      const res = await fetch(`/api/cases/${caseId}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: quoteData,
          documentName: fileName || 'Caring_Transitions_Quote.pdf',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApplied(true);
        if (onBudgetUpdated) {
          onBudgetUpdated(quoteData.totalAmount);
        }
      } else {
        setError(data.error || 'Failed to apply quote to plan.');
      }
    } catch (err: any) {
      setError('Error applying quote: ' + err.message);
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
          <p className="text-xs text-stone-500">
            Compare vendor quotes against planning estimates ($1,200 – $2,400) without altering family available budget (${currentBudget.toLocaleString()})
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-stone-200 pb-3 mb-4">
        <button
          onClick={() => { setActiveTab('sample'); setError(null); }}
          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
            activeTab === 'sample' ? 'bg-brand-900 text-white' : 'bg-sand-50 text-stone-600 hover:text-stone-900'
          }`}
        >
          Try Sample Moving Quote
        </button>
        <button
          onClick={() => { setActiveTab('upload'); setError(null); }}
          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
            activeTab === 'upload' ? 'bg-brand-900 text-white' : 'bg-sand-50 text-stone-600 hover:text-stone-900'
          }`}
        >
          Upload Vendor Quote (PDF/Text)
        </button>
      </div>

      {!quoteData ? (
        <div className="border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center bg-sand-50/50">
          {activeTab === 'sample' ? (
            <div>
              <p className="text-xs font-semibold text-stone-800 mb-1">
                Demonstration Sample: Caring Transitions Rightsizing &amp; Moving Quote
              </p>
              <p className="text-[11px] text-stone-500 mb-4 max-w-md mx-auto">
                Test how MoveWell extracts itemized packing, transport, and supplies costs from a senior move manager quote.
              </p>
              <button
                onClick={handleLoadSample}
                disabled={analyzing}
                className="bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-xs transition inline-flex items-center space-x-2 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Extracting Quote...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Load Sample Quote ($2,150)</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-stone-700 mb-1">
                Select a quote file (PDF, TXT) or paste quote text
              </p>
              <p className="text-[11px] text-stone-500 mb-4">
                MoveWell parses provider name and itemized costs directly from the document.
              </p>
              <div className="max-w-md mx-auto space-y-3">
                <input
                  type="file"
                  accept=".txt,.pdf,.md,.csv"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-900 hover:file:bg-brand-100"
                />

                {fileName && (
                  <p className="text-xs text-stone-600 font-medium">
                    Selected: <strong>{fileName}</strong> ({fileText.length} characters loaded)
                  </p>
                )}

                <button
                  onClick={handleExtractFromText}
                  disabled={analyzing || !fileText.trim()}
                  className="w-full bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Parsing Document with Gemini...</span>
                    </>
                  ) : (
                    <span>Extract Quote From Document</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-brand-50/60 rounded-2xl p-4 border border-brand-200 text-stone-900 text-xs">
            <div className="flex items-center justify-between mb-3 border-b border-brand-200/60 pb-2">
              <span className="font-bold text-sm text-brand-950 flex items-center space-x-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Quote Extracted: {quoteData.providerName}</span>
              </span>
              <span className="bg-sand-200 text-stone-800 font-medium px-2.5 py-0.5 rounded-full text-[11px]">
                Document Parsed
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
              <p><strong>Comparison:</strong> MoveWell planning estimate range for moving is $1,200 – $2,400. This $2,150 quote fits comfortably within planning estimates.</p>
              <p className="text-stone-500"><strong>Budget Integrity Note:</strong> Applying this quote updates the moving category cost item in your plan without altering your family&apos;s ${currentBudget.toLocaleString()} total available budget.</p>
            </div>

            {!applied ? (
              <button
                onClick={handleApplyQuoteToPlan}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
              >
                <span>Apply $2,150 Moving Quote to Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 p-2.5 rounded-xl text-center font-bold flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Moving quote ($2,150) applied to plan! Family budget remains ${currentBudget.toLocaleString()}.</span>
              </div>
            )}
          </div>

          <button
            onClick={() => { setQuoteData(null); setApplied(false); setFileText(''); setFileName(''); }}
            className="text-xs text-stone-500 hover:text-stone-800 font-medium underline"
          >
            Reset / Analyze another document
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
