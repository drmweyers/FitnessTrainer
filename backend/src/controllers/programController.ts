import { Request, Response } from 'express';
import { programService } from '@/services/programService';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';

// Create a new program
export const createProgram = asyncHandler(async (req: Request, res: Response) => {
  const trainerId = req.user!.id;
  const programData = req.body;

  const program = await programService.createProgram(trainerId, programData);

  logger.info(`Program created: ${program.id} by trainer ${trainerId}`);

  res.status(201).json({
    success: true,
    message: 'Program created successfully',
    data: program
  });
});

// Get all programs for a trainer
export const getTrainerPrograms = asyncHandler(async (req: Request, res: Response) => {
  const trainerId = req.user!.id;
  const includeTemplates = req.query.includeTemplates === 'true';

  const programs = await programService.getTrainerPrograms(trainerId, includeTemplates);

  res.json({
    success: true,
    data: programs,
    count: programs.length
  });
});

// Get a single program
export const getProgramById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trainerId = req.user!.id;

  const program = await programService.getProgramById(id as string, trainerId);

  res.json({
    success: true,
    data: program
  });
});

// Update a program
export const updateProgram = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trainerId = req.user!.id;
  const updateData = req.body;

  const program = await programService.updateProgram(id as string, trainerId, updateData);

  logger.info(`Program updated: ${id} by trainer ${trainerId}`);

  res.json({
    success: true,
    message: 'Program updated successfully',
    data: program
  });
});

// Delete a program
export const deleteProgram = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trainerId = req.user!.id;

  const result = await programService.deleteProgram(id as string, trainerId);

  logger.info(`Program deleted: ${id} by trainer ${trainerId}`);

  res.json(result);
});

// Duplicate a program
export const duplicateProgram = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trainerId = req.user!.id;
  const { name } = req.body;

  const program = await programService.duplicateProgram(id as string, trainerId, name);

  logger.info(`Program duplicated: ${id} -> ${program?.id} by trainer ${trainerId}`);

  res.status(201).json({
    success: true,
    message: 'Program duplicated successfully',
    data: program
  });
});

// Assign program to client
export const assignProgram = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const trainerId = req.user!.id;
  const { clientId, startDate } = req.body;

  const assignment = await programService.assignProgram(
    id as string, 
    clientId, 
    trainerId, 
    new Date(startDate)
  );

  logger.info(`Program assigned: ${id} to client ${clientId} by trainer ${trainerId}`);

  res.status(201).json({
    success: true,
    message: 'Program assigned successfully',
    data: assignment
  });
});

// Get client's programs
export const getClientPrograms = asyncHandler(async (req: Request, res: Response) => {
  const { clientId } = req.params;
  const trainerId = req.user!.id;

  const programs = await programService.getClientPrograms(clientId as string, trainerId);

  res.json({
    success: true,
    data: programs,
    count: programs.length
  });
});

// Get program templates
export const getTemplates = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query;

  const templates = await programService.getTemplates(category as string);

  res.json({
    success: true,
    data: templates,
    count: templates.length
  });
});

// =====================================
// Exercise Group Management (Supersets/Circuits)
// =====================================

/**
 * Create exercise group (superset, circuit, or giant set)
 * POST /api/programs/workouts/:workoutId/groups
 */
export const createExerciseGroup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { workoutId } = req.params;
  const trainerId = req.user!.id;

  if (!workoutId) {
    res.status(400).json({
      success: false,
      message: 'Workout ID is required',
    });
    return;
  }

  const group = await programService.createExerciseGroup(workoutId, trainerId, req.body);

  logger.info(`Exercise group created: ${group.id} by trainer ${trainerId}`);

  res.status(201).json({
    success: true,
    message: 'Exercise group created successfully',
    data: group,
  });
});

/**
 * Update exercise group
 * PUT /api/programs/groups/:groupId
 */
