import {
  computeWorkoutSummary,
  formatMeasurementDeltas,
  computeCssBarHeights,
  computeGoalProgress,
  formatDateRange,
  transformForTemplate,
} from '@/lib/pdf/analyticsPdfData';

describe('analyticsPdfData', () => {
  describe('computeWorkoutSummary', () => {
    const sessions = [
      { status: 'completed', totalDuration: 60, totalVolume: '5000', averageRpe: '7.5', totalSets: 20, completedSets: 18 },
      { status: 'completed', totalDuration: 45, totalVolume: '3500', averageRpe: '8.0', totalSets: 15, completedSets: 15 },
      { status: 'missed', totalDuration: null, totalVolume: null, averageRpe: null, totalSets: 10, completedSets: 0 },
    ];

    it('computes workout summary stats correctly from raw sessions', () => {
      const summary = computeWorkoutSummary(sessions);
      expect(summary.totalWorkouts).toBe(3);
      expect(summary.completedWorkouts).toBe(2);
      expect(summary.completionRate).toBe(67);
      expect(summary.totalDurationMinutes).toBe(105);
      expect(summary.totalVolume).toBe(8500);
      expect(summary.averageRpe).toBe(7.8);
    });

    it('handles empty workout sessions gracefully', () => {
      const summary = computeWorkoutSummary([]);
      expect(summary.totalWorkouts).toBe(0);
      expect(summary.completedWorkouts).toBe(0);
      expect(summary.completionRate).toBe(0);
      expect(summary.totalDurationMinutes).toBe(0);
      expect(summary.totalVolume).toBe(0);
      expect(summary.averageRpe).toBe(0);
    });

    it('wraps all numeric values with Number() — no string .toFixed crashes', () => {
      const stringSessions = [
        { status: 'completed', totalDuration: 60, totalVolume: '12345.67', averageRpe: '6.5', totalSets: 10, completedSets: 10 },
      ];
      const summary = computeWorkoutSummary(stringSessions);
      expect(typeof summary.totalVolume).toBe('number');
      expect(typeof summary.averageRpe).toBe('number');
      expect(() => summary.totalVolume.toFixed(2)).not.toThrow();
      expect(() => summary.averageRpe.toFixed(1)).not.toThrow();
    });
  });

  describe('formatMeasurementDeltas', () => {
    it('formats measurement deltas with correct signs (+/-)', () => {
      const measurements = [
        { weight: 80, bodyFatPercentage: 20, muscleMass: 35, recordedAt: '2026-01-01' },
        { weight: 78, bodyFatPercentage: 18, muscleMass: 36, recordedAt: '2026-03-01' },
      ];
      const deltas = formatMeasurementDeltas(measurements);
      expect(deltas.weight.delta).toBe(-2);
      expect(deltas.weight.direction).toBe('down');
      expect(deltas.bodyFat.delta).toBe(-2);
      expect(deltas.bodyFat.direction).toBe('down');
      expect(deltas.muscleMass.delta).toBe(1);
      expect(deltas.muscleMass.direction).toBe('up');
    });
  });

  describe('computeCssBarHeights', () => {
    it('calculates CSS bar heights as percentages of max value', () => {
      const values = [100, 200, 50, 150];
      const heights = computeCssBarHeights(values);
      expect(heights).toEqual([50, 100, 25, 75]);
    });

    it('handles empty array', () => {
      expect(computeCssBarHeights([])).toEqual([]);
    });

    it('handles all-zero values', () => {
      expect(computeCssBarHeights([0, 0, 0])).toEqual([0, 0, 0]);
    });
  });

  describe('computeGoalProgress', () => {
    it('computes goal progress percentages capped at 100%', () => {
      const goals = [
        { goalType: 'weight_loss', specificGoal: 'Lose 5kg', targetValue: '70', goalProgress: [{ currentValue: '73', percentageComplete: '60' }] },
        { goalType: 'strength', specificGoal: 'Bench 100kg', targetValue: '100', goalProgress: [{ currentValue: '105', percentageComplete: '120' }] },
        { goalType: 'endurance', specificGoal: 'Run 5k', targetValue: null, goalProgress: [] },
      ];
      const progress = computeGoalProgress(goals);
      expect(progress[0].percentage).toBe(60);
      expect(progress[1].percentage).toBe(100); // capped
      expect(progress[2].percentage).toBe(0);
    });
  });

  describe('formatDateRange', () => {
    it('formats date ranges correctly for cover page', () => {
      const result = formatDateRange('2026-01-01', '2026-03-31');
      expect(result).toContain('Jan');
      expect(result).toContain('Mar');
      expect(result).toContain('2026');
    });
  });
});
