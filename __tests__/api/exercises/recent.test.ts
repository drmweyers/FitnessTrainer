/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
  AuthenticatedRequest: {},
}));

jest.mock('@/lib/db/prisma');

import { authenticate } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { GET } from '@/app/api/exercises/recent/route';

const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;
const mockedPrisma = prisma as any;

function makeRequest(url: string): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`);
}

const mockUser = {
  id: 'user-abc-123',
  role: 'trainer',
  email: 'trainer@test.com',
};

const mockExerciseLogs = [
  {
    exerciseId: 'ex-1',
    exercise: {
      id: 'ex-1',
      name: 'Bench Press',
      bodyPart: 'chest',
      equipment: 'barbell',
      targetMuscle: 'pectorals',
      gifUrl: 'https://example.com/bench.gif',
    },
    workoutSession: {
      createdAt: new Date('2026-03-20T10:00:00Z'),
    },
  },
  {
    exerciseId: 'ex-2',
    exercise: {
      id: 'ex-2',
      name: 'Squat',
      bodyPart: 'upper legs',
      equipment: 'barbell',
      targetMuscle: 'quads',
      gifUrl: 'https://example.com/squat.gif',
    },
    workoutSession: {
      createdAt: new Date('2026-03-19T10:00:00Z'),
    },
  },
];

describe('GET /api/exercises/recent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns recently used exercises for the authenticated user', async () => {
    const req = makeRequest('/api/exercises/recent');
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockUser })
    );

    mockedPrisma.workoutExerciseLog.findMany.mockResolvedValueOnce(mockExerciseLogs);

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBe(2);
    expect(data.data[0].id).toBe('ex-1');
    expect(data.data[0].name).toBe('Bench Press');
  });

  it('queries with the correct userId filter', async () => {
    const req = makeRequest('/api/exercises/recent');
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockUser })
    );

    mockedPrisma.workoutExerciseLog.findMany.mockResolvedValueOnce([]);

    await GET(req);

    expect(mockedPrisma.workoutExerciseLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workoutSession: expect.objectContaining({
            clientId: mockUser.id,
          }),
        }),
      })
    );
  });

  it('limits results to 10 by default', async () => {
    const req = makeRequest('/api/exercises/recent');
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockUser })
    );

    mockedPrisma.workoutExerciseLog.findMany.mockResolvedValueOnce([]);

    await GET(req);

    const callArg = mockedPrisma.workoutExerciseLog.findMany.mock.calls[0][0];
    expect(callArg.take).toBe(10);
  });

  it('orders by most recent workout session', async () => {
    const req = makeRequest('/api/exercises/recent');
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockUser })
    );

    mockedPrisma.workoutExerciseLog.findMany.mockResolvedValueOnce([]);

    await GET(req);

    const callArg = mockedPrisma.workoutExerciseLog.findMany.mock.calls[0][0];
    expect(callArg.orderBy).toEqual(
      expect.objectContaining({
        workoutSession: expect.objectContaining({
          createdAt: 'desc',
        }),
      })
    );
  });

  it('deduplicates exercises (same exercise from multiple sessions)', async () => {
    const req = makeRequest('/api/exercises/recent');
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockUser })
    );

    // Same exercise appears twice (from two different sessions)
    const logsWithDuplicate = [
      mockExerciseLogs[0],
      { ...mockExerciseLogs[0], workoutSession: { createdAt: new Date('2026-03-18T10:00:00Z') } },
      mockExerciseLogs[1],
    ];

    mockedPrisma.workoutExerciseLog.findMany.mockResolvedValueOnce(logsWithDuplicate);

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should deduplicate: only 2 unique exercises
    expect(data.data.length).toBe(2);
  });

  it('returns empty array when user has no workout history', async () => {
    const req = makeRequest('/api/exercises/recent');
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockUser })
    );

    mockedPrisma.workoutExerciseLog.findMany.mockResolvedValueOnce([]);

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
  });

  it('returns 401 when not authenticated', async () => {
    const req = makeRequest('/api/exercises/recent');
    mockedAuthenticate.mockResolvedValueOnce(
      NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    );

    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it('returns 500 on database error', async () => {
    const req = makeRequest('/api/exercises/recent');
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(req, { user: mockUser })
    );

    mockedPrisma.workoutExerciseLog.findMany.mockRejectedValueOnce(
      new Error('DB error')
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
