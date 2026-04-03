import { NextResponse } from "next/server";

/**
 * POST /api/admin/auth/session
 * Stores the Appwrite JWT for an admin in an HttpOnly cookie.
 */
export async function POST(req: Request) {
  try {
    const { jwt } = (await req.json()) as { jwt?: string };

    if (!jwt) {
      return NextResponse.json({ message: "Missing JWT" }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });

    res.cookies.set("appwrite-admin-jwt", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 55, // 55 min — Appwrite JWTs expire in 1h
    });

    return res;
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
