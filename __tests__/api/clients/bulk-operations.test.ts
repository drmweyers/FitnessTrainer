/**
 * Bulk Client Operations API Tests
 * POST /api/clients/bulk
 */

import { POST } from '@/app/api/clients/bulk/route';
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware/auth';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth');

const mockPrisma = require('@/lib/db/prisma').default;
const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

const mockTrainer = {
  id: 'trainer-123',
  email: 'trainer@example.com',
  role: 'trainer',
};

function createMockRequest(body: unknown): NextRequest {
  return {
    url: 'http://localhost/api/clients/bulk',
    json: jest.fn().mockResolvedValue(body),
    headers: new Map(),
  } as unknown as NextRequest;
}

describe('POST /api/clients/bulk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticate.mockResolvedValue({
      user: mockTrainer,
    } as any);
    mockPrisma.trainerClient = {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0), // used by getEntitlements + reactivation limit check
    };
    mockPrisma.trainerSubscription = {
      // Return Professional tier (unlimited clients) so limit checks are bypassed in bulk tests
      findFirst: jest.fn().mockResolvedValue({ tierLevel: 2, status: 'active' }),
    };
    mockPrisma.clientTagAssignment = {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    };
    mockPrisma.clientTag = {
      findMany: jest.fn(),
    };
  });

  describe('authentication', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuthenticate.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      const req = createMockRequest({ action: 'update-status', clientIds: ['c1'], value: 'active' });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-trainer role', async () => {
      mockAuthenticate.mockResolvedValue({
        user: { id: 'user-1', role: 'client' },
      } as any);
      const req = createMockRequest({ action: 'update-status', clientIds: ['c1'], value: 'active' });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });
  });

  describe('validation', () => {
    it('should return 400 when clientIds is empty', async () => {
      const req = createMockRequest({ action: 'update-status', clientIds: [], value: 'active' });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeTruthy();
    });

    it('should return 400 when clientIds is missing', async () => {
      const req = createMockRequest({ action: 'update-status', value: 'active' });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid action', async () => {
      const req = createMockRequest({ action: 'invalid-action', clientIds: ['c1'], value: 'active' });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeTruthy();
    });

    it('should return 400 when value is missing for update-status', async () => {
      const req = createMockRequest({ action: 'update-status', clientIds: ['c1'] });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('update-status action', () => {
    it('should update status for all given clientIds', async () => {
      mockPrisma.trainerClient.updateMany.mockResolvedValue({ count: 2 });

      const req = createMockRequest({
        action: 'update-status',
        clientIds: ['client-1', 'client-2'],
        value: 'inactive',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      expect(mockPrisma.trainerClient.updateMany).toHaveBeenCalledWith({
        where: {
          trainerId: mockTrainer.id,
          clientId: { in: ['client-1', 'client-2'] },
        },
        data: { status: 'inactive' },
      });

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.updatedCount).toBe(2);
    });

    it('should accept all valid status values', async () => {
      mockPrisma.trainerClient.updateMany.mockResolvedValue({ count: 1 });

      const validStatuses = ['active', 'inactive', 'onboarding', 'paused', 'archived'];

      for (const status of validStatuses) {
        const req = createMockRequest({ action: 'update-status', clientIds: ['c1'], value: status });
        const res = await POST(req);
        expect(res.status).toBe(200);
      }
    });

    it('should return 500 on database error', async () => {
      mockPrisma.trainerClient.updateMany.mockRejectedValue(new Error('DB error'));

      const req = createMockRequest({
        action: 'update-status',
        clientIds: ['client-1'],
        value: 'active',
      });

      const res = await POST(req);
      expect(res.status).toBe(500);
    });
  });

  describe('assign-tags action', () => {
    it('should assign tags for all given clientIds', async () => {
      mockPrisma.clientTagAssignment.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.clientTagAssignment.createMany.mockResolvedValue({ count: 4 });

      const req = createMockRequest({
        action: 'assign-tags',
        clientIds: ['client-1', 'client-2'],
        value: ['tag-1', 'tag-2'],
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      expect(mockPrisma.clientTagAssignment.deleteMany).toHaveBeenCalledWith({
        where: { clientId: { in: ['client-1', 'client-2'] } },
      });

      expect(mockPrisma.clientTagAssignment.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          { clientId: 'client-1', tagId: 'tag-1' },
          { clientId: 'client-1', tagId: 'tag-2' },
          { clientId: 'client-2', tagId: 'tag-1' },
          { clientId: 'client-2', tagId: 'tag-2' },
        ]),
        skipDuplicates: true,
      });

      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('should accept a single tag string for assign-tags', async () => {
      mockPrisma.clientTagAssignment.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.clientTagAssignment.createMany.mockResolvedValue({ count: 1 });

      const req = createMockRequest({
        action: 'assign-tags',
        clientIds: ['client-1'],
        value: 'tag-1',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('should return 400 when value is missing for assign-tags', async () => {
      const req = createMockRequest({ action: 'assign-tags', clientIds: ['c1'] });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('should return 500 on database error during tag assignment', async () => {
      mockPrisma.clientTagAssignment.deleteMany.mockRejectedValue(new Error('DB error'));

      const req = createMockRequest({
        action: 'assign-tags',
        clientIds: ['client-1'],
        value: ['tag-1'],
      });

      const res = await POST(req);
      expect(res.status).toBe(500);
    });
  });
});
