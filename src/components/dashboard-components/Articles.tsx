"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Heart,
    Bookmark,
    Newspaper,
    Tag,
    Loader2,
    ChevronLeft,
    Search,
    Sparkles,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
} from "lucide-react";

type ArticleStatus = "draft" | "published";

type Article = {
    id: string;
    slug: string;
    title: string;
    summary: string;
    body: string;
    tags: string[];
    category: string;
    author: { id: string; name: string; email: string };
    status: ArticleStatus;
    createdAt: string;
    updatedAt: string;
    publishedAt: string | null;
    likeCount: number;
    bookmarkCount: number;
    liked: boolean;
    bookmarked: boolean;
};

type ArticleAnalysis = {
    version: string;
    tldr: string;
    readingTimeMinutes: number;
    keyPoints: string[];
    sections: { heading: string; body: string }[];
    doAndDont: { do: string[]; dont: string[] };
    whenToSeekHelp: string[];
    relatedDiseases: string[];
    audience: string;
    tone: string;
    sourceUpdatedAt: string | null;
};

type Tab = "all" | "bookmarks";

function formatDate(iso: string | null) {
    if (!iso) return "";
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return iso;
    }
}

export default function Articles() {
    const [tab, setTab] = useState<Tab>("all");
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Article | null>(null);
    const [pendingReaction, setPendingReaction] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<ArticleAnalysis | null>(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const loadArticles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const url = tab === "bookmarks" ? "/api/articles/bookmarked" : "/api/public/articles";
            const res = await fetch(url, { cache: "no-store" });
            const data = (await res.json()) as { articles?: Article[]; error?: string };
            if (!res.ok) throw new Error(data.error || "Failed to load articles");
            setArticles(data.articles ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load articles");
            setArticles([]);
        } finally {
            setLoading(false);
        }
    }, [tab]);

    useEffect(() => {
        void loadArticles();
    }, [loadArticles]);

    // Fetch the Groq-generated, Redis-cached structured analysis whenever the
    // user opens an article. The backend keys the cache by article + updatedAt
    // so officer edits are picked up automatically on the next view.
    useEffect(() => {
        if (!selected) {
            setAnalysis(null);
            setAnalysisError(null);
            setAnalysisLoading(false);
            return;
        }
        const articleId = selected.id;
        const controller = new AbortController();
        setAnalysis(null);
        setAnalysisError(null);
        setAnalysisLoading(true);
        (async () => {
            try {
                const res = await fetch(`/api/public/articles/${articleId}/analysis`, {
                    cache: "no-store",
                    signal: controller.signal,
                });
                const data = (await res.json()) as {
                    analysis?: ArticleAnalysis | null;
                    error?: string;
                };
                if (!res.ok) throw new Error(data.error || "Failed to load analysis");
                setAnalysis(data.analysis ?? null);
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") return;
                setAnalysisError(err instanceof Error ? err.message : "Failed to load analysis");
            } finally {
                if (!controller.signal.aborted) setAnalysisLoading(false);
            }
        })();
        return () => controller.abort();
    }, [selected]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return articles;
        return articles.filter((a) => {
            const haystack = [a.title, a.summary, a.category, ...a.tags]
                .join(" ")
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [articles, query]);

    const updateLocal = (id: string, patch: Partial<Article>) => {
        setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
        setSelected((curr) => (curr && curr.id === id ? { ...curr, ...patch } : curr));
    };

    const toggleReaction = async (article: Article, kind: "like" | "bookmark") => {
        const key = `${article.id}:${kind}`;
        setPendingReaction(key);
        try {
            const res = await fetch(`/api/articles/${article.id}/${kind}`, { method: "POST" });
            const data = (await res.json()) as {
                liked?: boolean;
                bookmarked?: boolean;
                likeCount?: number;
                bookmarkCount?: number;
                error?: string;
            };
            if (!res.ok) {
                if (res.status === 401) {
                    setError("Please sign in to react to articles.");
                    return;
                }
                throw new Error(data.error || "Failed to update reaction");
            }
            updateLocal(article.id, {
                liked: data.liked ?? article.liked,
                bookmarked: data.bookmarked ?? article.bookmarked,
                likeCount: data.likeCount ?? article.likeCount,
                bookmarkCount: data.bookmarkCount ?? article.bookmarkCount,
            });
            // If we're on the bookmarks tab and a bookmark was just removed, drop it from list
            if (tab === "bookmarks" && kind === "bookmark" && data.bookmarked === false) {
                setArticles((prev) => prev.filter((a) => a.id !== article.id));
                if (selected?.id === article.id) setSelected(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update reaction");
        } finally {
            setPendingReaction(null);
        }
    };

    // Detail view ────────────────────────────────────────────────────────────
    if (selected) {
        const a = selected;
        return (
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="inline-flex items-center gap-1 text-sm font-medium"
                    style={{ color: "var(--color-primary)" }}
                >
                    <ChevronLeft className="h-4 w-4" /> Back to articles
                </button>

                <article
                    className="rounded-2xl border p-5 sm:p-7"
                    style={{
                        background: "var(--dash-card-bg)",
                        borderColor: "var(--dash-card-border)",
                    }}
                >
                    <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--dash-text-muted)" }}>
                        <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "var(--dash-card-border)" }}>
                            {a.category}
                        </span>
                        <span>•</span>
                        <span>{formatDate(a.publishedAt ?? a.createdAt)}</span>
                        <span>•</span>
                        <span>By {a.author.name || a.author.email || "Officer"}</span>
                    </div>

                    <h1 className="mt-3 text-2xl font-bold" style={{ color: "var(--dash-text-primary)" }}>
                        {a.title}
                    </h1>
                    <p className="mt-2 text-sm" style={{ color: "var(--dash-text-secondary)" }}>
                        {a.summary}
                    </p>

                    {a.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {a.tags.map((t) => (
                                <span
                                    key={t}
                                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]"
                                    style={{ borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)" }}
                                >
                                    <Tag className="h-3 w-3" /> {t}
                                </span>
                            ))}
                        </div>
                    )}

                    <AnalysisView
                        article={a}
                        analysis={analysis}
                        loading={analysisLoading}
                        error={analysisError}
                    />

                    <div className="mt-6 flex items-center gap-2 border-t pt-4" style={{ borderColor: "var(--dash-card-border)" }}>
                        <ReactionButton
                            kind="like"
                            active={a.liked}
                            count={a.likeCount}
                            pending={pendingReaction === `${a.id}:like`}
                            onClick={() => void toggleReaction(a, "like")}
                        />
                        <ReactionButton
                            kind="bookmark"
                            active={a.bookmarked}
                            count={a.bookmarkCount}
                            pending={pendingReaction === `${a.id}:bookmark`}
                            onClick={() => void toggleReaction(a, "bookmark")}
                        />
                    </div>
                </article>
            </div>
        );
    }

    // List view ──────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3">
                <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl shadow-md"
                    style={{ background: "var(--color-primary)" }}
                >
                    <Newspaper className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--dash-text-primary)" }}>
                        Health Articles
                    </h1>
                    <p className="text-xs" style={{ color: "var(--dash-text-muted)" }}>
                        Trusted guidance published by EpiLanka health officers.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-xl border p-1" style={{ borderColor: "var(--dash-card-border)", background: "var(--dash-card-bg)" }}>
                    {(["all", "bookmarks"] as Tab[]).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors"
                            style={
                                tab === t
                                    ? { background: "var(--color-primary)", color: "#fff" }
                                    : { color: "var(--dash-text-secondary)" }
                            }
                        >
                            {t === "all" ? "All" : "Saved"}
                        </button>
                    ))}
                </div>

                <div
                    className="flex flex-1 items-center gap-2 rounded-xl border px-3 py-1.5"
                    style={{ borderColor: "var(--dash-card-border)", background: "var(--dash-card-bg)" }}
                >
                    <Search className="h-4 w-4" style={{ color: "var(--dash-text-muted)" }} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by title, tag, category…"
                        className="flex-1 bg-transparent text-sm outline-none"
                        style={{ color: "var(--dash-text-primary)" }}
                    />
                </div>
            </div>

            {error && (
                <div
                    className="rounded-xl border px-4 py-3 text-sm"
                    style={{
                        background: "rgba(220,38,38,0.08)",
                        borderColor: "rgba(220,38,38,0.28)",
                        color: "var(--color-danger)",
                    }}
                >
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--dash-text-muted)" }}>
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading articles…
                </div>
            ) : filtered.length === 0 ? (
                <div
                    className="rounded-2xl border border-dashed p-8 text-center text-sm"
                    style={{ borderColor: "var(--dash-card-border)", color: "var(--dash-text-muted)" }}
                >
                    {tab === "bookmarks"
                        ? "You haven't saved any articles yet."
                        : "No articles to show right now."}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {filtered.map((a) => (
                        <article
                            key={a.id}
                            className="flex flex-col rounded-2xl border p-4 transition-shadow hover:shadow-md"
                            style={{ background: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}
                        >
                            <button
                                type="button"
                                onClick={() => setSelected(a)}
                                className="text-left"
                            >
                                <div className="flex flex-wrap items-center gap-2 text-[11px]" style={{ color: "var(--dash-text-muted)" }}>
                                    <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "var(--dash-card-border)" }}>
                                        {a.category}
                                    </span>
                                    <span>•</span>
                                    <span>{formatDate(a.publishedAt ?? a.createdAt)}</span>
                                </div>
                                <h2 className="mt-2 text-base font-bold" style={{ color: "var(--dash-text-primary)" }}>
                                    {a.title}
                                </h2>
                                <p className="mt-1 line-clamp-3 text-sm" style={{ color: "var(--dash-text-secondary)" }}>
                                    {a.summary}
                                </p>
                                {a.tags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {a.tags.slice(0, 4).map((t) => (
                                            <span
                                                key={t}
                                                className="rounded-full border px-2 py-0.5 text-[10px]"
                                                style={{ borderColor: "var(--dash-card-border)", color: "var(--dash-text-muted)" }}
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </button>

                            <div
                                className="mt-3 flex items-center gap-2 border-t pt-3"
                                style={{ borderColor: "var(--dash-card-border)" }}
                            >
                                <ReactionButton
                                    kind="like"
                                    active={a.liked}
                                    count={a.likeCount}
                                    pending={pendingReaction === `${a.id}:like`}
                                    onClick={() => void toggleReaction(a, "like")}
                                />
                                <ReactionButton
                                    kind="bookmark"
                                    active={a.bookmarked}
                                    count={a.bookmarkCount}
                                    pending={pendingReaction === `${a.id}:bookmark`}
                                    onClick={() => void toggleReaction(a, "bookmark")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setSelected(a)}
                                    className="ml-auto text-xs font-semibold"
                                    style={{ color: "var(--color-primary)" }}
                                >
                                    Read →
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}

function AnalysisView({
    article,
    analysis,
    loading,
    error,
}: {
    article: Article;
    analysis: ArticleAnalysis | null;
    loading: boolean;
    error: string | null;
}) {
    if (loading) {
        return (
            <div
                className="mt-5 flex items-center gap-2 rounded-xl border border-dashed p-4 text-xs"
                style={{ borderColor: "var(--dash-card-border)", color: "var(--dash-text-muted)" }}
            >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Preparing a reader-friendly version with AI…</span>
            </div>
        );
    }

    if (!analysis) {
        // Graceful fallback to the officer-authored body if Groq is unavailable.
        return (
            <>
                {error && (
                    <div
                        className="mt-4 rounded-xl border px-3 py-2 text-[11px]"
                        style={{
                            background: "rgba(234,179,8,0.08)",
                            borderColor: "rgba(234,179,8,0.28)",
                            color: "var(--dash-text-secondary)",
                        }}
                    >
                        AI-enhanced view unavailable — showing the original article.
                    </div>
                )}
                <div
                    className="mt-5 whitespace-pre-wrap text-sm leading-relaxed"
                    style={{ color: "var(--dash-text-primary)" }}
                >
                    {article.body}
                </div>
            </>
        );
    }

    const hasDo = analysis.doAndDont.do.length > 0;
    const hasDont = analysis.doAndDont.dont.length > 0;

    return (
        <div className="mt-5 space-y-5">
            <div
                className="flex flex-wrap items-center gap-2 text-[11px]"
                style={{ color: "var(--dash-text-muted)" }}
            >
                <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5"
                    style={{ borderColor: "var(--dash-card-border)" }}
                >
                    <Sparkles className="h-3 w-3" /> AI-prepared view
                </span>
                <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5"
                    style={{ borderColor: "var(--dash-card-border)" }}
                >
                    <Clock className="h-3 w-3" /> {analysis.readingTimeMinutes} min read
                </span>
                <span
                    className="rounded-full border px-2 py-0.5 capitalize"
                    style={{ borderColor: "var(--dash-card-border)" }}
                >
                    {analysis.tone}
                </span>
            </div>

            {analysis.tldr && (
                <div
                    className="rounded-xl border p-4"
                    style={{
                        background: "rgba(99,102,241,0.06)",
                        borderColor: "rgba(99,102,241,0.25)",
                    }}
                >
                    <div
                        className="text-[11px] font-semibold uppercase tracking-wide"
                        style={{ color: "var(--dash-text-muted)" }}
                    >
                        In a nutshell
                    </div>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--dash-text-primary)" }}>
                        {analysis.tldr}
                    </p>
                </div>
            )}

            {analysis.keyPoints.length > 0 && (
                <section>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                        Key points
                    </h3>
                    <ul className="mt-2 space-y-1.5 text-sm" style={{ color: "var(--dash-text-secondary)" }}>
                        {analysis.keyPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span
                                    className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                    style={{ background: "var(--color-primary)" }}
                                />
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {analysis.sections.map((section, i) => (
                <section key={i}>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>
                        {section.heading}
                    </h3>
                    <p
                        className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed"
                        style={{ color: "var(--dash-text-secondary)" }}
                    >
                        {section.body}
                    </p>
                </section>
            ))}

            {(hasDo || hasDont) && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {hasDo && (
                        <div
                            className="rounded-xl border p-4"
                            style={{
                                background: "rgba(34,197,94,0.06)",
                                borderColor: "rgba(34,197,94,0.25)",
                            }}
                        >
                            <div
                                className="flex items-center gap-1.5 text-xs font-semibold"
                                style={{ color: "#16a34a" }}
                            >
                                <CheckCircle2 className="h-4 w-4" /> Do
                            </div>
                            <ul
                                className="mt-2 space-y-1 text-sm"
                                style={{ color: "var(--dash-text-secondary)" }}
                            >
                                {analysis.doAndDont.do.map((item, i) => (
                                    <li key={i}>• {item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {hasDont && (
                        <div
                            className="rounded-xl border p-4"
                            style={{
                                background: "rgba(239,68,68,0.06)",
                                borderColor: "rgba(239,68,68,0.25)",
                            }}
                        >
                            <div
                                className="flex items-center gap-1.5 text-xs font-semibold"
                                style={{ color: "#dc2626" }}
                            >
                                <XCircle className="h-4 w-4" /> Don&apos;t
                            </div>
                            <ul
                                className="mt-2 space-y-1 text-sm"
                                style={{ color: "var(--dash-text-secondary)" }}
                            >
                                {analysis.doAndDont.dont.map((item, i) => (
                                    <li key={i}>• {item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {analysis.whenToSeekHelp.length > 0 && (
                <div
                    className="rounded-xl border p-4"
                    style={{
                        background: "rgba(234,88,12,0.06)",
                        borderColor: "rgba(234,88,12,0.28)",
                    }}
                >
                    <div
                        className="flex items-center gap-1.5 text-xs font-semibold"
                        style={{ color: "#ea580c" }}
                    >
                        <AlertTriangle className="h-4 w-4" /> When to seek medical help
                    </div>
                    <ul
                        className="mt-2 space-y-1 text-sm"
                        style={{ color: "var(--dash-text-secondary)" }}
                    >
                        {analysis.whenToSeekHelp.map((item, i) => (
                            <li key={i}>• {item}</li>
                        ))}
                    </ul>
                </div>
            )}

            {analysis.relatedDiseases.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span style={{ color: "var(--dash-text-muted)" }}>Related:</span>
                    {analysis.relatedDiseases.map((d) => (
                        <span
                            key={d}
                            className="rounded-full border px-2 py-0.5 capitalize"
                            style={{ borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)" }}
                        >
                            {d}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

function ReactionButton({
    kind,
    active,
    count,
    pending,
    onClick,
}: {
    kind: "like" | "bookmark";
    active: boolean;
    count: number;
    pending: boolean;
    onClick: () => void;
}) {
    const Icon = kind === "like" ? Heart : Bookmark;
    const activeColor = kind === "like" ? "#e11d48" : "#2563eb";
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={pending}
            aria-pressed={active}
            aria-label={kind === "like" ? (active ? "Unlike" : "Like") : active ? "Remove bookmark" : "Save"}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60"
            style={{
                borderColor: active ? activeColor : "var(--dash-card-border)",
                color: active ? activeColor : "var(--dash-text-secondary)",
                background: active ? `${activeColor}15` : "transparent",
            }}
        >
            <Icon className="h-3.5 w-3.5" fill={active ? activeColor : "none"} />
            {count}
        </button>
    );
}
