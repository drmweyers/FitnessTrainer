/**
 * Program API Routes - By ID
 *
 * GET /api/programs/[id] - Get program by ID
 * PUT /api/programs/[id] - Update program
 * DELETE /api/programs/[id] - Delete program
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

const updateProgramSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  // BUG 8 fixed: all ProgramType enum values from types/program.ts are now accepted
  programType: z.enum([
    'strength', 'hypertrophy', 'endurance', 'powerlifting',
    'bodybuilding', 'general_fitness', 'sport_specific', 'sports_specific', 'rehabilitation',
    'olympic_weightlifting', 'crossfit', 'calisthenics', 'cardio',
    'flexibility', 'weight_loss', 'muscle_gain', 'hybrid',
  ]).optional(),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  durationWeeks: z.number().min(1).max(52).optional(),
  goals: z.array(z.string()).optional(),
  equipmentNeeded: z.array(z.string()).optional(),
  isTemplate: z.boolean().optional(),
  // BUG 9 fixed: optional nested structure rebuild.
  // If weeks is provided, existing weeks/workouts/exercises are deleted and recreated (full replace).
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

// GET /api/programs/[id] - Get program by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const { id } = params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid program ID format' },
        { status: 400 }
      );
    }

    const program = await prisma.program.findFirst({
      where: {
        id,
        trainerId: user.id,
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
                  orderBy: { orderIndex: 'asc' },
                },
                sections: {
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
          orderBy: {
            weekNumber: 'asc',
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
                    profilePhotoUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    // Shape workouts so each section carries its exercises grouped by sectionId.
    // The legacy `exercises` flat array is preserved for one release of backward compat.
    const shaped = {
      ...program,
      weeks: program.weeks.map(week => ({
        ...week,
        workouts: week.workouts.map(workout => {
          const exercisesBySection = new Map<string | null, typeof workout.exercises>();
          for (const ex of workout.exercises) {
            const key = (ex as any).sectionId ?? null;
            if (!exercisesBySection.has(key)) exercisesBySection.set(key, []);
            exercisesBySection.get(key)!.push(ex);
          }

          const sectionsWithExercises = workout.sections.map(section => ({
            ...section,
            exercises: exercisesBySection.get(section.id) ?? [],
          }));

          // Exercises that have no sectionId are placed in a synthetic default section.
          const unsectioned = exercisesBySection.get(null) ?? [];
          if (unsectioned.length > 0) {
            sectionsWithExercises.push({
              id: null as any,
              workoutId: workout.id,
              orderIndex: sectionsWithExercises.length,
              sectionType: 'regular',
              rounds: null,
              endRest: null,
              intervalWork: null,
              intervalRest: null,
              createdAt: workout.exercises[0]?.createdAt ?? new Date(),
              updatedAt: null,
              exercises: unsectioned,
            });
          }

          return {
            ...workout,
            sections: sectionsWithExercises,
            // Legacy flat array — deprecated, will be removed in the next release.
            exercises: workout.exercises,
          };
        }),
      })),
    };

    return NextResponse.json({ success: true, data: shaped });
  } catch (error: any) {
    console.error('Error fetching program:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch program' },
      { status: 500 }
    );
  }
}

// PUT /api/programs/[id] - Update program
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const { id } = params;
    const body = await request.json();
    const data = updateProgramSchema.parse(body);

    // Verify ownership
    const existing = await prisma.program.findFirst({
      where: { id, trainerId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    // BUG 9 fixed: wrap in transaction; if weeks provided, delete + recreate nested structure
    const updated = await prisma.$transaction(async (tx) => {
      await tx.program.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          programType: data.programType as any,
          difficultyLevel: data.difficultyLevel as any,
          durationWeeks: data.durationWeeks,
          goals: data.goals,
          equipmentNeeded: data.equipmentNeeded,
          isTemplate: data.isTemplate,
        },
      });

      if (data.weeks) {
        // Delete existing nested structure (cascade via Prisma)
        await tx.programWeek.deleteMany({ where: { programId: id } });

        for (const week of data.weeks) {
          const createdWeek = await tx.programWeek.create({
            data: { programId: id, weekNumber: week.weekNumber, name: week.name, description: week.description, isDeload: week.isDeload ?? false },
          });
          for (const workout of (week.workouts ?? [])) {
            const createdWorkout = await tx.programWorkout.create({
              data: { programWeekId: createdWeek.id, dayNumber: workout.dayNumber, name: workout.name, description: workout.description, workoutType: workout.workoutType as any, estimatedDuration: workout.estimatedDuration, isRestDay: workout.isRestDay ?? false },
            });
            for (const exercise of (workout.exercises ?? [])) {
              const createdExercise = await tx.workoutExercise.create({
                data: { workoutId: createdWorkout.id, exerciseId: exercise.exerciseId, orderIndex: exercise.orderIndex, supersetGroup: exercise.supersetGroup, setsConfig: exercise.setsConfig ?? {}, notes: exercise.notes },
              });
              if (exercise.configurations && exercise.configurations.length > 0) {
                await tx.exerciseConfiguration.createMany({
                  data: exercise.configurations.map((cfg) => ({ workoutExerciseId: createdExercise.id, setNumber: cfg.setNumber, setType: cfg.setType as any, reps: cfg.reps, weightGuidance: cfg.weightGuidance, restSeconds: cfg.restSeconds, tempo: cfg.tempo, rpe: cfg.rpe, rir: cfg.rir, notes: cfg.notes })),
                });
              }
            }
          }
        }
      }

      return tx.program.findFirst({
        where: { id },
        include: {
          weeks: {
            include: { workouts: { include: { exercises: { include: { exercise: true, configurations: true }, orderBy: { orderIndex: 'asc' } } } } },
            orderBy: { weekNumber: 'asc' },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Program updated successfully',
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating program:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update program' },
      { status: 500 }
    );
  }
}

// DELETE /api/programs/[id] - Delete program
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const { id } = params;

    // Verify ownership
    const existing = await prisma.program.findFirst({
      where: { id, trainerId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    await prisma.program.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Program deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting program:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete program' },
      { status: 500 }
    );
  }
}
