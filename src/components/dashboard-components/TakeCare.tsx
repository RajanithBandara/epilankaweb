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
    Menu,
    X,
    Plus,
    MessageSquare,
} from "lucide-react";
import { account } from "@/lib/appwrite";

/* ── Types ─────────────────────────────────────────────────────────── */

type ChatMessage = {
    role: "user" | "assistant";
    content: string;
    createdAt: string;
};

type Chat = {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
};

const WELCOME: ChatMessage = {
    role: "assistant",
    content:
        "Hello! I'm EpiGuard, your personal health assistant for EpiLanka.\n\nYou can ask me about:\n- Disease symptoms and prevention\n- Mosquito-borne or waterborne disease risks\n- When to seek medical help\n- Public health precautions\n\nI'm only able to help with health and disease-related questions.",
    createdAt: new Date().toISOString(),
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
                <p
                    className="mt-1.5 text-[10px] opacity-50 text-right"
                    style={{ color: isAssistant ? "var(--dash-text-muted)" : "#fff" }}
                >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </p>
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

function ChatListItem({ chat, isActive, onClick, onDelete }: { chat: Chat; isActive: boolean; onClick: () => void; onDelete: (id: string) => void }) {
    return (
        <div
            className={`group flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition ${
                isActive
                    ? "bg-opacity-100"
                    : "hover:bg-opacity-50"
            }`}
            style={{
                background: isActive ? "rgba(164, 17, 17, 0.15)" : "transparent",
            }}
            onClick={onClick}
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare className="h-4 w-4 shrink-0" style={{ color: "var(--color-primary)" }} />
                <span
                    className="text-sm truncate"
                    style={{
                        color: isActive ? "var(--color-primary)" : "var(--dash-text-secondary)",
                        fontWeight: isActive ? 600 : 400,
                    }}
                >
                    {chat.title}
                </span>
            </div>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(chat.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-opacity-80 rounded"
                style={{ color: "var(--dash-text-muted)" }}
                title="Delete chat"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

export default function TakeCare() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [streamingReply, setStreamingReply] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const currentChat = chats.find((c) => c.id === currentChatId);

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

    const fetchWithAuth = useCallback(
        async (url: string, init?: RequestInit) => {
            const baseInit: RequestInit = { ...init, credentials: "include" };
            const res = await fetch(url, baseInit);
            if (res.status !== 401) return res;

            const refreshed = await refreshServerJwtCookie();
            if (!refreshed) return res;

            return await fetch(url, baseInit);
        },
        [refreshServerJwtCookie]
    );

    // Load chats on mount
    useEffect(() => {
        const loadChats = async () => {
            try {
                const res = await fetchWithAuth("/api/chat-history");
                if (res.status === 401) return;
                if (!res.ok) return;

                const data = (await res.json()) as { chats: Chat[] };
                setChats(data.chats || []);

                if (data.chats && data.chats.length > 0) {
                    setCurrentChatId(data.chats[0].id);
                } else {
                    // Create initial chat
                    const newRes = await fetchWithAuth("/api/chat-history/new", { method: "POST" });
                    if (newRes.ok) {
                        const newData = (await newRes.json()) as { chatId: string; chat: Chat };
                        setChats([newData.chat]);
                        setCurrentChatId(newData.chatId);
                    }
                }
            } catch (err) {
                console.error("Failed to load chats:", err);
            } finally {
                setLoading(false);
            }
        };
        void loadChats();
    }, [fetchWithAuth]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [currentChat?.messages, streamingReply, sending]);

    const createNewChat = useCallback(async () => {
        try {
            const res = await fetchWithAuth("/api/chat-history/new", { method: "POST" });
            if (!res.ok) {
                setError("Failed to create chat");
                return;
            }

            const data = (await res.json()) as { chatId: string; chat: Chat };
            setChats((prev) => [data.chat, ...prev]);
            setCurrentChatId(data.chatId);
            setInput("");
            setStreamingReply("");
            setError(null);
            setSidebarOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create new chat");
        }
    }, [fetchWithAuth]);

    const deleteChat = useCallback(
        async (chatId: string) => {
            try {
                const res = await fetchWithAuth(`/api/chat-history?chatId=${chatId}`, { method: "DELETE" });
                if (!res.ok) {
                    setError("Failed to delete chat");
                    return;
                }

                setChats((prev) => prev.filter((c) => c.id !== chatId));
                if (currentChatId === chatId) {
                    const remainingChats = chats.filter((c) => c.id !== chatId);
                    if (remainingChats.length > 0) {
                        setCurrentChatId(remainingChats[0].id);
                    } else {
                        void createNewChat();
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to delete chat");
            }
        },
        [currentChatId, chats, fetchWithAuth, createNewChat]
    );

    const saveMessage = useCallback(
        async (role: "user" | "assistant", content: string) => {
            if (!currentChatId) return;
            try {
                const res = await fetchWithAuth("/api/chat-history", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chatId: currentChatId, role, content }),
                });
                if (!res.ok) {
                    console.error("Failed to save message");
                }
            } catch (err) {
                console.error("Error saving message:", err);
            }
        },
        [currentChatId, fetchWithAuth]
    );

    const handleSend = useCallback(
        async (promptText?: string) => {
            const text = (promptText ?? input).trim();
            if (!text || sending || !currentChatId) return;

            setSending(true);
            setError(null);

            try {
                // Step 1: Save user message
                await saveMessage("user", text);

                // Step 2: Update UI with user message
                setChats((prev) =>
                    prev.map((chat) =>
                        chat.id === currentChatId
                            ? {
                                  ...chat,
                                  messages: [
                                      ...chat.messages,
                                      { role: "user", content: text, createdAt: new Date().toISOString() },
                                  ],
                              }
                            : chat
                    )
                );

                setInput("");
                setStreamingReply("");

                // Step 3: Send to API
                const history =
                    currentChat?.messages
                        .filter((m) => m.role === "user" || m.role === "assistant")
                        .map(({ role, content }) => ({ role, content })) || [];

                const res = await fetch("/api/groq/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ messages: history }),
                });

                if (!res.ok) {
                    const data = (await res.json().catch(() => ({}))) as { error?: string };
                    setError(data.error ?? "Failed to get response");
                    return;
                }

                // Step 4: Stream response
                let replyText = "";
                await readStream(res, (chunk) => {
                    replyText += chunk;
                    setStreamingReply(replyText);
                });

                const finalReply = replyText.trim() || "I could not generate a response. Please try again.";

                // Step 5: Save assistant response
                await saveMessage("assistant", finalReply);

                // Step 6: Update UI with assistant message
                setChats((prev) =>
                    prev.map((chat) =>
                        chat.id === currentChatId
                            ? {
                                  ...chat,
                                  messages: [
                                      ...chat.messages,
                                      { role: "assistant", content: finalReply, createdAt: new Date().toISOString() },
                                  ],
                              }
                            : chat
                    )
                );

                setStreamingReply("");
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Chat request failed";
                setError(msg);
            } finally {
                setSending(false);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        },
        [input, currentChatId, sending, currentChat, saveMessage]
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: "var(--color-primary)" }} />
                    <p style={{ color: "var(--dash-text-secondary)" }}>Loading chat history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full" style={{ minHeight: "calc(100vh - 8rem)" }}>
            {/* ── Sidebar ─────────────────────────────────────────────── */}
            <div
                className={`fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col border-r transition-transform lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                style={{
                    background: "var(--dash-card-bg)",
                    borderColor: "var(--dash-card-border)",
                }}
            >
                {/* Sidebar header */}
                <div className="flex items-center justify-between gap-2 p-4 border-b" style={{ borderColor: "var(--dash-card-border)" }}>
                    <h2 className="font-semibold text-sm" style={{ color: "var(--dash-text-primary)" }}>
                        Chats
                    </h2>
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1 hover:opacity-80"
                        style={{ color: "var(--dash-text-secondary)" }}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* New chat button */}
                <button
                    type="button"
                    onClick={() => void createNewChat()}
                    className="m-4 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:opacity-80"
                    style={{
                        background: "var(--color-primary)",
                        color: "#fff",
                        borderColor: "var(--color-primary)",
                    }}
                >
                    <Plus className="h-4 w-4" />
                    New chat
                </button>

                {/* Chat list */}
                <div className="flex-1 overflow-y-auto space-y-2 px-3 py-2">
                    {chats.map((chat) => (
                        <ChatListItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === currentChatId}
                            onClick={() => {
                                setCurrentChatId(chat.id);
                                setSidebarOpen(false);
                            }}
                            onDelete={deleteChat}
                        />
                    ))}
                </div>
            </div>

            {/* ── Overlay (mobile) ─────────────────────────────────── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Main chat area ──────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div
                    className="flex items-center justify-between gap-3 px-4 py-3 border-b lg:px-6"
                    style={{
                        background: "var(--dash-card-bg)",
                        borderColor: "var(--dash-card-border)",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden p-2 hover:opacity-80"
                        style={{ color: "var(--dash-text-secondary)" }}
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-3 flex-1">
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
                            style={{ background: "var(--color-primary)", color: "#fff" }}
                        >
                            <HeartPulse className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="font-bold text-sm lg:text-base" style={{ color: "var(--dash-text-primary)" }}>
                                {currentChat?.title || "EpiGuard"}
                            </h1>
                            <p className="text-[10px] lg:text-xs" style={{ color: "var(--dash-text-secondary)" }}>
                                AI health assistant
                            </p>
                        </div>
                    </div>

                    <div
                        className="hidden sm:flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] lg:text-xs font-medium"
                        style={{
                            background: "rgba(14,165,164,0.07)",
                            borderColor: "rgba(14,165,164,0.22)",
                            color: "var(--color-secondary-dark)",
                        }}
                    >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Health topics
                    </div>
                </div>

                {/* Messages area */}
                <div
                    className="flex-1 overflow-y-auto px-4 py-5 space-y-4 lg:px-6"
                    style={{ background: "var(--dash-bg)" }}
                >
                    {currentChat && currentChat.messages.length === 0 && (
                        <>
                            <Bubble message={WELCOME} />
                            <div className="flex flex-wrap gap-2 pt-4">
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
                        </>
                    )}

                    {currentChat?.messages.map((msg, idx) => (
                        <Bubble key={`${currentChatId}-${idx}`} message={msg} />
                    ))}

                    {/* Streaming reply */}
                    {streamingReply && (
                        <div className="flex items-end gap-2.5 justify-start animate-pulse">
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
                                EpiGuard is thinking…
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Input area */}
                <div
                    className="px-4 py-4 border-t space-y-3 lg:px-6"
                    style={{ borderColor: "var(--dash-card-border)", background: "var(--dash-card-bg)" }}
                >
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
                            disabled={sending}
                            aria-label="Chat input"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => void handleSend()}
                            disabled={sending || !input.trim()}
                            aria-label="Send"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition hover:opacity-90 disabled:opacity-40"
                            style={{ background: "var(--color-primary)", color: "#fff" }}
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                    </div>

                    <p className="text-center text-[10px]" style={{ color: "var(--dash-text-muted)" }}>
                        EpiGuard provides guidance only — always consult a doctor for medical concerns.
                    </p>
                </div>
            </div>
        </div>
    );
}



