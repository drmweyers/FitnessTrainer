import { NextResponse } from 'next/server';
import { GET } from '@/app/api/analytics/measurements/me/route';
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

describe('GET /api/analytics/measurements/me', () => {
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

    const req = createMockRequest('/api/analytics/measurements/me');
    const res = await GET(req);
    const { status } = await parseJsonResponse(res);

    expect(status).toBe(401);
  });

  it('returns measurements without time range filter', async () => {
    mockAuth(clientUser);

    const mockRows = [
      {
        id: 'm-1',
        user_id: clientUser.id,
        height: 180,
        weight: 80,
        body_fat_percentage: 15,
        muscle_mass: 35,
        measurements: { chest: 100 },
        recorded_at: new Date('2024-06-01T00:00:00Z'),
      },
      {
        id: 'm-2',
        user_id: clientUser.id,
        height: null,
        weight: 79,
        body_fat_percentage: null,
        muscle_mass: null,
        measurements: null,
        recorded_at: new Date('2024-05-01T00:00:00Z'),
      },
    ];

    (mockPrisma.$queryRawUnsafe as jest.Mock).mockResolvedValue(mockRows);

    const req = createMockRequest('/api/analytics/measurements/me');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);

    expect(body.data[0].id).toBe('m-1');
    expect(body.data[0].weight).toBe(80);
    expect(body.data[0].height).toBe(180);
    expect(body.data[0].bodyFatPercentage).toBe(15);
    expect(body.data[0].muscleMass).toBe(35);
    expect(body.data[0].measurements).toEqual({ chest: 100 });
    expect(body.data[0].measurementDate).toBe('2024-06-01');

    expect(body.data[1].height).toBeUndefined();
    expect(body.data[1].bodyFatPercentage).toBeUndefined();
    expect(body.data[1].muscleMass).toBeUndefined();
    expect(body.data[1].measurements).toEqual({});

    // Should use the no-startDate query (2 args: SQL string + userId)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('WHERE user_id = $1::uuid'),
      clientUser.id
    );
  });

  it('handles null weight value', async () => {
    mockAuth(clientUser);

    const mockRows = [{
      id: 'm-3',
      user_id: clientUser.id,
      height: 180,
      weight: null,
      body_fat_percentage: 15,
      muscle_mass: 35,
      measurements: { chest: 100 },
      recorded_at: new Date('2024-06-01T00:00:00Z'),
    }];

    (mockPrisma.$queryRawUnsafe as jest.Mock).mockResolvedValue(mockRows);

    const req = createMockRequest('/api/analytics/measurements/me');
    const res = await GET(req);
    const { body } = await parseJsonResponse(res);

    expect(body.data[0].weight).toBeUndefined();
    expect(body.data[0].height).toBe(180);
  });

  describe('time range filtering', () => {
    it('filters by 7d time range', async () => {
      mockAuth(clientUser);
      (mockPrisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([]);

      const req = createMockRequest('/api/analytics/measurements/me', {
        searchParams: { timeRange: '7d' },
      });
      await GET(req);

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('recorded_at >= $2'),
        clientUser.id,
        expect.any(Date)
      );
    });

    it('filters by 30d time range', async () => {
      mockAuth(clientUser);
      (mockPrisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([]);

      const req = createMockRequest('/api/analytics/measurements/me', {
        searchParams: { timeRange: '30d' },
      });
      await GET(req);

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('recorded_at >= $2'),
        clientUser.id,
        expect.any(Date)
      );
    });

    it('filters by 3m time range', async () => {
      mockAuth(clientUser);
      (mockPrisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([]);

      const req = createMockRequest('/api/analytics/measurements/me', {
        searchParams: { timeRange: '3m' },
      });
      await GET(req);

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('recorded_at >= $2'),
        clientUser.id,
        expect.any(Date)
      );
    });

    it('filters by 6m time range', async () => {
      mockAuth(clientUser);
      (mockPrisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([]);

      const req = createMockRequest('/api/analytics/measurements/me', {
        searchParams: { timeRange: '6m' },
      });
      await GET(req);

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('recorded_at >= $2'),
        clientUser.id,
        expect.any(Date)
      );
    });

    it('filters by 1y time range', async () => {
      mockAuth(clientUser);
      (mockPrisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([]);

      const req = createMockRequest('/api/analytics/measurements/me', {
        searchParams: { timeRange: '1y' },
      });
      await GET(req);

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('recorded_at >= $2'),
        clientUser.id,
        expect.any(Date)
      );
    });

    it('ignores unknown time range values (no date filter applied)', async () => {
      mockAuth(clientUser);
      (mockPrisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([]);

      const req = createMockRequest('/api/analytics/measurements/me', {
        searchParams: { timeRange: 'invalid' },
      });
      await GET(req);

      // Should use the no-date query path (2 args only)
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1::uuid'),
        clientUser.id
      );
      // Should NOT have a 3rd date argument
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.anything(),
        clientUser.id
      );
    });
  });

  it('returns 500 on database error', async () => {
    mockAuth(clientUser);
    (mockPrisma.$queryRawUnsafe as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = createMockRequest('/api/analytics/measurements/me');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch measurements');
  });
});
