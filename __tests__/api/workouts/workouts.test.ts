/**
 * Tests for GET /api/workouts and POST /api/workouts
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/workouts/route';
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

describe('GET /api/workouts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    authFail();
    const req = createMockRequest('/api/workouts');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('lists workouts for client user', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    const sessions = [
      { id: 'sess-1', status: 'scheduled', clientId: mockClientUser.id },
    ];
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue(sessions);
    (prisma.workoutSession.count as jest.Mock).mockResolvedValue(1);

    const req = createMockRequest('/api/workouts');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(sessions);
    expect(body.meta.total).toBe(1);
    expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ clientId: mockClientUser.id }),
        take: 50,
        skip: 0,
      })
    );
  });

  it('lists workouts for trainer user', async () => {
    authAs({ ...mockTrainerUser, role: 'trainer' });
    const sessions = [
      { id: 'sess-1', trainerId: mockTrainerUser.id },
    ];
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue(sessions);
    (prisma.workoutSession.count as jest.Mock).mockResolvedValue(1);

    const req = createMockRequest('/api/workouts');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ trainerId: mockTrainerUser.id }),
      })
    );
  });

  it('applies status filter', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSession.count as jest.Mock).mockResolvedValue(0);

    const req = createMockRequest('/api/workouts', {
      searchParams: { status: 'completed' },
    });
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'completed' }),
      })
    );
  });

  it('applies date range filters', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSession.count as jest.Mock).mockResolvedValue(0);

    const req = createMockRequest('/api/workouts', {
      searchParams: {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      },
    });
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          scheduledDate: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    );
  });

  it('applies limit and offset', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSession.count as jest.Mock).mockResolvedValue(100);

    const req = createMockRequest('/api/workouts', {
      searchParams: { limit: '10', offset: '20' },
    });
    const res = await GET(req);
    const { body } = await parseJsonResponse(res);

    expect(body.meta.limit).toBe(10);
    expect(body.meta.offset).toBe(20);
    expect(body.meta.hasMore).toBe(true);
    expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, skip: 20 })
    );
  });

  it('includes client info for trainer role', async () => {
    authAs({ ...mockTrainerUser, role: 'trainer' });
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSession.count as jest.Mock).mockResolvedValue(0);

    const req = createMockRequest('/api/workouts');
    const res = await GET(req);

    expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          client: expect.any(Object),
        }),
      })
    );
  });

  it('handles server errors', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findMany as jest.Mock).mockRejectedValue(
      new Error('DB connection failed')
    );

    const req = createMockRequest('/api/workouts');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('DB connection failed');
  });
});

describe('POST /api/workouts', () => {
  const validBody = {
    programAssignmentId: '00000000-0000-0000-0000-000000000001',
    workoutId: '00000000-0000-0000-0000-000000000002',
    scheduledDate: '2024-06-01',
  };

  const mockProgramAssignment = {
    id: validBody.programAssignmentId,
    clientId: mockClientUser.id,
    trainerId: mockTrainerUser.id,
    programId: 'prog-1',
    isActive: true,
    program: { name: 'Test Program' },
  };

  const mockWorkout = {
    id: validBody.workoutId,
    exercises: [
      {
        id: 'we-1',
        exerciseId: 'ex-1',
        orderIndex: 0,
        supersetGroup: null,
        exercise: { id: 'ex-1', name: 'Bench Press' },
        configurations: [
          { setNumber: 1, reps: 10 },
          { setNumber: 2, reps: 10 },
        ],
      },
    ],
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    authFail();
    const req = createMockRequest('/api/workouts', { method: 'POST', body: validBody });
    const res = await POST(req);
    const { status } = await parseJsonResponse(res);
    expect(status).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    const req = createMockRequest('/api/workouts', {
      method: 'POST',
      body: { invalid: true },
    });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 404 when program assignment not found', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.programAssignment.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts', { method: 'POST', body: validBody });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(404);
    expect(body.error).toBe('Program assignment not found');
  });

  it('returns 404 when workout not found in program', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.programAssignment.findFirst as jest.Mock).mockResolvedValue(mockProgramAssignment);
    (prisma.programWorkout.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts', { method: 'POST', body: validBody });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(404);
    expect(body.error).toBe('Workout not found in program');
  });

  it('returns existing session if already exists', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.programAssignment.findFirst as jest.Mock).mockResolvedValue(mockProgramAssignment);
    (prisma.programWorkout.findFirst as jest.Mock).mockResolvedValue(mockWorkout);
    const existingSession = { id: 'existing-sess', status: 'scheduled' };
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(existingSession);

    const req = createMockRequest('/api/workouts', { method: 'POST', body: validBody });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(200);
    expect(body.data).toEqual(existingSession);
    expect(body.message).toBe('Session already exists');
    expect(prisma.workoutSession.create).not.toHaveBeenCalled();
  });

  it('creates workout session for client', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.programAssignment.findFirst as jest.Mock).mockResolvedValue(mockProgramAssignment);
    (prisma.programWorkout.findFirst as jest.Mock).mockResolvedValue(mockWorkout);
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(null);
    const createdSession = { id: 'new-sess', status: 'scheduled' };
    (prisma.workoutSession.create as jest.Mock).mockResolvedValue(createdSession);

    const req = createMockRequest('/api/workouts', { method: 'POST', body: validBody });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Workout session created successfully');
    expect(prisma.workoutSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          programAssignmentId: validBody.programAssignmentId,
          workoutId: validBody.workoutId,
          clientId: mockClientUser.id,
          trainerId: mockProgramAssignment.trainerId,
          status: 'scheduled',
          totalSets: 2,
          completedSets: 0,
        }),
      })
    );
  });

  it('creates workout session for trainer with clientId', async () => {
    const clientId = '00000000-0000-0000-0000-000000000099';
    authAs({ ...mockTrainerUser, role: 'trainer' });
    (prisma.programAssignment.findFirst as jest.Mock).mockResolvedValue({
      ...mockProgramAssignment,
      clientId,
    });
    (prisma.programWorkout.findFirst as jest.Mock).mockResolvedValue(mockWorkout);
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.workoutSession.create as jest.Mock).mockResolvedValue({ id: 'new-sess' });

    const req = createMockRequest('/api/workouts', {
      method: 'POST',
      body: { ...validBody, clientId },
    });
    const res = await POST(req);
    const { status } = await parseJsonResponse(res);
    expect(status).toBe(201);
    expect(prisma.workoutSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId,
          trainerId: mockTrainerUser.id,
        }),
      })
    );
  });

  it('handles server errors', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.programAssignment.findFirst as jest.Mock).mockRejectedValue(
      new Error('DB error')
    );

    const req = createMockRequest('/api/workouts', { method: 'POST', body: validBody });
    const res = await POST(req);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(500);
    expect(body.success).toBe(false);
  });
});
