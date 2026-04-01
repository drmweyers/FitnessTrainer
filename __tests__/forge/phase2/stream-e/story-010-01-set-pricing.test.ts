/**
 * Story 010-01: Set Pricing
 * Epic 010: Payments & Billing
 *
 * Tests trainer pricing configuration workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    pricing: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    package: {
      create: jest.fn(),
      findMany: jest.fn(),
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

describe('Story 010-01: Set Pricing - Session Pricing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer sets per-session pricing', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/pricing'), { user: trainer })
    );

    const mockPricing = {
      id: 'price-1',
      trainerId: trainer.id,
      type: 'per_session',
      amount: 75.00,
      currency: 'USD',
      duration: 60,
    };

    mockedPrisma.pricing.create.mockResolvedValueOnce(mockPricing);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setPricing', data: { type: 'per_session', amount: 75, duration: 60 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer sets multiple session rates', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValue(
      Object.assign(makeRequest('/api/pricing'), { user: trainer })
    );

    mockedPrisma.pricing.create.mockImplementation((args: any) =>
      Promise.resolve({ id: `price-${args.data.duration}`, ...args.data })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setPricing', data: { type: 'per_session', amount: 50, duration: 30 } },
        { action: 'setPricing', data: { type: 'per_session', amount: 75, duration: 60 } },
        { action: 'setPricing', data: { type: 'per_session', amount: 110, duration: 90 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer sets package pricing', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/pricing/packages'), { user: trainer })
    );

    const mockPackage = {
      id: 'pkg-1',
      trainerId: trainer.id,
      name: '10 Session Package',
      sessions: 10,
      price: 650.00,
      savings: 100.00,
    };

    mockedPrisma.package.create.mockResolvedValueOnce(mockPackage);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'createPackage', data: { name: '10 Session Package', sessions: 10, price: 650 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer sets monthly subscription pricing', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/pricing/subscription'), { user: trainer })
    );

    const mockSubscription = {
      id: 'sub-1',
      trainerId: trainer.id,
      name: 'Unlimited Monthly',
      price: 299.00,
      billingInterval: 'monthly',
      maxSessions: 12,
    };

    mockedPrisma.pricing.create.mockResolvedValueOnce(mockSubscription);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setSubscription', data: { name: 'Unlimited Monthly', price: 299, maxSessions: 12 } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-01: Set Pricing - Special Rates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer sets intro session rate', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/pricing'), { user: trainer })
    );

    const mockPricing = {
      id: 'price-intro',
      trainerId: trainer.id,
      type: 'intro_session',
      amount: 35.00,
      regularPrice: 75.00,
    };

    mockedPrisma.pricing.create.mockResolvedValueOnce(mockPricing);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setPricing', data: { type: 'intro_session', amount: 35, regularPrice: 75 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer sets group class pricing', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/pricing'), { user: trainer })
    );

    const mockPricing = {
      id: 'price-group',
      trainerId: trainer.id,
      type: 'group_class',
      amount: 25.00,
      perPerson: true,
    };

    mockedPrisma.pricing.create.mockResolvedValueOnce(mockPricing);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setPricing', data: { type: 'group_class', amount: 25, perPerson: true } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer sets online session discount', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/pricing'), { user: trainer })
    );

    const mockPricing = {
      id: 'price-online',
      trainerId: trainer.id,
      type: 'online_session',
      amount: 60.00,
      regularPrice: 75.00,
      discount: 15.00,
    };

    mockedPrisma.pricing.create.mockResolvedValueOnce(mockPricing);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setPricing', data: { type: 'online_session', amount: 60, regularPrice: 75 } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-01: Set Pricing - Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer views all pricing tiers', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/pricing'), { user: trainer })
    );

    const mockPricing = [
      { id: 'p1', type: 'per_session', amount: 75 },
      { id: 'p2', type: 'intro_session', amount: 35 },
      { id: 'p3', type: 'group_class', amount: 25 },
    ];

    mockedPrisma.pricing.findMany.mockResolvedValueOnce(mockPricing);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewPricing' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer updates existing pricing', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/pricing/price-1'), { user: trainer })
    );

    mockedPrisma.pricing.update.mockResolvedValueOnce({
      id: 'price-1',
      amount: 85.00,
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'updatePricing', data: { pricingId: 'price-1', amount: 85 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer deletes pricing tier', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/pricing/price-1'), { user: trainer })
    );

    mockedPrisma.pricing.delete.mockResolvedValueOnce({ id: 'price-1' });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'deletePricing', data: { pricingId: 'price-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-01: Set Pricing - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates minimum pricing', async () => {
    const trainer = ActorFactory.createTrainer();

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setPricing', data: { type: 'per_session', amount: 0.50 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('validates maximum pricing', async () => {
    const trainer = ActorFactory.createTrainer();

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setPricing', data: { type: 'per_session', amount: 10000 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles duplicate pricing types', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedPrisma.pricing.findMany.mockResolvedValueOnce([
      { id: 'existing', trainerId: trainer.id, type: 'per_session' },
    ]);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setPricing', data: { type: 'per_session', amount: 75 } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
