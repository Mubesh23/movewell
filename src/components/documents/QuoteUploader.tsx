'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, ArrowRight, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { BRAND_NAME } from '@/lib/brand';

interface QuoteUploaderProps {
  caseId: string;
  currentBudget?: number;
  onBudgetUpdated?: (newQuoteAmount: number) => void;
}

export function QuoteUploader({ caseId, currentBudget, onBudgetUpdated }: QuoteUploaderProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [quoteData, setQuoteData] = useState<any | null>(null);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'sample' | 'text'>('sample');
  const [pastedText, setPastedText] = useState('');
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
      setPastedText(content || '');
    };
    reader.onerror = () => {
      setError('Could not read the selected text document.');
    };
    reader.readAsText(file);
  };

  const handleExtractFromText = async () => {
    if (!pastedText.trim()) {
      setError('Please paste or upload document text to extract costs.');
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
          documentText: pastedText,
          fileName: fileName || 'Vendor_Quote.txt',
          isSample: false,
        }),
      });

      const data = await res.json();
      if (data.success && data.quote) {
        setQuoteData(data.quote);
      } else {
        setError(data.error || 'Unable to extract structured quote details.');
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
        setFileName('Caring_Transitions_Houston_Quote.txt');
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
          documentName: fileName || 'Caring_Transitions_Houston_Quote.txt',
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
    <div className="rounded-xl border border-stone-line bg-surface p-6 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-stone-line/70 pb-3">
        <div>
          <h3 className="font-semibold text-lg text-[#183331] tracking-[-0.03em]">
            Vendor Quote Intelligence
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Substitute confirmed vendor prices for planning estimates without modifying total available budget{currentBudget ? ` ($${currentBudget.toLocaleString()})` : ''}.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => { setMode('sample'); setError(null); }}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
              mode === 'sample'
                ? 'bg-forest text-surface font-semibold'
                : 'text-muted hover:text-charcoal bg-stone-subtle/60'
            }`}
          >
            Try Sample Quote
          </button>
          <button
            type="button"
            onClick={() => { setMode('text'); setError(null); }}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
              mode === 'text'
                ? 'bg-forest text-surface font-semibold'
                : 'text-muted hover:text-charcoal bg-stone-subtle/60'
            }`}
          >
            Paste or Upload Text
          </button>
        </div>
      </div>

      {!quoteData ? (
        <div className="rounded-lg border border-dashed border-stone-line p-6 text-center bg-canvas/40 space-y-3">
          {mode === 'sample' ? (
            <div className="space-y-3 max-w-md mx-auto">
              <div>
                <p className="text-sm font-semibold text-charcoal">
                  Demonstration Quote: Caring Transitions of Greater Houston
                </p>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Test how {BRAND_NAME} extracts rightsizing, packing, transport, and supplies itemizations ($2,150) and replaces the estimated moving range ($1,200–$2,400).
                </p>
              </div>

              <Button
                type="button"
                variant="default"
                size="default"
                isLoading={analyzing}
                onClick={handleLoadSample}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Load Sample Moving Quote ($2,150)
              </Button>
            </div>
          ) : (
            <div className="space-y-4 max-w-lg mx-auto text-left">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Upload text document or paste quote text
                </p>
                <p className="text-xs text-muted mb-3">
                  Supported formats: Plain text (.txt), Markdown (.md), or CSV documents.
                </p>
              </div>

              <input
                type="file"
                accept=".txt,.md,.csv"
                onChange={handleFileUpload}
                className="block w-full text-xs text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-stone-line file:text-xs file:font-medium file:bg-surface file:text-charcoal hover:file:bg-stone-subtle cursor-pointer"
              />

              <Textarea
                rows={4}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Or paste quote text here (e.g. Caring Transitions Estimate #1042: Packing $600, Loading & Transport $1,350, Materials $200. Total: $2,150)..."
                className="text-xs"
              />

              <Button
                type="button"
                variant="default"
                size="default"
                isLoading={analyzing}
                disabled={!pastedText.trim()}
                onClick={handleExtractFromText}
                className="w-full"
              >
                <span>Extract Quote Details with Gemini</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-forest/20 bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-line pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-forest" />
              <span className="font-semibold text-[#183331] text-base tracking-[-0.02em]">
                {quoteData.providerName}
              </span>
            </div>
            <Badge variant="ready">Parsed Successfully</Badge>
          </div>

          {/* Itemized summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-md bg-stone-subtle/50 border border-stone-line">
              <span className="text-muted block text-[10px] uppercase tracking-wider">Transport</span>
              <strong className="text-charcoal">${quoteData.movingAmount?.toLocaleString() || '—'}</strong>
            </div>
            <div className="p-2.5 rounded-md bg-stone-subtle/50 border border-stone-line">
              <span className="text-muted block text-[10px] uppercase tracking-wider">Packing</span>
              <strong className="text-charcoal">${quoteData.packingAmount?.toLocaleString() || '—'}</strong>
            </div>
            <div className="p-2.5 rounded-md bg-stone-subtle/50 border border-stone-line">
              <span className="text-muted block text-[10px] uppercase tracking-wider">Materials</span>
              <strong className="text-charcoal">${quoteData.materialsAmount?.toLocaleString() || '—'}</strong>
            </div>
            <div className="p-2.5 rounded-md bg-forest/10 border border-forest/20">
              <span className="text-forest block text-[10px] uppercase tracking-wider font-semibold">Total Quote</span>
              <strong className="text-forest text-sm font-semibold">${quoteData.totalAmount?.toLocaleString()}</strong>
            </div>
          </div>

          {quoteData.notes && (
            <p className="text-xs text-muted leading-relaxed italic">
              Scope: &ldquo;{quoteData.notes}&rdquo;
            </p>
          )}

          {/* Action to Apply */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuoteData(null);
                setApplied(false);
              }}
            >
              Reset
            </Button>

            {!applied ? (
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={handleApplyQuoteToPlan}
                className="font-semibold"
              >
                <span>Apply ${quoteData.totalAmount?.toLocaleString()} Moving Quote to Plan</span>
                <CheckCircle2 className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Badge variant="completed" className="px-3 py-1 text-xs">
                Applied to plan &bull; Estimate updated
              </Badge>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-status-critical-bg border border-status-critical/20 rounded-md text-xs text-status-critical flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
