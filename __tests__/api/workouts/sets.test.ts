/**
 * Tests for GET/POST /api/workouts/[id]/sets
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/workouts/[id]/sets/route';
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

describe('GET /api/workouts/[id]/sets', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    authFail();
    const req = createMockRequest('/api/workouts/sess-1/sets');
    const res = await GET(req, mockParams);
    const { status } = await parseJsonResponse(res);
    expect(status).toBe(401);
  });

  it('returns 404 when session not found', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/sess-1/sets');
    const res = await GET(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(404);
    expect(body.error).toBe('Workout session not found');
  });

  it('returns exercise logs with sets for client', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess-1' });

    const exerciseLogs = [
      {
        id: 'elog-1',
        exercise: { id: 'ex-1', name: 'Bench Press', bodyPart: 'chest', equipment: 'barbell', gifUrl: null },
        setLogs: [
          { id: 'sl-1', setNumber: 1, actualReps: 10, weight: 80 },
        ],
      },
    ];
    (prisma.workoutExerciseLog.findMany as jest.Mock).mockResolvedValue(exerciseLogs);

    const req = createMockRequest('/api/workouts/sess-1/sets');
    const res = await GET(req, mockParams);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(exerciseLogs);
  });

  it('checks OR access for trainer', async () => {
    authAs({ ...mockTrainerUser, role: 'trainer' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess-1' });
    (prisma.workoutExerciseLog.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/workouts/sess-1/sets');
    await GET(req, mockParams);

    expect(prisma.workoutSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { clientId: mockTrainerUser.id },
            { trainerId: mockTrainerUser.id },
          ]),
        }),
      })
    );
  });

  it('handles server errors', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = createMockRequest('/api/workouts/sess-1/sets');
    const res = await GET(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(500);
    expect(body.success).toBe(false);
  });
});

describe('POST /api/workouts/[id]/sets', () => {
  const validBody = {
    exerciseLogId: '00000000-0000-0000-0000-000000000001',
    setNumber: 1,
    actualReps: 10,
    weight: 80,
    rpe: 7,
    completed: true,
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    authFail();
    const req = createMockRequest('/api/workouts/sess-1/sets', {
      method: 'POST',
      body: validBody,
    });
    const res = await POST(req, mockParams);
    const { status } = await parseJsonResponse(res);
    expect(status).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    const req = createMockRequest('/api/workouts/sess-1/sets', {
      method: 'POST',
      body: { exerciseLogId: 'not-a-uuid', setNumber: 'abc' },
    });
    const res = await POST(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 404 when session not found (client access check)', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/sess-1/sets', {
      method: 'POST',
      body: validBody,
    });
    const res = await POST(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(404);
    expect(body.error).toBe('Workout session not found');
  });

  it('returns 404 when exercise log not in session', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess-1' });
    (prisma.workoutExerciseLog.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/sess-1/sets', {
      method: 'POST',
      body: validBody,
    });
    const res = await POST(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(404);
    expect(body.error).toBe('Exercise log not found in this session');
  });

  it('upserts set log and updates session', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess-1' });
    (prisma.workoutExerciseLog.findFirst as jest.Mock).mockResolvedValue({ id: validBody.exerciseLogId });
    const setLog = { id: 'sl-1', ...validBody };
    (prisma.workoutSetLog.upsert as jest.Mock).mockResolvedValue(setLog);
    (prisma.workoutSetLog.findMany as jest.Mock).mockResolvedValue([
      { weight: 80, actualReps: 10 },
    ]);
    (prisma.workoutExerciseLog.update as jest.Mock).mockResolvedValue({});
    (prisma.workoutSetLog.count as jest.Mock).mockResolvedValue(1);
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue({});

    const req = createMockRequest('/api/workouts/sess-1/sets', {
      method: 'POST',
      body: validBody,
    });
    const res = await POST(req, mockParams);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Set logged successfully');
    expect(body.data).toEqual(setLog);
  });

  it('uses compound unique key for upsert', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess-1' });
    (prisma.workoutExerciseLog.findFirst as jest.Mock).mockResolvedValue({ id: validBody.exerciseLogId });
    (prisma.workoutSetLog.upsert as jest.Mock).mockResolvedValue({});
    (prisma.workoutSetLog.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSetLog.count as jest.Mock).mockResolvedValue(0);
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue({});

    const req = createMockRequest('/api/workouts/sess-1/sets', {
      method: 'POST',
      body: validBody,
    });
    await POST(req, mockParams);

    expect(prisma.workoutSetLog.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          exerciseLogId_setNumber: {
            exerciseLogId: validBody.exerciseLogId,
            setNumber: validBody.setNumber,
          },
        },
      })
    );
  });

  it('recalculates exercise volume after logging set', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess-1' });
    (prisma.workoutExerciseLog.findFirst as jest.Mock).mockResolvedValue({ id: validBody.exerciseLogId });
    (prisma.workoutSetLog.upsert as jest.Mock).mockResolvedValue({});
    (prisma.workoutSetLog.findMany as jest.Mock).mockResolvedValue([
      { weight: 80, actualReps: 10 },
      { weight: 85, actualReps: 8 },
    ]);
    (prisma.workoutExerciseLog.update as jest.Mock).mockResolvedValue({});
    (prisma.workoutSetLog.count as jest.Mock).mockResolvedValue(2);
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue({});

    const req = createMockRequest('/api/workouts/sess-1/sets', {
      method: 'POST',
      body: validBody,
    });
    await POST(req, mockParams);

    // Volume = 80*10 + 85*8 = 800 + 680 = 1480
    expect(prisma.workoutExerciseLog.update).toHaveBeenCalledWith({
      where: { id: validBody.exerciseLogId },
      data: { totalVolume: 1480 },
    });
  });

  it('does not update exercise volume when zero', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess-1' });
    (prisma.workoutExerciseLog.findFirst as jest.Mock).mockResolvedValue({ id: validBody.exerciseLogId });
    (prisma.workoutSetLog.upsert as jest.Mock).mockResolvedValue({});
    // No completed sets with weight and reps
    (prisma.workoutSetLog.findMany as jest.Mock).mockResolvedValue([
      { weight: null, actualReps: null },
    ]);
    (prisma.workoutSetLog.count as jest.Mock).mockResolvedValue(0);
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue({});

    const req = createMockRequest('/api/workouts/sess-1/sets', {
      method: 'POST',
      body: { ...validBody, weight: undefined, actualReps: undefined, completed: false },
    });
    await POST(req, mockParams);

    expect(prisma.workoutExerciseLog.update).not.toHaveBeenCalled();
  });

  it('updates session completed sets count', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess-1' });
    (prisma.workoutExerciseLog.findFirst as jest.Mock).mockResolvedValue({ id: validBody.exerciseLogId });
    (prisma.workoutSetLog.upsert as jest.Mock).mockResolvedValue({});
    (prisma.workoutSetLog.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSetLog.count as jest.Mock).mockResolvedValue(5);
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue({});

    const req = createMockRequest('/api/workouts/sess-1/sets', {
      method: 'POST',
      body: validBody,
    });
    await POST(req, mockParams);

    expect(prisma.workoutSession.update).toHaveBeenCalledWith({
      where: { id: 'sess-1' },
      data: { completedSets: 5 },
    });
  });

  it('sets timestamp when marking set as completed', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({ id: 'sess-1' });
    (prisma.workoutExerciseLog.findFirst as jest.Mock).mockResolvedValue({ id: validBody.exerciseLogId });
    (prisma.workoutSetLog.upsert as jest.Mock).mockResolvedValue({});
    (prisma.workoutSetLog.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.workoutSetLog.count as jest.Mock).mockResolvedValue(1);
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue({});

    const req = createMockRequest('/api/workouts/sess-1/sets', {
      method: 'POST',
      body: { ...validBody, completed: true },
    });
    await POST(req, mockParams);

    const upsertCall = (prisma.workoutSetLog.upsert as jest.Mock).mock.calls[0][0];
    expect(upsertCall.update.timestamp).toBeInstanceOf(Date);
    expect(upsertCall.create.timestamp).toBeInstanceOf(Date);
  });

  it('validates RPE range', async () => {
    authAs({ ...mockClientUser, role: 'client' });

    const req = createMockRequest('/api/workouts/sess-1/sets', {
      method: 'POST',
      body: { ...validBody, rpe: 15 },
    });
    const res = await POST(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('validates RIR range', async () => {
    authAs({ ...mockClientUser, role: 'client' });

    const req = createMockRequest('/api/workouts/sess-1/sets', {
      method: 'POST',
      body: { ...validBody, rir: 15 },
    });
    const res = await POST(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(400);
  });

  it('handles server errors', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = createMockRequest('/api/workouts/sess-1/sets', {
      method: 'POST',
      body: validBody,
    });
    const res = await POST(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(500);
    expect(body.success).toBe(false);
  });
});
