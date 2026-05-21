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
import dynamic from "next/dynamic";
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
import flyingGlobe from "@/constants/flyingGlobeLottie.json";

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
    const [chatToDelete, setChatToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const hasHistory = chats.length > 0;
    const currentChat = chats.find((c) => c.id === currentChatId);
    const isNewChat = currentChat && currentChat.messages.length === 0;

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
                    setCurrentChatId(null);
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
                        setCurrentChatId(null);
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
                const history = [
                    ...(currentChat?.messages || [])
                        .filter((m) => m.role === "user" || m.role === "assistant")
                        .map(({ role, content }) => ({ role, content })),
                    { role: "user", content: text }
                ];

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
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="text-center space-y-6">
                    <div className="w-24 h-24 mx-auto relative">
                        <Lottie animationData={flyingGlobe} loop={true} className="w-full h-full" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Bot className="h-8 w-8 text-(--color-primary) animate-pulse" />
                        </div>
                    </div>
                    <p className="text-sm font-medium animate-pulse" style={{ color: "var(--dash-text-secondary)" }}>EpiGuard is waking up...</p>
                </div>
            </div>
        );
    }

    if (!hasHistory) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] p-6 text-center animate-fade-in">
                <div 
                    className="relative cursor-pointer group mb-8"
                    onClick={() => {
                        void createNewChat();
                        setSidebarOpen(true);
                    }}
                >
                    <div className="w-40 h-40 rounded-[2.5rem] bg-(--color-primary) flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 relative z-10">
                        <Bot className="h-20 w-20 text-white" />
                    </div>
                    <div className="absolute -inset-12 z-0">
                        <Lottie animationData={flyingGlobe} loop={true} className="w-full h-full opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
                
                <h2 className="text-3xl font-black mb-4 tracking-tight" style={{ color: "var(--dash-text-primary)" }}>
                    Meet <span className="text-(--color-primary)">EpiGuard AI</span>
                </h2>
                <p className="text-base max-w-md mx-auto mb-10 leading-relaxed" style={{ color: "var(--dash-text-secondary)" }}>
                    Your dedicated health intelligence assistant. Start a chat to receive guidance on disease prevention, symptoms, and localized risks.
                </p>
                
                <button
                    onClick={() => {
                        void createNewChat();
                        setSidebarOpen(true);
                    }}
                    className="group flex items-center gap-3 bg-(--color-primary) text-white px-10 py-4 rounded-2xl font-bold shadow-[0_10px_30px_-10px_rgba(var(--color-primary-rgb),0.5)] hover:shadow-[0_15px_40px_-10px_rgba(var(--color-primary-rgb),0.6)] transition-all hover:-translate-y-1 active:translate-y-0"
                >
                    <Plus className="h-5 w-5" />
                    Start Your First Chat
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full -mx-4 sm:-mx-5 md:-mx-6 lg:-mx-7 -my-5 sm:-my-6" style={{ width: "calc(100% + 2rem)", minHeight: "calc(100vh - 6rem)" }}>
            <div
                className={`absolute inset-y-0 left-0 z-40 w-64 flex flex-col border-r transition-transform lg:relative lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                style={{
                    background: "var(--dash-card-bg)",
                    borderColor: "var(--dash-card-border)",
                }}
            >
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
                            onDelete={(id) => setChatToDelete(id)}
                        />
                    ))}
                </div>
            </div>

            {sidebarOpen && (
                <div
                    className="absolute inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="relative z-10 min-w-0 flex-1 overflow-hidden grid grid-rows-[auto_1fr_auto]" style={{minHeight:0}}>
                <div
                    className="flex items-center justify-between gap-3 px-4 py-3 border-b lg:px-6"
                    style={{
                        background: "var(--dash-card-bg)",
                        borderColor: "var(--dash-card-border)",
                    }}
                >
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2.5 rounded-xl hover:bg-black/5 transition-colors"
                            style={{ color: "var(--dash-text-secondary)", border: "1px solid var(--dash-card-border)" }}
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <div className="flex items-center gap-3 flex-1">
                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm bg-(--color-primary) text-white"
                            >
                                <Bot className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="font-bold text-sm lg:text-base leading-tight" style={{ color: "var(--dash-text-primary)" }}>
                                    {currentChat?.title || "EpiGuard AI"}
                                </h1>
                                <p className="text-[10px] lg:text-xs flex items-center gap-1.5" style={{ color: "var(--dash-text-secondary)" }}>
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Active health assistant
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
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
                </div>

                <div
                    className="overflow-y-auto px-4 py-5 space-y-4 lg:px-6"
                    style={{ background: "var(--dash-bg)" }}
                >
                    {isNewChat && (
                        <div className="flex flex-col items-center justify-center h-full py-10 px-6 text-center animate-fade-in">
                            <div className="relative w-28 h-28 mb-4">
                                <Lottie animationData={flyingGlobe} loop={true} className="w-full h-full drop-shadow-lg" />
                            </div>
                            
                            <h3 className="text-2xl font-black mb-2" style={{ color: "var(--dash-text-primary)" }}>
                                How can I help you today?
                            </h3>
                            <p className="text-sm max-w-sm mx-auto mb-8 leading-relaxed" style={{ color: "var(--dash-text-secondary)" }}>
                                I&apos;m EpiGuard, and I&apos;m ready to assist with your health and disease protection questions.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => void handleSend(s)}
                                        disabled={sending}
                                        className="flex items-center gap-3 rounded-xl border p-4 text-xs font-medium text-left transition hover:bg-black/5 hover:border-(--color-primary)/30 disabled:opacity-50"
                                        style={{
                                            background: "var(--dash-card-bg)",
                                            borderColor: "var(--dash-card-border)",
                                            color: "var(--dash-text-primary)",
                                        }}
                                    >
                                        <MessageSquare className="h-4 w-4 shrink-0 text-(--color-primary)" />
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentChat?.messages.map((msg, idx) => (
                        <Bubble key={`${currentChatId}-${idx}`} message={msg} />
                    ))}

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
                                <Loader2 className="mt-1.5 h-3 w-3 animate-spin opacity-40" />
                            </div>
                        </div>
                    )}

                    {sending && !streamingReply && (
                        <div className="flex items-end gap-2.5 justify-start">
                            <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm"
                                style={{ background: "var(--color-primary)", color: "#fff" }}
                            >
                                <Bot className="h-4 w-4" />
                            </div>
                            <div
                                className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm px-4 py-4 text-xs h-[38px]"
                                style={{
                                    background: "var(--dash-card-bg)",
                                    border: "1px solid var(--dash-card-border)",
                                    color: "var(--dash-text-muted)",
                                }}
                            >
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

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
                            placeholder="Ask about symptoms, prevention, or health guidance..."
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
                        EpiGuard provides guidance only - always consult a doctor for medical concerns.
                    </p>
                </div>
            </div>

            {/* Premium Themed Delete Confirmation Dialog */}
            {chatToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
                    <div 
                        className="w-full max-w-md transform overflow-hidden rounded-2xl border p-6 text-left shadow-2xl transition-all duration-300 scale-100"
                        style={{
                            background: "var(--dash-card-bg)",
                            borderColor: "var(--dash-card-border)"
                        }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400">
                                <TriangleAlert className="h-6 w-6" />
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <h3 className="text-lg font-bold leading-6" style={{ color: "var(--dash-text-primary)" }}>
                                    Delete Conversation
                                </h3>
                                <p className="text-xs leading-relaxed" style={{ color: "var(--dash-text-secondary)" }}>
                                    Are you sure you want to delete this chat history? This action is permanent and cannot be undone.
                                </p>
                            </div>
                        </div>
                        
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setChatToDelete(null)}
                                disabled={isDeleting}
                                className="px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all hover:bg-black/5"
                                style={{
                                    borderColor: "var(--dash-card-border)",
                                    color: "var(--dash-text-secondary)"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!chatToDelete) return;
                                    setIsDeleting(true);
                                    try {
                                        await deleteChat(chatToDelete);
                                    } finally {
                                        setIsDeleting(false);
                                        setChatToDelete(null);
                                    }
                                }}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white rounded-xl bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}




