// Next.js App Router route wrapper for tier-based feature gating.
// Ported from FitnessMealPlanner server/middleware/tierEnforcement.ts.
//
// Usage:
//   export const GET = withTier({ feature: 'programBuilder.aiSuggest' })(handler);
//   export const POST = withTier({ minTier: 'professional' })(handler);

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import {
  getEntitlements,
  checkFeatureAccess,
  checkUsageLimit,
  EntitlementsResult,
} from './EntitlementsService';
import { TierLevel, LEVEL_BY_TIER } from './tiers';

type ResourceLimit = 'clients' | 'programs' | 'exercisesCustom';

export interface WithTierOptions {
  feature?: string;
  minTier?: TierLevel;
  usageLimit?: ResourceLimit;
}

type RouteHandler = (_req: NextRequest, _ctx?: unknown) => Promise<NextResponse> | NextResponse;

function denyResponse(
  code: 'FEATURE_LOCKED' | 'TIER_LIMIT_REACHED' | 'SUBSCRIPTION_REQUIRED',
  message: string,
  currentTier?: TierLevel,
  requiredTier?: TierLevel,
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        currentTier,
        requiredTier,
        upgradeRequired: true,
      },
    },
    { status: 403 },
  );
}

// Higher-order wrapper. Returns a function that accepts a route handler.
export function withTier(opts: WithTierOptions) {
  return function wrap(handler: RouteHandler): RouteHandler {
    return async function (req: NextRequest, _ctx?: unknown): Promise<NextResponse> {
      // Authenticate
      const authResult = await authenticate(req);
      if (authResult instanceof NextResponse) return authResult;

      const authedReq = authResult as AuthenticatedRequest;
      const user = authedReq.user;

      if (!user || user.role !== 'trainer') {
        return NextResponse.json(
          { success: false, error: 'Trainer role required' },
          { status: 403 },
        );
      }

      // Feature check
      if (opts.feature) {
        const result = await checkFeatureAccess(user.id, opts.feature);
        if (!result.allowed) {
          return denyResponse('FEATURE_LOCKED', result.reason!, result.currentTier);
        }
      }

      // Minimum tier check
      if (opts.minTier) {
        const entitlements = await getEntitlements(user.id);
        const currentLevel = LEVEL_BY_TIER[entitlements.tier];
        const requiredLevel = LEVEL_BY_TIER[opts.minTier];
        if (currentLevel < requiredLevel) {
          return denyResponse(
            'FEATURE_LOCKED',
            `This feature requires ${opts.minTier} tier or higher`,
            entitlements.tier,
            opts.minTier,
          );
        }
      }

      // Usage limit check
      if (opts.usageLimit) {
        const result = await checkUsageLimit(user.id, opts.usageLimit);
        if (!result.allowed) {
          return denyResponse('TIER_LIMIT_REACHED', result.reason!, result.currentTier);
        }
      }

      // All checks passed — forward to handler
      return handler(authedReq, _ctx);
    };
  };
}

// Helper to attach entitlements without short-circuiting.
// Returns null if the user is not a trainer or auth fails.
export async function attachEntitlements(
  req: NextRequest,
): Promise<EntitlementsResult | null> {
  const authResult = await authenticate(req);
  if (authResult instanceof NextResponse) return null;

  const authedReq = authResult as AuthenticatedRequest;
  if (!authedReq.user || authedReq.user.role !== 'trainer') return null;

  return getEntitlements(authedReq.user.id);
}
