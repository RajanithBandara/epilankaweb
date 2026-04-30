import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";

const APPWRITE_ENDPOINT = (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "").replace(/\/$/, "");
const APPWRITE_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
const COLLECTION = "chat_history";
const MAX_HISTORY = 100;

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

/** GET /api/chat-history — load conversation history for the logged-in user */
export async function GET(req: NextRequest) {
    const userId = await getUserId(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const db = await getMongoDb();
        const doc = await db
            .collection(COLLECTION)
            .findOne({ userId }, { projection: { _id: 0, messages: 1 } });

        return NextResponse.json({ messages: doc?.messages ?? [] });
    } catch (err) {
        console.error("[chat-history GET]", err);
        return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
    }
}

/** POST /api/chat-history — append a user+assistant turn, then trim to MAX_HISTORY */
export async function POST(req: NextRequest) {
    const userId = await getUserId(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: {
        userMessage: string;
        assistantMessage: string;
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { userMessage, assistantMessage } = body;
    if (!userMessage?.trim() || !assistantMessage?.trim()) {
        return NextResponse.json({ error: "Both messages are required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newMessages = [
        { role: "user", content: userMessage.trim(), createdAt: now },
        { role: "assistant", content: assistantMessage.trim(), createdAt: now },
    ];

    try {
        const db = await getMongoDb();

        await db.collection(COLLECTION).updateOne(
            { userId },
            {
                $push: {
                    messages: {
                        $each: newMessages,
                        $slice: -MAX_HISTORY,
                    },
                },
                $set: { updatedAt: now },
                $setOnInsert: { createdAt: now },
            },
            { upsert: true }
        );

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[chat-history POST]", err);
        return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
    }
}

/** DELETE /api/chat-history — clear history for the logged-in user */
export async function DELETE(req: NextRequest) {
    const userId = await getUserId(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const db = await getMongoDb();
        await db.collection(COLLECTION).updateOne(
            { userId },
            { $set: { messages: [], updatedAt: new Date().toISOString() } }
        );
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[chat-history DELETE]", err);
        return NextResponse.json({ error: "Failed to clear history" }, { status: 500 });
    }
}
