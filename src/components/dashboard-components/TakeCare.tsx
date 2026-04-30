"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
    Bot,
    HeartPulse,
    Send,
    Loader2,
    Trash2,
    TriangleAlert,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { account } from "@/lib/appwrite";

/* ── Types ─────────────────────────────────────────────────────────── */

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt?: string;
};

function uid() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const WELCOME: ChatMessage = {
    id: "welcome",
    role: "assistant",
    content:
        "Hello! I'm EpiGuard, your personal health assistant for EpiLanka.\n\nYou can ask me about:\n- Disease symptoms and prevention\n- Mosquito-borne or waterborne disease risks\n- When to seek medical help\n- Public health precautions\n\nI'm only able to help with health and disease-related questions.",
};

const SUGGESTIONS = [
    "How do I prevent dengue fever?",
    "What are early symptoms of leptospirosis?",
    "When should I go to hospital for a fever?",
    "How to protect my family from mosquito-borne diseases?",
];

type RenderBlock =
    | { type: "paragraph"; text: string }
    | { type: "list"; items: string[] };

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
        const bulletMatch = line.match(/^(?:[-*\u2022]|\d+\.)\s+(.+)$/);

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

/* ── Stream reader ──────────────────────────────────────────────────── */

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
            const t = line.trim();
            if (!t || t === "data: [DONE]") continue;
            if (!t.startsWith("data: ")) continue;
            try {
                const payload = JSON.parse(t.slice(6)) as {
                    choices?: Array<{ delta?: { content?: string } }>;
                };
                const chunk = payload.choices?.[0]?.delta?.content ?? "";
                if (chunk) onDelta(chunk);
            } catch {
                // skip bad chunks
            }
        }
    }
}

/* ── Message bubble ─────────────────────────────────────────────────── */

