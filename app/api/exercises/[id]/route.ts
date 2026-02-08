/**
 * Individual Exercise API Routes
 * GET /api/exercises/[id] - Get exercise by ID
 * PUT /api/exercises/[id] - Update exercise (admin)
 * DELETE /api/exercises/[id] - Delete exercise (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { exerciseService } from '@/lib/services/exercise.service';
import { UpdateExerciseDTO, ExerciseAPIError } from '@/lib/types/exercise';
import { z } from 'zod';

// Validation schema for updating exercise
const updateExerciseSchema = z.object({
  name: z.string().min(1).optional(),
  gifUrl: z.string().url().optional(),
  bodyPart: z.string().min(1).optional(),
  equipment: z.string().min(1).optional(),
  targetMuscle: z.string().min(1).optional(),
  secondaryMuscles: z.array(z.string()).optional(),
  instructions: z.array(z.string()).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/exercises/[id]
 * Get exercise by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const exercise = await exerciseService.getExerciseById(id);

    if (!exercise) {
      const error: ExerciseAPIError = {
        error: 'Not Found',
        message: `Exercise with ID ${id} not found`,
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

/**
 * PUT /api/exercises/[id]
 * Update exercise (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const req = authResult as AuthenticatedRequest;
    if (req.user?.role !== 'admin' && req.user?.role !== 'trainer') {
      return NextResponse.json({ error: 'Forbidden', message: 'Admin or trainer role required' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();

    // Validate request body
    const validationResult = updateExerciseSchema.safeParse(body);

    if (!validationResult.success) {
      const error: ExerciseAPIError = {
        error: 'Validation Error',
        message: 'Invalid exercise data',
        details: validationResult.error.errors,
      };
      return NextResponse.json(error, { status: 400 });
    }

    const updateData: UpdateExerciseDTO = validationResult.data;

    // Update exercise
    const exercise = await exerciseService.updateExercise(id, updateData);

    return NextResponse.json(exercise, { status: 200 });
  } catch (error) {
    console.error('Error updating exercise:', error);

    const apiError: ExerciseAPIError = {
      error: 'Internal Server Error',
      message: 'Failed to update exercise',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(apiError, { status: 500 });
  }
}

/**
 * DELETE /api/exercises/[id]
 * Delete exercise (admin only) - Soft delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const req = authResult as AuthenticatedRequest;
    if (req.user?.role !== 'admin' && req.user?.role !== 'trainer') {
      return NextResponse.json({ error: 'Forbidden', message: 'Admin or trainer role required' }, { status: 403 });
    }

    const { id } = params;

    // Soft delete (set isActive to false)
    const exercise = await exerciseService.deleteExercise(id);

    return NextResponse.json(
      { message: 'Exercise deleted successfully', exercise },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting exercise:', error);

    const apiError: ExerciseAPIError = {
      error: 'Internal Server Error',
      message: 'Failed to delete exercise',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(apiError, { status: 500 });
  }
}
