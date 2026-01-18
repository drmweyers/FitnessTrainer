import { ExerciseSearchService } from '@/services/exerciseSearchService';
import { prisma } from '@/index';
import { createError } from '@/middleware/errorHandler';

// Mock Prisma Client
jest.mock('@/index', () => ({
  prisma: {
    exercise: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    exerciseSearchHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  },
}));

// Mock the error handler
jest.mock('@/middleware/errorHandler', () => ({
  createError: jest.fn((statusCode, message) => ({
    statusCode,
    message,
  })),
}));

describe('ExerciseSearchService', () => {
  let exerciseSearchService: ExerciseSearchService;
  const mockPrisma = prisma as any;

  beforeEach(() => {
    exerciseSearchService = new ExerciseSearchService();
    jest.clearAllMocks();
  });

  describe('searchExercises', () => {
    it('should return exercises matching the search query', async () => {
      const mockExercises = [
        {
          id: 'ex-1',
          exerciseId: 'ex_1',
          name: 'Barbell Bench Press',
          bodyPart: 'chest',
          equipment: 'barbell',
          targetMuscle: 'pectorals',
          secondaryMuscles: ['triceps', 'front_delt'],
          instructions: ['Lie on bench', 'Grip bar', 'Lower weight'],
          difficulty: 'intermediate',
          gifUrl: 'https://example.com/bench.gif',
        },
        {
          id: 'ex-2',
          exerciseId: 'ex_2',
          name: 'Incline Barbell Bench Press',
          bodyPart: 'chest',
          equipment: 'barbell',
          targetMuscle: 'pectorals',
          secondaryMuscles: ['triceps', 'front_delt'],
          instructions: ['Set incline', 'Grip bar', 'Press up'],
          difficulty: 'intermediate',
          gifUrl: 'https://example.com/incline-bench.gif',
        },
      ];

      mockPrisma.exercise.count.mockResolvedValue(2);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await exerciseSearchService.searchExercises('bench press', 'user-123');

      expect(result).toEqual({
        exercises: mockExercises,
        total: 2,
        query: 'bench press',
      });
      expect(mockPrisma.exercise.count).toHaveBeenCalled();
      expect(mockPrisma.exercise.findMany).toHaveBeenCalled();
    });

    it('should handle empty query by returning all exercises', async () => {
      const mockExercises = [
        {
          id: 'ex-1',
          exerciseId: 'ex_1',
          name: 'Squat',
          bodyPart: 'upper legs',
          equipment: 'barbell',
          targetMuscle: 'quadriceps',
          secondaryMuscles: ['glutes', 'hamstrings'],
          instructions: ['Stand with bar', 'Squat down'],
          difficulty: 'intermediate',
          gifUrl: 'https://example.com/squat.gif',
        },
      ];

      mockPrisma.exercise.count.mockResolvedValue(1);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await exerciseSearchService.searchExercises('', 'user-123');

      expect(result.exercises).toEqual(mockExercises);
      expect(mockPrisma.exercise.findMany).toHaveBeenCalled();
    });

    it('should search within instructions when searchInInstructions is true', async () => {
      const mockExercises = [
        {
          id: 'ex-1',
          exerciseId: 'ex_1',
          name: 'Deadlift',
          bodyPart: 'back',
          equipment: 'barbell',
          targetMuscle: 'spine',
          secondaryMuscles: ['glutes', 'hamstrings'],
          instructions: ['Keep back straight', 'Drive through heels'],
          difficulty: 'advanced',
          gifUrl: 'https://example.com/deadlift.gif',
        },
      ];

      mockPrisma.exercise.count.mockResolvedValue(1);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await exerciseSearchService.searchExercises(
        'back straight',
        'user-123',
        { searchInInstructions: true }
      );

      expect(result.exercises).toEqual(mockExercises);
    });

    it('should limit results when limit is specified', async () => {
      const mockExercises = Array.from({ length: 5 }, (_, i) => ({
        id: `ex-${i}`,
        exerciseId: `ex_${i}`,
        name: `Exercise ${i}`,
        bodyPart: 'chest',
        equipment: 'barbell',
        targetMuscle: 'pectorals',
        secondaryMuscles: [],
        instructions: [],
        difficulty: 'intermediate',
        gifUrl: `https://example.com/ex${i}.gif`,
      }));

      mockPrisma.exercise.count.mockResolvedValue(10);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await exerciseSearchService.searchExercises('exercise', 'user-123', { limit: 5 });

      expect(result.exercises).toHaveLength(5);
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it('should save search history when userId is provided', async () => {
      const mockExercises = [
        {
          id: 'ex-1',
          exerciseId: 'ex_1',
          name: 'Bench Press',
          bodyPart: 'chest',
          equipment: 'barbell',
          targetMuscle: 'pectorals',
          secondaryMuscles: [],
          instructions: [],
          difficulty: 'intermediate',
          gifUrl: 'https://example.com/bench.gif',
        },
      ];

      mockPrisma.exercise.count.mockResolvedValue(1);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);
      mockPrisma.exerciseSearchHistory.create.mockResolvedValue({});

      await exerciseSearchService.searchExercises('bench press', 'user-123');

      expect(mockPrisma.exerciseSearchHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-123',
            searchQuery: 'bench press',
            resultCount: 1,
          }),
        })
      );
    });

    it('should return empty array when no results found', async () => {
      mockPrisma.exercise.count.mockResolvedValue(0);
      mockPrisma.exercise.findMany.mockResolvedValue([]);

      const result = await exerciseSearchService.searchExercises('nonexistent exercise', 'user-123');

      expect(result.exercises).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getSuggestions', () => {
    it('should return exercise name suggestions based on query', async () => {
      const mockExercises = [
        {
          id: 'ex-1',
          name: 'Barbell Bench Press',
          bodyPart: 'chest',
          equipment: 'barbell',
          gifUrl: 'https://example.com/bench.gif',
        },
        {
          id: 'ex-2',
          name: 'Dumbbell Bench Press',
          bodyPart: 'chest',
          equipment: 'dumbbell',
          gifUrl: 'https://example.com/db-bench.gif',
        },
      ];

      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await exerciseSearchService.getSuggestions('bench');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        exerciseId: 'ex-1',
        name: 'Barbell Bench Press',
      });
      expect(result[0]?.matchHighlight).toContain('<mark>');
      expect(result[0]?.matchHighlight.toLowerCase()).toContain('bench');
    });

    it('should limit suggestions to 10 results', async () => {
      const mockExercises = Array.from({ length: 10 }, (_, i) => ({
        id: `ex-${i}`,
        name: `Bench Press Variation ${i}`,
        bodyPart: 'chest',
        equipment: 'barbell',
        gifUrl: `https://example.com/bench${i}.gif`,
      }));

      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await exerciseSearchService.getSuggestions('bench');

      expect(result.length).toBeLessThanOrEqual(10);
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should return empty array when query is too short', async () => {
      const result = await exerciseSearchService.getSuggestions('b');

      expect(result).toEqual([]);
      expect(mockPrisma.exercise.findMany).not.toHaveBeenCalled();
    });
  });

  describe('saveSearchHistory', () => {
    it('should save search history entry', async () => {
      mockPrisma.exerciseSearchHistory.create.mockResolvedValue({
        id: 'history-1',
        userId: 'user-123',
        searchQuery: 'bench press',
        resultCount: 5,
        searchedAt: new Date(),
      });

      await exerciseSearchService.saveSearchHistory('user-123', 'bench press', 5);

      expect(mockPrisma.exerciseSearchHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          searchQuery: 'bench press',
          resultCount: 5,
        },
      });
    });
  });

  describe('getSearchHistory', () => {
    it('should return users search history ordered by most recent', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          userId: 'user-123',
          searchQuery: 'bench press',
          resultCount: 5,
          searchedAt: new Date('2025-01-10T10:00:00Z'),
        },
        {
          id: 'history-2',
          userId: 'user-123',
          searchQuery: 'squat',
          resultCount: 3,
          searchedAt: new Date('2025-01-09T10:00:00Z'),
        },
      ];

      mockPrisma.exerciseSearchHistory.findMany.mockResolvedValue(mockHistory);

      const result = await exerciseSearchService.getSearchHistory('user-123');

      expect(result).toEqual(mockHistory);
      expect(mockPrisma.exerciseSearchHistory.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { searchedAt: 'desc' },
        take: 20,
      });
    });

    it('should limit history to 20 entries by default', async () => {
      mockPrisma.exerciseSearchHistory.findMany.mockResolvedValue([]);

      await exerciseSearchService.getSearchHistory('user-123');

      expect(mockPrisma.exerciseSearchHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      );
    });

    it('should respect custom limit parameter', async () => {
      mockPrisma.exerciseSearchHistory.findMany.mockResolvedValue([]);

      await exerciseSearchService.getSearchHistory('user-123', 10);

      expect(mockPrisma.exerciseSearchHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });
  });

  describe('clearSearchHistory', () => {
    it('should clear all search history for user', async () => {
      mockPrisma.exerciseSearchHistory.deleteMany.mockResolvedValue({ count: 5 });

      await exerciseSearchService.clearSearchHistory('user-123');

      expect(mockPrisma.exerciseSearchHistory.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should return success message after clearing', async () => {
      mockPrisma.exerciseSearchHistory.deleteMany.mockResolvedValue({ count: 3 });

      const result = await exerciseSearchService.clearSearchHistory('user-123');

      expect(result).toEqual({ success: true, message: 'Search history cleared' });
    });
  });
});
