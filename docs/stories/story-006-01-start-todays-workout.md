# Story 006-01: Start Today's Workout

**Parent Epic**: [EPIC-006 - Workout Tracking](../epics/epic-006-workout-tracking.md)
**Story ID**: STORY-006-01
**Priority**: P0 (Critical)
**Story Points**: 5
**Sprint**: Sprint 6

## User Story
**As a** client
**I want to** easily start my scheduled workout
**So that I** can begin training immediately

## Acceptance Criteria
- [ ] Prominent "Start Workout" button on client dashboard
- [ ] Today's workout clearly displayed with date and workout name
- [ ] Overview of all exercises in the workout
- [ ] Estimated duration shown based on program
- [ ] Equipment needed list displayed
- [ ] Warm-up reminder option before starting
- [ ] Previous performance summary for each exercise
- [ ] Skip to any exercise functionality
- [ ] Workout loads in under 3 seconds
- [ ] Clear visual indication of workout type (strength, cardio, etc.)

## Technical Implementation

### Frontend Tasks
1. **Create WorkoutDashboard Component**
   - Display today's scheduled workout
   - Show workout overview card
   - Include "Start Workout" CTA button
   - Display equipment checklist
   - Show previous workout summary

2. **Create WorkoutPreview Component**
   - List all exercises in order
   - Show sets/reps for each exercise
   - Display estimated duration
   - Include exercise thumbnails
   - Show previous performance data

3. **Create WarmupReminder Component**
   - Display warm-up suggestions
   - Include timer for warm-up
   - Optional skip functionality
   - Link to warm-up exercises

4. **Implement Navigation**
   - Route to workout execution page
   - Pass workout session data
   - Initialize workout session state

### Backend Tasks
1. **Create Workout Session Endpoints**
   ```typescript
   GET /api/workouts/today - Get today's scheduled workout
   POST /api/workouts/:sessionId/start - Initialize workout session
   GET /api/workouts/:sessionId/preview - Get workout preview
   GET /api/workouts/history/last - Get last performance for comparison
   ```

2. **Implement WorkoutSessionService**
   ```typescript
   class WorkoutSessionService {
     async getTodaysWorkout(clientId: string)
     async startWorkoutSession(workoutId: string, clientId: string)
     async getWorkoutPreview(sessionId: string, clientId: string)
     async getPreviousPerformance(clientId: string, exerciseId: string)
   }
   ```

3. **Database Operations**
   - Query program_workouts for today's schedule
   - Create workout_sessions record on start
   - Fetch exercise history for comparison
   - Calculate estimated duration

### Data Models
```typescript
interface WorkoutSession {
  id: string;
  clientId: string;
  programWorkoutId: string;
  status: 'in_progress' | 'completed' | 'skipped';
  startedAt: Date;
  completedAt?: Date;
  durationMinutes?: number;
  exercises: WorkoutExercise[];
}

interface WorkoutPreview {
  workoutId: string;
  name: string;
  description?: string;
  estimatedDuration: number;
  exerciseCount: number;
  equipment: string[];
  exercises: ExercisePreview[];
  previousPerformance?: PreviousPerformance;
}

interface ExercisePreview {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  restSeconds?: number;
  thumbnail?: string;
  lastPerformance?: {
    date: Date;
    weight: number;
    reps: number;
  };
}

interface PreviousPerformance {
  lastCompletedDate: Date;
  totalVolume: number;
  exercisesCompleted: number;
  notes?: string;
}
```

## Test Cases
1. **Happy Path**
   - Client logs in and sees today's workout
   - Clicks "Start Workout" button
   - Workout session initializes successfully
   - Redirected to workout execution page
   - All exercises load correctly

2. **Edge Cases**
   - No workout scheduled for today
   - Multiple workouts scheduled (show first)
   - Previously started incomplete workout
   - Workout already completed today
   - Network timeout during load

3. **Performance Tests**
   - Workout load time < 3 seconds
   - Previous performance data load < 1 second
   - Equipment list display instant

4. **UI Tests**
   - Start button is prominent and accessible
   - All information is readable on mobile
   - Warm-up reminder displays correctly
   - Previous performance data is accurate

## UI/UX Mockups
```
+------------------------------------------+
|  Today's Workout                          |
|  _________________________________        |
|  |                                 |       |
|  |     [Workout Thumbnail]         |       |
|  |                                 |       |
|  +---------------------------------+       |
|  Upper Body Power - Day 12               |
|  📋 8 Exercises | ⏱️ ~60 min              |
|                                           |
|  Equipment Needed:                         |
|  ☑ Barbell  ☑ Bench  ☑ Dumbbells         |
|  ☑ Cables  ⬜ Pull-up Bar                 |
|                                           |
|  Last Time: Oct 15                        |
|  ✅ Completed all exercises               |
|  💪 Total Volume: 12,450 lbs              |
|                                           |
|  [📋 Preview Exercises]  [🔥 Warm Up]     |
|                                           |
|  [      START WORKOUT →      ]            |
+------------------------------------------+
```

```
+------------------------------------------+
|  Workout Preview                          |
|  ← Back to Dashboard                     |
|                                           |
|  Upper Body Power - 8 Exercises           |
|  Estimated: 60 minutes                    |
|                                           |
|  1. Barbell Bench Press                   |
|     4 sets × 8-10 reps                   |
|     Last: 185 lbs × 8, 8, 7, 8           |
|     Rest: 90s                             |
|                                           |
|  2. Bent Over Rows                       |
|     4 sets × 8-10 reps                   |
|     Last: 155 lbs × 8, 8, 8, 9           |
|     Rest: 90s                             |
|                                           |
|  3. Overhead Press                       |
|     3 sets × 8-10 reps                   |
|     Last: 95 lbs × 8, 7, 8               |
|     Rest: 60s                             |
|                                           |
|  ... [5 more exercises]                   |
|                                           |
|  [        Start Workout →        ]        |
+------------------------------------------+
```

## Dependencies
- EPIC-005 (Program Builder) must be complete
- EPIC-004 (Exercise Library) must be complete
- Client authentication working
- Workout scheduling system functional
- Previous workout data available

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for session initialization
- [ ] Manual testing completed on mobile and desktop
- [ ] Performance benchmarks met (< 3s load time)
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated

## Notes
- This is the entry point for all workout tracking
- Critical for user engagement - make it fast and simple
- Previous performance data is motivational
- Consider showing "streak" information for motivation
- Ensure offline mode can display today's workout
- Check implementation status: ❌ Not Started
