import { prisma } from '@/index';

// Filter options interface
interface ExerciseFilters {
  bodyParts?: string[];
  equipment?: string[];
  targetMuscles?: string[];
}

// Pagination options
interface PaginationOptions {
  limit?: number;
  offset?: number;
}

// Filter result interface
interface FilterResult {
  exercises: any[];
  total: number;
  filters: ExerciseFilters;
}

// Available filter options
interface FilterOptions {
  bodyParts: string[];
  equipment: string[];
  targetMuscles: string[];
}

// Filter preset interface
interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: ExerciseFilters;
}

export class ExerciseFilterService {
  /**
   * Get all available filter options from the database
   */
  async getAvailableFilters(): Promise<FilterOptions> {
    // Get distinct body parts
    const bodyPartsResult = await prisma.exercise.groupBy({
      by: ['bodyPart'],
      where: { isActive: true },
      orderBy: { bodyPart: 'asc' },
    });

    // Get distinct equipment
    const equipmentResult = await prisma.exercise.groupBy({
      by: ['equipment'],
      where: { isActive: true },
      orderBy: { equipment: 'asc' },
    });

    // Get distinct target muscles
    const targetMusclesResult = await prisma.exercise.groupBy({
      by: ['targetMuscle'],
      where: { isActive: true },
      orderBy: { targetMuscle: 'asc' },
    });

    return {
      bodyParts: bodyPartsResult.map((item) => item.bodyPart),
      equipment: equipmentResult.map((item) => item.equipment),
      targetMuscles: targetMusclesResult.map((item) => item.targetMuscle),
    };
  }

  /**
   * Filter exercises based on provided criteria
   */
  async filterExercises(
    filters: ExerciseFilters,
    pagination: PaginationOptions = {}
  ): Promise<FilterResult> {
    const { limit = 50, offset = 0 } = pagination;
    const { bodyParts, equipment, targetMuscles } = filters;

    // Build where clause
    const andConditions: any[] = [];

    if (bodyParts && bodyParts.length > 0) {
      andConditions.push({
        bodyPart: { in: bodyParts },
      });
    }

    if (equipment && equipment.length > 0) {
      andConditions.push({
        equipment: { in: equipment },
      });
    }

    if (targetMuscles && targetMuscles.length > 0) {
      andConditions.push({
        targetMuscle: { in: targetMuscles },
      });
    }

    const where: any = {
      isActive: true,
    };

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Get total count
    const total = await prisma.exercise.count({ where });

    // Execute filtered query
    const exercises = await prisma.exercise.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: [{ name: 'asc' }],
      select: {
        id: true,
        exerciseId: true,
        name: true,
        bodyPart: true,
        equipment: true,
        targetMuscle: true,
        secondaryMuscles: true,
        difficulty: true,
        gifUrl: true,
      },
    });

    return {
      exercises,
      total,
      filters,
    };
  }

  /**
   * Get default filter presets
   */
  getDefaultPresets(): Record<string, FilterPreset> {
    return {
      upperBody: {
        id: 'upper-body',
        name: 'Upper Body',
        description: 'Chest, Back, Shoulders, and Arms',
        filters: {
          bodyParts: ['chest', 'back', 'shoulders', 'upper arms', 'lower arms'],
        },
      },
      lowerBody: {
        id: 'lower-body',
        name: 'Lower Body',
        description: 'Legs and Glutes',
        filters: {
          bodyParts: ['upper legs', 'lower legs'],
        },
      },
      noEquipment: {
        id: 'no-equipment',
        name: 'No Equipment',
        description: 'Body weight exercises only',
        filters: {
          equipment: ['body weight'],
        },
      },
      fullBody: {
        id: 'full-body',
        name: 'Full Body',
        description: 'Complete body workout',
        filters: {
          bodyParts: ['chest', 'back', 'shoulders', 'upper legs', 'lower legs'],
        },
      },
      core: {
        id: 'core',
        name: 'Core',
        description: 'Abs and Obliques',
        filters: {
          targetMuscles: ['abs', 'obliques'],
        },
      },
      chest: {
        id: 'chest',
        name: 'Chest Focus',
        description: 'Chest and supporting muscles',
        filters: {
          bodyParts: ['chest'],
          targetMuscles: ['pectorals'],
        },
      },
      back: {
        id: 'back',
        name: 'Back Focus',
        description: 'Back and supporting muscles',
        filters: {
          bodyParts: ['back'],
          targetMuscles: ['lats', 'traps', 'spine'],
        },
      },
      legs: {
        id: 'legs',
        name: 'Legs Focus',
        description: 'Complete leg training',
        filters: {
          bodyParts: ['upper legs', 'lower legs'],
          targetMuscles: ['quads', 'hamstrings', 'glutes'],
        },
      },
      shoulders: {
        id: 'shoulders',
        name: 'Shoulders Focus',
        description: 'Shoulder and arm training',
        filters: {
          bodyParts: ['shoulders'],
          targetMuscles: ['delts'],
        },
      },
    };
  }

  /**
   * Get a specific preset by ID
   * Supports both kebab-case (e.g., 'upper-body') and camelCase (e.g., 'upperBody')
   */
  getPresetById(presetId: string): FilterPreset | null {
    const presets = this.getDefaultPresets();
    // Try direct key lookup first
    if (presets[presetId]) {
      return presets[presetId];
    }
    // Try converting kebab-case to camelCase
    const camelCaseId = presetId.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    return presets[camelCaseId] || null;
  }

  /**
   * Apply a preset and return filtered exercises
   */
  async applyPreset(
    presetId: string,
    pagination: PaginationOptions = {}
  ): Promise<FilterResult> {
    const preset = this.getPresetById(presetId);

    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    return this.filterExercises(preset.filters, pagination);
  }
}

export const exerciseFilterService = new ExerciseFilterService();
