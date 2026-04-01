// __tests__/forge/phase2/stream-f/data-generators/workout-generator.ts

// Named constants for workout generation
export const REP_VARIATION_MIN = -1;
export const REP_VARIATION_MAX = 2;
export const REP_VARIATION_RANGE = REP_VARIATION_MAX - REP_VARIATION_MIN + 1; // 4 possible values
export const RPE_CAP = 10;
export const WEIGHT_ROUNDING = 5;
export const PROGRESSIVE_OVERLOAD_MIN = 0.05; // 5%
export const PROGRESSIVE_OVERLOAD_MAX = 0.10; // 10%

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
  seed?: number; // Optional seed for deterministic tests
}

// Simple seeded random number generator (Linear Congruential Generator)
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Returns a random number between 0 and 1 (exclusive of 1)
  next(): number {
    // LCG parameters from Numerical Recipes
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
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

// Get random instance - uses seeded random if seed provided, otherwise Math.random
function getRandom(seed?: number): () => number {
  if (seed !== undefined) {
    const rng = new SeededRandom(seed);
    return () => rng.next();
  }
  return () => Math.random();
}

// Progressive overload: 5-10% increase per week
export function calculateProgressiveOverload(
  baseWeight: number,
  weekNumber: number,
  seed?: number
): number {
  const random = getRandom(seed);
  const increase = PROGRESSIVE_OVERLOAD_MIN + (random() * (PROGRESSIVE_OVERLOAD_MAX - PROGRESSIVE_OVERLOAD_MIN));
  const multiplier = 1 + (increase * (weekNumber - 1));
  return Math.round(baseWeight * multiplier / WEIGHT_ROUNDING) * WEIGHT_ROUNDING; // Round to nearest 5
}

// RPE progression: Week 1 = 7-8, Week 2 = 8-9
export function calculateRPE(weekNumber: number, setNumber: number): number {
  const baseRPE = weekNumber === 1 ? 7 : 8;
  const setIncrease = setNumber * 0.5;
  return Math.min(RPE_CAP, Math.round(baseRPE + setIncrease));
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
  const { exerciseId, workoutSessionId, baseWeight, numSets, targetReps, weekNumber, seed } = options;

  const sets: WorkoutSet[] = [];
  const progressiveWeight = calculateProgressiveOverload(baseWeight, weekNumber, seed);
  const random = getRandom(seed);

  for (let i = 1; i <= numSets; i++) {
    // Slight variation in reps (-1 to +2 from target)
    const repVariation = Math.floor(random() * REP_VARIATION_RANGE) + REP_VARIATION_MIN;
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
  dayNumber: number,
  seed?: number
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
      dayNumber,
      seed
    });

    allSets.push(...sets);
  }

  return allSets;
}

// Get PRs from a workout
export function getPersonalRecords(sets: WorkoutSet[]): WorkoutSet[] {
  return sets.filter(s => s.isPR);
}
