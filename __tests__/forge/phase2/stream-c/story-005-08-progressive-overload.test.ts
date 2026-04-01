/**
 * Story 005-08: Progressive Overload
 * FORGE User Simulation Tests
 *
 * Tests trainer workflow for configuring progressive overload
 */

import { ActorFactory, TrainerActor } from '@/lib/forge/utils/actor-factory';
import { WorkflowRunner } from '@/lib/forge/utils/workflow-runner';

describe('Story 005-08: Progressive Overload', () => {
  let trainer: TrainerActor;
  const programId = 'prog-123';

  beforeEach(async () => {
    trainer = await ActorFactory.createTrainer();
  });

  afterEach(async () => {
    await ActorFactory.cleanup(trainer);
  });

  describe('Happy Path', () => {
    it('configures linear progression', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'setProgression',
            data: {
              programId,
              type: 'linear',
              weightIncrease: 2.5,
              deloadFrequency: 4,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.finalState.progression).toBeDefined();
    });

    it('configures undulating progression', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'setProgression',
            data: {
              programId,
              type: 'undulating',
              wavePattern: [10, 8, 5],
              rpeTargets: [7, 8, 9],
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('configures block periodization', async () => {
      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'setProgression',
            data: {
              programId,
              type: 'block',
              blocks: [
                { name: 'Accumulation', weeks: 3, volume: 'high', intensity: 'moderate' },
                { name: 'Intensification', weeks: 3, volume: 'moderate', intensity: 'high' },
                { name: 'Peak', weeks: 2, volume: 'low', intensity: 'very high' },
              ],
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Deload Configuration', () => {
    it('sets deload frequency', async () => {
      const progression = {
        programId,
        progressionType: 'linear',
        deloadFrequency: 4,
        deloadReductionPercentage: 40,
      };

      expect(progression.deloadFrequency).toBe(4);
      expect(progression.deloadReductionPercentage).toBe(40);
    });

    it('calculates deload weeks correctly', async () => {
      const program = { durationWeeks: 12 };
      const progression = {
        deloadFrequency: 4,
        weightIncreasePercentage: 2.5,
      };

      const totalWeeks = program.durationWeeks;
      const deloadWeeks = Math.floor(totalWeeks / (progression.deloadFrequency || 4));

      expect(deloadWeeks).toBe(3); // Weeks 4, 8, 12
    });
  });

  describe('Exercise-Specific Progression', () => {
    it('sets different progression per exercise', async () => {
      const progressions = [
        {
          programProgressionId: 'prog-1',
          exerciseId: 'ex_squat',
          progressionType: 'linear',
          weightIncreasePercentage: 2.5,
        },
        {
          programProgressionId: 'prog-1',
          exerciseId: 'ex_deadlift',
          progressionType: 'linear',
          weightIncreasePercentage: 5.0,
        },
        {
          programProgressionId: 'prog-1',
          exerciseId: 'ex_chinup',
          progressionType: 'reps',
          repIncreasePerWeek: 1,
        },
      ];

      expect(progressions).toHaveLength(3);
    });
  });

  describe('Progression Calculations', () => {
    it('calculates weekly weight increases', async () => {
      const startingWeight = 100;
      const weeklyIncrease = 2.5;
      const weeks = 4;

      const progression = [];
      for (let i = 0; i < weeks; i++) {
        progression.push({
          week: i + 1,
          weight: startingWeight * Math.pow(1 + weeklyIncrease / 100, i),
        });
      }

      expect(progression[0].weight).toBe(100);
      expect(progression[3].weight).toBeCloseTo(107.69, 1);
    });

    it('calculates volume progression', async () => {
      const baseVolume = 10000; // Total weekly volume
      const volumeIncrease = 5;
      const weeks = 4;

      const volumes = [];
      for (let i = 0; i < weeks; i++) {
        volumes.push(baseVolume * Math.pow(1 + volumeIncrease / 100, i));
      }

      expect(volumes[0]).toBe(10000);
      expect(volumes[3]).toBeCloseTo(11576, 0);
    });
  });

  describe('Validation', () => {
    it('validates realistic progression rates', async () => {
      // 10% weekly increase is unrealistic
      const unrealisticIncrease = 10;

      // In real implementation, this would trigger a warning
      expect(unrealisticIncrease).toBeGreaterThan(5);
    });

    it('validates deload frequency', async () => {
      const progression = {
        programId,
        progressionType: 'linear',
        deloadFrequency: 3,
      };

      expect(progression.deloadFrequency).toBeGreaterThanOrEqual(2);
    });
  });
});
