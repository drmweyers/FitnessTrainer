import { prisma } from '@/index';
import { createError } from '@/middleware/errorHandler';

// Search options interface
interface SearchOptions {
  searchInInstructions?: boolean;
  limit?: number;
  offset?: number;
}

// Search result interface
interface SearchResult {
  exercises: any[];
  total: number;
  query: string;
}

// Suggestion interface
interface SearchSuggestion {
  exerciseId: string;
  name: string;
  matchHighlight: string;
}

export class ExerciseSearchService {
  /**
   * Search for exercises by name and optionally in instructions
   */
  async searchExercises(
    query: string,
    userId?: string,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const { searchInInstructions = false, limit = 50, offset = 0 } = options;

    // Build search conditions
    const searchConditions: any[] = [];

    // Always search in name
    searchConditions.push({
      name: {
        contains: query,
        mode: 'insensitive',
      },
    });

    // Search in body part
    searchConditions.push({
      bodyPart: {
        contains: query,
        mode: 'insensitive',
      },
    });

    // Search in target muscle
    searchConditions.push({
      targetMuscle: {
        contains: query,
        mode: 'insensitive',
      },
    });

    // Search in equipment
    searchConditions.push({
      equipment: {
        contains: query,
        mode: 'insensitive',
      },
    });

    // Optionally search in instructions
    if (searchInInstructions && query.length > 0) {
      searchConditions.push({
        instructions: {
          hasSome: [query],
        },
      });
    }

    // If query is empty, don't filter
    const where = query.length > 0
      ? {
          isActive: true,
          OR: searchConditions,
        }
      : {
          isActive: true,
        };

    // Get total count
    const total = await prisma.exercise.count({ where });

    // Execute search
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
        instructions: true,
        difficulty: true,
        gifUrl: true,
      },
    });

    // Save search history if userId provided
    if (userId && query.length > 0) {
      try {
        await prisma.exerciseSearchHistory.create({
          data: {
            userId,
            searchQuery: query,
            resultCount: exercises.length,
          },
        }).catch(() => {
          // Silently fail if history save fails
        });
      } catch {
        // Ignore errors when saving history
      }
    }

    return {
      exercises,
      total,
      query,
    };
  }

  /**
   * Get autocomplete suggestions for search query
   */
  async getSuggestions(query: string, limit = 10): Promise<SearchSuggestion[]> {
    // Require at least 2 characters for suggestions
    if (query.length < 2) {
      return [];
    }

    const exercises = await prisma.exercise.findMany({
      where: {
        isActive: true,
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: limit,
      orderBy: [{ name: 'asc' }],
      select: {
        id: true,
        name: true,
        bodyPart: true,
        equipment: true,
        gifUrl: true,
      },
    });

    // Create suggestions with highlighted matches
    return exercises.map((exercise) => ({
      exerciseId: exercise.id,
      name: exercise.name,
      matchHighlight: this.highlightMatch(exercise.name, query),
    }));
  }

  /**
   * Save search to user's history
   */
  async saveSearchHistory(
    userId: string,
    query: string,
    resultCount: number
  ): Promise<void> {
    await prisma.exerciseSearchHistory.create({
      data: {
        userId,
        searchQuery: query,
        resultCount,
      },
    });
  }

  /**
   * Get user's search history
   */
  async getSearchHistory(userId: string, limit = 20): Promise<any[]> {
    const history = await prisma.exerciseSearchHistory.findMany({
      where: { userId },
      orderBy: { searchedAt: 'desc' },
      take: limit,
    });

    return history;
  }

  /**
   * Clear user's search history
   */
  async clearSearchHistory(userId: string): Promise<{ success: boolean; message: string }> {
    await prisma.exerciseSearchHistory.deleteMany({
      where: { userId },
    });

    return { success: true, message: 'Search history cleared' };
  }

  /**
   * Highlight matching text in search results
   */
  private highlightMatch(text: string, query: string): string {
    if (!query) return text;

    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export const exerciseSearchService = new ExerciseSearchService();
