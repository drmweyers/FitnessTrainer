/**
 * WebAuthn Biometric Authentication Helpers
 *
 * Uses the Web Authentication API (browser-native) for passkey-based login.
 * Supports credential registration and authentication.
 */

export interface WebAuthnCredential {
  id: string;
  name: string;
  createdAt: number;
}

const CREDENTIALS_KEY = 'webauthn_credentials';

/**
 * Checks if WebAuthn is supported in the current browser.
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'credentials' in navigator &&
    typeof window.PublicKeyCredential !== 'undefined'
  );
}

/**
 * Retrieves locally stored WebAuthn credential metadata.
 */
export function getStoredCredentials(): WebAuthnCredential[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CREDENTIALS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Checks if the user has any registered credentials.
 */
export function hasCredentials(): boolean {
  return getStoredCredentials().length > 0;
}

/**
 * Registers a new WebAuthn credential for the given user.
 *
 * @param userId - The user's ID
 * @param userEmail - The user's email (used as credential name)
 * @returns The created credential or null on failure
 */
export async function registerCredential(
  userId: string,
  userEmail: string
): Promise<WebAuthnCredential | null> {
  if (!isWebAuthnSupported()) return null;

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userIdBytes = new TextEncoder().encode(userId);

    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'EvoFit Trainer',
        id: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
      },
      user: {
        id: userIdBytes,
        name: userEmail,
        displayName: userEmail,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential | null;

    if (!credential) return null;

    const newCredential: WebAuthnCredential = {
      id: credential.id,
      name: userEmail,
      createdAt: Date.now(),
    };

    // Store credential metadata locally
    const existing = getStoredCredentials();
    existing.push(newCredential);
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(existing));

    return newCredential;
  } catch (error) {
    console.error('[WebAuthn] Registration failed:', error);
    return null;
  }
}

/**
 * Authenticates using a stored WebAuthn credential.
 *
 * @returns true on successful authentication, false on failure
 */
export async function authenticateWithCredential(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;

  const stored = getStoredCredentials();
  if (stored.length === 0) return false;

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
      allowCredentials: stored.map((cred) => ({
        id: base64ToArrayBuffer(cred.id),
        type: 'public-key' as const,
      })),
      userVerification: 'required',
      timeout: 60000,
    };

    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential | null;

    return assertion !== null;
  } catch (error) {
    console.error('[WebAuthn] Authentication failed:', error);
    return false;
  }
}

/**
 * Removes a stored credential by ID.
 *
 * @param credentialId - The credential ID to remove
 */
export function removeCredential(credentialId: string): void {
  const stored = getStoredCredentials();
  const updated = stored.filter((c) => c.id !== credentialId);
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(updated));
}

/**
 * Converts a base64 string to an ArrayBuffer.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
