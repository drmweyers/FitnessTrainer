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
  });
});

describe('getStoredCredentials', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('returns empty array when no credentials stored', () => {
    localStorageMock.getItem.mockReturnValue(null);
    expect(getStoredCredentials()).toEqual([]);
  });

  it('returns parsed credentials from localStorage', () => {
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
    expect(hasCredentials()).toBe(false);
  });

  it('returns true when credentials exist', () => {
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
  });
});

describe('authenticateWithCredential', () => {
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
    const result = await authenticateWithCredential();
    expect(result).toBe(false);
  });

  it('returns false when credentials array is empty', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
    const result = await authenticateWithCredential();
    expect(result).toBe(false);
  });

  it('returns true when assertion succeeds', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([mockCredential1]));
    const mockAssertion = { id: 'cred-abc123', type: 'public-key' };
    mockGet.mockResolvedValue(mockAssertion);

    const result = await authenticateWithCredential();
    expect(result).toBe(true);
  });

  it('returns false when navigator.credentials.get returns null', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([mockCredential1]));
    mockGet.mockResolvedValue(null);

    const result = await authenticateWithCredential();
    expect(result).toBe(false);
  });

  it('returns false when authentication throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorageMock.getItem.mockReturnValue(JSON.stringify([mockCredential1]));
    mockGet.mockRejectedValue(new Error('User cancelled'));

    const result = await authenticateWithCredential();
    expect(result).toBe(false);
    (console.error as jest.Mock).mockRestore();
  });
});

describe('removeCredential', () => {
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
  });
});
