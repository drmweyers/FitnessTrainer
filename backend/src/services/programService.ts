import { PrismaClient, ProgramType, FitnessLevel, WorkoutType, SetType } from '@prisma/client';
import { prisma } from '../index';
import { createError } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';

interface CreateProgramDto {
  name: string;
  description?: string;
  programType: ProgramType;
  difficultyLevel: FitnessLevel;
  durationWeeks: number;
  goals?: string[];
  equipmentNeeded?: string[];
  isTemplate?: boolean;
  weeks?: CreateWeekDto[];
}

interface CreateWeekDto {
  weekNumber: number;
  name: string;
  description?: string;
  isDeload?: boolean;
  workouts?: CreateWorkoutDto[];
}

interface CreateWorkoutDto {
  dayNumber: number;
  name: string;
  description?: string;
  workoutType?: WorkoutType;
  estimatedDuration?: number;
  isRestDay?: boolean;
  exercises?: CreateWorkoutExerciseDto[];
}

interface CreateWorkoutExerciseDto {
  exerciseId: string;
  orderIndex: number;
  supersetGroup?: string;
  setsConfig: any;
  notes?: string;
  configurations?: CreateExerciseConfigDto[];
}

interface CreateExerciseConfigDto {
  setNumber: number;
  setType: SetType;
  reps: string;
  weightGuidance?: string;
  restSeconds?: number;
  tempo?: string;
  rpe?: number;
  rir?: number;
  notes?: string;
}

