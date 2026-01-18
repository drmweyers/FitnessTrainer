# Story 004-06: Exercise Collections

**Parent Epic**: [EPIC-004 - Exercise Library Management](../epics/epic-004-exercise-library.md)
**Story ID**: STORY-004-06
**Priority**: P2 (Medium)
**Story Points**: 5
**Sprint**: Sprint 4

## User Story
**As a** trainer
**I want to** create exercise collections
**So that I** can organize exercises for specific purposes

## Acceptance Criteria
- [ ] Create named collections with descriptions
- [ ] Add/remove exercises from collections
- [ ] Collection templates (e.g., "Upper Body", "No Equipment")
- [ ] Duplicate collections
- [ ] Delete collections with confirmation
- [ ] Reorder exercises within collections
- [ ] Share collections (future - placeholder)
- [ ] Bulk add exercises to collections
- [ ] Collection search functionality
- [ ] Visual collection cards

## Technical Implementation

### Frontend Tasks
1. **Create CollectionManager Component**
   - List of all collections
   - Create new collection button
   - Collection cards grid
   - Search/filter collections
   - Empty state

2. **Create CollectionForm Component**
   - Collection name input
   - Description textarea
   - Template selection
   - Color/icon picker
   - Create/update buttons

3. **Create CollectionDetail Component**
   - Collection header (name, description, stats)
   - Exercises in collection
   - Add exercises interface
   - Reorder exercises (drag-and-drop)
   - Bulk actions
   - Edit collection button
   - Delete collection button

4. **Create CollectionCard Component**
   - Collection name
   - Exercise count
   - Description preview
   - Thumbnail grid of exercises
   - Quick actions (edit, delete, duplicate)
   - Collection color/icon

5. **Create AddToCollectionDialog Component**
   - Multi-select exercises
   - Collection selector
   - Create new collection option
   - Bulk add functionality

6. **Implement Drag-and-Drop Reordering**
   - Use react-beautiful-dnd or dnd-kit
   - Visual feedback during drag
   - Save new order automatically

### Backend Tasks
1. **Create Collection Endpoints**
   ```typescript
   GET /api/exercises/collections - Get all collections
   POST /api/exercises/collections - Create collection
   GET /api/exercises/collections/:id - Get collection details
   PUT /api/exercises/collections/:id - Update collection
   DELETE /api/exercises/collections/:id - Delete collection
   POST /api/exercises/collections/:id/exercises - Add exercise
   DELETE /api/exercises/collections/:id/exercises/:exerciseId - Remove exercise
   PUT /api/exercises/collections/:id/reorder - Reorder exercises
   POST /api/exercises/collections/:id/duplicate - Duplicate collection
   POST /api/exercises/collections/:id/share - Share collection (future)
   ```

2. **Implement CollectionService**
   ```typescript
   class CollectionService {
     async getCollections(userId: string)
     async createCollection(userId: string, data: CreateCollectionDto)
     async getCollection(collectionId: string, userId: string)
     async updateCollection(collectionId: string, data: UpdateCollectionDto)
     async deleteCollection(collectionId: string, userId: string)
     async addExercise(collectionId: string, exerciseId: string)
     async removeExercise(collectionId: string, exerciseId: string)
     async reorderExercises(collectionId: string, exerciseIds: string[])
     async duplicateCollection(collectionId: string, userId: string)
   }
   ```

3. **Create Tables**
   ```sql
   -- Exercise collections table
   CREATE TABLE exercise_collections (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     name VARCHAR(255) NOT NULL,
     description TEXT,
     color VARCHAR(7) DEFAULT '#3B82F6',
     icon VARCHAR(50) DEFAULT 'folder',
     is_template BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_collections_user ON exercise_collections(user_id, created_at DESC);

   -- Collection exercises junction table
   CREATE TABLE collection_exercises (
     collection_id UUID REFERENCES exercise_collections(id) ON DELETE CASCADE,
     exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
     position INTEGER NOT NULL,
     added_at TIMESTAMP DEFAULT NOW(),
     PRIMARY KEY (collection_id, exercise_id)
   );

   CREATE INDEX idx_collection_exercises ON collection_exercises(collection_id, position);
   ```

4. **Create Collection Templates**
   ```sql
   -- Insert default templates
   INSERT INTO exercise_collections (user_id, name, description, is_template, icon, color) VALUES
     (NULL, 'Upper Body', 'Chest, back, and shoulder exercises', true, 'dumbbell', '#EF4444'),
     (NULL, 'Lower Body', 'Leg and glute exercises', true, 'activity', '#F59E0B'),
     (NULL, 'Core', 'Abdominal and lower back exercises', true, 'target', '#10B981'),
     (NULL, 'No Equipment', 'Bodyweight exercises only', true, 'person', '#6366F1'),
     (NULL, 'Full Body', 'Complete workout exercises', true, 'fitness_center', '#8B5CF6');
   ```

### Data Models
```typescript
interface CreateCollectionDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

interface UpdateCollectionDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

interface ExerciseCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isTemplate: boolean;
  exerciseCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CollectionExercise {
  exerciseId: string;
  exercise: Exercise;
  position: number;
  addedAt: Date;
}

interface CollectionDetail extends ExerciseCollection {
  exercises: CollectionExercise[];
}
```

