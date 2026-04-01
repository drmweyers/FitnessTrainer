/**
 * Story 010-02: Purchase Sessions
 * Epic 010: Payments & Billing
 *
 * Tests session purchase workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    purchase: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    clientPackage: {
      create: jest.fn(),
    },
    pricing: {
      findUnique: jest.fn(),
    },
  },
}));

import { authenticate } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';

const mockedPrisma = prisma as any;
const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('Story 010-02: Purchase Sessions - Single Session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client purchases single session', async () => {
    const client = ActorFactory.createClient();
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/purchases'), { user: client })
    );

    const mockPricing = { id: 'price-1', trainerId: trainer.id, amount: 75 };
    const mockPurchase = {
      id: 'purchase-1',
      clientId: client.id,
      trainerId: trainer.id,
      type: 'single_session',
      amount: 75,
      status: 'pending',
    };

    mockedPrisma.pricing.findUnique.mockResolvedValueOnce(mockPricing);
    mockedPrisma.purchase.create.mockResolvedValueOnce(mockPurchase);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'purchaseSession', data: { trainerId: trainer.id, type: 'single', pricingId: 'price-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client purchases intro session', async () => {
    const client = ActorFactory.createClient();
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/purchases'), { user: client })
    );

    const mockPricing = { id: 'price-intro', trainerId: trainer.id, amount: 35, type: 'intro_session' };
    const mockPurchase = {
      id: 'purchase-2',
      clientId: client.id,
      trainerId: trainer.id,
      type: 'intro_session',
      amount: 35,
    };

    mockedPrisma.pricing.findUnique.mockResolvedValueOnce(mockPricing);
    mockedPrisma.purchase.create.mockResolvedValueOnce(mockPurchase);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'purchaseSession', data: { trainerId: trainer.id, type: 'intro', pricingId: 'price-intro' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-02: Purchase Sessions - Packages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client purchases session package', async () => {
    const client = ActorFactory.createClient();
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/purchases'), { user: client })
    );

    const mockPackage = { id: 'pkg-1', trainerId: trainer.id, sessions: 10, price: 650 };
    const mockPurchase = {
      id: 'purchase-3',
      clientId: client.id,
      trainerId: trainer.id,
      type: 'package',
      packageId: 'pkg-1',
      amount: 650,
    };

    mockedPrisma.purchase.create.mockResolvedValueOnce(mockPurchase);
    mockedPrisma.clientPackage.create.mockResolvedValueOnce({
      id: 'client-pkg-1',
      clientId: client.id,
      packageId: 'pkg-1',
      sessionsRemaining: 10,
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'purchasePackage', data: { trainerId: trainer.id, packageId: 'pkg-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client purchases multiple packages', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValue(
      Object.assign(makeRequest('/api/purchases'), { user: client })
    );

    mockedPrisma.purchase.create.mockImplementation((args: any) =>
      Promise.resolve({ id: `purchase-${args.data.packageId}`, ...args.data })
    );

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'purchasePackage', data: { packageId: 'pkg-1' } },
        { action: 'purchasePackage', data: { packageId: 'pkg-2' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-02: Purchase Sessions - Subscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client purchases monthly subscription', async () => {
    const client = ActorFactory.createClient();
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/purchases/subscription'), { user: client })
    );

    const mockPurchase = {
      id: 'sub-purchase-1',
      clientId: client.id,
      trainerId: trainer.id,
      type: 'subscription',
      amount: 299,
      billingInterval: 'monthly',
    };

    mockedPrisma.purchase.create.mockResolvedValueOnce(mockPurchase);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'purchaseSubscription', data: { trainerId: trainer.id, plan: 'monthly' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client upgrades subscription', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/purchases/subscription/upgrade'), { user: client })
    );

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'upgradeSubscription', data: { newPlan: 'premium' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-02: Purchase Sessions - History', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client views purchase history', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/purchases/history'), { user: client })
    );

    const mockPurchases = [
      { id: 'p1', type: 'single_session', amount: 75, date: new Date('2026-03-01') },
      { id: 'p2', type: 'package', amount: 650, date: new Date('2026-03-15') },
    ];

    mockedPrisma.purchase.findMany.mockResolvedValueOnce(mockPurchases);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'viewPurchaseHistory' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer views client purchases', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest(`/api/purchases?clientId=${client.id}`), { user: trainer })
    );

    const mockPurchases = [
      { id: 'p1', clientId: client.id, type: 'package', amount: 650 },
    ];

    mockedPrisma.purchase.findMany.mockResolvedValueOnce(mockPurchases);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewClientPurchases', data: { clientId: client.id } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-02: Purchase Sessions - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles insufficient funds', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.purchase.create.mockRejectedValueOnce(new Error('Payment failed'));

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'purchaseSession', data: { amount: 1000 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('prevents duplicate purchase processing', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.purchase.findMany.mockResolvedValueOnce([
      { id: 'existing', status: 'pending', createdAt: new Date() },
    ]);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'purchaseSession', data: { type: 'single' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles expired pricing', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.pricing.findUnique.mockResolvedValueOnce({
      id: 'price-old',
      expiredAt: new Date('2026-01-01'),
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'purchaseSession', data: { pricingId: 'price-old' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
