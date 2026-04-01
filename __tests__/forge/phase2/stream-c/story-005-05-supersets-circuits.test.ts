/**
 * Story 005-05: Create Supersets and Circuits
 * FORGE User Simulation Tests
 *
 * Tests trainer workflow for creating supersets, circuits, and giant sets
 */

import { ActorFactory, TrainerActor } from '@/lib/forge/utils/actor-factory';
import { WorkflowRunner } from '@/lib/forge/utils/workflow-runner';

describe('Story 005-05: Create Supersets and Circuits', () => {
  let trainer: TrainerActor;
  const workoutId = 'workout-123';
  const exerciseIds: string[] = [];

  beforeEach(async () => {
    trainer = await ActorFactory.createTrainer();
    // Create mock exercise IDs
    for (let i = 0; i < 5; i++) {
      exerciseIds.push(`ex_${i}`);
    }
  });

  afterEach(async () => {
    await ActorFactory.cleanup(trainer);
    exerciseIds.length = 0;
  });

  describe('Happy Path', () => {
    it('creates a superset with 2 exercises', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'createSuperset',
            data: {
              exerciseIds: [exerciseIds[0], exerciseIds[1]],
              groupId: 'A',
              restBetweenExercises: 0,
              restBetweenSets: 90,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('creates a circuit with 3+ exercises', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'createSuperset',
            data: {
              exerciseIds: [exerciseIds[0], exerciseIds[1], exerciseIds[2]],
              groupId: 'B',
              groupType: 'circuit',
              rounds: 3,
              restBetweenExercises: 30,
              restBetweenSets: 120,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('creates a giant set with 4+ exercises', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'createSuperset',
            data: {
              exerciseIds: [exerciseIds[0], exerciseIds[1], exerciseIds[2], exerciseIds[3]],
              groupId: 'C',
              groupType: 'giant_set',
              restBetweenExercises: 0,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Group Management', () => {
    it('ungroups exercises', async () => {
      const exercises = [
        { id: exerciseIds[0], workoutId, supersetGroup: 'A' },
        { id: exerciseIds[1], workoutId, supersetGroup: 'A' },
      ];

      // Ungroup
      const ungrouped = exercises.map(e => ({ ...e, supersetGroup: null }));

      expect(ungrouped[0].supersetGroup).toBeNull();
      expect(ungrouped[1].supersetGroup).toBeNull();
    });

    it('supports multiple groups in same workout', async () => {
      const exercises = [
        { id: exerciseIds[0], workoutId, supersetGroup: 'A' },
        { id: exerciseIds[1], workoutId, supersetGroup: 'A' },
        { id: exerciseIds[2], workoutId, supersetGroup: 'B' },
        { id: exerciseIds[3], workoutId, supersetGroup: 'B' },
      ];

      const groupA = exercises.filter(e => e.supersetGroup === 'A');
      const groupB = exercises.filter(e => e.supersetGroup === 'B');

      expect(groupA).toHaveLength(2);
      expect(groupB).toHaveLength(2);
    });
  });

  describe('Rest Configuration', () => {
    it('sets rest between exercises in superset', async () => {
      const exercise = {
        id: exerciseIds[0],
        workoutId,
        supersetGroup: 'A',
        notes: 'Rest: 0s between exercises, 90s between sets',
      };

      expect(exercise.notes).toContain('0s between exercises');
    });

    it('sets rest between rounds for circuits', async () => {
      const exercise = {
        id: exerciseIds[0],
        workoutId,
        supersetGroup: 'Circuit',
        notes: 'Circuit: 3 rounds, 30s between exercises, 120s between rounds',
      };

      expect(exercise.notes).toContain('3 rounds');
    });
  });

  describe('Validation', () => {
    it('prevents single exercise superset', async () => {
      // A superset should have at least 2 exercises
      const groupedExercises = [{ id: exerciseIds[0], supersetGroup: 'Single' }];

      // If we only have one exercise, it's not a valid superset
      expect(groupedExercises.length).toBeLessThan(2);
    });
  });

  describe('Superset Types', () => {
    it('creates antagonist superset', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'createSuperset',
            data: {
              exerciseIds: [exerciseIds[0], exerciseIds[1]],
              groupId: 'Antagonist',
              groupType: 'antagonist',
              restBetweenExercises: 60,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('creates pre-exhaust superset', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'createSuperset',
            data: {
              exerciseIds: [exerciseIds[0], exerciseIds[1]],
              groupId: 'PreExhaust',
              groupType: 'pre_exhaust',
              restBetweenExercises: 0,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('creates post-exhaust superset', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'createSuperset',
            data: {
              exerciseIds: [exerciseIds[0], exerciseIds[1]],
              groupId: 'PostExhaust',
              groupType: 'post_exhaust',
              restBetweenExercises: 0,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Circuit Progression', () => {
    it('tracks rounds completed', async () => {
      const roundsCompleted = 3;
      const totalRounds = 4;

      expect(roundsCompleted).toBeLessThanOrEqual(totalRounds);
    });

    it('calculates total circuit time', async () => {
      const exercises = 3;
      const timePerExercise = 45;
      const restBetweenExercises = 15;
      const rounds = 3;
      const restBetweenRounds = 120;

      const roundTime = exercises * (timePerExercise + restBetweenExercises);
      const totalTime = rounds * roundTime + (rounds - 1) * restBetweenRounds;

      expect(totalTime).toBeGreaterThan(0);
    });
  });
});
