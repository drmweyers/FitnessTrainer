import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import authorize from '@/middleware/authorize';
import { validateBody } from '@/middleware/validation';
import * as programController from '@/controllers/programController';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createProgramSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  programType: z.enum([
    'strength',
    'hypertrophy', 
    'endurance',
    'powerlifting',
    'bodybuilding',
    'general_fitness',
    'sport_specific',
    'rehabilitation'
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
          notes: z.string().optional()
        })).optional()
      })).optional()
    })).optional()
  })).optional()
});

const updateProgramSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  programType: z.enum([
    'strength',
    'hypertrophy',
    'endurance',
    'powerlifting',
    'bodybuilding',
    'general_fitness',
    'sport_specific',
    'rehabilitation'
  ]).optional(),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  durationWeeks: z.number().min(1).max(52).optional(),
  goals: z.array(z.string()).optional(),
  equipmentNeeded: z.array(z.string()).optional(),
  isTemplate: z.boolean().optional()
});

const assignProgramSchema = z.object({
  clientId: z.string().uuid(),
  startDate: z.string().datetime()
});

const duplicateProgramSchema = z.object({
  name: z.string().min(1).max(255).optional()
});

// All routes require authentication and trainer role
router.use(authenticate);
router.use(authorize('trainer'));

// Program management routes
router.get('/', programController.getTrainerPrograms);
router.post('/', validateBody(createProgramSchema), programController.createProgram);
router.get('/templates', programController.getTemplates);
router.get('/:id', programController.getProgramById);
router.put('/:id', validateBody(updateProgramSchema), programController.updateProgram);
router.delete('/:id', programController.deleteProgram);
router.post('/:id/duplicate', validateBody(duplicateProgramSchema), programController.duplicateProgram);
router.post('/:id/assign', validateBody(assignProgramSchema), programController.assignProgram);

// Client programs
router.get('/client/:clientId', programController.getClientPrograms);

// Exercise Group Management (Supersets/Circuits)
/**
 * @route GET /api/programs/workouts/:workoutId/groups
 * @desc Get all exercise groups in a workout
 * @access Private (Trainer)
 * @param {string} workoutId - Workout UUID
 */
router.get('/workouts/:workoutId/groups', programController.getWorkoutGroups);

/**
 * @route POST /api/programs/workouts/:workoutId/groups
 * @desc Create exercise group (superset, circuit, or giant set)
 * @access Private (Trainer)
 * @param {string} workoutId - Workout UUID
 * @body {string} name - Group name
 * @body {string} groupType - Type of group (superset, circuit, giant_set)
 * @body {string[]} exerciseIds - Array of exercise IDs
 * @body {number} [rounds] - Number of rounds (for circuits)
 * @body {number} [restBetweenExercises] - Rest between exercises in seconds
 * @body {number} [restBetweenSets] - Rest between sets in seconds
 */
router.post('/workouts/:workoutId/groups', programController.createExerciseGroup);

/**
 * @route PUT /api/programs/groups/:groupId
 * @desc Update exercise group
 * @access Private (Trainer)
 * @param {string} groupId - Group ID format: {workoutId}-{groupIdentifier}
 * @body {string} [name] - Group name
 * @body {number} [restBetweenExercises] - Rest between exercises in seconds
 * @body {number} [restBetweenSets] - Rest between sets in seconds
 */
router.put('/groups/:groupId', programController.updateExerciseGroup);

/**
 * @route DELETE /api/programs/groups/:groupId/ungroup
 * @desc Ungroup exercises (remove group identifier)
 * @access Private (Trainer)
 * @param {string} groupId - Group ID format: {workoutId}-{groupIdentifier}
 */
router.delete('/groups/:groupId/ungroup', programController.ungroupExercises);

/**
 * @route POST /api/programs/groups/:groupId/duplicate
 * @desc Duplicate exercise group
 * @access Private (Trainer)
 * @param {string} groupId - Group ID format: {workoutId}-{groupIdentifier}
 * @body {string} [targetGroupIdentifier] - Target group identifier (auto-assigned if not provided)
 */
router.post('/groups/:groupId/duplicate', programController.duplicateGroup);

// Progressive Overload Management
/**
 * @route POST /api/programs/:id/progressive-overload
 * @desc Apply progressive overload to a program
 * @access Private (Trainer)
 * @param {string} id - Program UUID
 * @body {string} overloadType - Type of overload (linear, percentage, custom)
 * @body {string[]} [targetExercises] - Optional array of exercise IDs to target
 * @body {number} [weeklyIncrease] - Weekly increase percentage (for percentage type)
 * @body {number} [maxWeeks] - Maximum number of weeks to apply
 */
router.post('/:id/progressive-overload', programController.applyProgressiveOverload);

/**
 * @route POST /api/programs/progression-suggestions
 * @desc Get progression suggestions for an exercise
 * @access Private (Trainer)
 * @body {string} exerciseId - Exercise UUID
 * @body {object} currentConfig - Current exercise configuration
 * @body {string} currentConfig.reps - Current reps
 * @body {string} [currentConfig.weight] - Current weight
 * @body {number} currentConfig.sets - Current sets
 */
router.post('/progression-suggestions', programController.getProgressionSuggestions);

/**
 * @route GET /api/programs/clients/:clientId/progression
 * @desc Get client progression history
 * @access Private (Trainer)
 * @param {string} clientId - Client UUID
 * @query {string} [exerciseId] - Optional exercise ID to filter
 */
router.get('/clients/:clientId/progression', programController.getClientProgression);

export default router;