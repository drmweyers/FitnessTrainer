/**
 * Exercise Alternatives API Route
 * GET /api/exercises/alternatives?exerciseId=xxx&limit=5
 *
 * Returns exercises with the same targetMuscle and bodyPart but different exerciseId.
 * Same-equipment alternatives are sorted first.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/exercises/alternatives
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const exerciseId = searchParams.get('exerciseId');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 5;

  if (!exerciseId) {
    return NextResponse.json(
      { error: 'exerciseId is required', message: 'Provide exerciseId as a query parameter' },
      { status: 400 }
    );
  }

  try {
    // 1. Find the source exercise
    const source = await prisma.exercise.findUnique({
      where: { exerciseId },
    });

    if (!source) {
      return NextResponse.json(
        { error: 'Exercise not found', message: `No exercise with exerciseId: ${exerciseId}` },
        { status: 404 }
      );
    }

    // 2. Fetch candidates — same targetMuscle + bodyPart, excluding the source
    //    Fetch more than the requested limit so we can sort same-equipment first
    const fetchCount = Math.max(limit * 2, 10);
    const candidates = await prisma.exercise.findMany({
      where: {
        isActive: true,
        targetMuscle: source.targetMuscle,
        bodyPart: source.bodyPart,
        NOT: { exerciseId: source.exerciseId },
      },
      take: fetchCount,
      orderBy: { name: 'asc' },
    });

    // 3. Sort: same equipment first, then everything else
    const sorted = [
      ...candidates.filter((e) => e.equipment === source.equipment),
      ...candidates.filter((e) => e.equipment !== source.equipment),
    ].slice(0, limit);

    return NextResponse.json(
      {
        sourceExercise: {
          id: source.id,
          exerciseId: source.exerciseId,
          name: source.name,
          bodyPart: source.bodyPart,
          equipment: source.equipment,
          targetMuscle: source.targetMuscle,
        },
        alternatives: sorted.map((e) => ({
          id: e.id,
          exerciseId: e.exerciseId,
          name: e.name,
          gifUrl: e.gifUrl,
          bodyPart: e.bodyPart,
          equipment: e.equipment,
          targetMuscle: e.targetMuscle,
          secondaryMuscles: e.secondaryMuscles,
          difficulty: e.difficulty,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching exercise alternatives:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch alternatives',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
