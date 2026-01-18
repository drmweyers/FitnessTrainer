# Story 004-01: Browse Exercise Library

**Parent Epic**: [EPIC-004 - Exercise Library Management](../epics/epic-004-exercise-library.md)
**Story ID**: STORY-004-01
**Priority**: P0 (Critical)
**Story Points**: 8
**Sprint**: Sprint 3

## User Story
**As a** trainer
**I want to** browse the exercise library
**So that I** can discover new exercises for my programs

## Acceptance Criteria
- [ ] Grid view with exercise cards showing GIF previews
- [ ] List view with compact exercise information
- [ ] Infinite scroll or pagination (50 exercises per page)
- [ ] Loading states for GIFs with placeholders
- [ ] Hover to preview animation
- [ ] Click to view full details
- [ ] Performance: <2s initial page load
- [ ] Responsive design for mobile/tablet/desktop
- [ ] View toggle (grid/list)
- [ ] Exercise count display

## Technical Implementation

### Frontend Tasks
1. **Create ExerciseLibrary Component**
   - Main library container
   - View toggle (grid/list)
   - Exercise count display
   - Loading skeleton
   - Error handling

2. **Create ExerciseGrid Component**
   - Responsive grid layout
   - ExerciseCard components
   - Lazy loading optimization
   - Virtual scrolling for performance

3. **Create ExerciseList Component**
   - Compact list layout
   - ExerciseListItem components
   - Sortable columns
   - Quick actions

4. **Create ExerciseCard Component**
   - GIF thumbnail with play button overlay
   - Exercise name
   - Body part tag
   - Equipment icon
   - Target muscle badge
   - Favorite toggle
   - Hover animation preview

5. **Create ExerciseListItem Component**
   - Exercise name
   - Small thumbnail
   - Body part, equipment, target muscle
   - Quick add to workout
   - Favorite toggle

6. **Implement Lazy Loading**
   - Use Intersection Observer API
   - Load GIFs on demand
   - Placeholder while loading
   - Preload next batch

### Backend Tasks
1. **Create Exercise Endpoints**
   ```typescript
   GET /api/exercises - Get paginated exercises
   GET /api/exercises/:id - Get exercise details
   GET /api/exercises/count - Get total count
   GET /api/exercises/categories - Get unique categories
   ```

2. **Implement ExerciseService**
   ```typescript
   class ExerciseService {
     async getExercises(page: number, limit: number)
     async getExerciseById(id: string)
     async getTotalCount()
     async getCategories()
     async searchExercises(query: string)
   }
   ```

3. **Exercise Database Import**
   ```typescript
   // Import script to load 1324 exercises from JSON
   async function importExercisesFromJSON() {
     const exercises = await loadExerciseJSON();
     for (const exercise of exercises) {
       await prisma.exercise.create({
         data: {
           exerciseId: exercise.id,
           name: exercise.name,
           gifUrl: exercise.gifUrl,
           bodyPart: exercise.bodyPart,
           equipment: exercise.equipment,
           targetMuscle: exercise.target,
           secondaryMuscles: exercise.secondaryMuscles,
           instructions: exercise.instructions
         }
       });
     }
   }
   ```

4. **Create exercises Table**
   ```sql
   CREATE TABLE exercises (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     exercise_id VARCHAR(50) UNIQUE,
     name VARCHAR(255) NOT NULL,
     gif_url VARCHAR(500),
     body_part VARCHAR(100),
     equipment VARCHAR(100),
     target_muscle VARCHAR(100),
     secondary_muscles TEXT[],
     instructions TEXT[],
     search_vector tsvector,
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_exercises_name ON exercises USING gin(to_tsvector('english', name));
   CREATE INDEX idx_exercises_body_part ON exercises(body_part);
   CREATE INDEX idx_exercises_equipment ON exercises(equipment);
   CREATE INDEX idx_exercises_target_muscle ON exercises(target_muscle);
   ```

