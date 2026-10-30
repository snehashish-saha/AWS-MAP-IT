import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, MapIntent } from '../types';
import { Bot, Send, Sparkles, X, ChevronRight, CheckCircle2, Zap } from 'lucide-react';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  onApplyIntent: (intent: MapIntent) => void;
  isCustomKeySet: boolean;
}

const SAMPLE_PROMPTS = [
  'Show magnitude 4+ earthquakes from the last 7 days around Japan',
  'Highlight the strongest 5 events',
  'Zoom to California San Andreas fault',
  'Inspect weather at current location',
  'Explain the selected event',
  'Reset filters to global overview',
];

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading,
  onApplyIntent,
  isCustomKeySet,
}) => {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <aside
      className="fixed top-14 right-0 bottom-14 md:bottom-16 w-80 sm:w-96 bg-orbital-surface/95 backdrop-blur-md border-l border-orbital-border z-20 flex flex-col shadow-2xl transition-all duration-300"
      aria-label="TerraPulse AI Copilot"
    >
      {/* Header */}
      <div className="h-12 border-b border-orbital-border px-4 flex items-center justify-between select-none">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-orbital-teal/15 text-orbital-teal">
            <Bot size={16} />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-orbital-text">AI Earth Copilot</span>
              <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-orbital-bg text-orbital-teal border border-orbital-teal/30">
                Gemini 3.1 Flash-Lite
              </span>
            </div>
            <div className="text-[10px] text-orbital-muted font-mono flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              <span>{isCustomKeySet ? 'Live Cloud API' : 'Deterministic Mode + Gemini Schema'}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-orbital-muted hover:text-orbital-text p-1 rounded-md transition hover:bg-orbital-elevated"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs font-sans">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-xl px-3 py-2.5 shadow-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-orbital-teal text-[#070B12] font-medium rounded-tr-none'
                  : 'bg-orbital-elevated border border-orbital-border text-orbital-text rounded-tl-none'
              }`}
            >
              {msg.text}

              {/* Render Structured Map Intent Card if present */}
              {msg.intent && (
                <div className="mt-2.5 pt-2 border-t border-orbital-border/60 text-[11px] font-mono space-y-1.5">
                  <div className="flex items-center justify-between text-orbital-teal font-semibold">
                    <span className="flex items-center space-x-1">
                      <Zap size={12} />
                      <span>Action: {msg.intent.action}</span>
                    </span>
                    <CheckCircle2 size={12} className="text-emerald-400" />
                  </div>
                  <div className="text-orbital-muted text-[10px] space-y-0.5 bg-orbital-bg/60 p-1.5 rounded border border-orbital-border">
                    {msg.intent.timeRange && <div>• Time Window: <span className="text-orbital-text font-bold">{msg.intent.timeRange}</span></div>}
                    {msg.intent.minMagnitude !== undefined && <div>• Min Magnitude: <span className="text-orbital-coral font-bold">≥ M{msg.intent.minMagnitude}</span></div>}
                    {msg.intent.region && <div>• Region: <span className="text-orbital-text uppercase font-bold">{msg.intent.region}</span></div>}
                    {msg.intent.topN && <div>• Top Events: <span className="text-orbital-amber font-bold">{msg.intent.topN}</span></div>}
                    {msg.intent.layer && <div>• Active Layer: <span className="text-orbital-teal font-bold">{msg.intent.layer}</span></div>}
                  </div>
                  <button
                    onClick={() => onApplyIntent(msg.intent!)}
                    className="w-full mt-1 bg-orbital-teal/15 hover:bg-orbital-teal/25 text-orbital-teal border border-orbital-teal/40 rounded py-1 text-center font-medium transition flex items-center justify-center space-x-1"
                  >
                    <span>Re-apply to Map</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>
            <span className="text-[9px] text-orbital-muted/60 font-mono mt-1 px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 bg-orbital-elevated border border-orbital-border px-3 py-2 rounded-lg text-orbital-muted text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-orbital-teal animate-ping" />
            <span>Analyzing query & resolving spatial bounds...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="border-t border-orbital-border p-2 bg-orbital-bg/50">
        <div className="text-[10px] font-mono text-orbital-muted uppercase mb-1.5 px-1 flex items-center space-x-1">
          <Sparkles size={11} className="text-orbital-amber" />
          <span>Verified Map Prompts</span>
        </div>
        <div className="flex overflow-x-auto gap-1.5 pb-1 no-scrollbar">
          {SAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(prompt)}
              className="text-[10px] text-orbital-muted hover:text-orbital-teal bg-orbital-elevated hover:border-orbital-teal/50 border border-orbital-border rounded-md px-2 py-1 whitespace-nowrap transition flex-shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-orbital-border bg-orbital-surface">
        <div className="flex items-center space-x-2 bg-orbital-bg border border-orbital-border rounded-lg px-2.5 py-1.5 focus-within:border-orbital-teal transition">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot (e.g. 'Zoom to Japan & show M5+')..."
            className="flex-1 bg-transparent text-xs text-orbital-text placeholder-orbital-muted/60 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-1 rounded bg-orbital-teal text-[#070B12] hover:brightness-110 disabled:opacity-40 transition"
          >
            <Send size={13} />
          </button>
        </div>
        <div className="flex justify-between items-center text-[9px] text-orbital-muted font-mono mt-1.5 px-1">
          <span>Operates the map deterministically</span>
          <span>No fabricated stats</span>
        </div>
      </form>
    </aside>
  );
};
