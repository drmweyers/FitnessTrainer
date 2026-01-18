# Story 004-05: Favorite Exercises

**Parent Epic**: [EPIC-004 - Exercise Library Management](../epics/epic-004-exercise-library.md)
**Story ID**: STORY-004-05
**Priority**: P1 (High)
**Story Points**: 3
**Sprint**: Sprint 4

## User Story
**As a** trainer
**I want to** save my favorite exercises
**So that I** can quickly access frequently used exercises

## Acceptance Criteria
- [ ] One-click favorite toggle on exercise cards
- [ ] Favorites section in exercise library
- [ ] Sort favorites by date added or usage
- [ ] Bulk unfavorite option
- [ ] Sync across devices
- [ ] Export favorites list
- [ ] Favorite count display
- [ ] Quick access from main navigation
- [ ] Visual indicator for favorited exercises
- [ ] Add favorites from exercise detail view

## Technical Implementation

### Frontend Tasks
1. **Create FavoriteToggle Component**
   - Heart icon button
   - Toggle state (filled/outline)
   - Animation on toggle
   - Loading state

2. **Create FavoritesPage Component**
   - Grid/list view of favorites
   - Sort options (date, name, usage)
   - Filter options
   - Empty state
   - Bulk actions

3. **Create FavoritesList Component**
   - Display favorited exercises
   - Quick actions (unfavorite, add to workout)
   - Date added indicator
   - Usage count

4. **Implement Bulk Actions**
   - Select multiple favorites
   - Bulk unfavorite
   - Bulk add to collection
   - Bulk export

5. **Create ExportDialog Component**
   - Export format selection (CSV, JSON, PDF)
   - Include options (name, muscles, equipment, instructions)
   - Generate and download file

### Backend Tasks
1. **Create Favorite Endpoints**
   ```typescript
   POST /api/exercises/:id/favorite - Add to favorites
   DELETE /api/exercises/:id/favorite - Remove from favorites
   GET /api/exercises/favorites - Get all favorites
   GET /api/exercises/:id/favorite-status - Check if favorited
   POST /api/exercises/favorites/bulk-unfavorite - Bulk remove
   GET /api/exercises/favorites/export - Export favorites
   ```

2. **Implement FavoriteService**
   ```typescript
   class FavoriteService {
     async addFavorite(userId: string, exerciseId: string)
     async removeFavorite(userId: string, exerciseId: string)
     async getFavorites(userId: string, sort?: string)
     async isFavorited(userId: string, exerciseId: string)
     async bulkUnfavorite(userId: string, exerciseIds: string[])
     async exportFavorites(userId: string, format: string)
   }
   ```

3. **Create exercise_favorites Table**
   ```sql
   CREATE TABLE exercise_favorites (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
     favorited_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(user_id, exercise_id)
   );

   CREATE INDEX idx_favorites_user ON exercise_favorites(user_id, favorited_at DESC);
   CREATE INDEX idx_favorites_exercise ON exercise_favorites(exercise_id);
   ```

4. **Track Favorite Usage**
   ```sql
   -- Update exercise_usage table when favorite is used
   INSERT INTO exercise_usage (user_id, exercise_id, context)
   VALUES (:userId, :exerciseId, 'favorite');
   ```

### Data Models
```typescript
interface Favorite {
  id: string;
  userId: string;
  exerciseId: string;
  exercise: Exercise;
  favoritedAt: Date;
  usageCount: number;
}

interface FavoritesList {
  favorites: Favorite[];
  total: number;
  sort: 'date_added' | 'name' | 'usage';
}

interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  includeInstructions: boolean;
  includeMuscles: boolean;
  includeEquipment: boolean;
}
```

## Test Cases
1. **Add Favorite**
   - Navigate to exercise library
   - Click heart icon on exercise card
   - Verify icon changes to filled heart
   - Verify loading state shown briefly

2. **Remove Favorite**
   - Click filled heart icon
   - Verify icon changes to outline
   - Verify exercise removed from favorites

3. **View Favorites Page**
   - Navigate to favorites section
   - Verify favorited exercises shown
   - Verify sort options available
   - Verify empty state if no favorites

4. **Sort Favorites**
   - Select "Date Added"
   - Verify sorted by most recent
   - Select "Name"
   - Verify sorted alphabetically
   - Select "Usage"
   - Verify sorted by usage count

5. **Bulk Unfavorite**
   - Select multiple favorites
   - Click "Remove Selected"
   - Verify confirmation dialog
   - Confirm removal
   - Verify all removed from favorites

6. **Export Favorites**
   - Click "Export" button
   - Select CSV format
   - Select include options
   - Verify download starts
   - Verify file contains correct data

7. **Sync Across Devices**
   - Add favorite on desktop
   - Login on mobile
   - Verify favorite appears
   - Remove favorite on mobile
   - Verify removed on desktop

8. **Add from Detail View**
   - Open exercise detail
   - Click favorite button
   - Verify favorited
   - Navigate back
   - Verify indicator shows

## UI/UX Mockups
```
+------------------------------------------+
|  My Favorites (24)          [Export] [⋮] |
+------------------------------------------+
|                                          |
|  Sort by: [Date Added ▼]  [Grid █][≡]   |
|                                          |
|  +----------+  +----------+              |
|  |   GIF    |  |   GIF    |              |
|  |Thumbnail |  |Thumbnail |              |
|  +----------+  +----------+              |
|  | Barbell  |  | Incline  |              |
|  | Bench    |  | Dumbbell |              |
|  | Press    |  | Press    |              |
|  | [❤️]    |  | [❤️]    |              |
|  | Added 2d |  | Added 1w |              |
|  +----------+  +----------+              |
|                                          |
|  [Select Mode]                           |
+------------------------------------------+
```

```
+------------------------------------------+
|  My Favorites (24)                       |
|                                          |
|  ☑ Barbell Bench Press      [Remove]    |
|  ☐ Incline Dumbbell Press                |
|  ☐ Bent Over Row                         |
|  ☐ Squat                                 |
|                                          |
|  [3 Selected]  [Remove All] [Cancel]     |
+------------------------------------------+
```

```
+------------------------------------------+
|  Export Favorites            [Cancel]    |
+------------------------------------------+
|                                          |
|  Select Format:                          |
|  ○ CSV  ● JSON  ○ PDF                    |
|                                          |
|  Include:                                |
|  ☑ Exercise Name                        |
|  ☑ Target Muscles                       |
|  ☑ Equipment                            |
|  ☑ Instructions                         |
|  ☐ Secondary Muscles                    |
|                                          |
|  [  Export  ]                            |
|                                          |
|  Your favorites will be exported as      |
|  fitness-trainer-favorites.json         |
+------------------------------------------+
```

## Dependencies
- STORY-004-01 (Browse Exercise Library) must be completed
- STORY-004-04 (View Exercise Details) must be completed
- Exercise database must be imported

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Favorite toggle working smoothly
- [ ] Favorites page functional
- [ ] Sort options working
- [ ] Bulk actions implemented
- [ ] Export functionality working
- [ ] Sync across devices working
- [ ] Mobile responsive design verified
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests for API endpoints
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
- Implementation Status: Not Started
- Favorites are per-user (private)
- Consider sharing favorites between trainers (future)
- Add "Add to Collection" from favorites
- Track usage to show most-used favorites
- Consider smart suggestions based on favorites
- Export should include all exercise details
- Add import favorites functionality
- Consider favorites folders/categories
