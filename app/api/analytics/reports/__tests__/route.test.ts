/**
 * Reports API Route Tests
 */

import { GET, POST } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware/auth';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth');

const mockPrisma = require('@/lib/db/prisma').prisma;
const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

describe('GET /api/analytics/reports', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'TRAINER',
  };

  const createMockRequest = () => {
    return {
      headers: new Map(),
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.analyticsReport = {
      findMany: jest.fn(),
      create: jest.fn(),
    };
  });

  it('should return reports for authenticated user', async () => {
    const mockReports = [
      {
        id: 'report-1',
        reportType: 'progress_report',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        generatedAt: new Date('2024-01-31'),
      },
    ];

    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);
    mockPrisma.analyticsReport.findMany.mockResolvedValue(mockReports);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(mockPrisma.analyticsReport.findMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
      select: {
        id: true,
        reportType: true,
        periodStart: true,
        periodEnd: true,
        generatedAt: true,
      },
      orderBy: { generatedAt: 'desc' },
    });
  });

  it('should return empty array when user has no reports', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);
    mockPrisma.analyticsReport.findMany.mockResolvedValue([]);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
  });

  it('should return 401 when not authenticated', async () => {
    mockAuthenticate.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should handle database errors', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);
    mockPrisma.analyticsReport.findMany.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch reports');
  });
});

describe('POST /api/analytics/reports', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'TRAINER',
  };

  const createMockRequest = (body: any) => {
    return {
      json: async () => body,
      headers: new Map(),
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.analyticsReport = {
      create: jest.fn(),
    };
    mockPrisma.workoutSession = {
      findMany: jest.fn(),
    };
    mockPrisma.performanceMetric = {
      findMany: jest.fn(),
    };
    mockPrisma.userMeasurement = {
      findMany: jest.fn(),
    };
    mockPrisma.userGoal = {
      findMany: jest.fn(),
    };
  });

  it('should generate a report with valid date range', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);

    mockPrisma.workoutSession.findMany.mockResolvedValue([
      {
        id: 'session-1',
        scheduledDate: new Date('2024-01-15'),
        status: 'completed',
        totalDuration: 60,
        totalVolume: 1000,
        totalSets: 10,
        completedSets: 10,
        averageRpe: 7,
        effortRating: 8,
      },
    ]);
    mockPrisma.performanceMetric.findMany.mockResolvedValue([]);
    mockPrisma.userMeasurement.findMany.mockResolvedValue([]);
    mockPrisma.userGoal.findMany.mockResolvedValue([]);
    mockPrisma.analyticsReport.create.mockResolvedValue({
      id: 'report-1',
      userId: mockUser.id,
      reportType: 'progress_report',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      reportData: {},
      generatedAt: new Date(),
    });

    const request = createMockRequest({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('summary');
    expect(data.data).toHaveProperty('workouts');
    expect(data.data).toHaveProperty('performance');
    expect(data.data).toHaveProperty('measurements');
    expect(data.data).toHaveProperty('goals');
  });

  it('should return 400 when startDate is missing', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);

    const request = createMockRequest({
      endDate: '2024-01-31',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Start date and end date are required');
  });

  it('should return 400 when endDate is missing', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);

    const request = createMockRequest({
      startDate: '2024-01-01',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Start date and end date are required');
  });

  it('should return 401 when not authenticated', async () => {
    mockAuthenticate.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const request = createMockRequest({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('should handle database errors', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);

    mockPrisma.workoutSession.findMany.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to generate report');
  });

  it('should calculate summary stats correctly', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);

    mockPrisma.workoutSession.findMany.mockResolvedValue([
      {
        id: 'session-1',
        scheduledDate: new Date('2024-01-15'),
        status: 'completed',
        totalDuration: 60,
        totalVolume: 1000,
        totalSets: 10,
        completedSets: 10,
        averageRpe: 7,
        effortRating: 8,
      },
      {
        id: 'session-2',
        scheduledDate: new Date('2024-01-16'),
        status: 'completed',
        totalDuration: 45,
        totalVolume: 800,
        totalSets: 8,
        completedSets: 8,
        averageRpe: 6,
        effortRating: 7,
      },
    ]);
    mockPrisma.performanceMetric.findMany.mockResolvedValue([]);
    mockPrisma.userMeasurement.findMany.mockResolvedValue([]);
    mockPrisma.userGoal.findMany.mockResolvedValue([]);
    mockPrisma.analyticsReport.create.mockResolvedValue({
      id: 'report-1',
      userId: mockUser.id,
      reportType: 'progress_report',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      reportData: {},
      generatedAt: new Date(),
    });

    const request = createMockRequest({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.data.summary.totalWorkouts).toBe(2);
    expect(data.data.summary.completedWorkouts).toBe(2);
    expect(data.data.summary.completionRate).toBe(100);
    expect(data.data.summary.totalDurationMinutes).toBe(105);
    expect(data.data.summary.totalVolume).toBe(1800);
  });
});
