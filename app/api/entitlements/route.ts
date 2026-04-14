/**
 * GET /api/entitlements
 *
 * Returns the authenticated trainer's current subscription tier,
 * feature flags, and usage limits.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { getEntitlements } from '@/lib/subscription/EntitlementsService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;

    const req = authResult as AuthenticatedRequest;

    if (!req.user || req.user.role !== 'trainer') {
      return NextResponse.json(
        { success: false, error: 'Trainer role required' },
        { status: 403 },
      );
    }

    const entitlements = await getEntitlements(req.user.id);

    return NextResponse.json({
      success: true,
      data: {
        tier: entitlements.tier,
        level: entitlements.level,
        features: entitlements.features,
        limits: entitlements.limits,
        usage: entitlements.usage,
      },
    });
  } catch (error) {
    console.error('[entitlements] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch entitlements' },
      { status: 500 },
    );
  }
}
