/**
 * Activity Feed Service
 *
 * Logs user activities for the activity feed.
 * All methods are fire-and-forget safe - they catch errors internally
 * so activity logging never breaks the main operation.
 */

import { prisma } from '@/lib/db/prisma';

export interface LogActivityParams {
  userId: string;
  type: string;
  title: string;
  description?: string;
  relatedId?: string;
  relatedType?: string;
  metadata?: Record<string, any>;
}

/**
 * Log a generic activity
 */
export async function logActivity(params: LogActivityParams) {
  try {
    return await prisma.activity.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        description: params.description,
        relatedId: params.relatedId,
        relatedType: params.relatedType,
        metadata: params.metadata ?? {},
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    return null;
  }
}

/**
 * Log a workout completion event
 */
export async function logWorkoutCompleted(
  userId: string,
  sessionId: string,
  workoutName: string
) {
  return logActivity({
    userId,
    type: 'workout_completed',
    title: 'Workout Completed',
    description: `Completed "${workoutName}"`,
    relatedId: sessionId,
    relatedType: 'workout_session',
  });
}

/**
 * Log a program assignment event
 */
export async function logProgramAssigned(
  trainerId: string,
  clientId: string,
  programId: string,
  programName: string
) {
  // Log for the trainer
  await logActivity({
    userId: trainerId,
    type: 'program_assigned',
    title: 'Program Assigned',
    description: `Assigned "${programName}" to a client`,
    relatedId: programId,
    relatedType: 'program',
    metadata: { clientId },
  });

  // Log for the client
  return logActivity({
    userId: clientId,
    type: 'program_assigned',
    title: 'New Program Assigned',
    description: `You were assigned "${programName}"`,
    relatedId: programId,
    relatedType: 'program',
    metadata: { trainerId },
  });
}

/**
 * Log a client signup event
 */
export async function logClientSignup(userId: string, userEmail: string) {
  return logActivity({
    userId,
    type: 'client_signup',
    title: 'Welcome!',
    description: `Account created for ${userEmail}`,
    relatedType: 'user',
  });
}
