# Story 007-02: View Progress Charts

**Parent Epic**: [EPIC-007 - Progress Analytics](../epics/epic-007-progress-analytics.md)
**Story ID**: STORY-007-02
**Priority**: P0 (Critical)
**Story Points**: 5
**Sprint**: Sprint 8

## User Story
**As a** client
**I want to** see visual progress charts
**So that I** can understand my improvement

## Acceptance Criteria
- [ ] Weight progression chart available
- [ ] Strength charts by exercise (1RM, volume)
- [ ] Body measurement graphs
- [ ] Volume progression over time
- [ ] Multiple time range views (1W, 1M, 3M, 6M, 1Y, All)
- [ ] Zoom and pan functionality on charts
- [ ] Data point details on tap/hover
- [ ] Chart customization (colors, line types)
- [ ] Export charts as images
- [ ] Smooth animations on data updates

## Technical Implementation

### Frontend Tasks
1. **Create ProgressCharts Component**
   - Chart type selector (weight, strength, measurements)
   - Time range selector
   - Chart display area
   - Export functionality

2. **Create WeightChart Component**
   - Line chart for weight over time
   - Goal line overlay
   - Trend line
   - Moving average option

3. **Create StrengthChart Component**
   - Exercise selector
   - 1RM progression chart
   - Volume chart
   - Multiple exercise comparison
   - PR indicators on chart

4. **Create MeasurementChart Component**
   - Measurement type selector
   - Multiple measurements on same chart
   - Goal lines
   - Comparison view

5. **Implement Chart Interactions**
   - Touch/hover for data point details
   - Pinch-to-zoom on mobile
   - Pan gestures
   - Animation on data load

### Backend Tasks
1. **Create Chart Data Endpoints**
   ```typescript
   GET /api/analytics/charts/weight - Get weight chart data
   GET /api/analytics/charts/strength/:exerciseId - Get strength chart data
   GET /api/analytics/charts/measurements - Get measurement chart data
   GET /api/analytics/charts/volume - Get volume chart data
   GET /api/analytics/charts/custom - Custom chart query
   ```

2. **Implement ChartDataService**
   ```typescript
   class ChartDataService {
     async getWeightChart(userId: string, period: DateRange)
     async getStrengthChart(userId: string, exerciseId: string, period: DateRange)
     async getMeasurementChart(userId: string, measurementTypes: string[], period: DateRange)
     async getVolumeChart(userId: string, period: DateRange)
     async getCustomChart(userId: string, config: ChartConfig)
   }
   ```

3. **Data Processing**
   - Aggregate data by time period
   - Calculate trend lines
   - Generate moving averages
   - Handle missing data points
   - Format for chart library

### Data Models
```typescript
interface ChartData {
  labels: string[]; // Dates/timestamps
  datasets: ChartDataset[];
  options: ChartOptions;
}

interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  borderWidth?: number;
  pointRadius?: number;
  trendLine?: number[];
  goalLine?: number;
}

interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: boolean;
    tooltip: any;
    zoom: any;
  };
  scales: {
    x: any;
    y: any;
  };
}

interface WeightChartData {
  userId: string;
  period: DateRange;
  data: WeightDataPoint[];
  goal?: number;
  trend: 'gaining' | 'losing' | 'stable';
  average: number;
  change: number;
}

interface WeightDataPoint {
  date: Date;
  weight: number;
  goal?: number;
}

interface StrengthChartData {
  exerciseId: string;
  exerciseName: string;
  period: DateRange;
  data: StrengthDataPoint[];
  prs: PRMarker[];
  goal?: number;
}

interface StrengthDataPoint {
  date: Date;
  oneRM?: number;
  volume?: number;
  sets?: number;
}

interface PRMarker {
  date: Date;
  value: number;
  type: string;
}
```

## Test Cases
1. **Happy Path**
   - User opens progress charts
   - Selects weight chart
   - Views 3-month range
   - Taps data point for details
   - Zooms in on specific period
   - Exports chart as image

