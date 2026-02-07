/**
 * Tests for contexts/AuthContext.tsx
 * AuthProvider, useAuth, authReducer
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Mock the auth API client and tokenUtils
const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockLogout = jest.fn();
const mockRefreshToken = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockForgotPassword = jest.fn();
const mockResetPassword = jest.fn();
const mockChangePassword = jest.fn();
const mockVerifyEmail = jest.fn();
const mockResendVerification = jest.fn();

const mockGetTokens = jest.fn();
const mockSetTokens = jest.fn();
const mockClearTokens = jest.fn();
const mockIsTokenExpired = jest.fn();
const mockGetTokenExpiration = jest.fn();

jest.mock('@/lib/api/auth', () => ({
  authApi: {
    login: (...args: any[]) => mockLogin(...args),
    register: (...args: any[]) => mockRegister(...args),
    logout: (...args: any[]) => mockLogout(...args),
    refreshToken: (...args: any[]) => mockRefreshToken(...args),
    getCurrentUser: (...args: any[]) => mockGetCurrentUser(...args),
    forgotPassword: (...args: any[]) => mockForgotPassword(...args),
    resetPassword: (...args: any[]) => mockResetPassword(...args),
    changePassword: (...args: any[]) => mockChangePassword(...args),
    verifyEmail: (...args: any[]) => mockVerifyEmail(...args),
    resendVerification: (...args: any[]) => mockResendVerification(...args),
  },
  tokenUtils: {
    getTokens: () => mockGetTokens(),
    setTokens: (...args: any[]) => mockSetTokens(...args),
    clearTokens: () => mockClearTokens(),
    isTokenExpired: (...args: any[]) => mockIsTokenExpired(...args),
    getTokenExpiration: (...args: any[]) => mockGetTokenExpiration(...args),
  },
  AuthApiError: class AuthApiError extends Error {
    statusCode: number;
    code?: string;
    constructor(message: string, statusCode: number, code?: string) {
      super(message);
      this.name = 'AuthApiError';
      this.statusCode = statusCode;
      this.code = code;
    }
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no stored tokens
    mockGetTokens.mockReturnValue({ accessToken: null, refreshToken: null });
    mockGetTokenExpiration.mockReturnValue(null);
  });

  describe('useAuth outside provider', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const spy = jest.spyOn(console, 'error').mockImplementation();
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
      spy.mockRestore();
    });
  });

  describe('initialization', () => {
    it('starts with loading true and transitions to not loading', async () => {
      mockGetTokens.mockReturnValue({ accessToken: null, refreshToken: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('restores session from valid stored tokens', async () => {
      mockGetTokens.mockReturnValue({
        accessToken: 'valid-access-token',
        refreshToken: 'valid-refresh-token',
      });
      mockIsTokenExpired.mockReturnValue(false);
      mockGetCurrentUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: 'trainer',
            isActive: true,
            isVerified: true,
          },
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
      expect(result.current.user?.email).toBe('user@test.com');
    });

    it('refreshes token when access token is expired', async () => {
      mockGetTokens.mockReturnValue({
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh',
      });
      mockIsTokenExpired.mockReturnValue(true);
      mockRefreshToken.mockResolvedValue({
        data: {
          tokens: {
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
            expiresIn: 900,
          },
        },
      });
      mockGetCurrentUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: 'client',
            isActive: true,
            isVerified: true,
          },
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
      expect(mockSetTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
    });

    it('logs out when refresh fails', async () => {
      mockGetTokens.mockReturnValue({
        accessToken: 'expired-token',
        refreshToken: 'invalid-refresh',
      });
      mockIsTokenExpired.mockReturnValue(true);
      mockRefreshToken.mockRejectedValue(new Error('Refresh failed'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockClearTokens).toHaveBeenCalled();
    });

    it('logs out when getCurrentUser fails with valid token', async () => {
      mockGetTokens.mockReturnValue({
        accessToken: 'valid-token',
        refreshToken: 'valid-refresh',
      });
      mockIsTokenExpired.mockReturnValue(false);
      mockGetCurrentUser.mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });
      expect(mockClearTokens).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('sets user and tokens on successful login', async () => {
      mockLogin.mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            email: 'user@test.com',
            role: 'trainer',
            isActive: true,
            isVerified: true,
          },
          tokens: {
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
            expiresIn: 900,
          },
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login({ email: 'user@test.com', password: 'password123' });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('user@test.com');
      expect(mockSetTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
    });

    it('sets error on login failure and re-throws', async () => {
      const { AuthApiError } = require('@/lib/api/auth');
      const authErr = new AuthApiError('Invalid credentials', 401);
      mockLogin.mockRejectedValue(authErr);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let thrownError: any;
      await act(async () => {
        try {
          await result.current.login({ email: 'bad@test.com', password: 'wrong' });
        } catch (e) {
          thrownError = e;
        }
      });

      expect(thrownError).toBeDefined();
      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('sets generic message for non-AuthApiError', async () => {
      mockLogin.mockRejectedValue(new TypeError('Network failure'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let thrownError: any;
      await act(async () => {
        try {
          await result.current.login({ email: 'user@test.com', password: 'pass1234' });
        } catch (e) {
          thrownError = e;
        }
      });

      expect(thrownError).toBeDefined();
      expect(result.current.error).toBe('Login failed. Please try again.');
    });
  });

  describe('register', () => {
    it('sets user and tokens on successful registration', async () => {
      mockRegister.mockResolvedValue({
        data: {
          user: {
            id: 'new-user',
            email: 'new@test.com',
            role: 'client',
            isActive: true,
            isVerified: true,
          },
          tokens: {
            accessToken: 'access',
            refreshToken: 'refresh',
            expiresIn: 900,
          },
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register({
          email: 'new@test.com',
          password: 'Password1',
          role: 'client',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('new@test.com');
    });
  });

  describe('logout', () => {
    it('clears state and tokens on logout', async () => {
      // First login
      mockLogin.mockResolvedValue({
        data: {
          user: { id: 'u1', email: 'a@b.com', role: 'client' },
          tokens: { accessToken: 'a', refreshToken: 'r', expiresIn: 900 },
        },
      });
      mockGetTokens.mockReturnValue({ accessToken: null, refreshToken: 'r' });
      mockLogout.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login({ email: 'a@b.com', password: 'password123' });
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockClearTokens).toHaveBeenCalled();
    });

    it('clears local state even when API call fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetTokens.mockReturnValue({ accessToken: null, refreshToken: 'r' });
      mockLogout.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(mockClearTokens).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('clearError', () => {
    it('clears error state', async () => {
      mockLogin.mockRejectedValue(new Error('fail'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.login({ email: 'a@b.com', password: 'password123' });
        } catch {
          // expected to throw
        }
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('forgotPassword', () => {
    it('calls forgotPassword API', async () => {
      mockForgotPassword.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.forgotPassword('user@test.com');
      });

      expect(mockForgotPassword).toHaveBeenCalledWith({ email: 'user@test.com' });
    });

    it('throws on API failure', async () => {
      mockForgotPassword.mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.forgotPassword('user@test.com');
        })
      ).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('calls resetPassword API', async () => {
      mockResetPassword.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.resetPassword('reset-token', 'NewPassword1');
      });

      expect(mockResetPassword).toHaveBeenCalledWith({
        token: 'reset-token',
        password: 'NewPassword1',
      });
    });
  });

  describe('changePassword', () => {
    it('throws when not authenticated', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.changePassword('old', 'new');
        })
      ).rejects.toThrow('Authentication required');
    });
  });
});
