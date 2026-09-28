'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import {
  Send,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { IntakeDraft } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  bulletPoints?: string[];
  isConfirmation?: boolean;
}

function renderAssistantMessage(content: string) {
  // Split into paragraphs / blocks
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-ink/90">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n').map((l) => l.trim()).filter(Boolean);

        // Check if this block is a numbered list (e.g. "1. confirming...", "2. making sure...")
        const isNumberedList = lines.length > 1 && lines.every((l) => /^\d+[\.\)]\s+/.test(l));

        if (isNumberedList) {
          return (
            <div key={pIdx} className="space-y-1.5 my-2">
              {lines.map((line, lIdx) => {
                const match = line.match(/^(\d+)[\.\)]\s+(.*)$/);
                const num = match ? match[1] : String(lIdx + 1);
                const text = match ? match[2] : line;
                return (
                  <div
                    key={lIdx}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-sand/50 border border-line/60 text-xs text-ink/90"
                  >
                    <span className="w-5 h-5 rounded-full bg-sage text-evergreen font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {num}
                    </span>
                    <div className="flex-1 font-medium leading-relaxed pt-0.5">
                      {renderInlineMarkdown(text)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        // Check if this block contains an intro line followed by numbered items
        const hasNumberedItems = lines.some((l) => /^\d+[\.\)]\s+/.test(l));
        if (hasNumberedItems && lines.length > 1) {
          const introLines: string[] = [];
          const listLines: string[] = [];
          let startedList = false;

          for (const l of lines) {
            if (/^\d+[\.\)]\s+/.test(l)) {
              startedList = true;
              listLines.push(l);
            } else if (!startedList) {
              introLines.push(l);
            } else {
              listLines.push(l);
            }
          }

          return (
            <div key={pIdx} className="space-y-2">
              {introLines.length > 0 && (
                <p className="text-ink/90 leading-relaxed">
                  {renderInlineMarkdown(introLines.join(' '))}
                </p>
              )}
              <div className="space-y-1.5 my-2">
                {listLines.map((line, lIdx) => {
                  const match = line.match(/^(\d+)[\.\)]\s+(.*)$/);
                  const num = match ? match[1] : String(lIdx + 1);
                  const text = match ? match[2] : line;
                  return (
                    <div
                      key={lIdx}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-sand/50 border border-line/60 text-xs text-ink/90"
                    >
                      <span className="w-5 h-5 rounded-full bg-sage text-evergreen font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        {num}
                      </span>
                      <div className="flex-1 font-medium leading-relaxed pt-0.5">
                        {renderInlineMarkdown(text)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // Check for bullet list
        const isBulletList = lines.length > 1 && lines.every((l) => /^[\u2022\*\-]\s+/.test(l));
        if (isBulletList) {
          return (
            <ul key={pIdx} className="space-y-1.5 my-2 pl-1">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="flex items-start gap-2 text-xs text-ink/90 font-medium">
                  <span className="text-evergreen font-bold text-sm leading-none mt-0.5">•</span>
                  <span>{renderInlineMarkdown(line.replace(/^[\u2022\*\-]\s+/, ''))}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={pIdx} className="text-ink/90 leading-relaxed">
            {renderInlineMarkdown(para)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[\s\S]+?\*\*|\*[^\*\n]+?\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-ink/80">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

const INITIAL_FIRST_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Tell me what's going on with your parent or family member. You can start anywhere — what changed, what you're worried about, or what needs to happen next.",
};

function GetStartedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Multi-turn conversational intake state
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_FIRST_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [draft, setDraft] = useState<IntakeDraft>({});
  const [isReady, setIsReady] = useState(false);
  const [submittingTurn, setSubmittingTurn] = useState(false);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Notes rail state
  const [notesOpen, setNotesOpen] = useState(true);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('bridgewell_intake_notes_open');
      if (saved !== null) {
        setNotesOpen(saved === 'true');
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  const handleToggleNotes = (open: boolean) => {
    setNotesOpen(open);
    try {
      sessionStorage.setItem('bridgewell_intake_notes_open', String(open));
    } catch {
      // sessionStorage unavailable
    }
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const initialProcessedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, submittingTurn]);

  // Adjust textarea height dynamically
  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(Math.max(el.scrollHeight, 64), 180)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = (textOverride || inputValue).trim();
    if (!textToSend || submittingTurn) return;

    setChatError(null);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '64px';
    }

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
          content: data.assistantMessage || data.message || "I've organized those details.",
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
      setTimeout(() => textareaRef.current?.focus(), 100);
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

  const handleConfirmReset = () => {
    setDraft({});
    setIsReady(false);
    setChatError(null);
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content:
          "Tell me what's going on with your parent or family member. You can start anywhere — what changed, what you're worried about, or what needs to happen next.",
      },
    ]);
    setShowResetModal(false);
  };

  const handleStartOverClick = () => {
    const hasData = Object.keys(draft).length > 0 || messages.length > 1;
    if (hasData) {
      setShowResetModal(true);
    } else {
      handleConfirmReset();
    }
  };

  // Compute understood items for Nora's notes rail
  const understoodItems = [
    {
      label: 'Senior',
      known: Boolean(draft.seniorName),
      text: draft.seniorName ? `${draft.seniorName}${draft.ageRange ? ` · ${draft.ageRange}` : ''}` : 'Pending details',
    },
    {
      label: 'Discharge',
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
        : 'Pending timing',
    },
    {
      label: 'Mobility & safety',
      known: draft.mobilityConstraint !== undefined || draft.stairsConstraint !== undefined,
      text: draft.stairsConstraint
        ? 'Stairs unsafe / support needed'
        : draft.mobilityConstraint
        ? 'Mobility assistance needed'
        : draft.mobilityConstraint === false && draft.stairsConstraint === false
        ? 'Independent mobility'
        : 'Pending context',
    },
    {
      label: 'Location',
      known: Boolean(draft.city || (draft.zipCode && draft.zipCode !== 'UNSET')),
      text: draft.city
        ? `${draft.city}${draft.zipCode && draft.zipCode !== 'UNSET' ? ` · ${draft.zipCode}` : ''}`
        : draft.zipCode && draft.zipCode !== 'UNSET'
        ? `ZIP ${draft.zipCode}`
        : 'Pending location',
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
        ? 'No local helpers'
        : 'Pending helpers',
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
        : 'Pending coordinator',
    },
    {
      label: 'Budget',
      known: Boolean(draft.budget || draft.budgetStatus === 'UNSET'),
      text: draft.budget
        ? `$${draft.budget.toLocaleString()} target`
        : draft.budgetStatus === 'UNSET'
        ? 'Left open (no ceiling)'
        : 'Pending target',
    },
  ];

  const knownCount = understoodItems.filter((i) => i.known).length;

  // Human-centered readiness copy
  const getReadinessHeading = () => {
    if (isReady) return 'Ready to review a proposed plan';
    if (knownCount >= 6) return 'Almost ready to build your plan';
    if (knownCount >= 3) return `${knownCount} of ${understoodItems.length} key details gathered`;
    return "I'll organize important details here as we talk.";
  };

  // Suggestion prompts
  const suggestions =
    knownCount === 0
      ? [
          { text: 'My parent is leaving the hospital', prompt: 'My parent is being discharged from the hospital and we need a transition plan.' },
          { text: 'We need help planning a move', prompt: 'We need help planning a move and making sure their next living space is safe.' },
          { text: "I'm coordinating from another city", prompt: "I am coordinating from another city and need to get local help organized." },
          { text: 'Home safety & mobility help', prompt: 'We need home safety modifications and mobility support before discharge.' },
        ]
      : !draft.budget && draft.budgetStatus !== 'UNSET'
      ? [
          { text: 'Leave the budget open', prompt: 'Let us leave the budget open for now.' },
          { text: 'Discharge is Friday', prompt: 'Discharge is planned for Friday.' },
          { text: 'Jennifer is local', prompt: 'Her sister Jennifer is local and can help.' },
        ]
      : [];

  return (
    <div className="min-h-screen bg-sand text-ink flex flex-col font-sans selection:bg-sage selection:text-ink">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Nora Intake Header */}
        <div className="flex items-center justify-between pb-5 mb-6 border-b border-line">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-sage text-evergreen flex items-center justify-center font-bold text-lg shadow-2xs">
              ✦
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-ink">Nora</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-sage text-evergreen text-[11px] font-bold uppercase tracking-wider">
                  AI transition planning assistant
                </span>
              </div>
              <p className="text-xs text-muted-ink mt-0.5">
                Tell me what&apos;s happening. I&apos;ll organize the important details as we talk.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartOverClick}
            className="inline-flex items-center gap-1.5 text-xs text-muted-ink hover:text-ink px-3.5 py-2 rounded-xl border border-line bg-white hover:bg-cream transition-colors cursor-pointer shadow-2xs"
            title="Start over"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start over</span>
          </button>
        </div>

        {/* Mobile Notes Toggle */}
        <div className="lg:hidden mb-5">
          <button
            type="button"
            onClick={() => setMobilePanelOpen(!mobilePanelOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-line rounded-xl text-xs font-semibold text-ink shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-evergreen" />
              <span>Nora&apos;s notes ({knownCount}/{understoodItems.length} gathered)</span>
            </div>
            {mobilePanelOpen ? <ChevronUp className="w-4 h-4 text-muted-ink" /> : <ChevronDown className="w-4 h-4 text-muted-ink" />}
          </button>

          {mobilePanelOpen && (
            <div className="mt-2 p-4 bg-white border border-line rounded-xl space-y-2 text-xs shadow-2xs">
              <p className="text-[11px] font-medium text-evergreen mb-2">{getReadinessHeading()}</p>
              {understoodItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 border-b border-line/60 last:border-0">
                  <span className="text-muted-ink">{item.label}</span>
                  <span className={`font-semibold ${item.known ? 'text-ink' : 'text-muted-ink/60'}`}>
                    {item.known ? `✓ ${item.text}` : `○ ${item.text}`}
                  </span>
                </div>
              ))}
              {isReady && (
                <button
                  type="button"
                  onClick={handleCreateDraft}
                  disabled={creatingDraft}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-semibold text-xs shadow-xs"
                >
                  {creatingDraft ? 'Generating proposal...' : 'Review proposed plan →'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Layout: Natural Top-to-Bottom Conversation Flow + Sticky Notes Rail */}
        <div className="flex items-start justify-center gap-8 relative">
          {/* Main Conversation Column */}
          <div
            className={`flex-1 transition-all duration-200 flex flex-col space-y-6 ${
              notesOpen ? 'max-w-2xl' : 'max-w-3xl'
            }`}
          >
            {/* Message Thread */}
            <div className="space-y-5">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === 'assistant' ? (
                    <div className="flex items-start gap-3">
                      {/* Nora Avatar */}
                      <div className="w-8 h-8 rounded-xl bg-sage text-evergreen flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 shadow-2xs border border-evergreen/15">
                        ✦
                      </div>
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-ink">Nora</span>
                          <span className="text-[10px] text-muted-ink uppercase tracking-wider font-semibold">
                            Transition Assistant
                          </span>
                        </div>
                        <div className="bg-white border border-line/80 rounded-2xl rounded-tl-xs p-4 sm:p-5 text-sm shadow-xs space-y-3">
                          {renderAssistantMessage(msg.content)}

                          {msg.bulletPoints && msg.bulletPoints.length > 0 && (
                            <div className="mt-4 pt-3.5 border-t border-line/60 bg-sand/30 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 sm:p-5 rounded-b-2xl">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-ink block mb-2.5">
                                Key details noted:
                              </span>
                              <ul className="space-y-2">
                                {msg.bulletPoints.map((bp, i) => (
                                  <li key={i} className="flex items-start gap-2.5 text-xs text-ink/90 font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-evergreen shrink-0 mt-0.5" />
                                    <span>{bp}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {msg.isConfirmation && (
                            <div className="mt-4 pt-3.5 border-t border-line/60">
                              <button
                                type="button"
                                onClick={handleCreateDraft}
                                disabled={creatingDraft}
                                className="inline-flex items-center gap-2 py-3 px-5 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-semibold text-xs shadow-xs hover:shadow transition-all cursor-pointer active:scale-[0.98]"
                              >
                                <span>{creatingDraft ? 'Generating proposal...' : 'Review proposed plan →'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* User Message */
                    <div className="flex items-start justify-end gap-3 ml-auto">
                      <div className="space-y-1 flex flex-col items-end max-w-[85%]">
                        <span className="text-[10px] text-muted-ink uppercase tracking-wider font-semibold mr-1">
                          You
                        </span>
                        <div className="bg-evergreen text-white rounded-2xl rounded-tr-xs px-4.5 py-3 text-sm font-normal leading-relaxed shadow-xs">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {submittingTurn && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sage text-evergreen flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 shadow-2xs border border-evergreen/15">
                    ✦
                  </div>
                  <div className="bg-white border border-line text-muted-ink px-4 py-3 rounded-2xl rounded-tl-xs text-xs flex items-center gap-2.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-evergreen animate-ping" />
                    <span>Nora is organizing details...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error banner if any */}
            {chatError && (
              <div className="p-3.5 bg-amber-bg border border-amber/30 rounded-xl text-xs text-amber font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{chatError}</span>
              </div>
            )}

            {/* Suggestions Chips */}
            {suggestions.length > 0 && !submittingTurn && (
              <div className="pt-2">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-evergreen" />
                  <span className="text-[11px] font-bold text-muted-ink uppercase tracking-wider">
                    Suggested replies
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(s.prompt)}
                      className="group inline-flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-xl bg-white hover:bg-cream border border-line hover:border-evergreen/40 text-ink shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <span className="text-evergreen group-hover:scale-110 transition-transform">✦</span>
                      <span>{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sleek Composer */}
            <div className="space-y-1.5 pt-2 sticky bottom-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative bg-white border border-line rounded-2xl shadow-sm focus-within:border-evergreen focus-within:ring-2 focus-within:ring-evergreen/10 transition-all p-2 pl-4"
              >
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Tell Nora what's happening..."
                  disabled={submittingTurn}
                  className="w-full min-h-[48px] max-h-[160px] py-2 pr-12 text-sm text-ink placeholder:text-muted-ink/60 bg-transparent focus:outline-none resize-none leading-relaxed"
                />
                <button
                  type="submit"
                  disabled={submittingTurn || !inputValue.trim()}
                  className="absolute right-2.5 bottom-2.5 w-9 h-9 rounded-xl bg-evergreen hover:bg-evergreen-dark disabled:opacity-25 disabled:hover:bg-evergreen text-white flex items-center justify-center transition-all shrink-0 shadow-xs cursor-pointer active:scale-95"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <div className="flex items-center justify-between text-[11px] text-muted-ink px-2">
                <span>Press Enter to send, Shift+Enter for newline</span>
              </div>
            </div>
          </div>

          {/* Nora's Notes Rail (Desktop, Collapsible & Sticky) */}
          <div className="hidden lg:block shrink-0">
            {notesOpen ? (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                className="w-[300px] bg-white border border-line rounded-2xl p-4.5 shadow-xs space-y-4 sticky top-6"
              >
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-evergreen" />
                    <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                      Nora&apos;s notes
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotes(false)}
                    className="text-muted-ink hover:text-ink p-1 rounded-md hover:bg-cream transition-colors cursor-pointer"
                    title="Collapse notes rail"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <p className="text-xs font-semibold text-evergreen leading-snug">
                    {getReadinessHeading()}
                  </p>
                </div>

                {/* Compact Structured Items */}
                <div className="space-y-1.5">
                  {understoodItems.map((item) => (
                    <div
                      key={item.label}
                      className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
                        item.known
                          ? 'bg-sage/25 border-evergreen/20 text-ink'
                          : 'bg-cream/40 border-line/60 text-muted-ink/70'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold ${
                          item.known ? 'bg-evergreen text-white' : 'border border-line text-muted-ink'
                        }`}
                      >
                        {item.known ? '✓' : '○'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-ink mb-0.5">
                          {item.label}
                        </span>
                        <span className={`truncate block ${item.known ? 'text-ink font-semibold' : 'text-muted-ink italic'}`}>
                          {item.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action button when ready */}
                <AnimatePresence>
                  {isReady && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-3 border-t border-line space-y-2"
                    >
                      <button
                        type="button"
                        onClick={handleCreateDraft}
                        disabled={creatingDraft}
                        className="w-full py-2.5 px-4 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        {creatingDraft ? 'Generating proposal...' : 'Review proposed plan →'}
                      </button>
                      <p className="text-[10px] text-muted-ink text-center">
                        You review and adjust everything before activation.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* Collapsed Button */
              <button
                type="button"
                onClick={() => handleToggleNotes(true)}
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-white border border-line text-xs font-semibold text-ink shadow-xs hover:border-evergreen/40 hover:bg-cream transition-all sticky top-6 cursor-pointer"
                title="Expand Nora's notes"
              >
                <ChevronLeft className="w-4 h-4 text-evergreen" />
                <span className="text-evergreen">✦</span>
                <span>Notes ({knownCount}/{understoodItems.length})</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Start Over Confirmation Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
          onClick={() => setShowResetModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-line p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-ink mb-2">Start over?</h3>
            <p className="text-xs text-muted-ink leading-relaxed mb-6">
              This will clear the details Nora gathered during this consultation and start a fresh session.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl bg-cream hover:bg-line text-ink text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Start over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GetStartedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-sand flex items-center justify-center">
          <div className="text-center text-xs text-muted-ink">Loading consultation...</div>
        </div>
      }
    >
      <GetStartedContent />
    </Suspense>
  );
}
