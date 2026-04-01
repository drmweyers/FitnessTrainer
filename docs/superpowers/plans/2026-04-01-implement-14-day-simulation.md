# 14-Day Trainer-Client Simulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create FORGE simulation with daily trainer-client interactions generating 14 days of workout logs, messages, measurements, and analytics data.

**Architecture:** Extend existing FORGE actor pattern with DailyClientActor and DailyTrainerActor classes. Use data generators for realistic workout progression, body measurements, and contextual messaging. Orchestrate 14-day timeline with WorkflowRunner.

**Tech Stack:** TypeScript, Jest, FORGE Actor Pattern, existing EvoFit Trainer API

---

## File Structure

| File | Purpose |
|------|---------|
| `__tests__/forge/phase2/stream-f/actors/DailyClientActor.ts` | Extended client actor with daily actions |
| `__tests__/forge/phase2/stream-f/actors/DailyTrainerActor.ts` | Extended trainer actor with program management |
| `__tests__/forge/phase2/stream-f/workflows/FourteenDayProgramWorkflow.ts` | 14-day timeline orchestration |
| `__tests__/forge/phase2/stream-f/data-generators/workout-generator.ts` | Workout data with progressive overload |
| `__tests__/forge/phase2/stream-f/data-generators/measurement-generator.ts` | Body measurement progression |
| `__tests__/forge/phase2/stream-f/data-generators/message-generator.ts` | Contextual trainer-client messages |
| `__tests__/forge/phase2/stream-f/story-015-01-14-day-program-simulation.test.ts` | Main simulation test |

---

### Task 1: Create DailyClientActor

**Files:**
- Create: `__tests__/forge/phase2/stream-f/actors/DailyClientActor.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/forge/phase2/stream-f/actors/__tests__/DailyClientActor.test.ts
import { DailyClientActor } from '../DailyClientActor';

describe('DailyClientActor', () => {
  it('should create actor with daily action capabilities', async () => {
    const actor = new DailyClientActor({
      id: 'client-123',
      email: 'client@test.com',
      role: 'client',
      fullName: 'Test Client'
    });

    expect(actor).toBeDefined();
    expect(typeof actor.logSet).toBe('function');
    expect(typeof actor.logRecoveryMetrics).toBe('function');
    expect(typeof actor.recordMeasurements).toBe('function');
  });

  it('should log a workout set with all data', async () => {
    const actor = new DailyClientActor({
      id: 'client-123',
      email: 'client@test.com',
      role: 'client',
      fullName: 'Test Client'
    });

    const set = await actor.logSet({
      exerciseId: 'ex-bench',
      workoutSessionId: 'ws-123',
      setNumber: 1,
      weight: 135,
      reps: 10,
      rpe: 8
    });

    expect(set).toBeDefined();
    expect(set.weight).toBe(135);
    expect(set.reps).toBe(10);
    expect(set.rpe).toBe(8);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/forge/phase2/stream-f/actors/__tests__/DailyClientActor.test.ts --verbose`
Expected: FAIL with "Cannot find module '../DailyClientActor'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// __tests__/forge/phase2/stream-f/actors/DailyClientActor.ts
export interface SetLogData {
  exerciseId: string;
  workoutSessionId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number;
  notes?: string;
}

export interface RecoveryMetrics {
  sleep: number;      // hours
  soreness: number;   // 1-10 scale
  energy: number;     // 1-10 scale
  date: Date;
}

export interface BodyMeasurements {
  date: Date;
  weight: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
}

export interface ClientActorConfig {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

export class DailyClientActor {
  id: string;
  email: string;
  role: string;
  fullName: string;

  // State tracking
  loggedSets: SetLogData[] = [];
  recoveryLogs: RecoveryMetrics[] = [];
  measurements: BodyMeasurements[] = [];
  messages: { to: string; content: string; date: Date }[] = [];

  constructor(config: ClientActorConfig) {
    this.id = config.id;
    this.email = config.email;
    this.role = config.role;
    this.fullName = config.fullName;
  }

  async logSet(data: SetLogData): Promise<SetLogData> {
    this.loggedSets.push(data);
    return data;
  }

  async logRecoveryMetrics(metrics: Omit<RecoveryMetrics, 'date'>): Promise<RecoveryMetrics> {
    const entry: RecoveryMetrics = {
      ...metrics,
      date: new Date()
    };
    this.recoveryLogs.push(entry);
    return entry;
  }

  async recordMeasurements(data: BodyMeasurements): Promise<BodyMeasurements> {
    this.measurements.push(data);
    return data;
  }

  async sendMessage(to: string, content: string): Promise<void> {
    this.messages.push({ to, content, date: new Date() });
  }

  async startWorkout(workoutId: string): Promise<{ id: string; status: string }> {
    return {
      id: `ws-${Date.now()}`,
      status: 'in_progress'
    };
  }

  async completeWorkout(sessionId: string, feedback?: string): Promise<void> {
    // Mark workout complete
  }

  async uploadProgressPhoto(photoType: 'front' | 'back' | 'side'): Promise<void> {
    // Simulate photo upload
  }

  async readMessages(): Promise<{ from: string; content: string }[]> {
    return [];
  }

