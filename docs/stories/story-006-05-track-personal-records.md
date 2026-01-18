# Story 006-05: Track Personal Records

**Parent Epic**: [EPIC-006 - Workout Tracking](../epics/epic-006-workout-tracking.md)
**Story ID**: STORY-006-05
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 7

## User Story
**As a** client
**I want to** see when I hit personal records
**So that I** stay motivated and track progress

## Acceptance Criteria
- [ ] Automatic PR detection on set completion
- [ ] Visual PR indicator (badge, icon, animation)
- [ ] PR history viewable by exercise
- [ ] Different PR types tracked (1RM, 3RM, 5RM, max reps, max volume)
- [ ] PR celebration animation when achieved
- [ ] Share PR achievement to social media (optional)
- [ ] PR date and details preserved
- [ ] PR comparison (current vs. previous)
- [ ] Export PR data functionality
- [ ] Leaderboards for gym/community (optional)

## Technical Implementation

### Frontend Tasks
1. **Create PRIndicator Component**
   - Display PR badge on exercise card
   - Show PR type and value
   - Include celebration animation
   - Link to PR history modal

2. **Create PRModal Component**
   - List all PRs for exercise
   - Show PR type, value, and date
   - Display previous PR for comparison
   - Include share button
   - Filter by PR type

3. **Create PRHistory Component**
   - Timeline view of all PRs
   - Group by exercise
   - Show PR progression over time
   - Highlight recent PRs

4. **Create PRCelebration Component**
   - Confetti animation
   - "New Personal Record!" message
   - Share options (Twitter, Instagram, etc.)
   - Save/continue button

5. **Implement PR Detection Logic**
   - Calculate 1RM from set data (using Brzycki or Epley formula)
   - Track max reps at specific weights
   - Calculate total volume PRs
   - Compare against historical data

### Backend Tasks
1. **Create PR Endpoints**
   ```typescript
   GET /api/workouts/personal-records - Get all user PRs
   GET /api/workouts/personal-records/:exerciseId - Get PRs for exercise
   POST /api/workouts/personal-records/check - Check if set is PR
   GET /api/workouts/personal-records/history - Get PR timeline
   ```

2. **Implement PRService**
   ```typescript
   class PRService {
     async checkForPR(setLogId: string)
     async calculate1RM(weight: number, reps: number): number
     async getExercisePRs(exerciseId: string, clientId: string)
     async getAllPRs(clientId: string)
     async getPRHistory(clientId: string, limit?: number)
     async comparePR(prId: string)
   }
   ```

3. **Database Operations**
   - Insert new personal_records
   - Update previous_record_id reference
   - Query PR history by exercise
   - Aggregate PR statistics

4. **PR Calculation Algorithms**
   ```typescript
   // Brzycki Formula
   calculate1RMBrzycki(weight: number, reps: number): number {
     return weight * (36 / (37 - reps));
   }

   // Epley Formula
   calculate1RMEpley(weight: number, reps: number): number {
     return weight * (1 + reps / 30);
   }

   // Volume PR
   calculateVolume(weight: number, reps: number, sets: number): number {
     return weight * reps * sets;
   }
   ```

### Data Models
```typescript
interface PersonalRecord {
  id: string;
  clientId: string;
  exerciseId: string;
  recordType: '1rm' | '3rm' | '5rm' | '10rm' | 'max_reps' | 'max_volume' | 'max_time';
  value: number;
  unit: string; // lbs, kg, reps, seconds
  setLogId: string;
  previousRecordId?: string;
  achievedAt: Date;
  exercise: Exercise;
  previousValue?: number;
  improvement?: number;
  improvementPercentage?: number;
}

interface PRCheckResult {
  isPR: boolean;
  recordType: string;
  value: number;
  previousValue?: number;
  improvement?: number;
  celebration: boolean;
}

interface PRHistory {
  exerciseId: string;
  exerciseName: string;
  records: PersonalRecord[];
  currentPR: PersonalRecord;
  progression: PRProgression[];
}

interface PRProgression {
  date: Date;
  value: number;
  recordType: string;
  improvement: number;
}
```

