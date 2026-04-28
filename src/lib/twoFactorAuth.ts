import { AuthenticatorType } from 'appwrite';
import { account } from '@/lib/appwrite';

export interface TotpSetupData {
  secret: string;
  uri: string;
  qrCodeUrl: string;
}

/** Step 1 – create TOTP authenticator. Returns secret, URI and QR image URL. */
export async function createTotpAuthenticator(): Promise<TotpSetupData> {
  const auth = await account.createMFAAuthenticator(AuthenticatorType.Totp);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(auth.uri)}`;
  return { secret: auth.secret, uri: auth.uri, qrCodeUrl };
}

/** Step 2 – verify the OTP from the user's authenticator app (updateMFAAuthenticator is the "verify" call). */
export async function verifyTotpAuthenticator(otp: string): Promise<void> {
  await account.updateMFAAuthenticator(AuthenticatorType.Totp, otp);
}

/** Step 3 – enable MFA enforcement on the account. */
export async function enableMfa(): Promise<void> {
  await account.updateMFA(true);
}

/** Disable MFA on the account. */
export async function disableMfa(): Promise<void> {
  await account.updateMFA(false);
}

/** Remove the TOTP authenticator. */
export async function deleteTotpAuthenticator(): Promise<void> {
  await account.deleteMFAAuthenticator(AuthenticatorType.Totp);
}

/** Generate one-time recovery codes. */
export async function createRecoveryCodes(): Promise<string[]> {
  const result = await account.createMFARecoveryCodes();
  return result.recoveryCodes;
}

/** Check which MFA factors are registered / verified for the current user. */
export async function listMfaFactors() {
  return await account.listMFAFactors();
}
