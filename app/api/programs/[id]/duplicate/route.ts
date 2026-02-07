/**
 * Duplicate Program API Route
 *
 * POST /api/programs/[id]/duplicate - Duplicate program
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

const duplicateProgramSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

// POST /api/programs/[id]/duplicate - Duplicate program
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
    const data = duplicateProgramSchema.parse(body);

    // Fetch original program with all nested data
    const original = await prisma.program.findFirst({
      where: { id, trainerId: user.id },
      include: {
        weeks: {
          include: {
            workouts: {
              include: {
                exercises: {
                  include: {
                    configurations: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!original) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    // Create the base program
    const duplicated = await prisma.program.create({
      data: {
        trainerId: user.id,
        name: data.name || `${original.name} (Copy)`,
        description: original.description,
        programType: original.programType,
        difficultyLevel: original.difficultyLevel,
        durationWeeks: original.durationWeeks,
        goals: original.goals,
        equipmentNeeded: original.equipmentNeeded,
        isTemplate: false,
      },
    });

    // Duplicate weeks with workouts and exercises
    for (const week of original.weeks) {
      const newWeek = await prisma.programWeek.create({
        data: {
          programId: duplicated.id,
          weekNumber: week.weekNumber,
          name: week.name,
          description: week.description,
          isDeload: week.isDeload,
        },
      });

      for (const workout of week.workouts) {
        const newWorkout = await prisma.programWorkout.create({
          data: {
            programWeekId: newWeek.id,
            dayNumber: workout.dayNumber,
            name: workout.name,
            description: workout.description,
            workoutType: workout.workoutType,
            estimatedDuration: workout.estimatedDuration,
            isRestDay: workout.isRestDay,
          },
        });

        for (const exercise of workout.exercises) {
          const newExercise = await prisma.workoutExercise.create({
            data: {
              workoutId: newWorkout.id,
              exerciseId: exercise.exerciseId,
              orderIndex: exercise.orderIndex,
              supersetGroup: exercise.supersetGroup,
              setsConfig: exercise.setsConfig || {},
              notes: exercise.notes,
            },
          });

          if (exercise.configurations && exercise.configurations.length > 0) {
            for (const config of exercise.configurations) {
              await prisma.exerciseConfiguration.create({
                data: {
                  workoutExerciseId: newExercise.id,
                  setNumber: config.setNumber,
                  setType: config.setType,
                  reps: config.reps,
                  weightGuidance: config.weightGuidance,
                  restSeconds: config.restSeconds,
                  tempo: config.tempo,
                  rpe: config.rpe,
                  rir: config.rir,
                  notes: config.notes,
                },
              });
            }
          }
        }
      }
    }

    // Fetch the complete duplicated program
    const completeProgram = await prisma.program.findUnique({
      where: { id: duplicated.id },
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
      { success: true, message: 'Program duplicated successfully', data: completeProgram },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error duplicating program:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to duplicate program' },
      { status: 500 }
    );
  }
}