function Bubble({ message }: { message: ChatMessage }) {
    const isAssistant = message.role === "assistant";
    return (
        <div className={`flex items-end gap-2.5 ${isAssistant ? "justify-start" : "justify-end"}`}>
            {isAssistant && (
                <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm"
                    style={{ background: "var(--color-primary)", color: "#fff" }}
                >
                    <Bot className="h-4 w-4" />
                </div>
            )}

            <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    isAssistant ? "rounded-bl-sm" : "rounded-br-sm"
                }`}
                style={
                    isAssistant
                        ? {
                              background: "var(--dash-card-bg)",
                              border: "1px solid var(--dash-card-border)",
                              color: "var(--dash-text-primary)",
                          }
                        : {
                              background: "var(--color-primary)",
                              color: "#ffffff",
                          }
                }
            >
                <FormattedMessage content={message.content} />
                {message.createdAt && (
                    <p
                        className="mt-1.5 text-[10px] opacity-50 text-right"
                        style={{ color: isAssistant ? "var(--dash-text-muted)" : "#fff" }}
                    >
                        {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                )}
            </div>

            {!isAssistant && (
                <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm"
                    style={{ background: "var(--color-secondary)", color: "#fff" }}
                >
                    <HeartPulse className="h-4 w-4" />
                </div>
            )}
        </div>
    );
}

/* ── Main component ─────────────────────────────────────────────────── */

export default function TakeCare() {
    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [streamingReply, setStreamingReply] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [clearingHistory, setClearingHistory] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const refreshServerJwtCookie = useCallback(async () => {
        try {
            const jwtObj = await account.createJWT();
            const res = await fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ jwt: jwtObj.jwt }),
            });
            return res.ok;
        } catch {
            return false;
        }
    }, []);

    const fetchChatHistoryApi = useCallback(
        async (init?: RequestInit) => {
            const baseInit: RequestInit = { ...init, credentials: "include" };
            let res = await fetch("/api/chat-history", baseInit);
            if (res.status !== 401) return res;

            const refreshed = await refreshServerJwtCookie();
            if (!refreshed) return res;

            res = await fetch("/api/chat-history", baseInit);
            return res;
        },
        [refreshServerJwtCookie]
    );

    const persistTurn = useCallback(async (userMessage: string, assistantMessage: string) => {
        const res = await fetchChatHistoryApi({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userMessage, assistantMessage }),
        });

        if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(data.error ?? "Failed to save chat history");
        }
    }, [fetchChatHistoryApi]);

    /* ── Load history on mount ───────────────────────────────────────── */
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchChatHistoryApi({ cache: "no-store" });
                if (res.status === 401) return;
                if (!res.ok) return;
                const data = (await res.json()) as { messages: Array<{ role: string; content: string; createdAt?: string }> };
                if (data.messages.length > 0) {
                    setMessages([
                        WELCOME,
                        ...data.messages
                            .filter((m) => m.role === "user" || m.role === "assistant")
                            .map((m) => ({
                                id: uid(),
                                role: m.role as "user" | "assistant",
                                content: m.content,
                                createdAt: m.createdAt,
                            })),
                    ]);
                }
            } catch {
                // History load failing is non-fatal — just use the welcome message
            } finally {
                setHistoryLoading(false);
            }
        };
        void load();
    }, [fetchChatHistoryApi]);

    /* ── Auto-scroll ─────────────────────────────────────────────────── */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, streamingReply, sending]);

    /* ── Send message ────────────────────────────────────────────────── */
    const handleSend = useCallback(
        async (promptText?: string) => {
            const text = (promptText ?? input).trim();
            if (!text || sending) return;

            const userMsg: ChatMessage = { id: uid(), role: "user", content: text, createdAt: new Date().toISOString() };
            const history = [...messages, userMsg].filter((m) => m.id !== "welcome").map(({ role, content }) => ({ role, content }));

            setMessages((prev) => [...prev, userMsg]);
            setInput("");
            setStreamingReply("");
            setSending(true);
            setError(null);

            try {
                const res = await fetch("/api/groq/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ messages: history }),
                });

                if (!res.ok) {
                    const data = (await res.json().catch(() => ({}))) as { error?: string };
                    setError(data.error ?? "Failed to get response");
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: uid(),
                            role: "assistant",
                            content: "I couldn't answer that right now. Please try again in a moment.",
                            createdAt: new Date().toISOString(),
                        },
                    ]);
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
                    { id: uid(), role: "assistant", content: finalReply, createdAt: new Date().toISOString() },
                ]);
                try {
                    await persistTurn(text, finalReply);
                } catch {
                    setError("Reply sent, but chat history could not be saved. Please refresh and try again.");
                }
                setStreamingReply("");
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Chat request failed";
                setError(msg);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: uid(),
                        role: "assistant",
                        content: "I couldn't answer that right now. Please try again in a moment.",
                        createdAt: new Date().toISOString(),
                    },
                ]);
                setStreamingReply("");
            } finally {
                setSending(false);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        },
        [input, messages, persistTurn, sending]
    );

    /* ── Clear history ───────────────────────────────────────────────── */
    const handleClearHistory = useCallback(async () => {
        if (clearingHistory) return;
        setClearingHistory(true);
        try {
            const res = await fetchChatHistoryApi({ method: "DELETE" });
            if (!res.ok) {
                setError("Could not clear chat history right now. Please try again.");
                return;
            }
            setMessages([WELCOME]);
            setInput("");
            setStreamingReply("");
            setError(null);
        } catch {
            setError("Could not clear chat history right now. Please try again.");
        } finally {
            setClearingHistory(false);
        }
    }, [clearingHistory, fetchChatHistoryApi]);

    const showSuggestions = messages.length === 1 && !sending;

    /* ── Render ──────────────────────────────────────────────────────── */
    return (
        <section className="flex flex-col h-full" style={{ minHeight: "calc(100vh - 8rem)" }}>
            {/* ── Page heading ───────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
                        style={{ background: "var(--color-primary)", color: "#fff" }}
                    >
                        <HeartPulse className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--dash-text-primary)" }}>
                            Take Care
                        </h1>
                        <p className="text-sm" style={{ color: "var(--dash-text-secondary)" }}>
                            AI-powered health assistant · EpiGuard
                        </p>
                    </div>
                </div>

                {/* Health-only badge */}
                <div
                    className="hidden sm:flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
                    style={{
                        background: "rgba(14,165,164,0.07)",
                        borderColor: "rgba(14,165,164,0.22)",
                        color: "var(--color-secondary-dark)",
                    }}
                >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Health &amp; disease topics only
                </div>
            </div>

            {/* ── Chat card ──────────────────────────────────────────── */}
            <div
                className="flex flex-col flex-1 overflow-hidden rounded-2xl border shadow-sm"
                style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}
            >
                {/* Card header */}
                <div
                    className="flex items-center justify-between gap-3 px-5 py-3.5 border-b"
                    style={{
                        background: "linear-gradient(135deg, rgba(30,58,138,0.06) 0%, rgba(14,165,164,0.04) 100%)",
                        borderColor: "var(--dash-card-border)",
                    }}
                >
                    <div className="flex items-center gap-2.5">
                        <div
                            className="flex h-8 w-8 items-center justify-center rounded-full shadow-sm"
                            style={{ background: "var(--color-primary)", color: "#fff" }}
                        >
                            <Bot className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                                EpiGuard
                            </p>
                            <p className="text-[10px] flex items-center gap-1" style={{ color: "var(--dash-text-muted)" }}>
                                <Sparkles className="h-3 w-3" style={{ color: "var(--color-secondary)" }} />
                                Powered by Groq · LLaMA 4
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => void handleClearHistory()}
                        disabled={clearingHistory || sending}
                        title="Clear chat history"
                        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:opacity-80 disabled:opacity-40"
                        style={{
                            background: "var(--dash-card-bg)",
                            borderColor: "var(--dash-card-border)",
                            color: "var(--dash-text-secondary)",
                        }}
                    >
                        {clearingHistory ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Clear history
                    </button>
                </div>

                {/* Messages area */}
                <div
                    className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
                    style={{ background: "var(--dash-bg)", minHeight: 0 }}
                >
                    {/* History loading skeleton */}
                    {historyLoading && (
                        <div className="flex justify-start items-end gap-2.5">
                            <div
                                className="h-8 w-8 rounded-full animate-pulse shrink-0"
                                style={{ background: "var(--dash-skeleton-bg)" }}
                            />
                            <div
                                className="h-14 w-56 rounded-2xl rounded-bl-sm animate-pulse"
                                style={{ background: "var(--dash-skeleton-bg)" }}
                            />
                        </div>
                    )}

                    {/* Messages */}
                    {!historyLoading &&
                        messages.map((m) => <Bubble key={m.id} message={m} />)}

                    {/* Streaming reply */}
                    {streamingReply && (
                        <div className="flex items-end gap-2.5 justify-start">
                            <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm"
                                style={{ background: "var(--color-primary)", color: "#fff" }}
                            >
                                <Bot className="h-4 w-4" />
                            </div>
                            <div
                                className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed shadow-sm"
                                style={{
                                    background: "var(--dash-card-bg)",
                                    border: "1px solid var(--dash-card-border)",
                                    color: "var(--dash-text-primary)",
                                }}
                            >
                                <FormattedMessage content={streamingReply} />
                                <Loader2 className="h-3 w-3 animate-spin mt-1.5 opacity-40" />
                            </div>
                        </div>
                    )}

                    {/* Typing indicator */}
                    {sending && !streamingReply && (
                        <div className="flex items-end gap-2.5 justify-start">
                            <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm"
                                style={{ background: "var(--color-primary)", color: "#fff" }}
                            >
                                <Bot className="h-4 w-4" />
                            </div>
                            <div
                                className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm px-4 py-3 text-xs"
                                style={{
                                    background: "var(--dash-card-bg)",
                                    border: "1px solid var(--dash-card-border)",
                                    color: "var(--dash-text-muted)",
                                }}
                            >
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Thinking…
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Input area */}
                <div
                    className="px-5 py-4 border-t space-y-3"
                    style={{ borderColor: "var(--dash-card-border)", background: "var(--dash-card-bg)" }}
                >
                    {/* Error */}
                    {error && (
                        <div
                            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
                            style={{
                                background: "rgba(220,38,38,0.07)",
                                borderColor: "rgba(220,38,38,0.22)",
                                color: "#dc2626",
                            }}
                        >
                            <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Suggestion chips — shown only when chat is fresh */}
                    {showSuggestions && !historyLoading && (
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => void handleSend(s)}
                                    disabled={sending}
                                    className="rounded-full border px-3 py-1.5 text-xs font-medium transition hover:opacity-80 disabled:opacity-50"
                                    style={{
                                        background: "var(--dash-card-header-bg)",
                                        borderColor: "var(--dash-card-border)",
                                        color: "var(--color-primary)",
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input row */}
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
                            className="input-primary flex-1"
                            disabled={sending || historyLoading}
                            aria-label="Chat input"
                        />
                        <button
                            type="button"
                            onClick={() => void handleSend()}
                            disabled={sending || !input.trim() || historyLoading}
                            aria-label="Send"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition hover:opacity-90 disabled:opacity-40"
                            style={{ background: "var(--color-primary)", color: "#fff" }}
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                    </div>

                    <p className="text-center text-[10px]" style={{ color: "var(--dash-text-muted)" }}>
                        EpiGuard provides public-health guidance only — always consult a doctor for personal medical concerns.
                    </p>
                </div>
            </div>
        </section>
    );
}
