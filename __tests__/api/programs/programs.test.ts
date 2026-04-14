/**
 * Tests for GET /api/programs and POST /api/programs
 */

import { NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/programs/route';
import { prisma } from '@/lib/db/prisma';
import {
  createMockRequest,
  mockTrainerUser,
  parseJsonResponse,
} from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    program: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    programSection: {
      create: jest.fn(),
    },
    workoutExercise: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/middleware/authorize', () => ({
  trainerOrAdmin: jest.fn().mockReturnValue(null),
}));

const { authenticate } = require('@/lib/middleware/auth');

const mockAuthUser = { user: { id: mockTrainerUser.id, email: mockTrainerUser.email, role: 'trainer' } };

function setupTransactionMock(returnValue: any) {
  (prisma.$transaction as jest.Mock).mockImplementation(async (fn: Function) => {
    const txPrisma = {
      program: { create: jest.fn().mockResolvedValue(returnValue), findFirst: jest.fn().mockResolvedValue(returnValue) },
      programSection: { create: jest.fn().mockResolvedValue({ id: 'sec-1' }) },
      workoutExercise: { update: jest.fn().mockResolvedValue({}) },
    };
    return fn(txPrisma);
  });
}

describe('GET /api/programs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when authentication fails', async () => {
    const authResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    authenticate.mockResolvedValue(authResponse);

    const request = createMockRequest('/api/programs');
    const response = await GET(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(401);
  });

  it('returns programs for authenticated trainer', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const programs = [
      { id: 'p1', name: 'Program 1', trainerId: mockTrainerUser.id, weeks: [], assignments: [] },
      { id: 'p2', name: 'Program 2', trainerId: mockTrainerUser.id, weeks: [], assignments: [] },
    ];
    (prisma.program.findMany as jest.Mock).mockResolvedValue(programs);

    const request = createMockRequest('/api/programs');
    const response = await GET(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.count).toBe(2);
  });

  it('passes includeTemplates=true filter to query', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.program.findMany as jest.Mock).mockResolvedValue([]);

    const request = createMockRequest('/api/programs', {
      searchParams: { includeTemplates: 'true' },
    });
    const response = await GET(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(prisma.program.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          trainerId: mockTrainerUser.id,
          isTemplate: undefined,
        },
      })
    );
  });

  it('filters out templates by default', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.program.findMany as jest.Mock).mockResolvedValue([]);

    const request = createMockRequest('/api/programs');
    await GET(request);

    expect(prisma.program.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          trainerId: mockTrainerUser.id,
          isTemplate: false,
        },
      })
    );
  });

  it('includes weeks, workouts, exercises, and assignments', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.program.findMany as jest.Mock).mockResolvedValue([]);

    const request = createMockRequest('/api/programs');
    await GET(request);

    expect(prisma.program.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          weeks: expect.any(Object),
          assignments: expect.any(Object),
        }),
      })
    );
  });

  it('orders by createdAt descending', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.program.findMany as jest.Mock).mockResolvedValue([]);

    const request = createMockRequest('/api/programs');
    await GET(request);

    expect(prisma.program.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('handles database errors gracefully', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.program.findMany as jest.Mock).mockRejectedValue(new Error('DB connection failed'));

    const request = createMockRequest('/api/programs');
    const response = await GET(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('DB connection failed');
  });
});

