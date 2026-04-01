/**
 * FORGE Actor Factory - Stream E
 * Creates simulated users (trainers, clients, admins) for workflow testing
 */

import { v4 as uuidv4 } from 'uuid';

export type UserRole = 'trainer' | 'client' | 'admin';

export interface Actor {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  token?: string;
  metadata: Record<string, any>;
}

export interface WorkflowStep {
  action: string;
  data?: Record<string, any>;
  expectedOutcome?: string;
}

export interface WorkflowResult {
  success: boolean;
  data?: any;
  error?: string;
  stepsCompleted: number;
}

export class ActorFactory {
  private static idCounter = 0;

  static createTrainer(overrides: Partial<Actor> = {}): Actor {
    this.idCounter++;
    return {
      id: overrides.id || uuidv4(),
      email: overrides.email || `trainer${this.idCounter}@evofit.test`,
      role: 'trainer',
      fullName: overrides.fullName || `Test Trainer ${this.idCounter}`,
      token: `trainer-token-${this.idCounter}`,
      metadata: {
        specialty: 'Strength Training',
        certifications: ['NASM-CPT', 'ACE'],
        yearsExperience: 5,
        ...overrides.metadata
      }
    };
  }

  static createClient(overrides: Partial<Actor> = {}): Actor {
    this.idCounter++;
    return {
      id: overrides.id || uuidv4(),
      email: overrides.email || `client${this.idCounter}@evofit.test`,
      role: 'client',
      fullName: overrides.fullName || `Test Client ${this.idCounter}`,
      token: `client-token-${this.idCounter}`,
      metadata: {
        fitnessGoal: 'WEIGHT_LOSS',
        experienceLevel: 'beginner',
        preferredWorkoutTime: 'morning',
        ...overrides.metadata
      }
    };
  }

  static createAdmin(overrides: Partial<Actor> = {}): Actor {
    this.idCounter++;
    return {
      id: overrides.id || uuidv4(),
      email: overrides.email || `admin${this.idCounter}@evofit.test`,
      role: 'admin',
      fullName: overrides.fullName || `Test Admin ${this.idCounter}`,
      token: `admin-token-${this.idCounter}`,
      metadata: {
        permissions: ['all'],
        department: 'platform',
        ...overrides.metadata
      }
    };
  }

  static createGroup(roles: { trainers?: number; clients?: number; admins?: number }): Actor[] {
    const actors: Actor[] = [];

    for (let i = 0; i < (roles.trainers || 0); i++) {
      actors.push(this.createTrainer());
    }
    for (let i = 0; i < (roles.clients || 0); i++) {
      actors.push(this.createClient());
    }
    for (let i = 0; i < (roles.admins || 0); i++) {
      actors.push(this.createAdmin());
    }

    return actors;
  }
}

export class WorkflowRunner {
  static async run(options: {
    actor: Actor;
    steps: WorkflowStep[];
    context?: Record<string, any>;
  }): Promise<WorkflowResult> {
    const { actor, steps, context = {} } = options;
    let stepsCompleted = 0;
    let currentData: any = null;

    for (const step of steps) {
      try {
        const result = await this.executeStep(actor, step, { ...context, previousData: currentData });
        if (!result.success) {
          return {
            success: false,
            error: result.error,
            stepsCompleted,
            data: currentData
          };
        }
        currentData = result.data;
        stepsCompleted++;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          stepsCompleted,
          data: currentData
        };
      }
    }

    return {
      success: true,
      stepsCompleted,
      data: currentData
    };
  }

  private static async executeStep(
    actor: Actor,
    step: WorkflowStep,
    context: Record<string, any>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    // This is a simulation framework - actual implementations
    // will mock the API calls and return expected responses
    switch (step.action) {
      case 'authenticate':
        return { success: true, data: { token: actor.token, user: actor } };

      case 'viewSchedule':
        return { success: true, data: { appointments: [], availability: [] } };

      case 'setAvailability':
        return { success: true, data: { availabilitySet: true } };

      case 'bookSession':
        return { success: true, data: { bookingId: uuidv4(), status: 'confirmed' } };

      case 'cancelSession':
        return { success: true, data: { cancelled: true } };

      case 'sendReminder':
        return { success: true, data: { sent: true } };

      case 'processPayment':
        return { success: true, data: { paymentId: uuidv4(), status: 'completed' } };

      case 'viewMetrics':
        return { success: true, data: { metrics: {} } };

      case 'manageUser':
        return { success: true, data: { updated: true } };

      default:
        return { success: true, data: { action: step.action } };
    }
  }
}

// Extend Actor with methods for common actions
export class ActorWithActions {
  constructor(public actor: Actor) {}

  async attempt(action: string, data?: Record<string, any>): Promise<any> {
    // Simulated action attempt
    return { success: true, action, data };
  }

  canPerform(action: string): boolean {
    const permissions: Record<UserRole, string[]> = {
      trainer: ['viewSchedule', 'setAvailability', 'bookSession', 'cancelSession', 'viewClients'],
      client: ['viewSchedule', 'bookSession', 'cancelSession', 'viewWorkouts'],
      admin: ['viewMetrics', 'manageUsers', 'viewTickets', 'monitorHealth', 'all']
    };
    return permissions[this.actor.role].includes(action) || permissions[this.actor.role].includes('all');
  }
}
