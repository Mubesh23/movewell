'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import {
  Send,
  Sparkles,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { IntakeDraft } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  bulletPoints?: string[];
  isConfirmation?: boolean;
}

function GetStartedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const initialProcessedRef = useRef(false);

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
          clientNow: new Date().toISOString(),
          clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
          bulletPoints: data.isReady
            ? data.summaryBulletPoints || data.readiness?.summaryBulletPoints
            : undefined,
          isConfirmation: data.isReady,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to process message');
      }
    } catch (err: any) {
      console.error('Intake turn error:', err);
      setChatError(err.message || 'Could not send message. Please try again.');
    } finally {
      setSubmittingTurn(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSendMessageRef = useRef(handleSendMessage);
  handleSendMessageRef.current = handleSendMessage;

  // Carry forward initial prompt from homepage if provided
  useEffect(() => {
    const initialQuery = searchParams.get('initial');
    if (initialQuery && !initialProcessedRef.current) {
      initialProcessedRef.current = true;
      handleSendMessageRef.current(initialQuery);
    }
  }, [searchParams]);

  const handleCreateDraft = async () => {
    setCreatingDraft(true);
    setChatError(null);
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeDraft: draft }),
      });

      const data = await res.json();
      if (data.success && data.draftId) {
        router.push(`/draft/${data.draftId}`);
      } else {
        throw new Error(data.error || 'Could not generate draft proposal');
      }
    } catch (err: any) {
      console.error('Error generating draft proposal:', err);
      setChatError(err.message || 'Failed to generate proposal');
      setCreatingDraft(false);
    }
  };

  const handleReset = () => {
    setDraft({});
    setIsReady(false);
    setChatError(null);
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content:
          "Tell me what's happening with your parent or family member. For example: what's their situation right now, and what's coming up?",
      },
    ]);
  };

  // Compute understood items for visual understanding panel
  const understoodItems = [
    {
      label: 'Senior details',
      known: Boolean(draft.seniorName),
      text: draft.seniorName ? `${draft.seniorName}${draft.ageRange ? ` (${draft.ageRange})` : ''}` : 'Pending senior details',
    },
    {
      label: 'Discharge timing',
      known: Boolean(
        draft.dischargeDate ||
        draft.dischargeDays !== undefined ||
        draft.dischargeTimelineDescription
      ),
      text: draft.dischargeTime && draft.dischargeTimelineDescription
        ? `${draft.dischargeTimelineDescription} (${draft.dischargeTime})`
        : draft.dischargeTimelineDescription
        ? draft.dischargeTimelineDescription
        : draft.dischargeDays !== undefined
        ? `In ~${draft.dischargeDays} days`
        : draft.dischargeDate
        ? draft.dischargeDate
        : 'Pending discharge timing',
    },
    {
      label: 'Mobility & safety',
      known: draft.mobilityConstraint !== undefined || draft.stairsConstraint !== undefined,
      text: draft.stairsConstraint
        ? 'Stairs unsafe / mobility support needed'
        : draft.mobilityConstraint
        ? 'Mobility assistance needed'
        : draft.mobilityConstraint === false && draft.stairsConstraint === false
        ? 'Independent mobility (no stairs hazard)'
        : 'Pending mobility context',
    },
    {
      label: 'Location',
      known: Boolean(draft.city || (draft.zipCode && draft.zipCode !== 'UNSET')),
      text: draft.city
        ? `${draft.city}${draft.zipCode && draft.zipCode !== 'UNSET' ? ` (${draft.zipCode})` : ''}`
        : draft.zipCode && draft.zipCode !== 'UNSET'
        ? `ZIP ${draft.zipCode}`
        : 'Pending nearby address or ZIP',
    },
    {
      label: 'Care circle',
      known: Boolean(
        draft.careCircleAddressed ||
        (draft.draftMembers && draft.draftMembers.length > 0) ||
        draft.localHelperName ||
        draft.hasLocalHelper !== undefined
      ),
      text: draft.draftMembers && draft.draftMembers.length > 0
        ? `${draft.draftMembers.map((m) => m.name).join(', ')} (${draft.draftMembers.length} helper${draft.draftMembers.length > 1 ? 's' : ''})`
        : draft.localHelperName
        ? `${draft.localHelperName} (local support)`
        : draft.hasLocalHelper === false
        ? 'No local helpers available'
        : 'Pending care circle & helpers',
    },
    {
      label: 'Coordinator',
      known: Boolean(
        draft.coordinatorName ||
        draft.userName ||
        draft.coordinatorRelationship ||
        draft.userRelationship ||
        draft.userIsRemote !== undefined
      ),
      text: draft.coordinatorName || draft.userName
        ? `${draft.coordinatorName || draft.userName}${draft.coordinatorRelationship || draft.userRelationship ? ` (${draft.coordinatorRelationship || draft.userRelationship})` : ''}`
        : draft.coordinatorRelationship || draft.userRelationship
        ? `Coordinating as ${draft.coordinatorRelationship || draft.userRelationship}`
        : draft.userIsRemote
        ? 'Coordinating remotely'
        : 'Pending who is coordinating',
    },
    {
      label: 'Budget',
      known: Boolean(draft.budget || draft.budgetStatus === 'UNSET'),
      text: draft.budget
        ? `$${draft.budget.toLocaleString()} target`
        : draft.budgetStatus === 'UNSET'
        ? 'Left open (no set ceiling)'
        : 'Pending budget target or left open',
    },
    ...(draft.livesAlone !== undefined
      ? [
          {
            label: 'Living setup',
            known: true,
            text: draft.livesAlone ? 'Lives alone' : 'Household support present',
          },
        ]
      : []),
  ];

  const knownCount = understoodItems.filter((i) => i.known).length;
  const progressPercent = Math.min(100, Math.round((knownCount / understoodItems.length) * 100));

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-line">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-sage text-evergreen flex items-center justify-center font-bold text-lg shadow-2xs">
              ✦
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-ink">Nora</h1>
                <span className="px-2 py-0.5 rounded-full bg-evergreen/10 text-evergreen text-[10px] font-bold uppercase tracking-wider">
                  AI Transition Planning Assistant
                </span>
              </div>
              <p className="text-xs text-muted-ink">
                Conversational consultation · Nora quietly organizes what you share into a proposed plan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs text-muted-ink hover:text-ink px-3 py-1.5 rounded-lg border border-line bg-white hover:bg-cream transition-colors"
            title="Start over"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start over</span>
          </button>
        </div>

        {/* Mobile Understanding Bar Toggle */}
        <div className="lg:hidden mb-4">
          <button
            type="button"
            onClick={() => setMobilePanelOpen(!mobilePanelOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-line rounded-xl text-xs font-semibold text-ink shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-evergreen" />
              <span>What Nora understands ({knownCount}/{understoodItems.length} noted)</span>
            </div>
            {mobilePanelOpen ? <ChevronUp className="w-4 h-4 text-muted-ink" /> : <ChevronDown className="w-4 h-4 text-muted-ink" />}
          </button>

          {mobilePanelOpen && (
            <div className="mt-2 p-4 bg-white border border-line rounded-xl space-y-2 text-xs shadow-2xs">
              {understoodItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-line/60 last:border-0">
                  <span className="text-muted-ink">{item.label}</span>
                  <span className={`font-medium ${item.known ? 'text-ink' : 'text-muted-ink/60'}`}>
                    {item.known ? `✓ ${item.text}` : `○ ${item.text}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2-Column Hybrid Grid on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Conversation & Composer */}
          <div className="lg:col-span-7 flex flex-col justify-between min-h-[520px] bg-transparent">
            {/* Message Thread */}
            <div className="space-y-4 overflow-y-auto mb-6 pr-1 max-h-[500px]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-evergreen text-white rounded-br-xs font-normal'
                        : 'bg-white border border-line text-ink rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>

                    {msg.bulletPoints && msg.bulletPoints.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-line/60">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-ink block mb-2">
                          Key details noted:
                        </span>
                        <ul className="space-y-1.5">
                          {msg.bulletPoints.map((bp, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-ink/90 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-evergreen flex-shrink-0 mt-0.5" />
                              <span>{bp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {msg.isConfirmation && (
                      <div className="mt-4 pt-3 border-t border-line/60">
                        <button
                          type="button"
                          onClick={handleCreateDraft}
                          disabled={creatingDraft}
                          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-semibold text-xs shadow-sm hover:shadow transition-all"
                        >
                          <span>{creatingDraft ? 'Generating proposal...' : 'Review proposed plan →'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {submittingTurn && (
                <div className="flex items-start gap-2">
                  <div className="bg-white border border-line text-muted-ink px-4 py-3 rounded-2xl rounded-bl-xs text-xs flex items-center gap-2 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-evergreen animate-ping" />
                    <span>Nora is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error message if any */}
            {chatError && (
              <div className="mb-4 p-3 bg-amber-bg border border-amber/30 rounded-xl text-xs text-amber font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{chatError}</span>
              </div>
            )}

            {/* Composer Input */}
            <div className="space-y-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 bg-white border border-line rounded-2xl p-2 shadow-xs focus-within:border-evergreen transition-colors"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Describe what's happening or answer Nora's question..."
                  disabled={submittingTurn}
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-muted-ink/60 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingTurn || !inputValue.trim()}
                  className="w-10 h-10 rounded-xl bg-evergreen hover:bg-evergreen-dark disabled:opacity-40 text-white flex items-center justify-center transition-colors flex-shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-muted-ink">
                <span>Nora acknowledges and asks one highest-value missing question at a time.</span>
                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      'My mom Maria (78) fell and broke her hip. Discharge is expected Thursday. House is two-story with bedroom upstairs. Her sister Jennifer is in Houston with her (77004), while I am coordinating from Chicago. Let us leave the budget open for now.'
                    )
                  }
                  className="text-evergreen hover:underline font-medium"
                >
                  Fill sample scenario
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): "What I understand" Visible Understanding Panel */}
          <div className="hidden lg:block lg:col-span-5 sticky top-8">
            <div className="bg-white border border-line rounded-2xl p-6 shadow-2xs space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                    What I understand
                  </h3>
                  <span className="text-xs font-semibold text-evergreen">
                    {progressPercent}% ready
                  </span>
                </div>
                <p className="text-xs text-muted-ink">
                  Quietly structuring your context into a living transition plan.
                </p>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-cream rounded-full overflow-hidden border border-line">
                  <div
                    className="h-full bg-evergreen rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Structured Checklist Items */}
              <div className="space-y-3">
                {understoodItems.map((item, idx) => (
                  <motion.div
                    key={item.label}
                    layout
                    initial={{ opacity: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: item.known ? [1, 1.02, 1] : 1,
                    }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
                      item.known
                        ? 'bg-sage/40 border-evergreen/20 text-ink font-medium shadow-2xs'
                        : 'bg-cream/40 border-line text-muted-ink/70'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] transition-colors ${
                        item.known
                          ? 'bg-evergreen text-white font-bold'
                          : 'border border-line text-muted-ink'
                      }`}
                    >
                      {item.known ? <Check className="w-2.5 h-2.5" /> : '○'}
                    </span>
                    <div className="flex-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-ink/80 mb-0.5">
                        {item.label}
                      </span>
                      <span className={item.known ? 'text-ink font-semibold' : 'text-muted-ink italic'}>
                        {item.text}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Ready State Action */}
              <AnimatePresence mode="wait">
                {isReady ? (
                  <motion.div
                    key="ready-action-box"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="pt-4 border-t border-line space-y-3"
                  >
                    <div className="flex items-center gap-2 text-xs text-evergreen font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Minimum context ready for proposed plan</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateDraft}
                      disabled={creatingDraft}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-semibold text-sm shadow-sm hover:shadow transition-all"
                    >
                      <span>{creatingDraft ? 'Generating proposal...' : 'Review proposed plan →'}</span>
                    </button>
                    <p className="text-[11px] text-muted-ink text-center">
                      AI proposes. You review and adjust everything before activation.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="not-ready-notice"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pt-3 border-t border-line text-[11px] text-muted-ink leading-relaxed"
                  >
                    ✦ Nora will unlock the proposed plan as soon as timing, safety, and location are established.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function GetStartedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center text-xs text-muted-ink">Loading consultation...</div>
      </div>
    }>
      <GetStartedContent />
    </Suspense>
  );
}
