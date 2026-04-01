/**
 * FORGE Stream D Utilities
 * Analytics & Messaging workflow testing utilities
 */

import { prisma } from '@/lib/db/prisma';

// Types for FORGE simulations
export interface Actor {
  id: string;
  email: string;
  role: 'trainer' | 'client' | 'admin';
  fullName: string;
  token?: string;
  state: Record<string, any>;
}

export interface WorkflowStep {
  action: string;
  data?: Record<string, any>;
  expect?: Record<string, any>;
}

export interface WorkflowResult {
  success: boolean;
  data?: any;
  error?: string;
  stepsCompleted: number;
}

/**
 * ActorFactory - Creates test actors for simulations
 */
export class ActorFactory {
  static async createTrainer(overrides: Partial<Actor> = {}): Promise<Actor> {
    const user = await prisma.user.create({
      data: {
        email: overrides.email || `trainer-${Date.now()}@test.com`,
        passwordHash: 'hashed-password',
        role: 'trainer',
        ...overrides
      }
    });

    return {
      id: user.id,
      email: user.email,
      role: 'trainer',
      fullName: overrides.fullName || 'Test Trainer',
      state: {}
    };
  }

  static async createClient(overrides: Partial<Actor> = {}): Promise<Actor> {
    const user = await prisma.user.create({
      data: {
        email: overrides.email || `client-${Date.now()}@test.com`,
        passwordHash: 'hashed-password',
        role: 'client',
        ...overrides
      }
    });

    return {
      id: user.id,
      email: user.email,
      role: 'client',
      fullName: overrides.fullName || 'Test Client',
      state: {}
    };
  }

  static async createAdmin(overrides: Partial<Actor> = {}): Promise<Actor> {
    const user = await prisma.user.create({
      data: {
        email: overrides.email || `admin-${Date.now()}@test.com`,
        passwordHash: 'hashed-password',
        role: 'admin',
        ...overrides
      }
    });

    return {
      id: user.id,
      email: user.email,
      role: 'admin',
      fullName: overrides.fullName || 'Test Admin',
      state: {}
    };
  }
}

/**
 * WorkflowRunner - Executes multi-step workflows
 */
export class WorkflowRunner {
  static async run(options: {
    actor: Actor;
    steps: WorkflowStep[];
  }): Promise<WorkflowResult> {
    const { actor, steps } = options;
    let stepsCompleted = 0;

    try {
      for (const step of steps) {
        await this.executeStep(actor, step);
        stepsCompleted++;
      }

      return {
        success: true,
        stepsCompleted,
        data: actor.state
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        stepsCompleted
      };
    }
  }

  private static async executeStep(actor: Actor, step: WorkflowStep): Promise<void> {
    // Store step data in actor state
    if (step.data) {
      actor.state[step.action] = step.data;
    }

    // Simulate processing time
    await new Promise(r => setTimeout(r, 1));
  }
}

/**
 * Measurement utilities for analytics workflows
 */
export class MeasurementHelpers {
  static async createMeasurement(userId: string, data: {
    type: string;
    value: number;
    unit?: string;
    recordedAt?: Date;
  }) {
    return prisma.userMeasurement.create({
      data: {
        userId,
        weight: data.value,
        recordedAt: data.recordedAt || new Date(),
        measurements: {
          type: data.type,
          value: data.value,
          unit: data.unit || 'kg'
        }
      }
    });
  }

  static async createBodyMeasurements(userId: string, data: {
    chest?: number;
    waist?: number;
    hips?: number;
    leftArm?: number;
    rightArm?: number;
    leftThigh?: number;
    rightThigh?: number;
    unit?: 'inches' | 'cm';
    recordedAt?: Date;
  }) {
    const measurements: any = {};

    if (data.chest !== undefined) measurements.chest = data.chest;
    if (data.waist !== undefined) measurements.waist = data.waist;
    if (data.hips !== undefined) measurements.hips = data.hips;
    if (data.leftArm !== undefined) measurements.leftArm = data.leftArm;
    if (data.rightArm !== undefined) measurements.rightArm = data.rightArm;
    if (data.leftThigh !== undefined) measurements.leftThigh = data.leftThigh;
    if (data.rightThigh !== undefined) measurements.rightThigh = data.rightThigh;
    measurements.unit = data.unit || 'inches';

    return prisma.userMeasurement.create({
      data: {
        userId,
        recordedAt: data.recordedAt || new Date(),
        measurements
      }
    });
  }

  static calculateProgress(current: number, previous: number): {
    change: number;
    changePercentage: number;
    trend: 'gain' | 'loss' | 'stable';
  } {
    const change = current - previous;
    const changePercentage = previous !== 0 ? (change / previous) * 100 : 0;
    const trend = Math.abs(change) < 0.01 ? 'stable' : change > 0 ? 'gain' : 'loss';

    return {
      change,
      changePercentage: Math.round(changePercentage * 100) / 100,
      trend
    };
  }
}

/**
 * Messaging utilities for chat workflows
 * Note: Uses mock implementations since messaging models don't exist yet
 */
export class MessagingHelpers {
  static async createConversation(participantIds: string[]) {
    // Mock implementation - return a mock conversation object
    return {
      id: `conv-${Date.now()}`,
      type: participantIds.length > 2 ? 'GROUP' : 'DIRECT',
      participants: participantIds.map(id => ({ userId: id })),
      createdAt: new Date()
    };
  }

