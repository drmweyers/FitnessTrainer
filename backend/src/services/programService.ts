import { PrismaClient, ProgramType, FitnessLevel, WorkoutType, SetType } from '@prisma/client';
import { prisma } from '../index';
import { createError } from '@/middleware/errorHandler';

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
}

export const programService = new ProgramService();