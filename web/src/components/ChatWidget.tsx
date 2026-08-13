'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* ── Types ───────────────────────────────────────────────────────────────── */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

/* ── Welcome message shown when the chat first opens ────────────────────── */

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm your ScholarHub advisor. Ask me about scholarships — I can help you find opportunities by country, field of study, funding type, or deadline. What are you looking for?",
};

/* ── Icons ───────────────────────────────────────────────────────────────── */

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

/* ── Typing indicator ────────────────────────────────────────────────────── */

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

/* ── Message bubble ──────────────────────────────────────────────────────── */

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="mr-2 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal text-white text-xs font-bold">
          S
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-teal text-white'
            : 'rounded-bl-sm bg-muted text-foreground'
        }`}
      >
        {msg.streaming && msg.content === '' ? (
          <TypingDots />
        ) : isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-a:text-teal prose-strong:text-foreground">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-teal underline hover:opacity-80"
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main widget ─────────────────────────────────────────────────────────── */

function readCountryCookie(): string | null {
  if (typeof document === 'undefined') return null;
  return (
    document.cookie
      .split('; ')
      .find((c) => c.startsWith('sh_country='))
      ?.split('=')[1] ?? null
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userCountryIso, setUserCountryIso] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Read geo cookie once on mount
  useEffect(() => {
    setUserCountryIso(readCountryCookie());
  }, []);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    const botId = crypto.randomUUID();
    const botMsg: Message = { id: botId, role: 'assistant', content: '', streaming: true };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
    setLoading(true);

    const history = [...messages, userMsg]
      .filter((m) => m.id !== 'welcome' || m.role !== 'assistant')
      .map(({ role, content }) => ({ role, content }));

    abortRef.current = new AbortController();
    const timeoutId = setTimeout(() => abortRef.current?.abort(), 40_000);

    try {
      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, userCountryIso }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.text().catch(() => 'Request failed');
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId ? { ...m, content: err, streaming: false } : m,
          ),
        );
        return;
      }

      // Read streamed plain-text tokens
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snap = accumulated;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId ? { ...m, content: snap, streaming: true } : m,
          ),
        );
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId ? { ...m, content: accumulated, streaming: false } : m,
        ),
      );
    } catch (err: unknown) {
      const errName = (err as Error)?.name;
      const msg =
        errName === 'AbortError'
          ? 'Request timed out. Please try again.'
          : 'Sorry, something went wrong. Please try again.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId ? { ...m, content: msg, streaming: false } : m,
        ),
      );
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close scholarship advisor' : 'Open scholarship advisor'}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-teal text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 md:bottom-6 md:right-6"
        style={{ boxShadow: '0 4px 24px rgba(20,184,166,.45)' }}
      >
        {open ? (
          <CloseIcon className="h-5 w-5" />
        ) : (
          <ChatIcon className="h-5 w-5" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-end md:inset-auto md:bottom-24 md:right-5 md:h-[560px] md:w-[380px] md:right-6"
          role="dialog"
          aria-label="ScholarHub Advisor"
          aria-modal="true"
        >
          <div className="flex h-full w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl md:rounded-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border bg-teal/10 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-white text-xs font-bold">
                S
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground leading-tight">ScholarHub Advisor</p>
                <p className="text-[11px] text-muted-foreground">
                  {loading ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
                      Thinking…
                    </span>
                  ) : (
                    'Powered by Llama 3.1 · NVIDIA NIM'
                  )}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4">
              {messages.map((msg) => (
                <Bubble key={msg.id} msg={msg} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border px-3 py-2.5">
              <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-teal">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about scholarships…"
                  disabled={loading}
                  className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                  style={{ minHeight: '24px', maxHeight: '120px' }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  aria-label="Send"
                  className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <SendIcon className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1.5 text-center font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                AI advice only · verify all details with official sources
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
