/**
 * Tests for GET /api/workouts/progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/workouts/progress/route';
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

describe('GET /api/workouts/progress', () => {
  const mockWorkoutStats = {
    _count: { id: 10 },
    _avg: {
      totalDuration: 45,
      totalVolume: 5000,
      averageRpe: 7.5,
      adherenceScore: 85,
    },
    _sum: {
      totalVolume: 50000,
      completedSets: 200,
    },
  };

  // Raw query results match the shape returned by $queryRaw in the route
  const mockWorkoutFrequencyRaw = [
    { scheduled_date: new Date('2024-06-01'), count: BigInt(1) },
    { scheduled_date: new Date('2024-06-02'), count: BigInt(2) },
  ];

  const mockTopExercisesRaw = [
    { exercise_id: 'ex-1', total_volume: 20000, session_count: BigInt(5) },
  ];

  const mockVolumeProgression = [
    { scheduledDate: new Date('2024-06-01'), totalVolume: 4000 },
    { scheduledDate: new Date('2024-06-02'), totalVolume: 5000 },
  ];

  const mockExerciseDetails = [
    { id: 'ex-1', name: 'Bench Press', bodyPart: 'chest' },
  ];

  function setupSuccessMocks() {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.aggregate as jest.Mock).mockResolvedValue(mockWorkoutStats);
    // $queryRaw is called twice: first for frequency, then for top exercises
    (prisma.$queryRaw as jest.Mock)
      .mockResolvedValueOnce(mockWorkoutFrequencyRaw)
      .mockResolvedValueOnce(mockTopExercisesRaw);
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue(mockVolumeProgression);
    (prisma.exercise.findMany as jest.Mock).mockResolvedValue(mockExerciseDetails);
  }

  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    authFail();
    const req = createMockRequest('/api/workouts/progress');
    const res = await GET(req);
    const { status } = await parseJsonResponse(res);
    expect(status).toBe(401);
  });

  it('returns progress data with defaults', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/progress');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.period).toBe('month');
    expect(body.data.totalWorkouts).toBe(10);
    expect(body.data.averageDuration).toBe(45);
    expect(body.data.totalVolume).toBe(50000);
    expect(body.data.averageRpe).toBe(7.5);
    expect(body.data.averageAdherence).toBe(85);
    expect(body.data.totalSetsCompleted).toBe(200);
  });

  it('returns workout frequency data', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/progress');
    const res = await GET(req);
    const { body } = await parseJsonResponse(res);

    expect(body.data.workoutFrequency).toHaveLength(2);
    expect(body.data.workoutFrequency[0]).toEqual({
      date: '2024-06-01',
      count: 1,
    });
  });

  it('returns volume progression data', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/progress');
    const res = await GET(req);
    const { body } = await parseJsonResponse(res);

    expect(body.data.volumeProgression).toHaveLength(2);
    expect(body.data.volumeProgression[0]).toEqual({
      date: '2024-06-01',
      volume: 4000,
    });
  });

  it('returns top exercises with details', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/progress');
    const res = await GET(req);
    const { body } = await parseJsonResponse(res);

    expect(body.data.topExercises).toHaveLength(1);
    expect(body.data.topExercises[0]).toEqual({
      exerciseId: 'ex-1',
      exerciseName: 'Bench Press',
      bodyPart: 'chest',
      totalVolume: 20000,
      sessionCount: 5,
    });
  });

  it('handles unknown exercises gracefully', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.aggregate as jest.Mock).mockResolvedValue(mockWorkoutStats);
    (prisma.$queryRaw as jest.Mock)
      .mockResolvedValueOnce([])  // frequency
      .mockResolvedValueOnce([    // top exercises
        { exercise_id: 'unknown-ex', total_volume: 1000, session_count: BigInt(1) },
      ]);
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.exercise.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/workouts/progress');
    const res = await GET(req);
    const { body } = await parseJsonResponse(res);

    expect(body.data.topExercises[0].exerciseName).toBe('Unknown');
    expect(body.data.topExercises[0].bodyPart).toBe('Unknown');
  });

  it('skips exercise detail query when no top exercises', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.aggregate as jest.Mock).mockResolvedValue(mockWorkoutStats);
    (prisma.$queryRaw as jest.Mock)
      .mockResolvedValueOnce([])  // frequency
      .mockResolvedValueOnce([]); // top exercises (empty)
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/workouts/progress');
    await GET(req);

    expect(prisma.exercise.findMany).not.toHaveBeenCalled();
  });

  it('applies week period', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/progress', {
      searchParams: { period: 'week' },
    });
    const res = await GET(req);
    const { body } = await parseJsonResponse(res);

    expect(body.data.period).toBe('week');
    expect(body.data.dateRange.start).toBeDefined();
  });

  it('applies quarter period', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/progress', {
      searchParams: { period: 'quarter' },
    });
    const res = await GET(req);
    const { body } = await parseJsonResponse(res);
    expect(body.data.period).toBe('quarter');
  });

  it('applies year period', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/progress', {
      searchParams: { period: 'year' },
    });
    const res = await GET(req);
    const { body } = await parseJsonResponse(res);
    expect(body.data.period).toBe('year');
  });

  it('applies custom date range', async () => {
    setupSuccessMocks();

    const req = createMockRequest('/api/workouts/progress', {
      searchParams: {
        startDate: '2024-01-01',
        endDate: '2024-06-30',
      },
    });
    const res = await GET(req);
    const { body } = await parseJsonResponse(res);

    expect(body.data.dateRange.start).toBeDefined();
    expect(body.data.dateRange.end).toBeDefined();
  });

  it('allows trainer to view client progress', async () => {
    authAs({ ...mockTrainerUser, role: 'trainer' });
    (prisma.workoutSession.aggregate as jest.Mock).mockResolvedValue(mockWorkoutStats);
    (prisma.$queryRaw as jest.Mock)
      .mockResolvedValueOnce([])  // frequency
      .mockResolvedValueOnce([]); // top exercises
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);

    const clientId = '00000000-0000-0000-0000-000000000099';
    const req = createMockRequest('/api/workouts/progress', {
      searchParams: { clientId },
    });
    await GET(req);

    expect(prisma.workoutSession.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          clientId,
        }),
      })
    );
  });

  it('uses own id for trainer without clientId', async () => {
    authAs({ ...mockTrainerUser, role: 'trainer' });
    (prisma.workoutSession.aggregate as jest.Mock).mockResolvedValue(mockWorkoutStats);
    (prisma.$queryRaw as jest.Mock)
      .mockResolvedValueOnce([])  // frequency
      .mockResolvedValueOnce([]); // top exercises
    (prisma.workoutSession.findMany as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest('/api/workouts/progress');
    await GET(req);

    expect(prisma.workoutSession.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          clientId: mockTrainerUser.id,
        }),
      })
    );
  });

  it('handles server errors', async () => {
    authAs({ ...mockClientUser, role: 'client' });
    (prisma.workoutSession.aggregate as jest.Mock).mockRejectedValue(
      new Error('Aggregation failed')
    );

    const req = createMockRequest('/api/workouts/progress');
    const res = await GET(req);
    const { status, body } = await parseJsonResponse(res);
    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Aggregation failed');
  });
});
