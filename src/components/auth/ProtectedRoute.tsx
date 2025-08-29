'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireVerified?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Unauthorized access component
const UnauthorizedAccess = ({ message }: { message: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md mx-auto">
      <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="mb-4">{message}</p>
        <button
          onClick={() => window.history.back()}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
);

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireVerified = false,
  fallback,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if still loading
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      // Store the current path to redirect back after login
      sessionStorage.setItem('redirectAfterLogin', pathname);
      router.push(redirectTo);
      return;
    }

    // Clear any stored redirect path if user is authenticated
    sessionStorage.removeItem('redirectAfterLogin');
  }, [isAuthenticated, isLoading, pathname, router, redirectTo]);

  // Show loading state
  if (isLoading) {
    return fallback || <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return null; // The useEffect will handle the redirect
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return (
        <UnauthorizedAccess 
          message={`This page is restricted to ${allowedRoles.join(', ')} users only.`}
        />
      );
    }
  }

  // Check email verification requirement
  if (requireVerified && !user.isVerified) {
    return (
      <UnauthorizedAccess 
        message="Email verification is required to access this page. Please check your email and verify your account."
      />
    );
  }

  // All checks passed, render the protected content
  return <>{children}</>;
}

// Convenience components for specific role-based protection
export const AdminRoute = ({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoles'>) => (
  <ProtectedRoute allowedRoles={['admin']} {...props}>
    {children}
  </ProtectedRoute>
);

export const TrainerRoute = ({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoles'>) => (
  <ProtectedRoute allowedRoles={['trainer']} {...props}>
    {children}
  </ProtectedRoute>
);

export const ClientRoute = ({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoles'>) => (
  <ProtectedRoute allowedRoles={['client']} {...props}>
    {children}
  </ProtectedRoute>
);

export const TrainerOrAdminRoute = ({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoles'>) => (
  <ProtectedRoute allowedRoles={['trainer', 'admin']} {...props}>
    {children}
  </ProtectedRoute>
);

export const VerifiedRoute = ({ children, ...props }: ProtectedRouteProps) => (
  <ProtectedRoute requireVerified={true} {...props}>
    {children}
  </ProtectedRoute>
);