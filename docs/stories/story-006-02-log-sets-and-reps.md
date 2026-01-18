# Story 006-02: Log Sets and Reps

**Parent Epic**: [EPIC-006 - Workout Tracking](../epics/epic-006-workout-tracking.md)
**Story ID**: STORY-006-02
**Priority**: P0 (Critical)
**Story Points**: 8
**Sprint**: Sprint 6

## User Story
**As a** client
**I want to** log my performance for each set
**So that I** can track my progress accurately

## Acceptance Criteria
- [ ] Easy number input with numpad interface on mobile
- [ ] Quick increment/decrement buttons (+2.5/-2.5, +5/-5 lbs/kg)
- [ ] Previous set values pre-filled for new sets
- [ ] Mark set as complete with clear visual feedback
- [ ] Add/remove sets dynamically during workout
- [ ] Failed set indication (different color/icon)
- [ ] Drop set support with indicator
- [ ] AMRAP (As Many Reps As Possible) result logging
- [ ] Input time per set < 5 seconds
- [ ] Auto-save to prevent data loss
- [ ] Clear visual distinction between completed and upcoming sets

## Technical Implementation

### Frontend Tasks
1. **Create SetLogger Component**
   - Implement numpad-style input for mobile
   - Create quick increment/decrement buttons
   - Build set card with complete/pending states
   - Add failed set toggle
   - Include AMRAP mode indicator
   - Implement drop set checkbox

2. **Create SetCard Component**
   - Display set number
   - Show prescribed vs. actual
   - Weight input with unit toggle (lbs/kg)
   - Reps input
   - Complete/incomplete toggle
   - Visual feedback for completion

3. **Create NumpadInput Component**
   - Custom number pad for mobile
   - Quick weight increments (+2.5, +5, +10)
   - Quick rep increments (+1, +2, +5)
   - Unit conversion display
   - Clear and delete buttons

4. **Implement Auto-save**
   - Debounce save on input change
   - Sync with backend periodically
   - Handle network failures gracefully
   - Show save status indicator

### Backend Tasks
1. **Create Set Logging Endpoints**
   ```typescript
   POST /api/workouts/:sessionId/exercises/:exerciseId/sets - Log new set
   PUT /api/workouts/sets/:setId - Update set data
   DELETE /api/workouts/sets/:setId - Remove logged set
   POST /api/workouts/sets/:setId/complete - Mark set complete
   ```

2. **Implement SetLogService**
   ```typescript
   class SetLogService {
     async logSet(data: CreateSetLogDto)
     async updateSet(setId: string, data: UpdateSetLogDto)
     async deleteSet(setId: string)
     async completeSet(setId: string)
     async getExerciseLogs(exerciseLogId: string)
   }
   ```

3. **Database Operations**
   - Insert set_logs records
   - Update exercise_logs with set completion
   - Calculate volume and intensity metrics
   - Track set modifications

### Data Models
```typescript
interface SetLog {
  id: string;
  exerciseLogId: string;
  setNumber: number;
  prescribedReps: string;
  performedReps: number;
  prescribedWeight?: string;
  performedWeight: number;
  weightUnit: 'kg' | 'lb';
  rpe?: number; // 1-10 scale
  rir?: number; // Reps in reserve
  restSeconds?: number;
  isWarmup: boolean;
  isDropset: boolean;
  isFailed: boolean;
  isAmrap: boolean;
  completedAt: Date;
}

interface SetLogInput {
  performedWeight: number;
  performedReps: number;
  rpe?: number;
  rir?: number;
  isFailed: boolean;
  isDropset: boolean;
  notes?: string;
}

interface ExerciseLogSummary {
  exerciseId: string;
  setsCompleted: number;
  setsTotal: number;
  totalVolume: number;
  averageIntensity: number;
  sets: SetLog[];
}
```

## Test Cases
1. **Happy Path**
   - Log first set with weight and reps
   - System pre-fills second set with same weight
   - Complete all sets for exercise
   - Move to next exercise
   - All data saved correctly

2. **Edge Cases**
   - Failed set logging
   - Drop set after last set
   - AMRAP set with high rep count
   - Adding extra sets beyond prescribed
   - Removing accidentally logged set
   - Zero weight entered (bodyweight exercise)
   - Very heavy weights (3+ plates)

3. **Performance Tests**
   - Input response time < 100ms
   - Auto-save completes in < 500ms
   - Scroll performance with 20+ sets

4. **Data Validation**
   - Negative numbers rejected
   - Unreasonably high weights flagged
   - Required fields validated
   - Unit consistency checked

## UI/UX Mockups
```
+------------------------------------------+
|  Barbell Bench Press                     |
|  Set 3 of 4                              |
|  [← Prev Exercise]    [Next Exercise →]  |
+------------------------------------------+
|                                           |
|  Prescribed: 8-10 reps × 185 lbs          |
|                                           |
|  +-------------------------------------+  |
|  |  SET 1 ✓                    185 lbs |  |
|  |  8 reps                        90s   |  |
|  +-------------------------------------+  |
|                                           |
|  +-------------------------------------+  |
|  |  SET 2 ✓                    185 lbs |  |
|  |  9 reps                        85s   |  |
|  +-------------------------------------+  |
|                                           |
|  +-------------------------------------+  |
|  |  SET 3 (Current)                     |  |
|  |                                      |  |
|  |  Weight: [185] lbs  [kg]             |  |
|  |         [+2.5] [+5] [+10]            |  |
|  |                                      |  |
|  |  Reps:   [__]                        |  |
|  |         [+1] [+2] [+5]               |  |
|  |                                      |  |
|  |  RPE:   [__]  RIR: [__]              |  |
|  |                                      |  |
|  |  ☐ Failed Set  ☐ Drop Set            |  |
|  |                                      |  |
|  |      [  Complete Set  ✓  ]           |  |
|  +-------------------------------------+  |
|                                           |
|  [✓ Skip Set]  [➕ Add Set]               |
|                                           |
|  💾 Auto-saved 2s ago                     |
+------------------------------------------+
```

**Mobile Numpad View:**
```
+--------------------------+
|  Weight: 185 lbs         |
+--------------------------+
|  [7] [8] [9] [+2.5]      |
|  [4] [5] [6] [+5]        |
|  [1] [2] [3] [+10]       |
|  [0] [.] [←] [Clear]     |
+--------------------------+
```

## Dependencies
- STORY-006-01 (Start Today's Workout) must be complete
- Exercise data structure defined
- Workout session initialized
- Real-time save infrastructure

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for set logging flow
- [ ] Manual testing completed on mobile devices
- [ ] Performance benchmarks met (< 5s input time)
- [ ] Auto-save verified working
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated

## Notes
- Most critical interaction during workout - must be fast and reliable
- Consider voice input for future enhancement
- Numpad should show common weight increments for plates (2.5, 5, 10, 25, 45)
- Implement haptic feedback on button press
- Consider adding "quick add" for common set patterns (e.g., "same as last set")
- Offline mode must queue set logs for sync
- Check implementation status: ❌ Not Started
