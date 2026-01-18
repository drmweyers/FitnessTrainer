import { Router } from 'express';
import {
  createWorkoutSession,
  getWorkoutSession,
  updateWorkoutSession,
  startWorkoutSession,
  completeWorkoutSession,
  pauseWorkoutSession,
  resumeWorkoutSession,
  getUserWorkoutSessions,
  updateExerciseLog,
  updateSetLog,
  skipExercise,
  getWorkoutAnalytics,
  getClientWorkoutHistory,
  getLiveWorkoutData,
  addTrainerFeedback,
  getEditableWorkoutSession,
  getTodaysWorkout
} from '@/controllers/workoutController';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/authorize';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Workout Session Routes

// Create new workout session
// POST /api/workouts/sessions
router.post('/sessions', createWorkoutSession);

// Get user's workout sessions (with filtering)
// GET /api/workouts/sessions?status=completed&limit=20&offset=0&startDate=2024-01-01&endDate=2024-12-31
router.get('/sessions', getUserWorkoutSessions);

// Get specific workout session
// GET /api/workouts/sessions/:id
router.get('/sessions/:id', getWorkoutSession);

// Get workout session for editing/resuming (includes additional computed fields)
// GET /api/workouts/sessions/:id/edit
router.get('/sessions/:id/edit', getEditableWorkoutSession);

// Update workout session (general updates - progress, status, feedback)
// PUT /api/workouts/sessions/:id
router.put('/sessions/:id', updateWorkoutSession);

// Start workout session (changes status to in_progress)
// POST /api/workouts/sessions/:id/start
router.post('/sessions/:id/start', startWorkoutSession);

// Complete workout session (changes status to completed, calculates metrics)
// POST /api/workouts/sessions/:id/complete
router.post('/sessions/:id/complete', completeWorkoutSession);

// Pause workout session
// POST /api/workouts/sessions/:id/pause
router.post('/sessions/:id/pause', pauseWorkoutSession);

// Resume workout session
// POST /api/workouts/sessions/:id/resume
router.post('/sessions/:id/resume', resumeWorkoutSession);

// Exercise Log Routes

// Update exercise log (mark skipped, add notes, update timing)
// PUT /api/workouts/exercise-logs/:id
router.put('/exercise-logs/:id', updateExerciseLog);

// Skip exercise (shorthand for marking exercise as skipped and moving to next)
// POST /api/workouts/sessions/:sessionId/exercises/:exerciseLogId/skip
router.post('/sessions/:sessionId/exercises/:exerciseLogId/skip', skipExercise);

// Set Log Routes

// Update set log (weight, reps, RPE, completion status)
// PUT /api/workouts/set-logs/:id
router.put('/set-logs/:id', updateSetLog);

// Analytics and Reporting Routes

// Get workout analytics for current user
// GET /api/workouts/analytics?period=month&startDate=2024-01-01&endDate=2024-12-31
router.get('/analytics', getWorkoutAnalytics);

// Get today's workout
// GET /api/workouts/today?clientId=optional (for trainers viewing client workouts)
router.get('/today', getTodaysWorkout);

// Trainer-Only Routes

// Get live workout data (clients currently working out)
// GET /api/workouts/live
router.get('/live', authorize('trainer'), getLiveWorkoutData);

// Get specific client's workout history
// GET /api/workouts/clients/:clientId/sessions?status=completed&limit=20
router.get(
  '/clients/:clientId/sessions', 
  authorize('trainer'), 
  getClientWorkoutHistory
);

// Add trainer feedback to completed workout
// POST /api/workouts/sessions/:id/trainer-feedback
router.post(
  '/sessions/:id/trainer-feedback',
  authorize('trainer'),
  addTrainerFeedback
);

// Get client workout analytics (trainers viewing client data)
// GET /api/workouts/analytics?clientId=client-uuid&period=month
// (Uses the same analytics endpoint with clientId param - handled in controller)

// Bulk Operations (future enhancement)

// Mark multiple sessions as missed/completed (for trainers)
// POST /api/workouts/sessions/bulk-update
// router.post('/sessions/bulk-update', validateRole(['trainer']), bulkUpdateSessions);

// Reschedule multiple workout sessions
// POST /api/workouts/sessions/reschedule
// router.post('/sessions/reschedule', validateRole(['trainer']), rescheduleSessions);

export default router;