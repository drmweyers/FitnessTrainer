/**
 * Get Exercise by exerciseId (from exerciseDB)
 * GET /api/exercises/by-id/[exerciseId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { exerciseService } from '@/lib/services/exercise.service';
import { ExerciseAPIError } from '@/lib/types/exercise';

/**
 * GET /api/exercises/by-id/[exerciseId]
 * Get exercise by exerciseId (from exerciseDB database)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { exerciseId: string } }
) {
  try {
    const { exerciseId } = params;

    const exercise = await exerciseService.getExerciseByExerciseId(exerciseId);

    if (!exercise) {
      const error: ExerciseAPIError = {
        error: 'Not Found',
        message: `Exercise with ID ${exerciseId} not found`,
      };
      return NextResponse.json(error, { status: 404 });
    }

    // Add cache headers
    return NextResponse.json(exercise, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching exercise:', error);

    const apiError: ExerciseAPIError = {
      error: 'Internal Server Error',
      message: 'Failed to fetch exercise',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(apiError, { status: 500 });
  }
}
