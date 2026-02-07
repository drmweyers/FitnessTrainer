import { NextResponse } from 'next/server';
import { GET } from '@/app/api/activities/route';
import { prisma } from '@/lib/db/prisma';
import { createMockRequest, parseJsonResponse } from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const { authenticate } = require('@/lib/middleware/auth');

// Helper to create authenticated user mock
function mockAuth(user: { id: string; email: string; role: string }) {
  authenticate.mockResolvedValue({ user });
}

function mockAuthFail() {
  authenticate.mockResolvedValue(
    NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  );
}

describe('GET /api/activities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuthFail();

    const req = createMockRequest('/api/activities');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  describe('role: client', () => {
    const clientUser = { id: 'client-1', email: 'client@test.com', role: 'client' };

    it('returns only own activities for client', async () => {
      mockAuth(clientUser);

      const mockActivities = [
        {
          id: 'act-1',
          type: 'workout_completed',
          title: 'Workout Done',
          description: 'Finished workout',
          createdAt: new Date('2024-06-01T10:00:00Z'),
          metadata: {},
          user: { id: clientUser.id, email: clientUser.email, userProfile: { bio: null } },
        },
      ];

      (mockPrisma.activity.findMany as jest.Mock).mockResolvedValue(mockActivities);
      (mockPrisma.activity.count as jest.Mock).mockResolvedValue(1);

      const req = createMockRequest('/api/activities');
      const res = await GET(req);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.activities).toHaveLength(1);
      expect(body.data.activities[0].id).toBe('act-1');
      expect(body.data.activities[0].user.name).toBe('client');

      // Verify where clause filters by userId
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: clientUser.id },
        })
      );
    });
  });

  describe('role: trainer', () => {
    const trainerUser = { id: 'trainer-1', email: 'trainer@test.com', role: 'trainer' };

    it('returns own + client activities for trainer', async () => {
      mockAuth(trainerUser);

      const mockClientIds = [{ clientId: 'client-1' }, { clientId: 'client-2' }];
      (mockPrisma.trainerClient.findMany as jest.Mock).mockResolvedValue(mockClientIds);
      (mockPrisma.activity.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.activity.count as jest.Mock).mockResolvedValue(0);

      const req = createMockRequest('/api/activities');
      await GET(req);

      // Verify trainer client lookup
      expect(mockPrisma.trainerClient.findMany).toHaveBeenCalledWith({
        where: { trainerId: trainerUser.id, status: 'active' },
        select: { clientId: true },
      });

      // Verify where clause includes trainer + client IDs
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: { in: ['trainer-1', 'client-1', 'client-2'] },
          },
        })
      );
    });
  });

  describe('role: admin', () => {
    const adminUser = { id: 'admin-1', email: 'admin@test.com', role: 'admin' };

    it('returns all activities for admin (no user filter)', async () => {
      mockAuth(adminUser);

      (mockPrisma.activity.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.activity.count as jest.Mock).mockResolvedValue(0);

      const req = createMockRequest('/api/activities');
      await GET(req);

      // Admin where clause should be empty (no userId filter)
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });
  });

  describe('pagination', () => {
    const clientUser = { id: 'client-1', email: 'client@test.com', role: 'client' };

    it('uses default page=1, limit=10', async () => {
      mockAuth(clientUser);
      (mockPrisma.activity.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.activity.count as jest.Mock).mockResolvedValue(0);

      const req = createMockRequest('/api/activities');
      const res = await GET(req);
      const { body } = await parseJsonResponse(res);

      expect(body.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
    });

    it('handles custom page and limit', async () => {
      mockAuth(clientUser);
      (mockPrisma.activity.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.activity.count as jest.Mock).mockResolvedValue(25);

      const req = createMockRequest('/api/activities', {
        searchParams: { page: '3', limit: '5' },
      });
      const res = await GET(req);
      const { body } = await parseJsonResponse(res);

      expect(body.data.pagination).toEqual({
        page: 3,
        limit: 5,
        total: 25,
        totalPages: 5,
      });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      );
    });

    it('clamps limit to max 50', async () => {
      mockAuth(clientUser);
      (mockPrisma.activity.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.activity.count as jest.Mock).mockResolvedValue(0);

      const req = createMockRequest('/api/activities', {
        searchParams: { limit: '100' },
      });
      await GET(req);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it('clamps limit to min 1', async () => {
      mockAuth(clientUser);
      (mockPrisma.activity.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.activity.count as jest.Mock).mockResolvedValue(0);

      const req = createMockRequest('/api/activities', {
        searchParams: { limit: '-5' },
      });
      await GET(req);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
        })
      );
    });

    it('clamps page to min 1', async () => {
      mockAuth(clientUser);
      (mockPrisma.activity.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.activity.count as jest.Mock).mockResolvedValue(0);

      const req = createMockRequest('/api/activities', {
        searchParams: { page: '-1' },
      });
      await GET(req);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        })
      );
    });
  });

  describe('type filter', () => {
    const clientUser = { id: 'client-1', email: 'client@test.com', role: 'client' };

    it('filters by type when provided', async () => {
      mockAuth(clientUser);
      (mockPrisma.activity.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.activity.count as jest.Mock).mockResolvedValue(0);

      const req = createMockRequest('/api/activities', {
        searchParams: { type: 'workout_completed' },
      });
      await GET(req);

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: clientUser.id,
            type: 'workout_completed',
          },
        })
      );
    });
  });

  describe('response mapping', () => {
    const clientUser = { id: 'client-1', email: 'client@test.com', role: 'client' };

    it('maps activities to ActivityFeedItem format', async () => {
      mockAuth(clientUser);

      const mockActivities = [
        {
          id: 'act-1',
          type: 'workout_completed',
          title: 'Workout Done',
          description: null,
          createdAt: new Date('2024-06-01T10:00:00Z'),
          metadata: { extra: 'data' },
          user: {
            id: clientUser.id,
            email: 'john.doe@test.com',
            userProfile: { bio: 'A bio' },
          },
        },
      ];

      (mockPrisma.activity.findMany as jest.Mock).mockResolvedValue(mockActivities);
      (mockPrisma.activity.count as jest.Mock).mockResolvedValue(1);

      const req = createMockRequest('/api/activities');
      const res = await GET(req);
      const { body } = await parseJsonResponse(res);

      const item = body.data.activities[0];
      expect(item.id).toBe('act-1');
      expect(item.type).toBe('workout_completed');
      expect(item.title).toBe('Workout Done');
      expect(item.description).toBe('');
      expect(item.timestamp).toBe('2024-06-01T10:00:00.000Z');
      expect(item.user.id).toBe(clientUser.id);
      expect(item.user.name).toBe('john.doe');
      expect(item.metadata).toEqual({ extra: 'data' });
    });
  });

  it('returns 500 on unexpected error', async () => {
    mockAuth({ id: 'user-1', email: 'u@test.com', role: 'client' });
    (mockPrisma.activity.findMany as jest.Mock).mockRejectedValue(new Error('DB exploded'));
    (mockPrisma.activity.count as jest.Mock).mockRejectedValue(new Error('DB exploded'));

    const req = createMockRequest('/api/activities');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
  });
});
