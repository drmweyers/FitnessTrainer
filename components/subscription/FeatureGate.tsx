'use client';

// FeatureGate — renders children when the tier check passes; otherwise shows a
// locked upgrade CTA. Ported from FitnessMealPlanner FeatureGate.tsx.

import React from 'react';
import { Lock, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTier } from '@/hooks/useTier';
import type { TierLevel } from '@/lib/subscription/tiers';
import { resolveFeaturePath } from '@/lib/subscription/tiers';

interface FeatureGateProps {
  feature?: string;
  minTier?: TierLevel;
  fallback?: React.ReactNode;
  minimal?: boolean;
  onUpgradeClick?: () => void;
  children: React.ReactNode;
}

// Default locked UI shown when no fallback is provided and minimal is false
function LockedUpgradeCta({
  currentTier,
  requiredTier,
  onUpgradeClick,
}: {
  currentTier: TierLevel;
  requiredTier: TierLevel;
  onUpgradeClick?: () => void;
}) {
  const href = '/pricing';

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Feature Locked</CardTitle>
        </div>
        <CardDescription>
          Upgrade to{' '}
          <span className="font-semibold capitalize">{requiredTier}</span> tier
          to unlock this feature
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            Current plan:{' '}
            <span className="font-semibold text-foreground capitalize">{currentTier}</span>
          </p>
          <p>
            Required plan:{' '}
            <span className="font-semibold text-foreground capitalize">{requiredTier}</span>
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={onUpgradeClick ?? (() => { window.location.href = href; })}
        >
          Upgrade Plan
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// Determine the minimum tier that has a feature enabled by walking the hierarchy.
function inferRequiredTier(featurePath: string): TierLevel {
  const tiers: TierLevel[] = ['starter', 'professional', 'enterprise'];
  for (const t of tiers) {
    if (resolveFeaturePath(t, featurePath) === true) return t;
  }
  return 'enterprise';
}

export function FeatureGate({
  feature,
  minTier,
  fallback,
  minimal = false,
  onUpgradeClick,
  children,
}: FeatureGateProps) {
  const { tier, isLoading, canAccess, hasFeature } = useTier();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  let allowed = true;
  let requiredTier: TierLevel = 'professional';

  if (feature) {
    allowed = hasFeature(feature);
    requiredTier = inferRequiredTier(feature);
  }

  if (minTier) {
    const tierAllowed = canAccess(minTier);
    if (!tierAllowed) {
      allowed = false;
      requiredTier = minTier;
    }
  }

  if (allowed) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  if (minimal) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span className="text-sm">Locked</span>
      </div>
    );
  }

  return (
    <LockedUpgradeCta
      currentTier={tier}
      requiredTier={requiredTier}
      onUpgradeClick={onUpgradeClick}
    />
  );
}