export const updateExerciseGroup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { groupId } = req.params;
  const trainerId = req.user!.id;

  if (!groupId) {
    res.status(400).json({
      success: false,
      message: 'Group ID is required',
    });
    return;
  }

  // Parse groupId to get workoutId and groupIdentifier
  const [workoutId, groupIdentifier] = groupId.split('-');

  if (!workoutId || !groupIdentifier) {
    res.status(400).json({
      success: false,
      message: 'Invalid group ID format',
    });
    return;
  }

  const group = await programService.updateExerciseGroup(
    workoutId,
    trainerId,
    groupIdentifier,
    req.body
  );

  logger.info(`Exercise group updated: ${groupId} by trainer ${trainerId}`);

  res.json({
    success: true,
    message: 'Exercise group updated successfully',
    data: group,
  });
});

/**
 * Ungroup exercises (remove group identifier)
 * DELETE /api/programs/groups/:groupId/ungroup
 */
export const ungroupExercises = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { groupId } = req.params;
  const trainerId = req.user!.id;

  if (!groupId) {
    res.status(400).json({
      success: false,
      message: 'Group ID is required',
    });
    return;
  }

  // Parse groupId to get workoutId and groupIdentifier
  const [workoutId, groupIdentifier] = groupId.split('-');

  if (!workoutId || !groupIdentifier) {
    res.status(400).json({
      success: false,
      message: 'Invalid group ID format',
    });
    return;
  }

  const result = await programService.ungroupExercises(workoutId, trainerId, groupIdentifier);

  logger.info(`Exercises ungrouped in group ${groupId} by trainer ${trainerId}`);

  res.json({
    success: true,
    message: result.message,
    data: { count: result.count },
  });
});

/**
 * Duplicate exercise group
 * POST /api/programs/groups/:groupId/duplicate
 */
export const duplicateGroup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { groupId } = req.params;
  const trainerId = req.user!.id;

  if (!groupId) {
    res.status(400).json({
      success: false,
      message: 'Group ID is required',
    });
    return;
  }

  // Parse groupId to get workoutId and groupIdentifier
  const [workoutId, sourceGroupIdentifier] = groupId.split('-');

  if (!workoutId || !sourceGroupIdentifier) {
    res.status(400).json({
      success: false,
      message: 'Invalid group ID format',
    });
    return;
  }

  const group = await programService.duplicateGroup(workoutId, trainerId, sourceGroupIdentifier, req.body?.targetGroupIdentifier);

  logger.info(`Exercise group duplicated: ${sourceGroupIdentifier} -> ${group.groupIdentifier} by trainer ${trainerId}`);

  res.status(201).json({
    success: true,
    message: 'Exercise group duplicated successfully',
    data: group,
  });
});

/**
 * Get all groups in a workout
 * GET /api/programs/workouts/:workoutId/groups
 */
export const getWorkoutGroups = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { workoutId } = req.params;

  if (!workoutId) {
    res.status(400).json({
      success: false,
      message: 'Workout ID is required',
    });
    return;
  }

  const groups = await programService.getWorkoutGroups(workoutId);

  res.json({
    success: true,
    data: groups,
    count: groups.length,
  });
});

// =====================================
// Progressive Overload Management
// =====================================

/**
 * Apply progressive overload to a program
 * POST /api/programs/:id/progressive-overload
 */
export const applyProgressiveOverload = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id: programId } = req.params;
  const trainerId = req.user!.id;

  if (!programId) {
    res.status(400).json({
      success: false,
      message: 'Program ID is required',
    });
    return;
  }

  const result = await programService.applyProgressiveOverload(programId, trainerId, req.body);

  logger.info(`Progressive overload applied to program ${programId} by trainer ${trainerId}`);

  res.json({
    success: true,
    message: result.message,
    data: result.data,
  });
});

/**
 * Get progression suggestions for an exercise
 * POST /api/programs/progression-suggestions
 */
export const getProgressionSuggestions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { exerciseId, currentConfig } = req.body;

  const suggestions = await programService.getProgressionSuggestions(exerciseId, currentConfig);

  res.json({
    success: true,
    data: suggestions,
  });
});

/**
 * Get client progression history
 * GET /api/programs/clients/:clientId/progression
 */
export const getClientProgression = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const { exerciseId } = req.query;

  if (!clientId) {
    res.status(400).json({
      success: false,
      message: 'Client ID is required',
    });
    return;
  }

  const progression = await programService.getClientProgression(clientId, exerciseId as string | undefined);

  res.json({
    success: true,
    data: progression,
  });
});