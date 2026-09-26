'use client';

import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, CheckCircle2, ChevronUp } from 'lucide-react';

interface AIAssistantProps {
  caseId: string;
  onPlanUpdated?: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ caseId, onPlanUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    { sender: 'user' | 'ai'; text: string; toolConfirmations?: string[]; suggestionChip?: string }[]
  >([
    {
      sender: 'ai',
      text: "Hello Sarah! I'm your MoveWell transition assistant. Tell me what needs changing (e.g., 'Jennifer can handle packing' or 'Set budget to $5,000').\n\n👉 Next recommended step: Confirming Maria's safe discharge destination (Nov 1).",
      suggestionChip: 'Confirm discharge destination',
    },
  ]);

  const executePrompt = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: promptText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, prompt: promptText }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        const confirmations = (data.data.toolResults || [])
          .filter((tr: any) => tr.success)
          .map((tr: any) => tr.message);

        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: data.data.message,
            toolConfirmations: confirmations,
          },
        ]);

        if (onPlanUpdated) {
          onPlanUpdated();
        }
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
        className="fixed bottom-20 md:bottom-6 right-6 z-50 bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs py-3 px-4 rounded-full shadow-2xl transition flex items-center space-x-2 border-2 border-white/20 animate-bounce"
      >
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>Ask MoveWell AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden max-h-[500px]">
      {/* Header */}
      <div className="bg-brand-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-brand-800 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h4 className="font-bold text-xs">MoveWell AI Assistant</h4>
            <p className="text-[10px] text-brand-200">Controlled tool orchestration</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-brand-200 hover:text-white">
          <X className="w-4 h-4" />
        </button>
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
              {m.text}
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
          placeholder="e.g. Jennifer will handle packing..."
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
