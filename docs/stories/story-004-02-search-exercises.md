# Story 004-02: Search Exercises

**Parent Epic**: [EPIC-004 - Exercise Library Management](../epics/epic-004-exercise-library.md)
**Story ID**: STORY-004-02
**Priority**: P0 (Critical)
**Story Points**: 5
**Sprint**: Sprint 3

## User Story
**As a** trainer
**I want to** search for specific exercises
**So that I** can quickly find what I need

## Acceptance Criteria
- [ ] Search bar with auto-complete/suggestions
- [ ] Search by exercise name
- [ ] Search within exercise instructions
- [ ] Real-time results update (debounced)
- [ ] Search suggestions based on history
- [ ] Clear search functionality
- [ ] Handle misspellings gracefully (fuzzy search)
- [ ] Search result highlighting
- [ ] Recent searches display
- [ ] Performance: <500ms response time

## Technical Implementation

### Frontend Tasks
1. **Create ExerciseSearch Component**
   - Search input field
   - Clear search button
   - Auto-complete dropdown
   - Recent searches chips
   - Search in progress indicator

2. **Implement Auto-Complete**
   - Debounced search (300ms)
   - Dropdown suggestions
   - Keyboard navigation
   - Click to select
   - Highlight matching text

3. **Create SearchResults Component**
   - Display matching exercises
   - Highlight search terms
   - Result count
   - No results state
   - Loading state

4. **Implement Search History**
   - Store recent searches in localStorage
   - Display as chips below search bar
   - Click to re-run search
   - Clear all history option

5. **Create SearchSuggestion Component**
   - Suggest similar exercises
   - Show search history
   - Popular searches
   - Category suggestions

### Backend Tasks
1. **Create Search Endpoints**
   ```typescript
   GET /api/exercises/search?q=query - Search exercises
   GET /api/exercises/suggest?q=query - Get suggestions
   GET /api/exercises/search/history - Get user search history
   POST /api/exercises/search/history - Save search to history
   DELETE /api/exercises/search/history - Clear search history
   ```

2. **Implement SearchService with Full-Text Search**
   ```typescript
   class SearchService {
     async searchExercises(query: string, userId?: string)
     async getSuggestions(query: string)
     async saveSearchHistory(userId: string, query: string)
     async getSearchHistory(userId: string)
     async clearSearchHistory(userId: string)
   }
   ```

3. **PostgreSQL Full-Text Search**
   ```sql
   -- Update exercises table with search vector
   ALTER TABLE exercises
   ADD COLUMN search_vector tsvector
   GENERATED ALWAYS AS (
     setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
     setweight(to_tsvector('english', coalesce(body_part, '')), 'B') ||
     setweight(to_tsvector('english', coalesce(equipment, '')), 'B') ||
     setweight(to_tsvector('english', coalesce(target_muscle, '')), 'B') ||
     setweight(array_to_tsvector(instructions), 'C')
   ) STORED;

   -- Create GIN index for fast full-text search
   CREATE INDEX idx_exercises_search ON exercises USING gin(search_vector);

   -- Full-text search query function
   CREATE OR REPLACE FUNCTION search_exercises(search_query TEXT)
   RETURNS TABLE(id UUID, name TEXT, rank REAL) AS $$
   BEGIN
     RETURN QUERY
     SELECT e.id, e.name, ts_rank(e.search_vector, plainto_tsquery(search_query)) AS rank
     FROM exercises e
     WHERE e.search_vector @@ plainto_tsquery(search_query)
     ORDER BY rank DESC, e.name ASC
     LIMIT 50;
   END;
   $$ LANGUAGE plpgsql;
   ```

4. **Create search_history Table**
   ```sql
   CREATE TABLE exercise_search_history (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     search_query VARCHAR(255) NOT NULL,
     result_count INTEGER,
     searched_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_search_history_user ON exercise_search_history(user_id, searched_at DESC);
   ```

