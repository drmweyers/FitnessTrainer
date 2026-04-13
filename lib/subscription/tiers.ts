// Tier constants for EvoFitTrainer subscription system.
// Integer level kept in sync with the DB tierLevel column (1/2/3).

export type TierLevel = 'starter' | 'professional' | 'enterprise';

export const TIER_BY_LEVEL = { 1: 'starter', 2: 'professional', 3: 'enterprise' } as const;
export const LEVEL_BY_TIER = { starter: 1, professional: 2, enterprise: 3 } as const;

export const TIER_LIMITS = {
  starter:      { clients: 10,  programs: 20, exercisesCustom: 50  },
  professional: { clients: 50,  programs: -1, exercisesCustom: 500 },
  enterprise:   { clients: -1,  programs: -1, exercisesCustom: -1  },
} as const;

export const TIER_FEATURES = {
  starter: {
    programBuilder: {
      dragDrop: true,
      supersets: true,
      sections: true,
      templates: true,
      videoPreview: false,
      outlineDragReorder: false,
      aiSuggest: false,
      mobileDragOptimised: false,
      teamShareTemplates: false,
      bulkAssign: false,
      pdfExport: false,
    },
    analytics: false,
    apiAccess: false,
    exportFormats: ['pdf'] as const,
  },
  professional: {
    programBuilder: {
      dragDrop: true,
      supersets: true,
      sections: true,
      templates: true,
      videoPreview: true,
      outlineDragReorder: true,
      aiSuggest: true,
      mobileDragOptimised: true,
      teamShareTemplates: false,
      bulkAssign: false,
      pdfExport: true,
    },
    analytics: true,
    apiAccess: false,
    exportFormats: ['pdf', 'csv'] as const,
  },
  enterprise: {
    programBuilder: {
      dragDrop: true,
      supersets: true,
      sections: true,
      templates: true,
      videoPreview: true,
      outlineDragReorder: true,
      aiSuggest: true,
      mobileDragOptimised: true,
      teamShareTemplates: true,
      bulkAssign: true,
      pdfExport: true,
    },
    analytics: true,
    apiAccess: true,
    exportFormats: ['pdf', 'csv', 'excel'] as const,
  },
} as const;

// Stripe Price ID → tier mapping — source of truth for checkout + webhook
export const TIER_PRICING: Record<string, TierLevel> = {
  'price_1TEwpaGo4HHYDfDVyvecwfMc': 'starter',       // $199 one-time
  'price_1TEwpcGo4HHYDfDVqNAFCnDt': 'professional',  // $299 one-time
  'price_1TEwpeGo4HHYDfDVe7M1XZTD': 'enterprise',    // $399 one-time
  'price_1TEwpdGo4HHYDfDVmtIVLSQo': 'professional',  // $39.99/mo SaaS add-on → Pro baseline
};

// Resolve a dot-path string like 'programBuilder.aiSuggest' into a nested feature value.
// Returns undefined when the path does not exist.
export function resolveFeaturePath(tier: TierLevel, path: string): unknown {
  const parts = path.split('.');
  let node: unknown = TIER_FEATURES[tier];
  for (const part of parts) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

// Returns true when tier >= requiredTier in the hierarchy.
export function tierAtLeast(tier: TierLevel, requiredTier: TierLevel): boolean {
  return LEVEL_BY_TIER[tier] >= LEVEL_BY_TIER[requiredTier];
}
