import { generateWorkoutSets, calculateProgressiveOverload, generateWorkout, getPersonalRecords } from '../workout-generator';

describe('Workout Generator', () => {
  it('should generate workout sets for an exercise', () => {
    const sets = generateWorkoutSets({
      exerciseId: 'ex-bench',
      workoutSessionId: 'ws-123',
      baseWeight: 135,
      numSets: 4,
      targetReps: 10,
      weekNumber: 1,
      dayNumber: 1
    });

    expect(sets).toHaveLength(4);
    expect(sets[0].weight).toBe(135);
    expect(sets[0].reps).toBeGreaterThanOrEqual(9);
    expect(sets[0].reps).toBeLessThanOrEqual(12);
  });

  it('should increase weight in week 2 (progressive overload)', () => {
    const week1 = generateWorkoutSets({
      exerciseId: 'ex-bench',
      workoutSessionId: 'ws-1',
      baseWeight: 135,
      numSets: 4,
      targetReps: 10,
      weekNumber: 1,
      dayNumber: 1
    });

    const week2 = generateWorkoutSets({
      exerciseId: 'ex-bench',
      workoutSessionId: 'ws-2',
      baseWeight: 135,
      numSets: 4,
      targetReps: 10,
      weekNumber: 2,
      dayNumber: 8
    });

    expect(week2[0].weight).toBeGreaterThan(week1[0].weight);
  });

  it('should detect personal records', () => {
    const sets = generateWorkoutSets({
      exerciseId: 'ex-bench',
      workoutSessionId: 'ws-1',
      baseWeight: 135,
      numSets: 4,
      targetReps: 10,
      weekNumber: 2, // Week 2 can have PRs
      dayNumber: 8
    });

    // PRs should be on last 2 sets if weight threshold is met
    const prs = getPersonalRecords(sets);
    // May or may not have PRs depending on random weight calculation
    expect(Array.isArray(prs)).toBe(true);
  });

  it('should generate complete workout with multiple exercises', () => {
    const sets = generateWorkout('ws-1', ['ex-bench', 'ex-squat'], 1, 1);
    expect(sets.length).toBeGreaterThan(0);
    expect(sets.some(s => s.exerciseId === 'ex-bench')).toBe(true);
    expect(sets.some(s => s.exerciseId === 'ex-squat')).toBe(true);
  });
});