export class ProgramService {
  // Create a new program
  async createProgram(trainerId: string, data: CreateProgramDto) {
    try {
      const program = await prisma.program.create({
        data: {
          trainerId,
          name: data.name,
          description: data.description,
          programType: data.programType,
          difficultyLevel: data.difficultyLevel,
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
                  workoutType: workout.workoutType,
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
                        create: exercise.configurations
                      } : undefined
                    }))
                  } : undefined
                }))
              } : undefined
            }))
          } : undefined
        },
        include: {
          weeks: {
            include: {
              workouts: {
                include: {
                  exercises: {
                    include: {
                      exercise: true,
                      configurations: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      return program;
    } catch (error) {
      console.error('Error creating program:', error);
      throw createError(500, 'Failed to create program');
    }
  }

  // Get all programs for a trainer
  async getTrainerPrograms(trainerId: string, includeTemplates = false) {
    try {
      const programs = await prisma.program.findMany({
        where: {
          trainerId,
          isTemplate: includeTemplates ? undefined : false
        },
        include: {
          weeks: {
            include: {
              workouts: {
                include: {
                  exercises: {
                    include: {
                      exercise: true
                    }
                  }
                }
              }
            }
          },
          assignments: {
            include: {
              client: {
                select: {
                  id: true,
                  email: true,
                  userProfile: {
                    select: {
                      bio: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return programs;
    } catch (error) {
      console.error('Error fetching programs:', error);
      throw createError(500, 'Failed to fetch programs');
    }
  }

  // Get a single program with full details
  async getProgramById(programId: string, trainerId: string) {
    try {
      const program = await prisma.program.findFirst({
        where: {
          id: programId,
          trainerId
        },
        include: {
          weeks: {
            include: {
              workouts: {
                include: {
                  exercises: {
                    include: {
                      exercise: true,
                      configurations: true
                    }
                  }
                }
              }
            },
            orderBy: {
              weekNumber: 'asc'
            }
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
                      profilePhotoUrl: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!program) {
        throw createError(404, 'Program not found');
      }

      return program;
    } catch (error: any) {
      if (error.statusCode === 404) throw error;
      console.error('Error fetching program:', error);
      throw createError(500, 'Failed to fetch program');
    }
  }

  // Update program
  async updateProgram(programId: string, trainerId: string, data: Partial<CreateProgramDto>) {
    try {
      // Verify ownership
      const existing = await prisma.program.findFirst({
        where: {
          id: programId,
          trainerId
        }
      });

      if (!existing) {
        throw createError(404, 'Program not found');
      }

      const updated = await prisma.program.update({
        where: { id: programId },
        data: {
          name: data.name,
          description: data.description,
          programType: data.programType,
          difficultyLevel: data.difficultyLevel,
          durationWeeks: data.durationWeeks,
          goals: data.goals,
          equipmentNeeded: data.equipmentNeeded,
          isTemplate: data.isTemplate
        },
        include: {
          weeks: {
            include: {
              workouts: {
                include: {
                  exercises: {
                    include: {
                      exercise: true,
                      configurations: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      return updated;
    } catch (error: any) {
      if (error.statusCode === 404) throw error;
      console.error('Error updating program:', error);
      throw createError(500, 'Failed to update program');
    }
  }

  // Delete program
  async deleteProgram(programId: string, trainerId: string) {
    try {
      // Verify ownership
      const existing = await prisma.program.findFirst({
        where: {
          id: programId,
          trainerId
        }
      });

      if (!existing) {
        throw createError(404, 'Program not found');
      }

      await prisma.program.delete({
        where: { id: programId }
      });

      return { success: true, message: 'Program deleted successfully' };
    } catch (error: any) {
      if (error.statusCode === 404) throw error;
      console.error('Error deleting program:', error);
      throw createError(500, 'Failed to delete program');
    }
  }

  // Duplicate a program
  async duplicateProgram(programId: string, trainerId: string, newName?: string) {
    try {
      const original = await prisma.program.findFirst({
        where: {
          id: programId,
          trainerId
        },
        include: {
          weeks: {
            include: {
              workouts: {
                include: {
                  exercises: {
                    include: {
                      configurations: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!original) {
        throw createError(404, 'Program not found');
      }
      
      // Create the base program first
      const duplicated = await prisma.program.create({
        data: {
          trainerId,
          name: newName || `${original.name} (Copy)`,
          description: original.description,
          programType: original.programType,
          difficultyLevel: original.difficultyLevel,
          durationWeeks: original.durationWeeks,
          goals: original.goals,
          equipmentNeeded: original.equipmentNeeded,
          isTemplate: false,
        }
      });

      // Now duplicate weeks with their workouts and exercises
      for (const week of original.weeks) {
        const newWeek = await prisma.programWeek.create({
          data: {
            programId: duplicated.id,
            weekNumber: week.weekNumber,
            name: week.name,
            description: week.description,
            isDeload: week.isDeload,
          }
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
            }
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
              }
            });

            // Duplicate configurations if they exist
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
                  }
                });
              }
            }
          }
        }
      }

      // Fetch the complete duplicated program with all relations
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
                      configurations: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      return completeProgram;
    } catch (error) {
      console.error('Error duplicating program:', error);
      throw createError(500, 'Failed to duplicate program');
    }
  }

  // Assign program to client
  async assignProgram(programId: string, clientId: string, trainerId: string, startDate: Date) {
    try {
      // Verify program ownership
      const program = await prisma.program.findFirst({
        where: {
          id: programId,
          trainerId
        }
      });

      if (!program) {
        throw createError(404, 'Program not found');
      }

      // Check client relationship
      const clientRelation = await prisma.trainerClient.findFirst({
        where: {
          trainerId,
          clientId,
          status: 'active'
        }
      });

      if (!clientRelation) {
        throw createError(403, 'Client not found or inactive');
      }

      // Calculate end date
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (program.durationWeeks * 7));

      const assignment = await prisma.programAssignment.create({
        data: {
          programId,
          clientId,
          trainerId,
          startDate,
          endDate
        },
        include: {
          program: true,
          client: {
            select: {
              id: true,
              email: true,
              userProfile: {
                select: {
                  bio: true
                }
              }
            }
          }
        }
      });

      return assignment;
    } catch (error: any) {
      if (error.statusCode) throw error;
      console.error('Error assigning program:', error);
      throw createError(500, 'Failed to assign program');
    }
  }

  // Get client's active programs
  async getClientPrograms(clientId: string, trainerId: string) {
    try {
      const assignments = await prisma.programAssignment.findMany({
        where: {
          clientId,
          trainerId,
          isActive: true
        },
        include: {
          program: {
            include: {
              weeks: {
                include: {
                  workouts: {
                    include: {
                      exercises: {
                        include: {
                          exercise: true,
                          configurations: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      return assignments;
    } catch (error) {
      console.error('Error fetching client programs:', error);
      throw createError(500, 'Failed to fetch client programs');
    }
  }

  // Get program templates
  async getTemplates(category?: string) {
    try {
      const templates = await prisma.programTemplate.findMany({
        where: {
          isPublic: true,
          category: category || undefined
        },
        include: {
          program: {
            include: {
              weeks: {
                include: {
                  workouts: {
                    include: {
                      exercises: {
                        include: {
                          exercise: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          creator: {
            select: {
              id: true,
              email: true,
              userProfile: {
                select: {
                  bio: true
                }
              }
            }
          }
        },
        orderBy: {
          useCount: 'desc'
        }
      });

      return templates;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw createError(500, 'Failed to fetch templates');
    }
  }

  // =====================================
  // EXERCISE GROUP MANAGEMENT (Supersets/Circuits)
  // =====================================

  /**
   * Create an exercise group (superset, circuit, or giant set)
   */
  async createExerciseGroup(
    workoutId: string,
    trainerId: string,
    data: {
      name: string;
      groupType: 'superset' | 'circuit' | 'giant_set';
      exerciseIds: string[];
      rounds?: number;
      restBetweenExercises?: number;
      restBetweenSets?: number;
    }
  ) {
    // Verify workout exists and belongs to trainer
    const workout = await prisma.programWorkout.findFirst({
      where: { id: workoutId },
      include: {
        week: {
          include: {
            program: true,
          },
        },
      },
    });

    if (!workout || workout.week.program.trainerId !== trainerId) {
      throw createError(404, 'Workout not found');
    }

    if (!workout) {
      throw createError(404, 'Workout not found');
    }

    // Validate group requirements
    if (data.groupType === 'superset' && data.exerciseIds.length < 2) {
      throw createError(400, 'Superset requires at least 2 exercises');
    }

    if (data.groupType === 'circuit' && data.exerciseIds.length < 3) {
      throw createError(400, 'Circuit requires at least 3 exercises');
    }

    if (data.groupType === 'giant_set' && data.exerciseIds.length < 4) {
      throw createError(400, 'Giant set requires at least 4 exercises');
    }

    // Get exercises
    const exercises = await prisma.exercise.findMany({
      where: {
        id: { in: data.exerciseIds },
        isActive: true,
      },
      select: { id: true, name: true },
    });

    if (exercises.length !== data.exerciseIds.length) {
      throw createError(404, 'One or more exercises not found');
    }

    // Assign group identifier (A, B, C, etc.)
    const groupIdentifier = await this.getNextGroupIdentifier(workoutId);

    // Update all exercises with the group identifier
    for (let i = 0; i < data.exerciseIds.length; i++) {
      const exerciseId = data.exerciseIds[i];

      await prisma.workoutExercise.updateMany({
        where: {
          workoutId,
          exerciseId,
        },
        data: {
          supersetGroup: groupIdentifier,
        },
      });
    }

    // Get updated exercises
    const updatedExercises = await prisma.workoutExercise.findMany({
      where: {
        workoutId,
        exerciseId: { in: data.exerciseIds },
      },
      include: {
        exercise: {
          select: { id: true, name: true, bodyPart: true, equipment: true, gifUrl: true },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    return {
      id: `${workoutId}-${groupIdentifier}`,
      workoutId,
      groupType: data.groupType,
      name: data.name || `${data.groupType.charAt(0).toUpperCase()}${groupIdentifier}`,
      groupIdentifier,
      exercises: updatedExercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        name: ex.exercise.name,
        bodyPart: ex.exercise.bodyPart,
        equipment: ex.exercise.equipment,
        gifUrl: ex.exercise.gifUrl,
      })),
      ...(data.restBetweenExercises !== undefined && { restBetweenExercises: data.restBetweenExercises }),
      ...(data.restBetweenSets !== undefined && { restBetweenSets: data.restBetweenSets }),
      ...(data.rounds && { rounds: data.rounds }),
    };
  }

  /**
   * Update an exercise group
   */
  async updateExerciseGroup(
    workoutId: string,
    trainerId: string,
    groupIdentifier: string,
    updates: {
      name?: string;
      restBetweenExercises?: number;
      restBetweenSets?: number;
    }
  ) {
    // Verify workout exists and belongs to trainer
    const workout = await prisma.programWorkout.findFirst({
      where: { id: workoutId },
      include: {
        week: {
          include: {
            program: true,
          },
        },
      },
    });

    if (!workout || workout.week.program.trainerId !== trainerId) {
      throw createError(404, 'Workout not found');
    }

    if (!workout) {
      throw createError(404, 'Workout not found');
    }

    // Get exercises in the group
    const groupExercises = await prisma.workoutExercise.findMany({
      where: {
        workoutId,
        supersetGroup: groupIdentifier,
      },
      include: {
        exercise: {
          select: {
            id: true,
            exerciseId: true,
            name: true,
            bodyPart: true,
            gifUrl: true,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    if (groupExercises.length === 0) {
      throw createError(404, 'Group not found');
    }

    // Return updated group info
    return {
      id: `${workoutId}-${groupIdentifier}`,
      workoutId,
      groupIdentifier,
      groupType: groupExercises.length >= 4 ? 'giant_set' : groupExercises.length >= 3 ? 'circuit' : 'superset',
      name: updates.name || `${groupExercises.length >= 4 ? 'Giant Set' : groupExercises.length >= 3 ? 'Circuit' : 'Superset'} ${groupIdentifier}`,
      exerciseCount: groupExercises.length,
      exercises: groupExercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        name: ex.exercise.name,
        bodyPart: ex.exercise.bodyPart,
        gifUrl: ex.exercise.gifUrl,
      })),
      ...updates,
    };
  }

  /**
   * Ungroup exercises (remove group identifier)
   */
  async ungroupExercises(
    workoutId: string,
    trainerId: string,
    groupIdentifier: string
  ) {
    // Verify workout exists and belongs to trainer
    const workout = await prisma.programWorkout.findFirst({
      where: { id: workoutId },
      include: {
        week: {
          include: {
            program: true,
          },
        },
      },
    });

    if (!workout || workout.week.program.trainerId !== trainerId) {
      throw createError(404, 'Workout not found');
    }

    if (!workout) {
      throw createError(404, 'Workout not found');
    }

    // Remove group identifier from all exercises in the group
    const result = await prisma.workoutExercise.updateMany({
      where: {
        workoutId,
        supersetGroup: groupIdentifier,
      },
      data: {
        supersetGroup: null,
      },
    });

    logger.info(`Ungrouped exercises in group ${groupIdentifier} in workout ${workoutId}`);

    return {
      success: true,
      message: 'Exercises ungrouped successfully',
      count: result.count,
    };
  }

  /**
   * Duplicate an exercise group
   */
  async duplicateGroup(
    workoutId: string,
    trainerId: string,
    sourceGroupIdentifier: string,
    targetGroupIdentifier?: string
  ) {
    // Verify workout exists and belongs to trainer
    const workout = await prisma.programWorkout.findFirst({
      where: { id: workoutId },
      include: {
        week: {
          include: {
            program: true,
          },
        },
      },
    });

    if (!workout || workout.week.program.trainerId !== trainerId) {
      throw createError(404, 'Workout not found');
    }

    // Get exercises in the source group
    const groupExercises = await prisma.workoutExercise.findMany({
      where: {
        workoutId,
        supersetGroup: sourceGroupIdentifier,
      },
      include: {
        exercise: {
          select: {
            id: true,
            exerciseId: true,
            name: true,
            bodyPart: true,
            equipment: true,
            targetMuscle: true,
            gifUrl: true,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    if (groupExercises.length === 0) {
      throw createError(404, 'Group not found');
    }

    // Get next available group identifier if not specified
    const targetGroup = targetGroupIdentifier || await this.getNextGroupIdentifier(workoutId);

    // Find the highest order index in the workout
    const maxOrderResult = await prisma.workoutExercise.aggregate({
      where: { workoutId },
      _max: { orderIndex: true },
    });

    const nextOrderIndex = (maxOrderResult._max.orderIndex || 0) + 1;

    // Create new exercises by duplicating the source exercises
    const createdExercises = [];

    for (const sourceExercise of groupExercises) {
      // Create new exercise
      const newExercise = await prisma.workoutExercise.create({
        data: {
          workoutId,
          exerciseId: sourceExercise.exerciseId,
          orderIndex: nextOrderIndex + sourceExercise.orderIndex,
          supersetGroup: targetGroup,
          setsConfig: [],
          notes: `Duplicated from group ${sourceGroupIdentifier}`,
        },
      });

      // Copy configurations if they exist
      const configurations = await prisma.exerciseConfiguration.findMany({
        where: { workoutExerciseId: sourceExercise.id },
        include: {
          workoutExercise: {
            include: {
              exercise: true,
            },
          },
        },
      });

      for (const config of configurations) {
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

      createdExercises.push(newExercise);
    }

    logger.info(
      `Duplicated group ${sourceGroupIdentifier} as ${targetGroup} in workout ${workoutId}`
    );

    return {
      id: `${workoutId}-${targetGroup}`,
      workoutId,
      groupType: groupExercises.length >= 4 ? 'giant_set' : groupExercises.length >= 3 ? 'circuit' : 'superset',
      name: `${groupExercises.length >= 4 ? 'Giant Set' : groupExercises.length >= 3 ? 'Circuit' : 'Superset'} ${targetGroup}`,
      groupIdentifier: targetGroup,
      exerciseCount: groupExercises.length,
      exercises: groupExercises.map((ex: any) => ({
        exerciseId: ex.exerciseId,
        name: ex.exercise.name,
        bodyPart: ex.exercise.bodyPart,
        equipment: ex.exercise.equipment,
        gifUrl: ex.exercise.gifUrl,
      })),
    };
  }

  /**
   * Get the next available group identifier (A, B, C, etc.)
   */
  private async getNextGroupIdentifier(workoutId: string): Promise<string> {
    // Get all used group identifiers in the workout
    const usedGroups = await prisma.workoutExercise.findMany({
      where: {
        workoutId,
        supersetGroup: { not: null },
      },
      select: { supersetGroup: true },
      distinct: ['supersetGroup'],
    });

    const usedIdentifiers = new Set(usedGroups.map((g) => g.supersetGroup));
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Find first available identifier
    for (const letter of alphabet) {
      if (!usedIdentifiers.has(letter)) {
        return letter;
      }
    }

    throw createError(400, 'Maximum number of groups reached (26)');
  }

  /**
   * Get all groups in a workout
   */
  async getWorkoutGroups(workoutId: string) {
    const groups = await prisma.workoutExercise.findMany({
      where: {
        workoutId,
        supersetGroup: { not: null },
      },
      select: {
        supersetGroup: true,
      },
      distinct: ['supersetGroup'],
      orderBy: { supersetGroup: 'asc' },
    });

    return groups.map((g) => g.supersetGroup);
  }

  // =====================================
  // PROGRESSIVE OVERLOAD MANAGEMENT
  // =====================================

  /**
   * Apply progressive overload to a workout across weeks
   */
  async applyProgressiveOverload(
    programId: string,
    trainerId: string,
    config: {
      overloadType: 'linear' | 'percentage' | 'custom';
      targetExercises?: string[];
      weeklyIncrease?: number;
      maxWeeks?: number;
    }
  ) {
    // Verify program belongs to trainer
    const program = await prisma.program.findFirst({
      where: { id: programId, trainerId },
    });

    if (!program) {
      throw createError(404, 'Program not found');
    }

    // Get all workouts in the program
    const weeks = await prisma.programWeek.findMany({
      where: { programId },
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
          orderBy: { dayNumber: 'asc' },
        },
      },
      orderBy: { weekNumber: 'asc' },
    });

    const results = [];

    for (const week of weeks) {
      for (const workout of week.workouts) {
        for (const workoutExercise of workout.exercises) {
          // Skip if target exercises specified and this exercise is not in the list
          if (config.targetExercises && !config.targetExercises.includes(workoutExercise.exerciseId)) {
            continue;
          }

          // Get current configurations
          const configs = await prisma.exerciseConfiguration.findMany({
            where: { workoutExerciseId: workoutExercise.id },
          });

          for (const configItem of configs) {
            if (configItem.setType !== 'working') continue;

            let newReps = configItem.reps;
            let newWeight = configItem.weightGuidance;

            // Apply progressive overload based on type
            switch (config.overloadType) {
              case 'linear':
                // Increase reps by 1-2 every week
                if (typeof configItem.reps === 'string' && configItem.reps.match(/^\d+$/)) {
                  const repNum = parseInt(configItem.reps);
                  newReps = `${repNum + Math.floor(week.weekNumber / 2)}`;
                }
                break;

              case 'percentage':
                // Increase weight by percentage
                if (configItem.weightGuidance && config.weeklyIncrease) {
                  const weightMatch = configItem.weightGuidance.match(/(\d+)/);
                  if (weightMatch) {
                    const weight = parseInt(weightMatch[1]);
                    const increase = Math.round(weight * (config.weeklyIncrease / 100) * week.weekNumber);
                    newWeight = `${weight + increase}${configItem.weightGuidance.replace(/\d+/, '')}`;
                  }
                }
                break;

              case 'custom':
                // Apply custom logic based on exercise type
                newReps = configItem.reps;
                newWeight = configItem.weightGuidance;
                break;
            }

            // Update configuration
            await prisma.exerciseConfiguration.update({
              where: { id: configItem.id },
              data: {
                reps: newReps,
                weightGuidance: newWeight,
              },
            });

            results.push({
              week: week.weekNumber,
              workout: workout.name,
              exercise: workoutExercise.exercise.name,
              oldReps: configItem.reps,
              newReps,
              oldWeight: configItem.weightGuidance,
              newWeight,
            });
          }
        }
      }
    }

    logger.info(`Applied progressive overload to program ${programId}: ${results.length} updates`);

    return {
      success: true,
      message: `Progressive overload applied to ${results.length} exercise configurations`,
      data: results,
    };
  }

  /**
   * Get progressive overload suggestions for an exercise
   */
  async getProgressionSuggestions(exerciseId: string, currentConfig: {
    reps: string;
    weight?: string;
    sets: number;
  }) {
    const suggestions = [];

    // Volume increase suggestions
    if (currentConfig.reps.match(/^\d+$/)) {
      const repNum = parseInt(currentConfig.reps);
      if (repNum < 12) {
        suggestions.push({
          type: 'volume',
          description: 'Increase reps',
          suggestion: `${repNum + 2} reps`,
          reason: 'Gradually increase volume to build muscle endurance',
        });
      } else {
        suggestions.push({
          type: 'intensity',
          description: 'Increase weight',
          suggestion: `Add 2.5-5 lbs to current weight`,
          reason: 'Max reps reached, time to increase intensity',
        });
      }
    }

    // Intensity increase suggestions
    if (currentConfig.weight) {
      const weightMatch = currentConfig.weight.match(/(\d+)/);
      if (weightMatch) {
        const weight = parseInt(weightMatch[1]);
        const increase = weight < 100 ? 5 : 10;
        suggestions.push({
          type: 'intensity',
          description: 'Progressive overload',
          suggestion: `${weight + increase} ${currentConfig.weight.replace(/\d+/, '').trim()}`,
          reason: `Standard ${increase}${currentConfig.weight.match(/kg/i) ? 'kg' : 'lb'} progression`,
        });
      }
    }

    // Set variation suggestions
    if (currentConfig.sets < 5) {
      suggestions.push({
        type: 'volume',
        description: 'Add a set',
        suggestion: `${currentConfig.sets + 1} sets`,
        reason: 'Increase total volume for more stimulus',
      });
    }

    // Advanced techniques
    if (currentConfig.sets >= 3 && currentConfig.reps.match(/^(8|10|12)$/)) {
      suggestions.push({
        type: 'technique',
        description: 'Drop sets',
        suggestion: 'Add 1-2 drop sets after working sets',
        reason: 'Push past failure for maximum hypertrophy',
      });
    }

    return {
      exerciseId,
      currentConfig,
      suggestions,
    };
  }

  /**
   * Get workout history for a client to track progression
   */
  async getClientProgression(clientId: string, exerciseId?: string) {
    const where: any = {
      workoutLog: {
        clientWorkout: {
          client: {
            trainerId: clientId,
          },
        },
      },
    };

    if (exerciseId) {
      where.exerciseId = exerciseId;
    }

    const history = await prisma.loggedSet.findMany({
      where,
      include: {
        workoutExercise: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        workoutLog: {
          include: {
            clientWorkout: {
              select: {
                client: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { workoutLog: { date: 'asc' } },
    });

    // Group by exercise and calculate progression
    const progression = {};

    for (const set of history) {
      const exerciseId = set.workoutExercise.exercise.id;
      const exerciseName = set.workoutExercise.exercise.name;

      if (!progression[exerciseId]) {
        progression[exerciseId] = {
          exerciseName,
          entries: [],
        };
      }

      progression[exerciseId].entries.push({
        date: set.workoutLog.date,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
      });
    }

    return Object.values(progression);
  }
}

export const programService = new ProgramService();