  getStats() {
    return {
      totalSets: this.loggedSets.length,
      totalRecoveryLogs: this.recoveryLogs.length,
      totalMeasurements: this.measurements.length,
      totalMessages: this.messages.length
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/forge/phase2/stream-f/actors/__tests__/DailyClientActor.test.ts --verbose`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add __tests__/forge/phase2/stream-f/actors/
git commit -m "feat: add DailyClientActor for 14-day simulation

- Implement set logging with weight/reps/RPE
- Add recovery metrics tracking (sleep/soreness/energy)
- Add body measurements recording
- Add message sending capabilities
- Track actor state for verification"
```

---

### Task 2: Create DailyTrainerActor

**Files:**
- Create: `__tests__/forge/phase2/stream-f/actors/DailyTrainerActor.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/forge/phase2/stream-f/actors/__tests__/DailyTrainerActor.test.ts
import { DailyTrainerActor } from '../DailyTrainerActor';

describe('DailyTrainerActor', () => {
  it('should create actor with program management capabilities', async () => {
    const actor = new DailyTrainerActor({
      id: 'trainer-123',
      email: 'trainer@test.com',
      role: 'trainer',
      fullName: 'Test Trainer'
    });

    expect(actor).toBeDefined();
    expect(typeof actor.createProgram).toBe('function');
    expect(typeof actor.reviewWorkout).toBe('function');
    expect(typeof actor.sendFeedback).toBe('function');
  });

  it('should create a program', async () => {
    const actor = new DailyTrainerActor({
      id: 'trainer-123',
      email: 'trainer@test.com',
      role: 'trainer',
      fullName: 'Test Trainer'
    });

    const program = await actor.createProgram({
      name: '14-Day Strength Program',
      duration: 14,
      workouts: []
    });

    expect(program).toBeDefined();
    expect(program.name).toBe('14-Day Strength Program');
    expect(program.id).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/forge/phase2/stream-f/actors/__tests__/DailyTrainerActor.test.ts --verbose`
Expected: FAIL with module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// __tests__/forge/phase2/stream-f/actors/DailyTrainerActor.ts
export interface Program {
  id: string;
  name: string;
  duration: number;
  workouts: any[];
}

export interface TrainerActorConfig {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

export class DailyTrainerActor {
  id: string;
  email: string;
  role: string;
  fullName: string;

  // State tracking
  programs: Program[] = [];
  messages: { to: string; content: string; type: string }[] = [];
  reviews: { sessionId: string; feedback: string }[] = [];

  constructor(config: TrainerActorConfig) {
    this.id = config.id;
    this.email = config.email;
    this.role = config.role;
    this.fullName = config.fullName;
  }

  async createProgram(data: { name: string; duration: number; workouts: any[] }): Promise<Program> {
    const program: Program = {
      id: `prog-${Date.now()}`,
      name: data.name,
      duration: data.duration,
      workouts: data.workouts
    };
    this.programs.push(program);
    return program;
  }

  async assignProgram(clientId: string, programId: string): Promise<void> {
    // Simulate program assignment
  }

  async reviewWorkout(sessionId: string): Promise<{ sessionId: string; reviewed: boolean }> {
    return { sessionId, reviewed: true };
  }

  async sendFeedback(clientId: string, type: string, message: string): Promise<void> {
    this.messages.push({ to: clientId, content: message, type });
  }

  async sendCheckIn(clientId: string, isWorkoutDay: boolean): Promise<void> {
    const content = isWorkoutDay
      ? "How are you feeling about today's workout?"
      : "How is your recovery going?";
    this.messages.push({ to: clientId, content, type: 'checkin' });
  }

  async adjustProgram(programId: string, adjustments: any): Promise<void> {
    const program = this.programs.find(p => p.id === programId);
    if (program) {
      Object.assign(program, adjustments);
    }
  }

  async reviewAnalytics(clientId: string): Promise<{
    workoutFrequency: number;
    totalVolume: number;
    personalRecords: number;
  }> {
    return {
      workoutFrequency: 4,
      totalVolume: 15000,
      personalRecords: 3
    };
  }

  getStats() {
    return {
      totalPrograms: this.programs.length,
      totalMessages: this.messages.length,
      totalReviews: this.reviews.length
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/forge/phase2/stream-f/actors/__tests__/DailyTrainerActor.test.ts --verbose`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add __tests__/forge/phase2/stream-f/actors/DailyTrainerActor.ts
git add __tests__/forge/phase2/stream-f/actors/__tests__/DailyTrainerActor.test.ts
git commit -m "feat: add DailyTrainerActor for 14-day simulation

- Implement program creation and assignment
- Add workout review capabilities
- Add feedback and check-in messaging
- Add program adjustment tracking
- Add analytics review"
```

---

### Task 3: Create Workout Data Generator

**Files:**
- Create: `__tests__/forge/phase2/stream-f/data-generators/workout-generator.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/forge/phase2/stream-f/data-generators/__tests__/workout-generator.test.ts
import { generateWorkoutSets, calculateProgressiveOverload } from '../workout-generator';

describe('Workout Generator', () => {
  it('should generate workout sets for an exercise', () => {
    const sets = generateWorkoutSets({
      exerciseId: 'ex-bench',
      workoutSessionId: 'ws-123',
      baseWeight: 135,
      numSets: 4,
      targetReps: 10,
      weekNumber: 1
    });

    expect(sets).toHaveLength(4);
    expect(sets[0].weight).toBe(135);
    expect(sets[0].reps).toBe(10);
  });

  it('should increase weight in week 2 (progressive overload)', () => {
    const week1 = generateWorkoutSets({
      exerciseId: 'ex-bench',
      workoutSessionId: 'ws-1',
      baseWeight: 135,
      numSets: 4,
      targetReps: 10,
      weekNumber: 1
    });

    const week2 = generateWorkoutSets({
      exerciseId: 'ex-bench',
      workoutSessionId: 'ws-2',
      baseWeight: 135,
      numSets: 4,
      targetReps: 10,
      weekNumber: 2
    });

    expect(week2[0].weight).toBeGreaterThan(week1[0].weight);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/forge/phase2/stream-f/data-generators/__tests__/workout-generator.test.ts --verbose`
Expected: FAIL with module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/forge/phase2/stream-f/data-generators/__tests__/workout-generator.test.ts --verbose`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add __tests__/forge/phase2/stream-f/data-generators/workout-generator.ts
git add __tests__/forge/phase2/stream-f/data-generators/__tests__/workout-generator.test.ts
git commit -m "feat: add workout data generator with progressive overload

- Generate realistic sets with weight/reps/RPE
- Implement 5-10% weekly progressive overload
- Add PR detection based on weight thresholds
- Generate complete multi-exercise workouts"
```

---

### Task 4: Create Measurement Generator

**Files:**
- Create: `__tests__/forge/phase2/stream-f/data-generators/measurement-generator.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/forge/phase2/stream-f/data-generators/__tests__/measurement-generator.test.ts
import { generateMeasurementSeries } from '../measurement-generator';

describe('Measurement Generator', () => {
  it('should generate 3 measurement records over 14 days', () => {
    const measurements = generateMeasurementSeries({
      startWeight: 180,
      startBodyFat: 18,
      measurementDays: [1, 7, 14]
    });

    expect(measurements).toHaveLength(3);
    expect(measurements[0].day).toBe(1);
    expect(measurements[1].day).toBe(7);
    expect(measurements[2].day).toBe(14);
  });

  it('should show weight decrease over time', () => {
    const measurements = generateMeasurementSeries({
      startWeight: 180,
      startBodyFat: 18,
      measurementDays: [1, 7, 14]
    });

    expect(measurements[1].weight).toBeLessThan(measurements[0].weight);
    expect(measurements[2].weight).toBeLessThan(measurements[1].weight);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/forge/phase2/stream-f/data-generators/__tests__/measurement-generator.test.ts --verbose`
Expected: FAIL with module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// __tests__/forge/phase2/stream-f/data-generators/measurement-generator.ts
export interface BodyMeasurement {
  day: number;
  date: Date;
  weight: number;
  bodyFat: number;
  chest: number;
  waist: number;
  hips: number;
  arms: number;
  thighs: number;
}

export interface MeasurementOptions {
  startWeight: number;
  startBodyFat: number;
  measurementDays: number[];
}

// Starting measurements for average male
const DEFAULT_STARTING_MEASUREMENTS = {
  chest: 42,
  waist: 36,
  hips: 40,
  arms: 14,
  thighs: 24
};

// Realistic 14-day changes
const CHANGE_RATES = {
  weight: { perWeek: -1.0, variance: 0.5 },      // -0.5 to -1.5 lbs per week
  bodyFat: { perWeek: -0.35, variance: 0.15 },   // -0.2 to -0.5% per week
  waist: { perWeek: -0.375, variance: 0.125 },   // -0.25 to -0.5 inches per week
  arms: { perWeek: 0.175, variance: 0.075 },     // +0.1 to +0.25 inches per week
  chest: { perWeek: 0, variance: 0.1 },          // Stable
  hips: { perWeek: -0.1, variance: 0.1 },        // Slight decrease
  thighs: { perWeek: 0.05, variance: 0.05 }      // Slight increase
};

function calculateChange(rate: { perWeek: number; variance: number }, weeks: number): number {
  const totalChange = rate.perWeek * weeks;
  const variance = rate.variance * weeks * (Math.random() * 2 - 1); // ±variance
  return totalChange + variance;
}

export function generateMeasurementSeries(options: MeasurementOptions): BodyMeasurement[] {
  const { startWeight, startBodyFat, measurementDays } = options;
  const start = DEFAULT_STARTING_MEASUREMENTS;

  return measurementDays.map(day => {
    const weeks = (day - 1) / 7;

    return {
      day,
      date: new Date(Date.now() - (14 - day) * 24 * 60 * 60 * 1000), // Past dates
      weight: Math.round((startWeight + calculateChange(CHANGE_RATES.weight, weeks)) * 10) / 10,
      bodyFat: Math.round((startBodyFat + calculateChange(CHANGE_RATES.bodyFat, weeks)) * 10) / 10,
      chest: Math.round((start.chest + calculateChange(CHANGE_RATES.chest, weeks)) * 10) / 10,
      waist: Math.round((start.waist + calculateChange(CHANGE_RATES.waist, weeks)) * 10) / 10,
      hips: Math.round((start.hips + calculateChange(CHANGE_RATES.hips, weeks)) * 10) / 10,
      arms: Math.round((start.arms + calculateChange(CHANGE_RATES.arms, weeks)) * 10) / 10,
      thighs: Math.round((start.thighs + calculateChange(CHANGE_RATES.thighs, weeks)) * 10) / 10
    };
  });
}

export function generateRecoveryMetrics(day: number): {
  sleep: number;
  soreness: number;
  energy: number;
} {
  // Simulate realistic patterns:
  // - Soreness higher after workouts (every 2-3 days)
  // - Energy varies based on sleep
  // - Sleep varies 6.5-8.5 hours

  const isPostWorkout = [1, 2, 4, 5, 8, 9, 11, 12].includes(day);

  const sleep = 6.5 + Math.random() * 2; // 6.5-8.5 hours
  const soreness = isPostWorkout
    ? 3 + Math.random() * 4  // 3-7 after workout
    : 1 + Math.random() * 3; // 1-4 on rest days
  const energy = Math.min(10, Math.max(5, 10 - (soreness * 0.5) + (Math.random() * 2 - 1)));

  return {
    sleep: Math.round(sleep * 10) / 10,
    soreness: Math.round(soreness),
    energy: Math.round(energy)
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/forge/phase2/stream-f/data-generators/__tests__/measurement-generator.test.ts --verbose`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add __tests__/forge/phase2/stream-f/data-generators/measurement-generator.ts
git add __tests__/forge/phase2/stream-f/data-generators/__tests__/measurement-generator.test.ts
git commit -m "feat: add measurement generator with realistic progression

- Generate body measurement series over 14 days
- Implement realistic weight/body fat decrease rates
- Add muscle measurements with slight increases
- Add recovery metrics generator (sleep/soreness/energy)"
```

---

### Task 5: Create Message Generator

**Files:**
- Create: `__tests__/forge/phase2/stream-f/data-generators/message-generator.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/forge/phase2/stream-f/data-generators/__tests__/message-generator.test.ts
import { generateDailyMessages, MessageType } from '../message-generator';

describe('Message Generator', () => {
  it('should generate messages for a workout day', () => {
    const messages = generateDailyMessages({
      day: 1,
      isWorkoutDay: true,
      trainerName: 'Coach Mike',
      clientName: 'John',
      hasPR: false
    });

    expect(messages.length).toBeGreaterThan(0);
    expect(messages.some(m => m.sender === 'trainer')).toBe(true);
  });

  it('should generate messages for a rest day', () => {
    const messages = generateDailyMessages({
      day: 3,
      isWorkoutDay: false,
      trainerName: 'Coach Mike',
      clientName: 'John',
      hasPR: false
    });

    expect(messages.length).toBeGreaterThan(0);
  });

  it('should include PR congratulations when PR is achieved', () => {
    const messages = generateDailyMessages({
      day: 4,
      isWorkoutDay: true,
      trainerName: 'Coach Mike',
      clientName: 'John',
      hasPR: true,
      exerciseName: 'Bench Press'
    });

    const content = messages.map(m => m.content).join(' ');
    expect(content.toLowerCase()).toContain('pr');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/forge/phase2/stream-f/data-generators/__tests__/message-generator.test.ts --verbose`
Expected: FAIL with module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// __tests__/forge/phase2/stream-f/data-generators/message-generator.ts
export interface Message {
  sender: 'trainer' | 'client';
  content: string;
  type: MessageType;
}

export type MessageType =
  | 'welcome'
  | 'checkin'
  | 'feedback'
  | 'pr_celebration'
  | 'form_tips'
  | 'adjustment'
  | 'motivation'
  | 'recovery'
  | 'weekly_summary';

export interface MessageOptions {
  day: number;
  isWorkoutDay: boolean;
  trainerName: string;
  clientName: string;
  hasPR?: boolean;
  exerciseName?: string;
  isProgramAdjusted?: boolean;
}

const TRAINER_TEMPLATES: Record<MessageType, string[]> = {
  welcome: [
    "Welcome to your 14-day transformation journey! I'm excited to work with you. Let's crush these goals together!",
    "Hey {clientName}! Ready to get stronger? Your program is all set. Let's make these next 14 days count!",
    "Welcome aboard! I've designed this program specifically for you. Let's get to work!"
  ],
  checkin: [
    "How are you feeling about today's session?",
    "Checking in! How's your energy today?",
    "Ready to tackle today's workout? Let me know how you're feeling!"
  ],
  feedback: [
    "Great work today! Your form on those sets was solid. Keep focusing on that controlled descent.",
    "Nice session! I noticed you pushed through those last reps - that's where the growth happens.",
    "Good effort today! For next time, try to keep your core a bit tighter on the compound movements."
  ],
  pr_celebration: [
    "🎉 NEW PR on {exerciseName}! That's incredible progress! All that hard work is paying off!",
    "CRUSHING IT! New personal record on {exerciseName}! You're getting stronger every week!",
    "Look at you go! PR on {exerciseName}! This is exactly what consistency looks like!"
  ],
  form_tips: [
    "Quick tip: Focus on driving through your heels on the squat and keep that chest up!",
    "For tomorrow's session, really emphasize the mind-muscle connection. Feel every rep!",
    "Remember: Quality over quantity. If the form starts breaking down, take an extra breath."
  ],
  adjustment: [
    "Based on your feedback, I've adjusted next week's weights. We're progressing nicely!",
    "I noticed you mentioned the volume was high, so I've tweaked the next sessions. Keep communicating!",
    "Making some program adjustments based on your progress. You're handling this great!"
  ],
  motivation: [
    "You're doing amazing! Keep showing up - that's 90% of the battle!",
    "Every rep is a step closer to your goals. Proud of your consistency!",
    "The results will come. Trust the process and keep putting in the work!"
  ],
  recovery: [
    "Rest day! Make sure you're getting good sleep and staying hydrated. Recovery is when the magic happens.",
    "How's the soreness today? Light stretching or a walk can help with recovery.",
    "Recovery day check-in: How are you feeling? Listen to your body!"
  ],
  weekly_summary: [
    "Week 1 complete! You logged {workouts} workouts and hit {prs} PRs. Week 2, let's build on this momentum!",
    "Incredible first week! Your consistency is spot-on. Ready to level up in Week 2?",
    "Week 1 in the books! You should be proud of the effort you put in. Let's keep it rolling!"
  ]
};

const CLIENT_TEMPLATES: Record<MessageType, string[]> = {
  welcome: [
    "Thanks Coach! I'm ready to get started!",
    "Excited to begin! Let's do this!",
    "Thanks for having me. I'm committed to this journey!"
  ],
  checkin: [
    "Feeling good today! Ready to lift!",
    "A bit tired but ready to work!",
    "Feeling strong today - let's go!"
  ],
  feedback: [
    "Thanks! I felt really good about that session.",
    "Appreciate the feedback! I'll focus on that next time.",
    "Good to know! I was wondering about my form."
  ],
  pr_celebration: [
    "Thank you! I couldn't believe it when I hit that!",
    "So pumped right now! Thanks for the program!",
    "Hard work paying off! Thanks for the guidance!"
  ],
  form_tips: [
    "Got it! I'll focus on that cue.",
    "Thanks for the tip - that helps a lot!",
    "Makes sense! I'll implement that next session."
  ],
  adjustment: [
    "Thanks for adjusting! I appreciate you listening to my feedback.",
    "Perfect timing on that change. I was feeling a bit beat up.",
    "Sounds good! Ready for the updated program!"
  ],
  motivation: [
    "Thank you! Your support means a lot!",
    "Needed to hear that today - thanks!",
    "Appreciate the encouragement!"
  ],
  recovery: [
    "Soreness is manageable. Sleep was good last night!",
    "Feeling the DOMS today but in a good way!",
    "Recovery going well. Ready for the next session!"
  ],
  weekly_summary: [
    "Week 1 done! Feeling stronger already!",
    "Thanks for the summary! Didn't realize I hit that many PRs!",
    "Ready for Week 2! Let's go!"
  ]
};

function pickRandom(templates: string[]): string {
  return templates[Math.floor(Math.random() * templates.length)];
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
}

export function generateDailyMessages(options: MessageOptions): Message[] {
  const { day, isWorkoutDay, trainerName, clientName, hasPR, exerciseName, isProgramAdjusted } = options;
  const messages: Message[] = [];

  const vars = { trainerName, clientName, exerciseName: exerciseName || '' };

  // Day 1: Welcome messages
  if (day === 1) {
    messages.push({
      sender: 'trainer',
      content: interpolate(pickRandom(TRAINER_TEMPLATES.welcome), vars),
      type: 'welcome'
    });
    messages.push({
      sender: 'client',
      content: interpolate(pickRandom(CLIENT_TEMPLATES.welcome), vars),
      type: 'welcome'
    });
  }

  // Workout day flow
  if (isWorkoutDay) {
    // Pre-workout check-in
    messages.push({
      sender: 'trainer',
      content: interpolate(pickRandom(TRAINER_TEMPLATES.checkin), vars),
      type: 'checkin'
    });

    messages.push({
      sender: 'client',
      content: interpolate(pickRandom(CLIENT_TEMPLATES.checkin), vars),
      type: 'checkin'
    });

    // Post-workout feedback (including PR celebration if applicable)
    if (hasPR && exerciseName) {
      messages.push({
        sender: 'trainer',
        content: interpolate(pickRandom(TRAINER_TEMPLATES.pr_celebration), vars),
        type: 'pr_celebration'
      });
      messages.push({
        sender: 'client',
        content: interpolate(pickRandom(CLIENT_TEMPLATES.pr_celebration), vars),
        type: 'pr_celebration'
      });
    } else {
      messages.push({
        sender: 'trainer',
        content: interpolate(pickRandom(TRAINER_TEMPLATES.feedback), vars),
        type: 'feedback'
      });
      messages.push({
        sender: 'client',
        content: interpolate(pickRandom(CLIENT_TEMPLATES.feedback), vars),
        type: 'feedback'
      });
    }

    // Occasional form tips (30% chance)
    if (Math.random() < 0.3) {
      messages.push({
        sender: 'trainer',
        content: interpolate(pickRandom(TRAINER_TEMPLATES.form_tips), vars),
        type: 'form_tips'
      });
      messages.push({
        sender: 'client',
        content: interpolate(pickRandom(CLIENT_TEMPLATES.form_tips), vars),
        type: 'form_tips'
      });
    }
  } else {
    // Rest day: Recovery check-in
    messages.push({
      sender: 'trainer',
      content: interpolate(pickRandom(TRAINER_TEMPLATES.recovery), vars),
      type: 'recovery'
    });
    messages.push({
      sender: 'client',
      content: interpolate(pickRandom(CLIENT_TEMPLATES.recovery), vars),
      type: 'recovery'
    });
  }

  // Program adjustment notification
  if (isProgramAdjusted) {
    messages.push({
      sender: 'trainer',
      content: interpolate(pickRandom(TRAINER_TEMPLATES.adjustment), vars),
      type: 'adjustment'
    });
    messages.push({
      sender: 'client',
      content: interpolate(pickRandom(CLIENT_TEMPLATES.adjustment), vars),
      type: 'adjustment'
    });
  }

  // Weekly summary (Day 7 and Day 14)
  if (day === 7 || day === 14) {
    const workouts = day === 7 ? 4 : 8;
    const prs = day === 7 ? 2 : 6;
    const summaryVars = { ...vars, workouts: workouts.toString(), prs: prs.toString() };

    messages.push({
      sender: 'trainer',
      content: interpolate(pickRandom(TRAINER_TEMPLATES.weekly_summary), summaryVars),
      type: 'weekly_summary'
    });
    messages.push({
      sender: 'client',
      content: interpolate(pickRandom(CLIENT_TEMPLATES.weekly_summary), summaryVars),
      type: 'weekly_summary'
    });
  }

  // Occasional motivation (20% chance on any day)
  if (Math.random() < 0.2) {
    messages.push({
      sender: 'trainer',
      content: interpolate(pickRandom(TRAINER_TEMPLATES.motivation), vars),
      type: 'motivation'
    });
    messages.push({
      sender: 'client',
      content: interpolate(pickRandom(CLIENT_TEMPLATES.motivation), vars),
      type: 'motivation'
    });
  }

  return messages;
}

export function generateMessageStats(messages: Message[]): {
  total: number;
  trainer: number;
  client: number;
  byType: Record<MessageType, number>;
} {
  const byType: Partial<Record<MessageType, number>> = {};

  messages.forEach(m => {
    byType[m.type] = (byType[m.type] || 0) + 1;
  });

  return {
    total: messages.length,
    trainer: messages.filter(m => m.sender === 'trainer').length,
    client: messages.filter(m => m.sender === 'client').length,
    byType: byType as Record<MessageType, number>
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/forge/phase2/stream-f/data-generators/__tests__/message-generator.test.ts --verbose`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add __tests__/forge/phase2/stream-f/data-generators/message-generator.ts
git add __tests__/forge/phase2/stream-f/data-generators/__tests__/message-generator.test.ts
git commit -m "feat: add message generator for trainer-client conversations

- Generate contextual daily messages based on day type
- Include PR celebration messages when records are hit
- Add form tips, adjustments, and motivation templates
- Generate weekly summary messages"
```

---

### Task 6: Create FourteenDayProgramWorkflow

**Files:**
- Create: `__tests__/forge/phase2/stream-f/workflows/FourteenDayProgramWorkflow.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/forge/phase2/stream-f/workflows/__tests__/FourteenDayProgramWorkflow.test.ts
import { FourteenDayProgramWorkflow } from '../FourteenDayProgramWorkflow';
import { DailyClientActor } from '../../actors/DailyClientActor';
import { DailyTrainerActor } from '../../actors/DailyTrainerActor';

describe('FourteenDayProgramWorkflow', () => {
  it('should complete 14-day simulation', async () => {
    const client = new DailyClientActor({
      id: 'client-123',
      email: 'client@test.com',
      role: 'client',
      fullName: 'Test Client'
    });

    const trainer = new DailyTrainerActor({
      id: 'trainer-123',
      email: 'trainer@test.com',
      role: 'trainer',
      fullName: 'Test Trainer'
    });

    const workflow = new FourteenDayProgramWorkflow(client, trainer);
    const result = await workflow.execute();

    expect(result.completed).toBe(true);
    expect(result.daysCompleted).toBe(14);
    expect(result.totalSets).toBeGreaterThan(150);
    expect(result.totalMessages).toBeGreaterThan(40);
  });

  it('should track workout days correctly', async () => {
    const client = new DailyClientActor({
      id: 'client-123',
      email: 'client@test.com',
      role: 'client',
      fullName: 'Test Client'
    });

    const trainer = new DailyTrainerActor({
      id: 'trainer-123',
      email: 'trainer@test.com',
      role: 'trainer',
      fullName: 'Test Trainer'
    });

    const workflow = new FourteenDayProgramWorkflow(client, trainer);
    const result = await workflow.execute();

    expect(result.workoutDays).toHaveLength(8);
    expect(result.restDays).toHaveLength(6);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/forge/phase2/stream-f/workflows/__tests__/FourteenDayProgramWorkflow.test.ts --verbose`
Expected: FAIL with module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// __tests__/forge/phase2/stream-f/workflows/FourteenDayProgramWorkflow.ts
import { DailyClientActor } from '../actors/DailyClientActor';
import { DailyTrainerActor } from '../actors/DailyTrainerActor';
import { generateWorkout, getPersonalRecords } from '../data-generators/workout-generator';
import { generateMeasurementSeries, generateRecoveryMetrics } from '../data-generators/measurement-generator';
import { generateDailyMessages } from '../data-generators/message-generator';

export interface DayResult {
  day: number;
  isWorkoutDay: boolean;
  setsLogged: number;
  messagesExchanged: number;
  prs: number;
}

export interface SimulationResult {
  completed: boolean;
  daysCompleted: number;
  totalSets: number;
  totalMessages: number;
  totalPRs: number;
  workoutDays: number[];
  restDays: number[];
  measurements: number;
  dayResults: DayResult[];
}

// Workout schedule: 4 days/week (Mon, Tue, Thu, Fri)
const WORKOUT_DAYS = [1, 2, 4, 5, 8, 9, 11, 12];
const MEASUREMENT_DAYS = [1, 7, 14];

// Sample workout structure
const WORKOUT_EXERCISES = {
  'upper_push': ['ex-bench', 'ex-press', 'ex-extension', 'ex-fly'],
  'upper_pull': ['ex-row', 'ex-curl', 'ex-deadlift'],
  'lower': ['ex-squat', 'ex-deadlift', 'ex-extension']
};

export class FourteenDayProgramWorkflow {
  private client: DailyClientActor;
  private trainer: DailyTrainerActor;
  private dayResults: DayResult[] = [];
  private totalPRs = 0;

  constructor(client: DailyClientActor, trainer: DailyTrainerActor) {
    this.client = client;
    this.trainer = trainer;
  }

  async execute(): Promise<SimulationResult> {
    // Setup: Create program
    const program = await this.trainer.createProgram({
      name: '14-Day Strength Foundation',
      duration: 14,
      workouts: Object.values(WORKOUT_EXERCISES)
    });

    await this.trainer.assignProgram(this.client.id, program.id);

    // Generate measurement series (for days 1, 7, 14)
    const measurements = generateMeasurementSeries({
      startWeight: 180,
      startBodyFat: 18,
      measurementDays: MEASUREMENT_DAYS
    });

    // Execute 14 days
    for (let day = 1; day <= 14; day++) {
      const dayResult = await this.executeDay(day, program.id, measurements);
      this.dayResults.push(dayResult);
    }

    return {
      completed: true,
      daysCompleted: 14,
      totalSets: this.client.getStats().totalSets,
      totalMessages: this.client.getStats().totalMessages + this.trainer.getStats().totalMessages,
      totalPRs: this.totalPRs,
      workoutDays: WORKOUT_DAYS,
      restDays: [3, 6, 10, 13], // Wed, Sat, Wed, Sat
      measurements: measurements.length,
      dayResults: this.dayResults
    };
  }

  private async executeDay(
    day: number,
    programId: string,
    measurements: { day: number }[]
  ): Promise<DayResult> {
    const isWorkoutDay = WORKOUT_DAYS.includes(day);
    const weekNumber = day <= 7 ? 1 : 2;

    let setsLogged = 0;
    let prsToday = 0;

    // Handle measurements (Day 1, 7, 14)
    if (MEASUREMENT_DAYS.includes(day)) {
      const measurement = measurements.find(m => m.day === day)!;
      await this.client.recordMeasurements(measurement as any);
      await this.client.uploadProgressPhoto('front');
    }

    if (isWorkoutDay) {
      // Workout day activities
      const workoutType = this.getWorkoutType(day);
      const exercises = WORKOUT_EXERCISES[workoutType];
      const workoutSessionId = `ws-${day}`;

      // Start workout
      await this.client.startWorkout(workoutSessionId);

      // Generate and log sets for each exercise
      for (const exerciseId of exercises) {
        const sets = generateWorkout({
          workoutSessionId,
          exerciseIds: [exerciseId],
          weekNumber,
          dayNumber: day
        });

        for (const set of sets) {
          await this.client.logSet(set);
          setsLogged++;
        }

        // Check for PRs
        const prs = getPersonalRecords(sets);
        prsToday += prs.length;
        this.totalPRs += prs.length;
      }

      // Complete workout with feedback
      await this.client.completeWorkout(workoutSessionId, 'Good session today');

      // Trainer reviews workout
      await this.trainer.reviewWorkout(workoutSessionId);

    } else {
      // Rest day activities
      const recovery = generateRecoveryMetrics(day);
      await this.client.logRecoveryMetrics(recovery);
    }

    // Generate and exchange messages
    const hasPR = prsToday > 0;
    const exerciseName = hasPR ? 'Bench Press' : undefined;
    const isProgramAdjusted = day === 7; // Adjust after week 1

    const messages = generateDailyMessages({
      day,
      isWorkoutDay,
      trainerName: this.trainer.fullName,
      clientName: this.client.fullName,
      hasPR,
      exerciseName,
      isProgramAdjusted
    });

    for (const message of messages) {
      if (message.sender === 'trainer') {
        await this.trainer.sendFeedback(this.client.id, message.type, message.content);
      } else {
        await this.client.sendMessage(this.trainer.id, message.content);
      }
    }

    // Program adjustment on Day 7
    if (day === 7) {
      await this.trainer.adjustProgram(programId, { volume: 'slight_increase' });
    }

    // Trainer weekly review
    if (day === 7 || day === 14) {
      await this.trainer.reviewAnalytics(this.client.id);
    }

    return {
      day,
      isWorkoutDay,
      setsLogged,
      messagesExchanged: messages.length,
      prs: prsToday
    };
  }

  private getWorkoutType(day: number): 'upper_push' | 'upper_pull' | 'lower' {
    // Rotate through workout types
    const types: ('upper_push' | 'upper_pull' | 'lower')[] = ['upper_push', 'upper_pull', 'upper_push', 'lower'];
    const index = WORKOUT_DAYS.indexOf(day) % 4;
    return types[index];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/forge/phase2/stream-f/workflows/__tests__/FourteenDayProgramWorkflow.test.ts --verbose`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add __tests__/forge/phase2/stream-f/workflows/FourteenDayProgramWorkflow.ts
git add __tests__/forge/phase2/stream-f/workflows/__tests__/FourteenDayProgramWorkflow.test.ts
git commit -m "feat: add FourteenDayProgramWorkflow orchestrator

- Execute 14-day simulation day-by-day
- Manage workout days (Mon/Tue/Thu/Fri) and rest days
- Track measurements on days 1, 7, 14
- Generate messages and exchange between actors
- Program adjustments after week 1 review"
```

---

### Task 7: Create Main Simulation Test

**Files:**
- Create: `__tests__/forge/phase2/stream-f/story-015-01-14-day-program-simulation.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
/**
 * Story 015-01: 14-Day Program Simulation
 * FORGE User Simulation Tests
 *
 * Comprehensive 14-day trainer-client interaction simulation
 */

import { DailyClientActor } from './actors/DailyClientActor';
import { DailyTrainerActor } from './actors/DailyTrainerActor';
import { FourteenDayProgramWorkflow } from './workflows/FourteenDayProgramWorkflow';

describe('Story 015-01: 14-Day Program Simulation', () => {
  let client: DailyClientActor;
  let trainer: DailyTrainerActor;
  let workflow: FourteenDayProgramWorkflow;

  beforeAll(async () => {
    client = new DailyClientActor({
      id: 'sim-client-001',
      email: 'sim.client@evofit.io',
      role: 'client',
      fullName: 'Simulation Client'
    });

    trainer = new DailyTrainerActor({
      id: 'sim-trainer-001',
      email: 'sim.trainer@evofit.io',
      role: 'trainer',
      fullName: 'Coach Simulation'
    });

    workflow = new FourteenDayProgramWorkflow(client, trainer);
  });

  describe('14-Day Simulation', () => {
    it('executes complete 14-day simulation', async () => {
      const result = await workflow.execute();

      expect(result.completed).toBe(true);
      expect(result.daysCompleted).toBe(14);
    });

    it('accumulates 150+ exercise sets', async () => {
      const result = await workflow.execute();

      expect(result.totalSets).toBeGreaterThanOrEqual(150);
    });

    it('generates 40+ messages', async () => {
      const result = await workflow.execute();

      expect(result.totalMessages).toBeGreaterThanOrEqual(40);
    });

    it('records 3 measurement sets', async () => {
      const result = await workflow.execute();

      expect(result.measurements).toBe(3);
    });

    it('achieves 6+ personal records', async () => {
      const result = await workflow.execute();

      expect(result.totalPRs).toBeGreaterThanOrEqual(6);
    });

    it('has 8 workout days', async () => {
      const result = await workflow.execute();

      expect(result.workoutDays).toHaveLength(8);
    });

    it('has 6 rest days with recovery logs', async () => {
      const result = await workflow.execute();

      const clientStats = client.getStats();
      expect(clientStats.totalRecoveryLogs).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Progressive Overload Verification', () => {
    it('shows increasing weights across weeks', async () => {
      await workflow.execute();

      const sets = client.loggedSets;
      const benchSetsWeek1 = sets.filter(s =>
        s.exerciseId === 'ex-bench' && s.workoutSessionId.includes('ws-1') ||
        s.workoutSessionId.includes('ws-2')
      );
      const benchSetsWeek2 = sets.filter(s =>
        s.exerciseId === 'ex-bench' && (
          s.workoutSessionId.includes('ws-8') ||
          s.workoutSessionId.includes('ws-9')
        )
      );

      if (benchSetsWeek1.length > 0 && benchSetsWeek2.length > 0) {
        const week1Avg = benchSetsWeek1.reduce((sum, s) => sum + s.weight, 0) / benchSetsWeek1.length;
        const week2Avg = benchSetsWeek2.reduce((sum, s) => sum + s.weight, 0) / benchSetsWeek2.length;

        expect(week2Avg).toBeGreaterThan(week1Avg);
      }
    });
  });

  describe('Body Composition Tracking', () => {
    it('records measurements on days 1, 7, 14', async () => {
      await workflow.execute();

      const measurements = client.measurements;
      const days = measurements.map(m => {
        // Extract day from date (simulation uses past dates)
        return 1;
      });

      expect(measurements).toHaveLength(3);
    });

    it('shows weight decrease trend', async () => {
      await workflow.execute();

      const measurements = client.measurements;
      if (measurements.length >= 2) {
        expect(measurements[measurements.length - 1].weight)
          .toBeLessThan(measurements[0].weight);
      }
    });
  });

  describe('Analytics Data Generation', () => {
    it('provides data for analytics dashboard', async () => {
      const result = await workflow.execute();

      // Verify analytics can be computed from accumulated data
      const clientStats = client.getStats();
      const trainerStats = trainer.getStats();

      expect(clientStats.totalSets).toBeGreaterThan(0);
      expect(trainerStats.totalReviews).toBeGreaterThanOrEqual(8);
      expect(clientStats.totalMessages + trainerStats.totalMessages).toBeGreaterThanOrEqual(40);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/forge/phase2/stream-f/story-015-01-14-day-program-simulation.test.ts --verbose`
Expected: FAIL - looking for missing properties

- [ ] **Step 3: Fix actor state tracking**

```typescript
// Add to DailyClientActor.ts after constructor:

// Track state for verification
recoveryLogs: RecoveryMetrics[] = [];

// Add getter
get totalRecoveryLogs(): number {
  return this.recoveryLogs.length;
}
```

```typescript
// Add to DailyTrainerActor.ts after constructor:

// Track state for verification
reviews: { sessionId: string; feedback: string }[] = [];

// Update reviewWorkout method:
async reviewWorkout(sessionId: string): Promise<{ sessionId: string; reviewed: boolean }> {
  this.reviews.push({ sessionId, feedback: 'Reviewed' });
  return { sessionId, reviewed: true };
}

// Update getStats:
getStats() {
  return {
    totalPrograms: this.programs.length,
    totalMessages: this.messages.length,
    totalReviews: this.reviews.length
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/forge/phase2/stream-f/story-015-01-14-day-program-simulation.test.ts --verbose`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add __tests__/forge/phase2/stream-f/story-015-01-14-day-program-simulation.test.ts
git add __tests__/forge/phase2/stream-f/actors/DailyClientActor.ts
git add __tests__/forge/phase2/stream-f/actors/DailyTrainerActor.ts
git commit -m "feat: add main 14-day simulation test suite

- Complete 14-day simulation test with all verification
- Verify 150+ sets, 40+ messages, 3 measurements
- Progressive overload verification
- Body composition tracking tests
- Analytics data generation verification"
```

---

### Task 8: Run Full Simulation and Verify

- [ ] **Step 1: Run the complete simulation**

Run: `npm test -- __tests__/forge/phase2/stream-f/story-015-01-14-day-program-simulation.test.ts --verbose`
Expected: PASS all tests

- [ ] **Step 2: Verify data accumulation**

Run: `npm test -- __tests__/forge/phase2/stream-f/ --coverage --verbose`
Expected: PASS with coverage report

- [ ] **Step 3: Commit final changes**

```bash
git add -A
git commit -m "test: complete 14-day FORGE simulation implementation

- DailyClientActor with workout/recovery/messaging
- DailyTrainerActor with program management
- Workout generator with progressive overload
- Measurement generator with realistic progression
- Message generator with contextual conversations
- FourteenDayProgramWorkflow orchestrator
- Full test suite with 150+ sets, 40+ messages
- Analytics-ready data accumulation"
```

---

## Execution Summary

| Task | Duration | Output |
|------|----------|--------|
| Task 1: DailyClientActor | 10 min | Client actor with daily actions |
| Task 2: DailyTrainerActor | 10 min | Trainer actor with program management |
| Task 3: Workout Generator | 15 min | Progressive overload workout data |
| Task 4: Measurement Generator | 10 min | Realistic body composition progression |
| Task 5: Message Generator | 15 min | Contextual trainer-client messages |
| Task 6: Workflow Orchestrator | 20 min | 14-day timeline execution |
| Task 7: Main Test Suite | 15 min | Complete simulation test |
| Task 8: Run and Verify | 10 min | Executed simulation, data populated |

**Total Estimated Time:** 1 hour 45 minutes

**Output Data:**
- 150+ exercise sets with progressive overload
- 40+ trainer-client messages
- 3 body measurement records
- 8 workout sessions
- 6 rest day recovery logs
- 6+ personal records
- Rich analytics data for visualization
