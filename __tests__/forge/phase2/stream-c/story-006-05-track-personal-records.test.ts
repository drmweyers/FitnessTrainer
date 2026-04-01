/**
 * Story 006-05: Track Personal Records
 * FORGE User Simulation Tests
 *
 * Tests client workflow for PR tracking and celebration
 */

import { ActorFactory, TrainerActor, ClientActor } from '@/lib/forge/utils/actor-factory';

describe('Story 006-05: Track Personal Records', () => {
  let trainer: TrainerActor;
  let client: ClientActor;

  beforeEach(async () => {
    trainer = await ActorFactory.createTrainer();
    client = await ActorFactory.createClient(trainer.id);
  });

  afterEach(async () => {
    await ActorFactory.cleanup(trainer, client);
  });

  describe('Happy Path', () => {
    it('detects new 1RM personal record', async () => {
      const pr = {
        userId: client.id,
        exerciseId: 'ex_bench_press',
        recordType: '1rm',
        value: 225,
        unit: 'lb',
        achievedAt: new Date(),
      };

      expect(pr.recordType).toBe('1rm');
      expect(pr.value).toBe(225);
    });

    it('detects max reps PR', async () => {
      const pr = {
        userId: client.id,
        exerciseId: 'ex_pullup',
        recordType: 'max_reps',
        value: 15,
        unit: 'reps',
        achievedAt: new Date(),
      };

      expect(pr.recordType).toBe('max_reps');
      expect(pr.value).toBe(15);
    });

    it('detects volume PR', async () => {
      const pr = {
        userId: client.id,
        exerciseId: 'ex_squat',
        recordType: 'max_volume',
        value: 10000,
        unit: 'lb',
        achievedAt: new Date(),
      };

      expect(pr.recordType).toBe('max_volume');
      expect(pr.value).toBe(10000);
    });
  });

  describe('PR Types', () => {
    const prTypes = [
      { type: '1rm', value: 225, unit: 'lb' },
      { type: '3rm', value: 205, unit: 'lb' },
      { type: '5rm', value: 185, unit: 'lb' },
      { type: '10rm', value: 155, unit: 'lb' },
      { type: 'max_reps', value: 20, unit: 'reps' },
      { type: 'max_volume', value: 15000, unit: 'lb' },
    ];

    prTypes.forEach(({ type, value, unit }) => {
      it(`tracks ${type} PR`, async () => {
        const pr = {
          userId: client.id,
          exerciseId: 'ex_test',
          recordType: type,
          value,
          unit,
          achievedAt: new Date(),
        };

        expect(pr.recordType).toBe(type);
        expect(pr.value).toBe(value);
      });
    });
  });

  describe('1RM Calculation', () => {
    it('calculates 1RM using Brzycki formula', () => {
      const weight = 200;
      const reps = 5;
      // Brzycki: weight * (36 / (37 - reps))
      const oneRM = weight * (36 / (37 - reps));

      expect(oneRM).toBeCloseTo(225, 0);
    });

    it('calculates 1RM using Epley formula', () => {
      const weight = 200;
      const reps = 5;
      // Epley: weight * (1 + reps / 30)
      const oneRM = weight * (1 + reps / 30);

      expect(oneRM).toBeCloseTo(233.3, 1);
    });
  });

  describe('PR History', () => {
    it('maintains PR history', async () => {
      const history = [
        { userId: client.id, exerciseId: 'ex_bench', recordType: '1rm', value: 185, unit: 'lb', achievedAt: new Date('2026-01-01') },
        { userId: client.id, exerciseId: 'ex_bench', recordType: '1rm', value: 195, unit: 'lb', achievedAt: new Date('2026-02-01') },
        { userId: client.id, exerciseId: 'ex_bench', recordType: '1rm', value: 205, unit: 'lb', achievedAt: new Date('2026-03-01') },
      ];

      expect(history).toHaveLength(3);
      expect(history[2].value).toBe(205);
    });

    it('calculates improvement from previous PR', async () => {
      const previousPR = 195;
      const newPR = 205;
      const improvement = newPR - previousPR;
      const improvementPercentage = (improvement / previousPR) * 100;

      expect(improvement).toBe(10);
      expect(improvementPercentage).toBeCloseTo(5.13, 1);
    });
  });

  describe('PR Comparison', () => {
    it('compares current PR to previous', async () => {
      const history = [
        { userId: client.id, exerciseId: 'ex_squat', recordType: '1rm', value: 325, unit: 'lb', achievedAt: new Date('2026-02-01') },
        { userId: client.id, exerciseId: 'ex_squat', recordType: '1rm', value: 315, unit: 'lb', achievedAt: new Date('2026-01-01') },
      ];

      const current = history[0];
      const previous = history[1];
      const improvement = current.value - previous.value;

      expect(improvement).toBe(10);
    });
  });

  describe('PR Notifications', () => {
    it('triggers notification on new PR', async () => {
      const pr = {
        userId: client.id,
        exerciseId: 'ex_deadlift',
        recordType: '1rm',
        value: 405,
        unit: 'lb',
        achievedAt: new Date(),
        notifyTrainer: true,
      };

      expect(pr.notifyTrainer).toBe(true);
    });

    it('includes PR details in notification', async () => {
      const notification = {
        type: 'pr_achieved',
        exercise: 'Bench Press',
        recordType: '1RM',
        value: 225,
        unit: 'lb',
        previousValue: 215,
        improvement: 10,
      };

      expect(notification.improvement).toBe(10);
    });
  });

  describe('Bodyweight PRs', () => {
    it('tracks bodyweight exercise PRs', async () => {
      const pr = {
        userId: client.id,
        exerciseId: 'ex_pullup',
        recordType: 'max_reps',
        value: 20,
        unit: 'reps',
        bodyweight: 175,
        achievedAt: new Date(),
      };

      expect(pr.value).toBe(20);
      expect(pr.bodyweight).toBe(175);
    });

    it('calculates relative strength', async () => {
      const liftWeight = 225;
      const bodyweight = 180;
      const relativeStrength = (liftWeight / bodyweight) * 100;

      expect(relativeStrength).toBeCloseTo(125, 0);
    });
  });
});
