'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import {
  Send,
  Sparkles,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { IntakeDraft } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  bulletPoints?: string[];
  isConfirmation?: boolean;
}

export default function GetStartedPage() {
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
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

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
          bulletPoints: data.isReady ? data.readiness?.summaryBulletPoints : undefined,
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

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col justify-between max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
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
                  AI Planning Assistant
                </span>
              </div>
              <p className="text-xs text-muted-ink">
                Conversational consultation · We&apos;ll quietly organize what you share into a plan
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

        {/* Message Thread */}
        <div className="flex-1 space-y-4 overflow-y-auto mb-6 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-sm leading-relaxed ${
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

        {/* Transition Out of Chat when Ready */}
        {isReady ? (
          <div className="bg-white p-5 rounded-2xl border border-line shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-sage text-evergreen flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <div>
                <strong className="text-sm font-bold text-ink block">
                  I have enough information to build your proposed plan.
                </strong>
                <span className="text-xs text-muted-ink">
                  You will be able to review, edit, and adjust details before starting.
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 border-t border-line">
              <button
                type="button"
                onClick={handleCreateDraft}
                disabled={creatingDraft}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-evergreen hover:bg-evergreen-dark text-white font-semibold text-sm transition-all shadow-sm"
              >
                <span>{creatingDraft ? 'Building proposal...' : 'Review proposed plan'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Composer Input */
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
                placeholder="Share your parent's situation, timing, or answers..."
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
              <span>Nora keeps answers brief and asks one question at a time.</span>
              <button
                type="button"
                onClick={() =>
                  handleSendMessage(
                    'My mom Maria (78) fell and broke her hip. She is in the hospital, discharge is expected Thursday. Her house is two-story and bedroom is upstairs. Her sister Jennifer is in Houston with her (77004), while I am coordinating from Chicago. Let us leave the budget open for now.'
                  )
                }
                className="text-evergreen hover:underline font-medium"
              >
                Fill with sample scenario
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
