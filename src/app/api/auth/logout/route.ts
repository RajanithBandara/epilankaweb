import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Clears the Appwrite JWT HttpOnly cookie.
 * The Appwrite client-side session deletion is handled in AuthContext.logout().
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });

  res.cookies.set('appwrite-jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return res;
}
