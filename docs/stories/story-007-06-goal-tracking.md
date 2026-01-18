# Story 007-06: Goal Tracking

**Parent Epic**: [EPIC-007 - Progress Analytics](../epics/epic-007-progress-analytics.md)
**Story ID**: STORY-007-06
**Priority**: P1 (High)
**Story Points**: 5
**Sprint**: Sprint 9

## User Story
**As a** client
**I want to** track progress toward my goals
**So that I** stay motivated and focused

## Acceptance Criteria
- [ ] Visual goal progress bars with percentage
- [ ] Milestone notifications when achieved
- [ ] Goal adjustment options (change target, date)
- [ ] Multiple concurrent goals support
- [ ] Goal categories (weight, strength, measurements, performance)
- [ ] Achievement badges for milestones
- [ ] Goal history with changes over time
- [ ] Projected achievement dates
- [ ] Goal celebration on completion
- [ ] Share goal achievements

## Technical Implementation

### Frontend Tasks
1. **Create GoalTracker Component**
   - Display all active goals
   - Show progress bars
   - Goal categories/tabs
   - Add new goal button

2. **Create GoalProgress Component**
   - Progress bar visualization
   - Current value vs. goal
   - Percentage complete
   - Estimated completion date
   - Recent progress indicator

3. **Create MilestoneCelebration Component**
   - Achievement modal
   - Badge display
   - Celebration animation
   - Share options
   - "Next milestone" preview

4. **Create GoalManager Component**
   - Create new goal form
   - Edit existing goals
   - Set target and deadline
   - Goal category selection
   - Goal priority setting

5. **Create GoalHistory Component**
   - Timeline of goal changes
   - Progress history
   - Completed goals archive
   - Goal achievements

### Backend Tasks
1. **Create Goal Endpoints**
   ```typescript
   GET /api/analytics/goals - Get all user goals
   POST /api/analytics/goals - Create new goal
   PUT /api/analytics/goals/:id - Update goal
   DELETE /api/analytics/goals/:id - Delete goal
   GET /api/analytics/goals/progress - Get goal progress
   POST /api/analytics/goals/:id/adjust - Adjust goal
   GET /api/analytics/goals/history - Get goal history
   POST /api/analytics/goals/:id/complete - Mark goal complete
   ```

2. **Implement GoalService**
   ```typescript
   class GoalService {
     async createGoal(userId: string, goal: CreateGoalDto)
     async updateGoal(goalId: string, data: UpdateGoalDto)
     async deleteGoal(goalId: string, userId: string)
     async getGoalProgress(userId: string)
     async adjustGoal(goalId: string, adjustment: GoalAdjustment)
     async checkMilestones(goalId: string)
     async calculateProjectedCompletion(goalId: string)
     async celebrateGoal(goalId: string)
   }
   ```

3. **Milestone System**
   - Track progress toward milestones
   - Trigger notifications on achievement
   - Award badges
   - Calculate next milestone

4. **Progress Calculation**
   - Calculate completion percentage
   - Determine progress rate
   - Project completion date
   - Identify at-risk goals

### Data Models
```typescript
interface UserGoal {
  id: string;
  userId: string;
  category: GoalCategory;
  type: GoalType;
  title: string;
  description?: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  startDate: Date;
  targetDate: Date;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  progressPercentage: number;
  milestones: Milestone[];
  achievements: Achievement[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

type GoalCategory = 'weight' | 'strength' | 'measurement' | 'performance' | 'custom';
type GoalType = 'lose' | 'gain' | 'maintain' | 'achieve' | 'reduce';

interface Milestone {
  id: string;
  goalId: string;
  value: number;
  achievedAt?: Date;
  isAchieved: boolean;
  percentage: number;
}

interface Achievement {
  id: string;
  goalId: string;
  milestoneId?: string;
  type: 'milestone' | 'goal_complete' | 'streak' | 'improvement';
  title: string;
  description: string;
  badge: string;
  achievedAt: Date;
  shared: boolean;
}

interface GoalProgress {
  goalId: string;
  title: string;
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  remaining: number;
  progressRate: number; // per week
  projectedCompletion?: Date;
  onTrack: boolean;
  daysRemaining: number;
  recentProgress: ProgressDataPoint[];
}

interface ProgressDataPoint {
  date: Date;
  value: number;
  milestone?: boolean;
}

interface GoalAdjustment {
  newTargetValue?: number;
  newTargetDate?: Date;
  reason?: string;
}

interface GoalHistory {
  goalId: string;
  changes: GoalChange[];
  milestones: Milestone[];
  progressSnapshots: ProgressSnapshot[];
}

interface GoalChange {
  changedAt: Date;
  field: string;
  oldValue: any;
  newValue: any;
  reason?: string;
}

interface ProgressSnapshot {
  date: Date;
  value: number;
  percentage: number;
}
```

## Test Cases
1. **Happy Path**
   - User creates weight loss goal
   - System sets up milestones
   - User logs weight loss
   - Progress updates automatically
   - Milestone notification triggers
   - Goal celebration on completion

2. **Edge Cases**
   - Goal already achieved at creation
   - Negative progress (gain instead of loss)
   - Missed target date
   - Adjusted goal multiple times
   - Very long timeframe goals
   - No progress data available
   - Conflicting goals

3. **Calculation Tests**
   - Progress percentage accurate
   - Projected completion reasonable
   - Milestone spacing correct
   - Progress rate calculation

4. **Notification Tests**
   - Milestone notifications fire
   - Completion celebration triggers
   - Share functionality works

