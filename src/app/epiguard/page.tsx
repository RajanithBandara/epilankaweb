'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
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
    Lock,
    ArrowRight
} from "lucide-react";
import Lottie from "lottie-react";
import flyingGlobe from "@/constants/flyingGlobeLottie.json";
import MicroorganismBackground from '@/components/safety-components/MicroorganismBackground';
import { account } from "@/lib/appwrite";

// Types
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm bg-[#1E3A8A] text-white">
                    <Bot className="h-4 w-4" />
                </div>
            )}

            <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${isAssistant ? "rounded-bl-sm" : "rounded-br-sm"
                    }`}
                style={
                    isAssistant
                        ? {
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            color: "rgba(255, 255, 255, 0.9)",
                        }
                        : {
                            background: "#0EA5A4",
                            color: "#ffffff",
                        }
                }
            >
                <FormattedMessage content={message.content} />
                <p className={`mt-1.5 text-[10px] text-right ${isAssistant ? "text-white/40" : "text-white/70"}`}>
                    {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </p>
            </div>

            {!isAssistant && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm bg-[#0EA5A4] text-white">
                    <HeartPulse className="h-4 w-4" />
                </div>
            )}
        </div>
    );
}

function ChatListItem({ chat, isActive, onClick, onDelete }: { chat: Chat; isActive: boolean; onClick: () => void; onDelete: (id: string) => void }) {
    return (
        <div
            className={`group flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition ${isActive
                ? "bg-white/10 border border-white/10"
                : "hover:bg-white/5 border border-transparent"
                }`}
            onClick={onClick}
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? "text-[#67e8f9]" : "text-white/40"}`} />
                <span className={`text-sm truncate ${isActive ? "text-white font-medium" : "text-white/60"}`}>
                    {chat.title}
                </span>
            </div>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(chat.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-white/10 rounded text-white/40 hover:text-red-400"
                title="Delete chat"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

export default function SafetyPage() {
    const { user, loading: loadingAuth } = useAuth();

    const [chats, setChats] = useState<Chat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [streamingReply, setStreamingReply] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loadingChats, setLoadingChats] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
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
        if (!user) {
            setLoadingChats(false);
            return;
        }

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
                setLoadingChats(false);
            }
        };
        void loadChats();
    }, [fetchWithAuth, user]);

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
        [currentChatId, chats, fetchWithAuth]
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

    const renderContent = () => {
        if (loadingAuth || loadingChats) {
            return (
                <div className="flex flex-col items-center justify-center h-full w-full py-16 text-center z-10">
                    <div className="w-24 h-24 mx-auto relative mb-4">
                        <Lottie animationData={flyingGlobe} loop={true} className="w-full h-full" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Bot className="h-8 w-8 text-[#67e8f9] animate-pulse" />
                        </div>
                    </div>
                    <p className="text-sm font-medium animate-pulse text-white/60">EpiGuard is waking up...</p>
                </div>
            );
        }

        if (!user) {
            return (
                <div className="flex flex-col items-center justify-center h-full w-full py-16 px-4 text-center animate-fade-in relative z-10">
                    <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                        <Lock className="h-10 w-10 text-[#67e8f9] opacity-80" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4">Sign in to use EpiGuard AI</h2>
                    <p className="text-white/60 max-w-md mx-auto mb-8 leading-relaxed">
                        Unlock your personalized health intelligence assistant. Sign in to start chatting, save your history, and get real-time localized guidance.
                    </p>
                    <Link
                        href="/login"
                        className="group inline-flex items-center gap-3 bg-white text-[#1E3A8A] px-8 py-3.5 rounded-xl font-bold transition-all hover:bg-white/90 hover:scale-105 shadow-lg shadow-white/20"
                    >
                        Sign In to Continue
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            );
        }

        if (!hasHistory) {
            return (
                <div className="flex flex-col items-center justify-center h-full w-full py-16 px-6 text-center animate-fade-in relative z-10">
                    <div
                        className="relative cursor-pointer group mb-8"
                        onClick={() => {
                            void createNewChat();
                            setSidebarOpen(true);
                        }}
                    >
                        <div className="w-40 h-40 rounded-[2.5rem] bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 relative z-10 group-hover:bg-white/20 group-hover:border-[#67e8f9]/50">
                            <Bot className="h-20 w-20 text-[#67e8f9]" />
                        </div>
                        <div className="absolute -inset-12 z-0">
                            <Lottie animationData={flyingGlobe} loop={true} className="w-full h-full opacity-60 group-hover:opacity-100 transition-opacity drop-shadow-2xl" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-black mb-4 tracking-tight text-white">
                        Meet <span className="bg-gradient-to-r from-[#7dd3fc] to-[#67e8f9] bg-clip-text text-transparent">EpiGuard AI</span>
                    </h2>
                    <p className="text-base max-w-md mx-auto mb-10 leading-relaxed text-white/70">
                        Your dedicated health intelligence assistant. Start a chat to receive guidance on disease prevention, symptoms, and localized risks.
                    </p>

                    <button
                        onClick={() => {
                            void createNewChat();
                            setSidebarOpen(true);
                        }}
                        className="group flex items-center gap-3 bg-gradient-to-r from-[#1E3A8A] to-[#0EA5A4] text-white px-10 py-4 rounded-2xl font-bold shadow-[0_10px_30px_-10px_rgba(14,165,164,0.5)] hover:shadow-[0_15px_40px_-10px_rgba(14,165,164,0.7)] transition-all hover:-translate-y-1 active:translate-y-0"
                    >
                        <Plus className="h-5 w-5" />
                        Start Your First Chat
                    </button>
                </div>
            );
        }

        return (
            <div className="flex flex-1 overflow-hidden h-full w-full">
                {/* Sidebar */}
                <div
                    className={`absolute inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-white/10 transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                        }`}
                    style={{
                        background: "rgba(0,0,0,0.2)",
                        backdropFilter: "blur(10px)"
                    }}
                >
                    <div className="flex items-center justify-between gap-2 p-4 border-b border-white/10">
                        <h2 className="font-semibold text-sm text-white/90">
                            Chats
                        </h2>
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 hover:bg-white/10 rounded-lg text-white/60 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => void createNewChat()}
                        className="m-4 flex items-center justify-center gap-2 rounded-xl border border-[#0EA5A4]/50 bg-[#0EA5A4]/20 px-4 py-2.5 text-sm font-medium text-[#67e8f9] transition hover:bg-[#0EA5A4]/30"
                    >
                        <Plus className="h-4 w-4" />
                        New chat
                    </button>

                    <div className="flex-1 overflow-y-auto space-y-2 px-3 py-2 custom-scrollbar">
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

                {/* Mobile overlay */}
                {sidebarOpen && (
                    <div
                        className="absolute inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Chat Area */}
                <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-md lg:px-6">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors border border-white/10 text-white/70"
                            >
                                <Menu className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-3 flex-1">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm bg-white/10 text-white border border-white/10">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div>
                                    <h1 className="font-bold text-sm lg:text-base leading-tight text-white/90">
                                        {currentChat?.title || "EpiGuard AI"}
                                    </h1>
                                    <p className="text-[10px] lg:text-xs flex items-center gap-1.5 text-white/60">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_#34d399]"></span>
                                        Active health assistant
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#0EA5A4]/30 bg-[#0EA5A4]/10 px-3 py-1.5 text-[10px] lg:text-xs font-medium text-[#67e8f9]">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Health topics
                            </div>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 lg:px-6 custom-scrollbar">
                        {isNewChat && (
                            <div className="flex flex-col items-center justify-center h-full py-10 px-6 text-center animate-fade-in">
                                <div className="relative w-28 h-28 mb-4">
                                    <Lottie animationData={flyingGlobe} loop={true} className="w-full h-full drop-shadow-lg" />
                                </div>

                                <h3 className="text-2xl font-black mb-2 text-white">
                                    How can I help you today?
                                </h3>
                                <p className="text-sm max-w-sm mx-auto mb-8 leading-relaxed text-white/60">
                                    I&apos;m EpiGuard, and I&apos;m ready to assist with your health and disease protection questions.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                                    {SUGGESTIONS.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => void handleSend(s)}
                                            disabled={sending}
                                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-xs font-medium text-left transition hover:bg-white/10 hover:border-[#67e8f9]/50 disabled:opacity-50 text-white/80 hover:text-white"
                                        >
                                            <MessageSquare className="h-4 w-4 shrink-0 text-[#67e8f9]" />
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
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm bg-[#1E3A8A] text-white">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed shadow-sm border border-white/10 bg-white/5 text-white/90">
                                    <FormattedMessage content={streamingReply} />
                                    <Loader2 className="mt-1.5 h-3 w-3 animate-spin opacity-40" />
                                </div>
                            </div>
                        )}

                        {sending && !streamingReply && (
                            <div className="flex items-end gap-2.5 justify-start">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm bg-[#1E3A8A] text-white">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm px-4 py-3 text-xs border border-white/10 bg-white/5 text-white/60">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    EpiGuard is thinking...
                                </div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input Area */}
                    <div className="px-4 py-4 border-t border-white/10 bg-black/10 backdrop-blur-md space-y-3 lg:px-6">
                        {error && (
                            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
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
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#0EA5A4]/50 focus:ring-1 focus:ring-[#0EA5A4]/50 transition-all text-sm"
                                disabled={sending}
                                aria-label="Chat input"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => void handleSend()}
                                disabled={sending || !input.trim()}
                                aria-label="Send"
                                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl shadow-sm transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 bg-[#0EA5A4] text-white"
                            >
                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </button>
                        </div>

                        <p className="text-center text-[10px] text-white/40">
                            EpiGuard provides guidance only - always consult a doctor for medical concerns.
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main className="min-h-screen relative text-white flex flex-col px-4 pt-28 pb-6">
            <MicroorganismBackground />
            <div className="fixed inset-0 bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#0EA5A4] overflow-hidden -z-20">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
                </div>
            </div>


            <div className="w-full max-w-7xl mx-auto px-4 pb-16 relative z-10 flex-1 flex flex-col">
                <div className="relative bg-white/[0.07] backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.25)] flex-1 flex flex-col min-h-[600px] h-[calc(100vh-16rem)]">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#1E3A8A]/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#0EA5A4]/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-1 overflow-hidden h-full w-full">
                        {renderContent()}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0EA5A4]/40 to-transparent pointer-events-none" />
                </div>
            </div>
        </main>
    );
}
