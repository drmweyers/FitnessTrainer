import { NextResponse } from 'next/server';
import { GET } from '@/app/api/analytics/performance/me/route';
import { prisma } from '@/lib/db/prisma';
import { createMockRequest, parseJsonResponse } from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const { authenticate } = require('@/lib/middleware/auth');

function mockAuth(user: { id: string; email: string; role: string }) {
  authenticate.mockResolvedValue({ user });
}

function mockAuthFail() {
  authenticate.mockResolvedValue(
    NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  );
}

describe('GET /api/analytics/performance/me', () => {
  const clientUser = { id: 'client-1', email: 'client@test.com', role: 'client' };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuthFail();

    const req = createMockRequest('/api/analytics/performance/me');
    const res = await GET(req);
    const { status } = await parseJsonResponse(res);

    expect(status).toBe(401);
  });

  it('returns all metrics for user without filters', async () => {
    mockAuth(clientUser);

    const mockMetrics = [
      {
        id: 'pm-1',
        userId: clientUser.id,
        metricType: 'one_rm',
        value: 100,
        unit: 'kg',
        recordedAt: new Date('2024-06-01'),
        exercise: { id: 'ex-1', name: 'Bench Press' },
      },
    ];

    (mockPrisma.performanceMetric.findMany as jest.Mock).mockResolvedValue(mockMetrics);

    const req = createMockRequest('/api/analytics/performance/me');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);

    expect(mockPrisma.performanceMetric.findMany).toHaveBeenCalledWith({
      where: { userId: clientUser.id },
      include: {
        exercise: { select: { id: true, name: true } },
      },
      orderBy: { recordedAt: 'asc' },
    });
  });

  it('filters by exerciseId', async () => {
    mockAuth(clientUser);
    (mockPrisma.performanceMetric.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/analytics/performance/me', {
      searchParams: { exerciseId: 'ex-1' },
    });
    await GET(req);

    expect(mockPrisma.performanceMetric.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: clientUser.id, exerciseId: 'ex-1' },
      })
    );
  });

  it('filters by metricType', async () => {
    mockAuth(clientUser);
    (mockPrisma.performanceMetric.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/analytics/performance/me', {
      searchParams: { metricType: 'volume' },
    });
    await GET(req);

    expect(mockPrisma.performanceMetric.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: clientUser.id, metricType: 'volume' },
      })
    );
  });

  it('filters by date range (startDate and endDate)', async () => {
    mockAuth(clientUser);
    (mockPrisma.performanceMetric.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/analytics/performance/me', {
      searchParams: { startDate: '2024-01-01', endDate: '2024-06-30' },
    });
    await GET(req);

    expect(mockPrisma.performanceMetric.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: clientUser.id,
          recordedAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-06-30'),
          },
        },
      })
    );
  });

  it('filters by startDate only', async () => {
    mockAuth(clientUser);
    (mockPrisma.performanceMetric.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/analytics/performance/me', {
      searchParams: { startDate: '2024-01-01' },
    });
    await GET(req);

    expect(mockPrisma.performanceMetric.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: clientUser.id,
          recordedAt: {
            gte: new Date('2024-01-01'),
          },
        },
      })
    );
  });

  it('filters by endDate only', async () => {
    mockAuth(clientUser);
    (mockPrisma.performanceMetric.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/analytics/measurements/me', {
      searchParams: { endDate: '2024-06-30' },
    });
    await GET(req);

    expect(mockPrisma.performanceMetric.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: clientUser.id,
          recordedAt: {
            lte: new Date('2024-06-30'),
          },
        },
      })
    );
  });

  it('combines all filters', async () => {
    mockAuth(clientUser);
    (mockPrisma.performanceMetric.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/analytics/performance/me', {
      searchParams: {
        exerciseId: 'ex-1',
        metricType: 'one_rm',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      },
    });
    await GET(req);

    expect(mockPrisma.performanceMetric.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: clientUser.id,
          exerciseId: 'ex-1',
          metricType: 'one_rm',
          recordedAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31'),
          },
        },
      })
    );
  });

  it('returns 500 on database error', async () => {
    mockAuth(clientUser);
    (mockPrisma.performanceMetric.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = createMockRequest('/api/analytics/performance/me');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch performance metrics');
  });
});
