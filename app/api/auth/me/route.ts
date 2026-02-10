/**
 * Current User API Route
 *
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/middleware/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const req = authResult as AuthenticatedRequest;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: req.user!.id,
          email: req.user!.email,
          role: req.user!.role,
          isActive: req.user!.isActive,
          isVerified: req.user!.isVerified,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
