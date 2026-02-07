/**
 * Tests for GET /api/workouts/active
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/workouts/active/route';
import { prisma } from '@/lib/db/prisma';
import {
  createMockRequest,
  mockClientUser,
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

describe('GET /api/workouts/active', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    authFail();
    const req = createMockRequest('/api/workouts/active');
    const res = await GET(req);
    const { status } = await parseJsonResponse(res);
    expect(status).toBe(401);
  });

  it('returns null data when no active session exists', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/active');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
    expect(body.message).toBe('No active workout session');
  });

  it('returns active session with full includes', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    const activeSession = {
      id: 'sess-1',
      clientId: mockClientUser.id,
      status: 'in_progress',
      exerciseLogs: [],
      workout: { exercises: [] },
      programAssignment: { program: { name: 'Test' } },
    };
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(activeSession);

    const req = createMockRequest('/api/workouts/active');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(activeSession);
  });

  it('queries with correct filters', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/active');
    await GET(req);

    expect(prisma.workoutSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          clientId: mockClientUser.id,
          status: 'in_progress',
        },
        orderBy: { actualStartTime: 'desc' },
      })
    );
  });

  it('includes nested exercise data', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/active');
    await GET(req);

    expect(prisma.workoutSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          exerciseLogs: expect.any(Object),
          workout: expect.any(Object),
          programAssignment: expect.any(Object),
        }),
      })
    );
  });

  it('handles server errors', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockRejectedValue(
      new Error('Connection timeout')
    );

    const req = createMockRequest('/api/workouts/active');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Connection timeout');
  });
});
