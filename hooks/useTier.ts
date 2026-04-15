'use client';

// useTier — TanStack Query hook returning the trainer's subscription entitlements.
// Ported from FitnessMealPlanner client/src/hooks/useTier.tsx.

import { useQuery } from '@tanstack/react-query';
import type { TierLevel } from '@/lib/subscription/tiers';
import { resolveFeaturePath } from '@/lib/subscription/tiers';

interface EntitlementsData {
  tier: TierLevel;
  level: number;
  features: Record<string, unknown>;
  limits: Record<string, { max: number; used: number; percentage: number }>;
  usage: Record<string, number>;
}

async function fetchEntitlements(): Promise<EntitlementsData> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const res = await fetch('/api/entitlements', {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) {
    // Silently default to starter so the UI never hard-crashes on auth errors
    return { tier: 'starter', level: 1, features: {}, limits: {}, usage: {} };
  }
  const json = await res.json();
  return json.data as EntitlementsData;
}

export function useTier() {
  const { data, isLoading } = useQuery({
    queryKey: ['entitlements'],
    queryFn: fetchEntitlements,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const tier: TierLevel = data?.tier ?? 'starter';
  const level: number = data?.level ?? 1;

  return {
    tier,
    level,
    features: data?.features ?? {},
    limits: data?.limits ?? {},
    isLoading,
    isStarter: tier === 'starter',
    isProfessional: tier === 'professional',
    isEnterprise: tier === 'enterprise',
    // Returns true when the current tier is >= the required tier
    canAccess: (required: TierLevel): boolean => {
      const order: Record<TierLevel, number> = { starter: 1, professional: 2, enterprise: 3 };
      return order[tier] >= order[required];
    },
    // Supports dot-path keys like 'programBuilder.aiSuggest'
    hasFeature: (featurePath: string): boolean => {
      return resolveFeaturePath(tier, featurePath) === true;
    },
  };
}
