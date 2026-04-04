/**
 * FORGE Stream D Utilities
 * Analytics & Messaging workflow testing utilities
 * Uses mock-based approach (no database calls)
 */

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
 * ActorFactory - Creates test actors for simulations (mock-based)
 */
export class ActorFactory {
  private static idCounter = 0;

  private static generateId(): string {
    this.idCounter++;
    return `00000000-0000-0000-0000-${String(this.idCounter).padStart(12, '0')}`;
  }

  static async createTrainer(overrides: Partial<Actor> = {}): Promise<Actor> {
    const id = overrides.id || this.generateId();
    const email = overrides.email || `trainer-${id.slice(-6)}@test.com`;

    return {
      id,
      email,
      role: 'trainer',
      fullName: overrides.fullName || 'Test Trainer',
      state: {}
    };
  }

  static async createClient(overrides: Partial<Actor> = {}): Promise<Actor> {
    const id = overrides.id || this.generateId();
    const email = overrides.email || `client-${id.slice(-6)}@test.com`;

    return {
      id,
      email,
      role: 'client',
      fullName: overrides.fullName || 'Test Client',
      state: {}
    };
  }

  static async createAdmin(overrides: Partial<Actor> = {}): Promise<Actor> {
    const id = overrides.id || this.generateId();
    const email = overrides.email || `admin-${id.slice(-6)}@test.com`;

    return {
      id,
      email,
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
 * Measurement utilities for analytics workflows (mock-based)
 */
export class MeasurementHelpers {
  static async createMeasurement(userId: string, data: {
    type: string;
    value: number;
    unit?: string;
    recordedAt?: Date;
  }) {
    // Mock implementation
    return {
      id: `measurement-${Date.now()}`,
      userId,
      weight: data.value,
      recordedAt: data.recordedAt || new Date(),
      measurements: {
        type: data.type,
        value: data.value,
        unit: data.unit || 'kg'
      }
    };
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

    // Mock implementation
    return {
      id: `measurement-${Date.now()}`,
      userId,
      recordedAt: data.recordedAt || new Date(),
      measurements
    };
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
 * Messaging utilities for chat workflows (mock-based)
 */
export class MessagingHelpers {
  static async createConversation(participantIds: string[]) {
    // Mock implementation
    return {
      id: `conv-${Date.now()}`,
      type: participantIds.length > 2 ? 'GROUP' : 'DIRECT',
      participants: participantIds.map(id => ({ userId: id })),
      createdAt: new Date()
    };
  }

  static async sendMessage(conversationId: string, senderId: string, content: string) {
    // Mock implementation
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
 * Goal tracking utilities (mock-based)
 */
export class GoalHelpers {
  static async createGoal(userId: string, data: {
    type: string;
    target: number;
    current?: number;
    unit: string;
    deadline?: Date;
  }) {
    // Mock implementation - returns data matching test expectations
    return {
      id: `goal-${Date.now()}`,
      userId,
      type: data.type,
      target: data.target,
      current: data.current || 0,
      unit: data.unit,
      deadline: data.deadline,
      status: 'ACTIVE',
      isActive: true
    };
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
 * Cleanup utilities - no-op for mock-based tests
 */
export async function cleanupTestData(): Promise<void> {
  // No-op for mock-based tests
  // All data is in-memory and gets garbage collected
}
