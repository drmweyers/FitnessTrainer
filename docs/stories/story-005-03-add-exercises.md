# Story 005-03: Add Exercises to Workouts

**Parent Epic**: [EPIC-005 - Program Builder](../epics/epic-005-program-builder.md)
**Story ID**: STORY-005-03
**Priority**: P0 (Critical)
**Story Points**: 13
**Sprint**: Sprint 5

## User Story
**As a** trainer
**I want to** add exercises to each workout
**So that I** can create complete training sessions

## Acceptance Criteria
- [ ] Can open exercise picker from workout
- [ ] Can search exercises by name
- [ ] Can filter by body part (chest, back, legs, etc.)
- [ ] Can filter by equipment (barbell, dumbbell, machine, etc.)
- [ ] Can filter by difficulty level
- [ ] Can view exercise details on hover/click
- [ ] Can see exercise GIF/image preview
- [ ] Can add multiple exercises at once
- [ ] Can reorder exercises within workout
- [ ] Can remove exercises from workout
- [ ] Can duplicate exercises
- [ ] Can see recently used exercises
- [ ] Can add from favorites list
- [ ] Exercise count displayed per workout
- [ ] Quick add from suggestions
- [ ] Clear visual feedback on add/remove

## Technical Implementation

### Frontend Tasks
1. **Create ExercisePicker Component**
   - Location: `frontend/src/components/exercises/ExercisePicker.tsx`
   - Search bar with debounce (300ms)
   - Filter sidebar with checkboxes
   - Exercise grid/list view
   - Exercise cards with thumbnail, name, muscle group
   - Hover to preview details
   - Multi-select mode
   - "Add Selected" button
   - Pagination or infinite scroll

2. **Create ExerciseCard Component**
   - Location: `frontend/src/components/exercises/ExerciseCard.tsx`
   - Exercise thumbnail/image
   - Exercise name
   - Muscle group icon
   - Equipment icon
   - Difficulty badge
   - "View Details" button
   - "Add to Workout" button
   - Favorite toggle

3. **Create ExercisePreview Component**
   - Location: `frontend/src/components/exercises/ExercisePreview.tsx`
   - Exercise GIF/video player
   - Exercise name and target muscle
   - Secondary muscles worked
   - Equipment needed
   - Step-by-step instructions
   - Tips and common mistakes
   - "Add to Workout" button

4. **Create RecentExercises Component**
   - Location: `frontend/src/components/exercises/RecentExercises.tsx`
   - Display last 10 used exercises
   - Quick add buttons
   - Grouped by date

5. **Create FavoriteExercises Component**
   - Location: `frontend/src/components/exercises/FavoriteExercises.tsx`
   - List of favorited exercises
   - Filter by muscle group
   - Quick add buttons

### Backend Tasks
1. **Exercise Endpoints** (Already exist from Epic 004)
   ```typescript
   // GET /api/exercises
   interface GetExercisesQuery {
     search?: string;
     bodyPart?: string;
     equipment?: string;
     difficulty?: string;
     page?: number;
     limit?: number;
   }
   ```

2. **Workout Exercise Endpoints**
   ```typescript
   // POST /api/programs/workouts/:workoutId/exercises
   interface AddExerciseDto {
     exerciseId: string;
     orderIndex: number;
     supersetGroup?: string;
     setsConfig?: any;
     notes?: string;
   }

   // PUT /api/programs/exercises/:exerciseId
   interface UpdateExerciseDto {
     orderIndex?: number;
     supersetGroup?: string;
     notes?: string;
   }

   // DELETE /api/programs/exercises/:exerciseId
   ```

3. **Bulk Operations**
   ```typescript
   // POST /api/programs/workouts/:workoutId/exercises/bulk
   interface BulkAddExercisesDto {
     exerciseIds: string[];
   }

   // POST /api/programs/workouts/:workoutId/exercises/reorder
   interface ReorderExercisesDto {
     exerciseOrder: Array<{
       exerciseId: string;
       orderIndex: number;
     }>;
   }
   ```

4. **Exercise Usage Tracking**
   ```typescript
   // Track when exercises are used
   interface ExerciseUsage {
     userId: string;
     exerciseId: string;
     context: 'program' | 'workout' | 'viewed';
     usedAt: Date;
   }
   ```

