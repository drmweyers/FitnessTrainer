import { NextResponse } from 'next/server';
import { GET } from '@/app/api/analytics/training-load/me/route';
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

describe('GET /api/analytics/training-load/me', () => {
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

    const req = createMockRequest('/api/analytics/training-load/me');
    const res = await GET(req);
    const { status } = await parseJsonResponse(res);

    expect(status).toBe(401);
  });

  it('returns training loads with default 12-week lookback', async () => {
    mockAuth(clientUser);

    const mockLoads = [
      {
        id: 'tl-1',
        userId: clientUser.id,
        weekStartDate: new Date('2024-05-27'),
        totalVolume: 10000,
        totalSets: 50,
        totalReps: 300,
        trainingDays: 4,
        acuteLoad: 10000,
        chronicLoad: 8000,
        loadRatio: 1.25,
      },
    ];

    (mockPrisma.trainingLoad.findMany as jest.Mock).mockResolvedValue(mockLoads);

    const req = createMockRequest('/api/analytics/training-load/me');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].totalVolume).toBe(10000);

    expect(mockPrisma.trainingLoad.findMany).toHaveBeenCalledWith({
      where: {
        userId: clientUser.id,
        weekStartDate: { gte: expect.any(Date) },
      },
      orderBy: { weekStartDate: 'asc' },
    });
  });

  it('uses custom weeks parameter', async () => {
    mockAuth(clientUser);
    (mockPrisma.trainingLoad.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/analytics/training-load/me', {
      searchParams: { weeks: '4' },
    });
    await GET(req);

    const call = (mockPrisma.trainingLoad.findMany as jest.Mock).mock.calls[0][0];
    const startDate = call.where.weekStartDate.gte as Date;
    const now = new Date();
    const diffDays = Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(27);
    expect(diffDays).toBeLessThanOrEqual(29);
  });

  it('uses startDate parameter when provided', async () => {
    mockAuth(clientUser);
    (mockPrisma.trainingLoad.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/analytics/training-load/me', {
      searchParams: { startDate: '2024-01-01' },
    });
    await GET(req);

    expect(mockPrisma.trainingLoad.findMany).toHaveBeenCalledWith({
      where: {
        userId: clientUser.id,
        weekStartDate: { gte: new Date('2024-01-01') },
      },
      orderBy: { weekStartDate: 'asc' },
    });
  });

  it('returns empty array when no data exists', async () => {
    mockAuth(clientUser);
    (mockPrisma.trainingLoad.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/analytics/training-load/me');
    const res = await GET(req);
    const { body } = await parseJsonResponse(res);

    expect(body.data).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockAuth(clientUser);
    (mockPrisma.trainingLoad.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = createMockRequest('/api/analytics/training-load/me');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch training load');
  });
});
