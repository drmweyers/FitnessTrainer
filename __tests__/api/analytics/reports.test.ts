/**
 * Tests for app/api/analytics/reports/route.ts
 * GET /api/analytics/reports
 * POST /api/analytics/reports
 */

import { NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/analytics/reports/route';
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

describe('GET /api/analytics/reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest('/api/analytics/reports');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('successfully fetches reports', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const mockReports = [
      {
        id: 'report-1',
        reportType: 'progress_report',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        generatedAt: new Date('2024-02-01'),
      },
      {
        id: 'report-2',
        reportType: 'progress_report',
        periodStart: new Date('2024-02-01'),
        periodEnd: new Date('2024-02-28'),
        generatedAt: new Date('2024-03-01'),
      },
    ];

    mockedPrisma.analyticsReport.findMany.mockResolvedValue(mockReports);

    const request = createMockRequest('/api/analytics/reports');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].reportType).toBe('progress_report');
  });

  it('returns empty array when no reports', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.analyticsReport.findMany.mockResolvedValue([]);

    const request = createMockRequest('/api/analytics/reports');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('orders reports by generatedAt desc', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const request = createMockRequest('/api/analytics/reports');
    await GET(request);

    expect(mockedPrisma.analyticsReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { generatedAt: 'desc' },
      })
    );
  });

  it('handles database errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.analyticsReport.findMany.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/analytics/reports');
    const response = await GET(request);

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});

describe('POST /api/analytics/reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest('/api/analytics/reports', {
      method: 'POST',
      body: { startDate: '2024-01-01', endDate: '2024-01-31' },
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns 400 when startDate is missing', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const request = createMockRequest('/api/analytics/reports', {
      method: 'POST',
      body: { endDate: '2024-01-31' },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('required');
  });

  it('returns 400 when endDate is missing', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const request = createMockRequest('/api/analytics/reports', {
      method: 'POST',
      body: { startDate: '2024-01-01' },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('required');
  });

  it('successfully generates report', async () => {
    mockAuthAs({ id: mockClientUser.id });

    mockedPrisma.workoutSession.findMany.mockResolvedValue([
      {
        id: 'workout-1',
        scheduledDate: new Date('2024-01-05'),
        status: 'completed',
        totalDuration: 60,
        totalVolume: 5000,
        totalSets: 12,
        completedSets: 12,
        averageRpe: 7.5,
        effortRating: 8,
      },
    ]);
    mockedPrisma.performanceMetric.findMany.mockResolvedValue([]);
    mockedPrisma.userMeasurement.findMany.mockResolvedValue([]);
    mockedPrisma.userGoal.findMany.mockResolvedValue([]);
    mockedPrisma.analyticsReport.create.mockResolvedValue({
      id: 'report-1',
      userId: mockClientUser.id,
      reportType: 'progress_report',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      generatedAt: new Date('2024-02-01'),
      reportData: {},
    });

    const request = createMockRequest('/api/analytics/reports', {
      method: 'POST',
      body: { startDate: '2024-01-01', endDate: '2024-01-31' },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.summary).toBeDefined();
    expect(body.data.summary.totalWorkouts).toBe(1);
    expect(body.data.summary.completedWorkouts).toBe(1);
  });

  it('calculates summary statistics correctly', async () => {
    mockAuthAs({ id: mockClientUser.id });

    mockedPrisma.workoutSession.findMany.mockResolvedValue([
      {
        id: 'workout-1',
        scheduledDate: new Date('2024-01-05'),
        status: 'completed',
        totalDuration: 60,
        totalVolume: 5000,
        totalSets: 12,
        completedSets: 12,
        averageRpe: 7,
      },
      {
        id: 'workout-2',
        scheduledDate: new Date('2024-01-10'),
        status: 'completed',
        totalDuration: 45,
        totalVolume: 4000,
        averageRpe: 8,
      },
      {
        id: 'workout-3',
        scheduledDate: new Date('2024-01-15'),
        status: 'scheduled',
        totalDuration: null,
        totalVolume: null,
      },
    ]);
    mockedPrisma.performanceMetric.findMany.mockResolvedValue([]);
    mockedPrisma.userMeasurement.findMany.mockResolvedValue([]);
    mockedPrisma.userGoal.findMany.mockResolvedValue([]);
    mockedPrisma.analyticsReport.create.mockResolvedValue({
      id: 'report-1',
      userId: mockClientUser.id,
      generatedAt: new Date(),
    } as any);

    const request = createMockRequest('/api/analytics/reports', {
      method: 'POST',
      body: { startDate: '2024-01-01', endDate: '2024-01-31' },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(body.data.summary.totalWorkouts).toBe(3);
    expect(body.data.summary.completedWorkouts).toBe(2);
    expect(body.data.summary.completionRate).toBe(67); // 2/3 * 100
    expect(body.data.summary.totalDurationMinutes).toBe(105); // 60 + 45
    expect(body.data.summary.totalVolume).toBe(9000); // 5000 + 4000
    expect(body.data.summary.averageRpe).toBe(7.5); // (7 + 8) / 2
  });

  it('includes performance metrics in report', async () => {
    mockAuthAs({ id: mockClientUser.id });

    mockedPrisma.workoutSession.findMany.mockResolvedValue([]);
    mockedPrisma.performanceMetric.findMany.mockResolvedValue([
      {
        metricType: 'max_weight',
        value: 225,
        unit: 'lbs',
        recordedAt: new Date('2024-01-15'),
      },
    ]);
    mockedPrisma.userMeasurement.findMany.mockResolvedValue([]);
    mockedPrisma.userGoal.findMany.mockResolvedValue([]);
    mockedPrisma.analyticsReport.create.mockResolvedValue({
      id: 'report-1',
      userId: mockClientUser.id,
      generatedAt: new Date(),
    } as any);

    const request = createMockRequest('/api/analytics/reports', {
      method: 'POST',
      body: { startDate: '2024-01-01', endDate: '2024-01-31' },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(body.data.performance).toHaveLength(1);
    expect(body.data.performance[0].type).toBe('max_weight');
    expect(body.data.performance[0].value).toBe(225);
  });

  it('handles database errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.workoutSession.findMany.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/analytics/reports', {
      method: 'POST',
      body: { startDate: '2024-01-01', endDate: '2024-01-31' },
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});
