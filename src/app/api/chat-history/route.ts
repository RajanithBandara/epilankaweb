import { NextRequest, NextResponse } from "next/server";

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const API_KEY = process.env.SECRET_KEY ?? "";

/** Extract the Appwrite JWT from cookies or Authorization header */
function getJwt(req: NextRequest): string | null {
    return (
        req.cookies.get("appwrite-jwt")?.value ??
        req.headers.get("authorization")?.replace("Bearer ", "") ??
        null
    );
}

/** Build backend request headers */
function backendHeaders(jwt: string): HeadersInit {
    return {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        Authorization: `Bearer ${jwt}`,
    };
}

/** GET /api/chat-history[?chatId=xxx] — load all chats or a single chat */
export async function GET(req: NextRequest) {
    const jwt = getJwt(req);
    if (!jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const chatId = req.nextUrl.searchParams.get("chatId");
    const url = chatId
        ? `${BACKEND}/chat/history/${chatId}`
        : `${BACKEND}/chat/history`;

    try {
        const res = await fetch(url, { headers: backendHeaders(jwt) });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error("[chat-history GET]", err);
        return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
    }
}

/** POST /api/chat-history — save a message to a specific chat */
export async function POST(req: NextRequest) {
    const jwt = getJwt(req);
    if (!jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: { chatId: string; role: string; content: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { chatId, role, content } = body;
    if (!chatId?.trim() || !role || !content?.trim()) {
        return NextResponse.json({ error: "chatId, role, and content are required" }, { status: 400 });
    }

    try {
        const res = await fetch(`${BACKEND}/chat/history/message`, {
            method: "POST",
            headers: backendHeaders(jwt),
            body: JSON.stringify({ chatId, role, content }),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error("[chat-history POST]", err);
        return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }
}

/** DELETE /api/chat-history?chatId=xxx — delete a specific chat */
export async function DELETE(req: NextRequest) {
    const jwt = getJwt(req);
    if (!jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const chatId = req.nextUrl.searchParams.get("chatId");
    if (!chatId) {
        return NextResponse.json({ error: "chatId query parameter required" }, { status: 400 });
    }

    try {
        const res = await fetch(`${BACKEND}/chat/history/${chatId}`, {
            method: "DELETE",
            headers: backendHeaders(jwt),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error("[chat-history DELETE]", err);
        return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 });
    }
}
