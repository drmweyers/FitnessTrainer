/**
 * Example Test Suite - Multi-actor user simulation tests
 *
 * This demonstrates how to write comprehensive user simulation tests
 * using the ActorFactory and WorkflowRunner patterns.
 */

import { ActorFactory } from '@/lib/testing/actor-factory';
import { WorkflowRunner, Workflow, WorkflowContext } from '@/lib/testing/workflow-runner';
import { WorkflowStep } from '@/lib/testing/workflow-step';
import { POST, GET, PUT, DELETE } from '@/app/api/utils';

// ============================================================================
// PLATFORM-SPECIFIC WORKFLOW STEPS
// ============================================================================

/**
 * Step: Create a program (trainer action)
 */
class CreateProgramStep implements WorkflowStep {
  name = 'CreateProgram';

  constructor(private config: { name: string; description?: string }) {}

  async execute(context: WorkflowContext): Promise<any> {
    const trainer = context.getActor('trainer');

    const response = await POST(trainer.authenticatedRequest('/api/programs', {
      name: this.config.name,
      description: this.config.description,
    }));

    const result = await response.json();
    context.setState('programId', result.data.id);
    return result.data;
  }
}

/**
 * Step: Add workout to program (trainer action)
 */
class AddWorkoutStep implements WorkflowStep {
  name = 'AddWorkout';

  constructor(private config: { day: number; exercises: any[] }) {}

  async execute(context: WorkflowContext): Promise<any> {
    const trainer = context.getActor('trainer');
    const programId = context.getState('programId');

    const response = await POST(trainer.authenticatedRequest(
      `/api/programs/${programId}/workouts`,
      { day: this.config.day, exercises: this.config.exercises }
    ));

    return (await response.json()).data;
  }
}

/**
 * Step: Invite client (trainer action)
 */
class InviteClientStep implements WorkflowStep {
  name = 'InviteClient';

  constructor(private config: { email?: string }) {}

  async execute(context: WorkflowContext): Promise<any> {
    const trainer = context.getActor('trainer');
    const clientEmail = this.config.email || context.getActor('client').user.email;

    const response = await POST(trainer.authenticatedRequest('/api/clients/invite', {
      email: clientEmail,
    }));

    return (await response.json()).data;
  }
}

/**
 * Step: Assign program to client (trainer action)
 */
class AssignProgramStep implements WorkflowStep {
  name = 'AssignProgram';

  async execute(context: WorkflowContext): Promise<any> {
    const trainer = context.getActor('trainer');
    const programId = context.getState('programId');
    const clientId = context.getActor('client').user.id;

    const response = await POST(trainer.authenticatedRequest(
      `/api/programs/${programId}/assign`,
      { clientId }
    ));

    return (await response.json()).data;
  }
}

/**
 * Step: Accept invitation (client action)
 */
class AcceptInvitationStep implements WorkflowStep {
  name = 'AcceptInvitation';

  async execute(context: WorkflowContext): Promise<any> {
    const client = context.getActor('client');

    // Get pending invitation
    const response = await GET(client.authenticatedRequest('/api/invitations'));
    const invitations = (await response.json()).data;

    if (invitations.length === 0) {
      throw new Error('No pending invitations found');
    }

    // Accept first invitation
    const acceptResponse = await PUT(
      client.authenticatedRequest(`/api/invitations/${invitations[0].id}/accept`)
    );

    return (await acceptResponse.json()).data;
  }
}

/**
 * Step: View assigned program (client action)
 */
class ViewAssignedProgramStep implements WorkflowStep {
  name = 'ViewAssignedProgram';

  async execute(context: WorkflowContext): Promise<any> {
    const client = context.getActor('client');

    const response = await GET(client.authenticatedRequest('/api/my-programs'));
    const programs = (await response.json()).data;

    if (programs.length === 0) {
      throw new Error('No assigned programs found');
    }

    context.setState('assignedProgramId', programs[0].id);
    return programs[0];
  }
}

/**
 * Step: Complete workout (client action)
 */
class CompleteWorkoutStep implements WorkflowStep {
  name = 'CompleteWorkout';

