---
name: user-simulation
description: Actor-based user simulation testing for multi-role platforms. Includes FORGE methodology, 14-day progressive simulations, daily actor interactions, and QA automation patterns. Use for comprehensive end-to-end testing, multi-role workflows, and realistic data generation over time.
---

# User Simulation Skill (FORGE Methodology)

This skill provides the **FORGE** (Fidelity-Oriented Regression & Growth Engine) actor-based testing framework for simulating realistic user workflows on multi-role platforms.

## Overview

FORGE enables:
- **Multi-actor simulations** (admin/user, trainer/client, etc.)
- **Time-based progressive testing** (daily interactions over 14+ days)
- **Realistic data generation** with progressive overload, body composition tracking
- **Daily messaging workflows** between actors
- **GUI automation integration** (Playwright + actors)
- **Race condition and resilience testing**

---

## Quick Start: 14-Day Simulation Pattern

The flagship pattern - simulates 14 days of daily trainer-client interactions:

```typescript
// __tests__/forge/14-day-simulation.test.ts
import { DailyClientActor } from './actors/DailyClientActor';
import { DailyTrainerActor } from './actors/DailyTrainerActor';
import { FourteenDayProgramWorkflow } from './workflows/FourteenDayProgramWorkflow';

describe('14-Day Program Simulation', () => {
  it('completes full 14-day journey', async () => {
    const client = new DailyClientActor({
      id: 'client-001',
      email: 'client@test.com',
      role: 'client',
      fullName: 'Test Client'
    });

    const trainer = new DailyTrainerActor({
      id: 'trainer-001',
      email: 'trainer@test.com',
      role: 'trainer',
      fullName: 'Coach Test'
    });

    const workflow = new FourteenDayProgramWorkflow(client, trainer);
    const result = await workflow.execute();

    expect(result.completed).toBe(true);
    expect(result.totalSets).toBeGreaterThanOrEqual(100);
    expect(result.totalMessages).toBeGreaterThanOrEqual(40);
    expect(result.measurements).toBe(3);
  });
});
```

---

## Core Components

### 1. DailyClientActor

Extends base `Actor` with daily interaction capabilities for clients.

**Location:** `__tests__/forge/actors/DailyClientActor.ts`

**Actions:**
```typescript
class DailyClientActor extends Actor {
  async startWorkout(workoutId: string): Promise<WorkoutSession>
  async logSet(setData: SetLogData): Promise<void>
  async completeWorkout(workoutId: string, feedback?: string): Promise<void>
  async logRecoveryMetrics(metrics: RecoveryMetrics): Promise<void>
  async recordMeasurements(data: BodyMeasurements): Promise<void>
  async uploadProgressPhoto(photoType: string): Promise<void>
  async sendMessage(to: string, content: string): Promise<void>
  async readMessages(): Promise<Message[]>
  getStats(): ClientStats
}
```

**State Tracking:**
- `loggedSets`: All exercise sets with weight/reps/RPE
- `recoveryLogs`: Daily recovery metrics (sleep, soreness, energy)
- `measurements`: Body composition records
- `messages`: Communication history
- `workouts`: Started/completed workouts

### 2. DailyTrainerActor

Extends base `Actor` with program management capabilities for trainers.

**Location:** `__tests__/forge/actors/DailyTrainerActor.ts`

**Actions:**
```typescript
class DailyTrainerActor extends Actor {
  async createProgram(config: ProgramConfig): Promise<Program>
  async assignProgram(clientId: string, programId: string): Promise<void>
  async reviewWorkout(sessionId: string): Promise<void>
  async sendFeedback(clientId: string, type: string, message: string): Promise<void>
  async adjustProgram(programId: string, adjustments: any): Promise<void>
  async reviewAnalytics(clientId: string): Promise<Analytics>
  async sendCheckIn(clientId: string, isWorkoutDay: boolean): Promise<void>
  async respondToClient(messageId: string, content: string): Promise<void>
  getStats(): TrainerStats
}
```

### 3. Data Generators

Realistic data generation with deterministic seeds.

