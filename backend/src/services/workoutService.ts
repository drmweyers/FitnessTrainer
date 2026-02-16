import { PrismaClient, WorkoutStatus } from '@prisma/client';
import { prisma } from '../index';
import { createError } from '@/middleware/errorHandler';

// DTO Interfaces
interface CreateWorkoutSessionDto {
  programAssignmentId: string;
  workoutId: string;
  scheduledDate: Date;
}

interface UpdateWorkoutSessionDto {
  status?: WorkoutStatus;
  currentExerciseIndex?: number;
  currentSetIndex?: number;
  actualStartTime?: Date;
  actualEndTime?: Date;
  totalPausedTime?: number;
  totalDuration?: number;
  totalVolume?: number;
  completedSets?: number;
  averageRpe?: number;
  adherenceScore?: number;
  effortRating?: number;
  enjoymentRating?: number;
  energyBefore?: number;
  energyAfter?: number;
  clientNotes?: string;
  trainerFeedback?: string;
}

interface CreateExerciseLogDto {
  workoutExerciseId: string;
  exerciseId: string;
  orderIndex: number;
  supersetGroup?: string;
  notes?: string;
}

interface UpdateExerciseLogDto {
  skipped?: boolean;
  personalBest?: boolean;
  notes?: string;
  startTime?: Date;
  endTime?: Date;
}

interface CreateSetLogDto {
  setNumber: number;
  plannedReps?: string;
  actualReps?: number;
  weight?: number;
  rpe?: number;
  rir?: number;
  duration?: number;
  restTime?: number;
  tempo?: string;
  completed?: boolean;
  notes?: string;
}

interface UpdateSetLogDto {
  actualReps?: number;
  weight?: number;
  rpe?: number;
  rir?: number;
  duration?: number;
  restTime?: number;
  completed?: boolean;
  notes?: string;
  timestamp?: Date;
}

