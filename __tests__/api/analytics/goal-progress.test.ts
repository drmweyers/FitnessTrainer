/**
 * Tests for app/api/analytics/goals/[id]/progress/route.ts
 * GET /api/analytics/goals/[id]/progress - Get progress entries for a goal
 * POST /api/analytics/goals/[id]/progress - Log new progress entry
 */

import { NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/analytics/goals/[id]/progress/route';
import { prisma } from '@/lib/db/prisma';
import { createMockRequest, parseJsonResponse } from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const { authenticate } = require('@/lib/middleware/auth');

const goalId = 'goal-1';
const clientUser = { id: 'client-1', email: 'client@test.com', role: 'client' };

function mockAuth(user: { id: string; email: string; role: string }) {
  authenticate.mockResolvedValue({ user });
}

function mockAuthFail() {
  authenticate.mockResolvedValue(
    NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  );
}

describe('/api/analytics/goals/[id]/progress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  // ───── GET Tests ─────

  describe('GET /api/analytics/goals/[id]/progress', () => {
    it('returns 401 when unauthenticated', async () => {
      mockAuthFail();

      const req = createMockRequest(`/api/analytics/goals/${goalId}/progress`);
      const res = await GET(req, { params: { id: goalId } });
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(401);
    });

    it('returns 404 when goal not found', async () => {
      mockAuth(clientUser);
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue(null);

      const req = createMockRequest(`/api/analytics/goals/${goalId}/progress`);
      const res = await GET(req, { params: { id: goalId } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Goal not found');
      expect(mockPrisma.userGoal.findFirst).toHaveBeenCalledWith({
        where: { id: goalId, userId: clientUser.id },
      });
    });

    it('returns progress entries for a goal', async () => {
      mockAuth(clientUser);

      const mockGoal = { id: goalId, userId: clientUser.id, goalType: 'weight_loss' };
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue(mockGoal);

      const mockProgress = [
        {
          id: 'p-1',
          goalId,
          currentValue: 75,
          recordedDate: new Date('2024-06-15'),
          percentageComplete: 50,
          notes: 'Halfway there',
        },
        {
          id: 'p-2',
          goalId,
          currentValue: 78,
          recordedDate: new Date('2024-06-01'),
          percentageComplete: 30,
          notes: null,
        },
      ];
      (mockPrisma.goalProgress.findMany as jest.Mock).mockResolvedValue(mockProgress);

      const req = createMockRequest(`/api/analytics/goals/${goalId}/progress`);
      const res = await GET(req, { params: { id: goalId } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(mockPrisma.goalProgress.findMany).toHaveBeenCalledWith({
        where: { goalId },
        orderBy: { recordedDate: 'desc' },
      });
    });

    it('returns empty array when goal has no progress entries', async () => {
      mockAuth(clientUser);

      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue({
        id: goalId,
        userId: clientUser.id,
      });
      (mockPrisma.goalProgress.findMany as jest.Mock).mockResolvedValue([]);

      const req = createMockRequest(`/api/analytics/goals/${goalId}/progress`);
      const res = await GET(req, { params: { id: goalId } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
    });

    it('returns 500 on database error', async () => {
      mockAuth(clientUser);
      (mockPrisma.userGoal.findFirst as jest.Mock).mockRejectedValue(new Error('DB error'));

      const req = createMockRequest(`/api/analytics/goals/${goalId}/progress`);
      const res = await GET(req, { params: { id: goalId } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to fetch goal progress');
    });
  });

  // ───── POST Tests ─────

  describe('POST /api/analytics/goals/[id]/progress', () => {
    it('returns 401 when unauthenticated', async () => {
      mockAuthFail();

      const req = createMockRequest(`/api/analytics/goals/${goalId}/progress`, {
        method: 'POST',
        body: { currentValue: 75 },
      });
      const res = await POST(req, { params: { id: goalId } });
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(401);
    });

    it('returns 400 for invalid body (missing currentValue)', async () => {
      mockAuth(clientUser);

      const req = createMockRequest(`/api/analytics/goals/${goalId}/progress`, {
        method: 'POST',
        body: { notes: 'No value' },
      });
      const res = await POST(req, { params: { id: goalId } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid request');
      expect(body.details).toBeDefined();
    });

    it('returns 400 for non-numeric currentValue', async () => {
      mockAuth(clientUser);

      const req = createMockRequest(`/api/analytics/goals/${goalId}/progress`, {
        method: 'POST',
        body: { currentValue: 'not-a-number' },
      });
      const res = await POST(req, { params: { id: goalId } });
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(400);
    });

    it('returns 404 when goal not found', async () => {
      mockAuth(clientUser);
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue(null);

      const req = createMockRequest(`/api/analytics/goals/${goalId}/progress`, {
        method: 'POST',
        body: { currentValue: 75 },
      });
      const res = await POST(req, { params: { id: goalId } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(404);
      expect(body.error).toBe('Goal not found');
    });

    it('creates progress entry with auto-calculated percentage', async () => {
      mockAuth(clientUser);

      const mockGoal = {
        id: goalId,
        userId: clientUser.id,
        targetValue: 100,
        achievedAt: null,
      };
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue(mockGoal);

      const mockProgress = {
        id: 'p-new',
        goalId,
        currentValue: 75,
        percentageComplete: 75,
        recordedDate: new Date(),
        notes: 'Good progress',
      };
      (mockPrisma.goalProgress.create as jest.Mock).mockResolvedValue(mockProgress);

      const req = createMockRequest(`/api/analytics/goals/${goalId}/progress`, {
        method: 'POST',
        body: { currentValue: 75, notes: 'Good progress' },
      });
      const res = await POST(req, { params: { id: goalId } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('p-new');

      expect(mockPrisma.goalProgress.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          goalId,
          currentValue: 75,
          percentageComplete: 75,
          notes: 'Good progress',
        }),
      });
    });

    it('marks goal as achieved when progress reaches 100%', async () => {
      mockAuth(clientUser);

      const mockGoal = {
        id: goalId,
        userId: clientUser.id,
        targetValue: 100,
        achievedAt: null,
      };
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue(mockGoal);
      (mockPrisma.goalProgress.create as jest.Mock).mockResolvedValue({
        id: 'p-complete',
        goalId,
        currentValue: 100,
        percentageComplete: 100,
      });
      (mockPrisma.userGoal.update as jest.Mock).mockResolvedValue({
        ...mockGoal,
        achievedAt: new Date(),
      });

      const req = createMockRequest(`/api/analytics/goals/${goalId}/progress`, {
        method: 'POST',
        body: { currentValue: 100 },
      });
      const res = await POST(req, { params: { id: goalId } });
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(201);
      expect(mockPrisma.userGoal.update).toHaveBeenCalledWith({
        where: { id: goalId },
        data: { achievedAt: expect.any(Date) },
      });
    });

    it('does not re-mark goal as achieved if already achieved', async () => {
      mockAuth(clientUser);

      const mockGoal = {
        id: goalId,
        userId: clientUser.id,
        targetValue: 100,
        achievedAt: new Date('2024-05-01'), // already achieved
      };
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue(mockGoal);
      (mockPrisma.goalProgress.create as jest.Mock).mockResolvedValue({
        id: 'p-extra',
        goalId,
        currentValue: 110,
        percentageComplete: 100,
      });

      const req = createMockRequest(`/api/analytics/goals/${goalId}/progress`, {
        method: 'POST',
        body: { currentValue: 110 },
      });
      const res = await POST(req, { params: { id: goalId } });
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(201);
      // Should NOT call update since goal is already achieved
      expect(mockPrisma.userGoal.update).not.toHaveBeenCalled();
    });

    it('caps percentage at 100 when currentValue exceeds targetValue', async () => {
      mockAuth(clientUser);

      const mockGoal = {
        id: goalId,
        userId: clientUser.id,
        targetValue: 50,
        achievedAt: null,
      };
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue(mockGoal);
      (mockPrisma.goalProgress.create as jest.Mock).mockResolvedValue({
        id: 'p-over',
        goalId,
        currentValue: 75,
        percentageComplete: 100,
      });
      (mockPrisma.userGoal.update as jest.Mock).mockResolvedValue({});

      const req = createMockRequest(`/api/analytics/goals/${goalId}/progress`, {
        method: 'POST',
        body: { currentValue: 75 },
      });
      await POST(req, { params: { id: goalId } });

      // Percentage should be capped at 100
      expect(mockPrisma.goalProgress.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          percentageComplete: 100,
        }),
      });
    });

    it('sets percentage to 0 when goal has no targetValue', async () => {
      mockAuth(clientUser);

      const mockGoal = {
        id: goalId,
        userId: clientUser.id,
        targetValue: null,
        achievedAt: null,
      };
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue(mockGoal);
      (mockPrisma.goalProgress.create as jest.Mock).mockResolvedValue({
        id: 'p-no-target',
        goalId,
        currentValue: 75,
        percentageComplete: 0,
      });

      const req = createMockRequest(`/api/analytics/goals/${goalId}/progress`, {
        method: 'POST',
        body: { currentValue: 75 },
      });
      await POST(req, { params: { id: goalId } });

      expect(mockPrisma.goalProgress.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          percentageComplete: 0,
        }),
      });
    });

    it('uses custom recordedDate when provided', async () => {
      mockAuth(clientUser);

      const mockGoal = {
        id: goalId,
        userId: clientUser.id,
        targetValue: 100,
        achievedAt: null,
      };
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue(mockGoal);
      (mockPrisma.goalProgress.create as jest.Mock).mockResolvedValue({
        id: 'p-custom-date',
        goalId,
        currentValue: 50,
        recordedDate: new Date('2024-03-15'),
      });

      const req = createMockRequest(`/api/analytics/goals/${goalId}/progress`, {
        method: 'POST',
        body: { currentValue: 50, recordedDate: '2024-03-15' },
      });
      await POST(req, { params: { id: goalId } });

      expect(mockPrisma.goalProgress.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recordedDate: new Date('2024-03-15'),
        }),
      });
    });

    it('returns 500 on database error', async () => {
      mockAuth(clientUser);
      (mockPrisma.userGoal.findFirst as jest.Mock).mockResolvedValue({
        id: goalId,
        userId: clientUser.id,
        targetValue: 100,
        achievedAt: null,
      });
      (mockPrisma.goalProgress.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const req = createMockRequest(`/api/analytics/goals/${goalId}/progress`, {
        method: 'POST',
        body: { currentValue: 50 },
      });
      const res = await POST(req, { params: { id: goalId } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to log goal progress');
    });
  });
});
