/**
 * Exercise Filters API
 * GET /api/exercises/filters - Get available filter options
 */

import { NextRequest, NextResponse } from 'next/server';
import { exerciseService } from '@/lib/services/exercise.service';
import { ExerciseAPIError } from '@/lib/types/exercise';

/**
 * GET /api/exercises/filters
 * Get available filter options (body parts, equipment, muscles, difficulties)
 */
export async function GET(request: NextRequest) {
  try {
    const filters = await exerciseService.getFilterOptions();

    // Add cache headers (filters rarely change)
    return NextResponse.json(filters, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching exercise filters:', error);

    const apiError: ExerciseAPIError = {
      error: 'Internal Server Error',
      message: 'Failed to fetch exercise filters',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(apiError, { status: 500 });
  }
}
