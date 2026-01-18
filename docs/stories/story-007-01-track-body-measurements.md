# Story 007-01: Track Body Measurements

**Parent Epic**: [EPIC-007 - Progress Analytics](../epics/epic-007-progress-analytics.md)
**Story ID**: STORY-007-01
**Priority**: P0 (Critical)
**Story Points**: 5
**Sprint**: Sprint 8

## User Story
**As a** client
**I want to** log my body measurements
**So that I** can track physical changes over time

## Acceptance Criteria
- [ ] Multiple measurement points available (chest, waist, hips, arms, thighs, etc.)
- [ ] Measurement history viewable in list and graph
- [ ] Progress graphs show changes over time
- [ ] Measurement reminders configurable (weekly, bi-weekly, monthly)
- [ ] Photo attachment option for each measurement session
- [ ] Measurement goals with progress tracking
- [ ] Automatic change calculations (gain/loss since last)
- [ ] Measurement guidance/tips for accurate measuring
- [ ] Unit selection (inches/cm)
- [ ] Export measurement data

## Technical Implementation

### Frontend Tasks
1. **Create MeasurementTracker Component**
   - Input form for all measurement points
   - Date picker for measurement date
   - Photo upload functionality
   - Notes field
   - Save button

2. **Create MeasurementHistory Component**
   - List view of all measurements
   - Date-based filtering
   - Change indicators (gain/loss)
   - Edit/delete options

3. **Create MeasurementProgressChart Component**
   - Line charts for each measurement
   - Multiple measurement comparison
   - Goal lines overlay
   - Interactive tooltips

4. **Create MeasurementGuidance Component**
   - Visual guide for measuring
   - Step-by-step instructions
   - Diagrams showing correct placement
   - Common mistakes to avoid

5. **Create ReminderSettings Component**
   - Frequency selection
   - Day of week selection
   - Notification preferences
   - Default reminder times

### Backend Tasks
1. **Create Measurement Endpoints**
   ```typescript
   POST /api/analytics/measurements - Log new measurements
   GET /api/analytics/measurements - Get measurement history
   GET /api/analytics/measurements/latest - Get most recent
   PUT /api/analytics/measurements/:id - Update measurement
   DELETE /api/analytics/measurements/:id - Delete measurement
   GET /api/analytics/measurements/progress - Get progress data
   ```

2. **Implement MeasurementService**
   ```typescript
   class MeasurementService {
     async logMeasurements(clientId: string, data: MeasurementData)
     async getMeasurementHistory(clientId: string, period?: DateRange)
     async getLatestMeasurements(clientId: string)
     async calculateProgress(clientId: string)
     async getMeasurementsChart(clientId: string, measurementType: string)
     async setReminder(clientId: string, frequency: string, dayOfWeek?: number)
   }
   ```

3. **Database Operations**
   - Insert body_measurements records
   - Query measurement history with pagination
   - Calculate period-over-period changes
   - Handle photo storage/retrieval
   - Manage reminder schedules

### Data Models
```typescript
interface BodyMeasurements {
  id: string;
  userId: string;
  measurementDate: Date;
  weight?: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  measurements: {
    chest?: number;
    waist?: number;
    hips?: number;
    leftArm?: number;
    rightArm?: number;
    leftThigh?: number;
    rightThigh?: number;
    leftCalf?: number;
    rightCalf?: number;
    neck?: number;
    shoulders?: number;
  };
  unit: 'inches' | 'cm';
  photos: string[];
  notes?: string;
  createdAt: Date;
}

interface MeasurementProgress {
  measurementType: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: 'gain' | 'loss' | 'stable';
  goal?: number;
  goalProgress?: number;
}

interface MeasurementChart {
  measurementType: string;
  data: ChartDataPoint[];
  goal?: number;
  unit: string;
}

interface ChartDataPoint {
  date: Date;
  value: number;
  goal?: number;
}

interface MeasurementReminder {
  id: string;
  userId: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm format
  enabled: boolean;
}
```

## Test Cases
1. **Happy Path**
   - User navigates to measurements
   - Enters all measurement values
   - Attaches progress photo (optional)
   - Saves measurements
   - Sees confirmation
   - Viewable in history

2. **Edge Cases**
   - First measurement (no baseline)
   - Missing measurement points (partial data)
   - Unit conversion (inches ↔ cm)
   - Very large weight changes
   - Photo upload failure
   - Multiple measurements on same day
   - Historical data import

