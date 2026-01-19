import { ExerciseSearchService } from './exerciseSearchService';
import { prisma } from '@/index';

// Mock prisma
jest.mock('@/index', () => ({
  prisma: {
    exercise: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      create: jest.fn(),
    },
    exerciseSearchHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('ExerciseSearchService', () => {
  let searchService: ExerciseSearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    searchService = new ExerciseSearchService();
  });

  describe('searchExercises', () => {
    const mockExercises = [
      {
        id: '1',
        exerciseId: 'ex1',
        name: 'Push-up',
        bodyPart: 'chest',
        equipment: 'body weight',
        targetMuscle: 'pectorals',
        secondaryMuscles: ['triceps', 'front delt'],
        instructions: ['Start in plank position', 'Lower body', 'Push up'],
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
        secondaryMuscles: ['triceps', 'front delt'],
        instructions: ['Lie on bench', 'Grip bar', 'Lower and press'],
        difficulty: 'intermediate',
        gifUrl: 'http://example.com/bench.gif',
      },
    ];

    it('should search exercises by name', async () => {
      mockPrisma.exercise.count.mockResolvedValue(1);
      mockPrisma.exercise.findMany.mockResolvedValue([mockExercises[0]]);

      const result = await searchService.searchExercises('push');

      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].name).toBe('Push-up');
      expect(result.total).toBe(1);
      expect(result.query).toBe('push');
    });

    it('should search exercises by body part', async () => {
      mockPrisma.exercise.count.mockResolvedValue(2);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await searchService.searchExercises('chest');

      expect(result.exercises).toHaveLength(2);
      expect(result.exercises[0].bodyPart).toBe('chest');
      expect(result.exercises[1].bodyPart).toBe('chest');
    });

    it('should search exercises by target muscle', async () => {
      mockPrisma.exercise.count.mockResolvedValue(2);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await searchService.searchExercises('pectorals');

      expect(result.exercises).toHaveLength(2);
      expect(result.exercises[0].targetMuscle).toBe('pectorals');
    });

    it('should search exercises by equipment', async () => {
      mockPrisma.exercise.count.mockResolvedValue(1);
      mockPrisma.exercise.findMany.mockResolvedValue([mockExercises[1]]);

      const result = await searchService.searchExercises('barbell');

      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].equipment).toBe('barbell');
    });

    it('should handle empty query and return all active exercises', async () => {
      mockPrisma.exercise.count.mockResolvedValue(2);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await searchService.searchExercises('');

      expect(result.exercises).toHaveLength(2);
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });

    it('should respect limit parameter', async () => {
      mockPrisma.exercise.count.mockResolvedValue(10);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      await searchService.searchExercises('push', undefined, { limit: 5 });

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it('should respect offset parameter', async () => {
      mockPrisma.exercise.count.mockResolvedValue(10);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      await searchService.searchExercises('push', undefined, { offset: 10 });

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
        })
      );
    });

    it('should search in instructions when enabled', async () => {
      mockPrisma.exercise.count.mockResolvedValue(1);
      mockPrisma.exercise.findMany.mockResolvedValue([mockExercises[0]]);

      await searchService.searchExercises('plank', undefined, { searchInInstructions: true });

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                instructions: { hasSome: ['plank'] },
              }),
            ]),
          }),
        })
      );
    });

    it('should not search in instructions by default', async () => {
      mockPrisma.exercise.count.mockResolvedValue(0);
      mockPrisma.exercise.findMany.mockResolvedValue([]);

      await searchService.searchExercises('plank');

      const whereClause = mockPrisma.exercise.findMany.mock.calls[0][0].where;
      const hasInstructionsSearch = whereClause.OR.some(
        (condition: any) => condition.instructions
      );

      expect(hasInstructionsSearch).toBe(false);
    });

    it('should only return active exercises', async () => {
      mockPrisma.exercise.count.mockResolvedValue(1);
      mockPrisma.exercise.findMany.mockResolvedValue([mockExercises[0]]);

      await searchService.searchExercises('push');

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });

    it('should order results by name ascending', async () => {
      mockPrisma.exercise.count.mockResolvedValue(2);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      await searchService.searchExercises('push');

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ name: 'asc' }],
        })
      );
    });

    it('should save search history when userId provided', async () => {
      mockPrisma.exercise.count.mockResolvedValue(2);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);
      mockPrisma.exerciseSearchHistory.create.mockResolvedValue({} as any);

      await searchService.searchExercises('push', 'user123');

      expect(mockPrisma.exerciseSearchHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user123',
          searchQuery: 'push',
          resultCount: 2,
        },
      });
    });

    it('should not save search history when userId not provided', async () => {
      mockPrisma.exercise.count.mockResolvedValue(2);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      await searchService.searchExercises('push');

      expect(mockPrisma.exerciseSearchHistory.create).not.toHaveBeenCalled();
    });

    it('should not save search history for empty query', async () => {
      mockPrisma.exercise.count.mockResolvedValue(2);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      await searchService.searchExercises('', 'user123');

      expect(mockPrisma.exerciseSearchHistory.create).not.toHaveBeenCalled();
    });

    it('should handle search history save failure gracefully', async () => {
      mockPrisma.exercise.count.mockResolvedValue(2);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);
      mockPrisma.exerciseSearchHistory.create.mockRejectedValue(new Error('DB Error'));

      const result = await searchService.searchExercises('push', 'user123');

      // Should still return results even if history save fails
      expect(result.exercises).toHaveLength(2);
    });

    it('should return correct search result structure', async () => {
      mockPrisma.exercise.count.mockResolvedValue(2);
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await searchService.searchExercises('push');

      expect(result).toHaveProperty('exercises');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('query');
      expect(Array.isArray(result.exercises)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.query).toBe('string');
    });
  });

  describe('getSuggestions', () => {
    const mockExercises = [
      {
        id: '1',
        name: 'Push-up',
        bodyPart: 'chest',
        equipment: 'body weight',
        gifUrl: 'http://example.com/pushup.gif',
      },
      {
        id: '2',
        name: 'Pull-up',
        bodyPart: 'back',
        equipment: 'body weight',
        gifUrl: 'http://example.com/pullup.gif',
      },
      {
        id: '3',
        name: 'Push Press',
        bodyPart: 'shoulders',
        equipment: 'barbell',
        gifUrl: 'http://example.com/pushpress.gif',
      },
    ];

    it('should return empty array for query less than 2 characters', async () => {
      const result = await searchService.getSuggestions('p');

      expect(result).toHaveLength(0);
      expect(mockPrisma.exercise.findMany).not.toHaveBeenCalled();
    });

    it('should return suggestions for 2+ character query', async () => {
      mockPrisma.exercise.findMany.mockResolvedValue([mockExercises[0], mockExercises[2]]);

      const result = await searchService.getSuggestions('push');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Push-up');
      expect(result[1].name).toBe('Push Press');
    });

    it('should respect custom limit', async () => {
      mockPrisma.exercise.findMany.mockResolvedValue([mockExercises[0]]);

      await searchService.getSuggestions('push', 5);

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it('should use default limit of 10', async () => {
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      await searchService.getSuggestions('push');

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should only return active exercises', async () => {
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      await searchService.getSuggestions('push');

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });

    it('should order suggestions by name', async () => {
      mockPrisma.exercise.findMany.mockResolvedValue(mockExercises);

      await searchService.getSuggestions('push');

      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ name: 'asc' }],
        })
      );
    });

    it('should include highlighted match', async () => {
      mockPrisma.exercise.findMany.mockResolvedValue([mockExercises[0]]);

      const result = await searchService.getSuggestions('push');

      expect(result[0]).toHaveProperty('matchHighlight');
      expect(result[0].matchHighlight).toContain('<mark>push</mark>');
    });

    it('should return suggestion with correct structure', async () => {
      mockPrisma.exercise.findMany.mockResolvedValue([mockExercises[0]]);

      const result = await searchService.getSuggestions('push');

      expect(result[0]).toHaveProperty('exerciseId');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('matchHighlight');
      expect(result[0].exerciseId).toBe('1');
      expect(result[0].name).toBe('Push-up');
    });
  });

  describe('saveSearchHistory', () => {
    it('should save search history', async () => {
      mockPrisma.exerciseSearchHistory.create.mockResolvedValue({
        id: '1',
        userId: 'user123',
        searchQuery: 'push',
        resultCount: 5,
        searchedAt: new Date(),
      });

      await searchService.saveSearchHistory('user123', 'push', 5);

      expect(mockPrisma.exerciseSearchHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user123',
          searchQuery: 'push',
          resultCount: 5,
        },
      });
    });
  });

  describe('getSearchHistory', () => {
    const mockHistory = [
      {
        id: '1',
        userId: 'user123',
        searchQuery: 'push',
        resultCount: 5,
        searchedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        userId: 'user123',
        searchQuery: 'pull',
        resultCount: 3,
        searchedAt: new Date('2024-01-02'),
      },
    ];

    it('should get user search history', async () => {
      mockPrisma.exerciseSearchHistory.findMany.mockResolvedValue(mockHistory);

      const result = await searchService.getSearchHistory('user123');

      expect(result).toHaveLength(2);
      expect(result[0].searchQuery).toBe('push');
      expect(result[1].searchQuery).toBe('pull');
    });

    it('should use default limit of 20', async () => {
      mockPrisma.exerciseSearchHistory.findMany.mockResolvedValue(mockHistory);

      await searchService.getSearchHistory('user123');

      expect(mockPrisma.exerciseSearchHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      );
    });

    it('should respect custom limit', async () => {
      mockPrisma.exerciseSearchHistory.findMany.mockResolvedValue(mockHistory);

      await searchService.getSearchHistory('user123', 10);

      expect(mockPrisma.exerciseSearchHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should order by searchedAt descending', async () => {
      mockPrisma.exerciseSearchHistory.findMany.mockResolvedValue(mockHistory);

      await searchService.getSearchHistory('user123');

      expect(mockPrisma.exerciseSearchHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { searchedAt: 'desc' },
        })
      );
    });

    it('should filter by userId', async () => {
      mockPrisma.exerciseSearchHistory.findMany.mockResolvedValue(mockHistory);

      await searchService.getSearchHistory('user123');

      expect(mockPrisma.exerciseSearchHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user123' },
        })
      );
    });
  });

  describe('clearSearchHistory', () => {
    it('should clear user search history', async () => {
      mockPrisma.exerciseSearchHistory.deleteMany.mockResolvedValue({ count: 5 });

      const result = await searchService.clearSearchHistory('user123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Search history cleared');
      expect(mockPrisma.exerciseSearchHistory.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user123' },
      });
    });

    it('should return success message even when no history to clear', async () => {
      mockPrisma.exerciseSearchHistory.deleteMany.mockResolvedValue({ count: 0 });

      const result = await searchService.clearSearchHistory('user123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Search history cleared');
    });
  });

  describe('highlightMatch', () => {
    it('should highlight matching text', () => {
      const result = (searchService as any).highlightMatch('Push-up', 'push');

      expect(result).toContain('<mark>push</mark>');
    });

    it('should be case insensitive', () => {
      const result = (searchService as any).highlightMatch('PUSH-UP', 'push');

      expect(result).toContain('<mark>PUSH</mark>');
    });

    it('should return original text when query is empty', () => {
      const result = (searchService as any).highlightMatch('Push-up', '');

      expect(result).toBe('Push-up');
    });

    it('should handle multiple matches', () => {
      const result = (searchService as any).highlightMatch('push push-up', 'push');

      const markCount = (result.match(/<mark>/g) || []).length;
      expect(markCount).toBe(2);
    });
  });

  describe('escapeRegex', () => {
    it('should escape special regex characters', () => {
      const result = (searchService as any).escapeRegex('test+file*name?');

      expect(result).toBe('test\\+file\\*name\\?');
    });

    it('should escape all special characters', () => {
      const result = (searchService as any).escapeRegex('.*+?^${}()|[]\\');

      expect(result).toContain('\\.');
      expect(result).toContain('\\*');
      expect(result).toContain('\\+');
      expect(result).toContain('\\?');
      expect(result).toContain('\\^');
      expect(result).toContain('\\$');
      expect(result).toContain('\\{');
      expect(result).toContain('\\}');
      expect(result).toContain('\\(');
      expect(result).toContain('\\)');
      expect(result).toContain('\\|');
      expect(result).toContain('\\[');
      expect(result).toContain('\\]');
      expect(result).toContain('\\\\');
    });
  });
});
