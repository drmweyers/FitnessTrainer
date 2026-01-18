# Story 006-06: Modify Workout

**Parent Epic**: [EPIC-006 - Workout Tracking](../epics/epic-006-workout-tracking.md)
**Story ID**: STORY-006-06
**Priority**: P1 (High)
**Story Points**: 5
**Sprint**: Sprint 7

## User Story
**As a** client
**I want to** make modifications when needed
**So that I** can adapt to circumstances

## Acceptance Criteria
- [ ] Substitute exercises with alternatives
- [ ] Skip exercises with reason selection
- [ ] Add extra sets if feeling good
- [ ] Modify prescribed weight/reps
- [ ] Change rest periods during workout
- [ ] Save modifications for future reference
- [ ] Notify trainer of modifications
- [ ] Quick templates for common modifications
- [ ] Undo/redo modification support
- [ ] Clear indication of modified vs. prescribed

## Technical Implementation

### Frontend Tasks
1. **Create WorkoutModifier Component**
   - Add modify button to each exercise
   - Show modification options menu
   - Display modification templates
   - Indicate which exercises are modified

2. **Create ExerciseSubstitution Component**
   - List alternative exercises
   - Show equipment differences
   - Display difficulty comparison
   - One-tap substitution

3. **Create SkipExerciseModal Component**
   - Pre-defined skip reasons
   - Custom reason input
   - Optional notes field
   - Confirmation dialog

4. **Create ModifySetsModal Component**
   - Add/remove sets
   - Modify weight/reps
   - Change rest periods
   - Apply to all future sets option

5. **Create ModificationTemplate Component**
   - Quick modification templates
   - "Feeling great - add sets"
   - "Equipment unavailable - substitute"
   - "Time crunch - reduce sets"
   - "Not feeling well - deload"

### Backend Tasks
1. **Create Modification Endpoints**
   ```typescript
   POST /api/workouts/:sessionId/modifications - Record modification
   PUT /api/workouts/:sessionId/modifications/:id - Update modification
   GET /api/workouts/:sessionId/modifications - Get all modifications
   DELETE /api/workouts/modifications/:id - Remove modification
   POST /api/workouts/modifications/templates - Apply template
   ```

2. **Implement ModificationService**
   ```typescript
   class ModificationService {
     async substituteExercise(sessionId: string, exerciseId: string, replacementId: string, reason: string)
     async skipExercise(sessionId: string, exerciseId: string, reason: string, notes?: string)
     async addSet(sessionId: string, exerciseId: string, setData: SetData)
     async modifyPrescription(sessionId: string, exerciseId: string, modifications: ModificationData)
     async changeRestPeriod(sessionId: string, exerciseId: string, newRestSeconds: number)
     async applyTemplate(sessionId: string, templateId: string)
     async notifyTrainer(sessionId: string, modification: Modification)
   }
   ```

3. **Database Operations**
   - Insert workout_modifications records
   - Update exercise_logs with modification data
   - Track modification history
   - Link modifications to notifications

### Data Models
```typescript
interface WorkoutModification {
  id: string;
  sessionId: string;
  modificationType: 'exercise_sub' | 'sets_added' | 'sets_removed' | 'weight_adjusted' | 'reps_adjusted' | 'rest_changed' | 'skipped';
  originalValue: ModificationValue;
  modifiedValue: ModificationValue;
  reason: string;
  notes?: string;
  createdAt: Date;
  isNotified: boolean;
}

interface ModificationValue {
  exerciseId?: string;
  sets?: number;
  reps?: string;
  weight?: string;
  restSeconds?: number;
  // JSONB for flexibility
  [key: string]: any;
}

interface ModificationTemplate {
  id: string;
  name: string;
  description: string;
  modifications: TemplateModification[];
  icon?: string;
  isSystem: boolean;
}

interface TemplateModification {
  type: string;
  value: any;
  applyTo: 'current' | 'all' | 'remaining';
}

interface SkipReason {
  id: string;
  label: string;
  icon?: string;
  isCustom: boolean;
}
```

## Test Cases
1. **Happy Path**
   - User clicks modify on exercise
   - Selects "substitute exercise"
   - Chooses alternative from list
   - Substitution applied immediately
   - Trainer notified of change

