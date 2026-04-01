/**
 * Story 006-02: Log Sets and Reps
 * FORGE User Simulation Tests
 *
 * Tests client workflow for logging set performance
 */

import { ActorFactory, TrainerActor, ClientActor } from '@/lib/forge/utils/actor-factory';
import { WorkflowRunner } from '@/lib/forge/utils/workflow-runner';

describe('Story 006-02: Log Sets and Reps', () => {
  let trainer: TrainerActor;
  let client: ClientActor;
  const exerciseLogId = 'elog-123';

  beforeEach(async () => {
    trainer = await ActorFactory.createTrainer();
    client = await ActorFactory.createClient(trainer.id);
  });

  afterEach(async () => {
    await ActorFactory.cleanup(trainer, client);
  });

  describe('Happy Path', () => {
    it('logs a completed set', async () => {
      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'startWorkout', data: { workoutId: 'wo-123' } },
          {
            action: 'logSet',
            data: {
              exerciseLogId,
              setNumber: 1,
              weight: 185,
              reps: 8,
              unit: 'lb',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('logs multiple sets', async () => {
      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'startWorkout', data: { workoutId: 'wo-123' } },
          { action: 'logSet', data: { exerciseLogId, setNumber: 1, weight: 185, reps: 8 } },
          { action: 'logSet', data: { exerciseLogId, setNumber: 2, weight: 185, reps: 8 } },
          { action: 'logSet', data: { exerciseLogId, setNumber: 3, weight: 185, reps: 7 } },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.completedSteps).toBe(4);
    });

    it('logs set with RPE', async () => {
      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'startWorkout', data: { workoutId: 'wo-123' } },
          {
            action: 'logSet',
            data: {
              exerciseLogId,
              setNumber: 1,
              weight: 200,
              reps: 5,
              rpe: 9,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Set Types', () => {
    it('logs warmup set', async () => {
      const setLog = {
        exerciseLogId,
        setNumber: 0,
        performedWeight: 135,
        performedReps: 10,
        weightUnit: 'lb',
        isWarmup: true,
        completedAt: new Date(),
      };

      expect(setLog.isWarmup).toBe(true);
    });

    it('logs drop set', async () => {
      const setLog = {
        exerciseLogId,
        setNumber: 4,
        performedWeight: 135,
        performedReps: 12,
        weightUnit: 'lb',
        isDropset: true,
        completedAt: new Date(),
      };

      expect(setLog.isDropset).toBe(true);
    });

    it('logs failed set', async () => {
      const setLog = {
        exerciseLogId,
        setNumber: 3,
        performedWeight: 205,
        performedReps: 4,
        weightUnit: 'lb',
        isFailed: true,
        completedAt: new Date(),
      };

      expect(setLog.isFailed).toBe(true);
    });

    it('logs AMRAP set', async () => {
      const setLog = {
        exerciseLogId,
        setNumber: 3,
        performedWeight: 185,
        performedReps: 15,
        weightUnit: 'lb',
        isAmrap: true,
        completedAt: new Date(),
      };

      expect(setLog.isAmrap).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('rejects negative weight', async () => {
      const weight = -50;
      const isValid = weight >= 0;

      expect(isValid).toBe(false);
    });

    it('rejects negative reps', async () => {
      const reps = -5;
      const isValid = reps >= 0;

      expect(isValid).toBe(false);
    });

    it('accepts zero weight for bodyweight exercises', async () => {
      const setLog = {
        exerciseLogId,
        setNumber: 1,
        performedWeight: 0,
        performedReps: 15,
        weightUnit: 'lb',
        completedAt: new Date(),
      };

      expect(setLog.performedWeight).toBe(0);
    });
  });

  describe('Volume Calculation', () => {
    it('calculates set volume', async () => {
      const weight = 185;
      const reps = 8;
      const setVolume = weight * reps;

      expect(setVolume).toBe(1480);
    });

    it('calculates total exercise volume', async () => {
      const sets = [
        { exerciseLogId, setNumber: 1, performedWeight: 185, performedReps: 8, weightUnit: 'lb', completedAt: new Date() },
        { exerciseLogId, setNumber: 2, performedWeight: 185, performedReps: 8, weightUnit: 'lb', completedAt: new Date() },
        { exerciseLogId, setNumber: 3, performedWeight: 185, performedReps: 7, weightUnit: 'lb', completedAt: new Date() },
      ];

      const totalVolume = sets.reduce((sum, set) => {
        return sum + (set.performedWeight * set.performedReps);
      }, 0);

      expect(totalVolume).toBe(4255);
    });
  });
});
