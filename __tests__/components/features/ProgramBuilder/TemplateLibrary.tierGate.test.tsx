/**
 * @jest-environment jsdom
 *
 * TemplateLibrary — Enterprise tier gate tests.
 *
 * Verifies that the "Share with team" toggle:
 *   - is NOT rendered for Starter users
 *   - is NOT rendered for Professional users
 *   - IS rendered for Enterprise users
 *   - fires onChange with isTeamShared:true when enabled
 *   - fires onChange with isTeamShared:false when disabled
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Mock subscription hook ─────────────────────────────────────────────────
const mockUseTier = jest.fn();
jest.mock('@/hooks/useTier', () => ({
  useTier: () => mockUseTier(),
}));

// ── Mock FeatureGate so we can control visibility by tier ─────────────────
// The real FeatureGate calls useTier internally; we mock at module level to
// expose children only when programBuilder.teamShareTemplates is true.
jest.mock('@/components/subscription/FeatureGate', () => ({
  FeatureGate: ({ feature, children }: { feature: string; children: React.ReactNode }) => {
    const { hasFeature } = mockUseTier();
    return hasFeature(feature) ? <>{children}</> : null;
  },
}));

// ── Mock templates API ─────────────────────────────────────────────────────
jest.mock('@/lib/api/programs', () => ({
  getTemplates: jest.fn().mockResolvedValue([]),
}));

// ── Import component under test ────────────────────────────────────────────
import TemplateLibrary from '@/components/features/ProgramBuilder/TemplateLibrary';

// ── Helpers ────────────────────────────────────────────────────────────────
function makeTier(tier: 'starter' | 'professional' | 'enterprise') {
  const FEATURES: Record<string, Record<string, boolean>> = {
    starter:      { 'programBuilder.teamShareTemplates': false },
    professional: { 'programBuilder.teamShareTemplates': false },
    enterprise:   { 'programBuilder.teamShareTemplates': true },
  };
  return {
    tier,
    isLoading: false,
    hasFeature: (key: string) => FEATURES[tier][key] ?? false,
    canAccess: (required: string) =>
      ({ starter: 1, professional: 2, enterprise: 3 }[tier] ?? 0) >=
      ({ starter: 1, professional: 2, enterprise: 3 }[required] ?? 99),
  };
}

const noop = jest.fn();

describe('TemplateLibrary — "Share with team" tier gate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does NOT render "Share with team" toggle for Starter tier', async () => {
    mockUseTier.mockReturnValue(makeTier('starter'));
    render(<TemplateLibrary onSelectTemplate={noop} isTeamShared={false} onTeamSharedChange={noop} />);
    await waitFor(() => {
      expect(screen.queryByRole('switch', { name: /share with team/i })).not.toBeInTheDocument();
    });
  });

  it('does NOT render "Share with team" toggle for Professional tier', async () => {
    mockUseTier.mockReturnValue(makeTier('professional'));
    render(<TemplateLibrary onSelectTemplate={noop} isTeamShared={false} onTeamSharedChange={noop} />);
    await waitFor(() => {
      expect(screen.queryByRole('switch', { name: /share with team/i })).not.toBeInTheDocument();
    });
  });

  it('DOES render "Share with team" toggle for Enterprise tier', async () => {
    mockUseTier.mockReturnValue(makeTier('enterprise'));
    render(<TemplateLibrary onSelectTemplate={noop} isTeamShared={false} onTeamSharedChange={noop} />);
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /share with team/i })).toBeInTheDocument();
    });
  });

  it('fires onTeamSharedChange(true) when Enterprise user enables the toggle', async () => {
    mockUseTier.mockReturnValue(makeTier('enterprise'));
    const onChange = jest.fn();
    render(<TemplateLibrary onSelectTemplate={noop} isTeamShared={false} onTeamSharedChange={onChange} />);

    const toggle = await screen.findByRole('switch', { name: /share with team/i });
    fireEvent.click(toggle);

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('fires onTeamSharedChange(false) when Enterprise user disables the toggle', async () => {
    mockUseTier.mockReturnValue(makeTier('enterprise'));
    const onChange = jest.fn();
    render(<TemplateLibrary onSelectTemplate={noop} isTeamShared={true} onTeamSharedChange={onChange} />);

    const toggle = await screen.findByRole('switch', { name: /share with team/i });
    fireEvent.click(toggle);

    expect(onChange).toHaveBeenCalledWith(false);
  });
});
