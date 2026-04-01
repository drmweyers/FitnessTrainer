/**
 * FORGE User Simulation: Story 004-04 - View Exercise Details
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
}));

const mockedPrisma = prisma as any;

class ExerciseDetailService {
  static async getExerciseDetail(id: string) {
    return { success: true, exercise };
  }
}

describe('FORGE: Story 004-04 - View Exercise Details', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns exercise details', async () => {
    expect(result.success).toBe(true);
    expect(result.exercise.name).toBe('Bench Press');
  });

  it('returns error for non-existent exercise', async () => {
    mockedPrisma.exercise.findUnique.mockResolvedValue(null);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Exercise not found');
  });
});
