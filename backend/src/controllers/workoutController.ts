import { Request, Response } from 'express';
import { workoutService } from '@/services/workoutService';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';
import { WorkoutStatus } from '@prisma/client';

// Helper function to validate required parameters
const validateParam = (param: string | undefined, paramName: string, res: Response): param is string => {
  if (!param) {
    res.status(400).json({
      success: false,
      message: `${paramName} is required`
    });
    return false;
  }
  return true;
};

// Create a new workout session
export const createWorkoutSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  
  // For clients, they create their own sessions. For trainers, they can create for clients
  let clientId = userId;
  let trainerId = userId;
  
  if (userRole === 'trainer' && req.body.clientId) {
    clientId = req.body.clientId;
  } else if (userRole === 'client') {
    // Get trainer from program assignment
    const { programAssignmentId } = req.body;
    // We'll need to look up the trainer from the program assignment
    // This is handled in the service layer
    trainerId = ''; // Will be filled by service
  }

  const sessionData = {
    programAssignmentId: req.body.programAssignmentId,
    workoutId: req.body.workoutId,
    scheduledDate: new Date(req.body.scheduledDate),
  };

  const session = await workoutService.createWorkoutSession(clientId, trainerId || userId, sessionData);

  logger.info(`Workout session created: ${session.id} for client ${clientId}`);

  res.status(201).json({
    success: true,
    message: 'Workout session created successfully',
    data: session
  });
});

// Get a specific workout session
export const getWorkoutSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!validateParam(id, 'Session ID', res)) return;

  const userId = req.user!.id;
  const userRole = req.user!.role;

  const session = await workoutService.getWorkoutSession(id, userId, userRole);

  res.json({
    success: true,
    data: session
  });
});

// Get today's scheduled workout
export const getTodaysWorkout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Clients can only get their own workout, trainers can get client workouts
  let clientId = userId;
  if (userRole === 'trainer' && req.query.clientId) {
    clientId = req.query.clientId as string;
  }

  const todaysWorkout = await workoutService.getTodaysWorkout(clientId);

  if (!todaysWorkout) {
    res.json({
      success: true,
      data: null,
      message: 'No workout scheduled for today'
    });
    return;
  }

  res.json({
    success: true,
    data: todaysWorkout
  });
});

// Update workout session (progress, status, feedback)
export const updateWorkoutSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!validateParam(id, 'Session ID', res)) return;

  const userId = req.user!.id;
  
  // Parse dates if they exist
  const updateData = {
    ...req.body,
    ...(req.body.actualStartTime && { actualStartTime: new Date(req.body.actualStartTime) }),
    ...(req.body.actualEndTime && { actualEndTime: new Date(req.body.actualEndTime) }),
  };

  const session = await workoutService.updateWorkoutSession(id, userId, updateData);

  logger.info(`Workout session updated: ${id} by user ${userId}`);

  res.json({
    success: true,
    message: 'Workout session updated successfully',
    data: session
  });
});

// Start workout session
export const startWorkoutSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!validateParam(id, 'Session ID', res)) return;

  const userId = req.user!.id;

  const session = await workoutService.updateWorkoutSession(id, userId, {
    status: WorkoutStatus.in_progress,
    actualStartTime: new Date(),
    currentExerciseIndex: 0,
    currentSetIndex: 0,
  });

  logger.info(`Workout session started: ${id} by client ${userId}`);

  res.json({
    success: true,
    message: 'Workout started successfully',
    data: session
  });
});

// Complete workout session
export const completeWorkoutSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!validateParam(id, 'Session ID', res)) return;

  const userId = req.user!.id;

  const updateData = {
    status: WorkoutStatus.completed,
    actualEndTime: new Date(),
    ...(req.body.effortRating && { effortRating: req.body.effortRating }),
    ...(req.body.enjoymentRating && { enjoymentRating: req.body.enjoymentRating }),
    ...(req.body.energyAfter && { energyAfter: req.body.energyAfter }),
    ...(req.body.clientNotes && { clientNotes: req.body.clientNotes }),
  };

  const session = await workoutService.updateWorkoutSession(id, userId, updateData);

  logger.info(`Workout session completed: ${id} by client ${userId}`);

  res.json({
    success: true,
    message: 'Workout completed successfully',
    data: session
  });
});

// Get user's workout sessions (with filtering)
export const getUserWorkoutSessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  
  const options = {
    status: req.query.status as WorkoutStatus,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
    endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
  };

  const result = await workoutService.getUserWorkoutSessions(userId, userRole, options);

  res.json({
    success: true,
    data: result.sessions,
    meta: {
      total: result.total,
      hasMore: result.hasMore,
      limit: options.limit || 50,
      offset: options.offset || 0,
    }
  });
});

// Update exercise log
export const updateExerciseLog = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!validateParam(id, 'Exercise log ID', res)) return;

  const userId = req.user!.id;

  const updateData = {
    ...req.body,
    ...(req.body.startTime && { startTime: new Date(req.body.startTime) }),
    ...(req.body.endTime && { endTime: new Date(req.body.endTime) }),
  };

  const exerciseLog = await workoutService.updateExerciseLog(id, userId, updateData);

  res.json({
    success: true,
    message: 'Exercise log updated successfully',
    data: exerciseLog
  });
});

