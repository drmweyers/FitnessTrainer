/**
 * Exercise Search API
 * GET /api/exercises/search?q=query&limit=10
 */

import { NextRequest, NextResponse } from 'next/server';
import { exerciseService } from '@/lib/services/exercise.service';
import { ExerciseAPIError } from '@/lib/types/exercise';
import { z } from 'zod';

// Validation schema for search query
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
});

/**
 * GET /api/exercises/search
 * Search exercises by query string
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryResult = searchQuerySchema.safeParse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit'),
    });

    if (!queryResult.success) {
      const error: ExerciseAPIError = {
        error: 'Validation Error',
        message: 'Invalid search parameters',
        details: queryResult.error.errors,
      };
      return NextResponse.json(error, { status: 400 });
    }

    const { q: query, limit } = queryResult.data;

    // Search exercises
    const exercises = await exerciseService.searchExercises(query, limit);

    // Add cache headers
    return NextResponse.json({ exercises, query }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error searching exercises:', error);

    const apiError: ExerciseAPIError = {
      error: 'Internal Server Error',
      message: 'Failed to search exercises',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(apiError, { status: 500 });
  }
}
