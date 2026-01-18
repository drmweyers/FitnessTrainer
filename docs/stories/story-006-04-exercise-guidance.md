# Story 006-04: Exercise Guidance

**Parent Epic**: [EPIC-006 - Workout Tracking](../epics/epic-006-workout-tracking.md)
**Story ID**: STORY-006-04
**Priority**: P1 (High)
**Story Points**: 5
**Sprint**: Sprint 6

## User Story
**As a** client
**I want to** clear exercise instructions
**So that I** perform movements correctly

## Acceptance Criteria
- [ ] Exercise GIF/video displayed on exercise card
- [ ] Step-by-step written instructions available
- [ ] Target muscle groups highlighted on visual
- [ ] Common mistakes section with warnings
- [ ] Trainer's custom notes visible if added
- [ ] Alternative exercises suggested if equipment unavailable
- [ ] Form cues displayed (quick tips)
- [ ] Full-screen video option available
- [ ] Instructions load in < 2 seconds
- [ ] Content accessible offline (cached)

## Technical Implementation

### Frontend Tasks
1. **Create ExerciseGuidance Component**
   - Display exercise media (GIF/video)
   - Show step-by-step instructions
   - Include muscle group visualization
   - Display common mistakes
   - Show trainer notes if present

2. **Create ExerciseVideoPlayer Component**
   - Autoplay GIF/video on load
   - Full-screen toggle
   - Playback speed control (0.5x, 1x, 1.5x, 2x)
   - Loop functionality
   - Offline video caching

3. **Create MuscleHighlight Component**
   - SVG body diagram
   - Highlight target muscles (primary)
   - Highlight synergist muscles (secondary)
   - Interactive tap for muscle names
   - Color-coded intensity

4. **Create AlternativeExercises Component**
   - List of substitute exercises
   - Show required equipment for alternatives
   - One-tap substitution during workout
   - Filter by available equipment

5. **Implement Offline Caching**
   - Cache exercise media locally
   - Store instructions in IndexedDB
   - Sync when connection available
   - Manage cache storage limits

### Backend Tasks
1. **Create Exercise Content Endpoints**
   ```typescript
   GET /api/exercises/:id/guidance - Get exercise guidance
   GET /api/exercises/:id/video - Get video URL
   GET /api/exercises/:id/instructions - Get step-by-step
   GET /api/exercises/:id/muscles - Get target muscles
   GET /api/exercises/:id/alternatives - Get alternatives
   GET /api/exercises/:id/mistakes - Get common mistakes
   ```

2. **Implement ExerciseContentService**
   ```typescript
   class ExerciseContentService {
     async getExerciseGuidance(exerciseId: string)
     async getVideoUrl(exerciseId: string, quality: 'low' | 'medium' | 'high')
     async getMuscleMap(exerciseId: string)
     async getAlternatives(exerciseId: string, availableEquipment?: string[])
     async getCommonMistakes(exerciseId: string)
   }
   ```

3. **Database Enhancements**
   - Store video URLs and metadata
   - Store step-by-step instructions
   - Store muscle group mappings
   - Store common mistake descriptions
   - Cache frequently accessed content

### Data Models
```typescript
interface ExerciseGuidance {
  exerciseId: string;
  name: string;
  videoUrl: string;
  thumbnailUrl: string;
  instructions: Step[];
  targetMuscles: MuscleGroup[];
  commonMistakes: CommonMistake[];
  trainerNotes?: string;
  alternatives: AlternativeExercise[];
}

interface Step {
  number: number;
  title: string;
  description: string;
  imageUrl?: string;
}

interface MuscleGroup {
  name: string;
  region: 'upper' | 'lower' | 'core' | 'full';
  isPrimary: boolean;
  intensity: number; // 1-10
}

interface CommonMistake {
  title: string;
  description: string;
  correction: string;
  imageUrl?: string;
}

interface AlternativeExercise {
  exerciseId: string;
  name: string;
  reason: string;
  equipmentNeeded: string[];
  difficulty: 'easier' | 'similar' | 'harder';
}

interface ExerciseVideo {
  exerciseId: string;
  url: string;
  duration: number;
  thumbnailUrl: string;
  formats: {
    low: string;   // 480p
    medium: string; // 720p
    high: string;   // 1080p
  };
}
```

