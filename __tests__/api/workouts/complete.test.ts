/**
 * Tests for POST /api/workouts/[id]/complete
 * This is the most complex workout route - covers all calculation paths.
 */

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/workouts/[id]/complete/route';
import { prisma } from '@/lib/db/prisma';
import {
  createMockRequest,
  mockClientUser,
  parseJsonResponse,
} from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma', () => {
  const mockPrisma = require('@prisma/client').prisma;
  return { prisma: mockPrisma };
});
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));
jest.mock('@/lib/services/activity.service', () => ({
  logWorkoutCompleted: jest.fn(),
}));

const { authenticate } = require('@/lib/middleware/auth');
const { logWorkoutCompleted } = require('@/lib/services/activity.service');

function authAs(user: any) {
  authenticate.mockResolvedValue({ user });
}

function authFail() {
  authenticate.mockResolvedValue(
    NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  );
}

const mockParams = { params: { id: 'sess-1' } };

const mockExistingSession = {
  id: 'sess-1',
  clientId: mockClientUser.id,
  workoutId: 'workout-1',
  actualStartTime: new Date('2024-06-01T10:00:00Z'),
  totalSets: 6,
};

const mockExerciseLogs = [
  {
    id: 'elog-1',
    exerciseId: 'ex-1',
    skipped: false,
    setLogs: [
      { id: 'sl-1', setNumber: 1, completed: true, weight: 80, actualReps: 10, rpe: 7 },
      { id: 'sl-2', setNumber: 2, completed: true, weight: 85, actualReps: 8, rpe: 8 },
      { id: 'sl-3', setNumber: 3, completed: true, weight: 90, actualReps: 6, rpe: 9 },
    ],
    exercise: { id: 'ex-1', name: 'Bench Press' },
  },
  {
    id: 'elog-2',
    exerciseId: 'ex-2',
    skipped: false,
    setLogs: [
      { id: 'sl-4', setNumber: 1, completed: true, weight: 60, actualReps: 12, rpe: 6 },
      { id: 'sl-5', setNumber: 2, completed: true, weight: 60, actualReps: 10, rpe: 7 },
      { id: 'sl-6', setNumber: 3, completed: false, weight: null, actualReps: null, rpe: null },
    ],
    exercise: { id: 'ex-2', name: 'Rows' },
  },
];

const mockUpdatedSession = {
  id: 'sess-1',
  status: 'completed',
  exerciseLogs: mockExerciseLogs,
};

