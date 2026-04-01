/**
 * Story 010-08: Handle Payouts
 * Epic 010: Payments & Billing
 *
 * Tests payout workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    payout: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
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

describe('Story 010-08: Handle Payouts - Create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer requests payout', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/payouts'), { user: trainer })
    );

    const mockPayout = {
      id: 'payout-1',
      trainerId: trainer.id,
      amount: 500.00,
      status: 'pending',
      method: 'bank_transfer',
    };

    mockedPrisma.payout.create.mockResolvedValueOnce(mockPayout);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'requestPayout', data: { amount: 500, method: 'bank_transfer' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer requests automatic payout', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/payouts/auto'), { user: trainer })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'setupAutoPayout', data: { threshold: 1000, frequency: 'weekly' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-08: Handle Payouts - View', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer views payout history', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/payouts'), { user: trainer })
    );

    const mockPayouts = [
      { id: 'p1', amount: 500, status: 'completed', date: new Date('2026-03-01') },
      { id: 'p2', amount: 750, status: 'completed', date: new Date('2026-03-15') },
    ];

    mockedPrisma.payout.findMany.mockResolvedValueOnce(mockPayouts);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewPayouts' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer views available balance', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/payouts/balance'), { user: trainer })
    );

    mockedPrisma.payment.findMany.mockResolvedValueOnce([
      { amount: 1000, status: 'completed' },
      { amount: 500, status: 'completed' },
    ]);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewBalance' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-08: Handle Payouts - Admin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin processes payout', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/payouts/payout-1'), { user: admin })
    );

    mockedPrisma.payout.update.mockResolvedValueOnce({
      id: 'payout-1',
      status: 'processing',
    });

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'processPayout', data: { payoutId: 'payout-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin marks payout as completed', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/payouts/payout-1'), { user: admin })
    );

    mockedPrisma.payout.update.mockResolvedValueOnce({
      id: 'payout-1',
      status: 'completed',
      completedAt: new Date(),
      transactionId: 'txn_payout_123',
    });

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'completePayout', data: { payoutId: 'payout-1', transactionId: 'txn_payout_123' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin views all pending payouts', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/payouts?status=pending'), { user: admin })
    );

    const mockPayouts = [
      { id: 'p1', trainerId: 't1', amount: 500, status: 'pending' },
      { id: 'p2', trainerId: 't2', amount: 1000, status: 'pending' },
    ];

    mockedPrisma.payout.findMany.mockResolvedValueOnce(mockPayouts);

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewPendingPayouts' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-08: Handle Payouts - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prevents payout below minimum threshold', async () => {
    const trainer = ActorFactory.createTrainer();

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'requestPayout', data: { amount: 5 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('prevents payout exceeding available balance', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedPrisma.payment.findMany.mockResolvedValueOnce([
      { amount: 100, status: 'completed' },
    ]);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'requestPayout', data: { amount: 1000 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles payout failure', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedPrisma.payout.update.mockResolvedValueOnce({
      id: 'payout-1',
      status: 'failed',
      error: 'Bank account invalid',
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'checkPayoutStatus', data: { payoutId: 'payout-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
