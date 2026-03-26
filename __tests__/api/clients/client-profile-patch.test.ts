/**
 * Client Profile PATCH API Tests
 * PATCH /api/clients/[clientId]/profile
 */

import { PATCH } from '@/app/api/clients/[clientId]/profile/route';
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware/auth';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth');

const mockPrisma = require('@/lib/db/prisma').default;
const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

const mockTrainer = { id: 'trainer-123', email: 'trainer@example.com', role: 'trainer' };

function createMockRequest(body: unknown): NextRequest {
  return {
    url: 'http://localhost/api/clients/client-abc/profile',
    json: jest.fn().mockResolvedValue(body),
    headers: new Map(),
  } as unknown as NextRequest;
}

const routeParams = { params: { clientId: 'client-abc' } };

describe('PATCH /api/clients/[clientId]/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticate.mockResolvedValue({ user: mockTrainer } as any);
    mockPrisma.trainerClient = {
      findFirst: jest.fn().mockResolvedValue({ id: 'tc-1', trainerId: mockTrainer.id, clientId: 'client-abc' }),
    };
    mockPrisma.clientProfile = {
      upsert: jest.fn().mockResolvedValue({ id: 'cp-1' }),
    };
    mockPrisma.clientNote = {
      create: jest.fn().mockResolvedValue({ id: 'cn-1' }),
    };
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthenticate.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    const req = createMockRequest({});
    const res = await PATCH(req, routeParams);
    expect(res.status).toBe(401);
  });

  it('returns 403 for client role', async () => {
    mockAuthenticate.mockResolvedValue({ user: { id: 'u1', role: 'client' } } as any);
    const req = createMockRequest({});
    const res = await PATCH(req, routeParams);
    expect(res.status).toBe(403);
  });

  it('returns 404 when client is not in trainer roster', async () => {
    mockPrisma.trainerClient.findFirst.mockResolvedValue(null);
    const req = createMockRequest({ goals: 'Lose weight' });
    const res = await PATCH(req, routeParams);
    expect(res.status).toBe(404);
  });

  it('upserts clientProfile with goals', async () => {
    const req = createMockRequest({ goals: 'Run a marathon' });
    const res = await PATCH(req, routeParams);
    expect(res.status).toBe(200);
    expect(mockPrisma.clientProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'client-abc' },
        update: expect.objectContaining({ goals: { primaryGoal: 'Run a marathon' } }),
      })
    );
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('upserts clientProfile with emergency contact', async () => {
    const req = createMockRequest({ emergencyContactName: 'Jane', emergencyContactPhone: '555-1234' });
    const res = await PATCH(req, routeParams);
    expect(res.status).toBe(200);
    expect(mockPrisma.clientProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ emergencyContact: { name: 'Jane', phone: '555-1234' } }),
      })
    );
  });

  it('creates a clientNote when notes are provided', async () => {
    const req = createMockRequest({ notes: 'Prefers morning sessions' });
    const res = await PATCH(req, routeParams);
    expect(res.status).toBe(200);
    expect(mockPrisma.clientNote.create).toHaveBeenCalledWith({
      data: { trainerId: mockTrainer.id, clientId: 'client-abc', note: 'Prefers morning sessions' },
    });
  });

  it('does not create clientNote when notes is not provided', async () => {
    const req = createMockRequest({ goals: 'Strength training' });
    const res = await PATCH(req, routeParams);
    expect(res.status).toBe(200);
    expect(mockPrisma.clientNote.create).not.toHaveBeenCalled();
  });

  it('returns 500 on database error', async () => {
    mockPrisma.clientProfile.upsert.mockRejectedValue(new Error('DB error'));
    const req = createMockRequest({ goals: 'Lose weight' });
    const res = await PATCH(req, routeParams);
    expect(res.status).toBe(500);
  });

  it('admin can update any client profile without roster check', async () => {
    mockAuthenticate.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } } as any);
    const req = createMockRequest({ goals: 'Build muscle' });
    const res = await PATCH(req, routeParams);
    expect(res.status).toBe(200);
    // Admin skips trainerClient check
    expect(mockPrisma.trainerClient.findFirst).not.toHaveBeenCalled();
  });
});
