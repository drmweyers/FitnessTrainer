/**
 * Workout Completion API Route
 *
 * POST /api/workouts/[id]/complete - Mark workout as complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logWorkoutCompleted } from '@/lib/services/activity.service';

const completeWorkoutSchema = z.object({
  notes: z.string().optional(),
  endTime: z.string().datetime().optional(),
  effortRating: z.number().min(1).max(10).optional(),
  enjoymentRating: z.number().min(1).max(10).optional(),
  energyAfter: z.number().min(1).max(10).optional(),
});

// POST /api/workouts/[id]/complete - Complete workout session
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const { id } = params;
    const body = await request.json();
    const data = completeWorkoutSchema.parse(body);

    // Verify session exists and user has access
    const existingSession = await prisma.workoutSession.findFirst({
      where: {
        id,
        clientId: user.id,
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Workout session not found' },
        { status: 404 }
      );
    }

    const actualEndTime = data.endTime ? new Date(data.endTime) : new Date();

    // Calculate completed sets
    const completedSets = await prisma.workoutSetLog.count({
      where: {
        exerciseLog: { workoutSessionId: id },
        completed: true,
      },
    });

    // Calculate total volume
    const totalVolumeResult = await prisma.workoutSetLog.aggregate({
      where: {
        exerciseLog: { workoutSessionId: id },
        completed: true,
        weight: { not: null },
        actualReps: { not: null },
      },
      _sum: { weight: true },
    });

    // Calculate average RPE
    const averageRpeResult = await prisma.workoutSetLog.aggregate({
      where: {
        exerciseLog: { workoutSessionId: id },
        completed: true,
        rpe: { not: null },
      },
      _avg: { rpe: true },
    });

    // Calculate total duration in minutes
    const totalDuration =
      existingSession.actualStartTime && actualEndTime
        ? Math.round(
            (actualEndTime.getTime() -
              existingSession.actualStartTime.getTime()) /
              (1000 * 60)
          )
        : undefined;

    // Calculate adherence score
    const adherenceScore = existingSession.totalSets
      ? (completedSets / existingSession.totalSets) * 100
      : 0;

    const session = await prisma.workoutSession.update({
      where: { id },
      data: {
        status: 'completed',
        actualEndTime,
        completedSets,
        totalDuration,
        totalVolume: totalVolumeResult._sum.weight || undefined,
        averageRpe: averageRpeResult._avg.rpe || undefined,
        adherenceScore,
        ...(data.effortRating && { effortRating: data.effortRating }),
        ...(data.enjoymentRating && { enjoymentRating: data.enjoymentRating }),
        ...(data.energyAfter && { energyAfter: data.energyAfter }),
        ...(data.notes && { clientNotes: data.notes }),
      },
      include: {
        exerciseLogs: {
          include: {
            setLogs: {
              orderBy: { setNumber: 'asc' },
            },
            exercise: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    // Log activity (fire-and-forget, won't break the response)
    try {
      const workout = await prisma.programWorkout.findUnique({
        where: { id: existingSession.workoutId },
        select: { name: true },
      });
      logWorkoutCompleted(user.id, id, workout?.name || 'Workout');
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Workout completed successfully',
      data: session,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error completing workout:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