**Workout Generator:**
```typescript
// __tests__/forge/data-generators/workout-generator.ts
import { generateWorkout, getPersonalRecords, SeededRandom } from './workout-generator';

const sets = generateWorkout(
  workoutSessionId: 'ws-1',
  exerciseIds: ['ex-bench', 'ex-squat'],
  weekNumber: 1,  // Progressive overload based on week
  day: 1,
  seed: 12345     // Deterministic for reproducible tests
);

const prs = getPersonalRecords(sets); // Detect PRs automatically
```

**Measurement Generator:**
```typescript
// __tests__/forge/data-generators/measurement-generator.ts
import { generateMeasurementSeries, generateRecoveryMetrics } from './measurement-generator';

const measurements = generateMeasurementSeries({
  startWeight: 180,
  startBodyFat: 18,
  measurementDays: [1, 7, 14]
});
// Generates: Day 1 (180 lbs, 18% BF) → Day 7 (179.5 lbs, 17.7%) → Day 14 (178 lbs, 17.2%)

const recovery = generateRecoveryMetrics(day);
// { sleep: 7.5, soreness: 3, energy: 8, notes: '...' }
```

**Message Generator:**
```typescript
// __tests__/forge/data-generators/message-generator.ts
import { generateDailyMessages } from './message-generator';

const messages = generateDailyMessages({
  day: 4,
  isWorkoutDay: true,
  trainerName: 'Coach Mike',
  clientName: 'Alex',
  hasPR: true,
  exerciseName: 'Bench Press',
  isProgramAdjusted: false
});
// Returns contextual messages based on the situation
```

### 4. FourteenDayProgramWorkflow

Orchestrates the full 14-day simulation.

**Location:** `__tests__/forge/workflows/FourteenDayProgramWorkflow.ts`

**Schedule:**
| Day | Type | Activities |
|-----|------|------------|
| 1 | Workout + Measurements | Start program, log 16 sets, 3 photos, 6 messages |
| 2 | Workout | Log 12 sets, 4 messages |
| 3 | Rest | Recovery log (sleep/soreness/energy), 2 messages |
| 4 | Workout | Log 16 sets, 4 messages |
| 5 | Workout | Log 12 sets, 4 messages |
| 6 | Rest | Recovery log, 2 messages |
| 7 | Rest + Measurements | Body comp, program adjustment, 6 messages |
| 8-14 | (repeats Week 2 pattern) | Progressive overload continues |

---

## QA Simulation Methodology

### Pattern 1: Progressive Data Accumulation

Use for testing analytics dashboards and time-series visualizations:

```typescript
// Generate 4 weeks of data for rich analytics
describe('Analytics Dashboard QA', () => {
  it('accumulates 4 weeks of client data', async () => {
    const weeks = 4;
    const allData: DayResult[] = [];

    for (let week = 1; week <= weeks; week++) {
      const result = await runWeekSimulation(week, client, trainer);
      allData.push(...result.dayResults);

      // Verify analytics after each week
      const analytics = await trainer.reviewAnalytics(client.id);
      expect(analytics.workoutFrequency).toHaveLength(week * 7);
    }

    // Final verification
    expect(allData.filter(d => d.isWorkoutDay).length).toBe(weeks * 4);
  });
});
```

### Pattern 2: GUI + Actor Hybrid Testing

Combine Playwright for UI with actors for state validation:

```typescript
// E2E test with actor state verification
describe('Program Builder GUI', () => {
  it('trainer creates program through UI, client sees it', async () => {
    // Actor setup
    const trainer = await ActorFactory.createActor('trainer');
    const client = await ActorFactory.createActor('client');

    // Playwright: Trainer creates program via UI
    await page.goto('/dashboard/programs/builder');
    await page.fill('[name="programName"]', 'Test Program');
    await page.click('button:has-text("Create")');

    // Actor: Verify program exists via API
    const programs = await trainer.getPrograms();
    expect(programs).toHaveLength(1);

    // Actor: Assign to client
    await trainer.assignProgram(client.id, programs[0].id);

    // Playwright: Client sees program in dashboard
    await clientPage.goto('/dashboard/programs');
    await expect(clientPage.locator('text=Test Program')).toBeVisible();
  });
});
```

### Pattern 3: Daily Interaction Regression

Verify daily workflows don't break over time:

