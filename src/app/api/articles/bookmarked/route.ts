import { NextResponse } from "next/server";
import {
    attachReactions,
    listBookmarkedArticleIds,
    SerializedArticle,
} from "@/controllers/articleController";
import { getCurrentUser } from "@/lib/serverAuth";

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const API_KEY = process.env.SECRET_KEY ?? "";

export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ids = new Set(await listBookmarkedArticleIds(user.id));
    if (ids.size === 0) {
        return NextResponse.json({ articles: [] });
    }

    try {
        const res = await fetch(`${BACKEND}/articles/public`, {
            headers: { "x-api-key": API_KEY },
            cache: "no-store",
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            return NextResponse.json(errData, { status: res.status });
        }
        const data = (await res.json()) as { articles?: SerializedArticle[] };
        const articles = (data.articles ?? []).filter((a) => ids.has(a.id));
        const withReactions = await attachReactions(articles, user.id);
        return NextResponse.json({ articles: withReactions });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load bookmarks";
        return NextResponse.json({ error: message }, { status: 502 });
    }
}
