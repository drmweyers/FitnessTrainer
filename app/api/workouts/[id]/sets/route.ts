/**
 * Workout Set Logging API Route
 *
 * GET /api/workouts/[id]/sets - Get all sets for a workout session
 * POST /api/workouts/[id]/sets - Log exercise set
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

const logSetSchema = z.object({
  exerciseLogId: z.string().uuid(),
  setNumber: z.number(),
  actualReps: z.number().optional(),
  weight: z.number().optional(),
  rpe: z.number().min(1).max(10).optional(),
  rir: z.number().min(0).max(10).optional(),
  duration: z.number().optional(),
  restTime: z.number().optional(),
  tempo: z.string().optional(),
  completed: z.boolean().optional(),
  notes: z.string().optional(),
});

// GET /api/workouts/[id]/sets - Get all sets for a workout session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const { id } = params;

    // Verify session exists and user has access
    const session = await prisma.workoutSession.findFirst({
      where: {
        id,
        OR: [
          { clientId: user.id },
          ...(user.role === 'trainer' ? [{ trainerId: user.id }] : []),
        ],
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Workout session not found' },
        { status: 404 }
      );
    }

    const exerciseLogs = await prisma.workoutExerciseLog.findMany({
      where: { workoutSessionId: id },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            bodyPart: true,
            equipment: true,
            gifUrl: true,
          },
        },
        setLogs: {
          orderBy: { setNumber: 'asc' },
        },
        workoutExercise: {
          include: {
            configurations: {
              orderBy: { setNumber: 'asc' },
            },
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({ success: true, data: exerciseLogs });
  } catch (error: any) {
    console.error('Error fetching sets:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/workouts/[id]/sets - Log or update an exercise set
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
    const data = logSetSchema.parse(body);

    // Verify session exists and user has access
    const session = await prisma.workoutSession.findFirst({
      where: {
        id,
        clientId: user.id,
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Workout session not found' },
        { status: 404 }
      );
    }

    // Verify exercise log belongs to this session
    const exerciseLog = await prisma.workoutExerciseLog.findFirst({
      where: {
        id: data.exerciseLogId,
        workoutSessionId: id,
      },
    });

    if (!exerciseLog) {
      return NextResponse.json(
        { success: false, error: 'Exercise log not found in this session' },
        { status: 404 }
      );
    }

    // Upsert the set log (update if exists, create if not)
    const setLog = await prisma.workoutSetLog.upsert({
      where: {
        exerciseLogId_setNumber: {
          exerciseLogId: data.exerciseLogId,
          setNumber: data.setNumber,
        },
      },
      update: {
        ...(data.actualReps !== undefined && { actualReps: data.actualReps }),
        ...(data.weight !== undefined && { weight: data.weight }),
        ...(data.rpe !== undefined && { rpe: data.rpe }),
        ...(data.rir !== undefined && { rir: data.rir }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.restTime !== undefined && { restTime: data.restTime }),
        ...(data.tempo !== undefined && { tempo: data.tempo }),
        ...(data.completed !== undefined && { completed: data.completed }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.completed ? { timestamp: new Date() } : {}),
      },
      create: {
        exerciseLogId: data.exerciseLogId,
        setNumber: data.setNumber,
        actualReps: data.actualReps || 0,
        weight: data.weight || 0,
        rpe: data.rpe,
        rir: data.rir,
        duration: data.duration,
        restTime: data.restTime,
        tempo: data.tempo,
        completed: data.completed || false,
        notes: data.notes,
        ...(data.completed ? { timestamp: new Date() } : {}),
      },
    });

    // Recalculate exercise volume
    const allSets = await prisma.workoutSetLog.findMany({
      where: {
        exerciseLogId: data.exerciseLogId,
        completed: true,
      },
    });

    const totalVolume = allSets.reduce((sum, set) => {
      if (set.weight && set.actualReps) {
        return sum + Number(set.weight) * set.actualReps;
      }
      return sum;
    }, 0);

    if (totalVolume > 0) {
      await prisma.workoutExerciseLog.update({
        where: { id: data.exerciseLogId },
        data: { totalVolume },
      });
    }

    // Update session completed sets count
    const completedSets = await prisma.workoutSetLog.count({
      where: {
        exerciseLog: { workoutSessionId: id },
        completed: true,
      },
    });

    await prisma.workoutSession.update({
      where: { id },
      data: { completedSets },
    });

    return NextResponse.json({
      success: true,
      message: 'Set logged successfully',
      data: setLog,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error logging set:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
