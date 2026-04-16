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
import { trainerOrAdmin } from '@/lib/middleware/authorize';

export const dynamic = 'force-dynamic';

const createProgramSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  // BUG 8 fixed: all ProgramType enum values from types/program.ts are now accepted
  programType: z.enum([
    'strength', 'hypertrophy', 'endurance', 'powerlifting',
    'bodybuilding', 'general_fitness', 'sport_specific', 'sports_specific', 'rehabilitation',
    'olympic_weightlifting', 'crossfit', 'calisthenics', 'cardio',
    'flexibility', 'weight_loss', 'muscle_gain', 'hybrid',
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

    // Shared include structure so ProgramCard renders correctly for both roles
    const programInclude = {
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
    };

    let programs;
    if (user.role === 'client') {
      // Return programs assigned to this client via ProgramAssignment
      const assignments = await prisma.programAssignment.findMany({
        where: { clientId: user.id },
        include: {
          program: {
            include: programInclude,
          },
        },
        orderBy: { assignedAt: 'desc' },
      });
      programs = assignments.map((a) => a.program);
    } else {
      // Trainer / admin: return their own programs
      programs = await prisma.program.findMany({
        where: {
          trainerId: user.id,
          isTemplate: includeTemplates ? undefined : false,
        },
        include: programInclude,
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

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

type ExerciseInput = NonNullable<NonNullable<NonNullable<z.infer<typeof createProgramSchema>['weeks']>[0]['workouts']>[0]['exercises']>[0];

function groupExercisesIntoSections(exercises: ExerciseInput[]) {
  type Group = { sectionType: string; exercises: ExerciseInput[] };
  const sorted = [...exercises].sort((a, b) => a.orderIndex - b.orderIndex);
  const groups: Group[] = [];

  for (const ex of sorted) {
    const type = (ex as any).sectionType ?? 'regular';
    const sg = (ex as any).supersetGroup ?? null;
    const last = groups[groups.length - 1];
    if (last && last.sectionType === type && (last.exercises[0] as any).supersetGroup === sg) {
      last.exercises.push(ex);
    } else {
      groups.push({ sectionType: type, exercises: [ex] });
    }
  }

  return groups;
}

function parseSectionNoteMeta(notesJson: string | null | undefined) {
  if (!notesJson) return { rounds: null, endRest: null, intervalWork: null, intervalRest: null };
  try {
    const p = JSON.parse(notesJson);
    return {
      rounds: typeof p.sectionRounds === 'number' ? p.sectionRounds : null,
      endRest: typeof p.endRest === 'number' ? p.endRest : null,
      intervalWork: typeof p.intervalWork === 'number' ? p.intervalWork : null,
      intervalRest: typeof p.intervalRest === 'number' ? p.intervalRest : null,
    };
  } catch {
    return { rounds: null, endRest: null, intervalWork: null, intervalRest: null };
  }
}

// POST /api/programs - Create new program (trainers + admins only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const authReq = authResult as AuthenticatedRequest;
    // Role guard: clients must not be able to create programs.
    const roleError = trainerOrAdmin(authReq);
    if (roleError) return roleError;
    const user = authReq.user!;

    const body = await request.json();
    const data = createProgramSchema.parse(body);

    const program = await prisma.$transaction(async (tx) => {
      const created = await tx.program.create({
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
                    orderBy: { orderIndex: 'asc' },
                  },
                },
              },
            },
          },
        },
      });

      // Create ProgramSection rows for every workout that has exercises.
      for (const week of (created.weeks ?? [])) {
        for (const workout of (week.workouts ?? [])) {
          if (!workout.exercises || workout.exercises.length === 0) continue;

          const inputExercises = data.weeks
            ?.find(w => w.weekNumber === week.weekNumber)
            ?.workouts?.find(wo => wo.dayNumber === workout.dayNumber)
            ?.exercises ?? [];

          const groups = groupExercisesIntoSections(
            inputExercises.length > 0 ? inputExercises : workout.exercises as any
          );

          for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const firstEx = group.exercises[0];
            const firstConfig = (firstEx as any).configurations?.[0];
            const meta = parseSectionNoteMeta(firstConfig?.notes ?? null);

            const section = await tx.programSection.create({
              data: {
                workoutId: workout.id,
                orderIndex: i,
                sectionType: group.sectionType,
                rounds: meta.rounds,
                endRest: meta.endRest,
                intervalWork: meta.intervalWork,
                intervalRest: meta.intervalRest,
              },
            });

            // Link each exercise in the group to its section.
            for (const inputEx of group.exercises) {
              const dbEx = workout.exercises.find(
                e => e.orderIndex === inputEx.orderIndex
              );
              if (dbEx) {
                await tx.workoutExercise.update({
                  where: { id: dbEx.id },
                  data: { sectionId: section.id },
                });
              }
            }
          }
        }
      }

      // Re-fetch with sections included for the response.
      return tx.program.findFirst({
        where: { id: created.id },
        include: {
          weeks: {
            include: {
              workouts: {
                include: {
                  exercises: {
                    include: { exercise: true, configurations: true },
                    orderBy: { orderIndex: 'asc' },
                  },
                  sections: { orderBy: { orderIndex: 'asc' } },
                },
              },
            },
          },
        },
      });
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
