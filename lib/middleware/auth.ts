/**
 * Authentication Middleware (Platform-Agnostic)
 *
 * Works with:
 * - Vercel API Routes (Next.js)
 * - Digital Ocean Express.js
 * - Any Node.js HTTP framework
 *
 * Verifies JWT tokens and attaches user to request
 */

import { NextRequest, NextResponse } from 'next/server';
import { tokenService } from '@/lib/services/tokenService';
import { prisma } from '@/lib/db/prisma';

/**
 * Extended request interface with authenticated user
 */
export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: 'trainer' | 'client' | 'admin';
    isActive: boolean;
    isVerified: boolean;
  };
  tokenId?: string;
}

/**
 * Authentication error response
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
 * Authenticate request using JWT access token
 *
 * Extracts Bearer token from Authorization header
 * Verifies token signature and expiration
 * Checks if token is blacklisted
 * Fetches user from database
 *
 * @param request - Next.js request object
 * @returns Authenticated request or error response
 */
export async function authenticate(
  request: NextRequest
): Promise<AuthenticatedRequest | NextResponse> {
  try {
    // Extract Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        createError(401, 'Access token required', 'MISSING_TOKEN'),
        { status: 401 }
      );
    }

    // Extract token
    const token = authHeader.substring(7);

    // Verify token signature and expiration
    const payload = tokenService.verifyAccessToken(token);

    // Check if token is blacklisted (for logout)
    const isBlacklisted = await tokenService.isTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      return NextResponse.json(
        createError(401, 'Token has been revoked', 'TOKEN_REVOKED'),
        { status: 401 }
      );
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        deletedAt: true,
      },
    });

    // Check if user exists and is active
    if (!user || user.deletedAt || !user.isActive) {
      return NextResponse.json(
        createError(401, 'User not found or inactive', 'USER_NOT_FOUND'),
        { status: 401 }
      );
    }

    // Attach user to request
    const authenticatedReq = request as AuthenticatedRequest;
    authenticatedReq.user = {
      id: user.id,
      email: user.email,
      role: user.role as 'trainer' | 'client' | 'admin',
      isActive: user.isActive,
      isVerified: user.isVerified,
    };
    authenticatedReq.tokenId = payload.jti;

    return authenticatedReq;
  } catch (error: any) {
    // Token verification failed
    if (error.message === 'Access token expired') {
      return NextResponse.json(
        createError(401, 'Access token expired', 'TOKEN_EXPIRED'),
        { status: 401 }
      );
    }

    if (error.message === 'Invalid access token') {
      return NextResponse.json(
        createError(401, 'Invalid access token', 'INVALID_TOKEN'),
        { status: 401 }
      );
    }

    // Unexpected error
    console.error('Authentication error:', error);
    return NextResponse.json(
      createError(500, 'Authentication failed', 'AUTH_FAILED'),
      { status: 500 }
    );
  }
}

/**
 * Optional authentication (doesn't fail if no token)
 * Useful for endpoints that work with or without authentication
 */
export async function optionalAuth(
  request: NextRequest
): Promise<AuthenticatedRequest> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return request as AuthenticatedRequest;
    }

    const token = authHeader.substring(7);
    const payload = tokenService.verifyAccessToken(token);

    const isBlacklisted = await tokenService.isTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      return request as AuthenticatedRequest;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        deletedAt: true,
      },
    });

    if (user && !user.deletedAt && user.isActive) {
      const authenticatedReq = request as AuthenticatedRequest;
      authenticatedReq.user = {
        id: user.id,
        email: user.email,
        role: user.role as 'trainer' | 'client' | 'admin',
        isActive: user.isActive,
        isVerified: user.isVerified,
      };
      authenticatedReq.tokenId = payload.jti;
      return authenticatedReq;
    }

    return request as AuthenticatedRequest;
  } catch (error) {
    // Silent fail for optional auth
    return request as AuthenticatedRequest;
  }
}

/**
 * Require email verification
 * Use after authenticate() to ensure user has verified email
 */
export function requireVerified(request: AuthenticatedRequest): NextResponse | null {
  if (!request.user) {
    return NextResponse.json(
      createError(401, 'Authentication required', 'AUTH_REQUIRED'),
      { status: 401 }
    );
  }

  if (!request.user.isVerified) {
    return NextResponse.json(
      createError(403, 'Email verification required', 'EMAIL_NOT_VERIFIED'),
      { status: 403 }
    );
  }

  return null;
}

export default authenticate;
