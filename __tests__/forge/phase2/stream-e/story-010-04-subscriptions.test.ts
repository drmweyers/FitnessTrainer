/**
 * Story 010-04: Manage Subscriptions
 * Epic 010: Payments & Billing
 *
 * Tests subscription management workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    subscription: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
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

describe('Story 010-04: Manage Subscriptions - Create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client creates monthly subscription', async () => {
    const client = ActorFactory.createClient();
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/subscriptions'), { user: client })
    );

    const mockSubscription = {
      id: 'sub-1',
      clientId: client.id,
      trainerId: trainer.id,
      plan: 'monthly',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    mockedPrisma.subscription.create.mockResolvedValueOnce(mockSubscription);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'createSubscription', data: { trainerId: trainer.id, plan: 'monthly' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client creates annual subscription', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/subscriptions'), { user: client })
    );

    const mockSubscription = {
      id: 'sub-2',
      clientId: client.id,
      plan: 'annual',
      status: 'active',
    };

    mockedPrisma.subscription.create.mockResolvedValueOnce(mockSubscription);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'createSubscription', data: { plan: 'annual' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-04: Manage Subscriptions - Modify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client upgrades subscription plan', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/subscriptions/sub-1'), { user: client })
    );

    mockedPrisma.subscription.update.mockResolvedValueOnce({
      id: 'sub-1',
      plan: 'premium',
      status: 'active',
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'upgradeSubscription', data: { subscriptionId: 'sub-1', newPlan: 'premium' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client downgrades subscription plan', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/subscriptions/sub-1'), { user: client })
    );

    mockedPrisma.subscription.update.mockResolvedValueOnce({
      id: 'sub-1',
      plan: 'basic',
      status: 'active',
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'downgradeSubscription', data: { subscriptionId: 'sub-1', newPlan: 'basic' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client cancels subscription', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/subscriptions/sub-1'), { user: client })
    );

    mockedPrisma.subscription.update.mockResolvedValueOnce({
      id: 'sub-1',
      status: 'cancelled',
      cancelAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'cancelSubscription', data: { subscriptionId: 'sub-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client reactivates cancelled subscription', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/subscriptions/sub-1/reactivate'), { user: client })
    );

    mockedPrisma.subscription.update.mockResolvedValueOnce({
      id: 'sub-1',
      status: 'active',
      cancelAt: null,
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'reactivateSubscription', data: { subscriptionId: 'sub-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-04: Manage Subscriptions - View', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client views their subscriptions', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/subscriptions'), { user: client })
    );

    const mockSubscriptions = [
      { id: 'sub-1', plan: 'monthly', status: 'active' },
      { id: 'sub-2', plan: 'annual', status: 'cancelled' },
    ];

    mockedPrisma.subscription.findMany.mockResolvedValueOnce(mockSubscriptions);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'viewSubscriptions' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer views client subscriptions', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest(`/api/subscriptions?clientId=${client.id}`), { user: trainer })
    );

    const mockSubscriptions = [
      { id: 'sub-1', clientId: client.id, plan: 'monthly', status: 'active' },
    ];

    mockedPrisma.subscription.findMany.mockResolvedValueOnce(mockSubscriptions);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewClientSubscriptions', data: { clientId: client.id } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-04: Manage Subscriptions - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles payment failure for subscription', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.subscription.update.mockResolvedValueOnce({
      id: 'sub-1',
      status: 'past_due',
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'handleFailedPayment', data: { subscriptionId: 'sub-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles subscription expiration', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.subscription.findUnique.mockResolvedValueOnce({
      id: 'sub-1',
      status: 'expired',
      currentPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'viewSubscription', data: { subscriptionId: 'sub-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
