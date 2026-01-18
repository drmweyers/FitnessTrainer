# Story 007-07: Training Load Monitoring

**Parent Epic**: [EPIC-007 - Progress Analytics](../epics/epic-007-progress-analytics.md)
**Story ID**: STORY-007-07
**Priority**: P1 (High)
**Story Points**: 5
**Sprint**: Sprint 10

## User Story
**As a** trainer
**I want to** monitor training load
**So that I** can prevent overtraining

## Acceptance Criteria
- [ ] Weekly load calculations (volume, sets, intensity)
- [ ] Acute:chronic workload ratio displayed
- [ ] Load trend visualization over time
- [ ] Fatigue indicators based on load patterns
- [ ] Recovery recommendations generated
- [ ] Load distribution by body part shown
- [ ] Deload suggestions when appropriate
- [ ] Historical load data available
- [ ] Customizable load thresholds
- [ ] Export load reports

## Technical Implementation

### Frontend Tasks
1. **Create LoadMonitor Component**
   - Weekly load summary cards
   - A:C ratio gauge
   - Load trend chart
   - Fatigue indicators
   - Recommendations section

2. **Create LoadChart Component**
   - Weekly volume chart
   - Acute vs. chronic load lines
   - Target zone shading
   - Body part breakdown

3. **Create BodyPartLoad Component**
   - Radar chart for muscle groups
   - Load distribution percentages
   - Imalance detection
   - Comparison to previous periods

4. **Create LoadRecommendation Component**
   - Deload suggestions
   - Recovery recommendations
   - Training adjustments
   - Risk assessments

5. **Create LoadSettings Component**
   - Custom load thresholds
   - A:C ratio targets
   - Deload frequency preferences
   - Alert settings

### Backend Tasks
1. **Create Load Endpoints**
   ```typescript
   GET /api/analytics/load/:clientId - Get training load data
   GET /api/analytics/load/:clientId/weekly - Get weekly load
   GET /api/analytics/load/:clientId/ratio - Get A:C ratio
   GET /api/analytics/load/:clientId/body-parts - Get body part load
   POST /api/analytics/load/recommendations - Generate recommendations
   PUT /api/analytics/load/settings - Update load settings
   GET /api/analytics/load/history - Get historical load data
   ```

2. **Implement LoadService**
   ```typescript
   class LoadService {
     async calculateTrainingLoad(clientId: string, period: DateRange)
     async calculateAcuteChronicRatio(clientId: string)
     async detectFatiguePatterns(clientId: string, loadHistory: LoadData[])
     async generateRecommendations(clientId: string, loadMetrics: LoadMetrics)
     async calculateBodyPartLoad(clientId: string, period: DateRange)
     async suggestDeload(clientId: string)
     async getLoadHistory(clientId: string, months: number)
   }
   ```

3. **Load Calculations**
   - Acute load: 7-day rolling average
   - Chronic load: 28-day rolling average
   - A:C ratio calculation
   - Fatigue score based on patterns
   - Body part distribution
   - Load trend analysis

4. **Recommendation Engine**
   - Detect overtraining risk
   - Suggest deload timing
   - Recommend recovery strategies
   - Flag dangerous spikes
   - Suggest volume adjustments

### Data Models
```typescript
interface TrainingLoad {
  clientId: string;
  weekStartDate: Date;
  weekEndDate: Date;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  trainingDays: number;
  averageIntensity: number;
  bodyPartDistribution: BodyPartLoad[];
  acuteLoad: number;
  chronicLoad: number;
  acuteChronicRatio: number;
  fatigueLevel: FatigueLevel;
  loadScore: number; // 0-100
}

interface BodyPartLoad {
  bodyPart: string;
  volume: number;
  sets: number;
  percentage: number;
  intensity: number;
}

type FatigueLevel = 'low' | 'moderate' | 'high' | 'very_high' | 'risk';

interface LoadMetrics {
  currentWeek: TrainingLoad;
  previousWeek: TrainingLoad;
  fourWeekAverage: TrainingLoad;
  acuteLoad: number;
  chronicLoad: number;
  acuteChronicRatio: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  spikeDetected: boolean;
  fatigueRisk: 'low' | 'medium' | 'high';
}

interface LoadRatio {
  acute: number; // 7-day average
  chronic: number; // 28-day average
  ratio: number;
  status: 'optimal' | 'high' | 'very_high' | 'risk';
  recommendation: string;
}

interface LoadRecommendation {
  type: 'deload' | 'reduce_volume' | 'extra_rest' | 'maintain' | 'increase';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  actionItems: string[];
  expectedOutcome: string;
  timeframe: string;
}

interface LoadHistory {
  clientId: string;
  data: TrainingLoad[];
  averageAcuteLoad: number;
  averageChronicLoad: number;
  peakLoad: TrainingLoad;
  lowestLoad: TrainingLoad;
  trend: string;
}

interface LoadSettings {
  clientId: string;
  targetAcuteChronicRatio: {
    min: number;
    max: number;
    optimal: number;
  };
  deloadThreshold: number;
  fatigueThresholds: {
    moderate: number;
    high: number;
    very_high: number;
    risk: number;
  };
  alertPreferences: AlertPreferences;
}

interface AlertPreferences {
  highRatioAlert: boolean;
  spikeAlert: boolean;
  deloadReminder: boolean;
  weeklySummary: boolean;
}
```

## Test Cases
1. **Happy Path**
   - Trainer views client load
   - Sees A:C ratio in optimal range
   - Reviews body part distribution
   - Checks recommendations
   - Exports load report

2. **Edge Cases**
   - New client with no load history
   - Inconsistent training patterns
   - Very high volume weeks
   - Deload weeks
   - Injury periods
   - Multiple spikes in short period

