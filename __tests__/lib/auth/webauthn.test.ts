/**
 * @jest-environment jsdom
 */

import {
  isWebAuthnSupported,
  getStoredCredentials,
  hasCredentials,
  registerCredential,
  authenticateWithCredential,
  removeCredential,
  WebAuthnCredential,
} from '@/lib/auth/webauthn';

const CREDENTIALS_KEY = 'webauthn_credentials';

// Set up a working WebAuthn environment at the module level
const mockCreate = jest.fn();
const mockGet = jest.fn();

beforeAll(() => {
  // TextEncoder is available in Node but not always in jsdom
  if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = require('util').TextEncoder;
  }
  // Define PublicKeyCredential
  Object.defineProperty(window, 'PublicKeyCredential', {
    value: class PublicKeyCredential {},
    writable: true,
    configurable: true,
  });
  // Define navigator.credentials
  Object.defineProperty(navigator, 'credentials', {
    value: { create: mockCreate, get: mockGet },
    writable: true,
    configurable: true,
  });
});

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('isWebAuthnSupported', () => {
  it('returns true when credentials and PublicKeyCredential are available', () => {
    expect(isWebAuthnSupported()).toBe(true);
  });

  it('returns false when PublicKeyCredential is undefined', () => {
    const original = window.PublicKeyCredential;
    Object.defineProperty(window, 'PublicKeyCredential', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    expect(isWebAuthnSupported()).toBe(false);
    Object.defineProperty(window, 'PublicKeyCredential', {
      value: original,
      writable: true,
      configurable: true,
    });
  });
});

describe('getStoredCredentials', () => {
  it('returns empty array when no credentials stored', () => {
    expect(getStoredCredentials()).toEqual([]);
  });

  it('returns parsed credentials from localStorage', () => {
    const creds: WebAuthnCredential[] = [
      { id: 'cred-1', name: 'test@example.com', createdAt: 1000000 },
    ];
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
    expect(getStoredCredentials()).toEqual(creds);
  });

  it('returns empty array on malformed JSON', () => {
    localStorage.setItem(CREDENTIALS_KEY, 'not-valid-json{{{');
    expect(getStoredCredentials()).toEqual([]);
  });

  it('returns multiple stored credentials', () => {
    const creds: WebAuthnCredential[] = [
      { id: 'cred-1', name: 'a@b.com', createdAt: 1000 },
      { id: 'cred-2', name: 'c@d.com', createdAt: 2000 },
    ];
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
    expect(getStoredCredentials()).toHaveLength(2);
  });
});

describe('hasCredentials', () => {
  it('returns false when no credentials stored', () => {
    expect(hasCredentials()).toBe(false);
  });

  it('returns true when credentials exist', () => {
    const creds: WebAuthnCredential[] = [
      { id: 'cred-1', name: 'test@example.com', createdAt: 1000000 },
    ];
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
    expect(hasCredentials()).toBe(true);
  });
});

describe('registerCredential', () => {
  it('returns null when WebAuthn is not supported', async () => {
    const original = window.PublicKeyCredential;
    Object.defineProperty(window, 'PublicKeyCredential', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const result = await registerCredential('user-1', 'test@example.com');
    expect(result).toBeNull();
    Object.defineProperty(window, 'PublicKeyCredential', {
      value: original,
      writable: true,
      configurable: true,
    });
  });

  it('stores credential in localStorage on success', async () => {
    mockCreate.mockResolvedValueOnce({ id: 'new-cred-id' });

    const result = await registerCredential('user-1', 'test@example.com');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('new-cred-id');
    expect(result?.name).toBe('test@example.com');

    const stored = getStoredCredentials();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('new-cred-id');
  });

  it('returns null when navigator.credentials.create returns null', async () => {
    mockCreate.mockResolvedValueOnce(null);

    const result = await registerCredential('user-1', 'test@example.com');
    expect(result).toBeNull();
  });

  it('returns null on error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('User cancelled'));

    const result = await registerCredential('user-1', 'test@example.com');
    expect(result).toBeNull();
  });

  it('appends to existing credentials', async () => {
    const existing: WebAuthnCredential[] = [
      { id: 'existing-cred', name: 'existing@example.com', createdAt: 999 },
    ];
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(existing));
    mockCreate.mockResolvedValueOnce({ id: 'new-cred' });

    await registerCredential('user-2', 'new@example.com');
    const stored = getStoredCredentials();
    expect(stored).toHaveLength(2);
  });

  it('sets createdAt timestamp', async () => {
    mockCreate.mockResolvedValueOnce({ id: 'timed-cred' });
    const before = Date.now();
    const result = await registerCredential('user-1', 'test@example.com');
    const after = Date.now();

    expect(result?.createdAt).toBeGreaterThanOrEqual(before);
    expect(result?.createdAt).toBeLessThanOrEqual(after);
  });
});

