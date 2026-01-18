import { prisma } from '@/index';
import { createError } from '@/middleware/errorHandler';

// Favorites interface
interface FavoriteWithExercise {
  id: string;
  userId: string;
  exerciseId: string;
  favoritedAt: Date;
  exercise: {
    id: string;
    exerciseId: string;
    name: string;
    bodyPart: string;
    equipment: string;
    targetMuscle: string;
    gifUrl: string;
    difficulty: string;
  };
}

// Sort options for favorites
type FavoritesSort = 'date_added' | 'name' | 'usage';

export class ExerciseService {
  /**
   * Get all favorited exercises for a user
   */
  async getUserFavorites(
    userId: string,
    sort: FavoritesSort = 'date_added'
  ): Promise<FavoriteWithExercise[]> {
    const orderBy: any = {};

    switch (sort) {
      case 'date_added':
        orderBy.favoritedAt = 'desc';
        break;
      case 'name':
        orderBy.exercise = { name: 'asc' };
        break;
      case 'usage':
        // For now, sort by date added (can be enhanced with actual usage tracking)
        orderBy.favoritedAt = 'desc';
        break;
    }

    const favorites = await prisma.exerciseFavorite.findMany({
      where: { userId },
      include: {
        exercise: {
          select: {
            id: true,
            exerciseId: true,
            name: true,
            bodyPart: true,
            equipment: true,
            targetMuscle: true,
            gifUrl: true,
            difficulty: true,
          },
        },
      },
      orderBy,
    });

    return favorites as FavoriteWithExercise[];
  }

  /**
   * Check if an exercise is favorited by a user
   */
  async isFavorited(userId: string, exerciseId: string): Promise<boolean> {
    const favorite = await prisma.exerciseFavorite.findFirst({
      where: {
        userId,
        exerciseId,
      },
    });

    return !!favorite;
  }

  /**
   * Bulk unfavorite multiple exercises
   */
  async bulkUnfavorite(
    userId: string,
    exerciseIds: string[]
  ): Promise<{ count: number }> {
    const result = await prisma.exerciseFavorite.deleteMany({
      where: {
        userId,
        exerciseId: { in: exerciseIds },
      },
    });

    return { count: result.count };
  }

  /**
   * Get favorite count for an exercise
   */
  async getFavoriteCount(exerciseId: string): Promise<number> {
    return prisma.exerciseFavorite.count({
      where: { exerciseId },
    });
  }
}

export const exerciseService = new ExerciseService();
