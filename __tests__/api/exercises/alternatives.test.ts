/**
 * Tests for GET /api/exercises/alternatives
 * Returns alternative exercises for a given exercise
 */

import { NextRequest } from 'next/server';

// Mock Prisma
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    exercise: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock auth middleware — not required for this public-ish endpoint
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

import { GET } from '@/app/api/exercises/alternatives/route';
import { prisma } from '@/lib/db/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/exercises/alternatives');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

const baseExercise = {
  id: 'ex-1',
  exerciseId: 'abc123',
  name: 'Bench Press',
  gifUrl: 'https://example.com/bench.gif',
  bodyPart: 'chest',
  equipment: 'barbell',
  targetMuscle: 'pectorals',
  secondaryMuscles: ['triceps'],
  instructions: ['Lie on bench'],
  difficulty: 'intermediate' as const,
  isActive: true,
  createdAt: new Date(),
  updatedAt: null,
};

const altExercise1 = {
  ...baseExercise,
  id: 'ex-2',
  exerciseId: 'def456',
  name: 'Dumbbell Bench Press',
  equipment: 'dumbbell',
};

const altExercise2 = {
  ...baseExercise,
  id: 'ex-3',
  exerciseId: 'ghi789',
  name: 'Cable Fly',
  equipment: 'cable',
};

describe('GET /api/exercises/alternatives', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when exerciseId is missing', async () => {
    const req = makeRequest();
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('returns 404 when exercise is not found', async () => {
    (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(null);

    const req = makeRequest({ exerciseId: 'nonexistent' });
    const res = await GET(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Exercise not found');
  });

  it('returns alternative exercises with same targetMuscle and bodyPart', async () => {
    (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(baseExercise);
    (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([altExercise1, altExercise2]);

    const req = makeRequest({ exerciseId: 'abc123' });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.alternatives).toHaveLength(2);
    expect(body.alternatives[0].exerciseId).toBe('def456');
    expect(body.alternatives[1].exerciseId).toBe('ghi789');
    expect(body.sourceExercise.exerciseId).toBe('abc123');
  });

  it('excludes the source exercise from alternatives', async () => {
    (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(baseExercise);
    // Simulate DB query that already excludes source
    (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([altExercise1]);

    const req = makeRequest({ exerciseId: 'abc123' });
    const res = await GET(req);
    const body = await res.json();

    // Verify the findMany was called with NOT condition excluding source
    expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          NOT: expect.objectContaining({ exerciseId: 'abc123' }),
        }),
      })
    );
    expect(body.alternatives.every((a: any) => a.exerciseId !== 'abc123')).toBe(true);
  });

  it('sorts same-equipment alternatives first', async () => {
    const sameEquipment = { ...altExercise1, equipment: 'barbell', name: 'Incline Bench Press' };
    const differentEquipment = { ...altExercise2, equipment: 'cable', name: 'Cable Fly' };

    (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(baseExercise);
    // DB returns different equipment first — API should sort same equipment to top
    (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([differentEquipment, sameEquipment]);

    const req = makeRequest({ exerciseId: 'abc123' });
    const res = await GET(req);
    const body = await res.json();

    expect(body.alternatives[0].equipment).toBe('barbell');
    expect(body.alternatives[1].equipment).toBe('cable');
  });

  it('respects the limit query parameter (default 5)', async () => {
    (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(baseExercise);
    (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([altExercise1]);

    const req = makeRequest({ exerciseId: 'abc123', limit: '3' });
    await GET(req);

    expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 }) // we fetch more to allow sorting
    );
  });

  it('returns empty alternatives array when none found', async () => {
    (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(baseExercise);
    (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([]);

    const req = makeRequest({ exerciseId: 'abc123' });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.alternatives).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    (mockPrisma.exercise.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = makeRequest({ exerciseId: 'abc123' });
    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  it('uses default limit of 5 when not specified', async () => {
    (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(baseExercise);
    const manyAlts = Array.from({ length: 8 }, (_, i) => ({
      ...altExercise1,
      id: `ex-${i + 10}`,
      exerciseId: `alt${i}`,
      name: `Alt Exercise ${i}`,
    }));
    (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue(manyAlts);

    const req = makeRequest({ exerciseId: 'abc123' });
    const res = await GET(req);
    const body = await res.json();

    expect(body.alternatives.length).toBeLessThanOrEqual(5);
  });
});
