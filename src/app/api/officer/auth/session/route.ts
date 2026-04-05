import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { jwt } = (await req.json()) as { jwt?: string };

        if (!jwt) {
            return NextResponse.json({ message: "Missing JWT" }, { status: 400 });
        }

        const response = NextResponse.json({ ok: true });

        response.cookies.set("appwrite-officer-jwt", jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 3600, // 1 hour
        });

        return response;
    } catch {
        return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }
}