function setupSuccessMocks() {
  authAs({ ...mockClientUser, role: 'client' });
  (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(mockExistingSession);
  (prisma.workoutSetLog.count as jest.Mock).mockResolvedValue(5);
  (prisma.workoutSetLog.aggregate as jest.Mock)
    .mockResolvedValueOnce({ _sum: { weight: 375 } }) // total volume
    .mockResolvedValueOnce({ _avg: { rpe: 7.4 } }); // average RPE
  (prisma.workoutSession.update as jest.Mock).mockResolvedValue(mockUpdatedSession);
  (prisma.programWorkout.findUnique as jest.Mock).mockResolvedValue({ name: 'Push Day' });
  (prisma.performanceMetric.createMany as jest.Mock).mockResolvedValue({ count: 3 });
  logWorkoutCompleted.mockResolvedValue(null);
}

describe('POST /api/workouts/[id]/complete', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    authFail();
    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    const res = await POST(req, mockParams);
    const { status } = await parseJsonResponse(res);
    expect(status).toBe(401);
  });

  it('returns 400 for invalid body (zod validation)', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: { effortRating: 20 }, // max is 10
    });
    const res = await POST(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(400);
    expect(body.error).toBe('Validation failed');
    expect(body.details).toBeDefined();
  });

  it('returns 404 when session not found', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    const res = await POST(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(404);
    expect(body.error).toBe('Workout session not found');
  });

  it('verifies session belongs to authenticated client', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    expect(prisma.workoutSession.findFirst).toHaveBeenCalledWith({
      where: { id: 'sess-1', clientId: mockClientUser.id },
    });
  });

  it('completes workout with all metrics calculated', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {
        notes: 'Great workout!',
        effortRating: 8,
        enjoymentRating: 9,
        energyAfter: 7,
      },
    });
    const res = await POST(req, mockParams);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Workout completed successfully');
  });

  it('counts completed sets', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    expect(prisma.workoutSetLog.count).toHaveBeenCalledWith({
      where: {
        exerciseLog: { workoutSessionId: 'sess-1' },
        completed: true,
      },
    });
  });

  it('calculates total volume', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    expect(prisma.workoutSetLog.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          exerciseLog: { workoutSessionId: 'sess-1' },
          completed: true,
          weight: { not: null },
          actualReps: { not: null },
        }),
        _sum: { weight: true },
      })
    );
  });

  it('calculates average RPE', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    expect(prisma.workoutSetLog.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          completed: true,
          rpe: { not: null },
        }),
        _avg: { rpe: true },
      })
    );
  });

  it('calculates duration from start time', async () => {
    setupSuccessMocks();

    const endTime = '2024-06-01T11:30:00.000Z';
    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: { endTime },
    });
    await POST(req, mockParams);

    // Duration should be 90 minutes (10:00 to 11:30)
    expect(prisma.workoutSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalDuration: 90,
        }),
      })
    );
  });

  it('calculates adherence score', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    // 5 completed / 6 total = 83.33...%
    expect(prisma.workoutSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adherenceScore: expect.closeTo(83.33, 0),
        }),
      })
    );
  });

  it('handles zero totalSets (adherence = 0)', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({
      ...mockExistingSession,
      totalSets: 0,
    });
    (prisma.workoutSetLog.count as jest.Mock).mockResolvedValue(0);
    (prisma.workoutSetLog.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { weight: null } })
      .mockResolvedValueOnce({ _avg: { rpe: null } });
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue({
      ...mockUpdatedSession,
      exerciseLogs: [],
    });
    (prisma.programWorkout.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    expect(prisma.workoutSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adherenceScore: 0,
        }),
      })
    );
  });

  it('updates session with completion data', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {
        notes: 'Great workout!',
        effortRating: 8,
        enjoymentRating: 9,
        energyAfter: 7,
      },
    });
    await POST(req, mockParams);

    expect(prisma.workoutSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sess-1' },
        data: expect.objectContaining({
          status: 'completed',
          completedSets: 5,
          totalVolume: 375,
          averageRpe: 7.4,
          effortRating: 8,
          enjoymentRating: 9,
          energyAfter: 7,
          clientNotes: 'Great workout!',
        }),
      })
    );
  });

  it('uses current time when endTime not provided', async () => {
    setupSuccessMocks();

    const beforeTest = new Date();
    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    const updateCall = (prisma.workoutSession.update as jest.Mock).mock.calls[0][0];
    const actualEndTime = updateCall.data.actualEndTime;
    expect(actualEndTime).toBeInstanceOf(Date);
    expect(actualEndTime.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
  });

  it('handles null volume and RPE results', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(mockExistingSession);
    (prisma.workoutSetLog.count as jest.Mock).mockResolvedValue(0);
    (prisma.workoutSetLog.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { weight: null } })
      .mockResolvedValueOnce({ _avg: { rpe: null } });
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue({
      ...mockUpdatedSession,
      exerciseLogs: [],
    });
    (prisma.programWorkout.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    const updateCall = (prisma.workoutSession.update as jest.Mock).mock.calls[0][0];
    // null || undefined => undefined
    expect(updateCall.data.totalVolume).toBeUndefined();
    expect(updateCall.data.averageRpe).toBeUndefined();
  });

  it('handles no actualStartTime (duration = undefined)', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue({
      ...mockExistingSession,
      actualStartTime: null,
    });
    (prisma.workoutSetLog.count as jest.Mock).mockResolvedValue(3);
    (prisma.workoutSetLog.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { weight: 100 } })
      .mockResolvedValueOnce({ _avg: { rpe: 7 } });
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue({
      ...mockUpdatedSession,
      exerciseLogs: [],
    });
    (prisma.programWorkout.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    const updateCall = (prisma.workoutSession.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.totalDuration).toBeUndefined();
  });

  it('logs workout completion activity (fire-and-forget)', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    expect(prisma.programWorkout.findUnique).toHaveBeenCalledWith({
      where: { id: 'workout-1' },
      select: { name: true },
    });
    expect(logWorkoutCompleted).toHaveBeenCalledWith(
      mockClientUser.id,
      'sess-1',
      'Push Day'
    );
  });

  it('uses fallback workout name when workout not found', async () => {
    setupSuccessMocks();
    (prisma.programWorkout.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    expect(logWorkoutCompleted).toHaveBeenCalledWith(
      mockClientUser.id,
      'sess-1',
      'Workout'
    );
  });

  it('does not break response when activity logging fails', async () => {
    setupSuccessMocks();
    (prisma.programWorkout.findUnique as jest.Mock).mockRejectedValue(new Error('Activity fail'));

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    const res = await POST(req, mockParams);
    const { status, body } = await parseJsonResponse(res);

    // Response should still be successful
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('records performance metrics for completed exercise logs', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    // Should create metrics for exercise 1 (3 completed sets)
    // and exercise 2 (2 completed sets, 1 not completed)
    expect(prisma.performanceMetric.createMany).toHaveBeenCalled();
    const calls = (prisma.performanceMetric.createMany as jest.Mock).mock.calls;
    // Two exercises with completed sets
    expect(calls.length).toBe(2);
  });

  it('skips performance metrics for skipped exercises', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(mockExistingSession);
    (prisma.workoutSetLog.count as jest.Mock).mockResolvedValue(0);
    (prisma.workoutSetLog.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { weight: null } })
      .mockResolvedValueOnce({ _avg: { rpe: null } });

    const sessionWithSkipped = {
      ...mockUpdatedSession,
      exerciseLogs: [
        { id: 'elog-1', exerciseId: 'ex-1', skipped: true, setLogs: [] },
      ],
    };
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue(sessionWithSkipped);
    (prisma.programWorkout.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    expect(prisma.performanceMetric.createMany).not.toHaveBeenCalled();
  });

  it('skips performance metrics for exercises with no completed sets', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(mockExistingSession);
    (prisma.workoutSetLog.count as jest.Mock).mockResolvedValue(0);
    (prisma.workoutSetLog.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { weight: null } })
      .mockResolvedValueOnce({ _avg: { rpe: null } });

    const sessionWithNoCompleted = {
      ...mockUpdatedSession,
      exerciseLogs: [
        {
          id: 'elog-1',
          exerciseId: 'ex-1',
          skipped: false,
          setLogs: [
            { id: 'sl-1', completed: false, weight: null, actualReps: null },
          ],
        },
      ],
    };
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue(sessionWithNoCompleted);
    (prisma.programWorkout.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    expect(prisma.performanceMetric.createMany).not.toHaveBeenCalled();
  });

  it('skips performance metrics for exercises without exerciseId', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(mockExistingSession);
    (prisma.workoutSetLog.count as jest.Mock).mockResolvedValue(1);
    (prisma.workoutSetLog.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { weight: 100 } })
      .mockResolvedValueOnce({ _avg: { rpe: 7 } });

    const sessionNoExId = {
      ...mockUpdatedSession,
      exerciseLogs: [
        {
          id: 'elog-1',
          exerciseId: null,
          skipped: false,
          setLogs: [{ completed: true, weight: 50, actualReps: 10 }],
        },
      ],
    };
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue(sessionNoExId);
    (prisma.programWorkout.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    expect(prisma.performanceMetric.createMany).not.toHaveBeenCalled();
  });

  it('creates one_rm metric when maxWeight > 0', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(mockExistingSession);
    (prisma.workoutSetLog.count as jest.Mock).mockResolvedValue(2);
    (prisma.workoutSetLog.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { weight: 200 } })
      .mockResolvedValueOnce({ _avg: { rpe: 8 } });

    const sessionOneEx = {
      ...mockUpdatedSession,
      exerciseLogs: [
        {
          id: 'elog-1',
          exerciseId: 'ex-1',
          skipped: false,
          setLogs: [
            { completed: true, weight: 100, actualReps: 5 },
            { completed: true, weight: 80, actualReps: 8 },
          ],
        },
      ],
    };
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue(sessionOneEx);
    (prisma.programWorkout.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.performanceMetric.createMany as jest.Mock).mockResolvedValue({ count: 3 });

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    const createCall = (prisma.performanceMetric.createMany as jest.Mock).mock.calls[0][0];
    const metrics = createCall.data;
    const oneRm = metrics.find((m: any) => m.metricType === 'one_rm');
    expect(oneRm).toBeDefined();
    expect(oneRm.value).toBe(100);
    expect(oneRm.exerciseId).toBe('ex-1');
    expect(oneRm.unit).toBe('kg');
  });

  it('creates volume and endurance metrics', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(mockExistingSession);
    (prisma.workoutSetLog.count as jest.Mock).mockResolvedValue(2);
    (prisma.workoutSetLog.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { weight: 200 } })
      .mockResolvedValueOnce({ _avg: { rpe: 8 } });

    const sessionOneEx = {
      ...mockUpdatedSession,
      exerciseLogs: [
        {
          id: 'elog-1',
          exerciseId: 'ex-1',
          skipped: false,
          setLogs: [
            { completed: true, weight: 100, actualReps: 5 },
            { completed: true, weight: 80, actualReps: 8 },
          ],
        },
      ],
    };
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue(sessionOneEx);
    (prisma.programWorkout.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.performanceMetric.createMany as jest.Mock).mockResolvedValue({ count: 3 });

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    const createCall = (prisma.performanceMetric.createMany as jest.Mock).mock.calls[0][0];
    const metrics = createCall.data;

    const volume = metrics.find((m: any) => m.metricType === 'volume');
    expect(volume).toBeDefined();
    // volume = 100*5 + 80*8 = 500 + 640 = 1140
    expect(volume.value).toBe(1140);

    const endurance = metrics.find((m: any) => m.metricType === 'endurance');
    expect(endurance).toBeDefined();
    // total reps = 5 + 8 = 13
    expect(endurance.value).toBe(13);
    expect(endurance.unit).toBe('reps');
  });

  it('does not break when metrics recording fails', async () => {
    setupSuccessMocks();
    (prisma.performanceMetric.createMany as jest.Mock).mockRejectedValue(
      new Error('Metrics error')
    );

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    const res = await POST(req, mockParams);
    const { status, body } = await parseJsonResponse(res);

    // Should still succeed
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('handles bodyweight exercises (weight=null)', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockResolvedValue(mockExistingSession);
    (prisma.workoutSetLog.count as jest.Mock).mockResolvedValue(2);
    (prisma.workoutSetLog.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { weight: null } })
      .mockResolvedValueOnce({ _avg: { rpe: null } });

    const sessionBodyweight = {
      ...mockUpdatedSession,
      exerciseLogs: [
        {
          id: 'elog-1',
          exerciseId: 'ex-1',
          skipped: false,
          setLogs: [
            { completed: true, weight: null, actualReps: 15 },
            { completed: true, weight: null, actualReps: 12 },
          ],
        },
      ],
    };
    (prisma.workoutSession.update as jest.Mock).mockResolvedValue(sessionBodyweight);
    (prisma.programWorkout.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.performanceMetric.createMany as jest.Mock).mockResolvedValue({ count: 1 });

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    const createCall = (prisma.performanceMetric.createMany as jest.Mock).mock.calls[0][0];
    const metrics = createCall.data;

    // maxWeight filter: weight !== null => empty after filter => Math.max() = -Infinity
    // -Infinity is NOT > 0 and NOT isFinite, so no one_rm
    const oneRm = metrics.find((m: any) => m.metricType === 'one_rm');
    expect(oneRm).toBeUndefined();

    // volume = 0 (no weight), so no volume metric
    const volume = metrics.find((m: any) => m.metricType === 'volume');
    expect(volume).toBeUndefined();

    // endurance = 15 + 12 = 27
    const endurance = metrics.find((m: any) => m.metricType === 'endurance');
    expect(endurance).toBeDefined();
    expect(endurance.value).toBe(27);
  });

  it('does not include optional fields when not provided', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    await POST(req, mockParams);

    const updateCall = (prisma.workoutSession.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.effortRating).toBeUndefined();
    expect(updateCall.data.enjoymentRating).toBeUndefined();
    expect(updateCall.data.energyAfter).toBeUndefined();
    expect(updateCall.data.clientNotes).toBeUndefined();
  });

  it('handles server errors', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.findFirst as jest.Mock).mockRejectedValue(
      new Error('DB connection lost')
    );

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: {},
    });
    const res = await POST(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('DB connection lost');
  });

  it('accepts valid endTime as ISO datetime', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: { endTime: '2024-06-01T11:30:00.000Z' },
    });
    const res = await POST(req, mockParams);
    const { status } = await parseJsonResponse(res);
    expect(status).toBe(200);

    const updateCall = (prisma.workoutSession.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.actualEndTime).toEqual(new Date('2024-06-01T11:30:00.000Z'));
  });

  it('rejects invalid endTime format', async () => {
    authAs({ ...mockClientUser, role: 'client' });

    const req = createMockRequest('/api/workouts/sess-1/complete', {
      method: 'POST',
      body: { endTime: 'not-a-date' },
    });
    const res = await POST(req, mockParams);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });
});
