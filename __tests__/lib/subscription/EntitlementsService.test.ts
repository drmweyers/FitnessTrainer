// Mock the prisma singleton before importing the service
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    trainerSubscription: {
      findFirst: jest.fn(),
    },
    trainerClient: {
      count: jest.fn(),
    },
    program: {
      count: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/prisma';
import {
  getEntitlements,
  checkFeatureAccess,
  checkUsageLimit,
  invalidateCache,
} from '@/lib/subscription/EntitlementsService';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function resetMocks() {
  (mockPrisma.trainerSubscription.findFirst as jest.Mock).mockReset();
  (mockPrisma.trainerClient.count as jest.Mock).mockReset();
  (mockPrisma.program.count as jest.Mock).mockReset();
}

describe('EntitlementsService.getEntitlements', () => {
  beforeEach(() => {
    resetMocks();
    // Clear in-memory cache between tests
    invalidateCache('trainer-1');
    invalidateCache('trainer-2');
    invalidateCache('trainer-3');
  });

  it('defaults to starter when trainer has no active subscription', async () => {
    (mockPrisma.trainerSubscription.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.trainerClient.count as jest.Mock).mockResolvedValue(3);
    (mockPrisma.program.count as jest.Mock).mockResolvedValue(5);

    const result = await getEntitlements('trainer-1');

    expect(result.tier).toBe('starter');
    expect(result.level).toBe(1);
  });

  it('returns correct tier from tierLevel=2 (professional)', async () => {
    (mockPrisma.trainerSubscription.findFirst as jest.Mock).mockResolvedValue({
      id: 'sub-1',
      trainerId: 'trainer-2',
      tierLevel: 2,
      status: 'active',
      purchaseDate: new Date(),
    });
    (mockPrisma.trainerClient.count as jest.Mock).mockResolvedValue(10);
    (mockPrisma.program.count as jest.Mock).mockResolvedValue(30);

    const result = await getEntitlements('trainer-2');

    expect(result.tier).toBe('professional');
    expect(result.level).toBe(2);
  });

  it('returns enterprise for tierLevel=3', async () => {
    (mockPrisma.trainerSubscription.findFirst as jest.Mock).mockResolvedValue({
      id: 'sub-2',
      trainerId: 'trainer-3',
      tierLevel: 3,
      status: 'active',
      purchaseDate: new Date(),
    });
    (mockPrisma.trainerClient.count as jest.Mock).mockResolvedValue(100);
    (mockPrisma.program.count as jest.Mock).mockResolvedValue(200);

    const result = await getEntitlements('trainer-3');

    expect(result.tier).toBe('enterprise');
    expect(result.level).toBe(3);
  });

  it('populates limits with correct used/max/percentage for bounded tier', async () => {
    (mockPrisma.trainerSubscription.findFirst as jest.Mock).mockResolvedValue({
      id: 'sub-3',
      trainerId: 'trainer-1',
      tierLevel: 1,
      status: 'active',
      purchaseDate: new Date(),
    });
    (mockPrisma.trainerClient.count as jest.Mock).mockResolvedValue(5);
    (mockPrisma.program.count as jest.Mock).mockResolvedValue(10);

    const result = await getEntitlements('trainer-1');

    expect(result.limits.clients.max).toBe(10);
    expect(result.limits.clients.used).toBe(5);
    expect(result.limits.clients.percentage).toBe(50);
  });

  it('caches the result on a second call', async () => {
    (mockPrisma.trainerSubscription.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.trainerClient.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.program.count as jest.Mock).mockResolvedValue(0);

    await getEntitlements('trainer-1');
    await getEntitlements('trainer-1');

    // DB should only be queried once (cache hit on second call)
    expect(mockPrisma.trainerSubscription.findFirst).toHaveBeenCalledTimes(1);
  });

  it('re-queries after cache is invalidated', async () => {
    (mockPrisma.trainerSubscription.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.trainerClient.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.program.count as jest.Mock).mockResolvedValue(0);

    await getEntitlements('trainer-1');
    invalidateCache('trainer-1');
    await getEntitlements('trainer-1');

    expect(mockPrisma.trainerSubscription.findFirst).toHaveBeenCalledTimes(2);
  });
});

describe('EntitlementsService.checkFeatureAccess', () => {
  beforeEach(() => {
    resetMocks();
    invalidateCache('trainer-1');
  });

  it('allows a feature the tier has', async () => {
    (mockPrisma.trainerSubscription.findFirst as jest.Mock).mockResolvedValue({
      id: 'sub-4',
      trainerId: 'trainer-1',
      tierLevel: 2,
      status: 'active',
      purchaseDate: new Date(),
    });
    (mockPrisma.trainerClient.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.program.count as jest.Mock).mockResolvedValue(0);

    const result = await checkFeatureAccess('trainer-1', 'programBuilder.aiSuggest');
    expect(result.allowed).toBe(true);
  });

  it('denies a feature the starter tier lacks with upgradeRequired=true', async () => {
    (mockPrisma.trainerSubscription.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.trainerClient.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.program.count as jest.Mock).mockResolvedValue(0);

    const result = await checkFeatureAccess('trainer-1', 'programBuilder.aiSuggest');
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
    expect(result.reason).toContain('aiSuggest');
  });

  it('denies enterprise-only feature for professional tier', async () => {
    (mockPrisma.trainerSubscription.findFirst as jest.Mock).mockResolvedValue({
      id: 'sub-5',
      trainerId: 'trainer-1',
      tierLevel: 2,
      status: 'active',
      purchaseDate: new Date(),
    });
    (mockPrisma.trainerClient.count as jest.Mock).mockResolvedValue(0);
    (mockPrisma.program.count as jest.Mock).mockResolvedValue(0);

    const result = await checkFeatureAccess('trainer-1', 'programBuilder.teamShareTemplates');
    expect(result.allowed).toBe(false);
    expect(result.currentTier).toBe('professional');
  });
});

describe('EntitlementsService.checkUsageLimit', () => {
  beforeEach(() => {
    resetMocks();
    invalidateCache('trainer-1');
  });

  it('allows when within limit', async () => {
    (mockPrisma.trainerSubscription.findFirst as jest.Mock).mockResolvedValue(null); // starter
    (mockPrisma.trainerClient.count as jest.Mock).mockResolvedValue(5);
    (mockPrisma.program.count as jest.Mock).mockResolvedValue(5);

    const result = await checkUsageLimit('trainer-1', 'clients');
    expect(result.allowed).toBe(true);
  });

  it('denies when at or above limit', async () => {
    (mockPrisma.trainerSubscription.findFirst as jest.Mock).mockResolvedValue(null); // starter: 10 clients
    (mockPrisma.trainerClient.count as jest.Mock).mockResolvedValue(10);
    (mockPrisma.program.count as jest.Mock).mockResolvedValue(0);

    const result = await checkUsageLimit('trainer-1', 'clients');
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
  });

  it('always allows for unlimited tier (-1)', async () => {
    (mockPrisma.trainerSubscription.findFirst as jest.Mock).mockResolvedValue({
      id: 'sub-6',
      trainerId: 'trainer-1',
      tierLevel: 3,
      status: 'active',
      purchaseDate: new Date(),
    });
    (mockPrisma.trainerClient.count as jest.Mock).mockResolvedValue(9999);
    (mockPrisma.program.count as jest.Mock).mockResolvedValue(9999);

    const result = await checkUsageLimit('trainer-1', 'clients');
    expect(result.allowed).toBe(true);
  });
});
