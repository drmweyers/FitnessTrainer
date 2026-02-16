import { calculateWorkoutStreaks } from '../streakCalculator';

describe('calculateWorkoutStreaks', () => {
  it('returns zero streaks for empty array', () => {
    const result = calculateWorkoutStreaks([]);
    expect(result).toEqual({ currentStreak: 0, bestStreak: 0 });
  });

  it('calculates current streak for consecutive days ending today', () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const result = calculateWorkoutStreaks([today, yesterday, twoDaysAgo]);
    expect(result.currentStreak).toBe(3);
    expect(result.bestStreak).toBe(3);
  });

  it('calculates current streak for consecutive days ending yesterday', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const result = calculateWorkoutStreaks([yesterday, twoDaysAgo, threeDaysAgo]);
    expect(result.currentStreak).toBe(3);
    expect(result.bestStreak).toBe(3);
  });

  it('returns zero current streak when last workout was 2+ days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();

    const result = calculateWorkoutStreaks([threeDaysAgo, fourDaysAgo]);
    expect(result.currentStreak).toBe(0);
    expect(result.bestStreak).toBe(2);
  });

  it('calculates best streak from past sequences', () => {
    const dates = [
      new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
      new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
      new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 5-day streak
    ];

    const result = calculateWorkoutStreaks(dates);
    expect(result.currentStreak).toBe(0);
    expect(result.bestStreak).toBe(5);
  });

  it('handles duplicate dates (same day multiple workouts)', () => {
    const today = new Date().toISOString();
    const todayDupe = new Date().toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const result = calculateWorkoutStreaks([today, todayDupe, yesterday]);
    expect(result.currentStreak).toBe(2);
    expect(result.bestStreak).toBe(2);
  });

  it('handles non-consecutive dates', () => {
    const today = new Date().toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    const result = calculateWorkoutStreaks([today, threeDaysAgo, fiveDaysAgo]);
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(1);
  });
});
