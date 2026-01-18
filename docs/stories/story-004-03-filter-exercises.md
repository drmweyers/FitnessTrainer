# Story 004-03: Filter Exercises

**Parent Epic**: [EPIC-004 - Exercise Library Management](../epics/epic-004-exercise-library.md)
**Story ID**: STORY-004-03
**Priority**: P1 (High)
**Story Points**: 5
**Sprint**: Sprint 3

## User Story
**As a** trainer
**I want to** filter exercises by multiple criteria
**So that I** can find exercises matching specific requirements

## Acceptance Criteria
- [ ] Filter by body part (10 categories)
- [ ] Filter by equipment (28 types)
- [ ] Filter by target muscle (150+ groups)
- [ ] Multiple selections per filter category
- [ ] Active filter badges with remove option
- [ ] Clear individual or all filters
- [ ] Real-time result count updates
- [ ] Filter combination persistence (URL params)
- [ ] Filter presets for common combinations
- [ ] Performance: <300ms for filter updates

## Technical Implementation

### Frontend Tasks
1. **Create ExerciseFilters Component**
   - Collapsible filter panel
   - Multiple filter sections
   - Checkbox groups for selections
   - Clear all button
   - Apply button

2. **Create FilterSection Component**
   - Body part filter (checkboxes)
   - Equipment filter (checkboxes with icons)
   - Target muscle filter (searchable list)
   - Expandable/collapsible sections

3. **Create ActiveFilters Component**
   - Display selected filters as badges
   - Individual remove buttons
   - Clear all button
   - Filter count

4. **Create FilterPresets Component**
   - Predefined filter combinations
   - "Upper Body" preset
   - "Lower Body" preset
   - "No Equipment" preset
   - "Full Body" preset
   - Custom preset creation

5. **Implement URL State Management**
   - Sync filters with URL parameters
   - Share filterable URLs
   - Back/forward navigation support
   - Bookmark support

### Backend Tasks
1. **Create Filter Endpoints**
   ```typescript
   GET /api/exercises/filters - Get available filter options
   GET /api/exercises?bodyPart=chest,back&equipment=barbell
   GET /api/exercises/presets - Get filter presets
   POST /api/exercises/presets - Create custom preset
   ```

2. **Implement FilterService**
   ```typescript
   class FilterService {
     async getFilters()
     async filterExercises(filters: ExerciseFilters)
     async getPresets(userId: string)
     async createPreset(userId: string, preset: FilterPreset)
   }
   ```

3. **Filter Query Optimization**
   ```sql
   -- Efficient filtering with indexes
   CREATE INDEX idx_exercises_body_part ON exercises(body_part);
   CREATE INDEX idx_exercises_equipment ON exercises(equipment);
   CREATE INDEX idx_exercises_target_muscle ON exercises(target_muscle);

   -- Filter query with multiple criteria
   SELECT * FROM exercises
   WHERE body_part = ANY(:bodyParts)
     AND equipment = ANY(:equipment)
     AND target_muscle = ANY(:targetMuscles)
   ORDER BY name ASC
   LIMIT 50;
   ```

4. **Create Filter Presets Table**
   ```sql
   CREATE TABLE exercise_filter_presets (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     preset_name VARCHAR(255),
     filters JSONB,
     is_public BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

### Data Models
```typescript
interface ExerciseFilters {
  bodyParts?: string[];
  equipment?: string[];
  targetMuscles?: string[];
}

interface FilterOptions {
  bodyParts: string[];
  equipment: string[];
  targetMuscles: string[];
}

interface FilterPreset {
  id: string;
  userId: string;
  presetName: string;
  filters: ExerciseFilters;
  isPublic: boolean;
  createdAt: Date;
}

// Filter category data
const BODY_PARTS = [
  'back', 'cardio', 'chest', 'lower arms',
  'lower legs', 'neck', 'shoulders', 'upper arms',
  'upper legs', 'waist'
];

const EQUIPMENT = [
  'assisted', 'band', 'barbell', 'body weight',
  'bosu ball', 'cable', 'dumbbell', 'elliptical',
  'ez barbell', 'hammer', 'kettlebell', 'leverage machine',
  'medicine ball', 'olympic barbell', 'resistance band',
  'roller', 'rope', 'skierg machine', 'sled machine',
  'smith machine', 'stability ball', 'stepmill machine',
  'tires', 'trap bar', 'upper body ergometer',
  'weighted', 'wheel roller'
];

