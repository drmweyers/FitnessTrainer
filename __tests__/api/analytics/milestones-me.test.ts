import { NextResponse } from 'next/server';
import { GET } from '@/app/api/analytics/milestones/me/route';
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

describe('GET /api/analytics/milestones/me', () => {
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

    const req = createMockRequest('/api/analytics/milestones/me');
    const res = await GET(req);
    const { status } = await parseJsonResponse(res);

    expect(status).toBe(401);
  });

  it('returns user milestones ordered by achievedAt desc', async () => {
    mockAuth(clientUser);

    const mockMilestones = [
      {
        id: 'ms-1',
        userId: clientUser.id,
        milestoneType: '100_workouts',
        title: '100 Workouts',
        description: 'Completed 100 workouts',
        achievedAt: new Date('2024-06-15'),
      },
      {
        id: 'ms-2',
        userId: clientUser.id,
        milestoneType: 'first_workout',
        title: 'First Workout',
        description: 'Completed first workout',
        achievedAt: new Date('2024-01-01'),
      },
    ];

    (mockPrisma.milestoneAchievement.findMany as jest.Mock).mockResolvedValue(mockMilestones);

    const req = createMockRequest('/api/analytics/milestones/me');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].id).toBe('ms-1');
    expect(body.data[1].id).toBe('ms-2');

    expect(mockPrisma.milestoneAchievement.findMany).toHaveBeenCalledWith({
      where: { userId: clientUser.id },
      orderBy: { achievedAt: 'desc' },
    });
  });

  it('returns empty array when user has no milestones', async () => {
    mockAuth(clientUser);
    (mockPrisma.milestoneAchievement.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/analytics/milestones/me');
    const res = await GET(req);
    const { body } = await parseJsonResponse(res);

    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockAuth(clientUser);
    (mockPrisma.milestoneAchievement.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = createMockRequest('/api/analytics/milestones/me');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch milestones');
  });
});
