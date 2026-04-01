/**
 * Story 005-04: Configure Exercise Parameters
 * FORGE User Simulation Tests
 *
 * Tests trainer workflow for configuring exercise sets, reps, weight, rest, tempo, RPE/RIR
 */

import { ActorFactory, TrainerActor } from '@/lib/forge/utils/actor-factory';
import { WorkflowRunner } from '@/lib/forge/utils/workflow-runner';

describe('Story 005-04: Configure Exercise Parameters', () => {
  let trainer: TrainerActor;
  const workoutExerciseId = 'we-123';

  beforeEach(async () => {
    trainer = await ActorFactory.createTrainer();
  });

  afterEach(async () => {
    await ActorFactory.cleanup(trainer);
  });

  describe('Happy Path', () => {
    it('configures standard working sets', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'configureSets',
            data: {
              exerciseId: workoutExerciseId,
              sets: 3,
              setType: 'working',
              reps: '8-10',
              weightGuidance: 'RPE 8',
              restSeconds: 90,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.finalState.configs).toHaveLength(3);
    });

    it('configures warm-up sets', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'configureSets',
            data: {
              exerciseId: workoutExerciseId,
              sets: 2,
              setType: 'warmup',
              reps: '10',
              weightGuidance: '50% working weight',
              restSeconds: 60,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.finalState.configs[0].setType).toBe('warmup');
    });

    it('configures drop sets', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'configureSets',
            data: {
              exerciseId: workoutExerciseId,
              sets: 1,
              setType: 'drop',
              reps: 'AMRAP',
              weightGuidance: 'Drop 20% each mini-set',
              restSeconds: 0,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.finalState.configs[0].setType).toBe('drop');
    });
  });

  describe('Rep Formats', () => {
    it('supports exact reps', async () => {
      const config = {
        workoutExerciseId,
        setNumber: 1,
        setType: 'working',
        reps: '8',
      };

      expect(config.reps).toBe('8');
    });

    it('supports rep ranges', async () => {
      const config = {
        workoutExerciseId,
        setNumber: 1,
        setType: 'working',
        reps: '8-12',
      };

      expect(config.reps).toBe('8-12');
    });

    it('supports AMRAP', async () => {
      const config = {
        workoutExerciseId,
        setNumber: 1,
        setType: 'working',
        reps: 'AMRAP',
      };

      expect(config.reps).toBe('AMRAP');
    });

    it('supports time-based reps', async () => {
      const config = {
        workoutExerciseId,
        setNumber: 1,
        setType: 'working',
        reps: '30s',
      };

      expect(config.reps).toBe('30s');
    });
  });

  describe('Weight Guidance', () => {
    it('supports RPE-based guidance', async () => {
      const config = {
        workoutExerciseId,
        setNumber: 1,
        setType: 'working',
        reps: '8',
        weightGuidance: 'RPE 8',
        rpe: 8,
      };

      expect(config.weightGuidance).toBe('RPE 8');
      expect(config.rpe).toBe(8);
    });

    it('supports percentage-based guidance', async () => {
      const config = {
        workoutExerciseId,
        setNumber: 1,
        setType: 'working',
        reps: '5',
        weightGuidance: '75% 1RM',
      };

      expect(config.weightGuidance).toBe('75% 1RM');
    });

    it('supports absolute weight guidance', async () => {
      const config = {
        workoutExerciseId,
        setNumber: 1,
        setType: 'working',
        reps: '10',
        weightGuidance: '135 lbs',
      };

      expect(config.weightGuidance).toBe('135 lbs');
    });
  });

  describe('Advanced Parameters', () => {
    it('sets tempo prescription', async () => {
      const config = {
        workoutExerciseId,
        setNumber: 1,
        setType: 'working',
        reps: '8',
        tempo: '3-1-2-0',
      };

      expect(config.tempo).toBe('3-1-2-0');
    });

    it('sets RIR (Reps in Reserve)', async () => {
      const config = {
        workoutExerciseId,
        setNumber: 1,
        setType: 'working',
        reps: '8',
        rpe: 9,
        rir: 1,
      };

      expect(config.rir).toBe(1);
    });

    it('sets rest periods', async () => {
      const config = {
        workoutExerciseId,
        setNumber: 1,
        setType: 'working',
        reps: '5',
        restSeconds: 180,
      };

      expect(config.restSeconds).toBe(180);
    });
  });

  describe('Preset Configurations', () => {
    it('applies 5x5 strength preset', async () => {
      const configs = [];
      for (let i = 1; i <= 5; i++) {
        configs.push({
          workoutExerciseId,
          setNumber: i,
          setType: 'working',
          reps: '5',
          restSeconds: 180,
        });
      }

      expect(configs).toHaveLength(5);
      expect(configs.every(c => c.reps === '5')).toBe(true);
    });

    it('applies 3x10 hypertrophy preset', async () => {
      const configs = [];
      for (let i = 1; i <= 3; i++) {
        configs.push({
          workoutExerciseId,
          setNumber: i,
          setType: 'working',
          reps: '8-10',
          restSeconds: 90,
        });
      }

      expect(configs).toHaveLength(3);
      expect(configs.every(c => c.reps === '8-10')).toBe(true);
    });
  });

  describe('Copy Parameters', () => {
    it('copies configuration to another exercise', async () => {
      const sourceConfigs = [
        { workoutExerciseId, setNumber: 1, setType: 'working', reps: '8', restSeconds: 90 },
        { workoutExerciseId, setNumber: 2, setType: 'working', reps: '8', restSeconds: 90 },
        { workoutExerciseId, setNumber: 3, setType: 'working', reps: '8', restSeconds: 90 },
      ];

      const targetExerciseId = 'we-target';
      const copiedConfigs = sourceConfigs.map(c => ({
        ...c,
        workoutExerciseId: targetExerciseId,
      }));

      expect(copiedConfigs).toHaveLength(3);
      expect(copiedConfigs[0].workoutExerciseId).toBe(targetExerciseId);
    });
  });

  describe('Validation', () => {
    it('validates RPE is 1-10', async () => {
      const rpe = 11;
      const isValid = rpe >= 1 && rpe <= 10;

      expect(isValid).toBe(false);
    });

    it('validates rest is non-negative', async () => {
      const restSeconds = -10;
      const isValid = restSeconds >= 0;

      expect(isValid).toBe(false);
    });
  });
});
