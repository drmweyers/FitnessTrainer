import {
  TIER_FEATURES,
  TIER_LIMITS,
  TIER_BY_LEVEL,
  LEVEL_BY_TIER,
  TIER_PRICING,
  resolveFeaturePath,
  tierAtLeast,
  type TierLevel,
} from '@/lib/subscription/tiers';

describe('TIER_BY_LEVEL / LEVEL_BY_TIER', () => {
  it('round-trips starter', () => {
    expect(TIER_BY_LEVEL[LEVEL_BY_TIER.starter]).toBe('starter');
  });

  it('round-trips professional', () => {
    expect(TIER_BY_LEVEL[LEVEL_BY_TIER.professional]).toBe('professional');
  });

  it('round-trips enterprise', () => {
    expect(TIER_BY_LEVEL[LEVEL_BY_TIER.enterprise]).toBe('enterprise');
  });

  it('hierarchy is strictly ascending', () => {
    expect(LEVEL_BY_TIER.starter).toBeLessThan(LEVEL_BY_TIER.professional);
    expect(LEVEL_BY_TIER.professional).toBeLessThan(LEVEL_BY_TIER.enterprise);
  });
});

describe('TIER_FEATURES map integrity', () => {
  const tiers: TierLevel[] = ['starter', 'professional', 'enterprise'];

  it('all three tiers are present', () => {
    for (const tier of tiers) {
      expect(TIER_FEATURES[tier]).toBeDefined();
    }
  });

  it('starter has no gated programBuilder features', () => {
    const pb = TIER_FEATURES.starter.programBuilder;
    expect(pb.dragDrop).toBe(true);
    expect(pb.aiSuggest).toBe(false);
    expect(pb.videoPreview).toBe(false);
    expect(pb.outlineDragReorder).toBe(false);
    expect(pb.mobileDragOptimised).toBe(false);
  });

  it('professional unlocks V2 features', () => {
    const pb = TIER_FEATURES.professional.programBuilder;
    expect(pb.aiSuggest).toBe(true);
    expect(pb.videoPreview).toBe(true);
    expect(pb.outlineDragReorder).toBe(true);
    expect(pb.mobileDragOptimised).toBe(true);
    expect(pb.teamShareTemplates).toBe(false);
    expect(pb.bulkAssign).toBe(false);
  });

  it('enterprise unlocks all features', () => {
    const pb = TIER_FEATURES.enterprise.programBuilder;
    expect(pb.teamShareTemplates).toBe(true);
    expect(pb.bulkAssign).toBe(true);
    expect(pb.pdfExport).toBe(true);
  });

  it('exportFormats escalate by tier', () => {
    expect(TIER_FEATURES.starter.exportFormats).toContain('pdf');
    expect(TIER_FEATURES.professional.exportFormats).toContain('csv');
    expect(TIER_FEATURES.enterprise.exportFormats).toContain('excel');
  });

  it('analytics is false for starter, true for professional and enterprise', () => {
    expect(TIER_FEATURES.starter.analytics).toBe(false);
    expect(TIER_FEATURES.professional.analytics).toBe(true);
    expect(TIER_FEATURES.enterprise.analytics).toBe(true);
  });

  it('apiAccess is only true for enterprise', () => {
    expect(TIER_FEATURES.starter.apiAccess).toBe(false);
    expect(TIER_FEATURES.professional.apiAccess).toBe(false);
    expect(TIER_FEATURES.enterprise.apiAccess).toBe(true);
  });
});

describe('TIER_LIMITS', () => {
  it('starter has bounded client limit', () => {
    expect(TIER_LIMITS.starter.clients).toBe(5);
  });

  it('professional and enterprise have unlimited programs (-1)', () => {
    expect(TIER_LIMITS.professional.programs).toBe(-1);
    expect(TIER_LIMITS.enterprise.programs).toBe(-1);
  });

  it('enterprise has unlimited everything (-1)', () => {
    expect(TIER_LIMITS.enterprise.clients).toBe(-1);
    expect(TIER_LIMITS.enterprise.exercisesCustom).toBe(-1);
  });
});

describe('TIER_PRICING', () => {
  it('contains all four known EvoFit price IDs', () => {
    expect(TIER_PRICING['price_1TEwpaGo4HHYDfDVyvecwfMc']).toBe('starter');
    expect(TIER_PRICING['price_1TEwpcGo4HHYDfDVqNAFCnDt']).toBe('professional');
    expect(TIER_PRICING['price_1TEwpeGo4HHYDfDVe7M1XZTD']).toBe('enterprise');
    expect(TIER_PRICING['price_1TEwpdGo4HHYDfDVmtIVLSQo']).toBe('professional');
  });

  it('SaaS add-on maps to professional baseline', () => {
    expect(TIER_PRICING['price_1TEwpdGo4HHYDfDVmtIVLSQo']).toBe('professional');
  });
});

describe('resolveFeaturePath', () => {
  it('resolves top-level boolean path', () => {
    expect(resolveFeaturePath('professional', 'analytics')).toBe(true);
    expect(resolveFeaturePath('starter', 'analytics')).toBe(false);
  });

  it('resolves nested dot-path', () => {
    expect(resolveFeaturePath('professional', 'programBuilder.aiSuggest')).toBe(true);
    expect(resolveFeaturePath('starter', 'programBuilder.aiSuggest')).toBe(false);
  });

  it('returns undefined for unknown path', () => {
    expect(resolveFeaturePath('starter', 'nonexistent.path')).toBeUndefined();
  });

  it('resolves enterprise-only features', () => {
    expect(resolveFeaturePath('enterprise', 'programBuilder.teamShareTemplates')).toBe(true);
    expect(resolveFeaturePath('professional', 'programBuilder.teamShareTemplates')).toBe(false);
  });
});

describe('tierAtLeast', () => {
  it('returns true when current tier equals required', () => {
    expect(tierAtLeast('professional', 'professional')).toBe(true);
  });

  it('returns true when current tier is higher than required', () => {
    expect(tierAtLeast('enterprise', 'starter')).toBe(true);
    expect(tierAtLeast('enterprise', 'professional')).toBe(true);
  });

  it('returns false when current tier is lower than required', () => {
    expect(tierAtLeast('starter', 'professional')).toBe(false);
    expect(tierAtLeast('starter', 'enterprise')).toBe(false);
    expect(tierAtLeast('professional', 'enterprise')).toBe(false);
  });
});
