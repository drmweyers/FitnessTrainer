# Exercise Library - Quick Start Guide

## Overview

The Exercise Library is a comprehensive feature that provides access to **1,324 exercises** with detailed instructions, GIF demonstrations, and powerful filtering capabilities.

## Quick Access

### Web Interface
- **Exercise Browser**: http://localhost:3000/exercises
- **Exercise Detail**: http://localhost:3000/exercises/[exerciseId]

### API Endpoints
- **List Exercises**: `GET /api/exercises`
- **Exercise Detail**: `GET /api/exercises/by-id/[exerciseId]`
- **Search**: `GET /api/exercises/search?q=query`
- **Filters**: `GET /api/exercises/filters`

## Common Use Cases

### 1. Browse All Exercises

```typescript
const response = await fetch('/api/exercises?page=1&limit=20');
const data = await response.json();
console.log(data.exercises); // Array of exercises
console.log(data.pagination); // { total, page, limit, totalPages }
```

### 2. Search Exercises

```typescript
const query = 'bench press';
const response = await fetch(`/api/exercises/search?q=${encodeURIComponent(query)}&limit=10`);
const data = await response.json();
console.log(data.exercises); // Matching exercises
```

### 3. Filter by Body Part

```typescript
const response = await fetch('/api/exercises?bodyPart=chest&limit=20');
const data = await response.json();
console.log(data.exercises); // Chest exercises only
```

### 4. Filter by Difficulty

```typescript
const response = await fetch('/api/exercises?difficulty=beginner&limit=20');
const data = await response.json();
console.log(data.exercises); // Beginner exercises only
```

### 5. Get Exercise Details

```typescript
const exerciseId = '2gPfomN'; // exerciseDB ID
const response = await fetch(`/api/exercises/by-id/${exerciseId}`);
const exercise = await response.json();
console.log(exercise);
// {
//   id: "uuid",
//   exerciseId: "2gPfomN",
//   name: "3/4 sit-up",
//   gifUrl: "2gPfomN.gif",
//   bodyPart: "waist",
//   equipment: "body weight",
//   targetMuscle: "abs",
//   secondaryMuscles: ["hip flexors", "lower back"],
//   instructions: [...],
//   difficulty: "intermediate"
// }
```

### 6. Combined Filters

```typescript
const params = new URLSearchParams({
  bodyPart: 'chest',
  equipment: 'barbell',
  difficulty: 'intermediate',
  page: '1',
  limit: '20',
});

const response = await fetch(`/api/exercises?${params}`);
const data = await response.json();
```

## Available Filters

### Body Parts (10 categories)
- chest (163 exercises)
- back (203 exercises)
- cardio (29 exercises)
- lower arms (37 exercises)
- waist (169 exercises)
- shoulders (143 exercises)
- lower legs (59 exercises)
- neck (2 exercises)
- upper arms (292 exercises)
- upper legs (227 exercises)

### Equipment Types
- body weight
- barbell
- dumbbell
- cable
- machine
- kettlebell
- medicine ball
- resistance band
- And more...

### Target Muscles
- pectorals
- lats
- quadriceps
- hamstrings
- glutes
- abs
- obliques
- And more...

### Difficulty Levels
- beginner (12 exercises)
- intermediate (1,282 exercises)
- advanced (30 exercises)

## API Response Format

### List Response
```json
{
  "exercises": [
    {
      "id": "uuid",
      "exerciseId": "2gPfomN",
      "name": "3/4 sit-up",
      "gifUrl": "2gPfomN.gif",
      "bodyPart": "waist",
      "equipment": "body weight",
      "targetMuscle": "abs",
      "secondaryMuscles": ["hip flexors", "lower back"],
      "instructions": ["Step 1...", "Step 2..."],
      "difficulty": "intermediate",
      "isActive": true,
      "createdAt": "2026-01-30T00:00:00.000Z",
      "updatedAt": null
    }
  ],
  "pagination": {
    "total": 1324,
    "page": 1,
    "limit": 20,
    "totalPages": 67
  },
  "filters": {
    "bodyParts": ["chest", "back", ...],
    "equipments": ["barbell", "dumbbell", ...],
    "targetMuscles": ["pectorals", "lats", ...]
  }
}
```

