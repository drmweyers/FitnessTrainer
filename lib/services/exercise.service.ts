/**
 * Exercise Service
 * Business logic for exercise library operations
 */

import { PrismaClient, DifficultyLevel, Prisma } from '@prisma/client';
import {
  Exercise,
  ExerciseDetail,
  ExerciseListQuery,
  ExerciseListResponse,
  CreateExerciseDTO,
  UpdateExerciseDTO,
  ExerciseFilterOptions,
  ExerciseImportStats,
} from '@/lib/types/exercise';

const prisma = new PrismaClient();

export class ExerciseService {
  /**
   * Get list of exercises with filtering and pagination
   */
  async getExercises(query: ExerciseListQuery): Promise<ExerciseListResponse> {
    const {
      page = 1,
      limit = 20,
      search,
      bodyPart,
      equipment,
      targetMuscle,
      difficulty,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    // Build where clause
    const where: Prisma.ExerciseWhereInput = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { targetMuscle: { contains: search, mode: 'insensitive' } },
        { bodyPart: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (bodyPart) {
      where.bodyPart = bodyPart;
    }

    if (equipment) {
      where.equipment = equipment;
    }

    if (targetMuscle) {
      where.targetMuscle = targetMuscle;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Get total count
    const total = await prisma.exercise.count({ where });

    // Get exercises
    const exercises = await prisma.exercise.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    // Get filter options
    const filters = await this.getFilterOptions();

    return {
      exercises: exercises as Exercise[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      filters,
    };
  }

  /**
   * Get exercise by ID
   */
  async getExerciseById(id: string): Promise<ExerciseDetail | null> {
    const exercise = await prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      return null;
    }

    // TODO: Add favorite status and usage count when auth is implemented
    return {
      ...exercise,
      isFavorite: false,
      usageCount: 0,
    } as ExerciseDetail;
  }

  /**
   * Get exercise by exerciseId (from exerciseDB)
   */
  async getExerciseByExerciseId(exerciseId: string): Promise<Exercise | null> {
    const exercise = await prisma.exercise.findUnique({
      where: { exerciseId },
    });

    return exercise as Exercise | null;
  }

  /**
   * Create new exercise (admin only)
   */
  async createExercise(data: CreateExerciseDTO): Promise<Exercise> {
    const exercise = await prisma.exercise.create({
      data: {
        exerciseId: data.exerciseId || this.generateExerciseId(),
        name: data.name,
        gifUrl: data.gifUrl,
        bodyPart: data.bodyPart,
        equipment: data.equipment,
        targetMuscle: data.targetMuscle,
        secondaryMuscles: data.secondaryMuscles,
        instructions: data.instructions,
        difficulty: data.difficulty || 'intermediate',
        isActive: true,
      },
    });

    return exercise as Exercise;
  }

  /**
   * Update exercise (admin only)
   */
  async updateExercise(id: string, data: UpdateExerciseDTO): Promise<Exercise> {
    const exercise = await prisma.exercise.update({
      where: { id },
      data,
    });

    return exercise as Exercise;
  }

  /**
   * Delete exercise (soft delete - admin only)
   */
  async deleteExercise(id: string): Promise<Exercise> {
    const exercise = await prisma.exercise.update({
      where: { id },
      data: { isActive: false },
    });

    return exercise as Exercise;
  }

  /**
   * Permanently delete exercise (admin only)
   */
  async permanentlyDeleteExercise(id: string): Promise<Exercise> {
    const exercise = await prisma.exercise.delete({
      where: { id },
    });

    return exercise as Exercise;
  }

  /**
   * Get available filter options
   */
  async getFilterOptions(): Promise<ExerciseFilterOptions> {
    const [bodyParts, equipments, targetMuscles] = await Promise.all([
      prisma.exercise.findMany({
        where: { isActive: true },
        select: { bodyPart: true },
        distinct: ['bodyPart'],
        orderBy: { bodyPart: 'asc' },
      }),
      prisma.exercise.findMany({
        where: { isActive: true },
        select: { equipment: true },
        distinct: ['equipment'],
        orderBy: { equipment: 'asc' },
      }),
      prisma.exercise.findMany({
        where: { isActive: true },
        select: { targetMuscle: true },
        distinct: ['targetMuscle'],
        orderBy: { targetMuscle: 'asc' },
      }),
    ]);

    return {
      bodyParts: bodyParts.map((b) => b.bodyPart),
      equipments: equipments.map((e) => e.equipment),
      targetMuscles: targetMuscles.map((t) => t.targetMuscle),
      difficulties: Object.values(DifficultyLevel),
    };
  }

  /**
   * Search exercises (full-text search)
   */
  async searchExercises(query: string, limit = 10): Promise<Exercise[]> {
    const exercises = await prisma.exercise.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { targetMuscle: { contains: query, mode: 'insensitive' } },
          { bodyPart: { contains: query, mode: 'insensitive' } },
          { equipment: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return exercises as Exercise[];
  }

  /**
   * Get random exercises
   */
  async getRandomExercises(count = 5): Promise<Exercise[]> {
    // Get total count
    const total = await prisma.exercise.count({ where: { isActive: true } });

    // Generate random offsets
    const randomOffsets = Array.from({ length: count }, () =>
      Math.floor(Math.random() * total)
    );

    // Fetch random exercises
    const exercises = await Promise.all(
      randomOffsets.map((offset) =>
        prisma.exercise.findFirst({
          where: { isActive: true },
          skip: offset,
        })
      )
    );

    return exercises.filter((e) => e !== null) as Exercise[];
  }

  /**
   * Get exercises by body part
   */
  async getExercisesByBodyPart(bodyPart: string): Promise<Exercise[]> {
    const exercises = await prisma.exercise.findMany({
      where: {
        bodyPart,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return exercises as Exercise[];
  }

  /**
   * Get exercises by target muscle
   */
  async getExercisesByTargetMuscle(targetMuscle: string): Promise<Exercise[]> {
    const exercises = await prisma.exercise.findMany({
      where: {
        targetMuscle,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return exercises as Exercise[];
  }

  /**
   * Get exercises by equipment
   */
  async getExercisesByEquipment(equipment: string): Promise<Exercise[]> {
    const exercises = await prisma.exercise.findMany({
      where: {
        equipment,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return exercises as Exercise[];
  }

  /**
   * Get exercises by difficulty
   */
  async getExercisesByDifficulty(difficulty: DifficultyLevel): Promise<Exercise[]> {
    const exercises = await prisma.exercise.findMany({
      where: {
        difficulty,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return exercises as Exercise[];
  }

  /**
   * Generate unique exercise ID
   */
  private generateExerciseId(): string {
    return `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Import exercises from raw data
   */
  async importExercises(
    exercises: any[]
  ): Promise<ExerciseImportStats> {
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors: Array<{ exerciseId: string; error: string }> = [];

    for (const exercise of exercises) {
      try {
        const existing = await prisma.exercise.findUnique({
          where: { exerciseId: exercise.exerciseId },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await prisma.exercise.create({
          data: {
            exerciseId: exercise.exerciseId,
            name: exercise.name,
            gifUrl: exercise.gifUrl,
            bodyPart: exercise.bodyParts[0] || 'other',
            equipment: exercise.equipments[0] || 'other',
            targetMuscle: exercise.targetMuscles[0] || 'other',
            secondaryMuscles: exercise.secondaryMuscles || [],
            instructions: exercise.instructions || [],
            difficulty: 'intermediate',
            isActive: true,
          },
        });

        imported++;
      } catch (error) {
        failed++;
        errors.push({
          exerciseId: exercise.exerciseId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      total: exercises.length,
      imported,
      skipped,
      failed,
      errors,
    };
  }
}

// Export singleton instance
export const exerciseService = new ExerciseService();
