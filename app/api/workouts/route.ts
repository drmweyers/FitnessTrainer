/**
 * Workout API Routes - Main Endpoint
 *
 * GET /api/workouts - List workout sessions
 * POST /api/workouts - Create new workout session
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

const createWorkoutSessionSchema = z.object({
  programAssignmentId: z.string().uuid(),
  workoutId: z.string().uuid(),
  scheduledDate: z.string(),
  clientId: z.string().uuid().optional(),
});

// GET /api/workouts - List workout sessions
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as any;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      ...(user.role === 'client'
        ? { clientId: user.id }
        : { trainerId: user.id }),
      ...(status && { status }),
      ...(startDate || endDate
        ? {
            scheduledDate: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    const [sessions, total] = await Promise.all([
      prisma.workoutSession.findMany({
        where,
        include: {
          workout: {
            select: {
              name: true,
              workoutType: true,
              estimatedDuration: true,
            },
          },
          programAssignment: {
            select: {
              program: {
                select: {
                  name: true,
                  programType: true,
                },
              },
            },
          },
          ...(user.role === 'trainer'
            ? {
                client: {
                  select: {
                    id: true,
                    email: true,
                    userProfile: {
                      select: {
                        bio: true,
                        profilePhotoUrl: true,
                      },
                    },
                  },
                },
              }
            : {}),
        },
        orderBy: { scheduledDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.workoutSession.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: sessions,
      meta: {
        total,
        hasMore: offset + limit < total,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/workouts - Create new workout session
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const body = await request.json();
    const data = createWorkoutSessionSchema.parse(body);

    let clientId = user.id;
    let trainerId = user.id;

    if (user.role === 'trainer' && data.clientId) {
      clientId = data.clientId;
    }

    // Verify program assignment exists and belongs to this client/trainer
    const programAssignment = await prisma.programAssignment.findFirst({
      where: {
        id: data.programAssignmentId,
        clientId,
        ...(user.role === 'trainer' ? { trainerId } : {}),
        isActive: true,
      },
      include: { program: true },
    });

    if (!programAssignment) {
      return NextResponse.json(
        { success: false, error: 'Program assignment not found' },
        { status: 404 }
      );
    }

    // Get workout with exercises and configurations
    const workout = await prisma.programWorkout.findFirst({
      where: {
        id: data.workoutId,
        week: { programId: programAssignment.programId },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            configurations: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!workout) {
      return NextResponse.json(
        { success: false, error: 'Workout not found in program' },
        { status: 404 }
      );
    }

    const scheduledDate = new Date(data.scheduledDate);

    // Check for existing session
    const existingSession = await prisma.workoutSession.findFirst({
      where: {
        programAssignmentId: data.programAssignmentId,
        workoutId: data.workoutId,
        clientId,
        scheduledDate,
      },
    });

    if (existingSession) {
      return NextResponse.json({
        success: true,
        data: existingSession,
        message: 'Session already exists',
      });
    }

    // If trainer is creating for client, use trainer id from assignment
    if (user.role !== 'trainer') {
      trainerId = programAssignment.trainerId;
    }

    // Create workout session with exercise logs and set logs
    const session = await prisma.workoutSession.create({
      data: {
        programAssignmentId: data.programAssignmentId,
        workoutId: data.workoutId,
        clientId,
        trainerId,
        scheduledDate,
        status: 'scheduled',
        totalSets: workout.exercises.reduce(
          (sum, ex) => sum + ex.configurations.length,
          0
        ),
        completedSets: 0,
        exerciseLogs: {
          create: workout.exercises.map((workoutExercise) => ({
            workoutExerciseId: workoutExercise.id,
            exerciseId: workoutExercise.exerciseId,
            orderIndex: workoutExercise.orderIndex,
            supersetGroup: workoutExercise.supersetGroup,
            setLogs: {
              create: workoutExercise.configurations.map((config) => ({
                setNumber: config.setNumber,
                plannedReps: config.reps,
                weight: 0,
                actualReps: 0,
                completed: false,
              })),
            },
          })),
        },
      },
      include: {
        exerciseLogs: {
          include: {
            setLogs: true,
            exercise: true,
            workoutExercise: {
              include: { configurations: true },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        client: {
          select: {
            id: true,
            email: true,
            userProfile: {
              select: {
                id: true,
                bio: true,
                profilePhotoUrl: true,
              },
            },
          },
        },
        workout: {
          include: {
            exercises: {
              include: {
                exercise: true,
                configurations: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Workout session created successfully',
        data: session,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating workout session:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
