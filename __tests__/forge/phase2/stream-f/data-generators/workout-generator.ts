// __tests__/forge/phase2/stream-f/data-generators/workout-generator.ts
export interface WorkoutSet {
  exerciseId: string;
  workoutSessionId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number;
  isPR: boolean;
  notes?: string;
}

export interface WorkoutGeneratorOptions {
  exerciseId: string;
  workoutSessionId: string;
  baseWeight: number;
  numSets: number;
  targetReps: number;
  weekNumber: number;
  dayNumber: number;
}

// Exercise database with standard starting weights
const EXERCISE_BASE_WEIGHTS: Record<string, number> = {
  'ex-bench': 135,
  'ex-squat': 185,
  'ex-deadlift': 225,
  'ex-row': 135,
  'ex-press': 95,
  'ex-curl': 65,
  'ex-extension': 80,
  'ex-fly': 40
};

// Progressive overload: 5-10% increase per week
export function calculateProgressiveOverload(baseWeight: number, weekNumber: number): number {
  const increase = 0.05 + (Math.random() * 0.05); // 5-10%
  const multiplier = 1 + (increase * (weekNumber - 1));
  return Math.round(baseWeight * multiplier / 5) * 5; // Round to nearest 5
}

// RPE progression: Week 1 = 7-8, Week 2 = 8-9
export function calculateRPE(weekNumber: number, setNumber: number): number {
  const baseRPE = weekNumber === 1 ? 7 : 8;
  const setIncrease = setNumber * 0.5;
  return Math.min(10, Math.round(baseRPE + setIncrease));
}

// Detect personal record (simplified)
export function isPersonalRecord(exerciseId: string, weight: number, weekNumber: number): boolean {
  // Week 2+ with higher weight has chance of PR
  if (weekNumber === 1) return false;
  const baseWeight = EXERCISE_BASE_WEIGHTS[exerciseId] || 100;
  const prThreshold = baseWeight * (1 + (weekNumber * 0.08));
  return weight >= prThreshold;
}

export function generateWorkoutSets(options: WorkoutGeneratorOptions): WorkoutSet[] {
  const { exerciseId, workoutSessionId, baseWeight, numSets, targetReps, weekNumber } = options;

  const sets: WorkoutSet[] = [];
  const progressiveWeight = calculateProgressiveOverload(baseWeight, weekNumber);

  for (let i = 1; i <= numSets; i++) {
    // Slight variation in reps (-1 to +2 from target)
    const repVariation = Math.floor(Math.random() * 4) - 1;
    const reps = Math.max(5, targetReps + repVariation);

    // RPE increases with each set
    const rpe = calculateRPE(weekNumber, i - 1);

    // Check for PR on last 2 sets
    const isPR = i > numSets - 2 && isPersonalRecord(exerciseId, progressiveWeight, weekNumber);

    sets.push({
      exerciseId,
      workoutSessionId,
      setNumber: i,
      weight: progressiveWeight,
      reps,
      rpe,
      isPR,
      notes: isPR ? 'New personal record!' : undefined
    });
  }

  return sets;
}

// Generate a complete workout with multiple exercises
export function generateWorkout(
  workoutSessionId: string,
  exerciseIds: string[],
  weekNumber: number,
  dayNumber: number
): WorkoutSet[] {
  const allSets: WorkoutSet[] = [];

  for (const exerciseId of exerciseIds) {
    const baseWeight = EXERCISE_BASE_WEIGHTS[exerciseId] || 100;
    const numSets = dayNumber % 3 === 0 ? 5 : 4; // Occasionally 5 sets

    const sets = generateWorkoutSets({
      exerciseId,
      workoutSessionId,
      baseWeight,
      numSets,
      targetReps: 10,
      weekNumber,
      dayNumber
    });

    allSets.push(...sets);
  }

  return allSets;
}

// Get PRs from a workout
export function getPersonalRecords(sets: WorkoutSet[]): WorkoutSet[] {
  return sets.filter(s => s.isPR);
}
