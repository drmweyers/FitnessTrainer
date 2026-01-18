import { Request, Response } from 'express';
import { PrismaClient, Exercise, DifficultyLevel } from '@prisma/client';
import { logger } from '@/config/logger';
// import { ExerciseCacheService } from '@/services/caching/ExerciseCacheService';
import {
  ExerciseSearchQuery,
  ExerciseCategoriesQuery,
  ExerciseFavoriteRequest,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  AddExerciseToCollectionRequest,
  ExerciseUsageRequest,
  ExerciseResponse,
  ExerciseSearchResponse,
  ExerciseCategoriesResponse,
  ExerciseCollectionResponse,
} from '@/types/exercise';

const prisma = new PrismaClient();
// Note: ExerciseCacheService will be initialized with Redis when available

/**
 * Get exercises with search, filtering, and pagination
 * GET /api/exercises?query=push&bodyPart=chest&page=1&limit=24
 */
export const getExercises = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const {
      query,
      bodyPart,
      equipment,
      targetMuscle,
      difficulty,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query as unknown as ExerciseSearchQuery;

    // TODO: Implement caching when Redis is properly integrated

    // Build where clause for database query
    const whereClause: any = {
      isActive: true,
    };

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { searchVector: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (bodyPart) {
      whereClause.bodyPart = { equals: bodyPart, mode: 'insensitive' };
    }

    if (equipment) {
      whereClause.equipment = { equals: equipment, mode: 'insensitive' };
    }

    if (targetMuscle) {
      whereClause.targetMuscle = { equals: targetMuscle, mode: 'insensitive' };
    }

    if (difficulty) {
      whereClause.difficulty = difficulty as DifficultyLevel;
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'difficulty') {
      orderBy.difficulty = sortOrder;
    } else if (sortBy === 'popularity') {
      // For popularity, we would need to join with usage stats
      // For now, default to name
      orderBy.name = sortOrder;
    }

    // Get total count for pagination
    const total = await prisma.exercise.count({ where: whereClause });

    // Get exercises with pagination
    const exercises = await prisma.exercise.findMany({
      where: whereClause,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      ...(userId && {
        include: {
          favorites: {
            where: { userId },
            select: { id: true },
          },
        }
      }),
    });

    // Format response
    const formattedExercises: ExerciseResponse[] = exercises.map(exercise => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      gifUrl: exercise.gifUrl,
      bodyPart: exercise.bodyPart,
      equipment: exercise.equipment,
      targetMuscle: exercise.targetMuscle,
      secondaryMuscles: exercise.secondaryMuscles,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      isFavorite: userId ? (exercise as any).favorites?.length > 0 : undefined,
      isActive: exercise.isActive,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
    }));

    const response: ExerciseSearchResponse = {
      exercises: formattedExercises,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: { query, bodyPart, equipment, targetMuscle, difficulty },
    };

    // TODO: Cache results for anonymous users when Redis is integrated

    // Track search history for authenticated users
    if (userId && query) {
      await prisma.exerciseSearchHistory.create({
        data: {
          userId,
          searchQuery: query,
          filters: { bodyPart, equipment, targetMuscle, difficulty },
          resultCount: total,
        },
      }).catch(() => {}); // Silent fail for search history
    }

    res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    logger.error('Error getting exercises:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get exercises',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Get single exercise by ID
 * GET /api/exercises/:id
 */
export const getExerciseById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Exercise ID is required',
      });
    }

    // TODO: Try cache first when Redis is integrated

    // Check if the id is a valid UUID format
    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    
    const exercise = await prisma.exercise.findFirst({
      where: {
        ...(isUUID 
          ? { OR: [{ id }, { exerciseId: id }] }
          : { exerciseId: id }
        ),
        isActive: true,
      },
      ...(userId && {
        include: {
          favorites: {
            where: { userId },
            select: { id: true },
          },
        }
      }),
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found',
      });
    }

    const formattedExercise: ExerciseResponse = {
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      gifUrl: exercise.gifUrl,
      bodyPart: exercise.bodyPart,
      equipment: exercise.equipment,
      targetMuscle: exercise.targetMuscle,
      secondaryMuscles: exercise.secondaryMuscles,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      isFavorite: userId ? (exercise as any).favorites?.length > 0 : undefined,
      isActive: exercise.isActive,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
    };

    // TODO: Cache the exercise when Redis is integrated

    // Track usage for authenticated users
    if (userId) {
      await prisma.exerciseUsage.create({
        data: {
          userId,
          exerciseId: exercise.id,
          context: 'viewed',
        },
      }).catch(() => {}); // Silent fail for usage tracking
    }

    res.json({
      success: true,
      data: formattedExercise,
    });
  } catch (error: any) {
    logger.error('Error getting exercise:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get exercise',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Get exercise categories (body parts, equipment, etc.)
 * GET /api/exercises/categories?type=bodyParts
 */
export const getExerciseCategories = async (req: Request, res: Response): Promise<any> => {
  try {
    const { type } = req.query as unknown as ExerciseCategoriesQuery;

    const categories: ExerciseCategoriesResponse = {
      bodyParts: [],
      equipment: [],
      targetMuscles: [],
      difficulties: ['beginner', 'intermediate', 'advanced'],
    };

    if (!type || type === 'bodyParts') {
      const bodyParts = await prisma.exercise.findMany({
        where: { isActive: true },
        select: { bodyPart: true },
        distinct: ['bodyPart'],
        orderBy: { bodyPart: 'asc' },
      });
      categories.bodyParts = bodyParts.map(bp => bp.bodyPart);
    }

    if (!type || type === 'equipment') {
      const equipment = await prisma.exercise.findMany({
        where: { isActive: true },
        select: { equipment: true },
        distinct: ['equipment'],
        orderBy: { equipment: 'asc' },
      });
      categories.equipment = equipment.map(eq => eq.equipment);
    }

    if (!type || type === 'targetMuscles') {
      const targetMuscles = await prisma.exercise.findMany({
        where: { isActive: true },
        select: { targetMuscle: true },
        distinct: ['targetMuscle'],
        orderBy: { targetMuscle: 'asc' },
      });
      categories.targetMuscles = targetMuscles.map(tm => tm.targetMuscle);
    }

    res.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    logger.error('Error getting exercise categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get exercise categories',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Add exercise to favorites
 * POST /api/exercises/:id/favorite
 */
export const addToFavorites = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if exercise exists
    const exercise = await prisma.exercise.findFirst({
      where: {
        OR: [
          { id },
          { exerciseId: id },
        ],
        isActive: true,
      },
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found',
      });
    }

    // Add to favorites (upsert to handle duplicates)
    await prisma.exerciseFavorite.upsert({
      where: {
        userId_exerciseId: {
          userId,
          exerciseId: exercise.id,
        },
      },
      create: {
        userId,
        exerciseId: exercise.id,
      },
      update: {},
    });

    // TODO: Invalidate user cache when Redis is integrated

    res.json({
      success: true,
      message: 'Exercise added to favorites',
    });
  } catch (error: any) {
    logger.error('Error adding to favorites:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add exercise to favorites',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Remove exercise from favorites
 * DELETE /api/exercises/:id/favorite
 */
export const removeFromFavorites = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Find exercise
    const exercise = await prisma.exercise.findFirst({
      where: {
        OR: [
          { id },
          { exerciseId: id },
        ],
        isActive: true,
      },
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found',
      });
    }

    // Remove from favorites
    await prisma.exerciseFavorite.deleteMany({
      where: {
        userId,
        exerciseId: exercise.id,
      },
    });

    // TODO: Invalidate user cache when Redis is integrated

    res.json({
      success: true,
      message: 'Exercise removed from favorites',
    });
  } catch (error: any) {
    logger.error('Error removing from favorites:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove exercise from favorites',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Get user's exercise collections
 * GET /api/exercises/collections
 */
export const getCollections = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;

    const collections = await prisma.exerciseCollection.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            exercises: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedCollections: ExerciseCollectionResponse[] = collections.map(collection => ({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isPublic: collection.isPublic,
      exerciseCount: collection._count.exercises,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    }));

    res.json({
      success: true,
      data: formattedCollections,
    });
  } catch (error: any) {
    logger.error('Error getting collections:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get collections',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Create new exercise collection
 * POST /api/exercises/collections
 */
export const createCollection = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { name, description, isPublic } = req.body as CreateCollectionRequest;

    const collection = await prisma.exerciseCollection.create({
      data: {
        userId,
        name,
        description,
        isPublic,
      },
      include: {
        _count: {
          select: {
            exercises: true,
          },
        },
      },
    });

    const formattedCollection: ExerciseCollectionResponse = {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isPublic: collection.isPublic,
      exerciseCount: collection._count.exercises,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };

    res.status(201).json({
      success: true,
      data: formattedCollection,
      message: 'Collection created successfully',
    });
  } catch (error: any) {
    logger.error('Error creating collection:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create collection',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Add exercise to collection
 * POST /api/exercises/collections/:collectionId/exercises
 */
export const addExerciseToCollection = async (req: Request, res: Response): Promise<any> => {
  try {
    const { collectionId } = req.params;
    const userId = req.user!.id;
    const { exerciseId, position } = req.body as AddExerciseToCollectionRequest;

    if (!collectionId) {
      return res.status(400).json({
        success: false,
        message: 'Collection ID is required',
      });
    }

    // Verify collection ownership
    const collection = await prisma.exerciseCollection.findFirst({
      where: {
        id: collectionId,
        userId,
      },
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    // Verify exercise exists
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found',
      });
    }

    // Add to collection (upsert to handle duplicates)
    await prisma.collectionExercise.upsert({
      where: {
        collectionId_exerciseId: {
          collectionId,
          exerciseId,
        },
      },
      create: {
        collectionId,
        exerciseId,
        position,
      },
      update: {
        position,
      },
    });

    res.json({
      success: true,
      message: 'Exercise added to collection',
    });
  } catch (error: any) {
    logger.error('Error adding exercise to collection:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add exercise to collection',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Remove exercise from collection
 * DELETE /api/exercises/collections/:collectionId/exercises/:exerciseId
 */
export const removeExerciseFromCollection = async (req: Request, res: Response): Promise<any> => {
  try {
    const { collectionId, exerciseId } = req.params;
    const userId = req.user!.id;

    if (!collectionId || !exerciseId) {
      return res.status(400).json({
        success: false,
        message: 'Collection ID and Exercise ID are required',
      });
    }

    // Verify collection ownership
    const collection = await prisma.exerciseCollection.findFirst({
      where: {
        id: collectionId,
        userId,
      },
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    // Remove from collection
    await prisma.collectionExercise.deleteMany({
      where: {
        collectionId,
        exerciseId,
      },
    });

    res.json({
      success: true,
      message: 'Exercise removed from collection',
    });
  } catch (error: any) {
    logger.error('Error removing exercise from collection:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove exercise from collection',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Get user's favorite exercises
 * GET /api/exercises/favorites
 */
export const getFavorites = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { sort } = req.query as { sort?: 'date_added' | 'name' | 'usage' };

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
      orderBy: sort === 'name' ? { exercise: { name: 'asc' } } : { favoritedAt: 'desc' },
    });

    // Get usage counts for each exercise
    const exerciseIds = favorites.map((f: any) => f.exercise.id);
    const usageCounts = await prisma.exerciseUsage.groupBy({
      by: ['exerciseId'],
      where: {
        exerciseId: { in: exerciseIds },
      },
      _count: true,
    });

    const usageMap = new Map(
      usageCounts.map((u: any) => [u.exerciseId, u._count] as [string, number])
    );

    const formattedFavorites = favorites.map((fav: any) => ({
      id: fav.id,
      favoritedAt: fav.favoritedAt,
      exercise: {
        ...fav.exercise,
        usageCount: usageMap.get(fav.exercise.id) || 0,
      },
    }));

    res.json({
      success: true,
      data: formattedFavorites,
      count: formattedFavorites.length,
    });
  } catch (error: any) {
    logger.error('Error getting favorites:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get favorites',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Check if exercise is favorited by user
 * GET /api/exercises/:id/favorite-status
 */
export const getFavoriteStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Find exercise
    const exercise = await prisma.exercise.findFirst({
      where: {
        OR: [{ id }, { exerciseId: id }],
        isActive: true,
      },
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found',
      });
    }

    const favorite = await prisma.exerciseFavorite.findFirst({
      where: {
        userId,
        exerciseId: exercise.id,
      },
    });

    res.json({
      success: true,
      data: {
        isFavorited: !!favorite,
        favoritedAt: favorite?.favoritedAt || null,
      },
    });
  } catch (error: any) {
    logger.error('Error getting favorite status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get favorite status',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Bulk remove multiple favorites
 * POST /api/exercises/favorites/bulk-unfavorite
 */
export const bulkUnfavorite = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;
    const { exerciseIds } = req.body;

    if (!Array.isArray(exerciseIds) || exerciseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Exercise IDs array is required',
      });
    }

    // Find exercises to get actual IDs
    const exercises = await prisma.exercise.findMany({
      where: {
        OR: exerciseIds.map((id: string) => ({ id })),
        isActive: true,
      },
      select: { id: true },
    });

    const actualIds = exercises.map((e) => e.id);

    // Delete all favorites
    const result = await prisma.exerciseFavorite.deleteMany({
      where: {
        userId,
        exerciseId: { in: actualIds },
      },
    });

    logger.info(`Bulk unfavorited ${result.count} exercises for user ${userId}`);

    res.json({
      success: true,
      message: `Removed ${result.count} exercises from favorites`,
      data: { count: result.count },
    });
  } catch (error: any) {
    logger.error('Error bulk unfavoriting:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to bulk unfavorite',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Update exercise collection
 * PUT /api/exercises/collections/:collectionId
 */
export const updateCollection = async (req: Request, res: Response): Promise<any> => {
  try {
    const { collectionId } = req.params;
    const userId = req.user!.id;
    const { name, description, isPublic } = req.body;

    // Verify collection ownership
    const existing = await prisma.exerciseCollection.findFirst({
      where: {
        id: collectionId,
        userId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    const updated = await prisma.exerciseCollection.update({
      where: { id: collectionId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        _count: {
          select: {
            exercises: true,
          },
        },
      },
    });

    const formattedCollection: ExerciseCollectionResponse = {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      isPublic: updated.isPublic,
      exerciseCount: updated._count.exercises,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };

    logger.info(`Collection updated: ${collectionId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Collection updated successfully',
      data: formattedCollection,
    });
  } catch (error: any) {
    logger.error('Error updating collection:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update collection',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Delete exercise collection
 * DELETE /api/exercises/collections/:collectionId
 */
export const deleteCollection = async (req: Request, res: Response): Promise<any> => {
  try {
    const { collectionId } = req.params;
    const userId = req.user!.id;

    // Verify collection ownership
    const existing = await prisma.exerciseCollection.findFirst({
      where: {
        id: collectionId,
        userId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    // Delete all exercises in collection first (cascade delete should handle this)
    await prisma.exerciseCollection.delete({
      where: { id: collectionId },
    });

    logger.info(`Collection deleted: ${collectionId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Collection deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting collection:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete collection',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Get single collection with exercises
 * GET /api/exercises/collections/:collectionId
 */
export const getCollection = async (req: Request, res: Response): Promise<any> => {
  try {
    const { collectionId } = req.params;
    const userId = req.user!.id;

    const collection = await prisma.exerciseCollection.findFirst({
      where: {
        id: collectionId,
        userId,
      },
      include: {
        exercises: {
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
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    const formattedCollection = {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isPublic: collection.isPublic,
      exercises: collection.exercises.map((ce: any) => ({
        id: ce.id,
        position: ce.position,
        addedAt: ce.addedAt,
        exercise: ce.exercise,
      })),
      exerciseCount: collection.exercises.length,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };

    res.json({
      success: true,
      data: formattedCollection,
    });
  } catch (error: any) {
    logger.error('Error getting collection:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get collection',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};