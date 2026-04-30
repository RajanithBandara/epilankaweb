import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";

const APPWRITE_ENDPOINT = (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "").replace(/\/$/, "");
const APPWRITE_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
const COLLECTION = "chat_sessions";
const MAX_MESSAGES_PER_CHAT = 100;

async function getUserId(req: NextRequest): Promise<string | null> {
    const jwt =
        req.cookies.get("appwrite-jwt")?.value ??
        req.headers.get("authorization")?.replace("Bearer ", "");

    if (!jwt || !APPWRITE_ENDPOINT || !APPWRITE_PROJECT) return null;

    try {
        const res = await fetch(`${APPWRITE_ENDPOINT}/account`, {
            headers: {
                "x-appwrite-project": APPWRITE_PROJECT,
                "x-appwrite-jwt": jwt,
                "Content-Type": "application/json",
            },
        });
        if (!res.ok) return null;
        const user = await res.json() as { $id: string };
        return user.$id ?? null;
    } catch {
        return null;
    }
}

/** GET /api/chat-history — load all chats or specific chat for logged-in user */
export async function GET(req: NextRequest) {
    const userId = await getUserId(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatId = req.nextUrl.searchParams.get("chatId");

    try {
        const db = await getMongoDb();
        const doc = await db
            .collection(COLLECTION)
            .findOne({ userId }, { projection: { _id: 0, chats: 1 } });

        const chats = doc?.chats ?? [];

        if (chatId) {
            const chat = chats.find((c: Record<string, unknown>) => (c as unknown as { id: string }).id === chatId);
            if (!chat) {
                return NextResponse.json({ error: "Chat not found" }, { status: 404 });
            }
            return NextResponse.json({ chat });
        }

        return NextResponse.json({ chats });
    } catch (err) {
        console.error("[chat-history GET]", err);
        return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
    }
}

/** POST /api/chat-history — save a message to a specific chat */
export async function POST(req: NextRequest) {
    const userId = await getUserId(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: {
        chatId: string;
        role: "user" | "assistant";
        content: string;
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { chatId, role, content } = body;
    if (!chatId?.trim() || !role || !content?.trim()) {
        return NextResponse.json({ error: "chatId, role, and content are required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newMessage = { role, content: content.trim(), createdAt: now };

    try {
        const db = await getMongoDb();

        const update = {
            $push: {
                "chats.$[chat].messages": {
                    $each: [newMessage],
                    $slice: -MAX_MESSAGES_PER_CHAT,
                },
            },
            $set: { "chats.$[chat].updatedAt": now, updatedAt: now },
        } as unknown as Record<string, unknown>;

        const result = await db.collection(COLLECTION).updateOne(
            { userId, "chats.id": chatId },
            update,
            { arrayFilters: [{ "chat.id": chatId }] }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true, message: newMessage });
    } catch (err) {
        console.error("[chat-history POST]", err);
        return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }
}

/** DELETE /api/chat-history — delete a specific chat */
export async function DELETE(req: NextRequest) {
    const userId = await getUserId(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatId = req.nextUrl.searchParams.get("chatId");
    if (!chatId) {
        return NextResponse.json({ error: "chatId query parameter required" }, { status: 400 });
    }

    try {
        const db = await getMongoDb();
        await db.collection(COLLECTION).updateOne(
            { userId },
            { $pull: { chats: { id: chatId } }, $set: { updatedAt: new Date().toISOString() } }
        );
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[chat-history DELETE]", err);
        return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 });
    }
}
