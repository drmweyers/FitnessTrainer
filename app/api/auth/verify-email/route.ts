/**
 * Email Verification Route
 *
 * GET /api/auth/verify-email?token=<token>
 *
 * Validates the one-time token stored in Redis, marks the user as verified,
 * then redirects to /auth/login?verified=true.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { consumeVerificationToken } from '@/lib/auth/email-verification';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/verify-email
 *
 * Query params:
 *   token  - The 64-character hex verification token from the email link.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/auth/login?error=missing-token', request.url)
      );
    }

    // Exchange the token for the associated userId (deletes it from Redis)
    const userId = await consumeVerificationToken(token);

    if (!userId) {
      return NextResponse.redirect(
        new URL('/auth/login?error=invalid-token', request.url)
      );
    }

    // Mark the user as verified
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    return NextResponse.redirect(
      new URL('/auth/login?verified=true', request.url)
    );
  } catch (error: any) {
    console.error('[verify-email] Unexpected error:', error?.message);
    return NextResponse.redirect(
      new URL('/auth/login?error=server-error', request.url)
    );
  }
}
