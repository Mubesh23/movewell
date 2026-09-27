'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface AIAssistantProps {
  caseId: string;
  onPlanUpdated?: () => void;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  toolConfirmations?: string[];
  suggestionChip?: string;
}

function renderFormattedText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <div key={lineIdx} className="h-2" />;
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      return <hr key={lineIdx} className="my-3 border-stone-line" />;
    }

    // Markdown Headings
    if (trimmed.startsWith('#')) {
      const headingText = trimmed.replace(/^#+\s*/, '');
      return (
        <div
          key={lineIdx}
          className="font-serif font-bold text-charcoal mt-3 mb-1 text-sm tracking-tight"
        >
          {renderInlineFormatting(headingText)}
        </div>
      );
    }

    // Bullet points
    if (/^[\u2022\*\-]\s+/.test(trimmed)) {
      const bulletContent = trimmed.replace(/^[\u2022\*\-]\s+/, '');
      return (
        <div key={lineIdx} className="flex items-start gap-2 my-1 pl-1">
          <span className="text-forest font-bold select-none mt-0.5">&bull;</span>
          <div className="flex-1 text-charcoal leading-relaxed">{renderInlineFormatting(bulletContent)}</div>
        </div>
      );
    }

    return (
      <div key={lineIdx} className="my-0.5 leading-relaxed text-charcoal">
        {renderInlineFormatting(line)}
      </div>
    );
  });
}

function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*[\s\S]+?\*\*|\*[^\*\n]+?\*)/g);
  return parts.map((part, partIdx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={partIdx} className="font-semibold text-charcoal">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={partIdx} className="italic text-charcoal/90">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

export function openNoraWithPrompt(prompt?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-nora', { detail: { prompt } }));
  }
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ caseId, onPlanUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialWelcomeMessage: ChatMessage = {
    sender: 'ai',
    text: "Hi, I'm Nora.\n\nI can help you understand the plan, coordinate tasks, work through changes, and find relevant resources.\n\nWhat would you like help with?",
    suggestionChip: "What needs attention today?",
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`movewell_chat_${caseId}`);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
    return [initialWelcomeMessage];
  });

  // Sync state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && caseId) {
      try {
        localStorage.setItem(`movewell_chat_${caseId}`, JSON.stringify(messages));
      } catch (e) {
        console.error('Failed to save chat history:', e);
      }
    }
  }, [messages, caseId]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleClearHistory = () => {
    const defaultList = [initialWelcomeMessage];
    setMessages(defaultList);
    if (typeof window !== 'undefined' && caseId) {
      localStorage.removeItem(`movewell_chat_${caseId}`);
    }
  };

  const executePromptRef = useRef<(text: string) => Promise<void>>();

  const executePrompt = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    const userMessage: ChatMessage = { sender: 'user', text: promptText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    const conversationHistory = updatedMessages.slice(-12).map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
      text: m.text,
    }));

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          prompt: promptText,
          messages: conversationHistory,
        }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        const confirmations = (data.data.toolResults || [])
          .filter((tr: any) => tr.success && tr.toolName !== 'get_plan')
          .map((tr: any) => tr.message);

        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: data.data.message,
            toolConfirmations: confirmations.length > 0 ? confirmations : undefined,
          },
        ]);

        if (onPlanUpdated) {
          onPlanUpdated();
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: data.error || 'I had trouble processing that request. Please try again or ask another question.',
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'I had trouble reaching the coordination service. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  executePromptRef.current = executePrompt;

  useEffect(() => {
    const handleOpenNora = (e: any) => {
      setIsOpen(true);
      if (e?.detail?.prompt && executePromptRef.current) {
        executePromptRef.current(e.detail.prompt);
      }
    };
    window.addEventListener('open-nora', handleOpenNora);
    return () => window.removeEventListener('open-nora', handleOpenNora);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const userText = input;
    setInput('');
    await executePrompt(userText);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open Nora assistant"
        className="fixed bottom-18 md:bottom-6 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-forest text-surface shadow-lg hover:bg-forest-deep transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
      >
        <span className="w-5 h-5 rounded-full bg-surface/20 text-surface font-serif text-xs font-bold flex items-center justify-center">
          N
        </span>
        <span className="text-sm font-medium pr-0.5">Ask Nora</span>
      </button>
    );
  }

  return (
    <aside
      aria-label="Nora transition assistant panel"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-surface shadow-2xl border-l border-stone-line flex flex-col animate-in slide-in-from-right duration-200"
    >
      {/* Editorial Assistant Header */}
      <header className="px-5 py-4 border-b border-stone-line bg-surface/90 backdrop-blur-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-md bg-forest text-surface font-serif font-bold text-sm flex items-center justify-center tracking-tight">
            N
          </span>
          <div>
            <h3 className="font-serif font-bold text-sm text-charcoal leading-tight">
              Nora
            </h3>
            <p className="text-[11px] text-muted">
              MoveWell Transition Coordinator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClearHistory}
            title="Reset conversation"
            className="p-1.5 text-muted hover:text-charcoal rounded-md hover:bg-stone-subtle transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close assistant"
            className="p-1.5 text-muted hover:text-charcoal rounded-md hover:bg-stone-subtle transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages Feed */}
      <div className="p-5 flex-1 overflow-y-auto space-y-4 bg-canvas/40 text-sm">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={cn('flex flex-col', m.sender === 'user' ? 'items-end' : 'items-start')}
          >
            {m.sender === 'user' ? (
              <div className="max-w-[85%] px-4 py-2.5 rounded-xl bg-forest text-surface text-xs sm:text-sm font-medium leading-relaxed">
                {m.text}
              </div>
            ) : (
              <div className="max-w-[95%] text-xs sm:text-sm leading-relaxed space-y-1">
                <div className="text-charcoal">
                  {renderFormattedText(m.text)}
                </div>

                {/* Grounded Tool Confirmations */}
                {m.toolConfirmations && m.toolConfirmations.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {m.toolConfirmations.map((tc, tcIdx) => (
                      <div
                        key={tcIdx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-sage-subtle text-forest text-xs font-medium border border-sage-border/40"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{tc}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Action Chip */}
                {m.suggestionChip && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => executePrompt(m.suggestionChip!)}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest bg-surface hover:bg-forest/5 border border-forest/20 px-3 py-1.5 rounded-lg transition-colors text-left"
                    >
                      <span>Suggested action: {m.suggestionChip}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted pt-1">
            <span className="w-3.5 h-3.5 border-2 border-forest border-t-transparent rounded-full animate-spin shrink-0" />
            <span>Checking the plan…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <footer className="p-4 border-t border-stone-line bg-surface">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Nora or give an instruction..."
            className="flex-1 px-3.5 py-2.5 text-sm rounded-lg border border-stone-line bg-surface text-charcoal placeholder:text-muted/60 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
          />
          <Button
            type="submit"
            variant="default"
            size="default"
            disabled={loading || !input.trim()}
            className="h-10 px-3 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </footer>
    </aside>
  );
};
