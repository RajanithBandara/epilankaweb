import { NextResponse } from "next/server";
import { attachReactions, SerializedArticle } from "@/controllers/articleController";
import { getCurrentUser } from "@/lib/serverAuth";

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const API_KEY = process.env.SECRET_KEY ?? "";

export async function GET() {
    try {
        const res = await fetch(`${BACKEND}/articles/public`, {
            headers: { "x-api-key": API_KEY },
            cache: "no-store",
        });
        const data = (await res.json()) as { articles?: SerializedArticle[]; error?: string };
        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }
        const articles = data.articles ?? [];
        const user = await getCurrentUser();
        const withReactions = await attachReactions(articles, user?.id ?? null);
        return NextResponse.json({ articles: withReactions });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to list articles";
        return NextResponse.json({ error: message }, { status: 502 });
    }
}
