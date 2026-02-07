/**
 * Tests for GET /api/workouts/history
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/workouts/history/route';
import { prisma } from '@/lib/db/prisma';
import {
  createMockRequest,
  mockClientUser,
  mockTrainerUser,
  parseJsonResponse,
} from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma', () => {
  const mockPrisma = require('@prisma/client').prisma;
  return { prisma: mockPrisma };
});
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const { authenticate } = require('@/lib/middleware/auth');

function authAs(user: any) {
  authenticate.mockResolvedValue({ user });
}

function authFail() {
  authenticate.mockResolvedValue(
    NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  );
}

describe('GET /api/workouts/history', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    authFail();
    const req = createMockRequest('/api/workouts/history');
    const res = await GET(req);
    const { status } = await parseJsonResponse(res);
    expect(status).toBe(401);
  });

  it('returns completed sessions for client', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    const sessions = [
      { id: 'sess-1', status: 'completed', clientId: mockClientUser.id },
    ];
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue(sessions);
    (prisma.workoutSession.count as jest.Mock).mockResolvedValue(1);

    const req = createMockRequest('/api/workouts/history');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(sessions);
    expect(body.meta.total).toBe(1);
  });

  it('filters by completed status', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSession.count as jest.Mock).mockResolvedValue(0);

    const req = createMockRequest('/api/workouts/history');
    await GET(req);

    expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'completed',
        }),
      })
    );
  });

  it('uses clientId for client role', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSession.count as jest.Mock).mockResolvedValue(0);

    const req = createMockRequest('/api/workouts/history');
    await GET(req);

    expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          clientId: mockClientUser.id,
        }),
      })
    );
  });

  it('uses trainerId for trainer without clientId param', async () => {
    authAs({ ...mockTrainerUser, role: 'trainer' });
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSession.count as jest.Mock).mockResolvedValue(0);

    const req = createMockRequest('/api/workouts/history');
    await GET(req);

    expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          trainerId: mockTrainerUser.id,
        }),
      })
    );
  });

  it('allows trainer to view client history', async () => {
    authAs({ ...mockTrainerUser, role: 'trainer' });
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSession.count as jest.Mock).mockResolvedValue(0);

    const clientId = '00000000-0000-0000-0000-000000000099';
    const req = createMockRequest('/api/workouts/history', {
      searchParams: { clientId },
    });
    await GET(req);

    expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          clientId,
        }),
      })
    );
  });

  it('applies date range filters', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSession.count as jest.Mock).mockResolvedValue(0);

    const req = createMockRequest('/api/workouts/history', {
      searchParams: {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      },
    });
    await GET(req);

    expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          scheduledDate: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    );
  });

  it('applies limit and offset with pagination meta', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSession.count as jest.Mock).mockResolvedValue(100);

    const req = createMockRequest('/api/workouts/history', {
      searchParams: { limit: '10', offset: '5' },
    });
    const res = await GET(req);
    const { body } = await parseJsonResponse(res);

    expect(body.meta.limit).toBe(10);
    expect(body.meta.offset).toBe(5);
    expect(body.meta.hasMore).toBe(true);
    expect(body.meta.total).toBe(100);
  });

  it('includes client info for trainer role', async () => {
    authAs({ ...mockTrainerUser, role: 'trainer' });
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSession.count as jest.Mock).mockResolvedValue(0);

    const req = createMockRequest('/api/workouts/history');
    await GET(req);

    expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          client: expect.any(Object),
        }),
      })
    );
  });

  it('orders by scheduledDate desc', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSession.count as jest.Mock).mockResolvedValue(0);

    const req = createMockRequest('/api/workouts/history');
    await GET(req);

    expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { scheduledDate: 'desc' },
      })
    );
  });

  it('handles server errors', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findMany as jest.Mock).mockRejectedValue(
      new Error('Query timeout')
    );

    const req = createMockRequest('/api/workouts/history');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Query timeout');
  });
});
