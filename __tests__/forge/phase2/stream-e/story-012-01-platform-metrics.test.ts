/**
 * Story 012-01: View Platform Metrics
 * Epic 012: Admin Dashboard
 *
 * Tests admin platform metrics workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/middleware/admin', () => ({
  authenticateAdmin: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    user: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

import { authenticateAdmin } from '@/lib/middleware/admin';
import { prisma } from '@/lib/db/prisma';

const mockedPrisma = prisma as any;
const mockedAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('Story 012-01: Platform Metrics - Overview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin views platform overview', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/dashboard'), { user: admin })
    );

    mockedPrisma.$queryRaw.mockResolvedValueOnce([
      { totalUsers: 1000, totalTrainers: 100, totalClients: 850, totalAdmins: 5 },
    ]);

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewPlatformMetrics' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin views user growth metrics', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/metrics/growth'), { user: admin })
    );

    mockedPrisma.user.groupBy.mockResolvedValueOnce([
      { month: '2026-01', count: 100 },
      { month: '2026-02', count: 150 },
      { month: '2026-03', count: 200 },
    ]);

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewGrowthMetrics' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin views engagement metrics', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/metrics/engagement'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewEngagementMetrics' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 012-01: Platform Metrics - Revenue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin views platform revenue', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/metrics/revenue'), { user: admin })
    );

    mockedPrisma.$queryRaw.mockResolvedValueOnce([
      { totalRevenue: 50000, trainerRevenue: 45000, platformFees: 5000 },
    ]);

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewRevenueMetrics' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin views revenue by plan', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/metrics/revenue-by-plan'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewRevenueByPlan' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 012-01: Platform Metrics - Activity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin views workout activity', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/metrics/activity'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewActivityMetrics' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('admin views feature usage', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/metrics/feature-usage'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'viewFeatureUsage' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 012-01: Platform Metrics - Export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin exports metrics report', async () => {
    const admin = ActorFactory.createAdmin();

    mockedAuthenticateAdmin.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/admin/metrics/export'), { user: admin })
    );

    const result = await WorkflowRunner.run({
      actor: admin,
      steps: [
        { action: 'authenticate' },
        { action: 'exportMetrics', data: { format: 'csv', period: 'monthly' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
