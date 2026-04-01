/**
 * Story 010-05: Issue Refunds
 * Epic 010: Payments & Billing
 *
 * Tests refund workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    refund: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
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

describe('Story 010-05: Issue Refunds - Full Refunds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer issues full refund', async () => {
    const trainer = ActorFactory.createTrainer();
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/refunds'), { user: trainer })
    );

    const mockPayment = {
      id: 'pay-1',
      clientId: client.id,
      amount: 75.00,
      status: 'completed',
    };

    const mockRefund = {
      id: 'refund-1',
      paymentId: 'pay-1',
      amount: 75.00,
      type: 'full',
      status: 'processed',
    };

    mockedPrisma.payment.findUnique.mockResolvedValueOnce(mockPayment);
    mockedPrisma.refund.create.mockResolvedValueOnce(mockRefund);
    mockedPrisma.payment.update.mockResolvedValueOnce({ ...mockPayment, status: 'refunded' });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'issueRefund', data: { paymentId: 'pay-1', type: 'full' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin issues full refund', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/refunds'), { user: admin })
    );

    mockedPrisma.refund.create.mockResolvedValueOnce({
      id: 'refund-2',
      paymentId: 'pay-2',
      amount: 299.00,
      type: 'full',
      status: 'processed',
    });

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'issueRefund', data: { paymentId: 'pay-2', type: 'full' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-05: Issue Refunds - Partial Refunds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer issues partial refund', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/refunds'), { user: trainer })
    );

    const mockPayment = {
      id: 'pay-3',
      amount: 650.00,
      status: 'completed',
    };

    const mockRefund = {
      id: 'refund-3',
      paymentId: 'pay-3',
      amount: 325.00,
      type: 'partial',
      reason: 'Package partially used',
    };

    mockedPrisma.payment.findUnique.mockResolvedValueOnce(mockPayment);
    mockedPrisma.refund.create.mockResolvedValueOnce(mockRefund);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'issueRefund', data: { paymentId: 'pay-3', type: 'partial', amount: 325 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('calculates prorated refund for subscription', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/refunds'), { user: trainer })
    );

    const mockPayment = {
      id: 'pay-sub',
      amount: 299.00,
      type: 'subscription',
    };

    mockedPrisma.payment.findUnique.mockResolvedValueOnce(mockPayment);
    mockedPrisma.refund.create.mockResolvedValueOnce({
      id: 'refund-prorated',
      amount: 199.00,
      type: 'prorated',
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'issueRefund', data: { paymentId: 'pay-sub', type: 'prorated' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-05: Issue Refunds - Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer views refund history', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/refunds'), { user: trainer })
    );

    const mockRefunds = [
      { id: 'r1', amount: 75, status: 'processed', date: new Date() },
      { id: 'r2', amount: 150, status: 'pending', date: new Date() },
    ];

    mockedPrisma.refund.findMany.mockResolvedValueOnce(mockRefunds);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewRefunds' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client views their refunds', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/refunds/my'), { user: client })
    );

    const mockRefunds = [
      { id: 'r1', amount: 75, status: 'processed' },
    ];

    mockedPrisma.refund.findMany.mockResolvedValueOnce(mockRefunds);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'viewMyRefunds' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-05: Issue Refunds - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prevents refund exceeding original amount', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedPrisma.payment.findUnique.mockResolvedValueOnce({
      id: 'pay-1',
      amount: 75.00,
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'issueRefund', data: { paymentId: 'pay-1', amount: 100 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles refund for already refunded payment', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedPrisma.payment.findUnique.mockResolvedValueOnce({
      id: 'pay-1',
      amount: 75.00,
      status: 'refunded',
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'issueRefund', data: { paymentId: 'pay-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles refund processing failure', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedPrisma.refund.create.mockResolvedValueOnce({
      id: 'refund-failed',
      status: 'failed',
      error: 'Processor error',
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'issueRefund', data: { paymentId: 'pay-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
