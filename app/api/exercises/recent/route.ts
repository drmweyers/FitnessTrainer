/**
 * Recent Exercises API
 * GET /api/exercises/recent — returns last 10 exercises used by the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/exercises/recent
 * Returns the 10 most recently used exercises for the authenticated user,
 * ordered by most recent workout session, deduplicated.
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  try {
    const logs = await prisma.workoutExerciseLog.findMany({
      where: {
        workoutSession: {
          clientId: req.user!.id,
        },
      },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            bodyPart: true,
            equipment: true,
            targetMuscle: true,
            gifUrl: true,
          },
        },
        workoutSession: {
          select: {
            createdAt: true,
          },
        },
      },
      orderBy: {
        workoutSession: {
          createdAt: 'desc',
        },
      },
      take: 10,
    });

    // Deduplicate: keep only the first (most recent) occurrence of each exercise
    const seen = new Set<string>();
    const recentExercises = logs
      .filter((log) => {
        if (seen.has(log.exerciseId)) return false;
        seen.add(log.exerciseId);
        return true;
      })
      .map((log) => log.exercise);

    return NextResponse.json(
      { success: true, data: recentExercises },
      { status: 200 }
    );
  } catch (error) {
    console.error('[exercises/recent] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent exercises' },
      { status: 500 }
    );
  }
}