## Test Cases
1. **Happy Path**
   - User opens exercise during workout
   - Video/GIF loads and plays automatically
   - Instructions are clear and readable
   - Muscle groups highlighted correctly
   - User can view full-screen video

2. **Edge Cases**
   - No video available (show images only)
   - Slow network connection (show low quality first)
   - Offline mode (show cached content)
   - Exercise with no alternatives
   - Very long instructions (pagination/scroll)
   - Multiple muscle groups (all highlighted)

3. **Performance Tests**
   - Video load time < 2 seconds on 4G
   - Cache hit rate > 80%
   - Offline content available
   - Memory usage with multiple videos cached

4. **Content Tests**
   - All exercises have guidance
   - Videos play smoothly
   - Instructions are accurate
   - Muscle mappings correct
   - Alternatives are valid substitutions

## UI/UX Mockups
```
+------------------------------------------+
|  Barbell Bench Press                     |
|  [← Back to Workout]                     |
+------------------------------------------+
|                                           |
|  [▶ Video - 0:15]          [⛶ Fullscreen] |
|  ╔═════════════════════════════════════╗  |
|  ║                                     ║  |
|  ║        [Exercise Video/GIF]         ║  |
|  ║                                     ║  |
|  ╚═════════════════════════════════════╝  |
|  Playback: 0.5x | 1x | 1.5x | 2x          |
|                                           |
|  Target Muscles:                          |
|  ╔═════════════════════════════════════╗  |
|  ║   [Body Diagram]                    ║  |
|  ║    ▔▔▔▔▔▔▔                         ║  |
|  ║   ╱███████╲  [Primary: Pectorals]  ║  |
|  ║  │█████████│  [Secondary: Triceps]  ║  |
|  ║   ╲███████╱  [Secondary: Deltoids]  ║  |
|  ║    ▁▁▁▁▁▁▁                         ║  |
|  ╚═════════════════════════════════════╝  |
|                                           |
|  Step-by-Step:                            |
|  1. Lie flat on bench, grip bar slightly  |
|     wider than shoulder-width             |
|  2. Unrack bar with spotter help          |
|  3. Lower bar to mid-chest with control   |
|  4. Press bar up until arms are extended  |
|  5. Repeat for prescribed reps            |
|                                           |
|  Common Mistakes:                         |
|  ⚠️ Bouncing bar off chest - Control      |
|     the descent                           |
|  ⚠️ Lifting butt off bench - Keep glutes  |
|     planted                               |
|  ⚠️ Flaring elbows too much - Keep 45°    |
|     angle                                 |
|                                           |
|  Trainer's Notes:                         |
|  "Focus on slow eccentric - 3 seconds     |
|   down"                                   |
|                                           |
|  No Equipment? Try:                       |
|  → Push-ups                               |
|  → Dumbbell Floor Press                   |
|  → Machine Chest Press                    |
+------------------------------------------+
```

**Full-Screen Video View:**
```
+------------------------------------------+
|  [←] Barbell Bench Press         [✕]     |
|                                           |
|                                           |
|                                           |
|                                           |
|                                           |
|     [Full Screen Video Playing]           |
|                                           |
|                                           |
|                                           |
|                                           |
|                                           |
|  ══════════════════════════════════════   |
|  0:05 / 0:15              [⏸ Pause]      |
+------------------------------------------+
```

## Dependencies
- EPIC-004 (Exercise Library) must be complete
- Exercise media assets available
- Content management system for trainers
- Video hosting/CDN configured
- Offline storage implemented

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for content loading
- [ ] Manual testing completed on various devices
- [ ] Video playback tested and smooth
- [ ] Offline mode verified
- [ ] Content accuracy validated
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated

## Notes
- Exercise guidance is crucial for client safety and results
- Video quality should adapt to network speed
- Consider adding exercise demo recording feature for trainers
- Muscle highlight visualization helps clients understand targeting
- Alternative exercises are important for home/gym flexibility
- Cache content proactively when on WiFi
- Check implementation status: ❌ Not Started
