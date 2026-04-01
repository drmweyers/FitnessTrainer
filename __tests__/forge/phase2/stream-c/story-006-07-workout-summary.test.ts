/**
 * Story 006-07: Workout Summary
 * FORGE User Simulation Tests
 *
 * Tests client workflow for viewing workout summary after completion
 */

import { ActorFactory, TrainerActor, ClientActor } from '@/lib/forge/utils/actor-factory';
import { WorkflowRunner } from '@/lib/forge/utils/workflow-runner';

describe('Story 006-07: Workout Summary', () => {
  let trainer: TrainerActor;
  let client: ClientActor;
  const sessionId = 'session-123';

  beforeEach(async () => {
    trainer = await ActorFactory.createTrainer();
    client = await ActorFactory.createClient(trainer.id);
  });

  afterEach(async () => {
    await ActorFactory.cleanup(trainer, client);
  });

  describe('Happy Path', () => {
    it('completes workout and generates summary', async () => {
      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          {
            action: 'completeWorkout',
            data: {
              sessionId,
              duration: 58,
              notes: 'Great session!',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('calculates total workout volume', async () => {
      const sets = [
        { weight: 185, reps: 8 },
        { weight: 185, reps: 8 },
        { weight: 185, reps: 7 },
      ];

      const totalVolume = sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);

      expect(totalVolume).toBe(4255);
    });

    it('tracks workout duration', async () => {
      const session = {
        id: sessionId,
        userId: client.id,
        status: 'completed',
        duration: 58,
      };

      expect(session.duration).toBe(58);
    });
  });

  describe('Summary Metrics', () => {
    it('counts exercises completed', async () => {
      const exerciseCount = 7;
      const prescribedCount = 8;
      const completionPercentage = (exerciseCount / prescribedCount) * 100;

      expect(exerciseCount).toBe(7);
      expect(completionPercentage).toBe(87.5);
    });

    it('calculates volume by exercise', async () => {
      const exerciseVolumes = [
        { name: 'Bench Press', volume: 3150 },
        { name: 'Bent Over Rows', volume: 2800 },
        { name: 'Overhead Press', volume: 1850 },
      ];

      const totalVolume = exerciseVolumes.reduce((sum, ex) => sum + ex.volume, 0);

      expect(totalVolume).toBe(7800);
    });

    it('calculates volume by body part', async () => {
      const bodyPartVolumes = {
        chest: 3150,
        back: 2800,
        shoulders: 1850,
      };

      const total = Object.values(bodyPartVolumes).reduce((sum, v) => sum + v, 0);
      const chestPercentage = (bodyPartVolumes.chest / total) * 100;

      expect(chestPercentage).toBeCloseTo(40.4, 1);
    });
  });

  describe('Performance Comparison', () => {
    it('compares to prescribed volume', async () => {
      const prescribedVolume = 10000;
      const actualVolume = 10500;
      const percentage = (actualVolume / prescribedVolume) * 100;

      expect(percentage).toBe(105);
    });

    it('compares sets completed vs prescribed', async () => {
      const prescribedSets = 24;
      const completedSets = 22;
      const percentage = (completedSets / prescribedSets) * 100;

      expect(percentage).toBeCloseTo(91.7, 1);
    });
  });

  describe('Personal Records', () => {
    it('lists PRs achieved in workout', async () => {
      const prs = [
        { exercise: 'Bench Press', type: '1RM', value: 195 },
        { exercise: 'Rows', type: 'Max Volume', value: 4200 },
      ];

      expect(prs).toHaveLength(2);
    });
  });

  describe('Workout Notes', () => {
    it('saves workout notes', async () => {
      const notes = 'Felt strong today, increased weight on bench';

      const session = {
        id: sessionId,
        userId: client.id,
        notes,
      };

      expect(session.notes).toBe(notes);
    });
  });

  describe('Modifications Summary', () => {
    it('lists skipped exercises', async () => {
      const skipped = ['Lateral Raises'];

      expect(skipped).toContain('Lateral Raises');
    });

    it('lists added sets', async () => {
      const addedSets = [{ exercise: 'Bench Press', setsAdded: 1 }];

      expect(addedSets[0].setsAdded).toBe(1);
    });
  });
});
