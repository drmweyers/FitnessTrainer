/**
 * FORGE User Simulation: Story 004-05 - Favorite Exercises
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    exerciseFavorite: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as any;

class FavoriteService {
  static async addFavorite(userId: string, exerciseId: string) {
    const favorite = await mockedPrisma.exerciseFavorite.create({
      data: { userId, exerciseId },
    });
    return { success: true, favorite };
  }

  static async removeFavorite(userId: string, exerciseId: string) {
    await mockedPrisma.exerciseFavorite.delete({
      where: { userId_exerciseId: { userId, exerciseId } },
    });
    return { success: true };
  }

  static async getFavorites(userId: string) {
    const favorites = await mockedPrisma.exerciseFavorite.findMany({
      where: { userId },
      include: { exercise: true },
    });
    return { success: true, favorites };
  }
}

describe('FORGE: Story 004-05 - Favorite Exercises', () => {
  beforeEach(() => jest.clearAllMocks());

  it('adds exercise to favorites', async () => {
    mockedPrisma.exerciseFavorite.create.mockResolvedValue({
      id: 'fav-1',
      userId: 'user-1',
      exerciseId: 'ex-1',
    });

    const result = await FavoriteService.addFavorite('user-1', 'ex-1');

    expect(result.success).toBe(true);
    expect(result.favorite.exerciseId).toBe('ex-1');
  });

  it('removes exercise from favorites', async () => {
    mockedPrisma.exerciseFavorite.delete.mockResolvedValue({ id: 'fav-1' });

    const result = await FavoriteService.removeFavorite('user-1', 'ex-1');

    expect(result.success).toBe(true);
  });

  it('returns user favorites', async () => {
    mockedPrisma.exerciseFavorite.findMany.mockResolvedValue([
      { id: 'fav-1', exercise: { name: 'Bench Press' } },
      { id: 'fav-2', exercise: { name: 'Squat' } },
    ]);

    const result = await FavoriteService.getFavorites('user-1');

    expect(result.favorites).toHaveLength(2);
  });
});