### Data Models
```typescript
interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  exercise: Exercise;
  orderIndex: number;
  supersetGroup?: string;
  setsConfig: SetsConfig;
  notes?: string;
  createdAt: Date;
  configurations: ExerciseConfiguration[];
}

interface Exercise {
  id: string;
  exerciseId: string;
  name: string;
  gifUrl: string;
  bodyPart: string;
  equipment: string;
  targetMuscle: string;
  secondaryMuscles: string[];
  instructions: string[];
  difficulty: DifficultyLevel;
  searchVector?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SetsConfig {
  warmupSets?: number;
  workingSets?: number;
  dropSets?: number;
  pyramidSets?: number;
}

interface ExerciseUsage {
  id: string;
  userId: string;
  exerciseId: string;
  context: string;
  usedAt: Date;
}
```

## Test Cases
1. **Happy Path**
   - Open workout "Upper Body A"
   - Click "Add Exercises"
   - Search for "bench press"
   - View details and confirm correct exercise
   - Click "Add to Workout"
   - Search for "barbell row"
   - Add to workout
   - Filter by "back" muscle group
   - Add "pull-ups" from list
   - Close picker
   - All 3 exercises shown in workout

2. **Filtering**
   - Select body part: "chest"
   - Only chest exercises shown
   - Select equipment: "barbell"
   - Only barbell chest exercises shown
   - Clear filters
   - All exercises shown again

3. **Multi-Select**
   - Enable multi-select mode
   - Select 5 exercises
   - Click "Add Selected (5)"
   - All 5 exercises added to workout
   - Order preserved from selection

4. **Reordering**
   - Drag exercise 3 to position 1
   - Order updates: 3, 1, 2
   - Use move up/down buttons
   - Order updates correctly

5. **Recent Exercises**
   - Recently used "squats" appears in list
   - Click to add immediately
   - Exercise added without opening picker

6. **Favorites**
   - Star "deadlift" as favorite
   - Appears in favorites list
   - Filter favorites by "legs"
   - Only leg exercises shown

