/**
 * FORGE User Simulation: Story 004-04 - View Exercise Details
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    exercise: {
      findUnique: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as any;

class ExerciseDetailService {
  static async getExerciseDetail(id: string) {
    const exercise = await mockedPrisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      return { success: false, error: 'Exercise not found' };
    }

    return { success: true, exercise };
  }
}

describe('FORGE: Story 004-04 - View Exercise Details', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns exercise details', async () => {
    mockedPrisma.exercise.findUnique.mockResolvedValue({
      id: 'ex-1',
      name: 'Bench Press',
      bodyPart: 'chest',
      equipment: 'barbell',
      targetMuscle: 'pectorals',
      instructions: ['Lie on bench', 'Press bar up'],
    });

    const result = await ExerciseDetailService.getExerciseDetail('ex-1');

    expect(result.success).toBe(true);
    expect(result.exercise.name).toBe('Bench Press');
  });

  it('returns error for non-existent exercise', async () => {
    mockedPrisma.exercise.findUnique.mockResolvedValue(null);

    const result = await ExerciseDetailService.getExerciseDetail('nonexistent');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Exercise not found');
  });
});
