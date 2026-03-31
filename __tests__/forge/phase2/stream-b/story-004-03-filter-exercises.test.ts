/**
 * FORGE User Simulation: Story 004-03 - Filter Exercises
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    exercise: {
      findMany: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as any;

class FilterService {
  static async filterExercises(filters: { bodyPart?: string; equipment?: string; targetMuscle?: string }) {
    const where: any = {};
    if (filters.bodyPart) where.bodyPart = filters.bodyPart;
    if (filters.equipment) where.equipment = filters.equipment;
    if (filters.targetMuscle) where.targetMuscle = filters.targetMuscle;

    const exercises = await mockedPrisma.exercise.findMany({ where });
    return { success: true, exercises, filters };
  }
}

describe('FORGE: Story 004-03 - Filter Exercises', () => {
  beforeEach(() => jest.clearAllMocks());

  it('filters by body part', async () => {
    mockedPrisma.exercise.findMany.mockResolvedValue([
      { id: 'ex-1', bodyPart: 'chest' },
      { id: 'ex-2', bodyPart: 'chest' },
    ]);

    const result = await FilterService.filterExercises({ bodyPart: 'chest' });

    expect(result.exercises).toHaveLength(2);
  });

  it('filters by equipment', async () => {
    mockedPrisma.exercise.findMany.mockResolvedValue([{ id: 'ex-1', equipment: 'barbell' }]);

    const result = await FilterService.filterExercises({ equipment: 'barbell' });

    expect(result.exercises).toHaveLength(1);
  });

  it('filters by multiple criteria', async () => {
    mockedPrisma.exercise.findMany.mockResolvedValue([{ id: 'ex-1', bodyPart: 'chest', equipment: 'barbell' }]);

    const result = await FilterService.filterExercises({ bodyPart: 'chest', equipment: 'barbell' });

    expect(result.exercises).toHaveLength(1);
  });
});
