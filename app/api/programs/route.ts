/**
 * Program API Routes - Main Endpoint
 *
 * GET /api/programs - List all programs with filters
 * POST /api/programs - Create new program
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

const createProgramSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  programType: z.enum([
    'strength', 'hypertrophy', 'endurance', 'powerlifting',
    'bodybuilding', 'general_fitness', 'sport_specific', 'rehabilitation',
  ]),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  durationWeeks: z.number().min(1).max(52),
  goals: z.array(z.string()).optional(),
  equipmentNeeded: z.array(z.string()).optional(),
  isTemplate: z.boolean().optional(),
  weeks: z.array(z.object({
    weekNumber: z.number(),
    name: z.string(),
    description: z.string().optional(),
    isDeload: z.boolean().optional(),
    workouts: z.array(z.object({
      dayNumber: z.number(),
      name: z.string(),
      description: z.string().optional(),
      workoutType: z.enum(['strength', 'cardio', 'hiit', 'flexibility', 'mixed', 'recovery']).optional(),
      estimatedDuration: z.number().optional(),
      isRestDay: z.boolean().optional(),
      exercises: z.array(z.object({
        exerciseId: z.string().uuid(),
        orderIndex: z.number(),
        supersetGroup: z.string().optional(),
        setsConfig: z.any(),
        notes: z.string().optional(),
        configurations: z.array(z.object({
          setNumber: z.number(),
          setType: z.enum(['warmup', 'working', 'drop', 'pyramid', 'amrap', 'cluster', 'rest_pause']),
          reps: z.string(),
          weightGuidance: z.string().optional(),
          restSeconds: z.number().optional(),
          tempo: z.string().optional(),
          rpe: z.number().min(1).max(10).optional(),
          rir: z.number().min(0).max(10).optional(),
          notes: z.string().optional(),
        })).optional(),
      })).optional(),
    })).optional(),
  })).optional(),
});

// GET /api/programs - List all programs
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const searchParams = request.nextUrl.searchParams;
    const includeTemplates = searchParams.get('includeTemplates') === 'true';

    const programs = await prisma.program.findMany({
      where: {
        trainerId: user.id,
        isTemplate: includeTemplates ? undefined : false,
      },
      include: {
        weeks: {
          include: {
            workouts: {
              include: {
                exercises: {
                  include: {
                    exercise: true,
                  },
                },
              },
            },
          },
        },
        assignments: {
          include: {
            client: {
              select: {
                id: true,
                email: true,
                userProfile: {
                  select: {
                    bio: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: programs,
      count: programs.length,
    });
  } catch (error: any) {
    console.error('Error fetching programs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}

// POST /api/programs - Create new program
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const body = await request.json();
    const data = createProgramSchema.parse(body);

    const program = await prisma.program.create({
      data: {
        trainerId: user.id,
        name: data.name,
        description: data.description,
        programType: data.programType as any,
        difficultyLevel: data.difficultyLevel as any,
        durationWeeks: data.durationWeeks,
        goals: data.goals || [],
        equipmentNeeded: data.equipmentNeeded || [],
        isTemplate: data.isTemplate || false,
        weeks: data.weeks ? {
          create: data.weeks.map(week => ({
            weekNumber: week.weekNumber,
            name: week.name,
            description: week.description,
            isDeload: week.isDeload || false,
            workouts: week.workouts ? {
              create: week.workouts.map(workout => ({
                dayNumber: workout.dayNumber,
                name: workout.name,
                description: workout.description,
                workoutType: workout.workoutType as any,
                estimatedDuration: workout.estimatedDuration,
                isRestDay: workout.isRestDay || false,
                exercises: workout.exercises ? {
                  create: workout.exercises.map(exercise => ({
                    exerciseId: exercise.exerciseId,
                    orderIndex: exercise.orderIndex,
                    supersetGroup: exercise.supersetGroup,
                    setsConfig: exercise.setsConfig || {},
                    notes: exercise.notes,
                    configurations: exercise.configurations ? {
                      create: exercise.configurations,
                    } : undefined,
                  })),
                } : undefined,
              })),
            } : undefined,
          })),
        } : undefined,
      },
      include: {
        weeks: {
          include: {
            workouts: {
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
        },
      },
    });

    return NextResponse.json(
      { success: true, message: 'Program created successfully', data: program },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating program:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create program' },
      { status: 500 }
    );
  }
}
