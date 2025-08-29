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

export default router;