describe('authenticateWithCredential', () => {
  it('returns false when WebAuthn is not supported', async () => {
    const original = window.PublicKeyCredential;
    Object.defineProperty(window, 'PublicKeyCredential', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const result = await authenticateWithCredential();
    expect(result).toBe(false);
    Object.defineProperty(window, 'PublicKeyCredential', {
      value: original,
      writable: true,
      configurable: true,
    });
  });

  it('returns false when no stored credentials', async () => {
    const result = await authenticateWithCredential();
    expect(result).toBe(false);
  });

  it('returns true on successful assertion', async () => {
    const creds: WebAuthnCredential[] = [
      { id: btoa('cred-bytes'), name: 'test@example.com', createdAt: 1000 },
    ];
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
    mockGet.mockResolvedValueOnce({ id: 'assertion-id' });

    const result = await authenticateWithCredential();
    expect(result).toBe(true);
  });

  it('returns false when assertion is null', async () => {
    const creds: WebAuthnCredential[] = [
      { id: btoa('cred'), name: 'test@example.com', createdAt: 1000 },
    ];
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
    mockGet.mockResolvedValueOnce(null);

    const result = await authenticateWithCredential();
    expect(result).toBe(false);
  });

  it('returns false on error', async () => {
    const creds: WebAuthnCredential[] = [
      { id: btoa('cred'), name: 'test@example.com', createdAt: 1000 },
    ];
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
    mockGet.mockRejectedValueOnce(new Error('Auth failed'));

    const result = await authenticateWithCredential();
    expect(result).toBe(false);
  });

  it('passes stored credentials as allowCredentials', async () => {
    const credId = btoa('my-credential');
    const creds: WebAuthnCredential[] = [
      { id: credId, name: 'test@example.com', createdAt: 1000 },
    ];
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
    mockGet.mockResolvedValueOnce({ id: 'assertion' });

    await authenticateWithCredential();

    expect(mockGet).toHaveBeenCalledWith(
      expect.objectContaining({
        publicKey: expect.objectContaining({
          allowCredentials: expect.arrayContaining([
            expect.objectContaining({ type: 'public-key' }),
          ]),
        }),
      })
    );
  });
});

describe('removeCredential', () => {
  it('removes the specified credential', () => {
    const creds: WebAuthnCredential[] = [
      { id: 'cred-1', name: 'a@b.com', createdAt: 1000 },
      { id: 'cred-2', name: 'c@d.com', createdAt: 2000 },
    ];
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));

    removeCredential('cred-1');

    const stored = getStoredCredentials();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('cred-2');
  });

  it('does nothing if credential ID not found', () => {
    const creds: WebAuthnCredential[] = [
      { id: 'cred-1', name: 'a@b.com', createdAt: 1000 },
    ];
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));

    removeCredential('non-existent');

    const stored = getStoredCredentials();
    expect(stored).toHaveLength(1);
  });

  it('handles removing from empty list', () => {
    removeCredential('any-id');
    expect(getStoredCredentials()).toEqual([]);
  });
});
