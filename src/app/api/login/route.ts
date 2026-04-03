export const runtime = 'nodejs';

/**
 * POST /api/login
 * Kept for backwards compatibility but now redirects to /api/auth/session.
 * The actual Appwrite session is created client-side in AuthPage.tsx.
 */
export async function POST() {
  return Response.json(
    { message: 'Use client-side Appwrite SDK. POST /api/auth/session to store the JWT cookie.' },
    { status: 400 }
  );
}