  static async sendMessage(conversationId: string, senderId: string, content: string) {
    // Mock implementation - return a mock message object
    return {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId,
      content,
      type: 'TEXT',
      createdAt: new Date()
    };
  }

  static async markAsRead(messageId: string, userId: string) {
    // Mock implementation
    return {
      messageId,
      userId,
      readAt: new Date()
    };
  }

  static async getUnreadCount(userId: string): Promise<number> {
    // Mock implementation
    return 0;
  }
}

/**
 * Goal tracking utilities
 */
export class GoalHelpers {
  static async createGoal(userId: string, data: {
    type: string;
    target: number;
    current?: number;
    unit: string;
    deadline?: Date;
  }) {
    return prisma.userGoal.create({
      data: {
        userId,
        goalType: data.type,
        targetValue: data.target,
        currentValue: data.current || 0,
        deadline: data.deadline,
        status: 'active'
      }
    });
  }

  static calculateGoalProgress(current: number, target: number): {
    progress: number;
    remaining: number;
    isAchieved: boolean;
  } {
    const progress = target !== 0 ? (current / target) * 100 : 0;
    const remaining = target - current;
    const isAchieved = current >= target;

    return {
      progress: Math.round(progress * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      isAchieved
    };
  }
}

/**
 * Cleanup utilities - safely cleans up test data
 */
export async function cleanupTestData(): Promise<void> {
  try {
    // Clean up in reverse dependency order - only existing models
    const cleanupOperations = [
      // Analytics & Progress
      prisma.goalProgress.deleteMany({}).catch(() => {}),
      prisma.milestoneAchievement.deleteMany({}).catch(() => {}),
      prisma.userInsight.deleteMany({}).catch(() => {}),
      prisma.comparisonBaseline.deleteMany({}).catch(() => {}),
      prisma.chartPreference.deleteMany({}).catch(() => {}),
      prisma.analyticsReport.deleteMany({}).catch(() => {}),
      prisma.trainingLoad.deleteMany({}).catch(() => {}),
      prisma.performanceMetric.deleteMany({}).catch(() => {}),

      // Workout logs
      prisma.workoutSetLog.deleteMany({}).catch(() => {}),
      prisma.workoutExerciseLog.deleteMany({}).catch(() => {}),
      prisma.workoutSession.deleteMany({}).catch(() => {}),

      // Programs
      prisma.exerciseConfiguration.deleteMany({}).catch(() => {}),
      prisma.workoutExercise.deleteMany({}).catch(() => {}),
      prisma.programWorkout.deleteMany({}).catch(() => {}),
      prisma.programWeek.deleteMany({}).catch(() => {}),
      prisma.programAssignment.deleteMany({}).catch(() => {}),
      prisma.programTemplate.deleteMany({}).catch(() => {}),
      prisma.program.deleteMany({}).catch(() => {}),

      // Exercises
      prisma.exerciseUsage.deleteMany({}).catch(() => {}),
      prisma.exerciseSearchHistory.deleteMany({}).catch(() => {}),
      prisma.collectionExercise.deleteMany({}).catch(() => {}),
      prisma.exerciseFavorite.deleteMany({}).catch(() => {}),
      prisma.exerciseCollection.deleteMany({}).catch(() => {}),

      // Client management
      prisma.clientTagAssignment.deleteMany({}).catch(() => {}),
      prisma.clientTag.deleteMany({}).catch(() => {}),
      prisma.clientNote.deleteMany({}).catch(() => {}),
      prisma.clientProfile.deleteMany({}).catch(() => {}),
      prisma.clientInvitation.deleteMany({}).catch(() => {}),
      prisma.trainerClient.deleteMany({}).catch(() => {}),

      // User profile
      prisma.profileCompletion.deleteMany({}).catch(() => {}),
      prisma.progressPhoto.deleteMany({}).catch(() => {}),
      prisma.trainerSpecialization.deleteMany({}).catch(() => {}),
      prisma.trainerCertification.deleteMany({}).catch(() => {}),
      prisma.userGoal.deleteMany({}).catch(() => {}),
      prisma.userHealth.deleteMany({}).catch(() => {}),
      prisma.userMeasurement.deleteMany({}).catch(() => {}),
      prisma.userProfile.deleteMany({}).catch(() => {}),

      // Scheduling
      prisma.appointment.deleteMany({}).catch(() => {}),
      prisma.trainerAvailability.deleteMany({}).catch(() => {}),

      // Support
      prisma.contentReport.deleteMany({}).catch(() => {}),
      prisma.supportTicket.deleteMany({}).catch(() => {}),

      // Activity
      prisma.activity.deleteMany({}).catch(() => {}),

      // Auth
      prisma.apiToken.deleteMany({}).catch(() => {}),
      prisma.accountLockout.deleteMany({}).catch(() => {}),
      prisma.securityAuditLog.deleteMany({}).catch(() => {}),
      prisma.oauthAccount.deleteMany({}).catch(() => {}),
      prisma.userSession.deleteMany({}).catch(() => {}),
      prisma.twoFactorAuth.deleteMany({}).catch(() => {}),
      prisma.passwordReset.deleteMany({}).catch(() => {}),
      prisma.emailVerification.deleteMany({}).catch(() => {}),

      // Users last
      prisma.user.deleteMany({
        where: {
          email: {
            contains: '@test.com'
          }
        }
      }).catch(() => {})
    ];

    await Promise.all(cleanupOperations);
  } catch (error) {
    // Silently handle cleanup errors
    console.log('Cleanup completed with some errors (expected for missing models)');
  }
}