2. **Edge Cases**
   - No data for selected period
   - Very sparse data (gaps in timeline)
   - Very long time period (years)
   - Very short time period (days)
   - Single data point
   - Extreme values (outliers)
   - Multiple exercises with different scales

3. **Performance Tests**
   - Chart rendering time
   - Zoom/pan responsiveness
   - Animation smoothness (60fps)
   - Large dataset handling (1000+ points)

4. **Interaction Tests**
   - Touch interactions on mobile
   - Hover interactions on desktop
   - Multi-touch gestures
   - Keyboard navigation

## UI/UX Mockups
```
+------------------------------------------+
|  Progress Charts                         |
|  [← Back]                                |
+------------------------------------------+
|                                           |
|  [Weight] [Strength] [Measurements]       |
|                                           |
|  Time Range:                              |
|  [1W] [1M] [3M] [6M] [1Y] [All]           |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │  Weight Progress (lbs)              │  |
|  │                                     │  |
|  │  200│                                │  |
|  │  190│    ╱────╮                     │  |
|  │  180│ ╱──╯    ╲─╮                   │  |
|  │  170│              ╲───╮             │  |
|  │  160│                  ╲             │  |
|  │  150│                   ╲           │  |
|  │     └──────────────────────        │  |
|  │       May  Jun  Jul  Aug  Sep      │  |
|  │                                     │  |
|  │  Goal: 175 lbs ─────────────────    │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  Current: 185 lbs                         |
|  Goal: 175 lbs (10 lbs to go)             |
|  Change: -5 lbs in 3 months               |
|  Trend: 🔥 On track!                      |
|                                           |
|  [📥 Export Chart]  [⚙️ Customize]        |
+------------------------------------------+
```

**Strength Chart:**
```
+------------------------------------------+
|  Strength Progress                       |
|  [← Back]                    [Change Chart]|
+------------------------------------------+
|                                           |
|  Exercise: [Bench Press ▼]               |
|  Metric: [1RM ▼]                          |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │  Bench Press 1RM (lbs)              │  |
|  │                                     │  |
|  │  200│                                │  |
|  │  195│           🏆                   │  |
|  │  190│       ╱───╮                    │  |
|  │  185│  ╱───╯    ╲──╮                 │  |
|  │  180│              ╲                 │  |
|  │  175│                               │  |
|  │  170│    🏆                          │  |
|  │     └──────────────────────        │  |
|  │       Jul  Aug  Sep  Oct           │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  Current 1RM: 195 lbs 🏆                  |
|  Previous: 170 lbs                        |
|  Improvement: +25 lbs (+14.7%)            |
|  PRs achieved: 2                          |
|                                           |
|  [View Exercise History]                  |
+------------------------------------------+
```

**Data Point Detail (on tap):**
```
+------------------------------------------+
|  Oct 15, 2025                             |
+------------------------------------------+
|  Weight: 188 lbs                          |
|                                           |
|  vs Previous: -2 lbs                      |
|  vs Goal: +13 lbs                         |
|                                           |
|  Measurements on this day:                |
|  • Waist: 32.5" (↓ 0.5")                 |
|  • Body Fat: 16.5% (↓ 0.3%)              |
|                                           |
|  Workouts this week: 4                    |
|  Volume: 45,000 lbs                       |
|                                           |
|  [View Full Day]                          |
+------------------------------------------+
```

## Dependencies
- STORY-007-01 (Track Body Measurements) for measurement data
- EPIC-006 (Workout Tracking) for performance data
- Chart library (Chart.js, Recharts, etc.)
- Date range selector component
- Image export functionality

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for chart rendering
- [ ] Manual testing completed on various devices
- [ ] Chart responsiveness verified
- [ ] Export functionality tested
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated

## Notes
- Charts are highly motivating - make them visually appealing
- Consider using different colors for different data series
- Trend lines help users see overall direction
- PR markers add gamification element
- Export functionality allows sharing progress
- Check implementation status: ❌ Not Started