2. **Edge Cases**
   - Substitute exercise not available
   - Skip all exercises in workout
   - Modify after completing some sets
   - Undo modification after applying
   - Multiple modifications to same exercise
   - Modification with no reason given

3. **Template Tests**
   - Apply "add sets" template
   - Apply "time crunch" template
   - Create custom template
   - Template applies correctly to all exercises

4. **Notification Tests**
   - Trainer receives notification
   - Notification includes all modification details
   - Notification timing (immediate vs. batch)

## UI/UX Mockups
```
+------------------------------------------+
|  Barbell Bench Press                     |
|  Set 3 of 4                              |
|  [≡ Modify Exercise]                     |
+------------------------------------------+
|                                           |
|  Modify Options:                          |
|  ┌─────────────────────────────────────┐  |
|  │ 🔄 Substitute Exercise              │  |
|  │ ⏭ Skip Exercise                    │  |
|  │ ➕ Add Set                          │  |
|  │ ✏️ Edit Prescription                │  |
|  │ ⏱ Change Rest Time                 │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  Quick Templates:                         |
|  ┌─────────────────────────────────────┐  |
|  │ 💪 Feeling Great - Add 1 Set       │  |
|  │ ⏰ Time Crunch - Remove 1 Set       │  |
|  │ 🤒 Not Feeling Well - Reduce 20%   │  |
|  │ 🏋️ Equipment Unavailable           │  |
|  └─────────────────────────────────────┘  |
+------------------------------------------+
```

**Substitute Exercise Modal:**
```
+------------------------------------------+
|  Substitute Exercise                     |
|  Barbell Bench Press                     |
+------------------------------------------+
|                                           |
|  Select Alternative:                      |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │ ✓ Dumbbell Bench Press              │  |
|  │   Equipment: Dumbbells               │  |
|  │   Difficulty: Similar               │  |
|  │   Target: Chest (Primary)           │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │   Machine Chest Press               │  |
|  │   Equipment: Chest Press Machine    │  |
|  │   Difficulty: Easier                │  |
|  │   Target: Chest (Primary)           │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │   Push-ups                         │  |
|  │   Equipment: None                  │  |
|  │   Difficulty: Harder               │  |
|  │   Target: Chest (Primary)           │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  Reason: [Equipment unavailable _________] |
|                                           |
|  [Cancel]  [Apply Substitution]           |
+------------------------------------------+
```

**Skip Exercise Modal:**
```
+------------------------------------------+
|  Skip Exercise                           |
|  Barbell Bench Press                     |
+------------------------------------------+
|                                           |
|  Why are you skipping this exercise?      |
|                                           |
|  ⬜ Equipment unavailable                 |
|  ⬜ Injury / Pain                         |
|  ⬜ Running out of time                   |
|  ⬜ Not feeling well                      |
|  ⬜ Exercise too difficult                |
|  ⬜ Gym too crowded                        |
|  ⬜ Other (__________________)            |
|                                           |
|  Notes for your trainer:                  |
|  [_________________________________]      |
|  [_________________________________]      |
|                                           |
|  [Cancel]  [Skip Exercise]                |
+------------------------------------------+
```

**Modified Exercise Indicator:**
```
+------------------------------------------+
|  🔄 Barbell Bench Press                   |
|  (Modified: Substituted)                  |
|  Set 3 of 4                               |
+------------------------------------------+
|  Prescribed: Barbell Bench Press          |
|  Actual: Dumbbell Bench Press             |
|                                           |
|  [✓ Completed Sets]                       |
+------------------------------------------+
```

## Dependencies
- STORY-006-01 (Start Today's Workout) must be complete
- Exercise alternatives system
- Trainer notification system
- Workout session state management

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for modification flow
- [ ] Manual testing completed
- [ ] Trainer notifications verified
- [ ] Templates tested
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated

## Notes
- Modifications are common - make it easy and flexible
- Quick templates reduce friction for common scenarios
- Always notify trainers of modifications for awareness
- Track modifications to understand client behavior
- Consider auto-suggesting modifications based on patterns
- Keep modification history for program optimization
- Check implementation status: ❌ Not Started
