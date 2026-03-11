import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/middleware/admin', () => ({
  authenticateAdmin: jest.fn().mockImplementation((req: any) => {
    return Promise.resolve(Object.assign(req, {
      user: { id: 'admin-1', role: 'admin', email: 'admin@test.com' }
    }));
  }),
}));

jest.mock('@/lib/middleware/auth', () => ({
  AuthenticatedRequest: {},
}));

jest.mock('@/lib/db/prisma');

import { authenticateAdmin } from '@/lib/middleware/admin';
import { prisma } from '@/lib/db/prisma';
import { GET } from '@/app/api/admin/activity/route';

const mockedPrisma = prisma as any;

function makeRequest(url: string): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`);
}

describe('GET /api/admin/activity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns activity entries from multiple sources', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'u1', email: 'john@test.com', lastLoginAt: new Date('2026-03-10T10:00:00Z') },
    ]);
    (prisma.appointment.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'a1',
        trainerId: 'u2',
        title: 'Morning Session',
        status: 'scheduled',
        updatedAt: new Date('2026-03-10T09:00:00Z'),
        trainer: { email: 'trainer@test.com' },
      },
    ]);
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'w1',
        clientId: 'u3',
        status: 'completed',
        updatedAt: new Date('2026-03-10T08:00:00Z'),
        client: { email: 'client@test.com' },
      },
    ]);

    const request = makeRequest('/api/admin/activity');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.activities).toHaveLength(3);

    // Should be sorted by timestamp desc
    expect(data.data.activities[0].action).toBe('logged_in');
    expect(data.data.activities[1].action).toBe('updated');
    expect(data.data.activities[1].resource).toBe('appointment');
    expect(data.data.activities[2].action).toBe('completed');
    expect(data.data.activities[2].resource).toBe('workout');
  });

  it('respects limit parameter', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'u1', email: 'a@test.com', lastLoginAt: new Date('2026-03-10T10:00:00Z') },
      { id: 'u2', email: 'b@test.com', lastLoginAt: new Date('2026-03-10T09:00:00Z') },
      { id: 'u3', email: 'c@test.com', lastLoginAt: new Date('2026-03-10T08:00:00Z') },
    ]);
    (prisma.appointment.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);

    const request = makeRequest('/api/admin/activity?limit=2');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.activities).toHaveLength(2);
  });

  it('returns empty results', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.appointment.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);

    const request = makeRequest('/api/admin/activity');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.activities).toHaveLength(0);
  });

  it('returns 403 for non-admin user', async () => {
    (authenticateAdmin as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    );

    const request = makeRequest('/api/admin/activity');
    const response = await GET(request);

    expect(response.status).toBe(403);
  });

  it('returns 500 on database error', async () => {
    (prisma.user.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = makeRequest('/api/admin/activity');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch activity log');
  });
});