```typescript
describe('Daily Interaction Regression', () => {
  for (let day = 1; day <= 14; day++) {
    it(`Day ${day}: completes without errors`, async () => {
      const result = await runDaySimulation(day, trainer, client);
      expect(result.errors).toHaveLength(0);
      expect(result.completed).toBe(true);
    });
  }
});
```

### Pattern 4: Modal and Form Testing

Test all GUI elements systematically:

```typescript
describe('GUI Elements - Program Builder', () => {
  it('opens exercise selector modal', async () => {
    await page.click('button:has-text("Add Exercise")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Exercise Library')).toBeVisible();
  });

  it('searches exercises in modal', async () => {
    await page.fill('[placeholder="Search exercises..."]', 'bench press');
    await expect(page.locator('text=Bench Press')).toBeVisible();
  });

  it('adds exercise from modal to program', async () => {
    await page.click('text=Bench Press');
    await page.click('button:has-text("Add to Program")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('text=Bench Press')).toBeVisible();
  });
});
```

---

## Bug Detection Patterns

### Pattern 1: State Consistency Checks

Detect data integrity issues:

```typescript
it('maintains consistent state across actors', async () => {
  // Client logs workout
  await client.startWorkout('ws-1');
  await client.logSet({ exerciseId: 'ex-1', weight: 135, reps: 10 });
  await client.completeWorkout('ws-1');

  // Trainer reviews same workout
  const review = await trainer.reviewWorkout('ws-1');

  // Verify data consistency
  expect(review.sets).toHaveLength(1);
  expect(review.sets[0].weight).toBe(135);
  expect(review.completed).toBe(true);
});
```

### Pattern 2: Race Condition Detection

Find timing-related bugs:

```typescript
it('handles concurrent workout logging', async () => {
  const client2 = await ActorFactory.createActor('client');

  // Both clients try to log sets simultaneously
  const results = await Promise.allSettled([
    client.logSet({ workoutSessionId: 'ws-1', ... }),
    client2.logSet({ workoutSessionId: 'ws-1', ... }),
  ]);

  // Should either succeed with isolation or fail gracefully
  const hasErrors = results.some(r => r.status === 'rejected');
  expect(hasErrors).toBe(false);
});
```

### Pattern 3: Data Boundary Testing

Test edge cases in data generators:

```typescript
it('handles extreme measurement values', async () => {
  const measurements = generateMeasurementSeries({
    startWeight: 500,  // Unusually high
    startBodyFat: 50,  // Unusually high
    measurementDays: [1, 7, 14]
  });

  // Verify calculations don't break
  expect(measurements[0].weight).toBe(500);
  expect(measurements[2].weight).toBeLessThan(500);
});
```

---

## Complete Test Suite Example

