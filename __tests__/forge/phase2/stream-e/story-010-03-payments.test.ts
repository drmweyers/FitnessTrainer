/**
 * Story 010-03: Process Payments
 * Epic 010: Payments & Billing
 *
 * Tests payment processing workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    payment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    purchase: {
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

describe('Story 010-03: Process Payments - Credit Card', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes credit card payment', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/payments'), { user: client })
    );

    const mockPayment = {
      id: 'pay-1',
      clientId: client.id,
      amount: 75.00,
      method: 'credit_card',
      status: 'completed',
      transactionId: 'txn_123456',
    };

    mockedPrisma.payment.create.mockResolvedValueOnce(mockPayment);
    mockedPrisma.purchase.update.mockResolvedValueOnce({ id: 'purchase-1', status: 'paid' });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'processPayment', data: { purchaseId: 'purchase-1', method: 'credit_card' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('processes payment with saved card', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/payments'), { user: client })
    );

    const mockPayment = {
      id: 'pay-2',
      clientId: client.id,
      amount: 299.00,
      method: 'saved_card',
      cardLast4: '4242',
      status: 'completed',
    };

    mockedPrisma.payment.create.mockResolvedValueOnce(mockPayment);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'processPayment', data: { method: 'saved_card', cardId: 'card-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('processes 3D Secure payment', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/payments'), { user: client })
    );

    const mockPayment = {
      id: 'pay-3',
      clientId: client.id,
      amount: 650.00,
      method: 'credit_card',
      status: 'requires_action',
      clientSecret: 'secret_123',
    };

    mockedPrisma.payment.create.mockResolvedValueOnce(mockPayment);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'processPayment', data: { method: 'credit_card', amount: 650 } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-03: Process Payments - Alternative Methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes PayPal payment', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/payments'), { user: client })
    );

    const mockPayment = {
      id: 'pay-4',
      clientId: client.id,
      amount: 75.00,
      method: 'paypal',
      status: 'completed',
    };

    mockedPrisma.payment.create.mockResolvedValueOnce(mockPayment);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'processPayment', data: { method: 'paypal' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('processes Apple Pay payment', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/payments'), { user: client })
    );

    const mockPayment = {
      id: 'pay-5',
      clientId: client.id,
      amount: 299.00,
      method: 'apple_pay',
      status: 'completed',
    };

    mockedPrisma.payment.create.mockResolvedValueOnce(mockPayment);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'processPayment', data: { method: 'apple_pay' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('processes Google Pay payment', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/payments'), { user: client })
    );

    const mockPayment = {
      id: 'pay-6',
      clientId: client.id,
      amount: 75.00,
      method: 'google_pay',
      status: 'completed',
    };

    mockedPrisma.payment.create.mockResolvedValueOnce(mockPayment);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'processPayment', data: { method: 'google_pay' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-03: Process Payments - Status Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retrieves payment status', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/payments/pay-1'), { user: client })
    );

    mockedPrisma.payment.findUnique.mockResolvedValueOnce({
      id: 'pay-1',
      status: 'completed',
      amount: 75.00,
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'getPaymentStatus', data: { paymentId: 'pay-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles payment failure', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/payments'), { user: client })
    );

    mockedPrisma.payment.create.mockResolvedValueOnce({
      id: 'pay-failed',
      status: 'failed',
      error: 'Insufficient funds',
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'processPayment', data: { method: 'credit_card' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('retries failed payment', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/payments/pay-failed/retry'), { user: client })
    );

    mockedPrisma.payment.update.mockResolvedValueOnce({
      id: 'pay-failed',
      status: 'completed',
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'retryPayment', data: { paymentId: 'pay-failed' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-03: Process Payments - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles declined card', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.payment.create.mockResolvedValueOnce({
      id: 'pay-declined',
      status: 'declined',
      declineReason: 'card_declined',
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'processPayment', data: { method: 'credit_card' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles expired card', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.payment.create.mockResolvedValueOnce({
      id: 'pay-expired',
      status: 'failed',
      error: 'expired_card',
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'processPayment', data: { method: 'saved_card', cardId: 'expired-card' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles network timeout', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.payment.create.mockResolvedValueOnce({
      id: 'pay-timeout',
      status: 'pending',
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'processPayment', data: { method: 'credit_card' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
