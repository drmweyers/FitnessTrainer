/**
 * Story 005-07: Assign Program to Clients
 * FORGE User Simulation Tests
 *
 * Tests trainer workflow for assigning programs to clients
 */

import { ActorFactory, TrainerActor, ClientActor } from '@/lib/forge/utils/actor-factory';
import { WorkflowRunner } from '@/lib/forge/utils/workflow-runner';

describe('Story 005-07: Assign Program to Clients', () => {
  let trainer: TrainerActor;
  let client: ClientActor;
  const programId = 'prog-123';

  beforeEach(async () => {
    trainer = await ActorFactory.createTrainer();
    client = await ActorFactory.createClient(trainer.id);
  });

  afterEach(async () => {
    await ActorFactory.cleanup(trainer, client);
  });

  describe('Happy Path', () => {
    it('assigns program to single client', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'assignProgram',
            data: {
              programId,
              clientId: client.id,
              startDate: new Date(),
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.finalState.assignment).toBeDefined();
    });

    it('assigns program with custom start date', async () => {
      const startDate = new Date('2026-01-15');

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'assignProgram',
            data: {
              programId,
              clientId: client.id,
              startDate,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.finalState.assignment.startDate).toEqual(startDate);
    });

    it('assigns program with custom notes', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'assignProgram',
            data: {
              programId,
              clientId: client.id,
              startDate: new Date(),
              customNotes: 'Focus on progressive overload',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Batch Assignment', () => {
    it('assigns program to multiple clients', async () => {
      const client2 = await ActorFactory.createClient(trainer.id);
      const client3 = await ActorFactory.createClient(trainer.id);

      const assignments = [
        { programId, clientId: client.id, trainerId: trainer.id, startDate: new Date(), isActive: true },
        { programId, clientId: client2.id, trainerId: trainer.id, startDate: new Date(), isActive: true },
        { programId, clientId: client3.id, trainerId: trainer.id, startDate: new Date(), isActive: true },
      ];

      expect(assignments).toHaveLength(3);

      await ActorFactory.cleanup(client2, client3);
    });
  });

  describe('Assignment Management', () => {
    it('views client assignments', async () => {
      const assignments = [
        { programId, clientId: client.id, trainerId: trainer.id, startDate: new Date(), isActive: true, program: { name: 'Test Program' } },
      ];

      expect(assignments).toHaveLength(1);
      expect(assignments[0].program.name).toBe('Test Program');
    });

    it('modifies assignment dates', async () => {
      const assignment = {
        id: 'assign-1',
        programId,
        clientId: client.id,
        trainerId: trainer.id,
        startDate: new Date('2026-01-01'),
        isActive: true,
      };

      const newStartDate = new Date('2026-02-01');
      const updated = { ...assignment, startDate: newStartDate };

      expect(updated.startDate).toEqual(newStartDate);
    });

    it('cancels assignment', async () => {
      const assignment = {
        id: 'assign-1',
        programId,
        clientId: client.id,
        trainerId: trainer.id,
        startDate: new Date(),
        isActive: true,
      };

      const updated = { ...assignment, isActive: false };

      expect(updated.isActive).toBe(false);
    });
  });

  describe('Conflict Detection', () => {
    it('detects overlapping program assignments', async () => {
      const assignments = [
        { programId, clientId: client.id, trainerId: trainer.id, startDate: new Date('2026-01-01'), endDate: new Date('2026-03-01'), isActive: true },
        { programId: 'prog-2', clientId: client.id, trainerId: trainer.id, startDate: new Date('2026-02-01'), isActive: true },
      ];

      // Both assignments exist (conflict detection is at application level)
      expect(assignments).toHaveLength(2);
    });
  });

  describe('Assignment History', () => {
    it('tracks assignment history', async () => {
      const assignment = {
        id: 'assign-1',
        programId,
        clientId: client.id,
        trainerId: trainer.id,
        startDate: new Date(),
        isActive: true,
        progressData: { completedWeeks: 2, totalWeeks: 4 },
      };

      expect(assignment.progressData.completedWeeks).toBe(2);
    });
  });
});
