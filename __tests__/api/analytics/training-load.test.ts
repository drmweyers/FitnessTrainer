/**
 * Tests for app/api/analytics/training-load/route.ts
 * GET /api/analytics/training-load
 */

import { NextResponse } from 'next/server';
import { GET } from '@/app/api/analytics/training-load/route';
import { prisma } from '@/lib/db/prisma';
import { createMockRequest, mockClientUser } from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const mockedPrisma = prisma as any;
const { authenticate } = require('@/lib/middleware/auth');

function mockAuthAs(user: any) {
  authenticate.mockResolvedValue({ user });
}

function mockAuthFailure() {
  authenticate.mockResolvedValue(
    NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  );
}

describe('GET /api/analytics/training-load', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest('/api/analytics/training-load');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('successfully fetches training load', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const mockTrainingLoad = [
      {
        id: 'load-1',
        userId: mockClientUser.id,
        weekStartDate: new Date('2024-01-01'),
        totalVolume: 50000,
        totalSets: 120,
        totalReps: 360,
        averageIntensity: 75,
        trainingDays: 5,
        totalDuration: 300,
        acuteLoad: 5000,
        chronicLoad: 4500,
        loadRatio: 1.11,
        createdAt: new Date('2024-01-08'),
      },
      {
        id: 'load-2',
        userId: mockClientUser.id,
        weekStartDate: new Date('2024-01-08'),
        totalVolume: 52000,
        totalSets: 125,
        totalReps: 375,
        averageIntensity: 76,
        trainingDays: 5,
        totalDuration: 310,
        acuteLoad: 5200,
        chronicLoad: 4600,
        loadRatio: 1.13,
        createdAt: new Date('2024-01-15'),
      },
    ];

    mockedPrisma.trainingLoad.findMany.mockResolvedValue(mockTrainingLoad);

    const request = createMockRequest('/api/analytics/training-load');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].totalVolume).toBe(50000);
  });

  it('returns empty array when no training load data', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.trainingLoad.findMany.mockResolvedValue([]);

    const request = createMockRequest('/api/analytics/training-load');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('defaults to 12 weeks when no weeks parameter', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.trainingLoad.findMany.mockResolvedValue([]);

    const request = createMockRequest('/api/analytics/training-load');
    await GET(request);

    const callArgs = mockedPrisma.trainingLoad.findMany.mock.calls[0][0];
    const startDate = callArgs.where.weekStartDate.gte;
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - 12 * 7);

    // Check within 1 day tolerance (test timing)
    const diff = Math.abs(startDate.getTime() - expectedDate.getTime());
    expect(diff).toBeLessThan(24 * 60 * 60 * 1000);
  });

  it('uses weeks parameter when provided', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.trainingLoad.findMany.mockResolvedValue([]);

    const request = createMockRequest('/api/analytics/training-load', {
      searchParams: { weeks: '8' },
    });
    await GET(request);

    const callArgs = mockedPrisma.trainingLoad.findMany.mock.calls[0][0];
    const startDate = callArgs.where.weekStartDate.gte;
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - 8 * 7);

    const diff = Math.abs(startDate.getTime() - expectedDate.getTime());
    expect(diff).toBeLessThan(24 * 60 * 60 * 1000);
  });

  it('uses custom startDate when provided', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.trainingLoad.findMany.mockResolvedValue([]);

    const startDate = '2024-01-01';
    const request = createMockRequest('/api/analytics/training-load', {
      searchParams: { startDate },
    });
    await GET(request);

    expect(mockedPrisma.trainingLoad.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          weekStartDate: { gte: new Date(startDate) },
        }),
      })
    );
  });

  it('orders by weekStartDate asc', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const request = createMockRequest('/api/analytics/training-load');
    await GET(request);

    expect(mockedPrisma.trainingLoad.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { weekStartDate: 'asc' },
      })
    );
  });

  it('filters by user ID', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const request = createMockRequest('/api/analytics/training-load');
    await GET(request);

    expect(mockedPrisma.trainingLoad.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockClientUser.id,
        }),
      })
    );
  });

  it('handles invalid weeks parameter gracefully', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.trainingLoad.findMany.mockResolvedValue([]);

    const request = createMockRequest('/api/analytics/training-load', {
      searchParams: { weeks: 'invalid' },
    });
    const response = await GET(request);

    // Should use default of 12 weeks when parsing fails
    expect(response.status).toBe(200);
  });

  it('handles database errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.trainingLoad.findMany.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/analytics/training-load');
    const response = await GET(request);

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});
