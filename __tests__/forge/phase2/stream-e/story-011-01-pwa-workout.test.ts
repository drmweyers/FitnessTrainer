/**
 * Story 011-01: PWA Workout Tracking
 * Epic 011: Mobile & PWA
 *
 * Tests PWA workout tracking workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    workout: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    workoutLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { authenticate } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';

const mockedPrisma = prisma as any;
const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('Story 011-01: PWA Workout Tracking - Start', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client starts workout from PWA', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/workouts/start'), { user: client })
    );

    const mockWorkout = {
      id: 'wo-1',
      clientId: client.id,
      status: 'in_progress',
      startedAt: new Date(),
    };

    mockedPrisma.workout.update.mockResolvedValueOnce(mockWorkout);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'startWorkout', data: { workoutId: 'wo-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client starts workout from home screen', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/workouts/quick-start'), { user: client })
    );

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'quickStartWorkout' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-01: PWA Workout Tracking - Exercise', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client logs exercise set', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/workouts/wo-1/sets'), { user: client })
    );

    const mockLog = {
      id: 'log-1',
      workoutId: 'wo-1',
      exerciseId: 'ex-1',
      setNumber: 1,
      reps: 10,
      weight: 135,
    };

    mockedPrisma.workoutLog.create.mockResolvedValueOnce(mockLog);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'logSet', data: { workoutId: 'wo-1', exerciseId: 'ex-1', set: 1, reps: 10, weight: 135 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client logs multiple sets', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValue(
      Object.assign(makeRequest('/api/workouts/wo-1/sets'), { user: client })
    );

    mockedPrisma.workoutLog.create.mockImplementation((args: any) =>
      Promise.resolve({ id: `log-${args.data.setNumber}`, ...args.data })
    );

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'logSet', data: { set: 1, reps: 10, weight: 135 } },
        { action: 'logSet', data: { set: 2, reps: 10, weight: 135 } },
        { action: 'logSet', data: { set: 3, reps: 8, weight: 135 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client uses rest timer between sets', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'startRestTimer', data: { duration: 90 } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-01: PWA Workout Tracking - Complete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client completes workout', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/workouts/wo-1/complete'), { user: client })
    );

    const mockWorkout = {
      id: 'wo-1',
      status: 'completed',
      completedAt: new Date(),
      duration: 3600,
    };

    mockedPrisma.workout.update.mockResolvedValueOnce(mockWorkout);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'completeWorkout', data: { workoutId: 'wo-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client views workout summary', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/workouts/wo-1/summary'), { user: client })
    );

    mockedPrisma.workoutLog.findMany.mockResolvedValueOnce([
      { exerciseId: 'ex-1', sets: 3, totalVolume: 4050 },
    ]);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'viewWorkoutSummary', data: { workoutId: 'wo-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-01: PWA Workout Tracking - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles workout in offline mode', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'startWorkout', data: { offline: true } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('syncs offline workout data', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'syncOfflineWorkouts' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles workout interruption', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.workout.update.mockResolvedValueOnce({
      id: 'wo-1',
      status: 'paused',
    });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'pauseWorkout', data: { workoutId: 'wo-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