export const workoutService = {
  // Workout Session Management
  async createWorkoutSession(
    clientId: string,
    trainerId: string,
    data: CreateWorkoutSessionDto
  ) {
    // Verify program assignment exists and belongs to this client/trainer
    const programAssignment = await prisma.programAssignment.findFirst({
      where: {
        id: data.programAssignmentId,
        clientId,
        trainerId,
        isActive: true,
      },
      include: {
        program: true,
      },
    });

    if (!programAssignment) {
      throw createError(404, 'Program assignment not found');
    }

    // Verify workout exists in the program
    const workout = await prisma.programWorkout.findFirst({
      where: {
        id: data.workoutId,
        week: {
          programId: programAssignment.programId,
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            configurations: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    if (!workout) {
      throw createError(404, 'Workout not found in program');
    }

    // Check if session already exists for this date
    const existingSession = await prisma.workoutSession.findFirst({
      where: {
        programAssignmentId: data.programAssignmentId,
        workoutId: data.workoutId,
        clientId,
        scheduledDate: data.scheduledDate,
      },
    });

    if (existingSession) {
      return existingSession;
    }

    // Create workout session with exercise logs and set logs
    const session = await prisma.workoutSession.create({
      data: {
        programAssignmentId: data.programAssignmentId,
        workoutId: data.workoutId,
        clientId,
        trainerId,
        scheduledDate: data.scheduledDate,
        status: WorkoutStatus.scheduled,
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
              include: {
                configurations: true,
              },
            },
          },
          orderBy: {
            orderIndex: 'asc',
          },
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

    return session;
  },

  async getWorkoutSession(id: string, userId: string, userRole: string) {
    const session = await prisma.workoutSession.findFirst({
      where: {
        id,
        OR: [
          { clientId: userId },
          { trainerId: userRole === 'trainer' ? userId : undefined },
        ],
      },
      include: {
        exerciseLogs: {
          include: {
            setLogs: {
              orderBy: {
                setNumber: 'asc',
              },
            },
            exercise: true,
            workoutExercise: {
              include: {
                configurations: {
                  orderBy: {
                    setNumber: 'asc',
                  },
                },
              },
            },
          },
          orderBy: {
            orderIndex: 'asc',
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
        programAssignment: {
          include: {
            program: true,
          },
        },
      },
    });

    if (!session) {
      throw createError(404, 'Workout session not found');
    }

    return session;
  },

  async updateWorkoutSession(
    id: string,
    userId: string,
    data: UpdateWorkoutSessionDto
  ) {
    // Verify session exists and user has access
    const existingSession = await prisma.workoutSession.findFirst({
      where: {
        id,
        clientId: userId,
      },
    });

    if (!existingSession) {
      throw createError(404, 'Workout session not found');
    }

    // Calculate metrics if completing workout
    let updateData = { ...data };

    if (data.status === WorkoutStatus.completed && data.actualEndTime) {
      const completedSets = await prisma.workoutSetLog.count({
        where: {
          exerciseLog: {
            workoutSessionId: id,
          },
          completed: true,
        },
      });

      const totalVolumeResult = await prisma.workoutSetLog.aggregate({
        where: {
          exerciseLog: {
            workoutSessionId: id,
          },
          completed: true,
          weight: { not: null },
          actualReps: { not: null },
        },
        _sum: {
          weight: true,
        },
      });

      const averageRpeResult = await prisma.workoutSetLog.aggregate({
        where: {
          exerciseLog: {
            workoutSessionId: id,
          },
          completed: true,
          rpe: { not: null },
        },
        _avg: {
          rpe: true,
        },
      });

      // Calculate total duration in minutes
      const totalDuration = existingSession.actualStartTime && data.actualEndTime
        ? Math.round(
            (data.actualEndTime.getTime() - existingSession.actualStartTime.getTime()) / 
            (1000 * 60)
          )
        : undefined;

      // Calculate adherence score (percentage of sets completed)
      const adherenceScore = existingSession.totalSets 
        ? (completedSets / existingSession.totalSets) * 100
        : 0;

      updateData = {
        ...updateData,
        completedSets,
        totalDuration,
        totalVolume: totalVolumeResult._sum.weight?.toNumber() || 0,
        averageRpe: averageRpeResult._avg.rpe?.toNumber() || undefined,
        adherenceScore,
      };
    }

    const session = await prisma.workoutSession.update({
      where: { id },
      data: updateData,
      include: {
        exerciseLogs: {
          include: {
            setLogs: {
              orderBy: {
                setNumber: 'asc',
              },
            },
            exercise: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    return session;
  },

  async getUserWorkoutSessions(
    userId: string,
    userRole: string,
    options: {
      status?: WorkoutStatus;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const { status, limit = 50, offset = 0, startDate, endDate } = options;

    const where = {
      ...(userRole === 'client' 
        ? { clientId: userId }
        : { trainerId: userId }
      ),
      ...(status && { status }),
      ...(startDate || endDate ? {
        scheduledDate: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      } : {}),
    };

    const sessions = await prisma.workoutSession.findMany({
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
        ...(userRole === 'trainer' ? {
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
        } : {}),
      },
      orderBy: {
        scheduledDate: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.workoutSession.count({ where });

    return {
      sessions,
      total,
      hasMore: offset + limit < total,
    };
  },

  // Exercise Log Management
  async updateExerciseLog(
    exerciseLogId: string,
    userId: string,
    data: UpdateExerciseLogDto
  ) {
    // Verify exercise log exists and user has access
    const existingLog = await prisma.workoutExerciseLog.findFirst({
      where: {
        id: exerciseLogId,
        workoutSession: {
          clientId: userId,
        },
      },
    });

    if (!existingLog) {
      throw createError(404, 'Exercise log not found');
    }

    // Calculate total volume if updating
    const updateData = { ...data };
    if (data.endTime && !existingLog.startTime) {
      updateData.startTime = new Date();
    }

    const exerciseLog = await prisma.workoutExerciseLog.update({
      where: { id: exerciseLogId },
      data: updateData,
      include: {
        setLogs: {
          orderBy: {
            setNumber: 'asc',
          },
        },
        exercise: true,
      },
    });

    // Calculate and update total volume for the exercise
    const totalVolume = exerciseLog.setLogs.reduce((sum, set) => {
      if (set.completed && set.weight && set.actualReps) {
        return sum + (Number(set.weight) * set.actualReps);
      }
      return sum;
    }, 0);

    if (totalVolume > 0) {
      await prisma.workoutExerciseLog.update({
        where: { id: exerciseLogId },
        data: { totalVolume },
      });
    }

    return exerciseLog;
  },

  // Set Log Management
  async updateSetLog(
    setLogId: string,
    userId: string,
    data: UpdateSetLogDto
  ) {
    // Verify set log exists and user has access
    const existingLog = await prisma.workoutSetLog.findFirst({
      where: {
        id: setLogId,
        exerciseLog: {
          workoutSession: {
            clientId: userId,
          },
        },
      },
    });

    if (!existingLog) {
      throw createError(404, 'Set log not found');
    }

    const setLog = await prisma.workoutSetLog.update({
      where: { id: setLogId },
      data: {
        ...data,
        ...(data.completed && !data.timestamp ? { timestamp: new Date() } : {}),
      },
    });

    // Update exercise total volume and workout session metrics
    if (data.completed !== undefined || data.weight !== undefined || data.actualReps !== undefined) {
      await workoutService.recalculateWorkoutMetrics(existingLog.exerciseLogId);
    }

    return setLog;
  },

  // Analytics and Progress
  async getWorkoutAnalytics(
    userId: string,
    userRole: string,
    options: {
      period?: 'week' | 'month' | 'quarter' | 'year';
      startDate?: Date;
      endDate?: Date;
      clientId?: string; // For trainers viewing client analytics
    } = {}
  ) {
    const { period = 'month', startDate, endDate, clientId } = options;

    // Date range calculation
    const now = new Date();
    const dateRange = { start: startDate, end: endDate };
    
    if (!startDate || !endDate) {
      switch (period) {
        case 'week':
          dateRange.start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateRange.start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'quarter':
          dateRange.start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case 'year':
          dateRange.start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
      }
      dateRange.end = now;
    }

    const targetUserId = userRole === 'trainer' && clientId ? clientId : userId;
    const where = {
      clientId: targetUserId,
      status: WorkoutStatus.completed,
      actualEndTime: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    };

    // Get basic workout stats
    const workoutStats = await prisma.workoutSession.aggregate({
      where,
      _count: {
        id: true,
      },
      _avg: {
        totalDuration: true,
        totalVolume: true,
        averageRpe: true,
        adherenceScore: true,
      },
      _sum: {
        totalVolume: true,
        completedSets: true,
      },
    });

    // Get workout frequency over time
    const workoutFrequency = await prisma.workoutSession.groupBy({
      by: ['scheduledDate'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    // Get volume progression
    const volumeProgression = await prisma.workoutSession.findMany({
      where: {
        ...where,
        totalVolume: { not: null },
      },
      select: {
        scheduledDate: true,
        totalVolume: true,
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    // Get top exercises by volume
    const topExercises = await prisma.workoutExerciseLog.groupBy({
      by: ['exerciseId'],
      where: {
        workoutSession: where,
        totalVolume: { not: null },
      },
      _sum: {
        totalVolume: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          totalVolume: 'desc',
        },
      },
      take: 10,
    });

    // Get exercise details for top exercises
    const topExerciseDetails = await prisma.exercise.findMany({
      where: {
        id: {
          in: topExercises.map(ex => ex.exerciseId),
        },
      },
      select: {
        id: true,
        name: true,
        bodyPart: true,
      },
    });

    return {
      period,
      dateRange,
      totalWorkouts: workoutStats._count.id,
      averageDuration: workoutStats._avg.totalDuration,
      totalVolume: workoutStats._sum.totalVolume,
      averageRpe: workoutStats._avg.averageRpe,
      averageAdherence: workoutStats._avg.adherenceScore,
      totalSetsCompleted: workoutStats._sum.completedSets,
      workoutFrequency: workoutFrequency.map(item => ({
        date: item.scheduledDate.toISOString().split('T')[0],
        count: item._count.id,
      })),
      volumeProgression: volumeProgression.map(item => ({
        date: item.scheduledDate.toISOString().split('T')[0],
        volume: item.totalVolume,
      })),
      topExercises: topExercises.map(item => {
        const exercise = topExerciseDetails.find(ex => ex.id === item.exerciseId);
        return {
          exerciseId: item.exerciseId,
          exerciseName: exercise?.name || 'Unknown',
          bodyPart: exercise?.bodyPart || 'Unknown',
          totalVolume: item._sum.totalVolume,
          sessionCount: item._count.id,
        };
      }),
    };
  },

  // Helper method to recalculate workout metrics
  async recalculateWorkoutMetrics(exerciseLogId: string) {
    // Get all set logs for this exercise
    const exerciseLog = await prisma.workoutExerciseLog.findUnique({
      where: { id: exerciseLogId },
      include: {
        setLogs: true,
      },
    });

    if (!exerciseLog) return;

    // Calculate exercise total volume
    const totalVolume = exerciseLog.setLogs.reduce((sum, set) => {
      if (set.completed && set.weight && set.actualReps) {
        return sum + (Number(set.weight) * set.actualReps);
      }
      return sum;
    }, 0);

    // Update exercise log
    await prisma.workoutExerciseLog.update({
      where: { id: exerciseLogId },
      data: { totalVolume: totalVolume > 0 ? totalVolume : null },
    });

    // Update workout session metrics
    const workoutSession = await prisma.workoutSession.findFirst({
      where: {
        exerciseLogs: {
          some: { id: exerciseLogId },
        },
      },
      include: {
        exerciseLogs: {
          include: {
            setLogs: {
              where: { completed: true },
            },
          },
        },
      },
    });

    if (workoutSession) {
      const completedSets = workoutSession.exerciseLogs.reduce(
        (sum, ex) => sum + ex.setLogs.length,
        0
      );

      const totalSessionVolume = workoutSession.exerciseLogs.reduce(
        (sum, ex) => sum + (Number(ex.totalVolume) || 0),
        0
      );

      const allRpes = workoutSession.exerciseLogs.flatMap(ex => 
        ex.setLogs.map(set => Number(set.rpe)).filter(rpe => !isNaN(rpe))
      );
      const averageRpe = allRpes.length > 0 
        ? allRpes.reduce((sum, rpe) => sum + rpe, 0) / allRpes.length
        : null;

      const adherenceScore = workoutSession.totalSets
        ? (completedSets / workoutSession.totalSets) * 100
        : 0;

      await prisma.workoutSession.update({
        where: { id: workoutSession.id },
        data: {
          completedSets,
          totalVolume: totalSessionVolume > 0 ? totalSessionVolume : null,
          averageRpe,
          adherenceScore,
        },
      });
    }
  },

  // Get live workout data for trainer dashboard
  async getLiveWorkoutData(trainerId: string) {
    const activeWorkouts = await prisma.workoutSession.findMany({
      where: {
        trainerId,
        status: WorkoutStatus.in_progress,
        actualStartTime: { not: null },
      },
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
        workout: {
          select: {
            name: true,
            estimatedDuration: true,
          },
        },
        exerciseLogs: {
          where: {
            startTime: { not: null },
            endTime: null,
          },
          include: {
            exercise: {
              select: {
                name: true,
              },
            },
            setLogs: {
              where: {
                completed: false,
              },
              orderBy: {
                setNumber: 'asc',
              },
              take: 1,
            },
          },
          orderBy: {
            orderIndex: 'asc',
          },
          take: 1,
        },
      },
    });

    return activeWorkouts.map(session => {
      const currentExercise = session.exerciseLogs[0];
      const currentSet = currentExercise?.setLogs[0];
      
      const elapsedTime = session.actualStartTime 
        ? Math.floor((Date.now() - session.actualStartTime.getTime()) / 1000 / 60)
        : 0;

      return {
        sessionId: session.id,
        clientId: session.clientId,
        clientName: session.client.email.split('@')[0], // Use email prefix as name
        workoutName: session.workout.name,
        status: currentSet ? 'active' : 'resting',
        currentExercise: currentExercise?.exercise.name || 'Warming up',
        currentSet: currentSet?.setNumber || 0,
        totalSets: session.totalSets || 0,
        startTime: session.actualStartTime?.toISOString() || '',
        elapsedMinutes: elapsedTime,
        expectedDuration: session.workout.estimatedDuration || 60,
        completionPercentage: session.adherenceScore || 0,
        lastActivity: session.updatedAt?.toISOString() || '',
      };
    });
  },

  // Get today's scheduled workout for a client
  async getTodaysWorkout(clientId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find active program assignment for this client
    const programAssignment = await prisma.programAssignment.findFirst({
      where: {
        clientId,
        isActive: true,
        startDate: { lte: new Date() },
        OR: [
          { endDate: { gte: new Date() } },
          { endDate: null }
        ]
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
                        configurations: true,
                      },
                      orderBy: {
                        orderIndex: 'asc',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!programAssignment || !programAssignment.program) {
      return null;
    }

    // Calculate which week/day of the program we're on
    const daysSinceStart = Math.floor(
      (Date.now() - new Date(programAssignment.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Find all weeks and their workouts
    const allWorkouts: Array<any> = [];
    for (const week of programAssignment.program.weeks) {
      for (const workout of week.workouts) {
        allWorkouts.push({
          ...workout,
          weekNumber: week.weekNumber,
        });
      }
    }

    // Determine which workout is scheduled for today based on day of week
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todayWorkout = allWorkouts.find(w => w.dayNumber === (dayOfWeek === 0 ? 7 : dayOfWeek));

    if (!todayWorkout) {
      return null;
    }

    // Check if session already exists for today
    const existingSession = await prisma.workoutSession.findFirst({
      where: {
        clientId,
        workoutId: todayWorkout.id,
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        workout: true,
      },
    });

    // Get previous performance for this workout type
    const previousSession = await prisma.workoutSession.findFirst({
      where: {
        clientId,
        workout: {
          workoutType: todayWorkout.workoutType,
        },
        status: 'completed',
      },
      include: {
        workout: true,
      },
      orderBy: {
        scheduledDate: 'desc',
      },
    });

    // Calculate equipment needed
    const equipmentNeeded = new Set<string>();
    const exercises = todayWorkout.exercises.map((ex: any) => {
      if (ex.exercise.equipment) {
        equipmentNeeded.add(ex.exercise.equipment);
      }
      return {
        id: ex.exercise.id,
        name: ex.exercise.name,
        bodyPart: ex.exercise.primaryMuscle || '',
        targetMuscle: ex.exercise.secondaryMuscles || '',
        equipment: ex.exercise.equipment || 'Bodyweight',
        thumbnail: ex.exercise.gifUrl,
        sets: ex.configurations.map((config: any) => ({
          setNumber: config.setNumber,
          setType: config.setType,
          reps: config.reps,
          weightGuidance: config.weightGuidance,
          restSeconds: config.restSeconds,
        })),
      };
    });

    // Calculate estimated duration (sum of all set times + rest times)
    let estimatedDuration = 0;
    todayWorkout.exercises.forEach((ex: any) => {
      ex.configurations.forEach((config: any) => {
        // Assume 45 seconds per set + rest time
        estimatedDuration += 45 + (config.restSeconds || 90);
      });
    });
    estimatedDuration = Math.ceil(estimatedDuration / 60); // Convert to minutes

    return {
      id: existingSession?.id || `pending-${todayWorkout.id}`,
      workoutId: todayWorkout.id,
      name: todayWorkout.name,
      description: todayWorkout.notes,
      workoutType: todayWorkout.workoutType,
      programName: programAssignment.program.name,
      programId: programAssignment.programId,
      assignmentId: programAssignment.id,
      scheduledDate: today.toISOString(),
      estimatedDuration,
      isCompleted: existingSession?.status === 'completed',
      isStarted: existingSession?.status === 'in_progress',
      sessionId: existingSession?.id,
      status: existingSession?.status || 'scheduled',
      exercises,
      equipment: Array.from(equipmentNeeded),
      trainerNotes: todayWorkout.notes,
      previousPerformance: previousSession ? {
        lastCompletedDate: previousSession.scheduledDate,
        totalVolume: previousSession.totalVolume || 0,
        exercisesCompleted: previousSession.completedSets || 0,
        averageRpe: previousSession.averageRpe,
        notes: previousSession.clientNotes,
      } : null,
    };
  },

  // =====================================
  // PERSONAL RECORDS TRACKING
  // =====================================

  /**
   * Get all personal records for a user
   */
  async getUserPersonalRecords(userId: string, exerciseId?: string) {
    const where: any = {
      personalBest: true,
      workoutSession: {
        clientId: userId,
      },
    };

    if (exerciseId) {
      where.exerciseId = exerciseId;
    }

    const records = await prisma.workoutExerciseLog.findMany({
      where,
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
        workoutSession: {
          select: {
            scheduledDate: true,
            actualStartTime: true,
            clientId: true,
          },
        },
      },
      orderBy: {
        workoutSession: {
          scheduledDate: 'desc',
        },
      },
    });

    // Group by exercise and get the best performance
    const bestRecords = new Map();

    for (const record of records) {
      const exerciseId = record.exercise.id;

      if (!bestRecords.has(exerciseId)) {
        bestRecords.set(exerciseId, {
          exercise: record.exercise,
          dateAchieved: record.workoutSession.scheduledDate,
          totalVolume: record.totalVolume?.toString() || '0',
          setsCompleted: 0, // Will be calculated if needed
          bestWeight: record.totalVolume?.toString() || '0',
        });
      }
    }

    return Array.from(bestRecords.values());
  },

  /**
   * Check if current performance is a personal record
   */
  async checkPersonalRecord(exerciseLogId: string) {
    const exerciseLog = await prisma.workoutExerciseLog.findFirst({
      where: { id: exerciseLogId },
      include: {
        exercise: true,
        setLogs: {
          orderBy: {
            weight: 'desc',
          },
        },
        workoutSession: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!exerciseLog) {
      throw createError(404, 'Exercise log not found');
    }

    const clientId = exerciseLog.workoutSession.clientId;
    const exerciseId = exerciseLog.exerciseId;

    // Get all previous logs for this exercise
    const previousLogs = await prisma.workoutExerciseLog.findMany({
      where: {
        exerciseId,
        personalBest: true,
        workoutSession: {
          clientId,
        },
        id: {
          not: exerciseLogId,
        },
      },
      include: {
        setLogs: true,
      },
    });

    // Calculate current best set
    const currentBestSet = exerciseLog.setLogs[0];
    const currentVolume = parseFloat(exerciseLog.totalVolume?.toString() || '0');

    let isRecord = false;
    let recordType = null;

    if (previousLogs.length === 0) {
      isRecord = true;
      recordType = 'first_performance';
    } else {
      // Check if current performance beats previous records
      for (const prevLog of previousLogs) {
        const prevBestSet = prevLog.setLogs[0];
        const prevVolume = parseFloat(prevLog.totalVolume?.toString() || '0');

        if (currentBestSet && prevBestSet) {
          const currentWeight = parseFloat(currentBestSet.weight?.toString() || '0');
          const prevWeight = parseFloat(prevBestSet.weight?.toString() || '0');

          if (currentWeight > prevWeight) {
            isRecord = true;
            recordType = 'weight';
            break;
          }

          if (currentBestSet.actualReps && prevBestSet.actualReps && currentWeight >= prevWeight) {
            isRecord = true;
            recordType = 'reps';
            break;
          }
        }

        if (currentVolume > prevVolume) {
          isRecord = true;
          recordType = 'volume';
          break;
        }
      }
    }

    // Update the exercise log with personal best flag
    if (isRecord) {
      await prisma.workoutExerciseLog.update({
        where: { id: exerciseLogId },
        data: { personalBest: true },
      });

      // Unset previous records for this exercise
      await prisma.workoutExerciseLog.updateMany({
        where: {
          exerciseId,
          personalBest: true,
          id: {
            not: exerciseLogId,
          },
          workoutSession: {
            clientId,
          },
        },
        data: { personalBest: false },
      });
    }

    return {
      isRecord,
      recordType,
      currentPerformance: {
        weight: currentBestSet?.weight,
        reps: currentBestSet?.actualReps,
        volume: currentVolume,
      },
      previousBest: (() => {
        if (previousLogs.length > 0) {
          const log = previousLogs[0];
          if (log?.setLogs && log.setLogs[0]) {
            const set = log.setLogs[0];
            return {
              weight: set?.weight,
              reps: set?.actualReps,
              volume: log.totalVolume?.toString(),
            };
          }
        }
        return null;
      })(),
    };
  },

  /**
   * Get personal record history for an exercise
   */
  async getExerciseRecordHistory(userId: string, exerciseId: string) {
    const records = await prisma.workoutExerciseLog.findMany({
      where: {
        exerciseId,
        personalBest: true,
        workoutSession: {
          clientId: userId,
        },
      },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            bodyPart: true,
            equipment: true,
          },
        },
        workoutSession: {
          select: {
            scheduledDate: true,
            client: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        setLogs: {
          orderBy: {
            weight: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        workoutSession: {
          scheduledDate: 'desc',
        },
      },
      take: 10,
    });

    return records.map((record: any) => ({
      date: record.workoutSession.scheduledDate,
      totalVolume: record.totalVolume?.toString() || '0',
      bestSet: record.setLogs[0] ? {
        weight: record.setLogs[0].weight?.toString(),
        reps: record.setLogs[0].actualReps,
      } : null,
      notes: record.notes,
    }));
  },
};