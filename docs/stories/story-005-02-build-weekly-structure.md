# Story 005-02: Build Weekly Structure

**Parent Epic**: [EPIC-005 - Program Builder](../epics/epic-005-program-builder.md)
**Story ID**: STORY-005-02
**Priority**: P0 (Critical)
**Story Points**: 13
**Sprint**: Sprint 5

## User Story
**As a** trainer
**I want to** define the weekly workout structure
**So that** clients have a clear training schedule

## Acceptance Criteria
- [ ] Can view weekly timeline for entire program duration
- [ ] Can add workouts to specific days
- [ ] Can designate rest days
- [ ] Can name workouts (e.g., "Upper Body A", "Leg Day")
- [ ] Can copy workouts to other days
- [ ] Can copy entire weeks to other weeks
- [ ] Can delete workouts and days
- [ ] Can drag-and-drop workouts to reorder
- [ ] Can set workout type (strength, cardio, HIIT, etc.)
- [ ] Can set estimated duration per workout
- [ ] Visual indicators for rest days
- [ ] Can add workout descriptions
- [ ] Can see workout count per week
- [ ] Can duplicate week structure across program
- [ ] Week numbering displayed clearly
- [ ] Navigation between weeks

## Technical Implementation

### Frontend Tasks
1. **Create WeekBuilder Component**
   - Location: `frontend/src/components/programs/WeekBuilder.tsx`
   - Display weekly calendar view (7 days)
   - Week selector for navigation
   - Add workout button per day
   - Rest day toggle
   - Visual distinction between training and rest days

2. **Create WorkoutCard Component**
   - Location: `frontend/src/components/programs/WorkoutCard.tsx`
   - Display workout name and type
   - Show duration and exercise count
   - Edit button to open workout details
   - Delete button with confirmation
   - Drag handle for reordering

3. **Create WeekNavigator Component**
   - Location: `frontend/src/components/programs/WeekNavigator.tsx`
   - Week selector dropdown
   - Previous/Next week buttons
   - Week overview (workout count, rest days)
   - Copy week to other weeks functionality

4. **Implement Drag-and-Drop**
   - Use react-beautiful-dnd or @dnd-kit
   - Drag workouts between days
   - Reorder workouts within a day
   - Visual feedback during drag
   - Drop zone indicators

### Backend Tasks
1. **Week Management Endpoints**
   ```typescript
   // POST /api/programs/:programId/weeks
   interface CreateWeekDto {
     weekNumber: number;
     name: string;
     description?: string;
     isDeload?: boolean;
   }

   // PUT /api/programs/weeks/:weekId
   interface UpdateWeekDto {
     name?: string;
     description?: string;
     isDeload?: boolean;
   }

   // DELETE /api/programs/weeks/:weekId
   ```

2. **Workout Management Endpoints**
   ```typescript
   // POST /api/programs/weeks/:weekId/workouts
   interface CreateWorkoutDto {
     dayNumber: number; // 1-7 (Monday-Sunday)
     name: string;
     description?: string;
     workoutType?: WorkoutType;
     estimatedDuration?: number;
     isRestDay?: boolean;
   }

   // PUT /api/programs/workouts/:workoutId
   interface UpdateWorkoutDto {
     name?: string;
     description?: string;
     workoutType?: WorkoutType;
     estimatedDuration?: number;
     isRestDay?: boolean;
     dayNumber?: number;
   }

   // DELETE /api/programs/workouts/:workoutId
   ```

3. **Batch Operations**
   ```typescript
   // POST /api/programs/weeks/:weekId/copy
   interface CopyWeekDto {
     targetWeekNumbers: number[];
   }

   // POST /api/programs/workouts/:workoutId/copy
   interface CopyWorkoutDto {
     targetDayNumbers: number[];
   }
   ```

### Data Models
```typescript
interface ProgramWeek {
  id: string;
  programId: string;
  weekNumber: number;
  name: string;
  description?: string;
  isDeload: boolean;
  createdAt: Date;
  workouts: ProgramWorkout[];
}

interface ProgramWorkout {
  id: string;
  programWeekId: string;
  dayNumber: number; // 1 = Monday, 7 = Sunday
  name: string;
  description?: string;
  workoutType?: WorkoutType;
  estimatedDuration?: number; // minutes
  isRestDay: boolean;
  createdAt: Date;
  exercises: WorkoutExercise[];
}

enum WorkoutType {
  strength = 'strength',
  cardio = 'cardio',
  hiit = 'hiit',
  flexibility = 'flexibility',
  mixed = 'mixed',
  recovery = 'recovery'
}
```

## Test Cases
1. **Happy Path**
   - Navigate to Week 1
   - Add workout to Monday: "Upper Body A"
   - Set type: Strength, Duration: 60 min
   - Add workout to Tuesday: "Lower Body A"
   - Set type: Strength, Duration: 60 min
   - Mark Wednesday as rest day
   - Copy Monday workout to Friday
   - Copy Week 1 structure to Weeks 2-4
   - All weeks populated correctly

2. **Drag-and-Drop**
   - Drag workout from Monday to Tuesday
   - Workout moves successfully
   - Reorder workouts within Monday
   - Order updates correctly

3. **Rest Days**
   - Toggle rest day on Wednesday
   - Visual indicator shows (grayed out)
   - Cannot add exercises to rest day
   - Untoggle to convert back to training day

