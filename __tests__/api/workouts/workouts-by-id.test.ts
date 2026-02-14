/**
 * Tests for app/api/workouts/[id]/route.ts
 * GET /api/workouts/[id] - Get workout session details
 * PUT /api/workouts/[id] - Update workout session
 * DELETE /api/workouts/[id] - Delete workout session
 */

import { NextResponse } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/workouts/[id]/route';
import { prisma } from '@/lib/db/prisma';
import { createMockRequest, mockClientUser, mockTrainerUser } from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const mockedPrisma = prisma as any;
const { authenticate } = require('@/lib/middleware/auth');

function mockAuthAs(user: any) {
  authenticate.mockResolvedValue({ user });
}

function mockAuthFailure() {
  authenticate.mockResolvedValue(
    NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  );
}

const mockWorkoutSession = {
  id: 'session-123',
  clientId: mockClientUser.id,
  trainerId: mockTrainerUser.id,
  workoutId: 'workout-1',
  programAssignmentId: 'assignment-1',
  status: 'in_progress',
  scheduledDate: new Date('2024-01-15'),
  actualStartTime: new Date('2024-01-15T10:00:00Z'),
  actualEndTime: null,
  notes: 'Morning workout',
  exerciseLogs: [
    {
      id: 'log-1',
      orderIndex: 0,
      exercise: { id: 'ex-1', name: 'Bench Press' },
      setLogs: [
        { id: 'set-1', setNumber: 1, weight: 100, reps: 10 },
      ],
      workoutExercise: {
        id: 'we-1',
        configurations: [
          { id: 'cfg-1', setNumber: 1, targetReps: 10, targetWeight: 100 },
        ],
      },
    },
  ],
  workout: {
    id: 'workout-1',
    name: 'Push Day',
    exercises: [
      {
        id: 'we-1',
        exercise: { id: 'ex-1', name: 'Bench Press' },
        configurations: [],
      },
    ],
  },
  programAssignment: {
    id: 'assignment-1',
    program: { id: 'prog-1', name: 'Strength Program' },
  },
};

