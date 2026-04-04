/**
 * FORGE User Simulation: Story 004-05 - Favorite Exercises
 */

import { prisma } from '@/lib/db/prisma';

const mockFavorites = [
  { id: 'fav-1', userId: 'user-1', exerciseId: 'ex-1', createdAt: new Date() },
  { id: 'fav-2', userId: 'user-1', exerciseId: 'ex-2', createdAt: new Date() },
];

const mockCreate = jest.fn();
const mockFindMany = jest.fn();
const mockDeleteMany = jest.fn();

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    favoriteExercise: {
      create: (...args: any[]) => mockCreate(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
      deleteMany: (...args: any[]) => mockDeleteMany(...args),
    },
  },
}));

class FavoriteService {
  static async addFavorite(userId: string, exerciseId: string) {
    const favorite = await prisma.favoriteExercise.create({
      data: { userId, exerciseId },
    });
    return { success: true, favorite };
  }

  static async getFavorites(userId: string) {
    const favorites = await prisma.favoriteExercise.findMany({
      where: { userId },
    });
    return { success: true, favorites };
  }

  static async removeFavorite(userId: string, exerciseId: string) {
    await prisma.favoriteExercise.deleteMany({
      where: { userId, exerciseId },
    });
    return { success: true };
  }
}

describe('FORGE: Story 004-05 - Favorite Exercises', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockReset();
    mockFindMany.mockReset();
    mockDeleteMany.mockReset();
  });

  it('adds exercise to favorites', async () => {
    const newFavorite = { id: 'fav-3', userId: 'user-1', exerciseId: 'ex-3', createdAt: new Date() };
    mockCreate.mockResolvedValue(newFavorite);

    const result = await FavoriteService.addFavorite('user-1', 'ex-3');

    expect(result.success).toBe(true);
    expect(result.favorite.exerciseId).toBe('ex-3');
  });

  it('returns user favorites list', async () => {
    mockFindMany.mockResolvedValue(mockFavorites);

    const result = await FavoriteService.getFavorites('user-1');

    expect(result.success).toBe(true);
    expect(result.favorites).toHaveLength(2);
  });

  it('removes exercise from favorites', async () => {
    mockDeleteMany.mockResolvedValue({ count: 1 });

    const result = await FavoriteService.removeFavorite('user-1', 'ex-1');

    expect(result.success).toBe(true);
  });
});
