# 14-Day Daily Trainer-Client Simulation Design

> **FORGE User Simulation** - Phase 2 Stream F
> **Goal:** Populate platform with rich, realistic trainer-client interaction data over 14 days

---

## Overview

Comprehensive multi-actor simulation tracking a trainer-client relationship through 14 days of daily interactions, generating workout logs, messages, measurements, and analytics data for visualization and testing.

**Simulation Duration:** 14 days (2 weeks)
**Workout Frequency:** 4 days/week (Mon/Tue/Thu/Fri)
**Rest Days:** 3 days/week (Wed/Sat/Sun) with check-ins

---

## Data Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Workout Sessions | 8 | 4 days/week × 2 weeks |
| Exercise Sets Logged | 160 | ~20 sets per workout |
| Messages Exchanged | 42 | 3 per day (trainer + client) |
| Body Measurements | 3 | Days 1, 7, 14 |
| Progress Photos | 3 | Days 1, 7, 14 |
| Program Adjustments | 2 | Week 1 and Week 2 reviews |
| Personal Records Set | 6-8 | Progressive overload tracking |

---

## Actor Architecture

### 1. DailyClientActor

Extends base ClientActor with daily interaction capabilities.

**Actions:**
- `startWorkout(workoutId)` - Begin scheduled session
- `logSet(exerciseId, weight, reps, rpe)` - Record set with RPE
- `completeWorkout(feedback)` - Finish with subjective notes
- `logRecoveryMetrics(sleep, soreness, energy)` - Rest day tracking
- `recordMeasurements(data)` - Weekly body metrics
- `uploadProgressPhoto(photoType)` - Progress documentation
- `sendMessage(to, content)` - Communication with trainer
- `readMessages()` - Check inbox and mark read

### 2. DailyTrainerActor

Extends base TrainerActor with program management and review capabilities.

**Actions:**
- `createProgram(name, duration, workouts)` - Initial program setup
- `assignProgram(clientId, programId)` - Assign to client
- `reviewWorkout(sessionId)` - Review completed session
- `sendFeedback(clientId, type, message)` - Send form/coaching feedback
- `adjustProgram(programId, adjustments)` - Modify based on progress
- `reviewAnalytics(clientId)` - Check performance trends
- `sendCheckIn(clientId, isWorkoutDay)` - Daily messaging
- `respondToClient(messageId, content)` - Reply to client messages

### 3. WorkflowRunner

Orchestrates the 14-day timeline with state management.

**Responsibilities:**
- Maintain simulation clock (day-by-day progression)
- Pass state between daily iterations
- Track accumulated data
- Verify completion criteria

---

## 14-Day Timeline Structure

### Week 1

| Day | Type | Client Actions | Trainer Actions | Data Generated |
|-----|------|----------------|-----------------|----------------|
| 1 | Workout + Measurements | Start workout, log 4 exercises with 4 sets each, record measurements, upload photo | Create program, assign program, review workout, send welcome message | 16 sets, 1 photo, 8 measurements, 2 messages |
| 2 | Workout | Start workout, log sets, send fatigue feedback | Review workout, adjust next session weight | 16 sets, 2 messages |
| 3 | Rest | Log recovery (sleep: 7hrs, soreness: 3/10, energy: 7/10) | Send recovery check-in | Recovery log, 2 messages |
| 4 | Workout | Start workout, hit PR on bench, log sets | Review workout, congratulate on PR | 20 sets, 1 PR, 2 messages |
| 5 | Workout | Start workout, log sets, report form concern | Review workout, send form video/tips | 16 sets, 2 messages |
| 6 | Rest | Log recovery (sleep: 8hrs, soreness: 2/10, energy: 8/10) | Send motivation message | Recovery log, 2 messages |
| 7 | Workout + Measurements | Start workout, log sets, record measurements, upload photo | Review week 1 analytics, adjust Week 2 program, send weekly summary | 16 sets, 1 photo, 8 measurements, 2 messages, 1 program adjustment |

### Week 2

| Day | Type | Client Actions | Trainer Actions | Data Generated |
|-----|------|----------------|-----------------|----------------|
| 8 | Workout | Start workout, log sets with increased weights | Review workout, confirm progression | 16 sets, 2 messages |
| 9 | Workout | Start workout, hit PR on squat, log sets | Review workout, congratulate on PR | 20 sets, 1 PR, 2 messages |
| 10 | Rest | Log recovery (sleep: 7.5hrs, soreness: 4/10, energy: 6/10) | Send recovery check-in, note higher soreness | Recovery log, 2 messages |
| 11 | Workout | Start workout, log sets, report energy is low | Review workout, adjust volume for next session | 16 sets, 2 messages |
| 12 | Workout (Adjusted) | Start modified workout, log sets, appreciate adjustment | Review workout, confirm adjustment helped | 12 sets, 2 messages |
| 13 | Rest | Log recovery (sleep: 8.5hrs, soreness: 2/10, energy: 9/10) | Send pre-final week motivation | Recovery log, 2 messages |
| 14 | Workout + Measurements | Start final workout, log sets, record measurements, upload photo, send thank you message | Review final workout, review 2-week analytics, send completion congratulations | 16 sets, 1 photo, 8 measurements, 2 messages |

---

## Data Generators

