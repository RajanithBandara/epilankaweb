import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";

const APPWRITE_ENDPOINT = (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "").replace(/\/$/, "");
const APPWRITE_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
const COLLECTION = "chat_sessions";

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

/** POST /api/chat-history/new — create a new chat session */
export async function POST(req: NextRequest) {
    const userId = await getUserId(req);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const db = await getMongoDb();
        const now = new Date().toISOString();
        const chatId = Date.now().toString(36) + Math.random().toString(36).slice(2);

        const newChat = {
            id: chatId,
            title: "New Chat",
            messages: [],
            createdAt: now,
            updatedAt: now,
        };

        await db.collection(COLLECTION).updateOne(
            { userId },
            {
                $push: { chats: newChat },
                $set: { updatedAt: now },
                $setOnInsert: { createdAt: now },
            } as unknown as Record<string, unknown>,
            { upsert: true }
        );

        return NextResponse.json({ chatId, chat: newChat });
    } catch (err) {
        console.error("[chat-history/new POST]", err);
        return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
    }
}



