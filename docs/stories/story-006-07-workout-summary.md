# Story 006-07: Workout Summary

**Parent Epic**: [EPIC-006 - Workout Tracking](../epics/epic-006-workout-tracking.md)
**Story ID**: STORY-006-07
**Priority**: P0 (Critical)
**Story Points**: 5
**Sprint**: Sprint 7

## User Story
**As a** client
**I want to** a comprehensive workout summary
**So that I** can review my performance

## Acceptance Criteria
- [ ] Total volume lifted displayed
- [ ] Total workout duration tracked
- [ ] Number of exercises completed shown
- [ ] Personal records achieved highlighted
- [ ] Performance vs. prescribed comparison
- [ ] Calories burned estimate (optional)
- [ ] Share summary option (social media)
- [ ] Add workout notes/reflections
- [ ] View detailed breakdown by exercise
- [ ] Summary generates immediately on workout completion

## Technical Implementation

### Frontend Tasks
1. **Create WorkoutSummary Component**
   - Display key metrics (volume, duration, exercises)
   - Show PR achievements
   - Compare performance to prescription
   - Include notes input field
   - Add share functionality

2. **Create SummaryMetrics Component**
   - Total volume calculation and display
   - Workout duration tracking
   - Exercises completed vs. prescribed
   - Average intensity metrics
   - Body part breakdown

3. **Create PRCelebrationSummary Component**
   - List all PRs achieved
   - Show comparison to previous PRs
   - Celebration animation for new PRs

4. **Create WorkoutComparison Component**
   - Prescribed vs. actual performance
   - Completion percentage
   - Modifications summary
   - Skipped exercises list

5. **Implement Share Functionality**
   - Generate shareable image/card
   - Social media integration
   - Export as PDF option

### Backend Tasks
1. **Create Summary Endpoints**
   ```typescript
   GET /api/workouts/:sessionId/summary - Get workout summary
   POST /api/workouts/:sessionId/notes - Add workout notes
   POST /api/workouts/:sessionId/share - Generate shareable content
   GET /api/workouts/:sessionId/comparison - Get performance comparison
   ```

2. **Implement SummaryService**
   ```typescript
   class SummaryService {
     async generateSummary(sessionId: string)
     async calculateTotalVolume(sessionId: string)
     async comparePerformance(sessionId: string)
     async getPRsAchieved(sessionId: string)
     async estimateCaloriesBurned(sessionId: string, userWeight: number)
     async generateShareCard(sessionId: string)
   }
   ```

3. **Database Operations**
   - Aggregate set_logs for volume
   - Calculate duration from session timestamps
   - Query personal_records for PRs
   - Compare with prescribed values
   - Store workout notes

### Data Models
```typescript
interface WorkoutSummary {
  sessionId: string;
  workoutName: string;
  completedAt: Date;
  duration: {
    totalMinutes: number;
    activeTime: number;
    restTime: number;
  };
  volume: {
    total: number;
    byExercise: ExerciseVolume[];
    byBodyPart: BodyPartVolume[];
  };
  exercises: {
    completed: number;
    prescribed: number;
    skipped: number;
    modified: number;
  };
  personalRecords: PRAchievement[];
  comparison: PerformanceComparison;
  calories?: number;
  notes?: string;
}

interface ExerciseVolume {
  exerciseId: string;
  exerciseName: string;
  volume: number;
  sets: number;
  averageIntensity: number;
}

interface BodyPartVolume {
  bodyPart: string;
  volume: number;
  percentage: number;
}

interface PRAchievement {
  exerciseId: string;
  exerciseName: string;
  recordType: string;
  value: number;
  previousValue?: number;
  improvement: number;
}

interface PerformanceComparison {
  completionPercentage: number;
  setsCompletedVsPrescribed: {
    completed: number;
    prescribed: number;
  };
  volumeVsPrescribed: {
    actual: number;
    prescribed: number;
    percentage: number;
  };
  intensityVsPrescribed: {
    actual: number;
    prescribed: number;
    percentage: number;
  };
  modifications: WorkoutModification[];
}

interface ShareableCard {
  imageUrl: string;
  title: string;
  metrics: {
    volume: string;
    duration: string;
    prs: number;
  };
  socialText: string;
}
```

