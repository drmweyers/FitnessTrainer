# Story 001-05: Set Fitness Goals

**Parent Epic**: [EPIC-001 - User Profiles](../epics/epic-001-user-profiles.md)
**Story ID**: STORY-001-05
**Priority**: P1 (High)
**Story Points**: 5
**Sprint**: Sprint 2

## User Story
**As a** client
**I want to** define my fitness goals
**So that my** training can be properly directed

## Acceptance Criteria
- [ ] Pre-defined goal categories (weight loss, muscle gain, etc.)
- [ ] Custom goal input option
- [ ] Goal priority ranking (primary, secondary, tertiary)
- [ ] Timeline/target date setting
- [ ] Measurable target values
- [ ] Goal revision history tracking
- [ ] Progress tracking setup
- [ ] Goal achievement celebration
- [ ] Multiple active goals supported
- [ ] Archive completed goals

## Technical Implementation

### Frontend Tasks
1. **Create GoalsManager Component**
   - List view of all goals
   - Add/Edit/Delete goal functionality
   - Drag-to-reorder priorities
   - Progress visualization
   - Filter by status (active, completed, archived)

2. **Create GoalForm Component**
   - Category selector with icons
   - Custom goal option
   - Target value inputs
   - Target date picker
   - Priority selector
   - Measurable milestones

3. **Create GoalCard Component**
   - Display goal details
   - Show progress bar
   - Time remaining indicator
   - Quick edit/delete actions
   - Mark as achieved button

4. **Create GoalProgress Component**
   - Visual progress tracking
   - Milestone achievements
   - Progress charts
   - Motivational messages

5. **Implement Celebration**
   - Confetti animation on goal achieved
   - Achievement badge display
   - Share accomplishment option

### Backend Tasks
1. **Create Goals Endpoints**
   ```typescript
   GET /api/profile/goals - Get all user goals
   POST /api/profile/goals - Create new goal
   PUT /api/profile/goals/:id - Update goal
   DELETE /api/profile/goals/:id - Delete goal
   PATCH /api/profile/goals/:id/achieve - Mark as achieved
   POST /api/profile/goals/:id/milestones - Add milestone
   GET /api/profile/goals/:id/progress - Get goal progress
   ```

2. **Implement GoalsService**
   ```typescript
   class GoalsService {
     async getGoals(userId: string)
     async createGoal(userId: string, data: CreateGoalDto)
     async updateGoal(goalId: string, data: UpdateGoalDto)
     async deleteGoal(goalId: string, userId: string)
     async markAsAchieved(goalId: string, userId: string)
     async addMilestone(goalId: string, milestone: MilestoneDto)
     async getProgress(goalId: string)
   }
   ```

3. **Create user_goals Table**
   ```sql
   CREATE TABLE user_goals (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     goal_type VARCHAR(50),
     custom_goal_type VARCHAR(100),
     specific_goal TEXT,
     target_value DECIMAL(10,2),
     current_value DECIMAL(10,2) DEFAULT 0,
     unit VARCHAR(50),
     target_date DATE,
     priority INTEGER DEFAULT 1,
     is_active BOOLEAN DEFAULT true,
     achieved_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_user_goals_user ON user_goals(user_id, is_active);
   CREATE INDEX idx_user_goals_priority ON user_goals(user_id, priority);
   ```

4. **Create Goal Milestones Table**
   ```sql
   CREATE TABLE goal_milestones (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE,
     milestone_name VARCHAR(255),
     target_value DECIMAL(10,2),
     achieved_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_goal_milestones ON goal_milestones(goal_id, achieved_at);
   ```

5. **Create Goal History Table**
   ```sql
   CREATE TABLE goal_history (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE,
     action VARCHAR(50),
     old_value JSONB,
     new_value JSONB,
     changed_at TIMESTAMP DEFAULT NOW()
   );
   ```

### Data Models
```typescript
enum GoalType {
  WEIGHT_LOSS = 'weight_loss',
  MUSCLE_GAIN = 'muscle_gain',
  ENDURANCE = 'endurance',
  STRENGTH = 'strength',
  FLEXIBILITY = 'flexibility',
  GENERAL_FITNESS = 'general_fitness',
  SPORT_SPECIFIC = 'sport_specific',
  REHABILITATION = 'rehabilitation',
  CUSTOM = 'custom'
}

enum Priority {
  PRIMARY = 1,
  SECONDARY = 2,
  TERTIARY = 3
}

interface CreateGoalDto {
  goalType: GoalType;
  customGoalType?: string;
  specificGoal: string;
  targetValue: number;
  unit: string;
  targetDate: Date;
  priority: Priority;
}

interface Goal {
  id: string;
  userId: string;
  goalType: GoalType;
  customGoalType?: string;
  specificGoal: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  targetDate: Date;
  priority: Priority;
  isActive: boolean;
  achievedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  progressPercentage: number;
}

interface Milestone {
  id: string;
  goalId: string;
  milestoneName: string;
  targetValue: number;
  achievedAt?: Date;
}
```

