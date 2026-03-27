/**
 * Client Status API Route Tests
 */

import { PATCH } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware/auth';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth');

const mockPrisma = require('@/lib/db/prisma').prisma;
const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

describe('PATCH /api/clients/[id]/status', () => {
  const mockTrainer = {
    id: 'trainer-123',
    email: 'trainer@example.com',
    role: 'trainer',
  };

  const createMockRequest = (body: any) => {
    return {
      json: async () => body,
      headers: new Map(),
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.trainerClient = {
      findFirst: jest.fn(),
      update: jest.fn(),
    };
  });

  it('should update client status to active', async () => {
    const mockTrainerClient = {
      id: 'tc-1',
      trainerId: mockTrainer.id,
      clientId: 'client-1',
      status: 'pending',
    };

    mockAuthenticate.mockResolvedValue({
      user: mockTrainer,
    } as any);
    mockPrisma.trainerClient.findFirst.mockResolvedValue(mockTrainerClient);
    mockPrisma.trainerClient.update.mockResolvedValue({
      ...mockTrainerClient,
      status: 'active',
      client: {
        id: 'client-1',
        email: 'client@example.com',
      },
    });

    const request = createMockRequest({ status: 'active' });
    const response = await PATCH(request, { params: { id: 'client-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('active');
  });

  it('should update client status to archived with timestamp', async () => {
    const mockTrainerClient = {
      id: 'tc-1',
      trainerId: mockTrainer.id,
      clientId: 'client-1',
      status: 'active',
    };

    mockAuthenticate.mockResolvedValue({
      user: mockTrainer,
    } as any);
    mockPrisma.trainerClient.findFirst.mockResolvedValue(mockTrainerClient);
    mockPrisma.trainerClient.update.mockResolvedValue({
      ...mockTrainerClient,
      status: 'archived',
      archivedAt: new Date(),
      client: {
        id: 'client-1',
        email: 'client@example.com',
      },
    });

    const request = createMockRequest({ status: 'archived' });
    const response = await PATCH(request, { params: { id: 'client-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrisma.trainerClient.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'archived',
          archivedAt: expect.any(Date),
        }),
      })
    );
  });

  it('should accept all valid status values', async () => {
    const statuses = ['active', 'pending', 'offline', 'need_programming', 'archived'];

    for (const status of statuses) {
      mockAuthenticate.mockResolvedValue({
        user: mockTrainer,
      } as any);
      mockPrisma.trainerClient.findFirst.mockResolvedValue({
        id: 'tc-1',
        trainerId: mockTrainer.id,
        clientId: 'client-1',
      });
      mockPrisma.trainerClient.update.mockResolvedValue({
        id: 'tc-1',
        status,
        client: { id: 'client-1', email: 'client@example.com' },
      });

      const request = createMockRequest({ status });
      const response = await PATCH(request, { params: { id: 'client-1' } });

      expect(response.status).toBe(200);
    }
  });

  it('should return 400 for invalid status value', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockTrainer,
    } as any);

    const request = createMockRequest({ status: 'invalid_status' });
    const response = await PATCH(request, { params: { id: 'client-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('should return 404 when client relationship not found', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockTrainer,
    } as any);
    mockPrisma.trainerClient.findFirst.mockResolvedValue(null);

    const request = createMockRequest({ status: 'active' });
    const response = await PATCH(request, { params: { id: 'client-999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('not found');
  });

  it('should return 403 for non-trainer non-admin', async () => {
    mockAuthenticate.mockResolvedValue({
      user: { ...mockTrainer, role: 'client' },
    } as any);

    const request = createMockRequest({ status: 'active' });
    const response = await PATCH(request, { params: { id: 'client-1' } });

    expect(response.status).toBe(403);
  });

  it('should return 401 when not authenticated', async () => {
    mockAuthenticate.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const request = createMockRequest({ status: 'active' });
    const response = await PATCH(request, { params: { id: 'client-1' } });

    expect(response.status).toBe(401);
  });

  it('should handle database errors', async () => {
    mockAuthenticate.mockResolvedValue({
      user: mockTrainer,
    } as any);
    mockPrisma.trainerClient.findFirst.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest({ status: 'active' });
    const response = await PATCH(request, { params: { id: 'client-1' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