## UI/UX Mockups
```
+----------------------------------------------------------+
|  Upper Body A - Monday                    [← Back]       |
|  Exercises: 3                                          |
+----------------------------------------------------------+
|  1. Barbell Bench Press                [View] [↑] [↓] [×]|
|     Chest • Barbell • Intermediate                        |
|     Sets: 3 | Reps: 8-10 | Rest: 90s                     |
|     [+ Duplicate]                                        |
|     --------------------------------------------------    |
|  2. Bent Over Barbell Row              [View] [↑] [↓] [×]|
|     Back • Barbell • Intermediate                         |
|     Sets: 3 | Reps: 8-10 | Rest: 90s                     |
|     [+ Duplicate]                                        |
|     --------------------------------------------------    |
|  3. Overhead Barbell Press               [View] [↑] [↓] [×]|
|     Shoulders • Barbell • Intermediate                   |
|     Sets: 3 | Reps: 8-10 | Rest: 90s                     |
|     [+ Duplicate]                                        |
|                                                          |
|  [+ Add Exercises]                                       |
|                                                          |
|  Recent: [Squat] [Deadlift] [Pull-up] [+ More]           |
|  Favorites: [Bench Press] [Rows] [+ More]               |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Add Exercises to Workout                    [× Close]  |
+----------------------------------------------------------+
|  Search exercises...                              🔍     |
+----------------------------------------------------------+
|  Filters                                            [Reset]|
|  +--------------------------------------------------+    |
|  | Body Part                                        |    |
|  | [✓] Chest  [ ] Back  [✓] Shoulders  [ ] Arms    |    |
|  | [ ] Legs  [ ] Core  [ ] Full Body                |    |
|  +--------------------------------------------------+    |
|  +--------------------------------------------------+    |
|  | Equipment                                        |    |
|  | [✓] Barbell  [ ] Dumbbell  [ ] Machine          |    |
|  | [ ] Cable  [ ] Bodyweight  [ ] Kettlebell        |    |
|  +--------------------------------------------------+    |
|  +--------------------------------------------------+    |
|  | Difficulty                                       |    |
|  | [ ] Beginner  [✓] Intermediate  [ ] Advanced     |    |
|  +--------------------------------------------------+    |
|                                                          |
|  Results: 24 exercises                       [Grid ▼]     |
|  +---------------+  +---------------+  +---------------+  |
|  | [Image]       |  | [Image]       |  | [Image]       |  |
|  | Bench Press   |  | Incline Press|  | Dumbbell Fly |  |
|  | Chest         |  | Chest         |  | Chest         |  |
|  | Barbell       |  | Dumbbell      |  | Dumbbell      |  |
|  | ★ Intermediate|  | ★ Intermediate|  | ★ Beginner    |  |
|  | [+] [Quick Add]|  | [+] [Quick Add]|  | [+] [Quick Add]|  |
|  +---------------+  +---------------+  +---------------+  |
|  +---------------+  +---------------+  +---------------+  |
|  | [Image]       |  | [Image]       |  | [Image]       |  |
|  | Dips          |  | Push-ups      |  | Cable Crossover|
|  | Chest         |  | Chest         |  | Chest         |  |
|  | Bodyweight    |  | Bodyweight    |  | Cable         |  |
|  | ★ Advanced    |  | ★ Beginner    |  | ★ Intermediate|  |
|  | [+] [Quick Add]|  | [+] [Quick Add]|  | [+] [Quick Add]|  |
|  +---------------+  +---------------+  +---------------+  |
|                                                          |
|  ☑ Multi-select mode (3 selected)                        |
|  [Load More...]                                          |
|                                    [Add Selected (3) →] |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Exercise Preview: Barbell Bench Press      [× Close]   |
+----------------------------------------------------------+
|  +------------------+                                    |
|  |   [GIF Image]    |                                    |
|  |   Playing...     |                                    |
|  +------------------+                                    |
|                                                          |
|  Target Muscle: Primary Chest                            |
|  Secondary: Front Delts, Triceps                         |
|  Equipment: Barbell, Bench                               |
|  Difficulty: ★★☆ Intermediate                            |
|                                                          |
|  Instructions:                                           |
|  1. Lie flat on bench, grip bar slightly wider than      |
|     shoulder-width                                       |
|  2. Unrack bar and lower to mid-chest                    |
|  3. Press up until arms are fully extended               |
|  4. Control the descent                                  |
|                                                          |
|  Common Mistakes:                                        |
|  • Bouncing the bar off chest                            |
|  • Flaring elbows too far (90° max)                      |
|  • Lifting hips off bench                                |
|                                                          |
|  [★ Add to Favorites]  [+ Add to Workout]               |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Recent Exercises                              [× Close] |
+----------------------------------------------------------+
|  Today (3)                                               |
|  +-------------------+  +-------------------+             |
|  | Barbell Squat      |  | Bench Press       |             |
|  | Legs               |  | Chest             |             |
|  | [+ Quick Add]      |  | [+ Quick Add]      |             |
|  +-------------------+  +-------------------+             |
|                                                          |
|  Yesterday (5)                                           |
|  +-------------------+  +-------------------+             |
|  | Deadlift           |  | Pull-up           |             |
|  | Back               |  | Back              |             |
|  | [+ Quick Add]      |  | [+ Quick Add]      |             |
|  +-------------------+  +-------------------+             |
|                                                          |
|  This Week (12)                            [View All →]  |
+----------------------------------------------------------+
```

## Dependencies
- Story 005-02: Build Weekly Structure (workouts must exist)
- Epic 004: Exercise Library (exercises must be loaded)
- Exercise API endpoints
- Exercise favorites tracking

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Exercise picker fully functional
- [ ] Search and filtering working
- [ ] Multi-select mode operational
- [ ] Exercise preview modal working
- [ ] Recent exercises tracked and displayed
- [ ] Favorites integration working
- [ ] Exercise reordering (drag-and-drop)
- [ ] Exercise duplication
- [ ] Bulk add operations
- [ ] API endpoints tested
- [ ] Integration tests for exercise operations
- [ ] Performance: search < 300ms
- [ ] Mobile responsive
- [ ] Code reviewed and approved

## Notes
**Status: PARTIALLY IMPLEMENTED**

Backend infrastructure is complete:
- Database schema includes WorkoutExercise model
- Exercise management from Epic 004
- Exercise usage tracking model exists
- API endpoints for exercise operations

Frontend implementation still needed:
- Exercise picker UI with search/filters
- Exercise preview modal
- Recent exercises component
- Favorites integration
- Drag-and-drop reordering
- Bulk operations
- Mobile responsive design

This is a high-frequency operation, so performance is critical. Consider implementing:
- Virtual scrolling for large exercise lists
- Caching of filtered results
- Quick-add buttons for power users
- Keyboard shortcuts (e.g., 'a' to add, 'f' for favorites)

The exercise picker should feel snappy and responsive, as trainers will be adding many exercises to each workout.