describe('GET /api/workouts/[id]', () => {
  const sessionId = 'session-123';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest(`/api/workouts/${sessionId}`, { method: 'GET' });
    const response = await GET(request, { params: { id: sessionId } });

    expect(response.status).toBe(401);
  });

  it('returns workout session for client user', async () => {
    mockAuthAs(mockClientUser);
    mockedPrisma.workoutSession.findFirst.mockResolvedValue(mockWorkoutSession);

    const request = createMockRequest(`/api/workouts/${sessionId}`, { method: 'GET' });
    const response = await GET(request, { params: { id: sessionId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(sessionId);
    expect(mockedPrisma.workoutSession.findFirst).toHaveBeenCalledWith({
      where: {
        id: sessionId,
        OR: [{ clientId: mockClientUser.id }],
      },
      include: expect.any(Object),
    });
  });

  it('returns workout session for trainer user', async () => {
    const trainerUser = { ...mockTrainerUser, role: 'trainer' }; // lowercase role
    mockAuthAs(trainerUser);
    mockedPrisma.workoutSession.findFirst.mockResolvedValue(mockWorkoutSession);

    const request = createMockRequest(`/api/workouts/${sessionId}`, { method: 'GET' });
    const response = await GET(request, { params: { id: sessionId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    // Trainer role adds both clientId and trainerId to OR clause
    expect(mockedPrisma.workoutSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: sessionId,
          OR: expect.arrayContaining([
            { clientId: trainerUser.id },
            { trainerId: trainerUser.id },
          ]),
        }),
      })
    );
  });

  it('returns 404 when session not found', async () => {
    mockAuthAs(mockClientUser);
    mockedPrisma.workoutSession.findFirst.mockResolvedValue(null);

    const request = createMockRequest(`/api/workouts/${sessionId}`, { method: 'GET' });
    const response = await GET(request, { params: { id: sessionId } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Workout session not found');
  });

  it('includes all related data in response', async () => {
    mockAuthAs(mockClientUser);
    mockedPrisma.workoutSession.findFirst.mockResolvedValue(mockWorkoutSession);

    const request = createMockRequest(`/api/workouts/${sessionId}`, { method: 'GET' });
    const response = await GET(request, { params: { id: sessionId } });
    const body = await response.json();

    expect(body.data.exerciseLogs).toBeDefined();
    expect(body.data.workout).toBeDefined();
    expect(body.data.programAssignment).toBeDefined();
  });

  it('handles database errors gracefully', async () => {
    mockAuthAs(mockClientUser);
    mockedPrisma.workoutSession.findFirst.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest(`/api/workouts/${sessionId}`, { method: 'GET' });
    const response = await GET(request, { params: { id: sessionId } });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('DB error');
  });
});

describe('PUT /api/workouts/[id]', () => {
  const sessionId = 'session-123';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest(`/api/workouts/${sessionId}`, {
      method: 'PUT',
      body: { notes: 'Updated notes' },
    });
    const response = await PUT(request, { params: { id: sessionId } });

    expect(response.status).toBe(401);
  });

  it('returns 404 when session not found', async () => {
    mockAuthAs(mockClientUser);
    mockedPrisma.workoutSession.findFirst.mockResolvedValue(null);

    const request = createMockRequest(`/api/workouts/${sessionId}`, {
      method: 'PUT',
      body: { notes: 'Updated notes' },
    });
    const response = await PUT(request, { params: { id: sessionId } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Workout session not found');
  });

  it('updates workout session successfully', async () => {
    mockAuthAs(mockClientUser);
    mockedPrisma.workoutSession.findFirst.mockResolvedValue({ id: sessionId, clientId: mockClientUser.id });
    mockedPrisma.workoutSession.update.mockResolvedValue({
      ...mockWorkoutSession,
      notes: 'Updated notes',
    });

    const request = createMockRequest(`/api/workouts/${sessionId}`, {
      method: 'PUT',
      body: { notes: 'Updated notes' },
    });
    const response = await PUT(request, { params: { id: sessionId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Workout session updated successfully');
    expect(body.data.notes).toBe('Updated notes');
  });

  it('parses actualStartTime date field', async () => {
    mockAuthAs(mockClientUser);
    mockedPrisma.workoutSession.findFirst.mockResolvedValue({ id: sessionId, clientId: mockClientUser.id });
    mockedPrisma.workoutSession.update.mockResolvedValue(mockWorkoutSession);

    const request = createMockRequest(`/api/workouts/${sessionId}`, {
      method: 'PUT',
      body: { actualStartTime: '2024-01-15T10:00:00Z' },
    });
    await PUT(request, { params: { id: sessionId } });

    expect(mockedPrisma.workoutSession.update).toHaveBeenCalledWith({
      where: { id: sessionId },
      data: expect.objectContaining({
        actualStartTime: expect.any(Date),
      }),
      include: expect.any(Object),
    });
  });

  it('parses actualEndTime date field', async () => {
    mockAuthAs(mockClientUser);
    mockedPrisma.workoutSession.findFirst.mockResolvedValue({ id: sessionId, clientId: mockClientUser.id });
    mockedPrisma.workoutSession.update.mockResolvedValue(mockWorkoutSession);

    const request = createMockRequest(`/api/workouts/${sessionId}`, {
      method: 'PUT',
      body: { actualEndTime: '2024-01-15T11:00:00Z' },
    });
    await PUT(request, { params: { id: sessionId } });

    expect(mockedPrisma.workoutSession.update).toHaveBeenCalledWith({
      where: { id: sessionId },
      data: expect.objectContaining({
        actualEndTime: expect.any(Date),
      }),
      include: expect.any(Object),
    });
  });

  it('removes protected fields from update data', async () => {
    mockAuthAs(mockClientUser);
    mockedPrisma.workoutSession.findFirst.mockResolvedValue({ id: sessionId, clientId: mockClientUser.id });
    mockedPrisma.workoutSession.update.mockResolvedValue(mockWorkoutSession);

    const request = createMockRequest(`/api/workouts/${sessionId}`, {
      method: 'PUT',
      body: {
        id: 'new-id',
        clientId: 'new-client',
        trainerId: 'new-trainer',
        programAssignmentId: 'new-assignment',
        workoutId: 'new-workout',
        notes: 'Updated notes',
      },
    });
    await PUT(request, { params: { id: sessionId } });

    const updateCall = mockedPrisma.workoutSession.update.mock.calls[0][0];
    expect(updateCall.data.id).toBeUndefined();
    expect(updateCall.data.clientId).toBeUndefined();
    expect(updateCall.data.trainerId).toBeUndefined();
    expect(updateCall.data.programAssignmentId).toBeUndefined();
    expect(updateCall.data.workoutId).toBeUndefined();
    expect(updateCall.data.notes).toBe('Updated notes');
  });

  it('allows trainer to update their client session', async () => {
    const trainerUser = { ...mockTrainerUser, role: 'trainer' }; // lowercase role
    mockAuthAs(trainerUser);
    mockedPrisma.workoutSession.findFirst.mockResolvedValue({
      id: sessionId,
      trainerId: trainerUser.id,
    });
    mockedPrisma.workoutSession.update.mockResolvedValue(mockWorkoutSession);

    const request = createMockRequest(`/api/workouts/${sessionId}`, {
      method: 'PUT',
      body: { notes: 'Trainer notes' },
    });
    const response = await PUT(request, { params: { id: sessionId } });

    expect(response.status).toBe(200);
  });

  it('handles database errors gracefully', async () => {
    mockAuthAs(mockClientUser);
    mockedPrisma.workoutSession.findFirst.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest(`/api/workouts/${sessionId}`, {
      method: 'PUT',
      body: { notes: 'Updated notes' },
    });
    const response = await PUT(request, { params: { id: sessionId } });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('DB error');
  });
});

describe('DELETE /api/workouts/[id]', () => {
  const sessionId = 'session-123';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest(`/api/workouts/${sessionId}`, { method: 'DELETE' });
    const response = await DELETE(request, { params: { id: sessionId } });

    expect(response.status).toBe(401);
  });

  it('returns 404 when session not found', async () => {
    mockAuthAs(mockClientUser);
    mockedPrisma.workoutSession.findFirst.mockResolvedValue(null);

    const request = createMockRequest(`/api/workouts/${sessionId}`, { method: 'DELETE' });
    const response = await DELETE(request, { params: { id: sessionId } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Workout session not found');
  });

  it('deletes workout session successfully', async () => {
    mockAuthAs(mockClientUser);
    mockedPrisma.workoutSession.findFirst.mockResolvedValue({ id: sessionId, clientId: mockClientUser.id });
    mockedPrisma.workoutSession.delete.mockResolvedValue(mockWorkoutSession);

    const request = createMockRequest(`/api/workouts/${sessionId}`, { method: 'DELETE' });
    const response = await DELETE(request, { params: { id: sessionId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Workout session deleted successfully');
    expect(mockedPrisma.workoutSession.delete).toHaveBeenCalledWith({
      where: { id: sessionId },
    });
  });

  it('allows trainer to delete their client session', async () => {
    const trainerUser = { ...mockTrainerUser, role: 'trainer' }; // lowercase role
    mockAuthAs(trainerUser);
    mockedPrisma.workoutSession.findFirst.mockResolvedValue({
      id: sessionId,
      trainerId: trainerUser.id,
    });
    mockedPrisma.workoutSession.delete.mockResolvedValue(mockWorkoutSession);

    const request = createMockRequest(`/api/workouts/${sessionId}`, { method: 'DELETE' });
    const response = await DELETE(request, { params: { id: sessionId } });

    expect(response.status).toBe(200);
  });

  it('verifies user has access before deleting', async () => {
    mockAuthAs(mockClientUser);
    mockedPrisma.workoutSession.findFirst.mockResolvedValue({ id: sessionId, clientId: mockClientUser.id });
    mockedPrisma.workoutSession.delete.mockResolvedValue(mockWorkoutSession);

    const request = createMockRequest(`/api/workouts/${sessionId}`, { method: 'DELETE' });
    await DELETE(request, { params: { id: sessionId } });

    expect(mockedPrisma.workoutSession.findFirst).toHaveBeenCalledWith({
      where: {
        id: sessionId,
        OR: [{ clientId: mockClientUser.id }],
      },
    });
  });

  it('handles database errors gracefully', async () => {
    mockAuthAs(mockClientUser);
    mockedPrisma.workoutSession.findFirst.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest(`/api/workouts/${sessionId}`, { method: 'DELETE' });
    const response = await DELETE(request, { params: { id: sessionId } });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('DB error');
  });
});
