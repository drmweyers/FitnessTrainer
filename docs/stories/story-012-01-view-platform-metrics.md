# Story 012-01: View Platform Metrics

**Parent Epic**: [EPIC-012 - Admin Dashboard](../epics/epic-012-admin-dashboard.md)
**Story ID**: STORY-012-01
**Priority**: P0 (Critical)
**Story Points**: 8
**Sprint**: Sprint 13

## User Story
**As an** admin
**I want to** see platform metrics
**So that I** can monitor business health and make data-driven decisions

## Acceptance Criteria
- [ ] Real-time dashboard with key metrics
- [ ] User growth charts (daily/weekly/monthly)
- [ ] Revenue metrics and trends
- [ ] Active user counts (DAU, MAU)
- [ ] Engagement metrics (session duration, retention)
- [ ] Conversion funnels (sign-up to paid)
- [ ] Custom date range selection
- [ ] Export capabilities (CSV, PDF)
- [ ] Data refresh controls
- [ ] Metric definitions and tooltips

## Technical Implementation

### Frontend Tasks
1. **AdminDashboard Component**
   - Create main dashboard layout
   - Implement metric cards with KPIs
   - Build responsive grid layout
   - Add loading states

2. **MetricsDisplay Component**
   - Display key performance indicators
   - Show trend indicators (up/down arrows)
   - Calculate percentage changes
   - Handle large numbers formatting

3. **Charts Component**
   - Integrate charting library (Recharts/Chart.js)
   - Line charts for trends over time
   - Bar charts for comparisons
   - Pie charts for distributions
   - Interactive tooltips

4. **DateRangePicker Component**
   - Preset ranges (Today, 7 days, 30 days, etc.)
   - Custom date range selector
   - Apply and reset buttons
   - Persist user's last selection

### Backend Tasks
1. **Metrics Endpoints**
   ```typescript
   GET /api/admin/dashboard - Get dashboard metrics
   GET /api/admin/metrics/users - Get user metrics
   GET /api/admin/metrics/revenue - Get revenue metrics
   GET /api/admin/metrics/engagement - Get engagement metrics
   GET /api/admin/metrics/conversions - Get conversion metrics
   ```

2. **MetricsService**
   ```typescript
   class MetricsService {
     async getDashboardMetrics(dateRange: DateRange): Promise<DashboardMetrics>
     async getUserMetrics(dateRange: DateRange): Promise<UserMetrics>
     async getRevenueMetrics(dateRange: DateRange): Promise<RevenueMetrics>
     async getEngagementMetrics(dateRange: DateRange): Promise<EngagementMetrics>
     async getConversionMetrics(dateRange: DateRange): Promise<ConversionMetrics>
   }
   ```

3. **Data Aggregation**
   - Aggregate user data by date
   - Calculate revenue metrics
   - Track engagement events
   - Monitor conversion rates
   - Cache computed metrics

### Data Models
```typescript
interface DashboardMetrics {
  users: UserMetrics;
  revenue: RevenueMetrics;
  engagement: EngagementMetrics;
  conversions: ConversionMetrics;
  generatedAt: Date;
}

interface UserMetrics {
  totalUsers: number;
  newUsers: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  growthRate: number;
  userBreakdown: {
    trainers: number;
    clients: number;
  };
  churnRate: number;
}

interface RevenueMetrics {
  totalRevenue: number;
  recurringRevenue: number;
  oneTimeRevenue: number;
  averageRevenuePerUser: number;
  growthRate: number;
  revenueByPlan: RevenueByPlan[];
  revenueByMonth: RevenueDataPoint[];
}

interface EngagementMetrics {
  averageSessionDuration: number;
  averageWorkoutsPerWeek: number;
  retentionRate: number;
  featureUsage: FeatureUsage[];
  topFeatures: string[];
}

interface ConversionMetrics {
  totalSignups: number;
  totalConversions: number;
  conversionRate: number;
  funnelStages: FunnelStage[];
  timeToConvert: number;
}

interface RevenueDataPoint {
  date: Date;
  amount: number;
  users: number;
}

interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: number;
}

interface FeatureUsage {
  feature: string;
  usageCount: number;
  uniqueUsers: number;
  percentage: number;
}
```

