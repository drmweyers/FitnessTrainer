/**
 * Tests for app/api/analytics/measurements/[id]/route.ts
 * PUT /api/analytics/measurements/[id] - Update a body measurement
 * DELETE /api/analytics/measurements/[id] - Delete a body measurement
 */

import { NextResponse } from 'next/server';
import { PUT, DELETE } from '@/app/api/analytics/measurements/[id]/route';
import { prisma } from '@/lib/db/prisma';
import { createMockRequest, parseJsonResponse } from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const { authenticate } = require('@/lib/middleware/auth');

const validUuid = '11111111-1111-1111-1111-111111111111';
const clientUser = { id: 'client-1', email: 'client@test.com', role: 'client' };

function mockAuth(user: { id: string; email: string; role: string }) {
  authenticate.mockResolvedValue({ user });
}

function mockAuthFail() {
  authenticate.mockResolvedValue(
    NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  );
}

describe('/api/analytics/measurements/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  // ───── PUT Tests ─────

  describe('PUT /api/analytics/measurements/[id]', () => {
    it('returns 401 when unauthenticated', async () => {
      mockAuthFail();

      const req = createMockRequest('/api/analytics/measurements/' + validUuid, {
        method: 'PUT',
        body: { weight: 82 },
      });
      const res = await PUT(req, { params: { id: validUuid } });
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(401);
    });

    it('returns 400 for invalid UUID', async () => {
      mockAuth(clientUser);

      const req = createMockRequest('/api/analytics/measurements/bad-id', {
        method: 'PUT',
        body: { weight: 82 },
      });
      const res = await PUT(req, { params: { id: 'bad-id' } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid measurement ID');
    });

    it('returns 400 for invalid body (negative weight)', async () => {
      mockAuth(clientUser);

      const req = createMockRequest('/api/analytics/measurements/' + validUuid, {
        method: 'PUT',
        body: { weight: -5 },
      });
      const res = await PUT(req, { params: { id: validUuid } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(400);
      expect(body.success).toBe(false);
    });

    it('returns 400 for body fat > 100', async () => {
      mockAuth(clientUser);

      const req = createMockRequest('/api/analytics/measurements/' + validUuid, {
        method: 'PUT',
        body: { bodyFatPercentage: 150 },
      });
      const res = await PUT(req, { params: { id: validUuid } });
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(400);
    });

    it('returns 404 when measurement not found', async () => {
      mockAuth(clientUser);
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const req = createMockRequest('/api/analytics/measurements/' + validUuid, {
        method: 'PUT',
        body: { weight: 82 },
      });
      const res = await PUT(req, { params: { id: validUuid } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(404);
      expect(body.error).toBe('Measurement not found');
    });

    it('returns 400 when no fields to update (empty body)', async () => {
      mockAuth(clientUser);
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([
        { id: validUuid, user_id: clientUser.id },
      ]);

      const req = createMockRequest('/api/analytics/measurements/' + validUuid, {
        method: 'PUT',
        body: {},
      });
      const res = await PUT(req, { params: { id: validUuid } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(400);
      expect(body.error).toBe('No fields to update');
    });

    it('updates measurement successfully with weight', async () => {
      mockAuth(clientUser);
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([
        { id: validUuid, user_id: clientUser.id },
      ]);

      const recordedAt = new Date('2024-06-01');
      (mockPrisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([
        {
          id: validUuid,
          user_id: clientUser.id,
          height: 180,
          weight: 82,
          body_fat_percentage: null,
          muscle_mass: null,
          measurements: null,
          recorded_at: recordedAt,
        },
      ]);

      const req = createMockRequest('/api/analytics/measurements/' + validUuid, {
        method: 'PUT',
        body: { weight: 82 },
      });
      const res = await PUT(req, { params: { id: validUuid } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.weight).toBe(82);
      expect(body.data.id).toBe(validUuid);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });

    it('updates measurement with multiple fields', async () => {
      mockAuth(clientUser);
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([
        { id: validUuid, user_id: clientUser.id },
      ]);

      const recordedAt = new Date('2024-06-15');
      (mockPrisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([
        {
          id: validUuid,
          user_id: clientUser.id,
          height: 182,
          weight: 78,
          body_fat_percentage: 12,
          muscle_mass: 38,
          measurements: { chest: 100 },
          recorded_at: recordedAt,
        },
      ]);

      const req = createMockRequest('/api/analytics/measurements/' + validUuid, {
        method: 'PUT',
        body: {
          weight: 78,
          height: 182,
          bodyFatPercentage: 12,
          muscleMass: 38,
          measurements: { chest: 100 },
        },
      });
      const res = await PUT(req, { params: { id: validUuid } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.weight).toBe(78);
      expect(body.data.height).toBe(182);
      expect(body.data.bodyFatPercentage).toBe(12);
      expect(body.data.muscleMass).toBe(38);
    });

    it('returns 500 when update query returns empty result', async () => {
      mockAuth(clientUser);
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([
        { id: validUuid, user_id: clientUser.id },
      ]);
      (mockPrisma.$queryRawUnsafe as jest.Mock).mockResolvedValue([]);

      const req = createMockRequest('/api/analytics/measurements/' + validUuid, {
        method: 'PUT',
        body: { weight: 82 },
      });
      const res = await PUT(req, { params: { id: validUuid } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(500);
      expect(body.error).toBe('Failed to update measurement');
    });

    it('returns 500 on database error during update', async () => {
      mockAuth(clientUser);
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([
        { id: validUuid, user_id: clientUser.id },
      ]);
      (mockPrisma.$queryRawUnsafe as jest.Mock).mockRejectedValue(new Error('DB error'));

      const req = createMockRequest('/api/analytics/measurements/' + validUuid, {
        method: 'PUT',
        body: { weight: 82 },
      });
      const res = await PUT(req, { params: { id: validUuid } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to update measurement');
    });
  });

  // ───── DELETE Tests ─────

  describe('DELETE /api/analytics/measurements/[id]', () => {
    it('returns 401 when unauthenticated', async () => {
      mockAuthFail();

      const req = createMockRequest('/api/analytics/measurements/' + validUuid, {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: { id: validUuid } });
      const { status } = await parseJsonResponse(res);

      expect(status).toBe(401);
    });

    it('returns 400 for invalid UUID', async () => {
      mockAuth(clientUser);

      const req = createMockRequest('/api/analytics/measurements/not-a-uuid', {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: { id: 'not-a-uuid' } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(400);
      expect(body.error).toBe('Invalid measurement ID');
    });

    it('returns 404 when measurement not found', async () => {
      mockAuth(clientUser);
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const req = createMockRequest('/api/analytics/measurements/' + validUuid, {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: { id: validUuid } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(404);
      expect(body.error).toBe('Measurement not found');
    });

    it('deletes measurement successfully', async () => {
      mockAuth(clientUser);
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([
        { id: validUuid, user_id: clientUser.id },
      ]);
      (mockPrisma.$executeRaw as jest.Mock) = jest.fn().mockResolvedValue(1);

      const req = createMockRequest('/api/analytics/measurements/' + validUuid, {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: { id: validUuid } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Measurement deleted');
    });

    it('returns 500 on database error during delete', async () => {
      mockAuth(clientUser);
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([
        { id: validUuid, user_id: clientUser.id },
      ]);
      (mockPrisma.$executeRaw as jest.Mock) = jest.fn().mockRejectedValue(new Error('DB error'));

      const req = createMockRequest('/api/analytics/measurements/' + validUuid, {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: { id: validUuid } });
      const { status, body } = await parseJsonResponse(res);

      expect(status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to delete measurement');
    });
  });
});
