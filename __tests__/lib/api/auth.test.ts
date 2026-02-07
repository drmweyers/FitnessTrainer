/**
 * Tests for lib/api/auth.ts (Auth API + token utilities)
 */

// Mock apiClient before importing auth module
jest.mock('@/lib/api/apiClient', () => {
  const ApiClientError = class extends Error {
    statusCode: number;
    code?: string;
    originalResponse?: any;
    constructor(message: string, statusCode: number, code?: string, originalResponse?: any) {
      super(message);
      this.name = 'ApiClientError';
      this.statusCode = statusCode;
      this.code = code;
      this.originalResponse = originalResponse;
    }
  };

  return {
    apiClient: {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    },
    ApiClientError,
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

import { authApi, AuthApiError, tokenUtils } from '@/lib/api/auth';
import { apiClient, ApiClientError } from '@/lib/api/apiClient';

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('login', () => {
    it('sends login request with skipAuth', async () => {
      const response = { data: { tokens: { accessToken: 'at', refreshToken: 'rt' } } };
      mockedApiClient.post.mockResolvedValue(response);

      const result = await authApi.login({ email: 'test@test.com', password: 'Password1' });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/auth/login',
        expect.objectContaining({
          email: 'test@test.com',
          password: 'Password1',
          deviceInfo: expect.any(Object),
        }),
        { skipAuth: true, skipRefresh: true }
      );
      expect(result).toEqual(response);
    });

    it('throws AuthApiError on ApiClientError', async () => {
      mockedApiClient.post.mockRejectedValue(
        new ApiClientError('Invalid credentials', 401, 'AUTH_FAILED')
      );

      try {
        await authApi.login({ email: 'bad@test.com', password: 'wrong' });
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AuthApiError);
        expect((err as AuthApiError).message).toBe('Invalid credentials');
        expect((err as AuthApiError).statusCode).toBe(401);
      }
    });

    it('throws AuthApiError for network errors', async () => {
      mockedApiClient.post.mockRejectedValue(new TypeError('fetch failed'));

      try {
        await authApi.login({ email: 'test@test.com', password: 'Password1' });
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AuthApiError);
        expect((err as AuthApiError).message).toBe('Network error: Unable to connect to server');
        expect((err as AuthApiError).code).toBe('NETWORK_ERROR');
      }
    });

    it('throws AuthApiError for unknown errors', async () => {
      mockedApiClient.post.mockRejectedValue('random string');

      try {
        await authApi.login({ email: 'test@test.com', password: 'Password1' });
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AuthApiError);
        expect((err as AuthApiError).message).toBe('Unknown error occurred');
      }
    });
  });

  describe('register', () => {
    it('sends registration data with skipAuth', async () => {
      const response = { data: { user: { id: 'u1' } } };
      mockedApiClient.post.mockResolvedValue(response);

      const result = await authApi.register({
        email: 'new@test.com',
        password: 'Password1',
        role: 'trainer' as any,
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/auth/register',
        expect.objectContaining({
          email: 'new@test.com',
          password: 'Password1',
          role: 'trainer',
          deviceInfo: expect.any(Object),
        }),
        { skipAuth: true, skipRefresh: true }
      );
      expect(result).toEqual(response);
    });

    it('wraps errors as AuthApiError', async () => {
      mockedApiClient.post.mockRejectedValue(new ApiClientError('Email taken', 409));

      await expect(authApi.register({
        email: 'taken@test.com',
        password: 'Password1',
      })).rejects.toBeInstanceOf(AuthApiError);
    });
  });

  describe('refreshToken', () => {
    it('sends refresh token request', async () => {
      const response = { data: { tokens: { accessToken: 'new-at', refreshToken: 'new-rt' } } };
      mockedApiClient.post.mockResolvedValue(response);

      const result = await authApi.refreshToken({ refreshToken: 'old-rt' });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/auth/refresh',
        expect.objectContaining({
          refreshToken: 'old-rt',
          deviceInfo: expect.any(Object),
        }),
        { skipAuth: true, skipRefresh: true }
      );
      expect(result).toEqual(response);
    });
  });

  describe('getCurrentUser', () => {
    it('fetches current user (authenticated)', async () => {
      const response = { data: { user: { id: 'u1', email: 'me@test.com' } } };
      mockedApiClient.get.mockResolvedValue(response);

      const result = await authApi.getCurrentUser();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(response);
    });
  });

  describe('logout', () => {
    it('sends logout request', async () => {
      mockedApiClient.post.mockResolvedValue({ success: true });

      await authApi.logout({ refreshToken: 'rt' });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'rt' });
    });
  });

  describe('forgotPassword', () => {
    it('sends forgot password with skipAuth', async () => {
      mockedApiClient.post.mockResolvedValue({ message: 'Email sent' });

      await authApi.forgotPassword({ email: 'forgot@test.com' });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/auth/forgot-password',
        { email: 'forgot@test.com' },
        { skipAuth: true, skipRefresh: true }
      );
    });
  });

  describe('resetPassword', () => {
    it('sends reset password with skipAuth', async () => {
      mockedApiClient.post.mockResolvedValue({ message: 'Password reset' });

      await authApi.resetPassword({ token: 'reset-token', password: 'NewPassword1' });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/auth/reset-password',
        { token: 'reset-token', password: 'NewPassword1' },
        { skipAuth: true, skipRefresh: true }
      );
    });
  });

  describe('changePassword', () => {
    it('sends change password (authenticated)', async () => {
      mockedApiClient.put.mockResolvedValue({ message: 'Changed' });

      await authApi.changePassword({ currentPassword: 'Old1', newPassword: 'New1' } as any);

      expect(mockedApiClient.put).toHaveBeenCalledWith(
        '/auth/change-password',
        { currentPassword: 'Old1', newPassword: 'New1' }
      );
    });
  });

  describe('verifyEmail', () => {
    it('sends verify email with skipAuth', async () => {
      mockedApiClient.post.mockResolvedValue({ message: 'Verified' });

      await authApi.verifyEmail({ token: 'verify-token' });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/auth/verify-email',
        { token: 'verify-token' },
        { skipAuth: true, skipRefresh: true }
      );
    });
  });

  describe('resendVerification', () => {
    it('sends resend verification with skipAuth', async () => {
      mockedApiClient.post.mockResolvedValue({ message: 'Sent' });

      await authApi.resendVerification({ email: 'resend@test.com' });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/auth/resend-verification',
        { email: 'resend@test.com' },
        { skipAuth: true, skipRefresh: true }
      );
    });
  });
});

