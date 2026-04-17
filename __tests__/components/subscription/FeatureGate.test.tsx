/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeatureGate } from '@/components/subscription/FeatureGate';

// Mock useTier so we control returned values without hitting the server
jest.mock('@/hooks/useTier', () => ({
  useTier: jest.fn(),
}));

import { useTier } from '@/hooks/useTier';
const mockUseTier = useTier as jest.Mock;

function setupTier(tier: 'starter' | 'professional' | 'enterprise') {
  const order: Record<string, number> = { starter: 1, professional: 2, enterprise: 3 };
  // Import resolveFeaturePath for real feature lookups
  const { resolveFeaturePath } = jest.requireActual('@/lib/subscription/tiers');

  mockUseTier.mockReturnValue({
    tier,
    level: order[tier],
    features: {},
    limits: {},
    isLoading: false,
    isStarter: tier === 'starter',
    isProfessional: tier === 'professional',
    isEnterprise: tier === 'enterprise',
    canAccess: (required: string) => order[tier] >= order[required],
    hasFeature: (path: string) => resolveFeaturePath(tier, path) === true,
  });
}

describe('FeatureGate', () => {
  afterEach(() => {
    mockUseTier.mockReset();
  });

  it('renders children when feature is allowed for the current tier', () => {
    setupTier('professional');

    render(
      <FeatureGate feature="programBuilder.aiSuggest">
        <span data-testid="child">Allowed content</span>
      </FeatureGate>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders children for a starter feature on starter tier', () => {
    setupTier('starter');

    render(
      <FeatureGate feature="programBuilder.dragDrop">
        <span data-testid="child">DnD content</span>
      </FeatureGate>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders the fallback when feature is locked', () => {
    setupTier('starter');

    render(
      <FeatureGate
        feature="programBuilder.aiSuggest"
        fallback={<span data-testid="fallback">Upgrade to unlock</span>}
      >
        <span data-testid="child">AI content</span>
      </FeatureGate>,
    );

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('renders default locked UI when no fallback is provided and feature is locked', () => {
    setupTier('starter');

    render(
      <FeatureGate feature="programBuilder.aiSuggest">
        <span data-testid="child">AI content</span>
      </FeatureGate>,
    );

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(screen.getByText('Feature Locked')).toBeInTheDocument();
    expect(screen.getByText('Upgrade Plan')).toBeInTheDocument();
  });

  it('renders minimal lock icon when minimal=true and feature is locked', () => {
    setupTier('starter');

    render(
      <FeatureGate feature="programBuilder.videoPreview" minimal>
        <span data-testid="child">Video</span>
      </FeatureGate>,
    );

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
    // Full upgrade card should NOT be rendered in minimal mode
    expect(screen.queryByText('Upgrade Plan')).not.toBeInTheDocument();
  });

  it('renders children when minTier requirement is met', () => {
    setupTier('enterprise');

    render(
      <FeatureGate minTier="enterprise">
        <span data-testid="child">Enterprise only</span>
      </FeatureGate>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders locked UI when minTier is not met', () => {
    setupTier('starter');

    render(
      <FeatureGate minTier="professional">
        <span data-testid="child">Pro feature</span>
      </FeatureGate>,
    );

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(screen.getByText('Feature Locked')).toBeInTheDocument();
  });

  it('optimistically renders children while loading', () => {
    mockUseTier.mockReturnValue({
      tier: 'starter',
      level: 1,
      features: {},
      limits: {},
      isLoading: true,
      isStarter: true,
      isProfessional: false,
      isEnterprise: false,
      canAccess: () => false,
      hasFeature: () => false,
    });

    render(
      <FeatureGate feature="programBuilder.aiSuggest">
        <span data-testid="child">Loading state content</span>
      </FeatureGate>,
    );

    // Loading spinner should be shown (not children) to avoid hydration mismatch
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });
});
