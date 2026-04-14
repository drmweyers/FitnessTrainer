// EntitlementsService — Prisma-backed, in-memory cache (5-min TTL).
// No Redis dependency. Ported from FitnessMealPlanner EntitlementsService.ts.

import { prisma } from '@/lib/db/prisma';
import {
  TierLevel,
  TIER_BY_LEVEL,
  TIER_LIMITS,
  TIER_FEATURES,
  resolveFeaturePath,
} from './tiers';

export interface TierLimits {
  clients: number;
  programs: number;
  exercisesCustom: number;
}

export interface EntitlementLimitEntry {
  max: number;
  used: number;
  percentage: number;
}

export interface EntitlementsResult {
  tier: TierLevel;
  level: number;
  features: typeof TIER_FEATURES[TierLevel];
  limits: {
    clients: EntitlementLimitEntry;
    programs: EntitlementLimitEntry;
    exercisesCustom: EntitlementLimitEntry;
  };
  usage: {
    clients: number;
    programs: number;
    exercisesCustom: number;
  };
}

export interface CheckAccessResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  currentTier?: TierLevel;
  requiredTier?: TierLevel;
}

// Simple in-memory cache entry
interface CacheEntry {
  data: EntitlementsResult;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

function getCached(trainerId: string): EntitlementsResult | null {
  const entry = cache.get(trainerId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(trainerId);
    return null;
  }
  return entry.data;
}

function setCached(trainerId: string, data: EntitlementsResult): void {
  cache.set(trainerId, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateCache(trainerId: string): void {
  cache.delete(trainerId);
}

function buildLimitEntry(max: number, used: number): EntitlementLimitEntry {
  return {
    max,
    used,
    percentage: max === -1 ? 0 : Math.min(100, (used / max) * 100),
  };
}

// Fetch live usage counts from the DB for a trainer.
async function fetchUsageCounts(trainerId: string): Promise<{ clients: number; programs: number; exercisesCustom: number }> {
  const [clientCount, programCount] = await Promise.all([
    prisma.trainerClient.count({ where: { trainerId, archivedAt: null } }),
    prisma.program.count({ where: { trainerId } }),
  ]);
  // exercisesCustom not yet tracked — returning 0 until custom exercise model is added
  return { clients: clientCount, programs: programCount, exercisesCustom: 0 };
}

// Returns entitlements for a trainer. Defaults to starter when no active subscription.
export async function getEntitlements(trainerId: string): Promise<EntitlementsResult> {
  const cached = getCached(trainerId);
  if (cached) return cached;

  const subscription = await prisma.trainerSubscription.findFirst({
    where: { trainerId, status: 'active' },
    orderBy: { purchaseDate: 'desc' },
  });

  const tier: TierLevel = subscription
    ? (TIER_BY_LEVEL[subscription.tierLevel as 1 | 2 | 3] ?? 'starter')
    : 'starter';

  const usage = await fetchUsageCounts(trainerId);
  const limits = TIER_LIMITS[tier];

  const result: EntitlementsResult = {
    tier,
    level: subscription?.tierLevel ?? 1,
    features: TIER_FEATURES[tier],
    limits: {
      clients:        buildLimitEntry(limits.clients,        usage.clients),
      programs:       buildLimitEntry(limits.programs,       usage.programs),
      exercisesCustom: buildLimitEntry(limits.exercisesCustom, usage.exercisesCustom),
    },
    usage,
  };

  setCached(trainerId, result);
  return result;
}

// Check whether a trainer can access a dot-path feature key.
// Example: checkFeatureAccess(id, 'programBuilder.aiSuggest')
export async function checkFeatureAccess(
  trainerId: string,
  featurePath: string,
): Promise<CheckAccessResult> {
  const entitlements = await getEntitlements(trainerId);
  const value = resolveFeaturePath(entitlements.tier, featurePath);

  const allowed = value === true;
  return {
    allowed,
    reason: allowed ? undefined : `Feature '${featurePath}' is not available on ${entitlements.tier} tier`,
    upgradeRequired: !allowed,
    currentTier: entitlements.tier,
  };
}

// Check whether a trainer is within a usage limit.
// resourceType must match a key of EntitlementsResult.limits.
export async function checkUsageLimit(
  trainerId: string,
  resourceType: keyof EntitlementsResult['limits'],
): Promise<CheckAccessResult> {
  const entitlements = await getEntitlements(trainerId);
  const entry = entitlements.limits[resourceType];

  if (entry.max === -1) {
    return { allowed: true, currentTier: entitlements.tier };
  }

  const allowed = entry.used < entry.max;
  return {
    allowed,
    reason: allowed ? undefined : `${resourceType} limit reached (${entry.used}/${entry.max}) on ${entitlements.tier} tier`,
    upgradeRequired: !allowed,
    currentTier: entitlements.tier,
  };
}

// Convenience wrappers matching FMP shape
export function getTierLimits(tier: TierLevel): TierLimits {
  return { ...TIER_LIMITS[tier] };
}

export function getTierFeatures(tier: TierLevel): typeof TIER_FEATURES[TierLevel] {
  return TIER_FEATURES[tier];
}
