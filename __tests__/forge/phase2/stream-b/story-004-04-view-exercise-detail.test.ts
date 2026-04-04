/**
 * FORGE User Simulation: Story 004-04 - View Exercise Details
 */

import { prisma } from '@/lib/db/prisma';

const mockExercise = {
  id: 'ex-1',
  name: 'Bench Press',
  description: 'Classic chest exercise',
  muscleGroups: ['chest', 'triceps', 'shoulders'],
  equipment: ['barbell', 'bench'],
  difficulty: 'intermediate',
};

const mockFindUnique = jest.fn();

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    exercise: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
    },
  },
}));

class ExerciseDetailService {
  static async getExerciseDetail(id: string) {
    const exercise = await prisma.exercise.findUnique({ where: { id } });
    if (!exercise) {
      return { success: false, error: 'Exercise not found' };
    }
    return { success: true, exercise };
  }
}

describe('FORGE: Story 004-04 - View Exercise Details', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUnique.mockReset();
  });

  it('returns exercise details', async () => {
    mockFindUnique.mockResolvedValue(mockExercise);

    const result = await ExerciseDetailService.getExerciseDetail('ex-1');

    expect(result.success).toBe(true);
    expect(result.exercise.name).toBe('Bench Press');
    expect(result.exercise.muscleGroups).toContain('chest');
  });

  it('returns error for non-existent exercise', async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await ExerciseDetailService.getExerciseDetail('ex-nonexistent');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Exercise not found');
  });

  it('returns exercise with equipment info', async () => {
    mockFindUnique.mockResolvedValue(mockExercise);

    const result = await ExerciseDetailService.getExerciseDetail('ex-1');

    expect(result.success).toBe(true);
    expect(result.exercise.equipment).toContain('barbell');
    expect(result.exercise.difficulty).toBe('intermediate');
  });
});
