# Story 005-05: Create Supersets and Circuits

**Parent Epic**: [EPIC-005 - Program Builder](../epics/epic-005-program-builder.md)
**Story ID**: STORY-005-05
**Priority**: P1 (High)
**Story Points**: 13
**Sprint**: Sprint 6

## User Story
**As a** trainer
**I want to** group exercises into supersets or circuits
**So that I** can create advanced training techniques

## Acceptance Criteria
- [ ] Can select multiple exercises to group
- [ ] Can create superset (2 exercises alternating)
- [ ] Can create circuit (3+ exercises in sequence)
- [ ] Can create giant set (4+ exercises, no rest)
- [ ] Can visually see grouped exercises
- [ ] Can set rest periods (between exercises vs between sets)
- [ ] Can specify circuit rounds
- [ ] Can ungroup exercises easily
- [ ] Can nest grouping (superset within circuit)
- [ ] Clear visual indicators for grouping type
- [ ] Drag-and-drop to add/remove from groups
- [ ] Can reorder exercises within groups
- [ ] Can duplicate groups
- [ ] Visual preview of group structure
- [ ] Group validation (can't have 1-exercise superset)

## Technical Implementation

### Frontend Tasks
1. **Create SupersetBuilder Component**
   - Location: `frontend/src/components/programs/SupersetBuilder.tsx`
   - Multi-select mode for exercises
   - Drag-and-drop to group exercises
   - Visual grouping indicators (brackets, colors)
   - Group type selector (superset, circuit, giant set)
   - Configuration modal for group settings

2. **Create ExerciseGroupCard Component**
   - Location: `frontend/src/components/programs/ExerciseGroupCard.tsx`
   - Display grouped exercises
   - Show group type icon
   - Group settings button
   - Ungroup button
   - Visual distinction from regular exercises
   - Nested group support

3. **Create GroupConfiguration Component**
   - Location: `frontend/src/components/programs/GroupConfiguration.tsx`
   - Rest period configuration
   - Circuit rounds input
   - Exercise order within group
   - Group notes

4. **Implement Visual Grouping**
   - Use DND library for drag-and-drop
   - Visual brackets/lines connecting grouped exercises
   - Color coding by group type
   - Hover effects for group boundaries

### Backend Tasks
1. **Superset Management Endpoints**
   ```typescript
   // POST /api/programs/workouts/:workoutId/groups
   interface CreateGroupDto {
     groupType: 'superset' | 'circuit' | 'giant_set';
     exerciseIds: string[];
     rounds?: number; // for circuits
     restBetweenExercises?: number; // seconds
     restBetweenSets?: number; // seconds
   }

   // PUT /api/programs/groups/:groupId
   interface UpdateGroupDto {
     exerciseIds?: string[];
     rounds?: number;
     restBetweenExercises?: number;
     restBetweenSets?: number;
   }

   // DELETE /api/programs/groups/:groupId
   ```

2. **Exercise Grouping Updates**
   ```typescript
   // PUT /api/programs/exercises/:exerciseId/group
   interface UpdateExerciseGroupDto {
     supersetGroup: string; // Group identifier (A, B, C, etc.)
     orderIndex: number; // Order within group
   }
   ```

3. **Group Operations**
   ```typescript
   // POST /api/programs/groups/:groupId/duplicate
   interface DuplicateGroupDto {
     targetWorkoutId?: string;
   }

   // POST /api/programs/groups/:groupId/ungroup
   // Ungroup all exercises in the group
   ```

### Data Models
```typescript
interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  exercise: Exercise;
  orderIndex: number;
  supersetGroup?: string; // 'A', 'B', 'C', etc. for grouping
  setsConfig: SetsConfig;
  notes?: string;
  createdAt: Date;
  configurations: ExerciseConfiguration[];
}

interface ExerciseGroup {
  id: string;
  workoutId: string;
  groupType: 'superset' | 'circuit' | 'giant_set';
  groupId: string; // Maps to supersetGroup field
  exercises: WorkoutExercise[];
  rounds?: number; // For circuits
  restBetweenExercises?: number; // seconds
  restBetweenSets?: number; // seconds
  notes?: string;
}

interface GroupConfiguration {
  groupType: 'superset' | 'circuit' | 'giant_set';
  exerciseIds: string[];
  rounds?: number;
  restBetweenExercises?: number;
  restBetweenSets?: number;
  notes?: string;
}

// Superset: 2 exercises, alternating, rest after both
// Circuit: 3+ exercises, sequence, rest after all
// Giant Set: 4+ exercises, no rest between exercises
```

## Test Cases
1. **Create Superset**
   - Select "Bench Press" and "Barbell Row"
   - Click "Create Superset"
   - Set rest between exercises: 0s
   - Set rest between sets: 90s
   - Superset created with visual grouping
   - Both exercises show same group letter

2. **Create Circuit**
   - Select 4 exercises
   - Click "Create Circuit"
   - Set rounds: 3
   - Set rest between exercises: 30s
   - Set rest between rounds: 90s
   - Circuit created with visual indicator
   - All exercises show same group letter

3. **Visual Indicators**
   - Superset shows bracket connecting 2 exercises
   - Circuit shows box around all exercises
   - Group letter displayed (A, B, C)
   - Color coding: Superset (blue), Circuit (green), Giant Set (purple)

4. **Ungroup Exercises**
   - Select grouped exercise
   - Click "Ungroup"
   - Exercise removed from group
   - Visual grouping removed

5. **Reorder in Group**
   - Drag exercise within group
   - Order updates
   - Rest periods recalculated if needed

6. **Duplicate Group**
   - Select superset group
   - Click "Duplicate Group"
   - New group created with same exercises
   - New group letter assigned

7. **Nested Groups**
   - Create superset (A1, A2)
   - Create circuit (B1, B2, B3)
   - Both groups coexist in same workout
   - Visual distinction clear

## UI/UX Mockups
```
+----------------------------------------------------------+
|  Upper Body A - Monday                    [← Back]       |
|  Exercises: 6 (2 groups)                                |
+----------------------------------------------------------+
|  ┌─ Superset A ────────────────────────────────────────┐|
|  │                                                      │|
|  │  1. Barbell Bench Press              [↑] [↓] [×]    │|
|  │     Chest • Barbell                                │|
|  │     Sets: 3 | Reps: 8-10                           │|
|  │     Rest: 90s (after both exercises)               │|
|  │                                                      │|
|  │  2. Bent Over Barbell Row              [↑] [↓] [×]   │|
|  │     Back • Barbell                                 │|
|  │     Sets: 3 | Reps: 8-10                           │|
|  │     Rest: 0s (between exercises)                   │|
|  │                                                      │|
|  │  [Edit Group]  [Ungroup]  [Duplicate]              │|
|  └──────────────────────────────────────────────────────┘|
|                                                          |
|  3. Overhead Barbell Press                  [↑] [↓] [×]  |
|     Shoulders • Barbell                                 |
|     Sets: 3 | Reps: 8-10                                |
|     Rest: 90s                                           |
|                                                          |
|  ┌─ Circuit B ── 3 Rounds ────────────────────────────┐|
|  │                                                      │|
|  │  4. Dumbbell Lateral Raise            [↑] [↓] [×]    │|
|  │     Shoulders • Dumbbell                           │|
|  │     Reps: 12 | Rest: 30s (between exercises)       │|
|  │                                                      │|
|  │  5. Dumbbell Front Raise              [↑] [↓] [×]    │|
|  │     Shoulders • Dumbbell                           │|
|  │     Reps: 12 | Rest: 30s                            │|
|  │                                                      │|
|  │  6. Dumbbell Rear Delt Fly             [↑] [↓] [×]    │|
|  │     Shoulders • Dumbbell                           │|
|  │     Reps: 12 | Rest: 90s (after circuit)           │|
|  │                                                      │|
|  │  [Edit Group]  [Ungroup]  [Duplicate]              │|
|  └──────────────────────────────────────────────────────┘|
|                                                          |
|  [+ Add Exercises]                                       |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Create Exercise Group                     [× Close]     |
+----------------------------------------------------------+
|  Selected Exercises (2)                                   |
|  1. Barbell Bench Press                                   |
|  2. Bent Over Barbell Row                                 |
|                                                          |
|  Group Type *                                            |
|  ◉ Superset (2 exercises)                                |
|  ○ Circuit (3+ exercises)                                |
|  ○ Giant Set (4+ exercises)                              |
|                                                          |
|  ┌─ Superset Configuration ──────────────────────────┐   |
|  │                                                     │  |
|  │  Rest Between Exercises                            │  |
|  │  [ 0 ] seconds (0 = no rest, alternate immediately)│  |
|  │                                                     │  |
|  │  Rest Between Sets                                 │  |
|  │  [ 90 ] seconds (rest after completing both)       │  |
|  │                                                     │  |
|  └─────────────────────────────────────────────────────┘   |
|                                                          |
|  Exercise Order                                          |
|  1. [Bench Press ▼]  (drag to reorder)                  |
|  2. [Barbell Row ▼]                                     |
|                                                          |
|  Group Notes (optional)                                  |
|  [Alternate between exercises with no rest]             |
|                                                          |
|  Preview:                                                |
|  • Bench Press → Row → Rest 90s (repeat 3x)              |
|                                                          |
|  [Cancel]  [Create Group]                                |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Create Exercise Group                     [× Close]     |
+----------------------------------------------------------|
|  Selected Exercises (4)                                   |
|  1. Dumbbell Lateral Raise                                |
|  2. Dumbbell Front Raise                                  |
|  3. Dumbbell Rear Delt Fly                                |
|  4. Face Pulls                                            |
|                                                          |
|  Group Type *                                            |
|  ○ Superset (2 exercises)                                |
|  ◉ Circuit (3+ exercises)                                |
|  ○ Giant Set (4+ exercises)                              |
|                                                          |
|  ┌─ Circuit Configuration ───────────────────────────┐   |
|  │                                                     │  |
|  │  Number of Rounds                                  │  |
|  │  [ 3 ] rounds                                      │  |
|  │                                                     │  |
|  │  Rest Between Exercises                            │  |
|  │  [ 30 ] seconds                                    │  |
|  │                                                     │  |
|  │  Rest Between Rounds                               │  |
|  │  [ 90 ] seconds (rest after completing circuit)    │  |
|  │                                                     │  |
|  └─────────────────────────────────────────────────────┘   |
|                                                          |
|  Exercise Order                                          |
|  1. [Lateral Raise ▼]                                   |
|  2. [Front Raise ▼]                                     |
|  3. [Rear Delt Fly ▼]                                   |
|  4. [Face Pulls ▼]                                      |
|                                                          |
|  Preview:                                                |
|  Round 1: Lateral → Front → Rear → Face → Rest 90s       |
|  Round 2: Lateral → Front → Rear → Face → Rest 90s       |
|  Round 3: Lateral → Front → Rear → Face → Done           |
|                                                          |
|  [Cancel]  [Create Group]                                |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Edit Group: Superset A                     [× Close]    |
+----------------------------------------------------------|
|  Group Type: Superset                                    |
|                                                          |
|  ┌─ Configuration ────────────────────────────────────┐   |
|  │                                                     │  |
|  │  Rest Between Exercises                            │  |
|  │  [ 0 ] seconds                                     │  |
|  │                                                     │  |
|  │  Rest Between Sets                                 │  |
|  │  [ 90 ] seconds                                    │  |
|  │                                                     │  |
|  └─────────────────────────────────────────────────────┘   |
|                                                          |
|  Exercises in Group                                      |
|  1. Barbell Bench Press      [Remove]                   |
|  2. Bent Over Barbell Row    [Remove]                   |
|                                                          |
|  [+ Add Exercise to Group]                               |
|                                                          |
|  [Cancel]  [Save Changes]  [Ungroup All]                 |
+----------------------------------------------------------|
```

## Dependencies
- Story 005-03: Add Exercises (exercises must exist)
- Story 005-04: Configure Parameters (parameters should be set)
- WorkoutExercise model with supersetGroup field
- Group management endpoints

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Superset creation working
- [ ] Circuit creation working
- [ ] Giant set creation working
- [ ] Visual grouping indicators clear
- [ ] Drag-and-drop grouping functional
- [ ] Ungroup functionality working
- [ ] Group configuration modal working
- [ ] Group duplication implemented
- [ ] Nested groups supported
- [ ] API endpoints tested
- [ ] Integration tests for grouping flows
- [ ] Mobile responsive (stack groups on mobile)
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
**Status: PARTIALLY IMPLEMENTED**

Backend infrastructure is complete:
- Database schema includes supersetGroup field in WorkoutExercise
- Field supports grouping via string identifiers (A, B, C)
- Full exercise ordering support via orderIndex
- Exercise configuration supports set/rest parameters

Frontend implementation still needed:
- Visual grouping UI with brackets/boxes
- Drag-and-drop grouping interface
- Group configuration modals
- Ungroup functionality
- Group duplication
- Color coding and visual indicators
- Mobile responsive layout

This is an advanced feature that requires careful UX design. The visual representation of groups must be clear and intuitive.

Consider implementing:
- Keyboard shortcuts (Ctrl+click to multi-select, G to group)
- Visual preview of how the group will execute
- Automatic rest period calculations
- Conflict detection (e.g., exercise in multiple groups)
- Export/import group templates

Groups are a powerful programming tool, so the interface should make it easy to create and modify them without overwhelming trainers.
