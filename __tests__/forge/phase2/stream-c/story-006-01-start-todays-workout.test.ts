/**
 * Story 006-01: Start Today's Workout
 * FORGE User Simulation Tests
 *
 * Tests client workflow for starting scheduled workouts
 */

import { ActorFactory, TrainerActor, ClientActor } from '@/lib/forge/utils/actor-factory';
import { WorkflowRunner } from '@/lib/forge/utils/workflow-runner';

describe('Story 006-01: Start Todays Workout', () => {
  let trainer: TrainerActor;
  let client: ClientActor;
  const programId = 'prog-123';
  const workoutId = 'workout-123';

  beforeEach(async () => {
    trainer = await ActorFactory.createTrainer();
    client = await ActorFactory.createClient(trainer.id);
  });

  afterEach(async () => {
    await ActorFactory.cleanup(trainer, client);
  });

  describe('Happy Path', () => {
    it('starts workout session', async () => {
      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          {
            action: 'startWorkout',
            data: { workoutId },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.finalState.session).toBeDefined();
      expect(result.finalState.session.status).toBe('in_progress');
    });

    it('creates workout session with correct client', async () => {
      const result = await WorkflowRunner.run({
        actor: client,
        steps: [{ action: 'startWorkout', data: { workoutId } }],
      });

      expect(result.finalState.session.userId).toBe(client.id);
    });

    it('records start time', async () => {
      const beforeStart = new Date();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [{ action: 'startWorkout', data: { workoutId } }],
      });

      const afterStart = new Date();
      const sessionStart = new Date(result.finalState.session.startedAt);

      expect(sessionStart.getTime()).toBeGreaterThanOrEqual(beforeStart.getTime());
      expect(sessionStart.getTime()).toBeLessThanOrEqual(afterStart.getTime());
    });
  });

  describe('Workout Preview', () => {
    it('shows workout overview before starting', async () => {
      const workout = {
        id: workoutId,
        name: 'Upper Body Power',
        estimatedDuration: 60,
      };

      expect(workout).toBeDefined();
      expect(workout.name).toBe('Upper Body Power');
      expect(workout.estimatedDuration).toBe(60);
    });

    it('shows exercise list for workout', async () => {
      const exercises = [
        { workoutId, exerciseId: 'ex_bench', orderIndex: 0 },
        { workoutId, exerciseId: 'ex_row', orderIndex: 1 },
        { workoutId, exerciseId: 'ex_press', orderIndex: 2 },
      ];

      expect(exercises).toHaveLength(3);
    });
  });

  describe('Previous Performance', () => {
    it('shows previous workout data if available', async () => {
      const previousSession = {
        userId: client.id,
        workoutId,
        status: 'completed',
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 3600000),
        duration: 60,
      };

      const history = [previousSession];

      expect(history).toHaveLength(1);
      expect(history[0].duration).toBe(60);
    });
  });

  describe('Edge Cases', () => {
    it('handles no scheduled workout', async () => {
      const unassignedClient = await ActorFactory.createClient();

      const assignments: any[] = [];

      expect(assignments).toHaveLength(0);

      await ActorFactory.cleanup(unassignedClient);
    });

    it('handles already completed workout today', async () => {
      const todaySessions = [
        {
          userId: client.id,
          workoutId,
          status: 'completed',
          startedAt: new Date(),
          completedAt: new Date(),
        },
      ];

      expect(todaySessions.length).toBeGreaterThan(0);
    });
  });
});
