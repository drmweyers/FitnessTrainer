import { ExerciseFilterService } from '@/services/exerciseFilterService';
import { prisma } from '@/index';

// Mock Prisma Client
jest.mock('@/index', () => ({
  prisma: {
    exercise: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

describe('ExerciseFilterService', () => {
  let exerciseFilterService: ExerciseFilterService;
  const mockPrisma = prisma as any;

  beforeEach(() => {
    exerciseFilterService = new ExerciseFilterService();
    jest.clearAllMocks();
  });

  describe('getAvailableFilters', () => {
    it('should return all available filter options', async () => {
      // Mock the groupBy calls for distinct values
      mockPrisma.exercise.groupBy
        .mockResolvedValueOnce([{ bodyPart: 'chest' }, { bodyPart: 'back' }])
        .mockResolvedValueOnce([{ equipment: 'barbell' }, { equipment: 'dumbbell' }])
        .mockResolvedValueOnce([{ targetMuscle: 'pectorals' }, { targetMuscle: 'quadriceps' }]);

      const filters = await exerciseFilterService.getAvailableFilters();

      expect(filters).toHaveProperty('bodyParts');
      expect(filters).toHaveProperty('equipment');
      expect(filters).toHaveProperty('targetMuscles');
      expect(filters.bodyParts).toEqual(expect.arrayContaining(['chest', 'back']));
      expect(filters.equipment).toEqual(expect.arrayContaining(['barbell', 'dumbbell']));
      expect(filters.targetMuscles).toEqual(expect.arrayContaining(['pectorals', 'quadriceps']));
    });

    it('should return empty arrays when no exercises exist', async () => {
      mockPrisma.exercise.groupBy.mockResolvedValue([]);

      const filters = await exerciseFilterService.getAvailableFilters();

      expect(filters.bodyParts).toEqual([]);
      expect(filters.equipment).toEqual([]);
      expect(filters.targetMuscles).toEqual([]);
    });
  });

  describe('filterExercises', () => {
    it('should filter by single body part', async () => {
      const mockExercises = [
        {
          id: 'ex-1',
          exerciseId: 'ex_1',
          name: 'Bench Press',
          bodyPart: 'chest',
          equipment: 'barbell',
          targetMuscle: 'pectorals',
          gifUrl: 'https://example.com/bench.gif',
        },
      ];

      mockPrisma.exercise.count.mockResolvedValue(1);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await exerciseFilterService.filterExercises({
        bodyParts: ['chest'],
      });

      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].bodyPart).toBe('chest');
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { bodyPart: { in: ['chest'] } },
            ]),
          }),
        })
      );
    });

    it('should filter by multiple body parts', async () => {
      const mockExercises = [
        {
          id: 'ex-1',
          exerciseId: 'ex_1',
          name: 'Bench Press',
          bodyPart: 'chest',
          equipment: 'barbell',
          targetMuscle: 'pectorals',
          gifUrl: 'https://example.com/bench.gif',
        },
        {
          id: 'ex-2',
          exerciseId: 'ex_2',
          name: 'Barbell Row',
          bodyPart: 'back',
          equipment: 'barbell',
          targetMuscle: 'lats',
          gifUrl: 'https://example.com/row.gif',
        },
      ];

      mockPrisma.exercise.count.mockResolvedValue(2);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await exerciseFilterService.filterExercises({
        bodyParts: ['chest', 'back'],
      });

      expect(result.exercises).toHaveLength(2);
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { bodyPart: { in: ['chest', 'back'] } },
            ]),
          }),
        })
      );
    });

    it('should filter by equipment type', async () => {
      const mockExercises = [
        {
          id: 'ex-1',
          exerciseId: 'ex_1',
          name: 'Bench Press',
          bodyPart: 'chest',
          equipment: 'barbell',
          targetMuscle: 'pectorals',
          gifUrl: 'https://example.com/bench.gif',
        },
      ];

      mockPrisma.exercise.count.mockResolvedValue(1);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await exerciseFilterService.filterExercises({
        equipment: ['barbell'],
      });

      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].equipment).toBe('barbell');
    });

    it('should filter by target muscle', async () => {
      const mockExercises = [
        {
          id: 'ex-1',
          exerciseId: 'ex_1',
          name: 'Bench Press',
          bodyPart: 'chest',
          equipment: 'barbell',
          targetMuscle: 'pectorals',
          gifUrl: 'https://example.com/bench.gif',
        },
      ];

      mockPrisma.exercise.count.mockResolvedValue(1);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await exerciseFilterService.filterExercises({
        targetMuscles: ['pectorals'],
      });

      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].targetMuscle).toBe('pectorals');
    });

    it('should combine multiple filters', async () => {
      const mockExercises = [
        {
          id: 'ex-1',
          exerciseId: 'ex_1',
          name: 'Bench Press',
          bodyPart: 'chest',
          equipment: 'barbell',
          targetMuscle: 'pectorals',
          gifUrl: 'https://example.com/bench.gif',
        },
      ];

      mockPrisma.exercise.count.mockResolvedValue(1);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await exerciseFilterService.filterExercises({
        bodyParts: ['chest'],
        equipment: ['barbell'],
        targetMuscles: ['pectorals'],
      });

      expect(result.exercises).toHaveLength(1);
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { bodyPart: { in: ['chest'] } },
              { equipment: { in: ['barbell'] } },
              { targetMuscle: { in: ['pectorals'] } },
            ]),
          }),
        })
      );
    });

    it('should return empty array when no matches', async () => {
      mockPrisma.exercise.count.mockResolvedValue(0);
      mockPrisma.exercise.findMany.mockResolvedValue([]);

      const result = await exerciseFilterService.filterExercises({
        bodyParts: ['chest'],
        equipment: ['dumbbell'],
      });

      expect(result.exercises).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return all exercises when no filters provided', async () => {
      const mockExercises = [
        {
          id: 'ex-1',
          exerciseId: 'ex_1',
          name: 'Bench Press',
          bodyPart: 'chest',
          equipment: 'barbell',
          targetMuscle: 'pectorals',
          gifUrl: 'https://example.com/bench.gif',
        },
      ];

      mockPrisma.exercise.count.mockResolvedValue(1);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await exerciseFilterService.filterExercises({});

      expect(result.exercises).toHaveLength(1);
    });

    it('should respect pagination options', async () => {
      const mockExercises = [
        {
          id: 'ex-1',
          exerciseId: 'ex_1',
          name: 'Bench Press',
          bodyPart: 'chest',
          equipment: 'barbell',
          targetMuscle: 'pectorals',
          gifUrl: 'https://example.com/bench.gif',
        },
      ];

      mockPrisma.exercise.count.mockResolvedValue(10);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await exerciseFilterService.filterExercises(
        { bodyParts: ['chest'] },
        { limit: 5, offset: 0 }
      );

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 0,
        })
      );
      expect(result.total).toBe(10);
    });
  });

  describe('getDefaultPresets', () => {
    it('should return default filter presets', () => {
      const presets = exerciseFilterService.getDefaultPresets();

      expect(presets).toHaveProperty('upperBody');
      expect(presets).toHaveProperty('lowerBody');
      expect(presets).toHaveProperty('noEquipment');
      expect(presets).toHaveProperty('fullBody');
      expect(presets.upperBody).toHaveProperty('name');
      expect(presets.upperBody).toHaveProperty('filters');
    });

    it('should have correct filters for upper body preset', () => {
      const presets = exerciseFilterService.getDefaultPresets();

      expect(presets.upperBody?.filters.bodyParts).toContain('chest');
      expect(presets.upperBody?.filters.bodyParts).toContain('back');
      expect(presets.upperBody?.filters.bodyParts).toContain('shoulders');
    });

    it('should have correct filters for no equipment preset', () => {
      const presets = exerciseFilterService.getDefaultPresets();

      expect(presets.noEquipment?.filters.equipment).toContain('body weight');
    });
  });
});
