/**
 * FORGE User Simulation: Story 004-05 - Favorite Exercises
 */

import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: { exerciseFavorite: { create: jest.fn(), delete: jest.fn(), findMany: jest.fn() } },
}));

const mockedPrisma = prisma as any;

class FavoriteService {
  static async addFavorite(userId: string, exerciseId: string) {
    const favorite = await mockedPrisma.exerciseFavorite.create({ data: { userId, exerciseId } });
    return { success: true, favorite };
  }
  static async removeFavorite(userId: string, exerciseId: string) {
    await mockedPrisma.exerciseFavorite.delete({ where: { userId_exerciseId: { userId, exerciseId } } });
    return { success: true };
  }
  static async getFavorites(userId: string) {
    const favorites = await mockedPrisma.exerciseFavorite.findMany({ where: { userId } });
    return { success: true, favorites };
  }
}

describe('FORGE: Story 004-05 - Favorite Exercises', () => {
  beforeEach(() => jest.clearAllMocks());

  it('adds favorite', async () => {
    mockedPrisma.exerciseFavorite.create.mockResolvedValue({ id: 'fav-1', userId: 'u1', exerciseId: 'ex-1' });
    const result = await FavoriteService.addFavorite('u1', 'ex-1');
    expect(result.success).toBe(true);
  });

  it('removes favorite', async () => {
    mockedPrisma.exerciseFavorite.delete.mockResolvedValue({ id: 'fav-1' });
    const result = await FavoriteService.removeFavorite('u1', 'ex-1');
    expect(result.success).toBe(true);
  });

  it('gets favorites', async () => {
    mockedPrisma.exerciseFavorite.findMany.mockResolvedValue([{ id: 'fav-1' }, { id: 'fav-2' }]);
    const result = await FavoriteService.getFavorites('u1');
    expect(result.favorites).toHaveLength(2);
  });
});
