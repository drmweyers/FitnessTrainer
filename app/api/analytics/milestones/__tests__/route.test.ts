/**
 * Milestones API Route Tests
 */

import { GET } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware/auth';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth');

const mockPrisma = require('@/lib/db/prisma').prisma;
const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

describe('GET /api/analytics/milestones', () => {
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
    mockPrisma.milestoneAchievement = {
      findMany: jest.fn(),
    };
  });

  it('should return milestones for authenticated user', async () => {
    const mockMilestones = [
      {
        id: 'milestone-1',
        userId: mockUser.id,
        milestoneType: 'first_workout',
        achievedAt: new Date('2024-01-15'),
      },
      {
        id: 'milestone-2',
        userId: mockUser.id,
        milestoneType: 'weight_goal',
        achievedAt: new Date('2024-01-10'),
      },
    ];

    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);
    mockPrisma.milestoneAchievement.findMany.mockResolvedValue(mockMilestones);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.data[0]).toMatchObject({
      id: 'milestone-1',
      userId: mockUser.id,
      milestoneType: 'first_workout',
    });
    expect(mockPrisma.milestoneAchievement.findMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
      orderBy: { achievedAt: 'desc' },
    });
  });

  it('should return empty array when user has no milestones', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);
    mockPrisma.milestoneAchievement.findMany.mockResolvedValue([]);

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
    mockPrisma.milestoneAchievement.findMany.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch milestones');
  });

  it('should order milestones by most recent first', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockUser,
    } as any);
    mockPrisma.milestoneAchievement.findMany.mockResolvedValue([]);

    const request = createMockRequest();
    await GET(request);

    expect(mockPrisma.milestoneAchievement.findMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
      orderBy: { achievedAt: 'desc' },
    });
  });
});
