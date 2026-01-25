/**
 * Authorization Middleware (Platform-Agnostic)
 *
 * Role-based access control (RBAC) for API routes
 * Works with Vercel API Routes and Express.js
 */

import { NextResponse } from 'next/server';
import type { AuthenticatedRequest } from './auth';

/**
 * Authorization error response
 */
function createError(status: number, message: string, code: string) {
  return {
    success: false,
    message,
    error: {
      code,
    },
  };
}

/**
 * Authorize request by user role
 *
 * Checks if authenticated user has one of the required roles
 *
 * @param request - Authenticated request object
 * @param roles - Allowed roles (e.g., 'trainer', 'admin')
 * @returns Error response if unauthorized, null if authorized
 */
export function authorize(
  request: AuthenticatedRequest,
  ...roles: Array<'trainer' | 'client' | 'admin'>
): NextResponse | null {
  // Check if user is authenticated
  if (!request.user) {
    return NextResponse.json(
      createError(401, 'Authentication required', 'AUTH_REQUIRED'),
      { status: 401 }
    );
  }

  // Check if user has required role
  if (!roles.includes(request.user.role)) {
    return NextResponse.json(
      createError(
        403,
        `Insufficient permissions. Required role: ${roles.join(' or ')}`,
        'INSUFFICIENT_PERMISSIONS'
      ),
      { status: 403 }
    );
  }

  // Authorized
  return null;
}

/**
 * Pre-built middleware chains for common use cases
 */

/**
 * Trainer-only access
 */
export function trainerOnly(request: AuthenticatedRequest): NextResponse | null {
  return authorize(request, 'trainer');
}

/**
 * Client-only access
 */
export function clientOnly(request: AuthenticatedRequest): NextResponse | null {
  return authorize(request, 'client');
}

/**
 * Admin-only access
 */
export function adminOnly(request: AuthenticatedRequest): NextResponse | null {
  return authorize(request, 'admin');
}

/**
 * Trainer or Admin access
 */
export function trainerOrAdmin(request: AuthenticatedRequest): NextResponse | null {
  return authorize(request, 'trainer', 'admin');
}

/**
 * Client or Admin access
 */
export function clientOrAdmin(request: AuthenticatedRequest): NextResponse | null {
  return authorize(request, 'client', 'admin');
}

/**
 * All authenticated users (any role)
 */
export function authenticated(request: AuthenticatedRequest): NextResponse | null {
  if (!request.user) {
    return NextResponse.json(
      createError(401, 'Authentication required', 'AUTH_REQUIRED'),
      { status: 401 }
    );
  }
  return null;
}

export default authorize;
