/**
 * Tests for lib/services/exercise.service.ts (Backend Prisma-based service)
 */

// The @prisma/client mock is auto-loaded from __mocks__/@prisma/client.ts
// ExerciseService creates its own PrismaClient instance internally
import { PrismaClient } from '@prisma/client';

// Get reference to the mock instance (PrismaClient constructor returns the same mock)
const mockPrisma = new PrismaClient() as any;

import { ExerciseService, exerciseService } from '@/lib/services/exercise.service';

describe('ExerciseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getExercises ───

  describe('getExercises', () => {
    // getExercises internally calls getFilterOptions which makes 3 additional findMany calls
    // We need to mock findMany to return exercises first, then filter data for the 3 filter calls
    function setupGetExercisesMocks(exercises: any[], total: number) {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(total);
      (mockPrisma.exercise.findMany as jest.Mock)
        .mockResolvedValueOnce(exercises) // Main exercise query
        .mockResolvedValueOnce([{ bodyPart: 'chest' }])  // getFilterOptions: bodyParts
        .mockResolvedValueOnce([{ equipment: 'barbell' }])  // getFilterOptions: equipments
        .mockResolvedValueOnce([{ targetMuscle: 'pectorals' }]); // getFilterOptions: targetMuscles
    }

    it('returns exercises with pagination and filters (defaults)', async () => {
      const exercises = [{ id: 'ex-1', name: 'Bench Press' }];
      setupGetExercisesMocks(exercises, 1);

      const result = await exerciseService.getExercises({ page: 1, limit: 20 });

      expect(mockPrisma.exercise.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      // First findMany call is the main exercise query
      expect(mockPrisma.exercise.findMany).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          where: { isActive: true },
          skip: 0,
          take: 20,
          orderBy: { name: 'asc' },
        })
      );
      expect(result.exercises).toEqual(exercises);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('applies search filter with OR conditions', async () => {
      setupGetExercisesMocks([], 0);

      await exerciseService.getExercises({ search: 'bench' });

      const countCall = (mockPrisma.exercise.count as jest.Mock).mock.calls[0][0];
      expect(countCall.where.OR).toEqual([
        { name: { contains: 'bench', mode: 'insensitive' } },
        { targetMuscle: { contains: 'bench', mode: 'insensitive' } },
        { bodyPart: { contains: 'bench', mode: 'insensitive' } },
      ]);
    });

    it('applies single bodyPart filter directly', async () => {
      setupGetExercisesMocks([], 0);

      await exerciseService.getExercises({ bodyPart: 'chest' });

      const countCall = (mockPrisma.exercise.count as jest.Mock).mock.calls[0][0];
      expect(countCall.where.bodyPart).toBe('chest');
    });

    it('applies multiple bodyPart filters with in operator', async () => {
      setupGetExercisesMocks([], 0);

      await exerciseService.getExercises({ bodyPart: 'chest,back' });

      const countCall = (mockPrisma.exercise.count as jest.Mock).mock.calls[0][0];
      expect(countCall.where.bodyPart).toEqual({ in: ['chest', 'back'] });
    });

    it('applies single equipment filter directly', async () => {
      setupGetExercisesMocks([], 0);

      await exerciseService.getExercises({ equipment: 'barbell' });

      const countCall = (mockPrisma.exercise.count as jest.Mock).mock.calls[0][0];
      expect(countCall.where.equipment).toBe('barbell');
    });

    it('applies multiple equipment filters with in operator', async () => {
      setupGetExercisesMocks([], 0);

      await exerciseService.getExercises({ equipment: 'barbell,dumbbell' });

      const countCall = (mockPrisma.exercise.count as jest.Mock).mock.calls[0][0];
      expect(countCall.where.equipment).toEqual({ in: ['barbell', 'dumbbell'] });
    });

    it('applies single targetMuscle filter directly', async () => {
      setupGetExercisesMocks([], 0);

      await exerciseService.getExercises({ targetMuscle: 'pectorals' });

      const countCall = (mockPrisma.exercise.count as jest.Mock).mock.calls[0][0];
      expect(countCall.where.targetMuscle).toBe('pectorals');
    });

    it('applies multiple targetMuscle filters with in operator', async () => {
      setupGetExercisesMocks([], 0);

      await exerciseService.getExercises({ targetMuscle: 'pectorals,biceps' });

      const countCall = (mockPrisma.exercise.count as jest.Mock).mock.calls[0][0];
      expect(countCall.where.targetMuscle).toEqual({ in: ['pectorals', 'biceps'] });
    });

    it('applies difficulty filter', async () => {
      setupGetExercisesMocks([], 0);

      await exerciseService.getExercises({ difficulty: 'beginner' as any });

      const countCall = (mockPrisma.exercise.count as jest.Mock).mock.calls[0][0];
      expect(countCall.where.difficulty).toBe('beginner');
    });

    it('calculates pagination correctly', async () => {
      setupGetExercisesMocks([], 55);

      const result = await exerciseService.getExercises({ page: 3, limit: 10 });

      expect(result.pagination).toEqual({
        total: 55,
        page: 3,
        limit: 10,
        totalPages: 6,
      });
      // skip = (3-1) * 10 = 20
      expect(mockPrisma.exercise.findMany).toHaveBeenNthCalledWith(1,
        expect.objectContaining({ skip: 20, take: 10 })
      );
    });

    it('uses custom sort', async () => {
      setupGetExercisesMocks([], 0);

      await exerciseService.getExercises({ sortBy: 'createdAt', sortOrder: 'desc' });

      expect(mockPrisma.exercise.findMany).toHaveBeenNthCalledWith(1,
        expect.objectContaining({ orderBy: { createdAt: 'desc' } })
      );
    });
  });

  // ─── getExerciseById ───

  describe('getExerciseById', () => {
    it('returns exercise detail with extra fields', async () => {
      const exercise = { id: 'ex-1', name: 'Squat', isActive: true };
      (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(exercise);

      const result = await exerciseService.getExerciseById('ex-1');

      expect(mockPrisma.exercise.findUnique).toHaveBeenCalledWith({ where: { id: 'ex-1' } });
      expect(result).toEqual({ ...exercise, isFavorite: false, usageCount: 0 });
    });

    it('returns null when exercise not found', async () => {
      (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await exerciseService.getExerciseById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ─── getExerciseByExerciseId ───

  describe('getExerciseByExerciseId', () => {
    it('finds by exerciseId field', async () => {
      const exercise = { id: 'ex-1', exerciseId: 'ex_001' };
      (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(exercise);

      const result = await exerciseService.getExerciseByExerciseId('ex_001');

      expect(mockPrisma.exercise.findUnique).toHaveBeenCalledWith({
        where: { exerciseId: 'ex_001' },
      });
      expect(result).toEqual(exercise);
    });

    it('returns null when not found', async () => {
      (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await exerciseService.getExerciseByExerciseId('missing');
      expect(result).toBeNull();
    });
  });

  // ─── createExercise ───

  describe('createExercise', () => {
    it('creates exercise with provided data', async () => {
      const created = { id: 'ex-new', name: 'New Exercise' };
      (mockPrisma.exercise.create as jest.Mock).mockResolvedValue(created);

      const result = await exerciseService.createExercise({
        exerciseId: 'custom_123',
        name: 'New Exercise',
        gifUrl: 'new.gif',
        bodyPart: 'chest',
        equipment: 'barbell',
        targetMuscle: 'pectorals',
        secondaryMuscles: ['triceps'],
        instructions: ['Step 1'],
        difficulty: 'intermediate',
      });

      expect(mockPrisma.exercise.create).toHaveBeenCalledWith({
        data: {
          exerciseId: 'custom_123',
          name: 'New Exercise',
          gifUrl: 'new.gif',
          bodyPart: 'chest',
          equipment: 'barbell',
          targetMuscle: 'pectorals',
          secondaryMuscles: ['triceps'],
          instructions: ['Step 1'],
          difficulty: 'intermediate',
          isActive: true,
        },
      });
      expect(result).toEqual(created);
    });

    it('generates exerciseId when not provided', async () => {
      (mockPrisma.exercise.create as jest.Mock).mockResolvedValue({ id: 'ex-new' });

      await exerciseService.createExercise({
        name: 'Auto ID',
        gifUrl: 'auto.gif',
        bodyPart: 'back',
        equipment: 'cable',
        targetMuscle: 'lats',
        secondaryMuscles: [],
        instructions: [],
      });

      const createCall = (mockPrisma.exercise.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.exerciseId).toMatch(/^custom_\d+_[a-z0-9]+$/);
    });

    it('defaults difficulty to intermediate when not provided', async () => {
      (mockPrisma.exercise.create as jest.Mock).mockResolvedValue({ id: 'ex-new' });

      await exerciseService.createExercise({
        name: 'No Difficulty',
        gifUrl: 'no-diff.gif',
        bodyPart: 'legs',
        equipment: 'bodyweight',
        targetMuscle: 'quads',
        secondaryMuscles: [],
        instructions: [],
      });

      const createCall = (mockPrisma.exercise.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.difficulty).toBe('intermediate');
    });
  });

  // ─── updateExercise ───

  describe('updateExercise', () => {
    it('updates exercise by ID', async () => {
      const updated = { id: 'ex-1', name: 'Updated Name' };
      (mockPrisma.exercise.update as jest.Mock).mockResolvedValue(updated);

      const result = await exerciseService.updateExercise('ex-1', { name: 'Updated Name' } as any);

      expect(mockPrisma.exercise.update).toHaveBeenCalledWith({
        where: { id: 'ex-1' },
        data: { name: 'Updated Name' },
      });
      expect(result).toEqual(updated);
    });
  });

  // ─── deleteExercise (soft delete) ───

  describe('deleteExercise', () => {
    it('soft deletes by setting isActive to false', async () => {
      const deleted = { id: 'ex-1', isActive: false };
      (mockPrisma.exercise.update as jest.Mock).mockResolvedValue(deleted);

      const result = await exerciseService.deleteExercise('ex-1');

      expect(mockPrisma.exercise.update).toHaveBeenCalledWith({
        where: { id: 'ex-1' },
        data: { isActive: false },
      });
      expect(result).toEqual(deleted);
    });
  });

  // ─── permanentlyDeleteExercise ───

  describe('permanentlyDeleteExercise', () => {
    it('hard deletes the exercise', async () => {
      const deleted = { id: 'ex-1' };
      (mockPrisma.exercise.delete as jest.Mock).mockResolvedValue(deleted);

      const result = await exerciseService.permanentlyDeleteExercise('ex-1');

      expect(mockPrisma.exercise.delete).toHaveBeenCalledWith({
        where: { id: 'ex-1' },
      });
      expect(result).toEqual(deleted);
    });
  });

  // ─── getFilterOptions ───

  describe('getFilterOptions', () => {
    it('returns distinct body parts, equipment, target muscles, and difficulty enum', async () => {
      // getFilterOptions makes 3 concurrent findMany calls via Promise.all
      (mockPrisma.exercise.findMany as jest.Mock)
        .mockResolvedValueOnce([{ bodyPart: 'chest' }, { bodyPart: 'back' }])
        .mockResolvedValueOnce([{ equipment: 'barbell' }])
        .mockResolvedValueOnce([{ targetMuscle: 'pectorals' }]);

      const result = await exerciseService.getFilterOptions();

      expect(result.bodyParts).toEqual(['chest', 'back']);
      expect(result.equipments).toEqual(['barbell']);
      expect(result.targetMuscles).toEqual(['pectorals']);
      // difficulties come from the DifficultyLevel enum mock
      expect(result.difficulties).toEqual(['beginner', 'intermediate', 'advanced']);
    });

    it('queries with isActive: true and distinct', async () => {
      (mockPrisma.exercise.findMany as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await exerciseService.getFilterOptions();

      // Three findMany calls for bodyPart, equipment, targetMuscle
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledTimes(3);

      const firstCall = (mockPrisma.exercise.findMany as jest.Mock).mock.calls[0][0];
      expect(firstCall.where).toEqual({ isActive: true });
      expect(firstCall.distinct).toEqual(['bodyPart']);
      expect(firstCall.select).toEqual({ bodyPart: true });
    });
  });

  // ─── searchExercises ───

  describe('searchExercises', () => {
    it('searches across multiple fields with OR', async () => {
      const exercises = [{ id: 'ex-1', name: 'Bench' }];
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue(exercises);

      const result = await exerciseService.searchExercises('bench', 5);

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
        take: 5,
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(exercises);
    });

    it('uses default limit of 10', async () => {
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([]);

      await exerciseService.searchExercises('squat');

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });
  });

  // ─── getRandomExercises ───

  describe('getRandomExercises', () => {
    it('fetches random exercises via count + random offsets', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(100);
      (mockPrisma.exercise.findFirst as jest.Mock).mockResolvedValue({ id: 'ex-rand' });

      const result = await exerciseService.getRandomExercises(3);

      expect(mockPrisma.exercise.count).toHaveBeenCalledWith({ where: { isActive: true } });
      expect(mockPrisma.exercise.findFirst).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });

    it('filters out null results', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.exercise.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 'ex-1' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'ex-3' });

      const result = await exerciseService.getRandomExercises(3);

      // One null filtered out
      expect(result).toHaveLength(2);
    });

    it('uses default count of 5', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(50);
      (mockPrisma.exercise.findFirst as jest.Mock).mockResolvedValue({ id: 'ex-1' });

      await exerciseService.getRandomExercises();

      expect(mockPrisma.exercise.findFirst).toHaveBeenCalledTimes(5);
    });
  });

  // ─── getExercisesByBodyPart ───

  describe('getExercisesByBodyPart', () => {
    it('queries exercises by body part', async () => {
      const exercises = [{ id: 'ex-1', bodyPart: 'chest' }];
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue(exercises);

      const result = await exerciseService.getExercisesByBodyPart('chest');

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith({
        where: { bodyPart: 'chest', isActive: true },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(exercises);
    });
  });

  // ─── getExercisesByTargetMuscle ───

  describe('getExercisesByTargetMuscle', () => {
    it('queries exercises by target muscle', async () => {
      const exercises = [{ id: 'ex-1', targetMuscle: 'biceps' }];
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue(exercises);

      const result = await exerciseService.getExercisesByTargetMuscle('biceps');

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith({
        where: { targetMuscle: 'biceps', isActive: true },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(exercises);
    });
  });

  // ─── getExercisesByEquipment ───

  describe('getExercisesByEquipment', () => {
    it('queries exercises by equipment', async () => {
      const exercises = [{ id: 'ex-1', equipment: 'dumbbell' }];
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue(exercises);

      const result = await exerciseService.getExercisesByEquipment('dumbbell');

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith({
        where: { equipment: 'dumbbell', isActive: true },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(exercises);
    });
  });

  // ─── getExercisesByDifficulty ───

  describe('getExercisesByDifficulty', () => {
    it('queries exercises by difficulty level', async () => {
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([]);

      await exerciseService.getExercisesByDifficulty('beginner' as any);

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith({
        where: { difficulty: 'beginner', isActive: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  // ─── importExercises ───

  describe('importExercises', () => {
    it('imports new exercises and skips existing ones', async () => {
      // First exercise exists, second is new, third fails
      (mockPrisma.exercise.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'existing' }) // exists -> skip
        .mockResolvedValueOnce(null)                // new -> import
        .mockResolvedValueOnce(null);               // new -> will fail

      (mockPrisma.exercise.create as jest.Mock)
        .mockResolvedValueOnce({ id: 'new-1' })
        .mockRejectedValueOnce(new Error('Unique constraint'));

      const exercises = [
        {
          exerciseId: 'ex_existing',
          name: 'Existing',
          gifUrl: 'e.gif',
          bodyParts: ['chest'],
          equipments: ['barbell'],
          targetMuscles: ['pectorals'],
          secondaryMuscles: [],
          instructions: [],
        },
        {
          exerciseId: 'ex_new',
          name: 'New',
          gifUrl: 'n.gif',
          bodyParts: ['back'],
          equipments: ['cable'],
          targetMuscles: ['lats'],
          secondaryMuscles: ['biceps'],
          instructions: ['Pull'],
        },
        {
          exerciseId: 'ex_fail',
          name: 'Will Fail',
          gifUrl: 'f.gif',
          bodyParts: ['legs'],
          equipments: ['machine'],
          targetMuscles: ['quads'],
          secondaryMuscles: [],
          instructions: [],
        },
      ];

      const result = await exerciseService.importExercises(exercises);

      expect(result.total).toBe(3);
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].exerciseId).toBe('ex_fail');
      expect(result.errors[0].error).toBe('Unique constraint');
    });

    it('uses fallback values for missing array fields', async () => {
      (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.exercise.create as jest.Mock).mockResolvedValue({ id: 'imported' });

      await exerciseService.importExercises([{
        exerciseId: 'ex_minimal',
        name: 'Minimal',
        gifUrl: 'min.gif',
        bodyParts: [],
        equipments: [],
        targetMuscles: [],
      }]);

      const createCall = (mockPrisma.exercise.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.bodyPart).toBe('other');
      expect(createCall.data.equipment).toBe('other');
      expect(createCall.data.targetMuscle).toBe('other');
      expect(createCall.data.secondaryMuscles).toEqual([]);
      expect(createCall.data.instructions).toEqual([]);
    });

    it('handles non-Error exceptions', async () => {
      (mockPrisma.exercise.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.exercise.create as jest.Mock).mockRejectedValue('string error');

      const result = await exerciseService.importExercises([{
        exerciseId: 'ex_nonstandard',
        name: 'Non-standard error',
        gifUrl: 'ns.gif',
        bodyParts: ['chest'],
        equipments: ['barbell'],
        targetMuscles: ['pectorals'],
      }]);

      expect(result.failed).toBe(1);
      expect(result.errors[0].error).toBe('Unknown error');
    });

    it('returns zeros for empty input', async () => {
      const result = await exerciseService.importExercises([]);

      expect(result).toEqual({
        total: 0,
        imported: 0,
        skipped: 0,
        failed: 0,
        errors: [],
      });
    });
  });

  // ─── Singleton export ───

  describe('singleton export', () => {
    it('exports a singleton instance', () => {
      expect(exerciseService).toBeInstanceOf(ExerciseService);
    });
  });
});
