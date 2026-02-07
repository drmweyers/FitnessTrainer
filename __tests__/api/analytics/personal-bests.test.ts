import { NextResponse } from 'next/server';
import { GET } from '@/app/api/analytics/performance/me/personal-bests/route';
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

describe('GET /api/analytics/performance/me/personal-bests', () => {
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

    const req = createMockRequest('/api/analytics/performance/me/personal-bests');
    const res = await GET(req);
    const { status } = await parseJsonResponse(res);

    expect(status).toBe(401);
  });

  it('returns personal bests grouped by exercise and metric type', async () => {
    mockAuth(clientUser);

    const mockResults = [
      {
        exercise_id: 'ex-1',
        exercise_name: 'Bench Press',
        metric_type: 'one_rm',
        max_value: 120,
        recorded_at: new Date('2024-06-15T10:00:00Z'),
      },
      {
        exercise_id: 'ex-1',
        exercise_name: 'Bench Press',
        metric_type: 'volume',
        max_value: 5000,
        recorded_at: new Date('2024-06-10T10:00:00Z'),
      },
      {
        exercise_id: 'ex-2',
        exercise_name: 'Squat',
        metric_type: 'one_rm',
        max_value: 180,
        recorded_at: new Date('2024-06-20T10:00:00Z'),
      },
    ];

    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockResults);

    const req = createMockRequest('/api/analytics/performance/me/personal-bests');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(3);

    expect(body.data[0]).toEqual({
      exerciseId: 'ex-1',
      exercise: 'Bench Press',
      metric: 'one_rm',
      value: 120,
      date: '2024-06-15T10:00:00.000Z',
    });

    expect(body.data[1]).toEqual({
      exerciseId: 'ex-1',
      exercise: 'Bench Press',
      metric: 'volume',
      value: 5000,
      date: '2024-06-10T10:00:00.000Z',
    });

    expect(body.data[2]).toEqual({
      exerciseId: 'ex-2',
      exercise: 'Squat',
      metric: 'one_rm',
      value: 180,
      date: '2024-06-20T10:00:00.000Z',
    });
  });

  it('returns empty array when user has no metrics', async () => {
    mockAuth(clientUser);
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/analytics/performance/me/personal-bests');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('converts max_value to Number', async () => {
    mockAuth(clientUser);

    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([
      {
        exercise_id: 'ex-1',
        exercise_name: 'Deadlift',
        metric_type: 'one_rm',
        max_value: '200.5',  // Might come as string from DB
        recorded_at: new Date('2024-06-01T10:00:00Z'),
      },
    ]);

    const req = createMockRequest('/api/analytics/performance/me/personal-bests');
    const res = await GET(req);
    const { body } = await parseJsonResponse(res);

    expect(typeof body.data[0].value).toBe('number');
    expect(body.data[0].value).toBe(200.5);
  });

  it('returns 500 on database error', async () => {
    mockAuth(clientUser);
    (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = createMockRequest('/api/analytics/performance/me/personal-bests');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch personal bests');
  });
});