## Test Cases
1. **Create Collection**
   - Click "New Collection"
   - Enter name "Push Day"
   - Add description
   - Select color and icon
   - Save
   - Verify collection created

2. **Add Exercises to Collection**
   - Open collection
   - Click "Add Exercises"
   - Select exercises from library
   - Click "Add"
   - Verify exercises added

3. **Reorder Exercises**
   - Drag exercise to new position
   - Verify position updates
   - Refresh page
   - Verify order saved

4. **Duplicate Collection**
   - Click "Duplicate" on collection
   - Verify copy created
   - Verify copy has same exercises
   - Verify name appended "(copy)"

5. **Delete Collection**
   - Click "Delete" on collection
   - Verify confirmation dialog
   - Confirm deletion
   - Verify collection removed

6. **Use Template**
   - Click "New Collection"
   - Select "Upper Body" template
   - Name collection "My Upper Body"
   - Save
   - Verify template exercises included

7. **Bulk Add to Collection**
   - Select multiple exercises from library
   - Click "Add to Collection"
   - Select collection
   - Verify all exercises added

8. **Collection Search**
   - Type "push" in search
   - Verify matching collections shown
   - Clear search
   - Verify all collections shown

## UI/UX Mockups
```
+------------------------------------------+
|  Exercise Collections         [+ New]    |
+------------------------------------------+
|                                          |
|  [━━━━━━━━━━━━━━━━━━━━━━━━] [🔍]         |
|                                          |
|  +----------------------------------+    |
|  | Push Day                   [⋮]    |    |
|  | 12 exercises    [🏋️️]  Upper Body |    |
|  | Chest, shoulders, triceps     |    |
|  | [Edit] [Duplicate] [Delete]   |    |
|  +----------------------------------+    |
|                                          |
|  +----------------------------------+    |
|  | Pull Day                   [⋮]    |    |
|  | 10 exercises    [💪]  Back      |    |
|  | Back, biceps, rear delts       |    |
|  | [Edit] [Duplicate] [Delete]   |    |
|  +----------------------------------+    |
|                                          |
|  +----------------------------------+    |
|  | No Equipment Gym         [⋮]    |    |
|  | 8 exercises     [🏃]  Bodyweight|    |
|  | Full body workout              |    |
|  | [Edit] [Duplicate] [Delete]   |    |
|  +----------------------------------+    |
|                                          |
+------------------------------------------+
```

```
+------------------------------------------+
|  Push Day                     [Edit] [⋮] |
+------------------------------------------+
|                                          |
|  Chest, shoulders, triceps               |
|  12 exercises                            |
|                                          |
|  [+ Add Exercises]                       |
|                                          |
|  1. [≡] Barbell Bench Press    [Remove]  |
|  2. [≡] Incline Dumbbell Press [Remove]  |
|  3. [≡] Dumbbell Flys           [Remove]  |
|  4. [≡] Overhead Press          [Remove]  |
|  5. [≡] Lateral Raises           [Remove]  |
|  6. [≡] Front Raises            [Remove]  |
|  7. [≡] Rear Delt Flys          [Remove]  |
|  8. [≡] Tricep Pushdown         [Remove]  |
|  9. [≡] Overhead Tricep Ext.     [Remove]  |
|  10. [≡] Dumbbell Kickbacks     [Remove]  |
|  11. [≡] Dips                    [Remove]  |
|  12. [≡] Push-ups                [Remove]  |
|                                          |
|  [Save Order]                            |
+------------------------------------------+
```

```
+------------------------------------------+
|  New Collection               [Cancel]   |
+------------------------------------------+
|                                          |
|  Collection Name *                       |
|  [_____________________________]         |
|                                          |
|  Description                             |
|  [_________________________________]     |
|  [_________________________________]     |
|                                          |
|  Start with template:                    |
|  ○ None  ● Upper Body  ○ Lower Body     |
|  ○ Core  ○ No Equipment  ○ Full Body   |
|                                          |
|  Color and Icon:                         |
|  [🔴] [🟠] [🟡] [🟢] [🔵] [🟣]           |
|  [🏋️️] [💪] [🏃] [🎯] [⭐] [⚡]          |
|                                          |
|  [  Create Collection  ]                |
+------------------------------------------+
```

## Dependencies
- STORY-004-01 (Browse Exercise Library) must be completed
- STORY-004-04 (View Exercise Details) must be completed
- Exercise database must be imported

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Collection CRUD operations working
- [ ] Add/remove exercises functional
- [ ] Drag-and-drop reordering working
- [ ] Templates available
- [ ] Duplicate/delete working
- [ ] Bulk add implemented
- [ ] Mobile responsive design verified
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests for API endpoints
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
- Implementation Status: Not Started
- Collections are initially per-user (private)
- Share functionality will be added in future epic
- Consider adding collection permissions (read-only, edit)
- Add collection usage tracking
- Templates can be user-created or system-wide
- Color/icon options help with visual organization
- Collections can be used for quick workout building
- Consider adding smart collection suggestions
- Add collection folders/categories for organization