### Workout Data Generator

Generates realistic workout data with progressive overload.

```typescript
interface WorkoutSet {
  exerciseId: string;
  setNumber: number;
  weight: number;      // lbs/kg
  reps: number;        // 5-12 range
  rpe: number;         // 1-10 scale
  isPR: boolean;
  notes?: string;
}

// Progressive overload pattern
// Week 1: Baseline weights
// Week 2: 5-10% increase or +1-2 reps
```

### Measurement Generator

Generates realistic body composition changes over 14 days.

```typescript
interface BodyMeasurements {
  date: Date;
  weight: number;           // Small decrease (0.5-2 lbs)
  bodyFat: number;          // Small decrease (0.2-0.5%)
  chest: number;            // Potential increase
  waist: number;            // Decrease
  hips: number;             // Stable/slight decrease
  arms: number;             // Small increase
  thighs: number;           // Stable/slight increase
}

// Realistic 14-day changes
// Weight: -0.5 to -2.0 lbs
// Body fat: -0.2 to -0.5%
// Waist: -0.25 to -0.5 inches
// Arms: +0.1 to +0.25 inches
```

### Message Generator

Generates contextual trainer-client messages.

**Trainer Message Types:**
- Welcome/introduction
- Workout feedback (form, effort, PR celebration)
- Recovery check-ins
- Motivation/encouragement
- Program adjustments
- Weekly summaries

**Client Message Types:**
- Workout completion
- Fatigue/fitness feedback
- Form questions
- Recovery reports
- Thank you/appreciation

---

## Test File Structure

### Main Test File: `story-015-01-14-day-program-simulation.test.ts`

```typescript
describe('Story 015-01: 14-Day Program Simulation', () => {
  let trainer: DailyTrainerActor;
  let client: DailyClientActor;
  let simulationState: FourteenDayState;

  beforeAll(async () => {
    // Create actors and setup initial state
    trainer = await ActorFactory.createTrainer();
    client = await ActorFactory.createClient(trainer.id);
    simulationState = initializeSimulationState();
  });

  describe('Day-by-Day Simulation', () => {
    for (let day = 1; day <= 14; day++) {
      it(`executes day ${day} activities`, async () => {
        const dayResult = await runDaySimulation(day, trainer, client, simulationState);
        expect(dayResult.completed).toBe(true);
        simulationState = dayResult.newState;
      });
    }
  });

  describe('Final Verification', () => {
    it('has accumulated 14 days of data', () => {
      expect(simulationState.daysCompleted).toBe(14);
    });

    it('has 8+ workout sessions', () => {
      expect(simulationState.workoutSessions.length).toBeGreaterThanOrEqual(8);
    });

    it('has 40+ messages exchanged', () => {
      expect(simulationState.messages.length).toBeGreaterThanOrEqual(40);
    });

    it('has 3 measurement records', () => {
      expect(simulationState.measurements.length).toBe(3);
    });

    it('has 6+ personal records', () => {
      expect(simulationState.personalRecords.length).toBeGreaterThanOrEqual(6);
    });

    it('trainer can view rich analytics', async () => {
      const analytics = await trainer.reviewAnalytics(client.id);
      expect(analytics.workoutFrequency.length).toBe(14);
      expect(analytics.volumeProgression.length).toBeGreaterThanOrEqual(8);
      expect(analytics.bodyCompositionChanges.length).toBe(3);
    });
  });
});
```

---

## Implementation Files

### 1. Actor Extensions

**`actors/DailyClientActor.ts`**
- Extends ClientActor
- Implements daily action methods
- Tracks personal state (measurements, messages, workouts)

**`actors/DailyTrainerActor.ts`**
- Extends TrainerActor
- Implements program management methods
- Tracks client progress and analytics

### 2. Workflow Orchestration

**`workflows/FourteenDayProgramWorkflow.ts`**
- Day-by-day execution logic
- State management and passing
- Data accumulation tracking
- Completion verification

### 3. Data Generators

**`data-generators/workout-generator.ts`**
- Exercise selection from library
- Set/rep/weight progression logic
- PR detection

**`data-generators/measurement-generator.ts`**
- Realistic body metric changes
- Progress photo references

**`data-generators/message-generator.ts`**
- Contextual message templates
- Response mapping

---

## Success Criteria

1. **Simulation completes 14 days** without errors
2. **All data targets met:**
   - 8+ workout sessions
   - 150+ sets logged
   - 40+ messages
   - 3 measurement sets
   - 6+ personal records
3. **Analytics dashboard shows:**
   - Workout frequency chart with 14 data points
   - Volume progression trend
   - Body composition changes over time
   - Personal record timeline
4. **Trainer and client can:**
   - View full message history
   - See workout logs for all sessions
   - Track measurements over 14 days
   - View program adjustments made

---

## Integration Points

- Uses existing `/lib/forge/utils/actor-factory.ts`
- Uses existing `/lib/forge/utils/workflow-runner.ts`
- Integrates with exercise library (1,344 exercises)
- Uses existing analytics API endpoints
- Uses existing messaging system
- Uses existing workout tracking system

---

## Execution Command

```bash
npm test -- __tests__/forge/phase2/stream-f/story-015-01-14-day-program-simulation.test.ts --verbose
```

---

*Design approved for implementation*
