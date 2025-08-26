# Story 001: Create Basic Workout

**Parent Epic**: [EPIC-001 - Workout Program Builder & Delivery](../epics/epic-001-workout-program-builder.md)  
**Story ID**: STORY-001  
**Priority**: P0 (Critical)  
**Story Points**: 8  
**Sprint**: Sprint 1  

## User Story
**As a** trainer  
**I want to** create a basic strength training workout  
**So that I** can quickly program for my clients  

## Acceptance Criteria
- [ ] Can add exercises from the exercise library
- [ ] Can set sets, reps, and weight for each exercise
- [ ] Can reorder exercises using drag-and-drop
- [ ] Can save workout as draft
- [ ] Can publish workout to make it active
- [ ] Workout creation takes less than 5 minutes
- [ ] All changes are auto-saved
- [ ] Can preview workout before publishing

## Technical Implementation

### Frontend Tasks
1. **Create WorkoutBuilder Component**
   - Implement drag-and-drop functionality using react-beautiful-dnd
   - Create exercise list with add/remove capabilities
   - Build exercise configuration modal
   - Add auto-save functionality with debouncing

2. **Create ExerciseSelector Component**
   - Build searchable exercise list
   - Implement quick filters (body part, equipment)
   - Add exercise preview on hover
   - Include "Add to Workout" button

3. **Create WorkoutExerciseCard Component**
   - Display exercise name and thumbnail
   - Show sets/reps/weight inputs
   - Add drag handle for reordering
   - Include remove button
   - Implement inline editing

### Backend Tasks
1. **Create Workout Endpoints**
   ```typescript
   POST /api/workouts - Create new workout
   PUT /api/workouts/:id - Update existing workout
   GET /api/workouts/:id - Get workout details
   DELETE /api/workouts/:id - Delete workout
   ```

2. **Implement WorkoutService**
   ```typescript
   class WorkoutService {
     async createWorkout(data: CreateWorkoutDto, trainerId: string)
     async updateWorkout(id: string, data: UpdateWorkoutDto, trainerId: string)
     async getWorkout(id: string, trainerId: string)
     async deleteWorkout(id: string, trainerId: string)
   }
   ```

3. **Database Schema Updates**
   - Ensure `workouts` table exists
   - Create `workout_exercises` junction table
   - Add proper indexes for performance

### Data Models
```typescript
interface Workout {
  id: string;
  trainerId: string;
  clientId?: string;
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  orderIndex: number;
  sets: number;
  reps: string; // Can be range like "8-12"
  weight?: string;
  restSeconds?: number;
  notes?: string;
}
```

## Test Cases
1. **Happy Path**
   - Create new workout
   - Add 5 exercises
   - Configure sets/reps for each
   - Reorder exercises
   - Save as draft
   - Publish workout

2. **Edge Cases**
   - Empty workout validation
   - Maximum exercises limit (if any)
   - Invalid input handling
   - Network failure during save
   - Concurrent editing (future)

3. **Performance Tests**
   - Load time with 50+ exercises
   - Auto-save performance
   - Drag-and-drop responsiveness

## UI/UX Mockups
```
+----------------------------------+
|  New Workout                     |
|  [Workout Name_______________]   |
|                                  |
|  Exercises (3)          [+ Add]  |
|  +----------------------------+ |
|  | [≡] Barbell Squat         | |
|  |     3 sets × 8-10 reps × __ | |
|  |     Rest: 90s      [Remove] | |
|  +----------------------------+ |
|  | [≡] Bench Press           | |
|  |     3 sets × 8-10 reps × __ | |
|  |     Rest: 90s      [Remove] | |
|  +----------------------------+ |
|  | [≡] Bent Over Row         | |
|  |     3 sets × 8-10 reps × __ | |
|  |     Rest: 60s      [Remove] | |
|  +----------------------------+ |
|                                  |
|  [Save Draft]  [Publish]  [Cancel] |
+----------------------------------+
```

## Dependencies
- Exercise database must be loaded
- Authentication system must be working
- Drag-and-drop library installed
- Auto-save infrastructure ready

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for API endpoints
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Documentation updated

## Notes
- This is the foundational story for the workout builder
- Keep the UI simple for the first iteration
- Focus on core functionality over advanced features
- Consider mobile responsiveness from the start
