/**
 * Tests for POST /api/programs/[id]/duplicate
 */

import { NextResponse } from 'next/server';
import { POST } from '@/app/api/programs/[id]/duplicate/route';
import { prisma } from '@/lib/db/prisma';
import {
  createMockRequest,
  mockTrainerUser,
  parseJsonResponse,
} from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    program: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    programWeek: {
      create: jest.fn(),
    },
    programWorkout: {
      create: jest.fn(),
    },
    workoutExercise: {
      create: jest.fn(),
    },
    exerciseConfiguration: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const { authenticate } = require('@/lib/middleware/auth');

const mockAuthUser = { user: { id: mockTrainerUser.id, email: mockTrainerUser.email, role: 'TRAINER' } };
const programId = '00000000-0000-0000-0000-000000000020';
const params = { params: { id: programId } };

describe('POST /api/programs/[id]/duplicate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when authentication fails', async () => {
    const authResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    authenticate.mockResolvedValue(authResponse);

    const request = createMockRequest(`/api/programs/${programId}/duplicate`, {
      method: 'POST',
      body: {},
    });
    const response = await POST(request, params);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(401);
  });

  it('returns 404 when program not found', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest(`/api/programs/${programId}/duplicate`, {
      method: 'POST',
      body: {},
    });
    const response = await POST(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(404);
    expect(body.error).toBe('Program not found');
  });

  it('duplicates program with default name (Copy) when no name provided', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const original = {
      id: programId,
      trainerId: mockTrainerUser.id,
      name: 'Original Program',
      description: 'A program',
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 4,
      goals: ['strength'],
      equipmentNeeded: ['barbell'],
      weeks: [],
    };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(original);

    const duplicated = { id: 'new-id', name: 'Original Program (Copy)' };
    (prisma.program.create as jest.Mock).mockResolvedValue(duplicated);

    const completeProgram = { ...duplicated, weeks: [] };
    (prisma.program.findUnique as jest.Mock).mockResolvedValue(completeProgram);

    const request = createMockRequest(`/api/programs/${programId}/duplicate`, {
      method: 'POST',
      body: {},
    });
    const response = await POST(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Program duplicated successfully');

    expect(prisma.program.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Original Program (Copy)',
          isTemplate: false,
        }),
      })
    );
  });

  it('duplicates program with custom name', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const original = {
      id: programId,
      trainerId: mockTrainerUser.id,
      name: 'Original',
      description: null,
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 4,
      goals: [],
      equipmentNeeded: [],
      weeks: [],
    };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(original);

    const duplicated = { id: 'new-id', name: 'My Custom Name' };
    (prisma.program.create as jest.Mock).mockResolvedValue(duplicated);
    (prisma.program.findUnique as jest.Mock).mockResolvedValue({ ...duplicated, weeks: [] });

    const request = createMockRequest(`/api/programs/${programId}/duplicate`, {
      method: 'POST',
      body: { name: 'My Custom Name' },
    });
    const response = await POST(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(201);

    expect(prisma.program.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'My Custom Name',
        }),
      })
    );
  });

  it('duplicates weeks, workouts, exercises, and configurations', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const original = {
      id: programId,
      trainerId: mockTrainerUser.id,
      name: 'Full Program',
      description: 'Complete',
      programType: 'hypertrophy',
      difficultyLevel: 'advanced',
      durationWeeks: 8,
      goals: ['muscle'],
      equipmentNeeded: ['dumbbells'],
      weeks: [
        {
          weekNumber: 1,
          name: 'Week 1',
          description: 'First week',
          isDeload: false,
          workouts: [
            {
              dayNumber: 1,
              name: 'Push Day',
              description: 'Chest and triceps',
              workoutType: 'strength',
              estimatedDuration: 60,
              isRestDay: false,
              exercises: [
                {
                  exerciseId: 'ex-1',
                  orderIndex: 0,
                  supersetGroup: null,
                  setsConfig: { count: 3 },
                  notes: 'Go heavy',
                  configurations: [
                    {
                      setNumber: 1,
                      setType: 'working',
                      reps: '8-10',
                      weightGuidance: '70% 1RM',
                      restSeconds: 90,
                      tempo: '3-1-2-0',
                      rpe: 8,
                      rir: 2,
                      notes: 'Controlled',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(original);

    const duplicated = { id: 'dup-id' };
    (prisma.program.create as jest.Mock).mockResolvedValue(duplicated);

    const newWeek = { id: 'week-dup-id' };
    (prisma.programWeek.create as jest.Mock).mockResolvedValue(newWeek);

    const newWorkout = { id: 'workout-dup-id' };
    (prisma.programWorkout.create as jest.Mock).mockResolvedValue(newWorkout);

    const newExercise = { id: 'exercise-dup-id' };
    (prisma.workoutExercise.create as jest.Mock).mockResolvedValue(newExercise);

    (prisma.exerciseConfiguration.create as jest.Mock).mockResolvedValue({ id: 'config-dup-id' });

    (prisma.program.findUnique as jest.Mock).mockResolvedValue({ ...duplicated, weeks: [] });

    const request = createMockRequest(`/api/programs/${programId}/duplicate`, {
      method: 'POST',
      body: {},
    });
    const response = await POST(request, params);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(201);

    // Verify week was created
    expect(prisma.programWeek.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        programId: 'dup-id',
        weekNumber: 1,
        name: 'Week 1',
      }),
    });

    // Verify workout was created
    expect(prisma.programWorkout.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        programWeekId: 'week-dup-id',
        dayNumber: 1,
        name: 'Push Day',
      }),
    });

    // Verify exercise was created
    expect(prisma.workoutExercise.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workoutId: 'workout-dup-id',
        exerciseId: 'ex-1',
        orderIndex: 0,
      }),
    });

    // Verify configuration was created
    expect(prisma.exerciseConfiguration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workoutExerciseId: 'exercise-dup-id',
        setNumber: 1,
        setType: 'working',
        reps: '8-10',
      }),
    });
  });

  it('skips configurations when exercise has none', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const original = {
      id: programId,
      trainerId: mockTrainerUser.id,
      name: 'Minimal',
      description: null,
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 1,
      goals: [],
      equipmentNeeded: [],
      weeks: [
        {
          weekNumber: 1,
          name: 'W1',
          description: null,
          isDeload: false,
          workouts: [
            {
              dayNumber: 1,
              name: 'D1',
              description: null,
              workoutType: null,
              estimatedDuration: null,
              isRestDay: false,
              exercises: [
                {
                  exerciseId: 'ex-1',
                  orderIndex: 0,
                  supersetGroup: null,
                  setsConfig: {},
                  notes: null,
                  configurations: [],
                },
              ],
            },
          ],
        },
      ],
    };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(original);
    (prisma.program.create as jest.Mock).mockResolvedValue({ id: 'dup-id' });
    (prisma.programWeek.create as jest.Mock).mockResolvedValue({ id: 'wk-id' });
    (prisma.programWorkout.create as jest.Mock).mockResolvedValue({ id: 'wo-id' });
    (prisma.workoutExercise.create as jest.Mock).mockResolvedValue({ id: 'we-id' });
    (prisma.program.findUnique as jest.Mock).mockResolvedValue({ id: 'dup-id', weeks: [] });

    const request = createMockRequest(`/api/programs/${programId}/duplicate`, {
      method: 'POST',
      body: {},
    });
    await POST(request, params);

    expect(prisma.exerciseConfiguration.create).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid name in request body', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    // Name with empty string should fail min(1) validation
    const request = createMockRequest(`/api/programs/${programId}/duplicate`, {
      method: 'POST',
      body: { name: '' },
    });
    const response = await POST(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('fetches complete duplicated program after creation', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const original = {
      id: programId,
      trainerId: mockTrainerUser.id,
      name: 'Orig',
      description: null,
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 1,
      goals: [],
      equipmentNeeded: [],
      weeks: [],
    };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(original);

    const duplicated = { id: 'dup-id' };
    (prisma.program.create as jest.Mock).mockResolvedValue(duplicated);

    const completeProgram = { id: 'dup-id', name: 'Orig (Copy)', weeks: [] };
    (prisma.program.findUnique as jest.Mock).mockResolvedValue(completeProgram);

    const request = createMockRequest(`/api/programs/${programId}/duplicate`, {
      method: 'POST',
      body: {},
    });
    await POST(request, params);

    expect(prisma.program.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'dup-id' },
      })
    );
  });

  it('handles null setsConfig in exercises', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const original = {
      id: programId,
      trainerId: mockTrainerUser.id,
      name: 'Test',
      description: null,
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 1,
      goals: [],
      equipmentNeeded: [],
      weeks: [{
        id: 'w1',
        weekNumber: 1,
        name: 'Week 1',
        isDeload: false,
        workouts: [{
          id: 'wo1',
          dayNumber: 1,
          name: 'Day 1',
          workoutType: 'strength',
          isRestDay: false,
          exercises: [{
            id: 'ex1',
            exerciseId: '00000000-0000-0000-0000-000000000010',
            orderIndex: 0,
            supersetGroup: null,
            setsConfig: null,
            notes: null,
            configurations: [],
          }],
        }],
      }],
    };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(original);
    (prisma.program.create as jest.Mock).mockResolvedValue({ id: 'new-p1' });
    (prisma.programWeek.create as jest.Mock).mockResolvedValue({ id: 'new-w1' });
    (prisma.programWorkout.create as jest.Mock).mockResolvedValue({ id: 'new-wo1' });
    (prisma.workoutExercise.create as jest.Mock).mockResolvedValue({ id: 'new-ex1' });

    const request = createMockRequest(`/api/programs/${programId}/duplicate`, {
      method: 'POST',
      body: { newName: 'Duplicate' },
    });
    const response = await POST(request, params);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(201);
    expect(prisma.workoutExercise.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          setsConfig: {},
        }),
      })
    );
  });

  it('handles database errors gracefully', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const original = {
      id: programId,
      trainerId: mockTrainerUser.id,
      name: 'Test',
      description: null,
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 1,
      goals: [],
      equipmentNeeded: [],
      weeks: [],
    };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(original);
    (prisma.program.create as jest.Mock).mockRejectedValue(new Error('DB error'));

    const request = createMockRequest(`/api/programs/${programId}/duplicate`, {
      method: 'POST',
      body: {},
    });
    const response = await POST(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
  });

  it('handles errors without message property', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const original = {
      id: programId,
      trainerId: mockTrainerUser.id,
      name: 'Test',
      description: null,
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 1,
      goals: [],
      equipmentNeeded: [],
      weeks: [],
    };
    (prisma.program.findFirst as jest.Mock).mockResolvedValue(original);
    (prisma.program.create as jest.Mock).mockRejectedValue({ code: 'DUPLICATE_ERROR' });

    const request = createMockRequest(`/api/programs/${programId}/duplicate`, {
      method: 'POST',
      body: {},
    });
    const response = await POST(request, params);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to duplicate program');
  });
});