```typescript
// __tests__/forge/comprehensive-simulation.test.ts
describe('FORGE Comprehensive QA Suite', () => {
  let trainer: DailyTrainerActor;
  let client: DailyClientActor;

  beforeEach(async () => {
    trainer = new DailyTrainerActor({ /* config */ });
    client = new DailyClientActor({ /* config */ });
  });

  describe('Daily Actors', () => {
    it('client logs complete workout', async () => {
      await client.startWorkout('ws-1');
      await client.logSet({ exerciseId: 'ex-1', weight: 135, reps: 10, rpe: 8 });
      await client.completeWorkout('ws-1', 'Good session');

      expect(client.getStats().totalWorkouts).toBe(1);
      expect(client.getStats().totalSets).toBe(1);
    });

    it('trainer manages program lifecycle', async () => {
      const program = await trainer.createProgram({ name: 'Test', duration: 14 });
      await trainer.assignProgram(client.id, program.id);
      await trainer.adjustProgram(program.id, { name: 'Test (Adjusted)' });

      expect(trainer.getStats().totalPrograms).toBe(1);
      expect(trainer.getStats().totalAdjustments).toBe(1);
    });
  });

  describe('14-Day Simulation', () => {
    it('generates realistic data over time', async () => {
      const workflow = new FourteenDayProgramWorkflow(client, trainer);
      const result = await workflow.execute();

      // Data volume checks
      expect(result.totalSets).toBeGreaterThanOrEqual(100);
      expect(result.totalMessages).toBeGreaterThanOrEqual(40);

      // Progressive overload verification
      const week1Sets = client.loggedSets.filter(s =>
        parseInt(s.workoutSessionId.split('-')[1]) <= 7
      );
      const week2Sets = client.loggedSets.filter(s =>
        parseInt(s.workoutSessionId.split('-')[1]) > 7
      );

      const w1Avg = week1Sets.reduce((sum, s) => sum + s.weight, 0) / week1Sets.length;
      const w2Avg = week2Sets.reduce((sum, s) => sum + s.weight, 0) / week2Sets.length;

      expect(w2Avg).toBeGreaterThan(w1Avg); // Progressive overload confirmed
    });
  });

  describe('Data Generators', () => {
    it('workout generator creates realistic sets', () => {
      const sets = generateWorkout('ws-1', ['ex-bench'], 1, 1, 12345);

      expect(sets).toHaveLength(4); // 4 sets per exercise
      sets.forEach(set => {
        expect(set.weight).toBeGreaterThan(0);
        expect(set.reps).toBeGreaterThanOrEqual(5);
        expect(set.reps).toBeLessThanOrEqual(12);
        expect(set.rpe).toBeGreaterThanOrEqual(1);
        expect(set.rpe).toBeLessThanOrEqual(10);
      });
    });

    it('measurement generator shows realistic changes', () => {
      const measurements = generateMeasurementSeries({
        startWeight: 180,
        startBodyFat: 18,
        measurementDays: [1, 7, 14]
      });

      expect(measurements).toHaveLength(3);
      expect(measurements[2].weight).toBeLessThan(measurements[0].weight);
      expect(measurements[2].bodyFat).toBeLessThan(measurements[0].bodyFat);
    });
  });
});
```

---

## File Structure Template

```
__tests__/forge/
├── actors/
│   ├── DailyClientActor.ts           # Client daily actions
│   ├── DailyTrainerActor.ts          # Trainer program management
│   └── __tests__/
│       ├── DailyClientActor.test.ts  # Actor unit tests
│       └── DailyTrainerActor.test.ts
├── data-generators/
│   ├── workout-generator.ts          # Progressive overload logic
│   ├── measurement-generator.ts      # Body composition tracking
│   ├── message-generator.ts          # Contextual messages
│   └── __tests__/
│       ├── workout-generator.test.ts
│       ├── measurement-generator.test.ts
│       └── message-generator.test.ts
├── workflows/
│   ├── FourteenDayProgramWorkflow.ts # Main 14-day orchestration
│   └── __tests__/
│       └── workflow.test.ts
├── gui-tests/                         # Playwright + Actor hybrid
│   ├── program-builder.spec.ts
│   ├── workout-tracking.spec.ts
│   └── analytics-dashboard.spec.ts
└── story-015-01-14-day-simulation.test.ts  # Main integration test
```

---

## Best Practices

1. **Deterministic Testing**: Always use seeded random (`seed: 12345`) for reproducible tests
2. **State Verification**: Check actor state after each action, not just final results
3. **Daily Regression**: Run daily simulation tests to catch gradual degradation
4. **Hybrid Testing**: Combine API actors with Playwright for complete coverage
5. **Data Boundaries**: Test extreme values in generators (0 weights, 500+ lbs, etc.)
6. **Cleanup**: Always reset actor state between tests
7. **Incremental Validation**: Verify data at each step, not just end-to-end

---

## Running Simulations

```bash
# Run 14-day simulation
npm test -- __tests__/forge/phase2/stream-f/story-015-01-14-day-program-simulation.test.ts

# Run all FORGE tests
npm test -- __tests__/forge/

# Run with coverage
npm run test:coverage -- __tests__/forge/

# Run GUI tests
npm run test:e2e -- tests/e2e/program-builder/
```

---

## References

- `references/actor.ts` - Base Actor class
- `references/actor-factory-implementation.ts` - ActorFactory pattern
- `references/workflow-runner.ts` - Workflow orchestration
- `references/example-test-suite.ts` - Full test examples

## FORGE Methodology

**F**idelity - Generate realistic data patterns
**O**riented - Focus on user workflows, not just features
**R**egression - Daily tests catch gradual degradation
**G**rowth - Accumulate data over time for rich testing
**E**ngine - Automated actor-based execution
