import { NextResponse } from "next/server";

// If you want to verify token here, you can with Firebase Admin SDK.
// For now: just store it as HttpOnly cookie (still better than JS cookie).
export async function POST(req: Request) {
    try {
        const { token } = (await req.json()) as { token?: string };

        if (!token) {
            return NextResponse.json({ error: "Missing token" }, { status: 400 });
        }

        const res = NextResponse.json({ ok: true });

        res.cookies.set("firebase-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60,
        });

        return res;
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
