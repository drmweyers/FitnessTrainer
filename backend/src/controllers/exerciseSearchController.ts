import { Response } from 'express';
import { exerciseSearchService } from '@/services/exerciseSearchService';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';

// Search exercises with optional filters
export const searchExercises = asyncHandler(async (req: any, res: Response) => {
  const { q } = req.query;
  const { searchInInstructions, limit, offset } = req.query;
  const userId = req.user?.id;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Search query parameter "q" is required',
      },
    });
  }

  const result = await exerciseSearchService.searchExercises(
    q,
    userId,
    {
      searchInInstructions: searchInInstructions === 'true',
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    }
  );

  logger.info(`Exercise search: "${q}" - ${result.total} results`);

  return res.json({
    success: true,
    data: result,
  });
});

// Get exercise search suggestions (autocomplete)
export const getExerciseSuggestions = asyncHandler(async (req: any, res: Response) => {
  const { q } = req.query;
  const { limit } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Search query parameter "q" is required',
      },
    });
  }

  const suggestions = await exerciseSearchService.getSuggestions(
    q,
    limit ? parseInt(limit as string, 10) : undefined
  );

  return res.json({
    success: true,
    data: suggestions,
  });
});

// Get user's search history
export const getSearchHistory = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user!.id;
  const { limit } = req.query;

  const history = await exerciseSearchService.getSearchHistory(
    userId,
    limit ? parseInt(limit as string, 10) : undefined
  );

  res.json({
    success: true,
    data: history,
    count: history.length,
  });
});

// Save search to history (usually done automatically, but can be manual)
export const saveToSearchHistory = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user!.id;
  const { query, resultCount } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Search query is required',
      },
    });
  }

  await exerciseSearchService.saveSearchHistory(userId, query, resultCount || 0);

  return res.status(201).json({
    success: true,
    message: 'Search history saved',
  });
});

// Clear user's search history
export const clearSearchHistory = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user!.id;

  const result = await exerciseSearchService.clearSearchHistory(userId);

  logger.info(`Cleared search history for user ${userId}`);

  res.json({
    success: true,
    message: result.message,
  });
});
