/**
 * Story 010-07: Track Revenue
 * Epic 010: Payments & Billing
 *
 * Tests revenue tracking workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    payment: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
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

describe('Story 010-07: Track Revenue - Overview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer views revenue dashboard', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/revenue'), { user: trainer })
    );

    mockedPrisma.$queryRaw.mockResolvedValueOnce([
      { totalRevenue: 5000.00 },
    ]);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewRevenue' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer views revenue by time period', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/revenue?period=month'), { user: trainer })
    );

    mockedPrisma.payment.groupBy.mockResolvedValueOnce([
      { month: '2026-01', revenue: 2000 },
      { month: '2026-02', revenue: 2500 },
      { month: '2026-03', revenue: 3000 },
    ]);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewRevenue', data: { period: 'monthly' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-07: Track Revenue - Breakdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer views revenue by service type', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/revenue/by-service'), { user: trainer })
    );

    mockedPrisma.payment.groupBy.mockResolvedValueOnce([
      { type: 'single_session', revenue: 3000 },
      { type: 'package', revenue: 5000 },
      { type: 'subscription', revenue: 2000 },
    ]);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewRevenueByService' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer views revenue by client', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/revenue/by-client'), { user: trainer })
    );

    mockedPrisma.payment.groupBy.mockResolvedValueOnce([
      { clientId: 'c1', revenue: 1500 },
      { clientId: 'c2', revenue: 2500 },
      { clientId: 'c3', revenue: 1000 },
    ]);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewRevenueByClient' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer compares revenue periods', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/revenue/compare'), { user: trainer })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'compareRevenue', data: { period1: '2026-Q1', period2: '2026-Q2' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-07: Track Revenue - Reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trainer exports revenue report', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/revenue/export'), { user: trainer })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'exportRevenue', data: { format: 'csv', startDate: '2026-01-01', endDate: '2026-03-31' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin views platform-wide revenue', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/revenue'), { user: admin })
    );

    mockedPrisma.$queryRaw.mockResolvedValueOnce([
      { totalRevenue: 100000, trainerCount: 50, clientCount: 500 },
    ]);

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewPlatformRevenue' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 010-07: Track Revenue - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles zero revenue period', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedPrisma.payment.aggregate.mockResolvedValueOnce({
      _sum: { amount: 0 },
    });

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewRevenue', data: { period: 'daily', date: '2026-01-01' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles refunds in revenue calculation', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedPrisma.$queryRaw.mockResolvedValueOnce([
      { grossRevenue: 5000, refunds: 500, netRevenue: 4500 },
    ]);

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'viewNetRevenue' },
      ],
    });

    expect(result.success).toBe(true);
  });
});
