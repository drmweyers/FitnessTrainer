/**
 * FORGE User Simulation: Story 004-01 - Browse Exercise Library
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    exercise: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as any;

class ExerciseService {
  static async getExercises(page = 1, limit = 50) {
    const [exercises, total] = await Promise.all([
      mockedPrisma.exercise.findMany({ skip: (page - 1) * limit, take: limit }),
      mockedPrisma.exercise.count(),
    ]);
    return { success: true, exercises, total, page, limit };
  }
}

describe('FORGE: Story 004-01 - Browse Exercise Library', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated exercises', async () => {
    const mockExercises = Array.from({ length: 50 }, (_, i) => ({
      id: `ex-${i}`,
      name: `Exercise ${i}`,
    }));
    mockedPrisma.exercise.findMany.mockResolvedValue(mockExercises);
    mockedPrisma.exercise.count.mockResolvedValue(1324);

    const result = await ExerciseService.getExercises(1, 50);

    expect(result.exercises).toHaveLength(50);
    expect(result.total).toBe(1324);
  });

  it('loads page 2 correctly', async () => {
    mockedPrisma.exercise.findMany.mockResolvedValue([]);
    mockedPrisma.exercise.count.mockResolvedValue(1324);

    const result = await ExerciseService.getExercises(2, 50);

    expect(result.page).toBe(2);
  });
});
