import { NextResponse } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/analytics/goals/[id]/route';
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

const clientUser = { id: 'client-1', email: 'client@test.com', role: 'client' };
const goalId = 'goal-123';
const routeParams = { params: { id: goalId } };

describe('/api/analytics/goals/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('GET /api/analytics/goals/[id]', () => {
    it('returns 401 when unauthenticated', async () => {
      mockAuthFail();

      const req = createMockRequest(`/api/analytics/goals/${goalId}`);
      const res = await GET(req, routeParams);
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(401);
    });

    it('returns a goal with its full progress history', async () => {
      mockAuth(clientUser);

      const mockGoal = {
        id: goalId,
        userId: clientUser.id,
        goalType: 'weight_loss',
        specificGoal: 'Lose 10kg',
        targetValue: 70,
        isActive: true,
        goalProgress: [
          { id: 'gp-1', currentValue: 75, recordedDate: new Date('2024-06-01') },
          { id: 'gp-2', currentValue: 78, recordedDate: new Date('2024-05-01') },
        ],
      };

      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue(mockGoal);

      const req = createMockRequest(`/api/analytics/goals/${goalId}`);
      const res = await GET(req, routeParams);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(goalId);
      expect(body.data.goalProgress).toHaveLength(2);

      expect(mockPrisma.userGoal.findFirst).toHaveBeenCalledWith({
        where: { id: goalId, userId: clientUser.id },
        include: {
          goalProgress: {
            orderBy: { recordedDate: 'desc' },
          },
        },
      });
    });

    it('returns 404 when goal not found', async () => {
      mockAuth(clientUser);
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue(null);

      const req = createMockRequest(`/api/analytics/goals/${goalId}`);
      const res = await GET(req, routeParams);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Goal not found');
    });

    it('returns 404 when goal belongs to different user', async () => {
      mockAuth(clientUser);
      // findFirst with userId filter returns null for other user's goal
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue(null);

      const req = createMockRequest(`/api/analytics/goals/${goalId}`);
      const res = await GET(req, routeParams);
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(404);
    });

    it('returns 500 on database error', async () => {
      mockAuth(clientUser);
      (mockPrisma.userGoal.findFirst as jest.Mock).mockRejectedValue(new Error('DB error'));

      const req = createMockRequest(`/api/analytics/goals/${goalId}`);
      const res = await GET(req, routeParams);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(500);
      expect(body.error).toBe('Failed to fetch goal');
    });
  });

  describe('PUT /api/analytics/goals/[id]', () => {
    it('returns 401 when unauthenticated', async () => {
      mockAuthFail();

      const req = createMockRequest(`/api/analytics/goals/${goalId}`, {
        method: 'PUT',
        body: { specificGoal: 'Updated' },
      });
      const res = await PUT(req, routeParams);
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(401);
    });

    it('returns 400 for invalid data', async () => {
      mockAuth(clientUser);

      const req = createMockRequest(`/api/analytics/goals/${goalId}`, {
        method: 'PUT',
        body: { priority: 10 },  // out of range 1-5
      });
      const res = await PUT(req, routeParams);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 404 when goal not found', async () => {
      mockAuth(clientUser);
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue(null);

      const req = createMockRequest(`/api/analytics/goals/${goalId}`, {
        method: 'PUT',
        body: { specificGoal: 'Updated' },
      });
      const res = await PUT(req, routeParams);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(404);
      expect(body.error).toBe('Goal not found');
    });

    it('updates a goal successfully with all fields', async () => {
      mockAuth(clientUser);

      const existingGoal = { id: goalId, userId: clientUser.id };
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue(existingGoal);

      const updatedGoal = {
        id: goalId,
        specificGoal: 'Updated goal',
        targetValue: 65,
        targetDate: new Date('2025-06-30'),
        priority: 2,
        isActive: false,
      };
      (mockPrisma.userGoal.update as jest.Mock).mockResolvedValue(updatedGoal);

      const req = createMockRequest(`/api/analytics/goals/${goalId}`, {
        method: 'PUT',
        body: {
          specificGoal: 'Updated goal',
          targetValue: 65,
          targetDate: '2025-06-30',
          priority: 2,
          isActive: false,
        },
      });
      const res = await PUT(req, routeParams);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.specificGoal).toBe('Updated goal');

      expect(mockPrisma.userGoal.update).toHaveBeenCalledWith({
        where: { id: goalId },
        data: {
          specificGoal: 'Updated goal',
          targetValue: 65,
          targetDate: new Date('2025-06-30'),
          priority: 2,
          isActive: false,
        },
      });
    });

    it('updates a goal with partial fields', async () => {
      mockAuth(clientUser);

      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue({ id: goalId, userId: clientUser.id });
      (mockPrisma.userGoal.update as jest.Mock).mockResolvedValue({ id: goalId, priority: 5 });

      const req = createMockRequest(`/api/analytics/goals/${goalId}`, {
        method: 'PUT',
        body: { priority: 5 },
      });
      const res = await PUT(req, routeParams);
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(200);

      expect(mockPrisma.userGoal.update).toHaveBeenCalledWith({
        where: { id: goalId },
        data: {
          priority: 5,
        },
      });
    });

    it('returns 500 on database error during update', async () => {
      mockAuth(clientUser);
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue({ id: goalId, userId: clientUser.id });
      (mockPrisma.userGoal.update as jest.Mock).mockRejectedValue(new Error('DB error'));

      const req = createMockRequest(`/api/analytics/goals/${goalId}`, {
        method: 'PUT',
        body: { specificGoal: 'Will fail' },
      });
      const res = await PUT(req, routeParams);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(500);
      expect(body.error).toBe('Failed to update goal');
    });
  });

  describe('DELETE /api/analytics/goals/[id]', () => {
    it('returns 401 when unauthenticated', async () => {
      mockAuthFail();

      const req = createMockRequest(`/api/analytics/goals/${goalId}`, { method: 'DELETE' });
      const res = await DELETE(req, routeParams);
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(401);
    });

    it('returns 404 when goal not found', async () => {
      mockAuth(clientUser);
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue(null);

      const req = createMockRequest(`/api/analytics/goals/${goalId}`, { method: 'DELETE' });
      const res = await DELETE(req, routeParams);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(404);
      expect(body.error).toBe('Goal not found');
    });

    it('soft deletes a goal (sets isActive to false)', async () => {
      mockAuth(clientUser);
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue({ id: goalId, userId: clientUser.id });
      (mockPrisma.userGoal.update as jest.Mock).mockResolvedValue({ id: goalId, isActive: false });

      const req = createMockRequest(`/api/analytics/goals/${goalId}`, { method: 'DELETE' });
      const res = await DELETE(req, routeParams);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Goal deactivated');

      expect(mockPrisma.userGoal.update).toHaveBeenCalledWith({
        where: { id: goalId },
        data: { isActive: false },
      });
    });

    it('returns 500 on database error during delete', async () => {
      mockAuth(clientUser);
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue({ id: goalId, userId: clientUser.id });
      (mockPrisma.userGoal.update as jest.Mock).mockRejectedValue(new Error('DB error'));

      const req = createMockRequest(`/api/analytics/goals/${goalId}`, { method: 'DELETE' });
      const res = await DELETE(req, routeParams);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(500);
      expect(body.error).toBe('Failed to delete goal');
    });
  });
});
