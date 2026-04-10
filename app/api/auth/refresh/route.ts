/**
 * Refresh Token API Route
 *
 * POST /api/auth/refresh
 *
 * Exchanges a valid refresh token for a new access token + refresh token pair.
 * The old refresh token is rotated (invalidated) as part of this flow to prevent
 * replay attacks.
 *
 * Request body: { refreshToken: string }
 * Response shape mirrors /api/auth/login so frontend can reuse the same handler.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { tokenService } from '@/lib/services/tokenService';
import { handleApiError } from '@/lib/middleware/error-handler';

export const dynamic = 'force-dynamic';

const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'refreshToken required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = refreshSchema.parse(body);

    // Verify refresh token + get linked session
    let session: { userId: string; sessionId: string };
    try {
      session = await tokenService.verifyRefreshToken(refreshToken);
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          message: err.message || 'Invalid or expired refresh token',
          error: { code: 'INVALID_REFRESH_TOKEN' },
        },
        { status: 401 }
      );
    }

    // Fetch user (need role + email + active status for new access token)
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'User account not available',
          error: { code: 'ACCOUNT_UNAVAILABLE' },
        },
        { status: 401 }
      );
    }

    // Issue new access token
    const accessToken = tokenService.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as 'trainer' | 'client' | 'admin',
    });

    // Rotate refresh token (invalidates old, issues new)
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined;

    const newRefreshToken = await tokenService.rotateRefreshToken(refreshToken, {
      userId: user.id,
      deviceInfo: {
        type: /mobile|android|iphone|ipad|phone/i.test(userAgent || '') ? 'mobile' : 'desktop',
        browser: 'unknown',
        os: 'unknown',
      },
      ipAddress,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Token refreshed',
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
          },
          tokens: {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: 900,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