## Test Cases
1. **Happy Path**
   - User completes set
   - System detects PR (e.g., new 1RM)
   - PR indicator appears on exercise card
   - Celebration animation plays
   - User can view PR history
   - Data persisted correctly

2. **Edge Cases**
   - Tie with previous PR (same weight/reps)
   - First time doing exercise (no previous PR)
   - Very old PR (years ago) - still show comparison
   - Exercise type change (e.g., lbs to kg conversion)
   - Failed set that still is PR (e.g., AMRAP)
   - Multiple PRs in one workout

3. **Calculation Tests**
   - 1RM calculation accuracy
   - Volume PR calculation
   - Max reps tracking
   - Different formulas (Brzycki vs Epley)
   - Unit conversion (lbs ↔ kg)

4. **Performance Tests**
   - PR check completes in < 200ms
   - PR history loads quickly
   - Celebration animation smooth (60fps)

## UI/UX Mockups
```
+------------------------------------------+
|  Barbell Bench Press                     |
|  Set 4 of 4                              |
+------------------------------------------+
|                                           |
|  +-------------------------------------+  |
|  |  SET 1 ✓                    185 lbs |  |
|  |  8 reps                        90s   |  |
|  +-------------------------------------+  |
|                                           |
|  +-------------------------------------+  |
|  |  SET 2 ✓                    190 lbs |  |
|  |  7 reps                        85s   |  |
|  +-------------------------------------+  |
|                                           |
|  +-------------------------------------+  |
|  |  SET 3 ✓                    195 lbs |  |
|  |  6 reps   🏆 NEW PR!           90s   |  |
|  +-------------------------------------+  |
|                                           |
|  +-------------------------------------+  |
|  |  SET 4 (Current)                     |  |
|  |  [Input...]                          |  |
|  +-------------------------------------+  |
+------------------------------------------+
```

**PR Celebration Modal:**
```
+------------------------------------------+
|           🎉 NEW PERSONAL RECORD! 🎉       |
+------------------------------------------+
|                                           |
|           🏆                               |
|                                           |
|      Barbell Bench Press                  |
|      1RM: 195 lbs (87.9 kg)               |
|                                           |
|      Previous: 190 lbs                    |
|      Improvement: +5 lbs (+2.6%)          |
|                                           |
|      Achieved: Oct 20, 2025               |
|                                           |
|  [📱 Share]  [📊 View History]  [✓ Done]  |
+------------------------------------------+
```

**PR History Modal:**
```
+------------------------------------------+
|  Personal Records                        |
|  Barbell Bench Press         [✕ Close]   |
+------------------------------------------+
|                                           |
|  Current Records:                         |
|  ┌─────────────────────────────────────┐  |
|  │ 1RM: 195 lbs (Oct 20, 2025) 🏆     │  |
|  │ 3RM: 180 lbs (Oct 15, 2025)         │  |
|  │ 5RM: 165 lbs (Oct 10, 2025)         │  |
|  │ Max Volume: 5,200 lbs (Oct 20)      │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  Progression:                             |
|  Oct 20: 195 lbs (+5 lbs) ✓ NEW PR       |
|  Oct 15: 190 lbs (+5 lbs) ✓ PR           |
|  Oct 10: 185 lbs (+10 lbs) ✓ PR          |
|  Oct 5:  175 lbs (+5 lbs)                |
|  Oct 1:  170 lbs (Baseline)              |
|                                           |
|  [Export Data]  [Compare]                |
+------------------------------------------+
```

## Dependencies
- STORY-006-02 (Log Sets and Reps) must be complete
- Historical workout data available
- Set logging system functional
- Notification system for celebrations
- Social media integration (optional)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for PR detection
- [ ] PR calculation accuracy verified
- [ ] Celebration animation tested
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated

## Notes
- PRs are highly motivating - celebrate them prominently!
- Consider different PR types for different exercise categories
- 1RM calculation formulas are estimates - note this to users
- Allow users to manually add PRs from before they used the app
- Consider PR streaks (consecutive improvements)
- Leaderboards can be powerful but may demotivate some users
- Check implementation status: ❌ Not Started