## Test Cases
1. **Happy Path**
   - Complete workout
   - Summary generates automatically
   - All metrics accurate
   - PRs displayed correctly
   - User adds notes
   - Summary saves successfully

2. **Edge Cases**
   - Workout abandoned mid-session
   - All exercises skipped
   - No PRs achieved
   - Very long workout (>3 hours)
   - Very short workout (<10 minutes)
   - Missing prescription data
   - Zero weight exercises (yoga, stretching)

3. **Calculation Tests**
   - Volume calculation accuracy
   - Duration tracking precision
   - Calorie estimation reasonableness
   - Completion percentage correct
   - Body part distribution sums to 100%

4. **Share Tests**
   - Share card generates correctly
   - Social media integration works
   - PDF export functional
   - Privacy settings respected

## UI/UX Mockups
```
+------------------------------------------+
|  Workout Complete! 🎉                    |
|  Upper Body Power                        |
+------------------------------------------+
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │  💪 Total Volume                    │  |
|  │     12,450 lbs                      │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │  ⏱️ Duration                        │  |
|  │     58 minutes                      │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │  ✅ Exercises Completed             │  |
|  │     7 of 8 (87.5%)                  │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  🏆 Personal Records:                     |
|  ┌─────────────────────────────────────┐  |
|  │  • Bench Press 1RM: 195 lbs (+5)   │  |
|  │  • Rows Max Volume: 4,200 lbs       │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  Performance vs. Prescribed:              |
|  Volume: 105% of prescribed               |
|  Sets: 93% of prescribed                  |
|                                           |
|  [📊 View Details]  [📱 Share]             |
|                                           |
|  Add Notes:                                |
|  [_________________________________]      |
|  [_________________________________]      |
|                                           |
|  [Save & Finish]  [View History]          |
+------------------------------------------+
```

**Detailed Summary View:**
```
+------------------------------------------+
|  Workout Summary - Upper Body Power       |
|  [← Back]                                 |
+------------------------------------------+
|                                           |
|  Overview:                                |
|  • Date: Oct 20, 2025                     |
|  • Duration: 58m 23s                      |
|  • Total Volume: 12,450 lbs               |
|  • Exercises: 7/8 completed               |
|  • PRs: 2 new records                     |
|                                           |
|  Volume by Exercise:                      |
|  ┌─────────────────────────────────────┐  |
|  │ 1. Bench Press:      3,150 lbs     │  |
|  │ 2. Bent Over Rows:    2,800 lbs     │  |
|  │ 3. Overhead Press:    1,850 lbs     │  |
|  │ 4. Incline Dumbbell:  1,650 lbs     │  |
|  │ 5. Lat Pulldowns:    1,400 lbs     │  |
|  │ 6. Tricep Pushdowns:   900 lbs     │  |
|  │ 7. Bicep Curls:        700 lbs     │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  Body Part Distribution:                  |
|  Chest: ████████░░ 32%                    |
|  Back:  ████████░░ 30%                    |
|  Shoulders: ████░░░░░░ 17%                |
|  Arms:   ████░░░░░░ 21%                   |
|                                           |
|  Modifications:                           |
|  • Skipped: Lateral Raises (Shoulder pain)│
|  • Added: 1 set to Bench Press            |
|                                           |
|  [📱 Share]  [📄 Export PDF]              |
+------------------------------------------+
```

**Share Card Preview:**
```
┌─────────────────────────────────────────┐
│                                         │
│   💪 UPPER BODY POWER                   │
│   Oct 20, 2025                          │
│                                         │
│   📊 12,450 lbs lifted                  │
│   ⏱️  58 minutes                        │
│   🏆  2 Personal Records                │
│                                         │
│   Powered by EvoFit                     │
│                                         │
└─────────────────────────────────────────┘
```

## Dependencies
- All previous Epic 006 stories must be complete
- Volume calculation logic implemented
- Duration tracking functional
- PR detection working
- Share service configured

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for summary generation
- [ ] Manual testing completed
- [ ] Share functionality verified
- [ ] Calculation accuracy validated
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated

## Notes
- Summary is the reward for completing a workout - make it satisfying!
- Visual feedback and celebration are important for motivation
- Share functionality can be a powerful marketing tool
- Notes help clients reflect and trainers adjust programs
- Consider adding "streak" information to summary
- Summary data feeds into analytics (Epic 007)
- Check implementation status: ❌ Not Started