const TARGET_MUSCLES = [
  'abs', 'biceps', 'brachialis', 'brachioradialis',
  'cardiovascular system', 'delts', 'forearms', 'glutes',
  'hamstrings', 'lats', 'levator scapulae', 'obliques',
  'pectorals', 'quads', 'serratus anterior', 'spine',
  'traps', 'triceps', 'upper back'
];
```

## Test Cases
1. **Single Filter**
   - Select "Chest" body part
   - Verify results update
   - Verify only chest exercises shown
   - Verify result count accurate

2. **Multiple Filters**
   - Select "Chest" body part
   - Select "Barbell" equipment
   - Verify only chest barbell exercises shown
   - Verify result count accurate

3. **Multiple Selections in Category**
   - Select "Chest" and "Back" body parts
   - Verify exercises from both shown
   - Verify result count accurate

4. **Clear Individual Filter**
   - Apply multiple filters
   - Click "X" on one filter badge
   - Verify that filter removed
   - Verify results update

5. **Clear All Filters**
   - Apply multiple filters
   - Click "Clear All"
   - Verify all filters removed
   - Verify all exercises shown

6. **Filter Presets**
   - Click "Upper Body" preset
   - Verify appropriate filters applied
   - Verify results correct
   - Create custom preset
   - Verify preset saved

7. **URL Persistence**
   - Apply filters
   - Copy URL
   - Open in new tab
   - Verify filters preserved

8. **Performance**
   - Apply complex filter combination
   - Verify results update <300ms
   - Test with all filters selected

## UI/UX Mockups
```
+------------------------------------------+
|  Exercise Library                        |
|  [━━━━━━━━━━━━━━━━━━━━] [🔍] [⚙️]        |
|                                          |
|  Active Filters:                         |
|  [Chest ×] [Barbell ×] [Abs ×] [Clear]   |
|                                          |
|  48 results                              |
|                                          |
|  +----------+  +----------+              |
|  |   GIF    |  |   GIF    |              |
|  +----------+  +----------+              |
|                                          |
+------------------------------------------+
|  Filters                      [Apply]    |
|  +--------------------------------------+ |
|  | ▼ Body Part (10)                    | |
|  | ☑ Chest  ☑ Back  ☑ Shoulders       | |
|  | ☐ Arms    ☐ Legs   ☐ Cardio         | |
|  |                                      | |
|  | ▼ Equipment (28)                    | |
|  | ☑ Barbell  ☐ Dumbbell  ☐ Cable      | |
|  | ☐ Body Weight  ☐ Kettlebell         | |
|  |                                      | |
|  | ▶ Target Muscle (150+)              | |
|  |                                      | |
|  | Presets: [Upper Body] [Lower Body]   | |
|  |         [No Equipment] [Full Body]   | |
|  +--------------------------------------+ |
+------------------------------------------+
```

```
+------------------------------------------+
|  Filter Presets                          |
+------------------------------------------+
|                                          |
|  Quick Presets:                          |
|  +----------------------------------+    |
|  | Upper Body (Chest, Back, Arms)   |    |
|  +----------------------------------+    |
|  +----------------------------------+    |
|  | Lower Body (Legs, Glutes)        |    |
|  +----------------------------------+    |
|  +----------------------------------+    |
|  | No Equipment (Body weight only)  |    |
|  +----------------------------------+    |
|  +----------------------------------+    |
|  | Core (Abs, Obliques)             |    |
|  +----------------------------------+    |
|                                          |
|  Your Custom Presets:                    |
|  +----------------------------------+    |
|  | Push Day (Chest, Shoulders, Triceps)||
|  +----------------------------------+    |
|                                          |
|  [+ Create New Preset]                   |
+------------------------------------------+
```

## Dependencies
- STORY-004-01 (Browse Exercise Library) must be completed
- STORY-004-02 (Search Exercises) must be completed
- Exercise database must be imported

## Definition of Done
- [ ] All acceptance criteria met
- [ ] All filter categories working
- [ ] Multiple filter selections working
- [ ] Active filter badges functional
- [ ] Filter presets implemented
- [ ] URL persistence working
- [ ] Performance benchmarks met (<300ms)
- [ ] Mobile responsive design verified
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests for filter endpoints
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
- Implementation Status: Not Started
- Filters should work in combination with search
- Consider adding advanced filters (difficulty level, movement pattern)
- Filter presets can be user-specific or global
- URL params enable shareable filtered views
- Mobile: Consider bottom sheet for filters
- Cache filter results for better performance
- Track popular filter combinations
- Consider adding "exclude" filters
