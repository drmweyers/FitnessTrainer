/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard',
}));

let mockAuthState: any = {
  user: { id: '1', email: 'test@example.com', role: 'trainer', isVerified: true },
  isAuthenticated: true,
  isLoading: false,
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

import ProtectedRoute, { AdminRoute, TrainerRoute, ClientRoute } from '../ProtectedRoute';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = {
      user: { id: '1', email: 'test@example.com', role: 'trainer', isVerified: true },
      isAuthenticated: true,
      isLoading: false,
    };
  });

  it('should render children when authenticated', () => {
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should show loading spinner when auth is loading', () => {
    mockAuthState = { ...mockAuthState, isLoading: true };
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render custom fallback when loading', () => {
    mockAuthState = { ...mockAuthState, isLoading: true };
    render(
      <ProtectedRoute fallback={<div>Custom Loading...</div>}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
  });

  it('should return null when not authenticated (redirect via useEffect)', () => {
    mockAuthState = { ...mockAuthState, isAuthenticated: false, user: null };
    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show Access Denied for wrong role', () => {
    mockAuthState = {
      ...mockAuthState,
      user: { id: '1', email: 'test@example.com', role: 'client', isVerified: true },
    };
    render(
      <ProtectedRoute allowedRoles={['admin']}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('should render content for allowed role', () => {
    render(
      <ProtectedRoute allowedRoles={['trainer']}>
        <div>Trainer Content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Trainer Content')).toBeInTheDocument();
  });

  it('should show Access Denied when email verification required but not verified', () => {
    mockAuthState = {
      ...mockAuthState,
      user: { id: '1', email: 'test@example.com', role: 'trainer', isVerified: false },
    };
    render(
      <ProtectedRoute requireVerified={true}>
        <div>Verified Content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/Email verification is required/)).toBeInTheDocument();
  });

  it('should render content when verified and verification is required', () => {
    render(
      <ProtectedRoute requireVerified={true}>
        <div>Verified Content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Verified Content')).toBeInTheDocument();
  });

  it('should show Go Back button in Access Denied view', () => {
    mockAuthState = {
      ...mockAuthState,
      user: { id: '1', email: 'test@example.com', role: 'client', isVerified: true },
    };
    render(
      <ProtectedRoute allowedRoles={['admin']}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  beforeEach(() => {
    mockAuthState = {
      user: { id: '1', email: 'admin@example.com', role: 'admin', isVerified: true },
      isAuthenticated: true,
      isLoading: false,
    };
  });

  it('should render children for admin users', () => {
    render(
      <AdminRoute>
        <div>Admin Panel</div>
      </AdminRoute>
    );
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('should deny access for non-admin users', () => {
    mockAuthState = {
      ...mockAuthState,
      user: { id: '1', email: 'test@example.com', role: 'client', isVerified: true },
    };
    render(
      <AdminRoute>
        <div>Admin Panel</div>
      </AdminRoute>
    );
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });
});

describe('TrainerRoute', () => {
  it('should render children for trainer users', () => {
    mockAuthState = {
      user: { id: '1', email: 'trainer@example.com', role: 'trainer', isVerified: true },
      isAuthenticated: true,
      isLoading: false,
    };
    render(
      <TrainerRoute>
        <div>Trainer Dashboard</div>
      </TrainerRoute>
    );
    expect(screen.getByText('Trainer Dashboard')).toBeInTheDocument();
  });
});

describe('ClientRoute', () => {
  it('should render children for client users', () => {
    mockAuthState = {
      user: { id: '1', email: 'client@example.com', role: 'client', isVerified: true },
      isAuthenticated: true,
      isLoading: false,
    };
    render(
      <ClientRoute>
        <div>Client Area</div>
      </ClientRoute>
    );
    expect(screen.getByText('Client Area')).toBeInTheDocument();
  });
});
