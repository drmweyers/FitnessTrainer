/**
 * Admin Authorization Middleware
 *
 * Wraps authenticate() and additionally checks user.role === 'admin'.
 * Returns 403 Forbidden if the authenticated user is not an admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

/**
 * Authenticate and authorize admin access
 *
 * @param request - Next.js request object
 * @returns Authenticated admin request or error response
 */
export async function authenticateAdmin(
  request: NextRequest
): Promise<AuthenticatedRequest | NextResponse> {
  const authResult = await authenticate(request);

  // If authenticate returned an error response, pass it through
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const req = authResult as AuthenticatedRequest;

  // Check admin role
  if (req.user?.role !== 'admin') {
    return NextResponse.json(
      {
        success: false,
        error: 'Admin access required',
      },
      { status: 403 }
    );
  }

  return req;
}
