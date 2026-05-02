import { NextRequest, NextResponse } from "next/server";

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const API_KEY = process.env.INTERNAL_API_KEY ?? "";

function getJwt(req: NextRequest): string | null {
    return (
        req.cookies.get("appwrite-jwt")?.value ??
        req.headers.get("authorization")?.replace("Bearer ", "") ??
        null
    );
}

/** POST /api/chat-history/new — create a new chat session via backend */
export async function POST(req: NextRequest) {
    const jwt = getJwt(req);
    if (!jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const res = await fetch(`${BACKEND}/chat/history/new`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": API_KEY,
                Authorization: `Bearer ${jwt}`,
            },
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error("[chat-history/new POST]", err);
        return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
    }
}
