/**
 * Tests for GET/PUT/DELETE /api/workouts/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/workouts/[id]/route';
import { prisma } from '@/lib/db/prisma';
import {
  createMockRequest,
  mockClientUser,
  mockTrainerUser,
  parseJsonResponse,
} from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma', () => {
  const mockPrisma = require('@prisma/client').prisma;
  return { prisma: mockPrisma };
});
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const { authenticate } = require('@/lib/middleware/auth');

function authAs(user: any) {
  authenticate.mockResolvedValue({ user });
}

function authFail() {
  authenticate.mockResolvedValue(
    NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  );
}

const mockParams = { params: { id: 'sess-1' } };

describe('GET /api/workouts/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    authFail();
    const req = createMockRequest('/api/workouts/sess-1');
    const res = await GET(req, mockParams);
    const { status } = await parseJsonResponse(res);
    expect(status).toBe(401);
  });

  it('returns 404 when session not found', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/sess-1');
    const res = await GET(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(404);
    expect(body.error).toBe('Workout session not found');
  });

  it('returns session for client', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    const session = { id: 'sess-1', clientId: mockClientUser.id, status: 'in_progress' };
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(session);

    const req = createMockRequest('/api/workouts/sess-1');
    const res = await GET(req, mockParams);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(session);
    expect(prisma.workoutSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'sess-1',
          OR: [{ clientId: mockClientUser.id }],
        }),
      })
    );
  });

  it('returns session for trainer with OR clause', async () => {
    authAs({ ...mockTrainerUser, role: 'trainer' });
    const session = { id: 'sess-1', trainerId: mockTrainerUser.id };
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(session);

    const req = createMockRequest('/api/workouts/sess-1');
    const res = await GET(req, mockParams);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(prisma.workoutSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'sess-1',
          OR: [
            { clientId: mockTrainerUser.id },
            { trainerId: mockTrainerUser.id },
          ],
        }),
      })
    );
  });

  it('handles server errors', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    const req = createMockRequest('/api/workouts/sess-1');
    const res = await GET(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(500);
    expect(body.success).toBe(false);
  });
});

describe('PUT /api/workouts/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    authFail();
    const req = createMockRequest('/api/workouts/sess-1', {
      method: 'PUT',
      body: { status: 'in_progress' },
    });
    const res = await PUT(req, mockParams);
    const { status } = await parseJsonResponse(res);
    expect(status).toBe(401);
  });

  it('returns 404 when session not found', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/sess-1', {
      method: 'PUT',
      body: { status: 'in_progress' },
    });
    const res = await PUT(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(404);
    expect(body.error).toBe('Workout session not found');
  });

  it('updates session with valid data', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess-1' });
    const updatedSession = { id: 'sess-1', status: 'in_progress' };
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue(updatedSession);

    const req = createMockRequest('/api/workouts/sess-1', {
      method: 'PUT',
      body: { status: 'in_progress' },
    });
    const res = await PUT(req, mockParams);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Workout session updated successfully');
    expect(prisma.workoutSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sess-1' },
        data: expect.objectContaining({ status: 'in_progress' }),
      })
    );
  });

  it('parses date fields', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess-1' });
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue({ id: 'sess-1' });

    const req = createMockRequest('/api/workouts/sess-1', {
      method: 'PUT',
      body: {
        actualStartTime: '2024-06-01T10:00:00Z',
        actualEndTime: '2024-06-01T11:00:00Z',
      },
    });
    const res = await PUT(req, mockParams);
    const { status } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(prisma.workoutSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actualStartTime: expect.any(Date),
          actualEndTime: expect.any(Date),
        }),
      })
    );
  });

  it('strips protected fields from update', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess-1' });
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue({ id: 'sess-1' });

    const req = createMockRequest('/api/workouts/sess-1', {
      method: 'PUT',
      body: {
        id: 'hacked-id',
        clientId: 'hacked-client',
        trainerId: 'hacked-trainer',
        programAssignmentId: 'hacked-assignment',
        workoutId: 'hacked-workout',
        status: 'in_progress',
      },
    });
    const res = await PUT(req, mockParams);

    const updateCall = (prisma.workoutSession.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.id).toBeUndefined();
    expect(updateCall.data.clientId).toBeUndefined();
    expect(updateCall.data.trainerId).toBeUndefined();
    expect(updateCall.data.programAssignmentId).toBeUndefined();
    expect(updateCall.data.workoutId).toBeUndefined();
    expect(updateCall.data.status).toBe('in_progress');
  });

  it('handles server errors', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess-1' });
    (prisma.workoutSession.update as jest.Mock).mockRejectedValue(new Error('Update failed'));

    const req = createMockRequest('/api/workouts/sess-1', {
      method: 'PUT',
      body: { status: 'in_progress' },
    });
    const res = await PUT(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(500);
    expect(body.success).toBe(false);
  });
});

describe('DELETE /api/workouts/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    authFail();
    const req = createMockRequest('/api/workouts/sess-1', { method: 'DELETE' });
    const res = await DELETE(req, mockParams);
    const { status } = await parseJsonResponse(res);
    expect(status).toBe(401);
  });

  it('returns 404 when session not found', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/sess-1', { method: 'DELETE' });
    const res = await DELETE(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(404);
    expect(body.error).toBe('Workout session not found');
  });

  it('deletes session', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess-1' });
    (prisma.workoutSession.delete as jest.Mock).mockResolvedValue({});

    const req = createMockRequest('/api/workouts/sess-1', { method: 'DELETE' });
    const res = await DELETE(req, mockParams);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Workout session deleted successfully');
    expect(prisma.workoutSession.delete).toHaveBeenCalledWith({
      where: { id: 'sess-1' },
    });
  });

  it('handles server errors', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess-1' });
    (prisma.workoutSession.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    const req = createMockRequest('/api/workouts/sess-1', { method: 'DELETE' });
    const res = await DELETE(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(500);
    expect(body.success).toBe(false);
  });
});
