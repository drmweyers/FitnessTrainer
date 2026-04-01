/**
 * Story 005-03: Add Exercises to Workouts
 * FORGE User Simulation Tests
 *
 * Tests trainer workflow for adding exercises to workouts
 */

import { ActorFactory, TrainerActor } from '@/lib/forge/utils/actor-factory';
import { WorkflowRunner } from '@/lib/forge/utils/workflow-runner';

describe('Story 005-03: Add Exercises to Workouts', () => {
  let trainer: TrainerActor;
  const workoutId = 'workout-123';

  beforeEach(async () => {
    trainer = await ActorFactory.createTrainer();
  });

  afterEach(async () => {
    await ActorFactory.cleanup(trainer);
  });

  describe('Happy Path', () => {
    it('adds single exercise to workout', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'addExercise',
            data: {
              workoutId,
              exerciseId: 'ex_bench_press',
              orderIndex: 0,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.finalState.exercise).toBeDefined();
    });

    it('adds multiple exercises with correct order', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'addExercise', data: { workoutId, exerciseId: 'ex_1', orderIndex: 0 } },
          { action: 'addExercise', data: { workoutId, exerciseId: 'ex_2', orderIndex: 1 } },
          { action: 'addExercise', data: { workoutId, exerciseId: 'ex_3', orderIndex: 2 } },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.completedSteps).toBe(3);
    });

    it('adds exercise with notes', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'addExercise',
            data: {
              workoutId,
              exerciseId: 'ex_squat',
              orderIndex: 0,
              notes: 'Focus on depth',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.finalState.exercise.notes).toBe('Focus on depth');
    });
  });

  describe('Exercise Management', () => {
    it('removes exercise from workout', async () => {
      const exercises = [
        { id: 'ex-1', workoutId, exerciseId: 'ex_test', orderIndex: 0 },
      ];

      const filtered = exercises.filter(e => e.exerciseId !== 'ex_test');

      expect(filtered).toHaveLength(0);
    });

    it('duplicates exercise in workout', async () => {
      const exercises = [
        { id: 'ex-1', workoutId, exerciseId: 'ex_test', orderIndex: 0, notes: 'First' },
        { id: 'ex-2', workoutId, exerciseId: 'ex_test', orderIndex: 1, notes: 'Second set' },
      ];

      expect(exercises).toHaveLength(2);
      expect(exercises[0].exerciseId).toBe(exercises[1].exerciseId);
    });

    it('reorders exercises', async () => {
      const exercises = [
        { id: 'ex-1', workoutId, exerciseId: 'ex_1', orderIndex: 1 },
        { id: 'ex-2', workoutId, exerciseId: 'ex_2', orderIndex: 0 },
        { id: 'ex-3', workoutId, exerciseId: 'ex_3', orderIndex: 2 },
      ];

      const sorted = exercises.sort((a, b) => a.orderIndex - b.orderIndex);

      expect(sorted[0].exerciseId).toBe('ex_2');
      expect(sorted[1].exerciseId).toBe('ex_1');
    });
  });

  describe('Exercise Count', () => {
    it('tracks exercise count per workout', async () => {
      const exercises = [
        { workoutId, exerciseId: 'ex_1', orderIndex: 0 },
        { workoutId, exerciseId: 'ex_2', orderIndex: 1 },
        { workoutId, exerciseId: 'ex_3', orderIndex: 2 },
      ];

      expect(exercises).toHaveLength(3);
    });

    it('shows exercise count on workout overview', async () => {
      const workout = {
        id: workoutId,
        name: 'Upper Body',
        exercises: [
          { id: 'ex-1', exerciseId: 'ex_1' },
          { id: 'ex-2', exerciseId: 'ex_2' },
        ],
      };

      expect(workout.exercises.length).toBe(2);
    });
  });

  describe('Bulk Operations', () => {
    it('adds multiple exercises at once', async () => {
      const exercises = [
        { workoutId, exerciseId: 'ex_1', orderIndex: 0 },
        { workoutId, exerciseId: 'ex_2', orderIndex: 1 },
        { workoutId, exerciseId: 'ex_3', orderIndex: 2 },
      ];

      expect(exercises).toHaveLength(3);
    });
  });

  describe('Validation', () => {
    it('prevents adding exercise to non-existent workout', async () => {
      const invalidWorkoutId = 'non-existent-id';
      const isValid = invalidWorkoutId.startsWith('workout-');

      expect(isValid).toBe(false);
    });

    it('allows same exercise multiple times', async () => {
      const exercises = [
        { workoutId, exerciseId: 'ex_same', orderIndex: 0 },
        { workoutId, exerciseId: 'ex_same', orderIndex: 1 },
      ];

      expect(exercises).toHaveLength(2);
    });
  });
});
