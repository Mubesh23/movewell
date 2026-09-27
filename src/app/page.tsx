'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Send,
  Calendar,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IntakeDraft } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  bulletPoints?: string[];
  isConfirmation?: boolean;
}

export default function LandingPage() {
  const router = useRouter();

  // Multi-turn conversational intake state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Tell me what's happening with your parent or family member. For example: what's their situation right now, and what's coming up?",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [draft, setDraft] = useState<IntakeDraft>({});
  const [isReady, setIsReady] = useState(false);
  const [submittingTurn, setSubmittingTurn] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [loadingPreset, setLoadingPreset] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, submittingTurn]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = (textOverride || inputValue).trim();
    if (!textToSend || submittingTurn) return;

    setChatError(null);
    setInputValue('');

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: textToSend,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setSubmittingTurn(true);

    try {
      // Send message along with conversation history and accumulated draft
      const res = await fetch('/api/ai/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: nextMessages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          currentDraft: draft,
        }),
      });

      const data = await res.json();
      if (data.success && data.draft) {
        setDraft(data.draft);
        setIsReady(data.isReady);

        const assistantMessage: ChatMessage = {
          id: 'nora-' + Date.now(),
          role: 'assistant',
          content: data.assistantMessage || data.message || "I've noted that.",
          bulletPoints: data.isReady ? data.summaryBulletPoints : undefined,
          isConfirmation: data.isReady,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setChatError(
          data.error || "Nora couldn't interpret that. Please try adding more context or use our guided form."
        );
      }
    } catch (err: any) {
      setChatError('Communication error: ' + err.message);
    } finally {
      setSubmittingTurn(false);
      // Focus back onto input if more turns needed
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleCreatePlanFromDraft = async () => {
    setCreatingPlan(true);
    const cleanSeniorName =
      draft.seniorName &&
      !['fell', 'had', 'is', 'was', 'went', 'broke', 'needs', 'lives'].includes(
        draft.seniorName.trim().toLowerCase()
      )
        ? draft.seniorName.trim()
        : 'Mom';

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seniorName: cleanSeniorName,
          ageRange: draft.ageRange,
          transitionType: draft.transitionType || 'POST_HOSPITAL',
          dischargeDate: draft.dischargeDate,
          dischargeDays: draft.dischargeDays,
          mobilityConstraint: draft.mobilityConstraint,
          stairsConstraint: draft.stairsConstraint,
          livesAlone: draft.livesAlone,
          homeType: draft.homeType,
          zipCode: draft.zipCode,
          city: draft.city,
          budget: draft.budget,
          userName: draft.userName,
          userCity: draft.userCity,
          userIsRemote: draft.userIsRemote,
          localHelperName: draft.localHelperName,
          localHelperCity: draft.localHelperCity,
        }),
      });

      const data = await res.json();
      if (data.success && data.caseId) {
        router.push(`/plan/${data.caseId}`);
      } else {
        alert('Failed to generate plan: ' + data.error);
        setCreatingPlan(false);
      }
    } catch (err: any) {
      alert('Error creating plan: ' + err.message);
      setCreatingPlan(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          "Tell me what's happening with your parent or family member. For example: what's their situation right now, and what's coming up?",
      },
    ]);
    setDraft({});
    setIsReady(false);
    setChatError(null);
    setInputValue('');
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
    'My mom Maria is 78. She had a fall and is in the hospital. They expect to discharge her in 5 days. She lives alone in a two-story house and cannot safely use stairs anymore. I live in Chicago, but my sister Jennifer lives nearby. We have around $8,000 to work with.';

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
              Use step-by-step form &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section: Two-column editorial layout */}
      <main className="max-w-6xl mx-auto px-6 py-10 sm:py-14 flex-1 w-full space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column (7 cols): Editorial Narrative + Conversational Intake Chat */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-terracotta font-sans">
                Hospital Discharge &amp; Family Care Coordination
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-serif font-bold text-charcoal tracking-tight leading-[1.14]">
                A calmer way through what comes next.
              </h1>
              <p className="text-sm sm:text-base text-stone-text leading-relaxed max-w-xl">
                When a parent suddenly needs more support, MoveWell helps your family understand what needs to happen, coordinate who&apos;s doing it, and keep the transition moving.
              </p>
            </div>

            {/* Conversational Intake Hero Experience */}
            <div className="rounded-xl border border-stone-line bg-surface shadow-2xs overflow-hidden flex flex-col">
              {/* Chat Header Bar */}
              <div className="px-4 py-3 bg-canvas/60 border-b border-stone-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-forest text-surface font-serif text-xs font-bold flex items-center justify-center">
                    N
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-charcoal block">
                      Transition Planning with Nora
                    </span>
                    <span className="text-[10px] text-muted block flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-forest" />
                      Conversational Intake &bull; Quietly organizing your plan
                    </span>
                  </div>
                </div>

                {messages.length > 1 && (
                  <button
                    type="button"
                    onClick={handleResetChat}
                    className="inline-flex items-center gap-1 text-[11px] text-stone-text hover:text-charcoal transition-colors px-2 py-1 rounded hover:bg-stone-line/40"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Start over</span>
                  </button>
                )}
              </div>

              {/* Chat Message Scrollport */}
              <div className="p-4 sm:p-5 max-h-[360px] overflow-y-auto space-y-3.5 text-sm bg-surface">
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-6 h-6 rounded-full bg-forest text-surface font-serif text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          N
                        </div>
                      )}

                      <div
                        className={`space-y-3 max-w-[88%] sm:max-w-[82%] ${
                          isUser
                            ? 'bg-forest/10 border border-forest/20 text-charcoal rounded-2xl rounded-br-xs px-4 py-2.5'
                            : 'bg-canvas/70 border border-stone-line text-charcoal rounded-2xl rounded-tl-xs px-4 py-3'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                          {m.content}
                        </p>

                        {/* Confirmation Card with Summary Bullet Points */}
                        {m.isConfirmation && m.bulletPoints && (
                          <div className="mt-3 p-3.5 rounded-lg bg-surface border border-stone-line space-y-3 shadow-2xs">
                            <div className="flex items-center gap-1.5 text-forest text-xs font-semibold">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Minimum Viable Case Data Complete</span>
                            </div>

                            <div className="space-y-1.5 text-xs text-charcoal/90 border-t border-stone-line/60 pt-2">
                              {m.bulletPoints.map((bp, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                  <span className="text-forest mt-0.5">&bull;</span>
                                  <span>{bp}</span>
                                </div>
                              ))}
                            </div>

                            <div className="pt-2 border-t border-stone-line/60">
                              <Button
                                type="button"
                                variant="default"
                                size="default"
                                isLoading={creatingPlan}
                                onClick={handleCreatePlanFromDraft}
                                className="w-full font-semibold shadow-xs"
                              >
                                <span>
                                  Create Transition Plan for{' '}
                                  {draft.seniorName &&
                                  !['fell', 'had', 'is', 'was', 'went', 'broke', 'needs', 'lives'].includes(
                                    draft.seniorName.trim().toLowerCase()
                                  )
                                    ? draft.seniorName
                                    : 'Mom'}
                                </span>
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                              <p className="text-[10px] text-muted text-center mt-1.5">
                                Generates initial checklist, critical path task, and financial ledger.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Thinking / Typing indicator */}
                {submittingTurn && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-6 h-6 rounded-full bg-forest text-surface font-serif text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      N
                    </div>
                    <div className="bg-canvas/70 border border-stone-line text-muted rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-text animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-text animate-pulse delay-150" />
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-text animate-pulse delay-300" />
                      <span className="ml-1 text-[11px] text-stone-text">Nora is reviewing...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 sm:p-4 bg-canvas/30 border-t border-stone-line space-y-2.5">
                {/* Suggestions / Starter Chips */}
                {messages.length === 1 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-muted font-medium">Try starting with:</span>
                    <button
                      type="button"
                      onClick={() => handleSendMessage(samplePrompt)}
                      className="text-[11px] bg-surface hover:bg-forest/5 text-forest border border-stone-line rounded-full px-2.5 py-1 font-medium transition-colors"
                    >
                      Sample scenario (Maria, 78 &bull; 5-day discharge)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSendMessage(
                          "My mom fell and she's in the hospital. She lives alone and I'm in another state."
                        )
                      }
                      className="text-[11px] bg-surface hover:bg-forest/5 text-charcoal border border-stone-line rounded-full px-2.5 py-1 transition-colors"
                    >
                      &ldquo;My mom fell and is hospitalized...&rdquo;
                    </button>
                  </div>
                )}

                {/* Input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                      isReady
                        ? "Any other details to note, or click 'Create Transition Plan' above..."
                        : "Describe the situation or answer Nora's question..."
                    }
                    disabled={submittingTurn || creatingPlan}
                    className="flex-1 bg-surface border border-stone-line rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-charcoal placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-forest"
                  />
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    disabled={!inputValue.trim() || submittingTurn}
                    className="shrink-0 h-10 px-3.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>

                {chatError && (
                  <div className="p-2.5 bg-status-critical-bg border border-status-critical/20 rounded-md text-xs text-status-critical flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{chatError}</span>
                    </div>
                    <Link href="/start" className="underline font-semibold ml-2">
                      Use guided form
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Editorial Photography & Demo Box */}
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

            {/* Neutral Product Purpose Copy */}
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