## Test Cases
1. **Create Pre-defined Goal**
   - Select "Weight Loss" category
   - Set target: lose 10 lbs
   - Set target date: 90 days
   - Set priority: Primary
   - Save goal
   - Verify goal appears in list

2. **Create Custom Goal**
   - Select "Custom" category
   - Enter custom goal type
   - Define specific goal
   - Set measurable target
   - Save goal
   - Verify custom goal created

3. **Goal Priority Reordering**
   - Create three goals
   - Drag to reorder priorities
   - Verify priority updates
   - Verify display order changes

4. **Mark Goal as Achieved**
   - Click "Mark Achieved" on goal
   - Confirm achievement
   - Verify celebration animation
   - Verify goal moved to completed section

5. **Goal Progress Tracking**
   - Update current progress value
   - Verify progress bar updates
   - Verify percentage calculated correctly
   - Test with various values

6. **Multiple Active Goals**
   - Create 5 active goals
   - Verify all display correctly
   - Verify priority ordering
   - Test filtering by status

7. **Goal Revision History**
   - Modify goal target value
   - Modify goal target date
   - View history
   - Verify all changes tracked

## UI/UX Mockups
```
+------------------------------------------+
|  My Fitness Goals              [+ Add]   |
+------------------------------------------+
|                                          |
|  Active Goals (3)                        |
|                                          |
|  🔥 Primary Goal                         |
|  +----------------------------------+    |
|  | Lose 20 lbs by Dec 31           |    |
|  | Progress: ████████░░ 80%        |    |
|  | 16/20 lbs lost  | 45 days left  |    |
|  | [Edit] [Complete]               |    |
|  +----------------------------------+    |
|                                          |
|  💪 Secondary Goal                       |
|  +----------------------------------+    |
|  | Bench Press 200 lbs               |    |
|  | Progress: ██████░░░ 60%          |    |
|  | 165/200 lbs  | 60 days left      |    |
|  | [Edit] [Complete]               |    |
|  +----------------------------------+    |
|                                          |
|  [View Completed Goals >]               |
+------------------------------------------+
```

```
+------------------------------------------+
|  Create New Goal              [Cancel]   |
+------------------------------------------+
|                                          |
|  What's your goal?                       |
|                                          |
|  Select a category:                      |
|  +-----+  +-----+  +-----+  +-----+     |
|  | 🏃️  |  | 💪  |  | 🧘️  |  | ⚖️️  |     |
|  |Weight|  |Muscle|  |Flex |  |Gen. |     |
|  | Loss |  | Gain |  |     |  | Fit |     |
|  +-----+  +-----+  +-----+  +-----+     |
|                                          |
|  +-----+  +-----+  +-----+  +-----+     |
|  | ❤️️  |  | 🏋️️  |  | 🎯️  |  | ✏️️  |     |
|  | Endu |  |Str.  |  |Sport|  |Cust.|     |
|  | rence|  |      |  |     |  |     |     |
|  +-----+  +-----+  +-----+  +-----+     |
|                                          |
|  [  Next  ]                              |
+------------------------------------------+
```

## Dependencies
- STORY-001-01 (Create Initial Profile) must be completed
- Client role must be established
- Progress tracking infrastructure

## Definition of Done
- [ ] All acceptance criteria met
- [ ] All goal types working correctly
- [ ] Priority ordering functional
- [ ] Progress calculation accurate
- [ ] Celebration animations implemented
- [ ] Mobile responsive design verified
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests for API endpoints
- [ ] Performance tested with multiple goals
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
- Implementation Status: Not Started
- Goals should be visible to trainer for program design
- Consider adding AI-powered goal suggestions
- Add integration with workout tracking for auto-progress
- Celebrate milestones, not just final goals
- Allow trainers to set goals on behalf of clients
- Consider adding goal-sharing for social motivation
- Send reminder notifications for goal deadlines
