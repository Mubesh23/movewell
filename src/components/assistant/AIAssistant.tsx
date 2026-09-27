'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Send, X, Bot, CheckCircle2, Trash2 } from 'lucide-react';

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

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      return <hr key={lineIdx} className="my-2 border-stone-200" />;
    }

    // Markdown Headings: ### Heading, ## Heading, # Heading
    if (trimmed.startsWith('#')) {
      const headingText = trimmed.replace(/^#+\s*/, '');
      return (
        <div key={lineIdx} className="font-bold text-stone-900 mt-2.5 mb-1 text-[11px] uppercase tracking-wider text-brand-900">
          {renderInlineFormatting(headingText)}
        </div>
      );
    }

    return (
      <React.Fragment key={lineIdx}>
        {renderInlineFormatting(line)}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, partIdx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={partIdx} className="font-bold text-stone-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <span key={partIdx} className="font-semibold text-brand-900 bg-brand-50 px-1 py-0.5 rounded border border-brand-200/60 text-[11px]">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ caseId, onPlanUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const initialWelcomeMessage: ChatMessage = {
    sender: 'ai',
    text: "Hello Sarah! I'm Nora, your MoveWell transition companion. I can help coordinate tasks, update budgets, or search verified Houston resources.\n\ne.g., 'Set budget to $5,000' or 'Jennifer will handle packing'.",
    suggestionChip: 'Set budget to $5,000',
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

  // Sync state to localStorage whenever messages change
  useEffect(() => {
    if (typeof window !== 'undefined' && caseId) {
      try {
        localStorage.setItem(`movewell_chat_${caseId}`, JSON.stringify(messages));
      } catch (e) {
        console.error('Failed to save chat history:', e);
      }
    }
  }, [messages, caseId]);

  const handleClearHistory = () => {
    const defaultList = [initialWelcomeMessage];
    setMessages(defaultList);
    if (typeof window !== 'undefined' && caseId) {
      localStorage.removeItem(`movewell_chat_${caseId}`);
    }
  };

  const executePrompt = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    const userMessage: ChatMessage = { sender: 'user', text: promptText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    // Bounded recent message window (last 12 messages)
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
            text: data.error || 'Sorry, I encountered an error processing your request.',
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Sorry, I encountered an error processing your request.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

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
        className="fixed bottom-20 md:bottom-6 right-6 z-50 bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs py-3 px-4 rounded-full shadow-2xl transition flex items-center space-x-2 border-2 border-white/20"
      >
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>Ask Nora AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden max-h-[500px]">
      {/* Header */}
      <div className="bg-brand-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-brand-800 flex items-center justify-center font-bold text-amber-300 text-xs">
            N
          </div>
          <div>
            <h4 className="font-bold text-xs">Nora &bull; MoveWell Companion</h4>
            <p className="text-[10px] text-brand-200">Transition Assistant</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleClearHistory}
            title="Clear Chat History"
            className="text-brand-200 hover:text-white transition p-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsOpen(false)} className="text-brand-200 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-sand-50/50 min-h-[220px]">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs ${
                m.sender === 'user'
                  ? 'bg-brand-900 text-white rounded-br-none'
                  : 'bg-white border border-stone-200 text-stone-900 rounded-bl-none shadow-xs'
              }`}
            >
              {renderFormattedText(m.text)}
            </div>

            {/* Tool confirmation badges */}
            {m.toolConfirmations && m.toolConfirmations.length > 0 && (
              <div className="mt-1 space-y-1 max-w-[85%]">
                {m.toolConfirmations.map((tc, tcIdx) => (
                  <div
                    key={tcIdx}
                    className="flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span>{tc}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Action Suggestion Chip */}
            {m.suggestionChip && (
              <button
                type="button"
                onClick={() => executePrompt(m.suggestionChip!)}
                disabled={loading}
                className="mt-1.5 text-[11px] font-bold text-brand-900 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1.5 rounded-full transition flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3 text-brand-700" />
                <span>Quick do: {m.suggestionChip}</span>
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-xs text-stone-400 font-medium">
            <Bot className="w-4 h-4 animate-spin text-brand-700" />
            <span>Thinking &amp; executing tools...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-stone-200 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Nora (e.g. Set budget to $5,000)..."
          className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-brand-800"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-brand-900 hover:bg-brand-800 text-white p-2 rounded-xl transition disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
