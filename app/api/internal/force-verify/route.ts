/**
 * Internal Force-Verify Endpoint
 *
 * POST /api/internal/force-verify
 *
 * Immediately marks a user account as verified without going through the
 * email link flow. Used exclusively by the E2E global-setup to ensure QA
 * test accounts are usable without Mailgun being configured in CI/test envs.
 *
 * Protected by INTERNAL_API_SECRET environment variable.
 * Returns 404 when the secret is not set (disabled in production builds).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Disabled unless an internal secret is explicitly configured
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  const authHeader = request.headers.get('x-internal-secret');
  if (authHeader !== secret) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'email is required' },
        { status: 400 }
      );
    }

    await prisma.user.updateMany({
      where: { email: email.toLowerCase() },
      data: { isVerified: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}