  async execute(context: WorkflowContext): Promise<any> {
    const client = context.getActor('client');
    const programId = context.getState('assignedProgramId');

    const response = await POST(
      client.authenticatedRequest(`/api/programs/${programId}/complete`)
    );

    return (await response.json()).data;
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('User Simulation Tests', () => {
  const workflowRunner = new WorkflowRunner();

  afterEach(async () => {
    // Cleanup is handled by ActorFactory or individual tests
  });

  // ==========================================================================
  // SINGLE ACTOR WORKFLOWS
  // ==========================================================================

  describe('Single Actor Workflows', () => {
    it('admin can view platform metrics', async () => {
      const admin = await ActorFactory.createActor('admin');
      const context = new WorkflowContext({ admin });

      const response = await GET(
        admin.authenticatedRequest('/api/admin/metrics')
      );
      const metrics = (await response.json()).data;

      expect(metrics).toHaveProperty('totalUsers');
      expect(metrics).toHaveProperty('activeUsers');
      expect(metrics).toHaveProperty('revenue');
    });

    it('trainer can create a program', async () => {
      const trainer = await ActorFactory.createActor('trainer');
      const context = new WorkflowContext({ trainer });

      const workflow = new Workflow([
        new CreateProgramStep({ name: 'Strength 101', description: 'Beginner strength training' }),
        new AddWorkoutStep({ day: 1, exercises: [{ name: 'Squat', sets: 3, reps: 10 }] }),
      ]);

      const result = await workflowRunner.run(workflow, context);

      expect(result.success).toBe(true);
      expect(result.context.getState('programId')).toBeDefined();
    });
  });

  // ==========================================================================
  // MULTI-ACTOR WORKFLOWS
  // ==========================================================================

  describe('Multi-Actor Workflows', () => {
    it('trainer assigns program, client completes workout', async () => {
      // Create actors
      const trainer = await ActorFactory.createActor('trainer');
      const client = await ActorFactory.createActor('client');

      // Register client in context so trainer can reference them
      const trainerContext = new WorkflowContext({ trainer, client });

      // Trainer workflow
      const trainerWorkflow = new Workflow([
        new CreateProgramStep({ name: 'Cardio Blast' }),
        new AddWorkoutStep({ day: 1, exercises: [{ name: 'Running', duration: 30 }] }),
        new InviteClientStep({}),
        new AssignProgramStep(),
      ]);

      const trainerResult = await workflowRunner.run(trainerWorkflow, trainerContext);
      expect(trainerResult.success).toBe(true);

      // Client workflow
      const clientContext = new WorkflowContext({ client, trainer });
      const clientWorkflow = new Workflow([
        new AcceptInvitationStep(),
        new ViewAssignedProgramStep(),
        new CompleteWorkoutStep(),
      ]);

      const clientResult = await workflowRunner.run(clientWorkflow, clientContext);
      expect(clientResult.success).toBe(true);
    });

    it('admin manages user accounts', async () => {
      const admin = await ActorFactory.createActor('admin');
      const user = await ActorFactory.createActor('client');

      // Suspend user
      const suspendResponse = await PUT(
        admin.authenticatedRequest(`/api/admin/users/${user.user.id}/suspend`)
      );
      expect(suspendResponse.status).toBe(200);

      // Verify user cannot access protected resources
      const accessResponse = await GET(
        user.authenticatedRequest('/api/protected-resource')
      );
      expect(accessResponse.status).toBe(403);

      // Reactivate user
      const reactivateResponse = await PUT(
        admin.authenticatedRequest(`/api/admin/users/${user.user.id}/reactivate`)
      );
      expect(reactivateResponse.status).toBe(200);

      // Verify user can access resources again
      const newAccessResponse = await GET(
        user.authenticatedRequest('/api/protected-resource')
      );
      expect(newAccessResponse.status).toBe(200);
    });
  });

  // ==========================================================================
  // RACE CONDITIONS & CONCURRENCY
  // ==========================================================================

  describe('Race Conditions & Concurrency', () => {
    it('handles concurrent booking attempts', async () => {
      const trainer = await ActorFactory.createActor('trainer');
      const client1 = await ActorFactory.createActor('client');
      const client2 = await ActorFactory.createActor('client');

      // Create a limited slot
      const slotResponse = await POST(
        trainer.authenticatedRequest('/api/slots', {
          startTime: '2026-04-01T10:00:00Z',
          duration: 60,
          capacity: 1,
        })
      );
      const slot = (await slotResponse.json()).data;

      // Both clients try to book simultaneously
      const bookSlot = async (client: any, slotId: string) => {
        const response = await POST(
          client.authenticatedRequest(`/api/slots/${slotId}/book`)
        );
        if (!response.ok) throw new Error('Booking failed');
        return response.json();
      };

      const results = await Promise.allSettled([
        bookSlot(client1, slot.id),
        bookSlot(client2, slot.id),
      ]);

      // Only one should succeed
      const successes = results.filter(r => r.status === 'fulfilled');
      expect(successes.length).toBe(1);
    });

    it('handles parallel workflow execution', async () => {
      const trainer = await ActorFactory.createActor('trainer');

      // Create multiple workflows that run in parallel
      const workflows = Array.from({ length: 5 }, (_, i) => {
        const context = new WorkflowContext({ trainer });
        const workflow = new Workflow([
          new CreateProgramStep({ name: `Program ${i + 1}` }),
        ]);
        return { workflow, context };
      });

      const results = await workflowRunner.runParallel(workflows);

      // All should succeed
      expect(results.every(r => r.success)).toBe(true);

      // Each should have a unique program ID
      const programIds = results.map(r => r.context.getState('programId'));
      const uniqueIds = new Set(programIds);
      expect(uniqueIds.size).toBe(programIds.length);
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe('Error Handling', () => {
    it('handles workflow step failures gracefully', async () => {
      const client = await ActorFactory.createActor('client');
      const context = new WorkflowContext({ client });

      // Try to access admin endpoint as client (should fail)
      const response = await GET(
        client.authenticatedRequest('/api/admin/metrics')
      );

      expect(response.status).toBe(403);
    });

    it('validates state dependencies between steps', async () => {
      const trainer = await ActorFactory.createActor('trainer');
      const context = new WorkflowContext({ trainer });

      // Try to assign program before creating it
      const workflow = new Workflow([
        new AssignProgramStep(), // This should fail - no programId in context
      ]);

      const result = await workflowRunner.run(workflow, context);

      expect(result.success).toBe(false);
      expect(result.failedStep).toBe('AssignProgram');
    });
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function POST(request: Request): Promise<Response> {
  // Implementation depends on your test setup
  // Could use actual fetch, Next.js test helpers, etc.
  return fetch(request);
}

async function GET(request: Request): Promise<Response> {
  return fetch(request);
}

async function PUT(request: Request): Promise<Response> {
  return fetch(request);
}