4. **Week Copying**
   - Select Week 1
   - Click "Copy to Weeks"
   - Select Weeks 2, 3, 4
   - Confirm copy
   - All 3 weeks have identical structure

5. **Validation**
   - Cannot delete all workouts (need at least 1)
   - Day numbers must be unique within week
   - Duration must be positive number

## UI/UX Mockups
```
+----------------------------------------------------------+
|  12-Week Strength Program                    Week 1 ▼    |
|  [← Previous Week]  [Week 1 of 12]  [Next Week →]       |
+----------------------------------------------------------+
|  Week 1: Foundation                                      |
|  [Copy Week to...]                    [Week Overview]     |
+----------------------------------------------------------+
|                                                          |
|  MONDAY                     TUESDAY                      |
|  +------------------------+  +------------------------+  |
|  | Upper Body A           |  | Lower Body A           |  |
|  | Strength • 60 min      |  | Strength • 60 min      |  |
|  | 0 exercises            |  | 0 exercises            |  |
|  | [Edit] [Copy] [Delete] |  | [Edit] [Copy] [Delete] |  |
|  +≡-----------------------+  +≡-----------------------+  |
|                                                          |
|  WEDNESDAY                   THURSDAY                    |
|  +------------------------+  +------------------------+  |
|  | 🌴 Rest Day            |  | [+ Add Workout]        |  |
|  | No training scheduled  |  |                        |  |
|  | [Remove Rest Day]      |  |                        |  |
|  +------------------------+  +------------------------+  |
|                                                          |
|  FRIDAY                     SATURDAY    SUNDAY          |
|  +------------------------+  +----------+----------+    |
|  | Upper Body B           |  |[+ Workout]|[+ Workout]|    |
|  | Strength • 60 min      |  |          |          |    |
|  | 0 exercises            |  |          |          |    |
|  | [Edit] [Copy] [Delete] |  |          |          |    |
|  +------------------------+  +----------+----------+    |
|                                                          |
|  [← Back to Program]  [Save Changes]                    |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Copy Week Structure                                     |
+----------------------------------------------------------+
|  Copy Week 1 structure to additional weeks:              |
|                                                          |
|  Select target weeks:                                    |
|  [✓] Week 2                                              |
|  [✓] Week 3                                              |
|  [✓] Week 4                                              |
|  [ ] Week 5                                              |
|  [ ] Week 6                                              |
|  [ ] Week 7                                              |
|  [ ] Week 8                                              |
|  [ ] Week 9                                              |
|  [ ] Week 10                                             |
|  [ ] Week 11                                             |
|  [ ] Week 12                                             |
|                                                          |
|  [Select All]  [Clear All]                               |
|                                                          |
|  This will copy 5 workouts to each selected week.        |
|                                                          |
|  [Cancel]  [Copy Structure]                              |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Add Workout                                             |
+----------------------------------------------------------+
|  Day: Monday                                             |
|                                                          |
|  Workout Name *                                          |
|  [_____________________________________]                 |
|                                                          |
|  Workout Type                                            |
|  [ Strength ▼ ] (Cardio, HIIT, Flexibility, etc.)       |
|                                                          |
|  Estimated Duration                                      |
|  [ 60 ] minutes                                          |
|                                                          |
|  Description (optional)                                  |
|  [_____________________________________]                 |
|                                                          |
|  ☑ This is a rest day                                    |
|                                                          |
|  [Cancel]  [Add Workout]                                 |
+----------------------------------------------------------+
```

```
+----------------------------------------------------------+
|  Week Overview - Week 1                                  |
+----------------------------------------------------------+
|  Total Workouts: 5                                       |
|  Rest Days: 2 (Wednesday, Sunday)                        |
|  Total Training Time: 5 hours                            |
|                                                          |
|  Monday: Upper Body A (60 min)                           |
|  Tuesday: Lower Body A (60 min)                          |
|  Wednesday: Rest                                         |
|  Thursday: Upper Body B (60 min)                         |
|  Friday: Lower Body B (60 min)                           |
|  Saturday: Cardio (30 min)                               |
|  Sunday: Rest                                            |
|                                                          |
|  [Close]                                                 |
+----------------------------------------------------------+
```

## Dependencies
- Story 005-01: Create Program (program must exist)
- Database schema with ProgramWeek and ProgramWorkout models
- Week and workout API endpoints

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Weekly builder fully functional
- [ ] Drag-and-drop working smoothly
- [ ] Week copying implemented
- [ ] Workout copying implemented
- [ ] Rest day functionality
- [ ] Week navigation working
- [ ] Week overview modal
- [ ] API endpoints tested
- [ ] Integration tests for week/workout operations
- [ ] Mobile responsive (stack days vertically on mobile)
- [ ] Performance tested with 12-week program
- [ ] Code reviewed and approved

## Notes
**Status: PARTIALLY IMPLEMENTED**

Backend infrastructure is complete:
- Database schema includes ProgramWeek and ProgramWorkout models
- Nested creation support in ProgramService
- Week and workout management endpoints created
- Full relationships established

Frontend implementation still needed:
- Week builder UI with weekly calendar view
- Drag-and-drop functionality for workouts
- Week/workout copying interfaces
- Rest day management
- Week navigation and overview
- Mobile responsive layout

This is a critical story for the program builder. The weekly structure provides the framework that trainers will fill with exercises. Focus on intuitive drag-and-drop and quick copy/paste operations to make programming efficient.

Consider implementing keyboard shortcuts (e.g., 'c' to copy, 'v' to paste) for power users.