## Exercise Detail View

When viewing an exercise detail page, users can see:

1. **Large GIF Demo** - Visual demonstration of the exercise
2. **Exercise Info** - Name, difficulty, body part, equipment, target muscle
3. **Secondary Muscles** - All muscles worked by the exercise
4. **Step-by-Step Instructions** - Numbered steps for proper form
5. **Pro Tips** - Best practices for the exercise
6. **Actions** - Add to favorites, share exercise

## Integration Examples

### React Component
```typescript
'use client';
import { useState, useEffect } from 'react';

export function ExerciseBrowser() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExercises() {
      const response = await fetch('/api/exercises?page=1&limit=20');
      const data = await response.json();
      setExercises(data.exercises);
      setLoading(false);
    }
    fetchExercises();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {exercises.map((exercise: any) => (
        <div key={exercise.id} className="exercise-card">
          <h3>{exercise.name}</h3>
          <p>{exercise.bodyPart} • {exercise.equipment}</p>
          <span className={`badge ${exercise.difficulty}`}>
            {exercise.difficulty}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### Server-Side Rendering
```typescript
// app/exercises/page.tsx
async function getExercises() {
  const res = await fetch('https://your-api.com/api/exercises', {
    cache: 'no-store',
  });
  const data = await res.json();
  return data.exercises;
}

export default async function ExercisesPage() {
  const exercises = await getExercises();

  return (
    <div>
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </div>
  );
}
```

## Performance Tips

1. **Use Pagination** - Always use pagination for large datasets
2. **Cache Responses** - API endpoints include cache headers
3. **Filter Efficiently** - Combine filters to reduce result sets
4. **Debounce Search** - Add debounce to search inputs for better UX

### Debounce Example
```typescript
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';

function SearchBar() {
  const [query, setQuery] = useState('');

  const debouncedSearch = debounce(async (searchQuery: string) => {
    if (searchQuery.length < 2) return;
    const response = await fetch(`/api/exercises/search?q=${searchQuery}`);
    const data = await response.json();
    // Handle results
  }, 300);

  useEffect(() => {
    debouncedSearch(query);
    return () => debouncedSearch.cancel();
  }, [query]);

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search exercises..."
    />
  );
}
```

## GIF URLs

Exercise GIFs are hosted on CDN:
```
https://cdn.jsdelivr.net/gh/FORTRESS-OF-MOINES/Youtube-Thumbnail@main/exerciseDB/{gifUrl}
```

Example:
```typescript
const gifUrl = `https://cdn.jsdelivr.net/gh/FORTRESS-OF-MOINES/Youtube-Thumbnail@main/exerciseDB/${exercise.gifUrl}`;
```

## Error Handling

```typescript
async function fetchExercise(exerciseId: string) {
  try {
    const response = await fetch(`/api/exercises/by-id/${exerciseId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Exercise not found');
      }
      throw new Error('Failed to fetch exercise');
    }

    const exercise = await response.json();
    return exercise;
  } catch (error) {
    console.error('Error:', error);
    // Handle error appropriately
  }
}
```

## Next Steps

1. **Integrate with Program Builder** - Use exercises when creating workout programs
2. **Add User Favorites** - Track user's favorite exercises
3. **Track Exercise History** - Log which exercises users perform
4. **Add Exercise Ratings** - Allow users to rate exercises
5. **Create Workout Templates** - Pre-built workout plans

## Support

For issues or questions:
- Check implementation docs: `docs/EPIC-004-IMPLEMENTATION.md`
- Review API tests: `tests/exercises/exercise-api.test.ts`
- Run verification: `npx tsx scripts/verify-exercise-library.ts`
