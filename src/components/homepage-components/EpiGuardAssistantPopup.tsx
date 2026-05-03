"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bot, Loader2, Send, Sparkles, X, ShieldAlert, Plus } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────── */

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type RenderBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hello! I’m EpiGuard. I can help with health and disease-related questions only. Ask me about symptoms, prevention, precautions, or when to seek medical care.",
  createdAt: new Date().toISOString(),
};

const SUGGESTIONS = [
  "How can I prevent dengue?",
  "What are early leptospirosis symptoms?",
  "When should I seek medical help for a fever?",
];

async function readStream(response: Response, onDelta: (chunk: string) => void) {
  if (!response.body) throw new Error("Empty stream");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (!trimmed.startsWith("data: ")) continue;

      try {
        const payload = JSON.parse(trimmed.slice(6)) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const chunk = payload.choices?.[0]?.delta?.content ?? "";
        if (chunk) onDelta(chunk);
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

function parseMessageBlocks(content: string): RenderBlock[] {
  const blocks: RenderBlock[] = [];
  const lines = content.replace(/\r/g, "").split("\n");
  const paragraphBuffer: string[] = [];
  const listBuffer: string[] = [];

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    blocks.push({ type: "paragraph", text: paragraphBuffer.join(" ").trim() });
    paragraphBuffer.length = 0;
  };

  const flushList = () => {
    if (!listBuffer.length) return;
    blocks.push({ type: "list", items: [...listBuffer] });
    listBuffer.length = 0;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const bulletMatch = line.match(/^(?:[-*•]|\d+\.)\s+(.+)$/);

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (bulletMatch?.[1]) {
      flushParagraph();
      listBuffer.push(bulletMatch[1].replace(/[*`_]/g, "").trim());
      continue;
    }

    flushList();
    paragraphBuffer.push(line.replace(/[*`_]/g, "").trim());
  }

  flushParagraph();
  flushList();
  return blocks.filter((b) => (b.type === "paragraph" ? Boolean(b.text) : b.items.length > 0));
}

function FormattedMessage({ content }: { content: string }) {
  const blocks = parseMessageBlocks(content);
  if (!blocks.length) return null;

  return (
    <div className="space-y-2">
      {blocks.map((block, index) =>
        block.type === "paragraph" ? (
          <p key={`p-${index}`} className="whitespace-pre-wrap">
            {block.text}
          </p>
        ) : (
          <ul key={`l-${index}`} className="list-disc space-y-1 pl-5">
            {block.items.map((item, itemIndex) => (
              <li key={`i-${index}-${itemIndex}`}>{item}</li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={`flex items-end gap-2.5 ${isAssistant ? "justify-start" : "justify-end"}`}>
      {isAssistant && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm bg-white/20 backdrop-blur-md border border-white/30 text-white">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm backdrop-blur-md border ${isAssistant ? "rounded-bl-sm bg-white/10 border-white/20 text-white/95" : "rounded-br-sm bg-blue-500/40 border-blue-400/30 text-white"}`}
      >
        <FormattedMessage content={message.content} />
        <p className="mt-1.5 text-[10px] text-right opacity-60 text-white">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {!isAssistant && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm bg-emerald-500/40 backdrop-blur-md border border-emerald-400/30 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

export default function EpiGuardAssistantPopup() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingReply, setStreamingReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Auto-open the assistant once per session (short delay) so it's visible on the homepage
  useEffect(() => {
    try {
      const seen = sessionStorage.getItem("epiguard_seen");
      if (seen) return;
      const t = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem("epiguard_seen", "1");
      }, 2500);
      return () => clearTimeout(t);
    } catch {
      // sessionStorage may be unavailable in some contexts — ignore
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingReply, sending, open]);

  const resetChat = useCallback(() => {
    setMessages([WELCOME]);
    setInput("");
    setStreamingReply("");
    setError(null);
  }, []);

  const handleSend = useCallback(
    async (promptText?: string) => {
      const text = (promptText ?? input).trim();
      if (!text || sending) return;

      const userMsg: ChatMessage = { role: "user", content: text, createdAt: new Date().toISOString() };
      const nextHistory = [...messages, userMsg];

      setMessages(nextHistory);
      setInput("");
      setStreamingReply("");
      setSending(true);
      setError(null);

      try {
        const res = await fetch("/api/groq/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextHistory.map(({ role, content }) => ({ role, content })) }),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setError(data.error ?? "Failed to get response");
          return;
        }

        let replyText = "";
        await readStream(res, (chunk) => {
          replyText += chunk;
          setStreamingReply(replyText);
        });

        const finalReply = replyText.trim() || "I could not generate a response. Please try again.";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: finalReply, createdAt: new Date().toISOString() },
        ]);
        setStreamingReply("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Chat request failed");
      } finally {
        setSending(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [input, messages, sending]
  );

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[99] sm:bottom-6 sm:right-6">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto flex items-center gap-3 rounded-full border px-4 py-3 shadow-xl transition hover:-translate-y-0.5 bg-white/10 backdrop-blur-2xl border-white/20 text-white"
          aria-label="Open EpiGuard assistant"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
              <Bot className="h-4.5 w-4.5" />
          </div>
          <div className="text-left hidden sm:block pr-1">
              <p className="text-sm font-semibold leading-none">EpiGuard Assistant</p>
              <p className="mt-1 text-[11px] text-white/75">Ask health questions</p>
          </div>
        </button>
      ) : (
        <div
          className="pointer-events-auto flex h-[calc(100vh-6rem)] sm:h-[640px] max-h-[calc(100vh-6rem)] w-[calc(100vw-2rem)] max-w-[24rem] flex-col overflow-hidden rounded-2xl border shadow-2xl sm:w-[24rem] md:w-[26rem] origin-bottom-right transition-all animate-fade-in-scale bg-white/10 backdrop-blur-2xl border-white/20"
        >
          <div
            className="flex items-center justify-between gap-3 border-b px-4 py-3 border-white/20 bg-white/5"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm bg-white/20 border border-white/30 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  EpiGuard AI
                </p>
                <p className="text-[10px] text-white/60">
                  Health assistant · session only
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetChat}
                className="rounded-lg p-2 transition hover:bg-white/10 text-white/70 hover:text-white"
                title="New chat"
                aria-label="New chat"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.setItem("epiguard_seen", "1");
                  } catch {}
                  setOpen(false);
                }}
                className="rounded-lg p-2 transition hover:bg-white/10 text-white/70 hover:text-white"
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative flex-1 min-h-0 w-full">
            <div className="absolute inset-0 overflow-y-auto px-4 py-4 space-y-4 bg-transparent custom-scrollbar">
            {messages.map((message, index) => (
              <Bubble key={`${message.role}-${index}`} message={message} />
            ))}

            {streamingReply && (
              <div className="flex items-end gap-2.5 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm bg-white/20 backdrop-blur-md border border-white/30 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div
                  className="max-w-[82%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed shadow-sm bg-white/10 backdrop-blur-md border border-white/20 text-white/95"
                >
                  <FormattedMessage content={streamingReply} />
                  <Loader2 className="mt-1.5 h-3 w-3 animate-spin opacity-40" />
                </div>
              </div>
            )}

            {sending && !streamingReply && (
              <div className="flex items-end gap-2.5 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm bg-white/20 backdrop-blur-md border border-white/30 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div
                  className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm px-4 py-4 text-xs bg-white/10 backdrop-blur-md border border-white/20 text-white/70 h-[38px]"
                >
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}

              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t px-4 py-3 space-y-3 border-white/20 bg-white/5">
            {error && (
              <div
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs bg-red-500/20 border-red-500/30 text-red-100"
              >
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {messages.length === 1 && !sending && !streamingReply && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void handleSend(suggestion)}
                    className="rounded-full border px-3 py-1.5 text-xs font-medium transition hover:bg-white/20 bg-white/10 border-white/20 text-white/90 shadow-sm"
                    disabled={sending}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Ask about symptoms, prevention, or health guidance…"
                className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-white/40 focus:ring-1 focus:ring-white/40 rounded-xl px-4 py-2 outline-none text-sm transition-all shadow-inner"
                disabled={sending}
                aria-label="EpiGuard assistant input"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending || !input.trim()}
                className="flex h-[2.375rem] w-[2.375rem] shrink-0 items-center justify-center rounded-xl shadow-sm transition hover:opacity-90 disabled:opacity-40 bg-white/20 border border-white/30 text-white backdrop-blur-sm"
                aria-label="Send message"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