### Database Queries
```sql
-- Total users by date
SELECT
  DATE(created_at) as date,
  COUNT(*) as new_users,
  COUNT(*) FILTER (WHERE role = 'trainer') as new_trainers,
  COUNT(*) FILTER (WHERE role = 'client') as new_clients
FROM users
WHERE created_at BETWEEN $1 AND $2
GROUP BY DATE(created_at)
ORDER BY date;

-- Active users (DAU, MAU)
SELECT
  COUNT(DISTINCT user_id) FILTER (
    WHERE last_active_at >= CURRENT_DATE
  ) as daily_active,
  COUNT(DISTINCT user_id) FILTER (
    WHERE last_active_at >= CURRENT_DATE - INTERVAL '7 days'
  ) as weekly_active,
  COUNT(DISTINCT user_id) FILTER (
    WHERE last_active_at >= CURRENT_DATE - INTERVAL '30 days'
  ) as monthly_active
FROM users;

-- Revenue metrics
SELECT
  DATE(created_at) as date,
  SUM(amount) as revenue,
  COUNT(*) as transactions
FROM payments
WHERE status = 'completed'
  AND created_at BETWEEN $1 AND $2
GROUP BY DATE(created_at)
ORDER BY date;

-- Engagement metrics
SELECT
  AVG(workouts_completed) as avg_workouts,
  AVG(session_duration_seconds) as avg_duration,
  COUNT(DISTINCT user_id) as active_users
FROM user_activity
WHERE activity_date BETWEEN $1 AND $2;

-- Conversion funnel
WITH funnel AS (
  SELECT
    'visited' as stage,
    COUNT(DISTINCT user_id) as count
  FROM page_views
  WHERE created_at BETWEEN $1 AND $2

  UNION ALL

  SELECT
    'signed_up' as stage,
    COUNT(DISTINCT user_id) as count
  FROM users
  WHERE created_at BETWEEN $1 AND $2

  UNION ALL

  SELECT
    'completed_profile' as stage,
    COUNT(DISTINCT user_id) as count
  FROM users
  WHERE profile_completed_at IS NOT NULL
    AND created_at BETWEEN $1 AND $2

  UNION ALL

  SELECT
    'subscribed' as stage,
    COUNT(DISTINCT user_id) as count
  FROM subscriptions
  WHERE created_at BETWEEN $1 AND $2
)
SELECT * FROM funnel;
```

## Test Cases
1. **Dashboard Load**
   - Admin logs in
   - Navigates to dashboard
   - Metrics load within 3 seconds
   - All KPI cards display correctly
   - Charts render properly

2. **User Growth Chart**
   - View user growth over time
   - Line chart shows trend
   - Tooltip displays exact numbers
   - Can zoom into date range
   - Export chart as image

3. **Revenue Metrics**
   - View total revenue
   - See revenue breakdown by plan
   - Compare with previous period
   - Trend indicator shows growth/decline
   - Export data as CSV

4. **Active Users**
   - View DAU, MAU counts
   - Compare engagement over time
   - See retention rate
   - Breakdown by user type

5. **Conversion Funnel**
   - View full conversion funnel
   - See conversion rates between stages
   - Identify drop-off points
   - Compare funnels by date range

6. **Custom Date Range**
   - Select custom date range
   - Metrics update for selected period
   - Charts reflect new range
   - Can save as preset

7. **Data Export**
   - Export metrics to CSV
   - Include all visible data
   - Download starts immediately
   - File format correct

8. **Real-time Updates**
   - Enable auto-refresh
   - Metrics update every 30 seconds
   - Changes reflected immediately
   - Can disable auto-refresh

