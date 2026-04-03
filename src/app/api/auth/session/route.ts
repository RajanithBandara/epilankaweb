export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

/**
 * POST /api/auth/session
 * Receives the Appwrite JWT from the browser, stores it as HttpOnly cookie,
 * then fires a background profile sync to FastAPI (non-blocking).
 */
export async function POST(req: Request) {
  try {
    const { jwt } = (await req.json()) as { jwt?: string };

    if (!jwt) {
      return NextResponse.json({ message: 'Missing JWT' }, { status: 400 });
    }

    // Fire-and-forget profile sync — do NOT await so login is never blocked
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const apiKey = process.env.NEXT_PUBLIC_SECRET_KEY;
    if (apiUrl && apiKey) {
      fetch(`${apiUrl}/users/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          Authorization: `Bearer ${jwt}`,
        },
        // 5-second timeout via AbortController
        signal: AbortSignal.timeout(5000),
      }).catch((err) => {
        console.warn('[session] profile sync skipped:', err?.message ?? err);
      });
    }

    const res = NextResponse.json({ ok: true });

    // Store JWT as HttpOnly cookie — inaccessible to JavaScript
    res.cookies.set('appwrite-jwt', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 55, // 55 min (Appwrite JWTs expire in 1h)
    });

    return res;
  } catch {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }
}
