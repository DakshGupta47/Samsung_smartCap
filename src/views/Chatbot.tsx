import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertTriangle, Sparkles, Zap, Home, Award, Box, RotateCcw } from 'lucide-react';
import { ragQuery, RAGResult } from '../utils/ragEngine';

// ── Types ──────────────────────────────────────────────────
type MessageRole = 'user' | 'bot' | 'system';

interface Message {
  id: string;
  role: MessageRole;
  text: string;
  isOffTopic?: boolean;
  sources?: string[];
  timestamp: Date;
}

// ── Quick-prompt suggestions ─────────────────────────────
const SUGGESTIONS = [
  { label: 'What appliances are connected?', icon: Home },
  { label: 'How do I earn XP?', icon: Award },
  { label: 'How do I enable night mode?', icon: Box },
  { label: 'Which device uses the most power?', icon: Zap },
  { label: 'How can I save on my energy bill?', icon: Sparkles },
];

// ── Welcome message ───────────────────────────────────────
const WELCOME: Message = {
  id: 'welcome',
  role: 'bot',
  text: "Hi! I'm **Galaxy.AI** ⚡ — your personal energy assistant.\n\nI can help you with anything about the SmartCap app: appliance controls, energy stats, automations, 3D home view, rewards, and more.\n\nWhat would you like to know?",
  timestamp: new Date(),
};

// ── Helpers ───────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/** Convert **bold** markdown to <strong> spans */
function parseMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // Handle newlines
    return part.split('\n').map((line, j) => (
      <React.Fragment key={`${i}-${j}`}>
        {j > 0 && <br />}
        {line}
      </React.Fragment>
    ));
  });
}

// ── Component ─────────────────────────────────────────────
export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setSuggestionsVisible(false);

    // Add user message
    const userMsg: Message = {
      id: uid(),
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate a short "thinking" delay for natural UX
    const delay = 600 + Math.random() * 700;
    setTimeout(() => {
      const result: RAGResult = ragQuery(trimmed);
      const botMsg: Message = {
        id: uid(),
        role: 'bot',
        text: result.answer,
        isOffTopic: result.isOffTopic,
        sources: result.sources.map((s) => s.title),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, delay);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    setMessages([WELCOME]);
    setSuggestionsVisible(true);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex items-center justify-between pt-4 pb-4">
        <div className="inline-flex items-center gap-3 bg-[#2D3436] border-4 border-[#2D3436] rounded-2xl px-5 py-2 shadow-[0_6px_0_0_rgba(0,0,0,0.3)]">
          <div className="w-9 h-9 bg-[#3498DB] rounded-full border-2 border-white flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide uppercase leading-none">
              Galaxy.AI
            </h1>
            <span className="text-[10px] font-bold text-[#2ECC71] uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#2ECC71] rounded-full inline-block animate-pulse" />
              Online · RAG Powered
            </span>
          </div>
        </div>

        <button
          onClick={handleReset}
          title="Clear chat"
          className="w-12 h-12 bg-white border-4 border-[#2D3436] rounded-full flex items-center justify-center shadow-[0_6px_0_0_#2D3436] hover:translate-y-1 hover:shadow-[0_4px_0_0_#2D3436] active:translate-y-2 active:shadow-none transition-all"
        >
          <RotateCcw className="w-5 h-5 text-[#2D3436]" />
        </button>
      </header>

      {/* ── Message Area ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2 no-scrollbar">

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full border-3 border-[#2D3436] flex items-center justify-center shrink-0 shadow-[0_3px_0_0_#2D3436] ${
                msg.role === 'user' ? 'bg-[#3498DB]' : msg.isOffTopic ? 'bg-[#E74C3C]' : 'bg-[#2D3436]'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : msg.isOffTopic ? (
                <AlertTriangle className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[78%] rounded-3xl border-4 px-4 py-3 shadow-[0_5px_0_0] text-sm font-bold leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#3498DB] border-[#2D3436] text-white shadow-[#2D3436] rounded-br-md'
                  : msg.isOffTopic
                  ? 'bg-[#FFEAA7] border-[#E74C3C] text-[#856404] shadow-[#E74C3C] rounded-bl-md'
                  : 'bg-white border-[#2D3436] text-[#2D3436] shadow-[#2D3436] rounded-bl-md'
              }`}
            >
              {/* Off-topic warning tag */}
              {msg.isOffTopic && (
                <div className="flex items-center gap-1 mb-2 text-[10px] font-black uppercase text-[#E74C3C]">
                  <AlertTriangle className="w-3 h-3" />
                  Out of scope
                </div>
              )}
              <p className="whitespace-pre-line">{parseMarkdown(msg.text)}</p>

              {/* Source pills */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {msg.sources.map((src) => (
                    <span
                      key={src}
                      className="bg-[#F1F2F6] border-2 border-[#2D3436] px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-slate-500"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <p className={`text-[9px] mt-1 font-bold ${msg.role === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-[#2D3436] bg-[#2D3436] flex items-center justify-center shadow-[0_3px_0_0_#2D3436]">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border-4 border-[#2D3436] rounded-3xl rounded-bl-md px-5 py-4 shadow-[0_5px_0_0_#2D3436]">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-[#3498DB] rounded-full inline-block"
                    style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Quick Suggestions ───────────────────────────── */}
      {suggestionsVisible && (
        <div className="py-3">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest pl-1">
            Try asking...
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => sendMessage(label)}
                className="flex items-center gap-2 bg-white border-4 border-[#2D3436] rounded-full px-3 py-1.5 text-xs font-black text-[#2D3436] shadow-[0_4px_0_0_#2D3436] hover:translate-y-0.5 hover:shadow-[0_2px_0_0_#2D3436] active:translate-y-1 active:shadow-none transition-all"
              >
                <Icon className="w-3.5 h-3.5 text-[#3498DB]" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input Bar ───────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-3 items-center pt-3 border-t-4 border-dashed border-[#2D3436] mt-1"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your appliances, energy, automations…"
          disabled={isTyping}
          className="flex-1 bg-white border-4 border-[#2D3436] rounded-full px-4 py-3 text-sm font-bold text-[#2D3436] placeholder-slate-400 shadow-[0_5px_0_0_#2D3436] focus:outline-none focus:shadow-[0_3px_0_0_#2D3436] focus:translate-y-0.5 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="w-14 h-14 bg-[#3498DB] border-4 border-[#2D3436] rounded-full flex items-center justify-center shadow-[0_6px_0_0_#2D3436] hover:translate-y-1 hover:shadow-[0_4px_0_0_#2D3436] active:translate-y-2 active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5 text-white" />
        </button>
      </form>

      {/* ── Guardrail disclaimer ─────────────────────────── */}
      <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-2">
        Galaxy.AI · Only answers about this app · Guardrails active
      </p>

      {/* Dot-bounce keyframes injected inline */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-6px); opacity: 1; }
        }
        .border-3 { border-width: 3px; }
      `}</style>
    </div>
  );
}
