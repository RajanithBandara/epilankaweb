import { NextRequest, NextResponse } from "next/server";

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
            `${BACKEND}/articles/public/${encodeURIComponent(id)}/analysis`,
            { headers: { "x-api-key": API_KEY }, cache: "no-store" }
        );
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch article analysis";
        return NextResponse.json({ error: message }, { status: 502 });
    }
}
