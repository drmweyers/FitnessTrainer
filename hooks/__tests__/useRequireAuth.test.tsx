/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRequireAuth } from '../useRequireAuth';

// Mock next/navigation
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Mock AuthContext
const mockAuthState = {
  user: null as any,
  isAuthenticated: false,
  isLoading: true,
  tokens: null,
  error: null,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  changePassword: jest.fn(),
  verifyEmail: jest.fn(),
  resendVerification: jest.fn(),
  clearError: jest.fn(),
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

// Test component that uses the hook
function TestComponent() {
  const { user, isLoading, isAuthenticated } = useRequireAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
    </div>
  );
}

describe('useRequireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.user = null;
    mockAuthState.isAuthenticated = false;
    mockAuthState.isLoading = true;
  });

  it('returns loading state while auth is initializing', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects to /login when not authenticated and loading completes', () => {
    mockAuthState.isLoading = false;
    mockAuthState.isAuthenticated = false;
    
    render(<TestComponent />);
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('does not redirect when authenticated', () => {
    mockAuthState.isLoading = false;
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: '1', email: 'test@test.com', role: 'client', isActive: true, isVerified: true, createdAt: '2024-01-01' };
    
    render(<TestComponent />);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByTestId('user').textContent).toBe('test@test.com');
  });

  it('stores redirect path in sessionStorage before redirecting', () => {
    mockAuthState.isLoading = false;
    mockAuthState.isAuthenticated = false;
    
    const setItemSpy = jest.spyOn(window.sessionStorage.__proto__, 'setItem');
    render(<TestComponent />);
    expect(setItemSpy).toHaveBeenCalledWith('redirectAfterLogin', expect.any(String));
    setItemSpy.mockRestore();
  });
});
