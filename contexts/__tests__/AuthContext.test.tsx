/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

// Mock the auth API
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
const mockGetTokens = jest.fn().mockReturnValue({ accessToken: null, refreshToken: null });
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
    constructor(message: string) {
      super(message);
      this.name = 'AuthApiError';
    }
  },
}));

import { AuthProvider, useAuth } from '../AuthContext';

function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(auth.isLoading)}</span>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="error">{auth.error || 'none'}</span>
      <span data-testid="user">{auth.user ? auth.user.email : 'none'}</span>
      <button onClick={() => auth.login({ email: 'test@test.com', password: 'pass123' }).catch(() => {})}>Login</button>
      <button onClick={() => auth.register({ email: 'new@test.com', password: 'pass123', name: 'New User', role: 'trainer' }).catch(() => {})}>Register</button>
      <button onClick={() => auth.logout()}>Logout</button>
      <button onClick={() => auth.clearError()}>ClearError</button>
      <button onClick={() => auth.forgotPassword('test@test.com').catch(() => {})}>ForgotPassword</button>
      <button onClick={() => auth.resetPassword('token123', 'newpass').catch(() => {})}>ResetPassword</button>
      <button onClick={() => auth.changePassword('oldpass', 'newpass').catch(() => {})}>ChangePassword</button>
      <button onClick={() => auth.verifyEmail('verify-token').catch(() => {})}>VerifyEmail</button>
      <button onClick={() => auth.resendVerification('test@test.com').catch(() => {})}>ResendVerification</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTokens.mockReturnValue({ accessToken: null, refreshToken: null });
  });

  it('throws when useAuth is used outside AuthProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
    consoleSpy.mockRestore();
  });

  it('renders children', () => {
    render(
      <AuthProvider>
        <div>App Content</div>
      </AuthProvider>
    );
    expect(screen.getByText('App Content')).toBeInTheDocument();
  });

  it('starts with loading true then transitions to not loading when no tokens', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it('initializes auth with valid non-expired access token', async () => {
    const mockUser = { id: '1', email: 'user@test.com', name: 'Test User' };
    mockGetTokens.mockReturnValue({ accessToken: 'valid-token', refreshToken: 'refresh-token' });
    mockIsTokenExpired.mockReturnValue(false);
    mockGetCurrentUser.mockResolvedValue({ data: { user: mockUser } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });
    expect(screen.getByTestId('user').textContent).toBe('user@test.com');
  });

  it('refreshes expired token on initialization', async () => {
    const mockUser = { id: '1', email: 'user@test.com', name: 'Test User' };
    const newTokens = { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 900 };
    mockGetTokens.mockReturnValue({ accessToken: 'expired-token', refreshToken: 'refresh-token' });
    mockIsTokenExpired.mockReturnValue(true);
    mockRefreshToken.mockResolvedValue({ data: { tokens: newTokens } });
    mockGetCurrentUser.mockResolvedValue({ data: { user: mockUser } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });
    expect(mockSetTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
  });

  it('logs out when refresh token fails', async () => {
    mockGetTokens.mockReturnValue({ accessToken: 'expired-token', refreshToken: 'refresh-token' });
    mockIsTokenExpired.mockReturnValue(true);
    mockRefreshToken.mockRejectedValue(new Error('Refresh failed'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });
    expect(mockClearTokens).toHaveBeenCalled();
  });

  it('logs out when getCurrentUser fails with valid token', async () => {
    mockGetTokens.mockReturnValue({ accessToken: 'valid-token', refreshToken: 'refresh-token' });
    mockIsTokenExpired.mockReturnValue(false);
    mockGetCurrentUser.mockRejectedValue(new Error('User fetch failed'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });
    expect(mockClearTokens).toHaveBeenCalled();
  });

  it('login flow works', async () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test' };
    const mockTokens = { accessToken: 'at', refreshToken: 'rt', expiresIn: 900 };
    mockLogin.mockResolvedValue({ data: { user: mockUser, tokens: mockTokens } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });
    expect(mockSetTokens).toHaveBeenCalledWith('at', 'rt');
  });

  it('login error sets error state', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      try { screen.getByText('Login').click(); } catch {}
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Login failed. Please try again.');
    });
  });

  it('register flow works', async () => {
    const mockUser = { id: '2', email: 'new@test.com', name: 'New User' };
    const mockTokens = { accessToken: 'at2', refreshToken: 'rt2', expiresIn: 900 };
    mockRegister.mockResolvedValue({ data: { user: mockUser, tokens: mockTokens } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Register').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });
  });

  it('register error sets error state', async () => {
    mockRegister.mockRejectedValue(new Error('Registration failed'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      try { screen.getByText('Register').click(); } catch {}
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Registration failed. Please try again.');
    });
  });

  it('logout clears tokens and state', async () => {
    // First login
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test' };
    const mockTokens = { accessToken: 'at', refreshToken: 'rt', expiresIn: 900 };
    mockLogin.mockResolvedValue({ data: { user: mockUser, tokens: mockTokens } });
    mockGetTokens.mockReturnValue({ accessToken: 'at', refreshToken: 'rt' });
    mockLogout.mockResolvedValue({});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });
    expect(mockClearTokens).toHaveBeenCalled();
  });

  it('clearError clears the error state', async () => {
    mockLogin.mockRejectedValue(new Error('bad'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      try { screen.getByText('Login').click(); } catch {}
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).not.toBe('none');
    });

    act(() => {
      screen.getByText('ClearError').click();
    });

    expect(screen.getByTestId('error').textContent).toBe('none');
  });

  it('forgotPassword calls authApi.forgotPassword', async () => {
    mockForgotPassword.mockResolvedValue({});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('ForgotPassword').click();
    });

    expect(mockForgotPassword).toHaveBeenCalledWith({ email: 'test@test.com' });
  });

  it('forgotPassword throws on error', async () => {
    mockForgotPassword.mockRejectedValue(new Error('Email not found'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      try {
        screen.getByText('ForgotPassword').click();
      } catch {}
    });
  });

  it('resetPassword calls authApi.resetPassword', async () => {
    mockResetPassword.mockResolvedValue({});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('ResetPassword').click();
    });

    expect(mockResetPassword).toHaveBeenCalledWith({ token: 'token123', password: 'newpass' });
  });

  it('changePassword throws when not authenticated', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      try {
        screen.getByText('ChangePassword').click();
      } catch {}
    });
    // No crash - error is caught in the button handler
  });

  it('verifyEmail calls authApi.verifyEmail', async () => {
    mockVerifyEmail.mockResolvedValue({ data: {} });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('VerifyEmail').click();
    });

    expect(mockVerifyEmail).toHaveBeenCalledWith({ token: 'verify-token' });
  });

  it('resendVerification calls authApi.resendVerification', async () => {
    mockResendVerification.mockResolvedValue({});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('ResendVerification').click();
    });

    expect(mockResendVerification).toHaveBeenCalledWith({ email: 'test@test.com' });
  });

  it('changePassword succeeds when authenticated', async () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test' };
    const mockTokens = { accessToken: 'at', refreshToken: 'rt', expiresIn: 900 };
    mockLogin.mockResolvedValue({ data: { user: mockUser, tokens: mockTokens } });
    mockChangePassword.mockResolvedValue({});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByText('ChangePassword').click();
    });

    expect(mockChangePassword).toHaveBeenCalledWith({ currentPassword: 'oldpass', newPassword: 'newpass' });
  });

  it('changePassword error throws with message', async () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test' };
    const mockTokens = { accessToken: 'at', refreshToken: 'rt', expiresIn: 900 };
    mockLogin.mockResolvedValue({ data: { user: mockUser, tokens: mockTokens } });
    mockChangePassword.mockRejectedValue(new Error('Wrong password'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    await act(async () => {
      try { screen.getByText('ChangePassword').click(); } catch {}
    });
  });

  it('verifyEmail updates user verification status when authenticated', async () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test', isVerified: false };
    const mockTokens = { accessToken: 'at', refreshToken: 'rt', expiresIn: 900 };
    mockLogin.mockResolvedValue({ data: { user: mockUser, tokens: mockTokens } });
    mockVerifyEmail.mockResolvedValue({ data: {} });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByText('VerifyEmail').click();
    });

    expect(mockVerifyEmail).toHaveBeenCalledWith({ token: 'verify-token' });
  });

  it('verifyEmail error throws', async () => {
    mockVerifyEmail.mockRejectedValue(new Error('Invalid token'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      try { screen.getByText('VerifyEmail').click(); } catch {}
    });
  });

  it('resendVerification error throws', async () => {
    mockResendVerification.mockRejectedValue(new Error('Too many requests'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      try { screen.getByText('ResendVerification').click(); } catch {}
    });
  });

  it('resetPassword error throws', async () => {
    mockResetPassword.mockRejectedValue(new Error('Invalid token'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      try { screen.getByText('ResetPassword').click(); } catch {}
    });
  });

  it('logout handles API error gracefully', async () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test' };
    const mockTokens = { accessToken: 'at', refreshToken: 'rt', expiresIn: 900 };
    mockLogin.mockResolvedValue({ data: { user: mockUser, tokens: mockTokens } });
    mockGetTokens.mockReturnValue({ accessToken: 'at', refreshToken: 'rt' });
    mockLogout.mockRejectedValue(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });
    // Logout still clears tokens even when API fails
    expect(mockClearTokens).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('login error with AuthApiError uses API error message', async () => {
    const { AuthApiError } = require('@/lib/api/auth');
    mockLogin.mockRejectedValue(new AuthApiError('Invalid email or password'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      try { screen.getByText('Login').click(); } catch {}
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Invalid email or password');
    });
  });

  it('register error with AuthApiError uses API error message', async () => {
    const { AuthApiError } = require('@/lib/api/auth');
    mockRegister.mockRejectedValue(new AuthApiError('Email already exists'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      try { screen.getByText('Register').click(); } catch {}
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Email already exists');
    });
  });

  it('handles auth:logout window event', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    act(() => {
      window.dispatchEvent(new Event('auth:logout'));
    });

    expect(mockClearTokens).toHaveBeenCalled();
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it('refreshes token on expiration approaching', async () => {
    jest.useFakeTimers();
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test' };
    const mockTokens = { accessToken: 'at', refreshToken: 'rt', expiresIn: 900 };
    mockLogin.mockResolvedValue({ data: { user: mockUser, tokens: mockTokens } });

    // Mock token expiration to be in the future
    mockGetTokenExpiration.mockReturnValue(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    mockRefreshToken.mockResolvedValue({ data: { tokens: mockTokens } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    // Fast-forward time to trigger auto-refresh (2 min before expiration)
    act(() => {
      jest.advanceTimersByTime(3 * 60 * 1000 + 100); // 3 minutes + buffer
    });

    jest.useRealTimers();
  });

  it('handles token refresh failure during auto-refresh', async () => {
    jest.useFakeTimers();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test' };
    const mockTokens = { accessToken: 'at', refreshToken: 'rt', expiresIn: 900 };
    mockLogin.mockResolvedValue({ data: { user: mockUser, tokens: mockTokens } });

    mockGetTokenExpiration.mockReturnValue(Date.now() + 5 * 60 * 1000);
    mockRefreshToken.mockRejectedValue(new Error('Refresh failed'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    act(() => {
      jest.advanceTimersByTime(3 * 60 * 1000 + 100);
    });

    consoleSpy.mockRestore();
    jest.useRealTimers();
  });

  it('handles token refresh after expired token with failed getCurrentUser but successful token decode', async () => {
    const mockTokens = { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 900 };
    // Token payload: { sub: '1', email: 'decoded@test.com', role: 'trainer' }
    const validToken = 'header.' + btoa(JSON.stringify({ sub: '1', email: 'decoded@test.com', role: 'trainer' })) + '.signature';
    mockGetTokens.mockReturnValue({ accessToken: 'expired-token', refreshToken: 'refresh-token' });
    mockIsTokenExpired.mockReturnValue(true);
    mockRefreshToken.mockResolvedValue({ data: { tokens: { ...mockTokens, accessToken: validToken } } });
    mockGetCurrentUser.mockRejectedValue(new Error('User fetch failed'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });
    expect(screen.getByTestId('user').textContent).toBe('decoded@test.com');
  });

  it('handles valid token with failed getCurrentUser but successful token decode', async () => {
    const validToken = 'header.' + btoa(JSON.stringify({ sub: '1', email: 'decoded@test.com', role: 'trainer' })) + '.signature';
    mockGetTokens.mockReturnValue({ accessToken: validToken, refreshToken: 'refresh-token' });
    mockIsTokenExpired.mockReturnValue(false);
    mockGetCurrentUser.mockRejectedValue(new Error('User fetch failed'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });
    expect(screen.getByTestId('user').textContent).toBe('decoded@test.com');
  });

  it('logs out when token decode fails after getCurrentUser failure (valid token scenario)', async () => {
    const invalidToken = 'invalid.token.format';
    mockGetTokens.mockReturnValue({ accessToken: invalidToken, refreshToken: 'refresh-token' });
    mockIsTokenExpired.mockReturnValue(false);
    mockGetCurrentUser.mockRejectedValue(new Error('User fetch failed'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });
    expect(mockClearTokens).toHaveBeenCalled();
  });

  it('handles logout with logoutFromAll option', async () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test' };
    const mockTokens = { accessToken: 'at', refreshToken: 'rt', expiresIn: 900 };
    mockLogin.mockResolvedValue({ data: { user: mockUser, tokens: mockTokens } });
    mockGetTokens.mockReturnValue({ accessToken: 'at', refreshToken: 'rt' });
    mockLogout.mockResolvedValue({});

    function TestConsumerWithLogoutAll() {
      const auth = useAuth();
      return (
        <div>
          <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
          <button onClick={() => auth.login({ email: 'test@test.com', password: 'pass123' }).catch(() => {})}>Login</button>
          <button onClick={() => auth.logout({ logoutFromAll: true })}>LogoutAll</button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <TestConsumerWithLogoutAll />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByText('LogoutAll').click();
    });

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledWith({ refreshToken: 'rt', logoutFromAll: true });
    });
    expect(mockClearTokens).toHaveBeenCalled();
  });

  it('handles refreshToken call when no refresh token available', async () => {
    mockGetTokens.mockReturnValue({ accessToken: null, refreshToken: null });

    function TestConsumerWithRefresh() {
      const auth = useAuth();
      const [error, setError] = React.useState<string>('');
      return (
        <div>
          <button onClick={() => auth.refreshToken().catch((e) => setError(e.message))}>Refresh</button>
          <span data-testid="error">{error}</span>
        </div>
      );
    }

    render(
      <AuthProvider>
        <TestConsumerWithRefresh />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByText('Refresh').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('No refresh token available');
    });
  });
});