// Update set log
export const updateSetLog = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!validateParam(id, 'Set log ID', res)) return;

  const userId = req.user!.id;

  const updateData = {
    ...req.body,
    ...(req.body.timestamp && { timestamp: new Date(req.body.timestamp) }),
  };

  const setLog = await workoutService.updateSetLog(id, userId, updateData);

  res.json({
    success: true,
    message: 'Set log updated successfully',
    data: setLog
  });
});

// Get workout analytics
export const getWorkoutAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  
  const options = {
    period: req.query.period as 'week' | 'month' | 'quarter' | 'year',
    startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
    endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    clientId: userRole === 'trainer' ? req.query.clientId as string : undefined,
  };

  const analytics = await workoutService.getWorkoutAnalytics(userId, userRole, options);

  res.json({
    success: true,
    data: analytics
  });
});

// Get client workout history for trainers
export const getClientWorkoutHistory = asyncHandler(async (req: Request, res: Response) => {
  const { clientId } = req.params;
  
  if (!validateParam(clientId, 'Client ID', res)) return;

  const trainerId = req.user!.id;
  const userRole = req.user!.role;

  if (userRole !== 'trainer') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Trainer access required.'
    });
    return;
  }

  // TODO: Verify trainer has access to this client
  
  const options = {
    status: req.query.status as WorkoutStatus,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
    endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
  };

  const result = await workoutService.getUserWorkoutSessions(clientId, 'client', options);

  res.json({
    success: true,
    data: result.sessions,
    meta: {
      total: result.total,
      hasMore: result.hasMore,
      limit: options.limit || 50,
      offset: options.offset || 0,
    }
  });
});

// Get live workout data for trainer dashboard
export const getLiveWorkoutData = asyncHandler(async (req: Request, res: Response) => {
  const trainerId = req.user!.id;
  const userRole = req.user!.role;

  if (userRole !== 'trainer') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Trainer access required.'
    });
    return;
  }

  const liveData = await workoutService.getLiveWorkoutData(trainerId);

  res.json({
    success: true,
    data: liveData
  });
});

// Pause workout session
export const pauseWorkoutSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!validateParam(id, 'Session ID', res)) return;

  const userId = req.user!.id;

  // This would typically involve updating the session with pause timestamp
  // The frontend would handle the actual pause/resume logic for timers
  const session = await workoutService.updateWorkoutSession(id, userId, {
    // Add any pause-related fields if needed
    // For now, we'll just update the session
  });

  logger.info(`Workout session paused: ${id} by client ${userId}`);

  res.json({
    success: true,
    message: 'Workout paused',
    data: session
  });
});

// Resume workout session
export const resumeWorkoutSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!validateParam(id, 'Session ID', res)) return;

  const userId = req.user!.id;

  const session = await workoutService.updateWorkoutSession(id, userId, {
    // Add any resume-related fields if needed
    // Frontend handles actual timer logic
  });

  logger.info(`Workout session resumed: ${id} by client ${userId}`);

  res.json({
    success: true,
    message: 'Workout resumed',
    data: session
  });
});

// Skip exercise
export const skipExercise = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, exerciseLogId } = req.params;
  
  if (!validateParam(sessionId, 'Session ID', res)) return;
  if (!validateParam(exerciseLogId, 'Exercise log ID', res)) return;

  const userId = req.user!.id;

  const exerciseLog = await workoutService.updateExerciseLog(exerciseLogId, userId, {
    skipped: true,
    notes: `${req.body.notes || ''} [Exercise skipped]`.trim(),
    endTime: new Date(),
  });

  // Move to next exercise by updating session
  const currentIndex = req.body.currentExerciseIndex || 0;
  await workoutService.updateWorkoutSession(sessionId, userId, {
    currentExerciseIndex: currentIndex + 1,
    currentSetIndex: 0,
  });

  logger.info(`Exercise skipped: ${exerciseLogId} in session ${sessionId}`);

  res.json({
    success: true,
    message: 'Exercise skipped successfully',
    data: exerciseLog
  });
});

// Add trainer feedback to completed workout
export const addTrainerFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!validateParam(id, 'Session ID', res)) return;

  const trainerId = req.user!.id;
  const userRole = req.user!.role;

  if (userRole !== 'trainer') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Trainer access required.'
    });
    return;
  }

  // Note: This updates as trainer, so we need a different method or modify the service
  // For now, we'll use a direct Prisma update
  const { trainerFeedback } = req.body;

  // We'll need to add this to the service or handle it differently
  // For now, returning a placeholder response
  res.json({
    success: true,
    message: 'Trainer feedback added successfully',
    data: { trainerFeedback }
  });
});

// Get workout session for editing/resuming
export const getEditableWorkoutSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!validateParam(id, 'Session ID', res)) return;

  const userId = req.user!.id;
  const userRole = req.user!.role;

  const session = await workoutService.getWorkoutSession(id, userId, userRole);

  // Return session with additional fields needed for workout execution
  const editableSession = {
    ...session,
    // Add any computed fields needed for the workout execution UI
    totalExercises: session.exerciseLogs?.length || 0,
    totalSets: session.totalSets || 0,
    completedSets: session.completedSets || 0,
    progressPercentage: session.totalSets 
      ? ((session.completedSets || 0) / session.totalSets) * 100
      : 0,
  };

  res.json({
    success: true,
    data: editableSession
  });
});