## UI/UX Mockups
```
+------------------------------------------+
|  My Goals                                |
|  [← Back]                    [+ New Goal] |
+------------------------------------------+
|                                           |
|  [All] [Weight] [Strength] [Measurements] |
|                                           |
|  Active Goals (3)                         |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │ 🎯 Lose 10 lbs                      │  |
|  │ ████████████████░░░░░  75%          │  |
|  │                                     │  |
|  │ Current: 182 lbs    Goal: 175 lbs   │  |
|  │ Started: Oct 1      Target: Nov 30  │  |
|  │                                     │  |
|  │ Progress: -3 lbs in 3 weeks         │  |
|  │ Rate: -1 lb/week ✅ On track!       │  |
|  │ Projected: Nov 15 (2 weeks early!)  │  |
|  │                                     │  |
|  │ [View Progress] [Adjust Goal]       │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │ 💪 Bench Press 200 lbs              │  |
|  │ ██████████████░░░░░░░  66%          │  |
|  │                                     │  |
|  │ Current: 195 lbs    Goal: 200 lbs   │  |
|  │ Started: Sep 1      Target: Dec 31  │  |
|  │                                     │  |
|  │ Progress: +20 lbs in 7 weeks        │  |
|  │ Rate: +2.8 lbs/week ✅ On track!    │  |
|  │ Projected: Nov 10 (early!)          │  |
|  │                                     │  |
|  │ [View Progress] [Adjust Goal]       │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │ 📏 Waist: 30 inches                 │  |
|  │ ██████████░░░░░░░░░░░  44%          │  |
|  │                                     │  |
|  │ Current: 32"        Goal: 30"       │  |
|  │ Started: Oct 1      Target: Jan 31  │  |
|  │                                     │  |
|  │ Progress: -0.5" in 3 weeks          │  |
|  │ Rate: -0.17"/week ⚠️ Slightly behind│  |
|  │ Projected: Feb 20 (2 weeks late)    │  |
|  │                                     │  |
|  │ [View Progress] [Adjust Goal]       │  |
|  └─────────────────────────────────────┘  |
+------------------------------------------+
```

**Milestone Celebration:**
```
+------------------------------------------+
|      🎉 MILESTONE ACHIEVED! 🎉           |
+------------------------------------------+
|                                           |
|              🏆                            |
|                                           |
|      You've lost 5 lbs!                   |
|                                           |
|      Halfway to your goal!                |
|                                           |
|      Goal: Lose 10 lbs                    |
|      Progress: 5/10 lbs (50%)             |
|                                           |
|      ━━━━━━━━✅━━━━━━━━                   |
|                                           |
|      Next milestone: -7.5 lbs             |
|                                           |
|  [Share]  [View Progress]  [Continue]     |
+------------------------------------------+
```

**Create Goal:**
```
+------------------------------------------+
|  Create New Goal                         |
|  [← Back]                                 |
+------------------------------------------+
|                                           |
|  Goal Type:                               |
|  ◉ Weight Loss                           │
*  ○ Weight Gain                          *
*  ○ Strength Goal                        *
*  ○ Measurement Goal                     *
*  ○ Performance Goal                     *
*  ○ Custom Goal                          *
                                           |
|  Title:                                   |
|  [Lose 10 lbs______________]             |
|                                           |
|  Description (optional):                  |
|  [Get ready for summer vacation__]       |
|  [_________________________________]      |
|                                           |
|  Current Weight: [185] lbs                |
|  Goal Weight:     [175] lbs                |
|                                           |
|  Start Date:  [Oct 1, 2025 ▼]             |
|  Target Date: [Nov 30, 2025 ▼]            |
|                                           |
|  Priority:                                 |
|  ◉ High  ○ Medium  ○ Low                  |
|                                           |
|  Milestones:                               |
|  ☑ Automatically generate                 |
|  ☐ Custom milestones                      |
|                                           |
|  [Cancel]  [Create Goal]                  |
+------------------------------------------+
```

**Goal History:**
```
+------------------------------------------+
|  Goal History                            |
|  Lose 10 lbs                [← Back]     |
+------------------------------------------+
|                                           |
|  Current Status: Active                   |
|  Progress: 75% complete                   |
|                                           |
|  Timeline:                                |
|                                           |
|  Oct 20: -3 lbs (75%)                     |
|    └─ Milestone: 50% achieved ✓          |
|                                           |
|  Oct 13: -2 lbs (50%)                     |
|                                           |
|  Oct 6: -1.5 lbs                          |
|                                           |
|  Oct 1: Goal started (185 lbs)            |
|                                           |
|  Changes:                                 |
|  • Oct 5: Adjusted target date           |
|    from Nov 15 → Nov 30                  |
|    Reason: Starting 2 weeks late         |
|                                           |
|  Milestones:                              |
|  ✓ -2.5 lbs (25%) - Achieved Oct 6       |
|  ✓ -5 lbs (50%) - Achieved Oct 20        |
*  -7.5 lbs (75%) - Projected Nov 10       *
*  -10 lbs (100%) - Projected Nov 30        *
                                           |
|  [View Chart] [Edit Goal]                 |
+------------------------------------------+
```

## Dependencies
- EPIC-001 (User Profiles) for user association
- STORY-007-01 (Track Body Measurements) for measurement data
- EPIC-006 (Workout Tracking) for performance data
- Notification system for milestones
- Badge/achievement system

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for goal tracking
- [ ] Manual testing completed
- [ ] Milestone notifications verified
- [ ] Progress calculations validated
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated

## Notes
- Goals are powerful motivators - celebrate milestones!
- Visual progress bars provide instant feedback
- Projections help clients stay on track
- Badges and achievements add gamification
- Goal adjustment is normal - don't penalize
- Consider adding goal streaks
- Check implementation status: ❌ Not Started
