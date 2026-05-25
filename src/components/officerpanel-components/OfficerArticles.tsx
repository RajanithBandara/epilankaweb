"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
};

const DEFAULT_FORM = {
    title: "",
    summary: "",
    body: "",
    category: "general",
    tags: "",
    status: "draft" as ArticleStatus,
};

function parseTags(text: string): string[] {
    return text
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
}

function formatDate(iso: string | null) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString();
    } catch {
        return iso;
    }
}

export default function OfficerArticlesPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [form, setForm] = useState(DEFAULT_FORM);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchArticles = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/officer/articles", { cache: "no-store" });
            const data = (await res.json()) as { articles?: Article[]; error?: string };
            if (!res.ok) throw new Error(data.error || "Failed to load articles");
            setArticles(data.articles ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load articles");
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchArticles();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setForm(DEFAULT_FORM);
    };

    const startEdit = (a: Article) => {
        setEditingId(a.id);
        setForm({
            title: a.title,
            summary: a.summary,
            body: a.body,
            category: a.category,
            tags: a.tags.join(", "),
            status: a.status,
        });
        setError(null);
        setSuccess(null);
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (!form.title.trim() || !form.summary.trim() || !form.body.trim()) {
            setError("Title, summary and body are required");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                title: form.title.trim(),
                summary: form.summary.trim(),
                body: form.body.trim(),
                category: form.category.trim() || "general",
                tags: parseTags(form.tags),
                status: form.status,
            };
            const url = editingId
                ? `/api/officer/articles/${editingId}`
                : "/api/officer/articles";
            const method = editingId ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = (await res.json()) as { error?: string };
            if (!res.ok) throw new Error(data.error || "Failed to save article");
            setSuccess(editingId ? "Article updated." : "Article created.");
            resetForm();
            await fetchArticles();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save article");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (typeof window !== "undefined" && !window.confirm("Delete this article?")) {
            return;
        }
        setError(null);
        setSuccess(null);
        setSaving(true);
        try {
            const res = await fetch(`/api/officer/articles/${id}`, { method: "DELETE" });
            const data = (await res.json()) as { error?: string };
            if (!res.ok) throw new Error(data.error || "Failed to delete article");
            setSuccess("Article deleted.");
            if (editingId === id) resetForm();
            await fetchArticles();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete article");
        } finally {
            setSaving(false);
        }
    };

    const publishedCount = useMemo(
        () => articles.filter((a) => a.status === "published").length,
        [articles]
    );

    return (
        <div className="space-y-4">
            <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                <CardHeader>
                    <CardTitle>{editingId ? "Edit Article" : "New Article"}</CardTitle>
                    <CardDescription className="text-black/65 dark:text-white/65">
                        Published articles appear in the user dashboard and are referenced by the
                        EpiGuard chatbot.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <label className="text-sm md:col-span-2">
                                Title *
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="mt-1 w-full rounded-md border bg-transparent px-3 py-2"
                                    placeholder="e.g. Preventing Dengue During Monsoon"
                                    maxLength={200}
                                />
                            </label>

                            <label className="text-sm md:col-span-2">
                                Summary * <span className="text-black/50 dark:text-white/50">(used by chatbot)</span>
                                <textarea
                                    value={form.summary}
                                    onChange={(e) => setForm({ ...form, summary: e.target.value })}
                                    className="mt-1 min-h-20 w-full rounded-md border bg-transparent px-3 py-2"
                                    placeholder="One or two sentences the AI will use to decide whether this article is relevant."
                                    maxLength={400}
                                />
                            </label>

                            <label className="text-sm md:col-span-2">
                                Body *
                                <textarea
                                    value={form.body}
                                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                                    className="mt-1 min-h-48 w-full rounded-md border bg-transparent px-3 py-2"
                                    placeholder="Full article content shown to users."
                                />
                            </label>

                            <label className="text-sm">
                                Category
                                <input
                                    type="text"
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="mt-1 w-full rounded-md border bg-transparent px-3 py-2"
                                    placeholder="prevention, outbreak, nutrition, …"
                                />
                            </label>

                            <label className="text-sm">
                                Tags <span className="text-black/50 dark:text-white/50">(comma-separated)</span>
                                <input
                                    type="text"
                                    value={form.tags}
                                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                                    className="mt-1 w-full rounded-md border bg-transparent px-3 py-2"
                                    placeholder="dengue, mosquito, prevention"
                                />
                            </label>

                            <label className="text-sm">
                                Status
                                <select
                                    value={form.status}
                                    onChange={(e) =>
                                        setForm({ ...form, status: e.target.value as ArticleStatus })
                                    }
                                    className="mt-1 w-full rounded-md border bg-transparent px-3 py-2"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-black"
                            >
                                {saving
                                    ? "Saving…"
                                    : editingId
                                        ? "Update Article"
                                        : "Create Article"}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-md border px-4 py-2 text-sm"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                        {error && <p className="text-sm text-red-600">{error}</p>}
                        {success && <p className="text-sm text-green-600">{success}</p>}
                    </form>
                </CardContent>
            </Card>

            <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                <CardHeader>
                    <CardTitle>All Articles</CardTitle>
                    <CardDescription className="text-black/65 dark:text-white/65">
                        {articles.length} total · {publishedCount} published
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
                        <table className="min-w-full text-sm">
                            <thead className="bg-black/3 dark:bg-white/5">
                                <tr>
                                    <th className="px-3 py-2 text-left">Title</th>
                                    <th className="px-3 py-2 text-left">Category</th>
                                    <th className="px-3 py-2 text-left">Status</th>
                                    <th className="px-3 py-2 text-left">Author</th>
                                    <th className="px-3 py-2 text-left">Updated</th>
                                    <th className="px-3 py-2 text-left">Likes / Saves</th>
                                    <th className="px-3 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-3 py-6 text-center text-black/60 dark:text-white/60">
                                            Loading articles…
                                        </td>
                                    </tr>
                                ) : articles.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-3 py-6 text-center text-black/60 dark:text-white/60">
                                            No articles yet. Create one above.
                                        </td>
                                    </tr>
                                ) : (
                                    articles.map((a) => (
                                        <tr key={a.id} className="border-t border-black/10 dark:border-white/10 align-top">
                                            <td className="px-3 py-2">
                                                <div className="font-medium">{a.title}</div>
                                                <div className="text-xs text-black/60 dark:text-white/60 line-clamp-2 max-w-md">
                                                    {a.summary}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">{a.category}</td>
                                            <td className="px-3 py-2">
                                                <span
                                                    className={
                                                        a.status === "published"
                                                            ? "rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-300"
                                                            : "rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-300"
                                                    }
                                                >
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-xs">{a.author.name || a.author.email}</td>
                                            <td className="px-3 py-2 text-xs">{formatDate(a.updatedAt)}</td>
                                            <td className="px-3 py-2 text-xs">
                                                {a.likeCount} / {a.bookmarkCount}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(a)}
                                                        className="rounded border px-2 py-1 text-xs"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleDelete(a.id)}
                                                        disabled={saving}
                                                        className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-600 disabled:opacity-60 dark:text-red-300"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
