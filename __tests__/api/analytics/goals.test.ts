import { NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/analytics/goals/route';
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

describe('/api/analytics/goals', () => {
  const clientUser = { id: 'client-1', email: 'client@test.com', role: 'client' };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('GET /api/analytics/goals', () => {
    it('returns 401 when unauthenticated', async () => {
      mockAuthFail();

      const req = createMockRequest('/api/analytics/goals');
      const res = await GET(req);
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(401);
    });

    it('returns user goals with latest progress', async () => {
      mockAuth(clientUser);

      const mockGoals = [
        {
          id: 'g-1',
          userId: clientUser.id,
          goalType: 'weight_loss',
          specificGoal: 'Lose 10kg',
          targetValue: 70,
          targetDate: new Date('2024-12-31'),
          isActive: true,
          priority: 1,
          createdAt: new Date('2024-01-01'),
          goalProgress: [
            { id: 'gp-1', currentValue: 75, recordedDate: new Date('2024-06-01') },
          ],
        },
        {
          id: 'g-2',
          userId: clientUser.id,
          goalType: 'strength',
          specificGoal: 'Bench 100kg',
          targetValue: 100,
          isActive: false,
          createdAt: new Date('2024-02-01'),
          goalProgress: [],
        },
      ];

      (mockPrisma.userGoal.findMany as jest.Mock).mockResolvedValue(mockGoals);

      const req = createMockRequest('/api/analytics/goals');
      const res = await GET(req);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].goalProgress).toHaveLength(1);

      expect(mockPrisma.userGoal.findMany).toHaveBeenCalledWith({
        where: { userId: clientUser.id },
        include: {
          goalProgress: {
            orderBy: { recordedDate: 'desc' },
            take: 1,
          },
        },
        orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      });
    });

    it('returns empty array when user has no goals', async () => {
      mockAuth(clientUser);
      (mockPrisma.userGoal.findMany as jest.Mock).mockResolvedValue([]);

      const req = createMockRequest('/api/analytics/goals');
      const res = await GET(req);
      const { body } = await parseJsonResponse(res);

      expect(body.data).toEqual([]);
    });

    it('returns 500 on database error', async () => {
      mockAuth(clientUser);
      (mockPrisma.userGoal.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      const req = createMockRequest('/api/analytics/goals');
      const res = await GET(req);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to fetch goals');
    });
  });

  describe('POST /api/analytics/goals', () => {
    it('returns 401 when unauthenticated', async () => {
      mockAuthFail();

      const req = createMockRequest('/api/analytics/goals', {
        method: 'POST',
        body: { goalType: 'weight_loss' },
      });
      const res = await POST(req);
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(401);
    });

    it('returns 400 for invalid goalType', async () => {
      mockAuth(clientUser);

      const req = createMockRequest('/api/analytics/goals', {
        method: 'POST',
        body: { goalType: 'invalid_type' },
      });
      const res = await POST(req);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.details).toBeDefined();
    });

    it('returns 400 for missing goalType', async () => {
      mockAuth(clientUser);

      const req = createMockRequest('/api/analytics/goals', {
        method: 'POST',
        body: {},
      });
      const res = await POST(req);
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(400);
    });

    it('returns 400 for negative targetValue', async () => {
      mockAuth(clientUser);

      const req = createMockRequest('/api/analytics/goals', {
        method: 'POST',
        body: { goalType: 'weight_loss', targetValue: -10 },
      });
      const res = await POST(req);
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(400);
    });

    it('returns 400 for priority out of range', async () => {
      mockAuth(clientUser);

      const req = createMockRequest('/api/analytics/goals', {
        method: 'POST',
        body: { goalType: 'weight_loss', priority: 10 },
      });
      const res = await POST(req);
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(400);
    });

    it('creates a goal with all fields', async () => {
      mockAuth(clientUser);

      const mockGoal = {
        id: 'g-new',
        userId: clientUser.id,
        goalType: 'weight_loss',
        specificGoal: 'Lose 10kg',
        targetValue: 70,
        targetDate: new Date('2024-12-31'),
        priority: 1,
        isActive: true,
      };

      (mockPrisma.userGoal.create as jest.Mock).mockResolvedValue(mockGoal);

      const req = createMockRequest('/api/analytics/goals', {
        method: 'POST',
        body: {
          goalType: 'weight_loss',
          specificGoal: 'Lose 10kg',
          targetValue: 70,
          targetDate: '2024-12-31',
          priority: 1,
        },
      });
      const res = await POST(req);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('g-new');

      expect(mockPrisma.userGoal.create).toHaveBeenCalledWith({
        data: {
          userId: clientUser.id,
          goalType: 'weight_loss',
          specificGoal: 'Lose 10kg',
          targetValue: 70,
          targetDate: new Date('2024-12-31'),
          priority: 1,
        },
      });
    });

    it('creates a goal with minimal fields (only goalType)', async () => {
      mockAuth(clientUser);

      const mockGoal = { id: 'g-minimal', goalType: 'general_fitness' };
      (mockPrisma.userGoal.create as jest.Mock).mockResolvedValue(mockGoal);

      const req = createMockRequest('/api/analytics/goals', {
        method: 'POST',
        body: { goalType: 'general_fitness' },
      });
      const res = await POST(req);
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(201);

      expect(mockPrisma.userGoal.create).toHaveBeenCalledWith({
        data: {
          userId: clientUser.id,
          goalType: 'general_fitness',
          specificGoal: undefined,
          targetValue: undefined,
          targetDate: undefined,
          priority: undefined,
        },
      });
    });

    it('validates all allowed goalType values', async () => {
      mockAuth(clientUser);

      const validTypes = [
        'weight_loss', 'muscle_gain', 'endurance', 'strength',
        'flexibility', 'general_fitness', 'sport_specific', 'rehabilitation',
      ];

      for (const goalType of validTypes) {
        (mockPrisma.userGoal.create as jest.Mock).mockResolvedValue({ id: `g-${goalType}` });

        const req = createMockRequest('/api/analytics/goals', {
          method: 'POST',
          body: { goalType },
        });
        const res = await POST(req);
        const { status } = await parseJsonResponse(res);
        expect(status).toBe(201);
      }
    });

    it('returns 500 on database error', async () => {
      mockAuth(clientUser);
      (mockPrisma.userGoal.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const req = createMockRequest('/api/analytics/goals', {
        method: 'POST',
        body: { goalType: 'strength' },
      });
      const res = await POST(req);
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to create goal');
    });
  });
});
