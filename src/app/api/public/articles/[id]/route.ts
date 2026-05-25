import { NextRequest, NextResponse } from "next/server";
import { attachReactions, SerializedArticle } from "@/controllers/articleController";
import { getCurrentUser } from "@/lib/serverAuth";

type RouteParams = { id: string };

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const API_KEY = process.env.SECRET_KEY ?? "";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<RouteParams> }
) {
    const { id } = await params;
    try {
        const res = await fetch(
            `${BACKEND}/articles/public/${encodeURIComponent(id)}`,
            { headers: { "x-api-key": API_KEY }, cache: "no-store" }
        );
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            return NextResponse.json(errData, { status: res.status });
        }
        const article = (await res.json()) as SerializedArticle;
        const user = await getCurrentUser();
        const [withReactions] = await attachReactions([article], user?.id ?? null);
        return NextResponse.json(withReactions);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch article";
        return NextResponse.json({ error: message }, { status: 502 });
    }
}