describe('POST /api/programs', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = {
    name: 'Test Program',
    programType: 'strength',
    difficultyLevel: 'beginner',
    durationWeeks: 4,
  };

  it('returns 401 when authentication fails', async () => {
    const authResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    authenticate.mockResolvedValue(authResponse);

    const request = createMockRequest('/api/programs', { method: 'POST', body: validBody });
    const response = await POST(request);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(401);
  });

  it('creates a program with valid data', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const createdProgram = {
      id: 'new-program-id',
      ...validBody,
      trainerId: mockTrainerUser.id,
      weeks: [],
    };
    setupTransactionMock(createdProgram);

    const request = createMockRequest('/api/programs', { method: 'POST', body: validBody });
    const response = await POST(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Program created successfully');
  });

  it('sets trainerId from authenticated user via transaction', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    setupTransactionMock({ id: 'p1', weeks: [] });

    const request = createMockRequest('/api/programs', { method: 'POST', body: validBody });
    await POST(request);

    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('returns 400 for validation error - missing name', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const invalidBody = {
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 4,
    };

    const request = createMockRequest('/api/programs', { method: 'POST', body: invalidBody });
    const response = await POST(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validation failed');
    expect(body.details).toBeDefined();
  });

  it('returns 400 for invalid programType', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const invalidBody = {
      name: 'Test',
      programType: 'invalid_type',
      difficultyLevel: 'beginner',
      durationWeeks: 4,
    };

    const request = createMockRequest('/api/programs', { method: 'POST', body: invalidBody });
    const response = await POST(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid difficultyLevel', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const invalidBody = {
      name: 'Test',
      programType: 'strength',
      difficultyLevel: 'expert',
      durationWeeks: 4,
    };

    const request = createMockRequest('/api/programs', { method: 'POST', body: invalidBody });
    const response = await POST(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(400);
  });

  it('returns 400 for durationWeeks out of range', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const invalidBody = {
      name: 'Test',
      programType: 'strength',
      difficultyLevel: 'beginner',
      durationWeeks: 0,
    };

    const request = createMockRequest('/api/programs', { method: 'POST', body: invalidBody });
    const response = await POST(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(400);
  });

  it('creates program with optional fields', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    setupTransactionMock({ id: 'p1', weeks: [] });

    const bodyWithOptionals = {
      ...validBody,
      description: 'A great program',
      goals: ['strength', 'muscle'],
      equipmentNeeded: ['barbell', 'dumbbell'],
      isTemplate: true,
    };

    const request = createMockRequest('/api/programs', { method: 'POST', body: bodyWithOptionals });
    const response = await POST(request);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(201);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('defaults goals and equipmentNeeded to empty arrays', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    setupTransactionMock({ id: 'p1', weeks: [] });

    const request = createMockRequest('/api/programs', { method: 'POST', body: validBody });
    const response = await POST(request);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(201);
  });

  it('creates program with nested weeks/workouts/exercises', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    setupTransactionMock({ id: 'p1', weeks: [] });

    const bodyWithWeeks = {
      ...validBody,
      weeks: [
        {
          weekNumber: 1,
          name: 'Week 1',
          description: 'Intro week',
          isDeload: false,
          workouts: [
            {
              dayNumber: 1,
              name: 'Day 1',
              workoutType: 'strength',
              isRestDay: false,
              exercises: [
                {
                  exerciseId: '00000000-0000-0000-0000-000000000010',
                  orderIndex: 0,
                  setsConfig: {},
                },
              ],
            },
          ],
        },
      ],
    };

    const request = createMockRequest('/api/programs', { method: 'POST', body: bodyWithWeeks });
    const response = await POST(request);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(201);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('creates program with weeks but no workouts', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    setupTransactionMock({ id: 'p1', weeks: [] });

    const bodyWithWeeksNoWorkouts = {
      ...validBody,
      weeks: [
        {
          weekNumber: 1,
          name: 'Week 1',
          description: 'Intro week',
          isDeload: false,
        },
      ],
    };

    const request = createMockRequest('/api/programs', { method: 'POST', body: bodyWithWeeksNoWorkouts });
    const response = await POST(request);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(201);
  });

  it('creates program with weeks and workouts but no exercises', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    setupTransactionMock({ id: 'p1', weeks: [] });

    const bodyWithWorkoutsNoExercises = {
      ...validBody,
      weeks: [
        {
          weekNumber: 1,
          name: 'Week 1',
          workouts: [
            {
              dayNumber: 1,
              name: 'Day 1',
              workoutType: 'strength',
              isRestDay: false,
            },
          ],
        },
      ],
    };

    const request = createMockRequest('/api/programs', { method: 'POST', body: bodyWithWorkoutsNoExercises });
    const response = await POST(request);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(201);
  });

  it('creates program with exercises including configurations', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    setupTransactionMock({ id: 'p1', weeks: [] });

    const bodyWithConfigurations = {
      ...validBody,
      weeks: [
        {
          weekNumber: 1,
          name: 'Week 1',
          workouts: [
            {
              dayNumber: 1,
              name: 'Day 1',
              exercises: [
                {
                  exerciseId: '00000000-0000-0000-0000-000000000010',
                  orderIndex: 0,
                  setsConfig: {},
                  configurations: [
                    {
                      setNumber: 1,
                      setType: 'working',
                      reps: '8-12',
                      restSeconds: 90,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const request = createMockRequest('/api/programs', { method: 'POST', body: bodyWithConfigurations });
    const response = await POST(request);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(201);
  });

  it('creates ProgramSection rows via transaction for workouts with mixed section types', async () => {
    authenticate.mockResolvedValue(mockAuthUser);

    const workoutId = '00000000-0000-0000-0000-000000000099';
    const dbResult = {
      id: 'p1',
      weeks: [
        {
          weekNumber: 1,
          workouts: [
            {
              id: workoutId,
              dayNumber: 1,
              exercises: [
                { id: 'e1', orderIndex: 0, sectionType: 'regular', supersetGroup: null },
                { id: 'e2', orderIndex: 1, sectionType: 'interval', supersetGroup: null },
              ],
            },
          ],
        },
      ],
    };

    let txPrisma: any;
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: Function) => {
      txPrisma = {
        program: {
          create: jest.fn().mockResolvedValue(dbResult),
          findFirst: jest.fn().mockResolvedValue(dbResult),
        },
        programSection: { create: jest.fn().mockResolvedValue({ id: 'sec-created' }) },
        workoutExercise: { update: jest.fn().mockResolvedValue({}) },
      };
      return fn(txPrisma);
    });

    const body = {
      ...validBody,
      weeks: [
        {
          weekNumber: 1,
          name: 'Week 1',
          workouts: [
            {
              dayNumber: 1,
              name: 'Day 1',
              exercises: [
                { exerciseId: '00000000-0000-0000-0000-000000000010', orderIndex: 0, setsConfig: {} },
                { exerciseId: '00000000-0000-0000-0000-000000000011', orderIndex: 1, setsConfig: {} },
              ],
            },
          ],
        },
      ],
    };

    const request = createMockRequest('/api/programs', { method: 'POST', body });
    const response = await POST(request);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(201);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('handles database errors gracefully', async () => {
    authenticate.mockResolvedValue(mockAuthUser);
    (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Unique constraint violation'));

    const request = createMockRequest('/api/programs', { method: 'POST', body: validBody });
    const response = await POST(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unique constraint violation');
  });
});
