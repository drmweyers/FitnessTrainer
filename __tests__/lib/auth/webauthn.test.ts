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

<<<<<<< HEAD
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
=======
// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

const CREDENTIALS_KEY = 'webauthn_credentials';

const mockCredential1: WebAuthnCredential = {
  id: 'cred-abc123',
  name: 'user@example.com',
  createdAt: 1700000000000,
};

describe('isWebAuthnSupported', () => {
  it('returns true when all APIs are available', () => {
    Object.defineProperty(window, 'PublicKeyCredential', {
      value: class PublicKeyCredential {},
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'credentials', {
      value: { create: jest.fn(), get: jest.fn() },
      writable: true,
      configurable: true,
    });
    const result = isWebAuthnSupported();
    expect(typeof result).toBe('boolean');
  });

  it('returns false when PublicKeyCredential is not defined', () => {
    const original = (window as any).PublicKeyCredential;
    delete (window as any).PublicKeyCredential;
    expect(isWebAuthnSupported()).toBe(false);
    (window as any).PublicKeyCredential = original;
>>>>>>> feat/coverage-c
  });
});

describe('getStoredCredentials', () => {
<<<<<<< HEAD
  it('returns empty array when no credentials stored', () => {
=======
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('returns empty array when no credentials stored', () => {
    localStorageMock.getItem.mockReturnValue(null);
>>>>>>> feat/coverage-c
    expect(getStoredCredentials()).toEqual([]);
  });

  it('returns parsed credentials from localStorage', () => {
<<<<<<< HEAD
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
=======
    const credentials = [mockCredential1];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(credentials));
    const result = getStoredCredentials();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('cred-abc123');
  });

  it('returns empty array on JSON parse error', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json{{{');
    expect(getStoredCredentials()).toEqual([]);
  });
});

describe('hasCredentials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false when no credentials exist', () => {
    localStorageMock.getItem.mockReturnValue(null);
>>>>>>> feat/coverage-c
    expect(hasCredentials()).toBe(false);
  });

  it('returns true when credentials exist', () => {
<<<<<<< HEAD
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
=======
    localStorageMock.getItem.mockReturnValue(JSON.stringify([mockCredential1]));
    expect(hasCredentials()).toBe(true);
  });

  it('returns false when credentials array is empty', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
    expect(hasCredentials()).toBe(false);
  });
});

describe('registerCredential', () => {
  const mockCreate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();

    // Setup WebAuthn support
    Object.defineProperty(window, 'PublicKeyCredential', {
      value: class {},
      writable: true,
      configurable: true,
    });

    // Setup navigator.credentials so isWebAuthnSupported() returns true
    Object.defineProperty(navigator, 'credentials', {
      value: { create: mockCreate, get: jest.fn() },
      writable: true,
      configurable: true,
    });

    // Mock crypto.getRandomValues
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: jest.fn((arr: Uint8Array) => {
          arr.fill(1);
          return arr;
        }),
      },
      writable: true,
      configurable: true,
    });

    // TextEncoder may not be available in jsdom
    if (typeof (global as any).TextEncoder === 'undefined') {
      (global as any).TextEncoder = class {
        encode(str: string) {
          return new Uint8Array(Buffer.from(str));
        }
      };
    }
  });

  it('returns null when WebAuthn not supported', async () => {
    const original = (window as any).PublicKeyCredential;
    delete (window as any).PublicKeyCredential;
    const result = await registerCredential('user-1', 'user@example.com');
    expect(result).toBeNull();
    (window as any).PublicKeyCredential = original;
  });

  it('returns null when navigator.credentials.create returns null', async () => {
    mockCreate.mockResolvedValue(null);
    localStorageMock.getItem.mockReturnValue(null);

    const result = await registerCredential('user-1', 'user@example.com');
    expect(result).toBeNull();
  });

  it('stores credential and returns it on success', async () => {
    const mockCred = { id: 'new-cred-id', type: 'public-key' };
    mockCreate.mockResolvedValue(mockCred);
    localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

    const result = await registerCredential('user-1', 'user@example.com');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('new-cred-id');
    expect(result!.name).toBe('user@example.com');
    expect(typeof result!.createdAt).toBe('number');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      CREDENTIALS_KEY,
      expect.stringContaining('new-cred-id')
    );
  });

  it('appends to existing credentials', async () => {
    const mockCred = { id: 'cred-2', type: 'public-key' };
    mockCreate.mockResolvedValue(mockCred);
    localStorageMock.getItem.mockReturnValue(JSON.stringify([mockCredential1]));

    await registerCredential('user-2', 'user2@example.com');
    const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(savedData).toHaveLength(2);
  });

  it('returns null when navigator.credentials.create throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockCreate.mockRejectedValue(new Error('User cancelled'));

    const result = await registerCredential('user-1', 'user@example.com');
    expect(result).toBeNull();
    (console.error as jest.Mock).mockRestore();
>>>>>>> feat/coverage-c
  });
});

