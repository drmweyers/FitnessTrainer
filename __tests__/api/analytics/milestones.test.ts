/**
 * Tests for app/api/analytics/milestones/route.ts
 * GET /api/analytics/milestones
 */

import { NextResponse } from 'next/server';
import { GET } from '@/app/api/analytics/milestones/route';
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

describe('GET /api/analytics/milestones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest('/api/analytics/milestones');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('successfully fetches milestones', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const mockMilestones = [
      {
        id: 'milestone-1',
        userId: mockClientUser.id,
        type: '100_workouts',
        description: 'Completed 100 workouts',
        value: 100,
        achievedAt: new Date('2024-06-01'),
        createdAt: new Date('2024-06-01'),
      },
      {
        id: 'milestone-2',
        userId: mockClientUser.id,
        type: 'first_workout',
        description: 'Completed first workout',
        value: 1,
        achievedAt: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
      },
    ];

    mockedPrisma.milestoneAchievement.findMany.mockResolvedValue(mockMilestones);

    const request = createMockRequest('/api/analytics/milestones');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].type).toBe('100_workouts');
  });

  it('returns empty array when no milestones', async () => {
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.milestoneAchievement.findMany.mockResolvedValue([]);

    const request = createMockRequest('/api/analytics/milestones');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('orders milestones by achievedAt desc', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const request = createMockRequest('/api/analytics/milestones');
    await GET(request);

    expect(mockedPrisma.milestoneAchievement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { achievedAt: 'desc' },
      })
    );
  });

  it('filters by user ID', async () => {
    mockAuthAs({ id: mockClientUser.id });

    const request = createMockRequest('/api/analytics/milestones');
    await GET(request);

    expect(mockedPrisma.milestoneAchievement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: mockClientUser.id },
      })
    );
  });

  it('handles database errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockClientUser.id });
    mockedPrisma.milestoneAchievement.findMany.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/analytics/milestones');
    const response = await GET(request);

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});