3. **Calculation Tests**
   - Change calculation accuracy
   - Percentage calculation correct
   - Trend detection (gain/loss/stable)
   - Goal progress percentage

4. **Reminder Tests**
   - Weekly reminder fires
   - Bi-weekly reminder fires
   - Monthly reminder fires
   - Notification displays correctly

## UI/UX Mockups
```
+------------------------------------------+
|  Body Measurements                        |
|  [← Back]                    [+ New Entry]|
+------------------------------------------+
|                                           |
|  Date: [Oct 20, 2025 ▼]                   |
|  Unit: [Inches ▼]                         |
|                                           |
|  Measurements:                            |
|  ┌─────────────────────────────────────┐  |
|  │ Chest:     [40.5] inches            │  |
|  └─────────────────────────────────────┘  |
|  ┌─────────────────────────────────────┐  |
|  │ Waist:     [32.0] inches   ↓ 0.5"   │  |
|  └─────────────────────────────────────┘  |
|  ┌─────────────────────────────────────┐  |
|  │ Hips:      [38.0] inches   ↑ 1.0"   │  |
|  └─────────────────────────────────────┘  |
|  ┌─────────────────────────────────────┐  |
|  │ L. Arm:    [14.5] inches            │  |
|  └─────────────────────────────────────┘  |
|  ┌─────────────────────────────────────┐  |
|  │ R. Arm:    [14.75] inches           │  |
|  └─────────────────────────────────────┘  |
|  ┌─────────────────────────────────────┐  |
|  │ L. Thigh:   [22.0] inches           │  |
|  └─────────────────────────────────────┘  |
|  ┌─────────────────────────────────────┐  |
|  │ R. Thigh:   [22.25] inches          │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  Weight: [185] lbs                        |
|  Body Fat %: [15] %                       |
|                                           |
|  Progress Photos:                         |
|  [+ Add Photos]                           |
|  ┌─────┐ ┌─────┐ ┌─────┐                 |
|  │ [📷]│ │ [📷]│ │ [📷]│                 |
|  └─────┘ └─────┘ └─────┘                 |
|                                           |
|  Notes:                                   |
|  [_________________________________]      |
|  [_________________________________]      |
|                                           |
|  [💾 Save Measurements]                   |
+------------------------------------------+
```

**Measurement History:**
```
+------------------------------------------+
|  Measurement History                     |
|  [← Back]                     [Chart View]|
+------------------------------------------+
|                                           |
|  Oct 20, 2025                             |
|  Chest: 40.5" (↑ 0.5)  Waist: 32" (↓ 0.5)|
|  Hips: 38" (↑ 1.0)     Weight: 185 lbs   |
|  [Edit] [Delete]                           |
|  ───────────────────────────────────────  |
|                                           |
|  Oct 13, 2025                             |
|  Chest: 40.0"            Waist: 32.5"     |
|  Hips: 37.0"            Weight: 184 lbs   |
|  [Edit] [Delete]                           |
|  ───────────────────────────────────────  |
|                                           |
|  Oct 6, 2025                              |
|  Chest: 39.5"            Waist: 33"       |
|  Hips: 37.5"            Weight: 183 lbs   |
|  [Edit] [Delete]                           |
|  ───────────────────────────────────────  |
|                                           |
|  [Load More...]                           |
+------------------------------------------+
```

**Progress Chart:**
```
+------------------------------------------+
|  Waist Progress                           |
|  [← Back]                                 |
+------------------------------------------+
|                                           |
|  Waist (inches)                           |
|  34 │                                    |
|  33 │     ╱───╮                          |
|  32 │ ╱───╯    ╲──╮                      |
|  31 │              ╲─╮                    |
|  30 │                ╰                   |
|     └────────────────────                 |
|       Oct 6  Oct 13  Oct 20               |
|                                           |
|  Goal: 30" (6" to go)                     |
|                                           |
|  Change: -3" in 2 weeks                   |
|  Trend: 🔥 Losing steadily                |
+------------------------------------------+
```

## Dependencies
- EPIC-001 (User Profiles) for user association
- Photo storage service
- Notification system for reminders
- Chart library integration

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for measurement flow
- [ ] Manual testing completed
- [ ] Photo upload tested
- [ ] Chart functionality verified
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated

## Notes
- Body measurements are key for tracking body composition changes
- Guidance is important - many users measure incorrectly
- Consider adding AI-powered photo analysis for measurements
- Reminders improve data consistency
- Photos provide powerful visual motivation
- Check implementation status: ❌ Not Started