### Data Models
```typescript
interface SearchRequest {
  query: string;
  searchInInstructions?: boolean;
  limit?: number;
}

interface SearchResult {
  exercises: Exercise[];
  total: number;
  query: string;
  duration: number; // milliseconds
}

interface SearchSuggestion {
  exerciseId: string;
  name: string;
  matchHighlight: string; // HTML with highlighted matches
}

interface SearchHistoryEntry {
  id: string;
  userId: string;
  query: string;
  resultCount: number;
  searchedAt: Date;
}
```

## Test Cases
1. **Basic Search**
   - Type "bench press" in search bar
   - Verify results appear
   - Verify relevant exercises shown
   - Verify result count accurate

2. **Auto-Complete**
   - Type "bench"
   - Verify suggestions appear
   - Use arrow keys to navigate
   - Press enter to select
   - Verify search executes

3. **Real-Time Results**
   - Type characters one by one
   - Verify results update after pause
   - Verify debouncing works (300ms)

4. **Search History**
   - Perform search
   - Perform another search
   - Clear search
   - Verify recent searches appear
   - Click recent search
   - Verify search re-executes

5. **Misspelling Handling**
   - Type "bench pres" (missing 's')
   - Verify "bench press" appears in results
   - Type "barbell sqaut" (typo)
   - Verify "barbell squat" appears

6. **Clear Search**
   - Perform search
   - Click clear button
   - Verify search input cleared
   - Verify results reset to all exercises

7. **Search in Instructions**
   - Enable "search in instructions"
   - Type "keep back straight"
   - Verify exercises with that instruction appear
   - Verify highlighting in instructions

8. **Performance**
   - Test search response time
   - Verify <500ms for all queries
   - Test with 1000+ concurrent searches

## UI/UX Mockups
```
+------------------------------------------+
|  Exercise Library                        |
|  [━━━━━━━━━━━━━━━━━━━━━━━━━━] [🔍] [✕]   |
|  bench pres                              |
|  +--------------------------------------+ |
|  | ✓ Bench Press                        | |
|  | ✓ Incline Bench Press                | |
|  | ✓ Dumbbell Bench Press               | |
|  +--------------------------------------+ |
|                                          |
|  Recent: [squat] [deadlift] [rows]       |
|                                          |
|  12 results for "bench pres"             |
|  +----------+  +----------+              |
|  |   GIF    |  |   GIF    |              |
|  |Thumbnail |  |Thumbnail |              |
|  +----------+  +----------+              |
|  | <mark>Bench</mark>        |           |
|  | Press                   |           |
|  | Chest 💪  Barbell        |           |
|  | [❤️]    |              |
|  +----------+  +----------+              |
+------------------------------------------+
```

```
+------------------------------------------+
|  Exercise Library                        |
|  [━━━━━━━━━━━━━━━━━━━━━━━━━━] [🔍]       |
|                                          |
|  Popular Searches:                       |
|  [Squat] [Bench Press] [Deadlift]        |
|  [Pull Up] [Lunge] [Plank]               |
|                                          |
|  Your Recent Searches:                   |
|  [Barbell Row] [Chest Workout]           |
|                                          |
|  [Clear All History]                     |
+------------------------------------------+
```

## Dependencies
- STORY-004-01 (Browse Exercise Library) must be completed
- Exercise database must be imported
- Full-text search configured in PostgreSQL

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Search functionality working smoothly
- [ ] Auto-complete responsive
- [ ] Search history tracking working
- [ ] Fuzzy search handling misspellings
- [ ] Performance benchmarks met (<500ms)
- [ ] Mobile responsive design verified
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests for search endpoints
- [ ] Search performance tested under load
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
- Implementation Status: Not Started
- Use PostgreSQL full-text search for performance
- Consider adding Elasticsearch for advanced features later
- Implement fuzzy search using pg_trgm extension
- Cache popular search results in Redis
- Track search analytics for insights
- Consider adding "did you mean?" suggestions
- Search history should be per-user
- Highlight matching terms in results
- Test with partial words and abbreviations