### Data Models
```typescript
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
  createdAt: Date;
}

interface ExerciseListResponse {
  exercises: Exercise[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

## Test Cases
1. **Load Exercise Library**
   - Navigate to exercise library
   - Verify grid view loads
   - Verify exercises displayed
   - Verify GIF thumbnails load
   - Verify exercise count shown

2. **Toggle View**
   - Click "List View"
   - Verify list layout displays
   - Click "Grid View"
   - Verify grid layout restored

3. **Infinite Scroll**
   - Scroll to bottom of page
   - Verify next exercises load automatically
   - Repeat until all exercises loaded
   - Verify no duplicates

4. **Performance**
   - Test initial page load time
   - Verify <2 seconds
   - Test GIF loading performance
   - Verify placeholders shown during load

5. **Hover Preview**
   - Hover over exercise card
   - Verify GIF animation plays
   - Move mouse away
   - Verify animation stops

6. **Mobile Responsiveness**
   - Test on mobile device
   - Verify grid adapts to screen size
   - Test list view on mobile
   - Verify touch targets adequate

## UI/UX Mockups
```
+------------------------------------------+
|  Exercise Library                        |
|  [🔍 Search]  [⚙️ Filters]  [❤️ Favorites]|
|                                          |
|  Showing 1-50 of 1,324 exercises         |
|  [Grid █] [List ≡]                       |
|                                          |
|  +----------+  +----------+  +----------+ |
|  |   GIF    |  |   GIF    |  |   GIF    | |
|  |Thumbnail |  |Thumbnail |  |Thumbnail | |
|  |  [▶]    |  |  [▶]    |  |  [▶]    | |
|  +----------+  +----------+  +----------+ |
|  | Barbell  |  | Bench   |  | Bent    | |
|  | Bench    |  | Press   |  | Over    | |
|  | Press    |  |         |  | Row     | |
|  +----------+  +----------+  +----------+ |
|  | Chest 💪 |  | Chest 💪 |  | Back 🔙 | |
|  | Barbell  |  | Barbell  |  | Barbell  | |
|  |          |  |          |  |         | |
|  | [❤️]    |  | [❤️]    |  | [🤍]    | |
|  +----------+  +----------+  +----------+ |
|                                          |
|  [Load More...]                          |
+------------------------------------------+
```

```
+------------------------------------------+
|  Exercise Library                        |
|  [Grid █] [List ≡]                       |
|                                          |
|  +----------------------------------+    |
|  | [GIF] | Barbell Bench Press     |    |
|  | 50x50 | Chest 💪  Barbell        |    |
|  |       | Primary: Pectoralis      |    |
|  | [❤️]  | [Add to Workout] [View]  |    |
|  +----------------------------------+    |
|  | [GIF] | Incline Dumbbell Press   |    |
|  | 50x50 | Chest 💪  Dumbbell        |    |
|  |       | Primary: Pectoralis      |    |
|  | [🤍]  | [Add to Workout] [View]  |    |
|  +----------------------------------+    |
|  | [GIF] | Bent Over Row            |    |
|  | 50x50 | Back 🔙  Barbell          |    |
|  |       | Primary: Latissimus      |    |
|  |       | Dorsi                    |    |
|  | [🤍]  | [Add to Workout] [View]  |    |
|  +----------------------------------+    |
|                                          |
+------------------------------------------+
```

## Dependencies
- EPIC-002 (Authentication) must be completed
- Exercise database JSON files must be available
- CDN or storage for GIF hosting
- PostgreSQL with full-text search support

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Exercise data imported (1,324 exercises)
- [ ] Grid and list views working
- [ ] Infinite scroll functional
- [ ] Performance benchmarks met (<2s load)
- [ ] Mobile responsive design verified
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests for API endpoints
- [ ] Exercise import script tested
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
- Implementation Status: Not Started
- Exercise database source: https://github.com/yuhonas/Free-Fitness-apis
- 1,324 total exercises with GIFs
- Optimize GIF loading with lazy loading and placeholders
- Consider using CDN for GIF delivery
- Cache frequently accessed exercises in Redis
- Implement virtual scrolling for performance
- Test with slow 3G connections