## UI/UX Mockups
```
Admin Dashboard - Main View

+--------------------------------------------------------------+
|  [Logo]  Admin Dashboard        [Search]  [🔔]  [Admin▼]     |
+--------------------------------------------------------------+
|  Dashboard  Users  Content  System  Finance  Reports  Config |
+--------------------------------------------------------------+
|  Quick Stats                                    Last updated:|
|  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         |
|  │ Total Users  │ │ Revenue      │ │ Active Users │   Just now|
|  │ 12,847       │ │ $48,290      │ │ 3,241        │         |
|  │ ↑ 12%        │ │ ↑ 8%         │ │ ↑ 15%        │         |
|  │ this month   │ │ this month   │ │ today        │         |
|  └──────────────┘ └──────────────┘ └──────────────┘         |
|                                                              |
|  User Growth                     Revenue Trends              |
|  ┌────────────────────────────┐ ┌──────────────────────────┐ |
|  │     📈 Line Chart          │ │     💰 Bar Chart         │ |
|  │                            │ │                          │ |
|  │    Users              15K  │ │    Revenue         $50K  │ |
|  │     │     /\            │ │     │     █              │ |
|  │     │    /  \           │ │     │    █  █            │ |
|  │     │   /    \          │ │     │   █  █ █           │ |
|  │     │  /      \         │ │     │  █  █ █ █          │ |
|  │     └────────────────    │ │     └────────────────    │ |
|  │     Jan  Feb  Mar  Apr   │ │     Jan  Feb  Mar  Apr   │ |
|  └────────────────────────────┘ └──────────────────────────┘ |
|                                                              |
|  Conversion Funnel                                           |
|  ┌──────────────────────────────────────────────────────┐   |
|  │  Visited Site → 100% (50,000)                       │   |
|  │  Signed Up ────→ 25% (12,500) ████████░░           │   |
|  │  Completed Profile → 20% (10,000) ██████░░░░         │   |
|  │  Subscribed ─────→ 5% (2,500) ██░░░░░░░░            │   |
|  └──────────────────────────────────────────────────────┘   |
|                                                              |
|  [Refresh]  [Export Report]  [Schedule Report]               |
+--------------------------------------------------------------+
```

```
Date Range Selector

+----------------------------------+
|  Date Range                      |
|  ┌──────────────────────────┐    |
|  │ [Last 7 days ▼]          │    |
|  │ • Last 24 hours          │    |
|  │ • Last 7 days            │    |
|  │ • Last 30 days           │    |
|  │ • Last 90 days           │    |
|  │ • This Month             │    |
|  │ • Last Month             │    |
|  │ • Custom Range...        │    |
|  └──────────────────────────┘    |
|                                  |
|  Custom Range                     |
|  From: [01/01/2025]               |
|  To:   [01/31/2025]               |
|                                  |
|  [Apply] [Cancel]                |
+----------------------------------+
```

## Dependencies
- Admin authentication
- User activity tracking
- Payment data
- Database access
- Charting library (Recharts)
- Date picker library

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Dashboard displays key metrics
- [ ] Charts render correctly
- [ ] Date range filtering works
- [ ] Data export functional
- [ ] Real-time updates working
- [ ] Responsive design
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for metrics
- [ ] Performance tested (load time < 3s)
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Performance Targets
- Dashboard load: < 3 seconds
- Chart render: < 500ms
- Data refresh: < 1 second
- Export generation: < 5 seconds
- Query response: < 2 seconds

## Security Considerations
- Admin-only access
- Audit logging for all views
- Rate limiting on API endpoints
- No sensitive data exposed
- Secure session management

## Data Privacy
- Anonymize user data in metrics
- Aggregate data only
- No personal identifiable information
- Compliance with data protection laws

## Notes
- Start with core metrics (users, revenue, engagement)
- Add more detailed metrics over time
- Use caching to improve performance
- Consider real-time updates for critical metrics
- Provide drill-down capabilities
- Add comparison with previous periods
- Include goal tracking features
- Make metrics actionable (suggest improvements)
