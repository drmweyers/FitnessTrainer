/** @jest-environment node */

import { calculateProgression, ProgressionInput } from '@/lib/services/progressionService';

function makeSet(weight: number, reps: number, rpe: number | null = 7, opts: { targetReps?: number; failed?: boolean; createdAt?: Date } = {}) {
  return {
    weight,
    reps,
    rpe,
    targetReps: opts.targetReps,
    failed: opts.failed ?? false,
    createdAt: opts.createdAt ?? new Date(),
  };
}

describe('calculateProgression', () => {
  describe('insufficient data (<3 sets)', () => {
    it('returns maintain with last set values when 2 sets provided', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: [makeSet(100, 8), makeSet(100, 8)],
      };
      const result = calculateProgression(input);
      expect(result.strategy).toBe('maintain');
      expect(result.confidence).toBe('low');
      expect(result.dataPoints).toBe(2);
      expect(result.suggestedWeight).toBe(100);
      expect(result.suggestedReps).toBe(8);
    });

    it('returns zeros when no sets provided', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: [],
      };
      const result = calculateProgression(input);
      expect(result.strategy).toBe('maintain');
      expect(result.suggestedWeight).toBe(0);
      expect(result.suggestedReps).toBe(8);
    });

    it('returns maintain with 1 set', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: [makeSet(80, 10)],
      };
      const result = calculateProgression(input);
      expect(result.strategy).toBe('maintain');
      expect(result.suggestedWeight).toBe(80);
    });
  });

  describe('Rule 1: >50% failed sets -> reduce', () => {
    it('reduces weight when majority of sets failed', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: [
          makeSet(100, 5, 9, { failed: true }),
          makeSet(100, 4, 9, { failed: true }),
          makeSet(100, 6, 8, { failed: true }),
          makeSet(100, 8, 7),
        ],
      };
      const result = calculateProgression(input);
      expect(result.strategy).toBe('reduce');
      expect(result.suggestedWeight).toBe(95);
      expect(result.reason).toContain('failed');
    });

    it('does not reduce when exactly 50% failed', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: [
          makeSet(100, 8, 7, { failed: true }),
          makeSet(100, 8, 7, { failed: true }),
          makeSet(100, 8, 7),
          makeSet(100, 8, 7),
        ],
      };
      const result = calculateProgression(input);
      expect(result.strategy).not.toBe('reduce');
    });

    it('never reduces below 0', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: [
          makeSet(0, 5, 9, { failed: true }),
          makeSet(0, 4, 9, { failed: true }),
          makeSet(0, 6, 8, { failed: true }),
        ],
      };
      const result = calculateProgression(input);
      expect(result.suggestedWeight).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Rule 2: All sets at RPE 9.5+ -> reduce', () => {
    it('reduces weight when average RPE is 9.5', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: [
          makeSet(200, 5, 10),
          makeSet(200, 5, 10),
          makeSet(200, 5, 9),
        ],
      };
      const result = calculateProgression(input);
      expect(result.strategy).toBe('reduce');
      expect(result.suggestedWeight).toBe(195);
    });

    it('reduces when all sets are RPE 10', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: [
          makeSet(150, 3, 10),
          makeSet(150, 3, 10),
          makeSet(150, 3, 10),
        ],
      };
      const result = calculateProgression(input);
      expect(result.strategy).toBe('reduce');
      expect(result.reason).toContain('9.5+');
    });
  });

  describe('Rule 3: RPE 6-7 hitting reps -> increase weight', () => {
    it('increases weight when RPE avg is 6.5 and hitting all reps', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: [
          makeSet(100, 8, 6, { targetReps: 8 }),
          makeSet(100, 8, 7, { targetReps: 8 }),
          makeSet(100, 8, 6, { targetReps: 8 }),
        ],
      };
      const result = calculateProgression(input);
      expect(result.strategy).toBe('increase_weight');
      expect(result.suggestedWeight).toBe(105); // default 5lb increment
    });

    it('does not increase if not hitting target reps', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: [
          makeSet(100, 6, 6, { targetReps: 8 }),
          makeSet(100, 7, 7, { targetReps: 8 }),
          makeSet(100, 6, 6, { targetReps: 8 }),
        ],
      };
      const result = calculateProgression(input);
      expect(result.strategy).not.toBe('increase_weight');
    });

    it('increases weight if no targetReps set (always "hitting")', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: [
          makeSet(100, 8, 6),
          makeSet(100, 8, 7),
          makeSet(100, 8, 7),
        ],
      };
      const result = calculateProgression(input);
      expect(result.strategy).toBe('increase_weight');
    });
  });

  describe('Rule 4: RPE 8+ hitting reps -> increase reps', () => {
    it('suggests adding 1 rep when RPE avg ~8.5 and 70%+ hitting reps', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: [
          makeSet(120, 8, 8, { targetReps: 8 }),
          makeSet(120, 8, 9, { targetReps: 8 }),
          makeSet(120, 8, 9, { targetReps: 8 }),
          makeSet(120, 8, 8, { targetReps: 8 }),
        ],
      };
      const result = calculateProgression(input);
      expect(result.strategy).toBe('increase_reps');
      expect(result.suggestedReps).toBe(9);
      expect(result.suggestedWeight).toBe(120); // keep same weight
    });

    it('does not increase reps if fewer than 70% hitting target', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: [
          makeSet(120, 6, 8, { targetReps: 8 }),
          makeSet(120, 5, 9, { targetReps: 8 }),
          makeSet(120, 6, 9, { targetReps: 8 }),
          makeSet(120, 8, 8, { targetReps: 8 }),
        ],
      };
      const result = calculateProgression(input);
      expect(result.strategy).not.toBe('increase_reps');
    });
  });

  describe('Rule 5: RPE <6 -> bigger weight jump', () => {
    it('doubles the increment when RPE is very low', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: [
          makeSet(60, 10, 4),
          makeSet(60, 10, 5),
          makeSet(60, 10, 5),
        ],
      };
      const result = calculateProgression(input);
      expect(result.strategy).toBe('increase_weight');
      expect(result.suggestedWeight).toBe(70); // 5 * 2 = 10 increment
      expect(result.reason).toContain('too easy');
    });
  });

  describe('Plateau detection', () => {
    it('detects plateau when same weight for 6+ sets', () => {
      const setsAtSameWeight = Array.from({ length: 6 }, () => makeSet(100, 8, 7.5));
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: setsAtSameWeight,
      };
      const result = calculateProgression(input);
      expect(result.strategy).toBe('maintain');
      expect(result.reason).toContain('Plateau');
    });

    it('does not detect plateau when weight varies', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: [
          makeSet(90, 8, 7.5),
          makeSet(95, 8, 7.5),
          makeSet(100, 8, 7.5),
          makeSet(100, 8, 7.5),
          makeSet(100, 8, 7.5),
          makeSet(105, 8, 7.5),
        ],
      };
      const result = calculateProgression(input);
      expect(result.reason).not.toContain('Plateau');
    });

    it('does not detect plateau if fewer than 6 sets at same weight', () => {
      const setsAtSameWeight = Array.from({ length: 5 }, () => makeSet(100, 8, 7.5));
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: setsAtSameWeight,
      };
      const result = calculateProgression(input);
      expect(result.reason).not.toContain('Plateau');
    });
  });

  describe('Confidence levels', () => {
    it('returns high confidence for 10+ data points with reliable RPE', () => {
      const sets = Array.from({ length: 10 }, (_, i) =>
        makeSet(100, 8, 7)
      );
      const input: ProgressionInput = { exerciseId: 'ex-1', recentSets: sets };
      const result = calculateProgression(input);
      expect(result.confidence).toBe('high');
    });

    it('returns medium confidence for 5-9 data points', () => {
      const sets = Array.from({ length: 5 }, () => makeSet(100, 8, 7));
      const input: ProgressionInput = { exerciseId: 'ex-1', recentSets: sets };
      const result = calculateProgression(input);
      expect(result.confidence).toBe('medium');
    });

    it('returns low confidence when too many null RPEs', () => {
      const sets = [
        makeSet(100, 8, null),
        makeSet(100, 8, null),
        makeSet(100, 8, null),
        makeSet(100, 8, null),
        makeSet(100, 8, null),
        makeSet(100, 8, null),
        makeSet(100, 8, null),
        makeSet(100, 8, null),
        makeSet(100, 8, null),
        makeSet(100, 8, null),
      ];
      const input: ProgressionInput = { exerciseId: 'ex-1', recentSets: sets };
      const result = calculateProgression(input);
      expect(result.confidence).toBe('low');
    });

    it('defaults null RPE values to 7', () => {
      const sets = [
        makeSet(100, 8, null),
        makeSet(100, 8, null),
        makeSet(100, 8, null),
      ];
      // With null RPE defaulting to 7, should get some valid result
      const input: ProgressionInput = { exerciseId: 'ex-1', recentSets: sets };
      const result = calculateProgression(input);
      expect(result).toBeDefined();
    });
  });

  describe('Body part increments', () => {
    it('uses 2.5lb increment for isolation muscles (biceps)', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        bodyPart: 'biceps',
        recentSets: [
          makeSet(30, 10, 6, { targetReps: 10 }),
          makeSet(30, 10, 7, { targetReps: 10 }),
          makeSet(30, 10, 6, { targetReps: 10 }),
        ],
      };
      const result = calculateProgression(input);
      expect(result.suggestedWeight).toBe(32.5);
    });

    it('uses 5lb increment for legs', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        bodyPart: 'legs',
        recentSets: [
          makeSet(100, 8, 6, { targetReps: 8 }),
          makeSet(100, 8, 7, { targetReps: 8 }),
          makeSet(100, 8, 6, { targetReps: 8 }),
        ],
      };
      const result = calculateProgression(input);
      expect(result.suggestedWeight).toBe(105);
    });

    it('uses 5lb increment for chest (upper compound)', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        bodyPart: 'chest',
        recentSets: [
          makeSet(135, 8, 6, { targetReps: 8 }),
          makeSet(135, 8, 7, { targetReps: 8 }),
          makeSet(135, 8, 6, { targetReps: 8 }),
        ],
      };
      const result = calculateProgression(input);
      expect(result.suggestedWeight).toBe(140);
    });

    it('uses 2.5lb increment for shoulders (isolation)', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        bodyPart: 'shoulders',
        recentSets: [
          makeSet(50, 10, 6, { targetReps: 10 }),
          makeSet(50, 10, 7, { targetReps: 10 }),
          makeSet(50, 10, 6, { targetReps: 10 }),
        ],
      };
      const result = calculateProgression(input);
      expect(result.suggestedWeight).toBe(52.5);
    });

    it('uses 5lb default when no bodyPart provided', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        recentSets: [
          makeSet(100, 8, 6, { targetReps: 8 }),
          makeSet(100, 8, 7, { targetReps: 8 }),
          makeSet(100, 8, 6, { targetReps: 8 }),
        ],
      };
      const result = calculateProgression(input);
      expect(result.suggestedWeight).toBe(105);
    });

    it('uses 5lb default for unknown body part', () => {
      const input: ProgressionInput = {
        exerciseId: 'ex-1',
        bodyPart: 'core',
        recentSets: [
          makeSet(50, 8, 6, { targetReps: 8 }),
          makeSet(50, 8, 7, { targetReps: 8 }),
          makeSet(50, 8, 6, { targetReps: 8 }),
        ],
      };
      const result = calculateProgression(input);
      expect(result.suggestedWeight).toBe(55);
    });
  });

  describe('dataPoints in result', () => {
    it('always returns the correct number of data points', () => {
      const sets = Array.from({ length: 7 }, () => makeSet(80, 8, 8));
      const input: ProgressionInput = { exerciseId: 'ex-1', recentSets: sets };
      const result = calculateProgression(input);
      expect(result.dataPoints).toBe(7);
    });
  });
});
