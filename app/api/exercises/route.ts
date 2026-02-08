/**
 * Exercise API Routes
 * GET /api/exercises - List exercises with filtering
 * POST /api/exercises - Create new exercise (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { exerciseService } from '@/lib/services/exercise.service';
import {
  ExerciseListQuery,
  CreateExerciseDTO,
  ExerciseAPIError,
} from '@/lib/types/exercise';
import { z } from 'zod';

// Validation schema for query parameters
const exerciseListQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 20)),
  search: z.string().optional(),
  bodyPart: z.string().optional(),
  equipment: z.string().optional(),
  targetMuscle: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  sortBy: z.enum(['name', 'createdAt', 'targetMuscle']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Validation schema for creating exercise
const createExerciseSchema = z.object({
  exerciseId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  gifUrl: z.string().url('Invalid GIF URL'),
  bodyPart: z.string().min(1, 'Body part is required'),
  equipment: z.string().min(1, 'Equipment is required'),
  targetMuscle: z.string().min(1, 'Target muscle is required'),
  secondaryMuscles: z.array(z.string()).default([]),
  instructions: z.array(z.string()).min(1, 'At least one instruction is required'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

/**
 * GET /api/exercises
 * List exercises with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryResult = exerciseListQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!queryResult.success) {
      const error: ExerciseAPIError = {
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: queryResult.error.errors,
      };
      return NextResponse.json(error, { status: 400 });
    }

    const query: ExerciseListQuery = queryResult.data;

    // Get exercises from service
    const result = await exerciseService.getExercises(query);

    // Add cache headers for better performance
    const response = NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });

    return response;
  } catch (error) {
    console.error('Error fetching exercises:', error);

    const apiError: ExerciseAPIError = {
      error: 'Internal Server Error',
      message: 'Failed to fetch exercises',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(apiError, { status: 500 });
  }
}

/**
 * POST /api/exercises
 * Create new exercise (admin only)
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;
  if (req.user?.role !== 'admin' && req.user?.role !== 'trainer') {
    return NextResponse.json({ error: 'Forbidden', message: 'Admin or trainer role required' }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Validate request body
    const validationResult = createExerciseSchema.safeParse(body);

    if (!validationResult.success) {
      const error: ExerciseAPIError = {
        error: 'Validation Error',
        message: 'Invalid exercise data',
        details: validationResult.error.errors,
      };
      return NextResponse.json(error, { status: 400 });
    }

    const exerciseData: CreateExerciseDTO = validationResult.data;

    // Create exercise
    const exercise = await exerciseService.createExercise(exerciseData);

    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    console.error('Error creating exercise:', error);

    const apiError: ExerciseAPIError = {
      error: 'Internal Server Error',
      message: 'Failed to create exercise',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(apiError, { status: 500 });
  }
}
