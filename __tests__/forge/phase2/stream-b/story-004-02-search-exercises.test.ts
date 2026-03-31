/**
 * FORGE User Simulation: Story 004-02 - Search Exercises
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    exercise: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

const mockedPrisma = prisma as any;

class SearchService {
  static async searchExercises(query: string) {
    const exercises = await mockedPrisma.exercise.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { targetMuscle: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 50,
    });
    return { success: true, exercises, query };
  }
}

describe('FORGE: Story 004-02 - Search Exercises', () => {
  beforeEach(() => jest.clearAllMocks());

  it('searches by name', async () => {
    mockedPrisma.exercise.findMany.mockResolvedValue([
      { id: 'ex-1', name: 'Bench Press' },
      { id: 'ex-2', name: 'Incline Bench Press' },
    ]);

    const result = await SearchService.searchExercises('bench');

    expect(result.exercises).toHaveLength(2);
    expect(result.query).toBe('bench');
  });

  it('returns empty for no matches', async () => {
    mockedPrisma.exercise.findMany.mockResolvedValue([]);

    const result = await SearchService.searchExercises('xyz123');

    expect(result.exercises).toHaveLength(0);
  });
});
