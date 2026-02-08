/**
 * Exercise Service Tests
 * Tests for exercise business logic
 */

// Mock PrismaClient - the factory creates a singleton mock instance
// We access the mock instance via PrismaClient.mock.results after import
jest.mock('@prisma/client', () => {
  const exerciseMock = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      exercise: exerciseMock,
      $disconnect: jest.fn(),
    })),
    DifficultyLevel: {
      beginner: 'beginner',
      intermediate: 'intermediate',
      advanced: 'advanced',
    },
    Prisma: {
      SortOrder: { asc: 'asc', desc: 'desc' },
    },
    // Export the mock for test access
    __exerciseMock: exerciseMock,
  };
});

import { ExerciseService } from '@/lib/services/exercise.service';

// Access the mock after import
const { __exerciseMock } = jest.requireMock('@prisma/client');

describe('ExerciseService', () => {
  let exerciseService: ExerciseService;
  let mockPrisma: { exercise: any };

  beforeEach(() => {
    // Reset all mocks
    Object.values(__exerciseMock).forEach((fn: any) => fn.mockReset());

    mockPrisma = { exercise: __exerciseMock };
    exerciseService = new ExerciseService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getExercises', () => {
    it('should return exercises with pagination', async () => {
      const mockExercises = [
        {
          id: '1',
          exerciseId: 'ex1',
          name: 'Bench Press',
          gifUrl: 'bench.gif',
          bodyPart: 'chest',
          equipment: 'barbell',
          targetMuscle: 'pectorals',
          secondaryMuscles: ['triceps'],
          instructions: ['Press bar'],
          difficulty: 'intermediate',
          isActive: true,
          createdAt: new Date(),
          updatedAt: null,
        },
      ];

      mockPrisma.exercise.count.mockResolvedValue(1);
      // First findMany call returns exercises, then filter option queries follow
      mockPrisma.exercise.findMany
        .mockResolvedValueOnce(mockExercises)
        .mockResolvedValueOnce([
          { bodyPart: 'chest' },
          { bodyPart: 'back' },
        ])
        .mockResolvedValueOnce([{ equipment: 'barbell' }])
        .mockResolvedValueOnce([{ targetMuscle: 'pectorals' }]);

      const result = await exerciseService.getExercises({
        page: 1,
        limit: 20,
      });

      expect(result.exercises).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 0,
        take: 20,
        orderBy: { name: 'asc' },
      });
    });

    it('should filter by body part', async () => {
      mockPrisma.exercise.count.mockResolvedValue(0);
      mockPrisma.exercise.findMany.mockResolvedValue([]);
      mockPrisma.exercise.findMany
        .mockResolvedValue([{ bodyPart: 'chest' }])
        .mockResolvedValue([{ equipment: 'barbell' }])
        .mockResolvedValue([{ targetMuscle: 'pectorals' }]);

      await exerciseService.getExercises({
        bodyPart: 'chest',
      });

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, bodyPart: 'chest' },
        })
      );
    });

    it('should filter by difficulty', async () => {
      mockPrisma.exercise.count.mockResolvedValue(0);
      mockPrisma.exercise.findMany.mockResolvedValue([]);
      mockPrisma.exercise.findMany
        .mockResolvedValue([{ bodyPart: 'chest' }])
        .mockResolvedValue([{ equipment: 'barbell' }])
        .mockResolvedValue([{ targetMuscle: 'pectorals' }]);

      await exerciseService.getExercises({
        difficulty: 'beginner',
      });

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, difficulty: 'beginner' },
        })
      );
    });

    it('should search by query', async () => {
      mockPrisma.exercise.count.mockResolvedValue(0);
      mockPrisma.exercise.findMany.mockResolvedValue([]);
      mockPrisma.exercise.findMany
        .mockResolvedValue([{ bodyPart: 'chest' }])
        .mockResolvedValue([{ equipment: 'barbell' }])
        .mockResolvedValue([{ targetMuscle: 'pectorals' }]);

      await exerciseService.getExercises({
        search: 'bench',
      });

      expect(mockPrisma.exercise.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: [
            { name: { contains: 'bench', mode: 'insensitive' } },
            { targetMuscle: { contains: 'bench', mode: 'insensitive' } },
            { bodyPart: { contains: 'bench', mode: 'insensitive' } },
          ],
        }),
      });
    });
  });

  describe('getExerciseById', () => {
    it('should return exercise by ID', async () => {
      const mockExercise = {
        id: '1',
        exerciseId: 'ex1',
        name: 'Bench Press',
        gifUrl: 'bench.gif',
        bodyPart: 'chest',
        equipment: 'barbell',
        targetMuscle: 'pectorals',
        secondaryMuscles: ['triceps'],
        instructions: ['Press bar'],
        difficulty: 'intermediate',
        isActive: true,
        createdAt: new Date(),
        updatedAt: null,
      };

      mockPrisma.exercise.findUnique.mockResolvedValue(mockExercise);

      const result = await exerciseService.getExerciseById('1');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Bench Press');
      expect(mockPrisma.exercise.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null for non-existent exercise', async () => {
      mockPrisma.exercise.findUnique.mockResolvedValue(null);

      const result = await exerciseService.getExerciseById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createExercise', () => {
    it('should create new exercise', async () => {
      const newExercise = {
        id: '2',
        exerciseId: 'custom_ex1',
        name: 'Squat',
        gifUrl: 'squat.gif',
        bodyPart: 'legs',
        equipment: 'barbell',
        targetMuscle: 'quadriceps',
        secondaryMuscles: ['glutes'],
        instructions: ['Squat down'],
        difficulty: 'intermediate',
        isActive: true,
        createdAt: new Date(),
        updatedAt: null,
      };

      mockPrisma.exercise.create.mockResolvedValue(newExercise);

      const result = await exerciseService.createExercise({
        name: 'Squat',
        gifUrl: 'squat.gif',
        bodyPart: 'legs',
        equipment: 'barbell',
        targetMuscle: 'quadriceps',
        secondaryMuscles: ['glutes'],
        instructions: ['Squat down'],
      });

      expect(result.name).toBe('Squat');
      expect(mockPrisma.exercise.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Squat',
          exerciseId: expect.any(String),
        }),
      });
    });

    it('should use custom exerciseId if provided', async () => {
      const newExercise = {
        id: '2',
        exerciseId: 'my_custom_id',
        name: 'Custom Exercise',
        gifUrl: 'custom.gif',
        bodyPart: 'chest',
        equipment: 'dumbbell',
        targetMuscle: 'pectorals',
        secondaryMuscles: [],
        instructions: ['Do it'],
        difficulty: 'intermediate',
        isActive: true,
        createdAt: new Date(),
        updatedAt: null,
      };

      mockPrisma.exercise.create.mockResolvedValue(newExercise);

      await exerciseService.createExercise({
        exerciseId: 'my_custom_id',
        name: 'Custom Exercise',
        gifUrl: 'custom.gif',
        bodyPart: 'chest',
        equipment: 'dumbbell',
        targetMuscle: 'pectorals',
        secondaryMuscles: [],
        instructions: ['Do it'],
      });

      expect(mockPrisma.exercise.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          exerciseId: 'my_custom_id',
        }),
      });
    });
  });

  describe('updateExercise', () => {
    it('should update exercise', async () => {
      const updatedExercise = {
        id: '1',
        exerciseId: 'ex1',
        name: 'Updated Bench Press',
        gifUrl: 'bench.gif',
        bodyPart: 'chest',
        equipment: 'barbell',
        targetMuscle: 'pectorals',
        secondaryMuscles: ['triceps'],
        instructions: ['Press bar'],
        difficulty: 'advanced',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.exercise.update.mockResolvedValue(updatedExercise);

      const result = await exerciseService.updateExercise('1', {
        name: 'Updated Bench Press',
        difficulty: 'advanced',
      });

      expect(result.name).toBe('Updated Bench Press');
      expect(mockPrisma.exercise.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Bench Press',
          difficulty: 'advanced',
        },
      });
    });
  });

  describe('deleteExercise', () => {
    it('should soft delete exercise', async () => {
      const deletedExercise = {
        id: '1',
        exerciseId: 'ex1',
        name: 'Bench Press',
        gifUrl: 'bench.gif',
        bodyPart: 'chest',
        equipment: 'barbell',
        targetMuscle: 'pectorals',
        secondaryMuscles: ['triceps'],
        instructions: ['Press bar'],
        difficulty: 'intermediate',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.exercise.update.mockResolvedValue(deletedExercise);

      const result = await exerciseService.deleteExercise('1');

      expect(result.isActive).toBe(false);
      expect(mockPrisma.exercise.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
    });
  });

  describe('searchExercises', () => {
    it('should search exercises by query', async () => {
      const mockExercises = [
        {
          id: '1',
          name: 'Bench Press',
          gifUrl: 'bench.gif',
          bodyPart: 'chest',
          equipment: 'barbell',
          targetMuscle: 'pectorals',
          secondaryMuscles: ['triceps'],
          instructions: ['Press bar'],
          difficulty: 'intermediate',
          isActive: true,
          createdAt: new Date(),
          updatedAt: null,
        },
      ];

      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await exerciseService.searchExercises('bench', 10);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bench Press');
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { name: { contains: 'bench', mode: 'insensitive' } },
            { targetMuscle: { contains: 'bench', mode: 'insensitive' } },
            { bodyPart: { contains: 'bench', mode: 'insensitive' } },
            { equipment: { contains: 'bench', mode: 'insensitive' } },
          ],
        },
        take: 10,
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getFilterOptions', () => {
    it('should return filter options', async () => {
      mockPrisma.exercise.findMany
        .mockResolvedValueOnce([
          { bodyPart: 'chest' },
          { bodyPart: 'back' },
        ])
        .mockResolvedValueOnce([{ equipment: 'barbell' }])
        .mockResolvedValueOnce([{ targetMuscle: 'pectorals' }]);

      const result = await exerciseService.getFilterOptions();

      expect(result.bodyParts).toEqual(['chest', 'back']);
      expect(result.equipments).toEqual(['barbell']);
      expect(result.targetMuscles).toEqual(['pectorals']);
      expect(result.difficulties).toEqual(['beginner', 'intermediate', 'advanced']);
    });
  });

  describe('getRandomExercises', () => {
    it('should return random exercises', async () => {
      mockPrisma.exercise.count.mockResolvedValue(100);
      mockPrisma.exercise.findFirst.mockResolvedValue({
        id: '1',
        name: 'Random Exercise',
        gifUrl: 'random.gif',
        bodyPart: 'chest',
        equipment: 'barbell',
        targetMuscle: 'pectorals',
        secondaryMuscles: [],
        instructions: [],
        difficulty: 'intermediate',
        isActive: true,
        createdAt: new Date(),
        updatedAt: null,
      });

      const result = await exerciseService.getRandomExercises(5);

      expect(result).toHaveLength(5);
      expect(mockPrisma.exercise.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(mockPrisma.exercise.findFirst).toHaveBeenCalledTimes(5);
    });
  });
});
