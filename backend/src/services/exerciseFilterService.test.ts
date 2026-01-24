import { ExerciseFilterService } from './exerciseFilterService';
import { prisma } from '@/index';

// Mock prisma
jest.mock('@/index', () => ({
  prisma: {
    exercise: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('ExerciseFilterService', () => {
  let filterService: ExerciseFilterService;

  beforeEach(() => {
    jest.clearAllMocks();
    filterService = new ExerciseFilterService();
  });

  const mockExercises = [
    {
      id: '1',
      exerciseId: 'ex1',
      name: 'Push-up',
      bodyPart: 'chest',
      equipment: 'body weight',
      targetMuscle: 'pectorals',
      secondaryMuscles: ['triceps'],
      difficulty: 'beginner',
      gifUrl: 'http://example.com/pushup.gif',
    },
    {
      id: '2',
      exerciseId: 'ex2',
      name: 'Bench Press',
      bodyPart: 'chest',
      equipment: 'barbell',
      targetMuscle: 'pectorals',
      secondaryMuscles: ['triceps'],
      difficulty: 'intermediate',
      gifUrl: 'http://example.com/bench.gif',
    },
    {
      id: '3',
      exerciseId: 'ex3',
      name: 'Squat',
      bodyPart: 'upper legs',
      equipment: 'barbell',
      targetMuscle: 'quads',
      secondaryMuscles: ['glutes', 'hamstrings'],
      difficulty: 'intermediate',
      gifUrl: 'http://example.com/squat.gif',
    },
  ];

  describe('getAvailableFilters', () => {
    it('should get all distinct body parts', async () => {
      (mockPrisma.exercise.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { bodyPart: 'chest' },
          { bodyPart: 'back' },
          { bodyPart: 'legs' },
        ] as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await filterService.getAvailableFilters();

      expect(result.bodyParts).toEqual(['chest', 'back', 'legs']);
    });

    it('should get all distinct equipment', async () => {
      (mockPrisma.exercise.groupBy as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { equipment: 'barbell' },
          { equipment: 'dumbbell' },
          { equipment: 'body weight' },
        ] as any)
        .mockResolvedValueOnce([]);

      const result = await filterService.getAvailableFilters();

      expect(result.equipment).toEqual(['barbell', 'dumbbell', 'body weight']);
    });

    it('should get all distinct target muscles', async () => {
      (mockPrisma.exercise.groupBy as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { targetMuscle: 'pectorals' },
          { targetMuscle: 'lats' },
          { targetMuscle: 'quads' },
        ] as any);

      const result = await filterService.getAvailableFilters();

      expect(result.targetMuscles).toEqual(['pectorals', 'lats', 'quads']);
    });

    it('should only get active exercises', async () => {
      (mockPrisma.exercise.groupBy as jest.Mock)
        .mockResolvedValueOnce([{ bodyPart: 'chest' }] as any)
        .mockResolvedValueOnce([{ equipment: 'barbell' }] as any)
        .mockResolvedValueOnce([{ targetMuscle: 'pectorals' }] as any);

      await filterService.getAvailableFilters();

      expect(mockPrisma.exercise.groupBy).toHaveBeenCalledTimes(3);
    });

    it('should order body parts alphabetically', async () => {
      (mockPrisma.exercise.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { bodyPart: 'legs' },
          { bodyPart: 'back' },
          { bodyPart: 'chest' },
        ] as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await filterService.getAvailableFilters();

      expect(mockPrisma.exercise.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { bodyPart: 'asc' },
        })
      );
    });

    it('should order equipment alphabetically', async () => {
      (mockPrisma.exercise.groupBy as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { equipment: 'dumbbell' },
          { equipment: 'barbell' },
        ] as any)
        .mockResolvedValueOnce([]);

      await filterService.getAvailableFilters();

      expect(mockPrisma.exercise.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { equipment: 'asc' },
        })
      );
    });

    it('should order target muscles alphabetically', async () => {
      (mockPrisma.exercise.groupBy as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { targetMuscle: 'quads' },
          { targetMuscle: 'lats' },
        ] as any);

      await filterService.getAvailableFilters();

      expect(mockPrisma.exercise.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { targetMuscle: 'asc' },
        })
      );
    });
  });

  describe('filterExercises', () => {
    it('should filter by body parts', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([mockExercises[0], mockExercises[1]]);

      const result = await filterService.filterExercises({
        bodyParts: ['chest'],
      });

      expect(result.exercises).toHaveLength(2);
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              {
                bodyPart: { in: ['chest'] },
              },
            ],
          }),
        })
      );
    });

    it('should filter by equipment', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([mockExercises[1], mockExercises[2]]);

      const result = await filterService.filterExercises({
        equipment: ['barbell'],
      });

      expect(result.exercises).toHaveLength(2);
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              {
                equipment: { in: ['barbell'] },
              },
            ],
          }),
        })
      );
    });

    it('should filter by target muscles', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([mockExercises[0], mockExercises[1]]);

      const result = await filterService.filterExercises({
        targetMuscles: ['pectorals'],
      });

      expect(result.exercises).toHaveLength(2);
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              {
                targetMuscle: { in: ['pectorals'] },
              },
            ],
          }),
        })
      );
    });

    it('should filter by multiple criteria', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([mockExercises[1]]);

      const result = await filterService.filterExercises({
        bodyParts: ['chest'],
        equipment: ['barbell'],
        targetMuscles: ['pectorals'],
      });

      expect(result.exercises).toHaveLength(1);
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              { bodyPart: { in: ['chest'] } },
              { equipment: { in: ['barbell'] } },
              { targetMuscle: { in: ['pectorals'] } },
            ],
          }),
        })
      );
    });

    it('should return all active exercises when no filters provided', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(3);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue(mockExercises);

      const result = await filterService.filterExercises({});

      expect(result.exercises).toHaveLength(3);
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });

    it('should only return active exercises', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([mockExercises[0], mockExercises[1]]);

      await filterService.filterExercises({
        bodyParts: ['chest'],
      });

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });

    it('should respect limit parameter', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([mockExercises[0]]);

      await filterService.filterExercises(
        { bodyParts: ['chest'] },
        { limit: 5 }
      );

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it('should use default limit of 50', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue(mockExercises);

      await filterService.filterExercises({ bodyParts: ['chest'] });

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it('should respect offset parameter', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([mockExercises[0]]);

      await filterService.filterExercises(
        { bodyParts: ['chest'] },
        { offset: 10 }
      );

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
        })
      );
    });

    it('should order results by name ascending', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([mockExercises[0], mockExercises[1]]);

      await filterService.filterExercises({
        bodyParts: ['chest'],
      });

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ name: 'asc' }],
        })
      );
    });

    it('should return correct filter result structure', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([mockExercises[0], mockExercises[1]]);

      const result = await filterService.filterExercises({
        bodyParts: ['chest'],
      });

      expect(result).toHaveProperty('exercises');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('filters');
      expect(Array.isArray(result.exercises)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.filters).toBe('object');
    });

    it('should return the applied filters in result', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([mockExercises[0], mockExercises[1]]);

      const filters = { bodyParts: ['chest'], equipment: ['barbell'] };
      const result = await filterService.filterExercises(filters);

      expect(result.filters).toEqual(filters);
    });
  });

  describe('getDefaultPresets', () => {
    it('should return upper body preset', () => {
      const presets = filterService.getDefaultPresets();

      expect(presets.upperBody).toEqual({
        id: 'upper-body',
        name: 'Upper Body',
        description: 'Chest, Back, Shoulders, and Arms',
        filters: {
          bodyParts: ['chest', 'back', 'shoulders', 'upper arms', 'lower arms'],
        },
      });
    });

    it('should return lower body preset', () => {
      const presets = filterService.getDefaultPresets();

      expect(presets.lowerBody).toEqual({
        id: 'lower-body',
        name: 'Lower Body',
        description: 'Legs and Glutes',
        filters: {
          bodyParts: ['upper legs', 'lower legs'],
        },
      });
    });

    it('should return no equipment preset', () => {
      const presets = filterService.getDefaultPresets();

      expect(presets.noEquipment).toEqual({
        id: 'no-equipment',
        name: 'No Equipment',
        description: 'Body weight exercises only',
        filters: {
          equipment: ['body weight'],
        },
      });
    });

    it('should return full body preset', () => {
      const presets = filterService.getDefaultPresets();

      expect(presets.fullBody).toEqual({
        id: 'full-body',
        name: 'Full Body',
        description: 'Complete body workout',
        filters: {
          bodyParts: ['chest', 'back', 'shoulders', 'upper legs', 'lower legs'],
        },
      });
    });

    it('should return core preset', () => {
      const presets = filterService.getDefaultPresets();

      expect(presets.core).toEqual({
        id: 'core',
        name: 'Core',
        description: 'Abs and Obliques',
        filters: {
          targetMuscles: ['abs', 'obliques'],
        },
      });
    });

    it('should return chest focus preset', () => {
      const presets = filterService.getDefaultPresets();

      expect(presets.chest).toEqual({
        id: 'chest',
        name: 'Chest Focus',
        description: 'Chest and supporting muscles',
        filters: {
          bodyParts: ['chest'],
          targetMuscles: ['pectorals'],
        },
      });
    });

    it('should return back focus preset', () => {
      const presets = filterService.getDefaultPresets();

      expect(presets.back).toEqual({
        id: 'back',
        name: 'Back Focus',
        description: 'Back and supporting muscles',
        filters: {
          bodyParts: ['back'],
          targetMuscles: ['lats', 'traps', 'spine'],
        },
      });
    });

    it('should return legs focus preset', () => {
      const presets = filterService.getDefaultPresets();

      expect(presets.legs).toEqual({
        id: 'legs',
        name: 'Legs Focus',
        description: 'Complete leg training',
        filters: {
          bodyParts: ['upper legs', 'lower legs'],
          targetMuscles: ['quads', 'hamstrings', 'glutes'],
        },
      });
    });

    it('should return shoulders focus preset', () => {
      const presets = filterService.getDefaultPresets();

      expect(presets.shoulders).toEqual({
        id: 'shoulders',
        name: 'Shoulders Focus',
        description: 'Shoulder and arm training',
        filters: {
          bodyParts: ['shoulders'],
          targetMuscles: ['delts'],
        },
      });
    });

    it('should return all presets', () => {
      const presets = filterService.getDefaultPresets();

      expect(Object.keys(presets)).toHaveLength(9);
      expect(presets).toHaveProperty('upperBody');
      expect(presets).toHaveProperty('lowerBody');
      expect(presets).toHaveProperty('noEquipment');
      expect(presets).toHaveProperty('fullBody');
      expect(presets).toHaveProperty('core');
      expect(presets).toHaveProperty('chest');
      expect(presets).toHaveProperty('back');
      expect(presets).toHaveProperty('legs');
      expect(presets).toHaveProperty('shoulders');
    });
  });

  describe('getPresetById', () => {
    it('should return upper body preset by id', () => {
      const preset = filterService.getPresetById('upper-body');

      expect(preset).not.toBeNull();
      expect(preset?.id).toBe('upper-body');
    });

    it('should return lower body preset by id', () => {
      const preset = filterService.getPresetById('lower-body');

      expect(preset).not.toBeNull();
      expect(preset?.id).toBe('lower-body');
    });

    it('should return null for non-existent preset', () => {
      const preset = filterService.getPresetById('non-existent');

      expect(preset).toBeNull();
    });
  });

  describe('applyPreset', () => {
    it('should apply upper body preset', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue(mockExercises);

      const result = await filterService.applyPreset('upper-body');

      expect(result.exercises).toBeDefined();
      expect(result.filters.bodyParts).toContain('chest');
      expect(result.filters.bodyParts).toContain('back');
    });

    it('should apply no equipment preset', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([mockExercises[0]]);

      const result = await filterService.applyPreset('no-equipment');

      expect(result.exercises).toBeDefined();
      expect(result.filters.equipment).toContain('body weight');
    });

    it('should apply core preset', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(3);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue(mockExercises);

      const result = await filterService.applyPreset('core');

      expect(result.exercises).toBeDefined();
      expect(result.filters.targetMuscles).toContain('abs');
      expect(result.filters.targetMuscles).toContain('obliques');
    });

    it('should throw error for non-existent preset', async () => {
      await expect(filterService.applyPreset('non-existent')).rejects.toThrow(
        'Preset not found: non-existent'
      );
    });

    it('should respect pagination options when applying preset', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue([mockExercises[0]]);

      await filterService.applyPreset('upper-body', { limit: 5, offset: 10 });

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 10,
        })
      );
    });

    it('should use default pagination when not provided', async () => {
      (mockPrisma.exercise.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.exercise.findMany as jest.Mock).mockResolvedValue(mockExercises);

      await filterService.applyPreset('upper-body');

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0,
        })
      );
    });
  });
});