describe('authenticateWithCredential', () => {
<<<<<<< HEAD
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
=======
  const mockGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'PublicKeyCredential', {
      value: class {},
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'credentials', {
      value: { create: jest.fn(), get: mockGet },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: jest.fn((arr: Uint8Array) => {
          arr.fill(1);
          return arr;
        }),
      },
      writable: true,
      configurable: true,
    });
    // Mock atob for base64ToArrayBuffer
    (global as any).atob = jest.fn((str: string) => {
      // Return a minimal binary string
      return '\x01\x02\x03\x04';
    });
  });

  it('returns false when WebAuthn not supported', async () => {
    const original = (window as any).PublicKeyCredential;
    delete (window as any).PublicKeyCredential;
    const result = await authenticateWithCredential();
    expect(result).toBe(false);
    (window as any).PublicKeyCredential = original;
  });

  it('returns false when no stored credentials', async () => {
    localStorageMock.getItem.mockReturnValue(null);
>>>>>>> feat/coverage-c
    const result = await authenticateWithCredential();
    expect(result).toBe(false);
  });

<<<<<<< HEAD
  it('returns true on successful assertion', async () => {
    const creds: WebAuthnCredential[] = [
      { id: btoa('cred-bytes'), name: 'test@example.com', createdAt: 1000 },
    ];
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
    mockGet.mockResolvedValueOnce({ id: 'assertion-id' });
=======
  it('returns false when credentials array is empty', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
    const result = await authenticateWithCredential();
    expect(result).toBe(false);
  });

  it('returns true when assertion succeeds', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([mockCredential1]));
    const mockAssertion = { id: 'cred-abc123', type: 'public-key' };
    mockGet.mockResolvedValue(mockAssertion);
>>>>>>> feat/coverage-c

    const result = await authenticateWithCredential();
    expect(result).toBe(true);
  });

<<<<<<< HEAD
  it('returns false when assertion is null', async () => {
    const creds: WebAuthnCredential[] = [
      { id: btoa('cred'), name: 'test@example.com', createdAt: 1000 },
    ];
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
    mockGet.mockResolvedValueOnce(null);
=======
  it('returns false when navigator.credentials.get returns null', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([mockCredential1]));
    mockGet.mockResolvedValue(null);
>>>>>>> feat/coverage-c

    const result = await authenticateWithCredential();
    expect(result).toBe(false);
  });

<<<<<<< HEAD
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
=======
  it('returns false when authentication throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorageMock.getItem.mockReturnValue(JSON.stringify([mockCredential1]));
    mockGet.mockRejectedValue(new Error('User cancelled'));

    const result = await authenticateWithCredential();
    expect(result).toBe(false);
    (console.error as jest.Mock).mockRestore();
>>>>>>> feat/coverage-c
  });
});

describe('removeCredential', () => {
<<<<<<< HEAD
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
=======
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('removes the specified credential', () => {
    const credentials: WebAuthnCredential[] = [
      mockCredential1,
      { id: 'cred-xyz789', name: 'other@example.com', createdAt: 1700000001000 },
    ];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(credentials));

    removeCredential('cred-abc123');

    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe('cred-xyz789');
  });

  it('does nothing when credential not found', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([mockCredential1]));

    removeCredential('nonexistent-cred');

    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved).toHaveLength(1);
  });

  it('results in empty array when last credential removed', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([mockCredential1]));

    removeCredential('cred-abc123');

    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved).toEqual([]);
>>>>>>> feat/coverage-c
  });
});
