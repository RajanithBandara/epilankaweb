import { NextResponse } from "next/server";

/**
 * POST /api/admin/auth/logout
 * Clears the admin Appwrite JWT cookie.
 * Client-side account.deleteSession() is called in the layout handleLogout.
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });

  res.cookies.set("appwrite-admin-jwt", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
