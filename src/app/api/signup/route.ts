export const runtime = 'nodejs';

/**
 * POST /api/signup
 * Signup now happens client-side via the Appwrite SDK.
 * This stub remains for any backwards-compatible calls.
 */
export async function POST() {
  return Response.json(
    { message: 'Use client-side Appwrite SDK for signup. See AuthPage.tsx.' },
    { status: 400 }
  );
}