3. **Calculation Tests**
   - Acute load accurate
   - Chronic load accurate
   - A:C ratio correct
   - Fatigue detection valid
   - Body part distribution sums to 100%

4. **Recommendation Tests**
   - Deload suggested appropriately
   - Recommendations are actionable
   - Risk detected correctly
   - False positives minimized

## UI/UX Mockups
```
+------------------------------------------+
|  Training Load Monitoring                |
|  Client: [John Doe ▼]      [Export]      |
+------------------------------------------+
|                                           |
|  This Week: Oct 14-20                     |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │  ACUTE:CHRONIC RATIO                │  |
|  │                                     │  |
|  │     Acute Load (7d): 45,200 lbs     │  |
|  │     Chronic Load (28d): 42,100 lbs  │  |
|  │                                     │  |
*  │     A:C Ratio: 1.07                  │  *
*  │     ╔═══════════════════════╗        │  *
*  │     ║   ████████░░░  1.07   ║        │  *
*  │     ╚═══════════════════════╝        │  *
*  │                                     │  *
*  │     Status: ✅ Optimal (0.8-1.3)     │  |
*  └─────────────────────────────────────┘  |
|                                           |
|  ┌─────────────────────────────────────┐  |
*  │  WEEKLY LOAD TREND                 │  *
*  │                                     │  *
*  │  50k│                        ╱─────  │  *
*  │  45k│                  ╱───╯        │  *
*  │  40k│            ╱───╯              │  *
*  │  35k│      ╱───╯                   │  *
*  │  30k│  ╱──╯    ╱────╲              │  *
*  │     └────────────────────          │  *
*  │       W1  W2  W3  W4               │  *
*  │                                     │  *
*  │  ─── Chronic Load (28d avg)        │  *
*  └─────────────────────────────────────┘  |
|                                           |
|  Fatigue Indicators:                      |
*  • Volume Trend: ↗ Increasing           *
*  • Rest Days: 2/week ✅                  *
*  • Recovery Score: 72/100 Good           *
*  • Overall: ✅ Low Fatigue Risk          *
|                                           |
|  [View Details] [Adjust Program]          |
+------------------------------------------+
```

**Body Part Load:**
```
+------------------------------------------+
|  Body Part Load Distribution             |
|  [← Back]                                 |
+------------------------------------------+
|                                           |
|  This Week's Load by Muscle Group:        |
|                                           |
|  ┌─────────────────────────────────────┐  |
*  │         BACK      35%                │  *
*  │    ████████████████████             │  *
*  │         ╱        ╲                  │  *
*  │   LEGS 24%    CHEST 28%             │  *
*  │  ██████████   ████████████          │  *
*  │    │    ╲     ╱    │                │  *
*  │  ARMS 7%  SHOULDERS 6%              │  *
*  │  ████        ████                    │  *
*  │                                     │  *
*  │        ABS/CORE  0%                 │  *
*  │                                     │  *
*  └─────────────────────────────────────┘  |
|                                           |
|  Breakdown:                               |
|  Back: 15,820 lbs (5 sets)               |
*  Chest: 12,660 lbs (4 sets)              *
*  Legs: 10,848 lbs (3 sets)               *
*  Shoulders: 2,712 lbs (2 sets)           *
|  Arms: 3,160 lbs (4 sets)                |
|                                           |
|  Imbalance Detected: ⚠️                   |
|  • Back volume significantly higher      |
|    than anterior chain                   |
|  • Consider increasing chest/shoulder    |
|    work or reducing back volume          |
+------------------------------------------+
```

**Recommendations:**
```
+------------------------------------------+
|  Load Recommendations                    |
|  [← Back]                                 |
+------------------------------------------+
|                                           |
|  Based on current training load:          |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │  ✅ MAINTAIN CURRENT LOAD          │  |
*  │  Priority: Low                      │  *
*  │                                     │  *
*  │  Your acute:chronic ratio is in    │  *
*  │  the optimal zone (1.07). Keep     │  *
*  │  up the good work!                  │  *
*  │                                     │  *
*  │  Actions:                           │  *
*  │  • Continue current program         │  *
*  │  • Monitor fatigue indicators       │  *
*  │  • Maintain 2 rest days/week        │  *
*  └─────────────────────────────────────┘  |
|                                           |
|  Future Recommendations:                  |
|  ┌─────────────────────────────────────┐  |
*  │  ⏰ SCHEDULE DELOAD                 │  *
*  │  In 2-3 weeks                       │  *
*  │                                     │  *
*  │  Based on current load trajectory,  │  *
*  │  a deload week is recommended in    │  *
*  │  2-3 weeks to prevent fatigue       │  *
*  │  accumulation.                      │  *
*  │                                     │  *
*  │  Suggested: Week of Nov 4           │  *
*  │  Reduce volume by 40-50%            │  *
*  └─────────────────────────────────────┘  |
|                                           |
|  [Accept Recommendations] [Customize]      |
+------------------------------------------+
```

## Dependencies
- EPIC-006 (Workout Tracking) for workout data
- STORY-007-04 (Performance Analytics) for related metrics
- Exercise library for body part mappings
- Notification system for alerts

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for load calculations
- [ ] Manual testing completed
- [ ] A:C ratio validated
- [ ] Recommendations tested
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated

## Notes
- Training load monitoring prevents overtraining and injuries
- A:C ratio is a well-established metric in sports science
- Customize thresholds based on individual client needs
- Body part load helps identify imbalances
- Recommendations should be conservative - safety first
- Consider integrating with readiness scores
- Check implementation status: ❌ Not Started