describe('tokenUtils', () => {
  // tokenUtils checks `typeof window === 'undefined'` and early-returns in Node.
  // We need to define `window` to make it work in the node test environment.
  beforeEach(() => {
    localStorageMock.clear();
    // Define window so tokenUtils doesn't early-return
    if (typeof (global as any).window === 'undefined') {
      (global as any).window = {};
    }
  });

  afterEach(() => {
    // We don't delete window since localStorage is on global and tokenUtils needs it
  });

  describe('getTokens', () => {
    it('returns tokens from localStorage', () => {
      // Set up mock returns before calling
      jest.spyOn(localStorage, 'getItem')
        .mockReturnValueOnce('access-token-value')
        .mockReturnValueOnce('refresh-token-value');

      const result = tokenUtils.getTokens();

      expect(result).toEqual({
        accessToken: 'access-token-value',
        refreshToken: 'refresh-token-value',
      });
    });

    it('returns null values when no tokens stored', () => {
      jest.spyOn(localStorage, 'getItem').mockReturnValue(null);

      const result = tokenUtils.getTokens();

      expect(result).toEqual({
        accessToken: null,
        refreshToken: null,
      });
    });
  });

  describe('setTokens', () => {
    it('stores tokens in localStorage', () => {
      const spy = jest.spyOn(localStorage, 'setItem');

      tokenUtils.setTokens('new-access', 'new-refresh');

      expect(spy).toHaveBeenCalledWith('accessToken', 'new-access');
      expect(spy).toHaveBeenCalledWith('refreshToken', 'new-refresh');
    });
  });

  describe('clearTokens', () => {
    it('removes tokens from localStorage', () => {
      const spy = jest.spyOn(localStorage, 'removeItem');

      tokenUtils.clearTokens();

      expect(spy).toHaveBeenCalledWith('accessToken');
      expect(spy).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('isTokenExpired', () => {
    it('returns false for valid non-expired token', () => {
      // Create a JWT with exp in the future
      const payload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hour from now
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;

      expect(tokenUtils.isTokenExpired(token)).toBe(false);
    });

    it('returns true for expired token', () => {
      const payload = { exp: Math.floor(Date.now() / 1000) - 3600 }; // 1 hour ago
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;

      expect(tokenUtils.isTokenExpired(token)).toBe(true);
    });

    it('returns true for empty string', () => {
      expect(tokenUtils.isTokenExpired('')).toBe(true);
    });

    it('returns true for malformed token', () => {
      expect(tokenUtils.isTokenExpired('not-a-jwt')).toBe(true);
    });

    it('returns true for token with invalid payload', () => {
      const token = 'header.not-valid-base64-json.signature';
      expect(tokenUtils.isTokenExpired(token)).toBe(true);
    });
  });

  describe('getTokenExpiration', () => {
    it('returns expiration in milliseconds', () => {
      const expSeconds = Math.floor(Date.now() / 1000) + 3600;
      const payload = { exp: expSeconds };
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;

      const result = tokenUtils.getTokenExpiration(token);

      expect(result).toBe(expSeconds * 1000);
    });

    it('returns null for empty string', () => {
      expect(tokenUtils.getTokenExpiration('')).toBeNull();
    });

    it('returns null for malformed token', () => {
      expect(tokenUtils.getTokenExpiration('bad-token')).toBeNull();
    });

    it('returns null for invalid payload', () => {
      const token = 'header.!!invalid!!.signature';
      expect(tokenUtils.getTokenExpiration(token)).toBeNull();
    });
  });
});

describe('AuthApiError', () => {
  it('extends ApiClientError', () => {
    const err = new AuthApiError('Auth failed', 401, 'AUTH_ERROR');
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err.name).toBe('AuthApiError');
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('AUTH_ERROR');
  });
});
