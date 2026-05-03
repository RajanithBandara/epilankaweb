export const runtime = 'nodejs';

import { account } from '@/lib/appwrite';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return Response.json(
        { message: 'Verification code required' },
        { status: 400 }
      );
    }

    try {
      // Verify the TOTP code with current session
      // This completes the MFA challenge
      await (account as any).completeMfaChallenge(code);

      // Get JWT token
      const jwtObj = await account.createJWT();

      return Response.json({
        success: true,
        jwt: jwtObj.jwt,
      });
    } catch (err) {
      return Response.json(
        { message: 'Invalid or expired code' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('MFA verification error:', error);
    return Response.json(
      { message: 'Error verifying code' },
      { status: 500 }
    );
  }
}

