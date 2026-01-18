# Story 012-08: Generate Reports

**Parent Epic**: [EPIC-012 - Admin Dashboard](../epics/epic-012-admin-dashboard.md)
**Story ID**: STORY-012-08
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 14

## User Story
**As an** admin
**I want to** generate custom reports
**So that I** can analyze trends and make informed decisions

## Acceptance Criteria
- [ ] Report builder interface with drag-and-drop
- [ ] Saved report templates
- [ ] Scheduled report generation
- [ ] Multiple export formats (PDF, CSV, Excel)
- [ ] Data visualization with charts
- [ ] Drill-down capabilities
- [ ] Share reports via email/link
- [ ] Historical comparisons
- [ ] Custom date ranges
- [ ] Report scheduling and automation
- [ ] Report templates library

## Technical Implementation

### Frontend Tasks
1. **ReportBuilder Component** - Drag-and-drop report creator
2. **ReportTemplates Component** - Template library
3. **ReportViewer Component** - Display generated reports
4. **ReportScheduler Component** - Schedule automation
5. **ReportExport Component** - Export in various formats

### Backend Tasks
1. **Reports Endpoints**
   ```typescript
   GET /api/admin/reports - List reports
   POST /api/admin/reports/generate - Generate report
   GET /api/admin/reports/templates - Get templates
   POST /api/admin/reports/templates - Save template
   POST /api/admin/reports/schedule - Schedule report
   GET /api/admin/reports/:id/download - Download report
   POST /api/admin/reports/:id/share - Share report
   GET /api/admin/reports/history/:id - Get report history
   ```

2. **ReportService**
   ```typescript
   class ReportService {
     async generateReport(config: ReportConfig): Promise<GeneratedReport>
     async saveTemplate(template: ReportTemplate): Promise<void>
     async scheduleReport(schedule: ReportSchedule): Promise<void>
     async exportReport(reportId: string, format: ExportFormat): Promise<Buffer>
     async shareReport(reportId: string, recipients: string[]): Promise<void>
   }
   ```

### Data Models
```typescript
interface ReportConfig {
  name: string;
  type: ReportType;
  dataSource: DataSource;
  filters: ReportFilter[];
  groupBy?: string[];
  aggregations: Aggregation[];
  visualizations: Visualization[];
  dateRange: DateRange;
  format: ExportFormat;
}

interface ReportType {
  type: 'user_analytics' | 'financial' | 'engagement' | 'custom';
  category: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  config: ReportConfig;
  createdBy: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface GeneratedReport {
  id: string;
  templateId?: string;
  name: string;
  config: ReportConfig;
  data: any;
  visualizations: Visualization[];
  generatedBy: string;
  generatedAt: Date;
  fileUrl?: string;
  shareUrl?: string;
}

interface ReportSchedule {
  id: string;
  reportTemplateId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  schedule: string; // Cron expression
  recipients: string[];
  format: ExportFormat;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdBy: string;
  createdAt: Date;
}

interface Visualization {
  type: 'line' | 'bar' | 'pie' | 'table' | 'number';
  title: string;
  dataSource: string;
  config: any;
}

interface Aggregation {
  field: string;
  operation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  alias?: string;
}

interface ReportFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
}

type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'json';
```

### Database Schema
```sql
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  created_by UUID REFERENCES admin_users(id) NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES report_templates(id),
  name VARCHAR(255) NOT NULL,
  config JSONB NOT NULL,
  data JSONB,
  file_url TEXT,
  share_url TEXT,
  generated_by UUID REFERENCES admin_users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_template_id UUID REFERENCES report_templates(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  schedule VARCHAR(100) NOT NULL,
  recipients TEXT[] NOT NULL,
  format VARCHAR(10) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  created_by UUID REFERENCES admin_users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Test Cases
1. **Report Builder** - Create custom report with drag-and-drop
2. **Save Template** - Save report as template
3. **Generate Report** - Generate report from template
4. **Export PDF** - Export report as PDF
5. **Export CSV** - Export report data as CSV
6. **Export Excel** - Export report as Excel file
7. **Schedule Report** - Schedule recurring report
8. **Share Report** - Share report via email
9. **Historical Comparison** - Compare with previous periods
10. **Drill-down** - Drill into report data

## UI/UX Mockups
```
Report Builder

+--------------------------------------------------------------+
|  ← Back  Report Builder                        [Save Template]|
|  ─────────────────────────────────────────────────────────   |
|  Report Name: [Monthly User Analytics____________]           |
|  Type: [User Analytics ▼]                                    |
|                                                              |
|  Data Source                                                 |
|  ┌────────────────────────────────────────────────────────┐ |
|  │ ☑ Users                                               │ |
|  │ ☑ Subscriptions                                       │ |
|  │ ☑ Workouts                                            │ |
|  │ ☐ Payments                                            │ |
|  └────────────────────────────────────────────────────────┘ |
|                                                              |
|  Filters                                                     |
|  Date Range: [Last 30 Days ▼]                               |
|  User Type: [All ▼]                                         |
|  Status: [Active ▼]                                         |
|                                                              |
|  Group By                                                    |
|  ☑ Date (Day)                                               |
|  ☐ User Type                                                |
|  ☐ Plan                                                     |
|                                                              |
|  Metrics                                                     |
|  [+ Add Metric]                                             |
|  • Total Users (Count)                                      |
|  • New Users (Count)                                        |
|  • Active Users (Count)                                     |
|  • Revenue (Sum)                                            |
|                                                              |
|  Visualizations                                             |
|  [+ Add Visualization]                                      |
|  • Line Chart: User Growth                                  |
|  • Bar Chart: Revenue by Plan                               |
|  • Pie Chart: User Distribution                             |
|                                                              |
|  [Generate Report]  [Preview]  [Cancel]                     |
+--------------------------------------------------------------+
```

```
Generated Report View

+--------------------------------------------------------------+
|  ← Back  Monthly User Analytics            [Export] [Share] |
|  ─────────────────────────────────────────────────────────   |
|  Generated: January 15, 2025 at 2:30 PM                      |
|  Date Range: December 1 - December 31, 2024                  |
|                                                              |
|  Summary                                                      |
|  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         |
|  │ Total Users  │ │ New Users    │ │ Revenue      │         |
|  │ 12,847       │ │ 1,245        │ │ $48,290      │         |
|  │ ↑ 12%        │ │ ↑ 8%         │ │ ↑ 15%        │         |
|  └──────────────┘ └──────────────┘ └──────────────┘         |
|                                                              |
|  User Growth Trend                                          |
|  ┌────────────────────────────────────────────────────────┐ |
|  │     📈                                                   │ |
|  │  Users                                              15K │ |
|  │   │     /\                                            │ |
|  │   │    /  \                                           │ |
|  │   │   /    \                                          │ |
|  │   └────────────────                                  │ |
|  │     Dec 1  Dec 15  Dec 31                            │ |
|  └────────────────────────────────────────────────────────┘ |
|                                                              |
|  Revenue by Plan                                             |
|  ┌────────────────────────────────────────────────────────┐ |
|  │                                                        │ |
|  │  Basic:   $12,000 (25%) ████████                      │ |
|  │  Pro:     $28,500 (59%) ████████████████              │ |
|  │  Elite:   $7,790  (16%) ████                          │ |
|  └────────────────────────────────────────────────────────┘ |
|                                                              |
|  [Compare with Previous Month]  [Drill Down]                |
+--------------------------------------------------------------+
```

```
Report Scheduler

+--------------------------------------------------------------|
|  Scheduled Reports                            [+ New Schedule]|
|  ─────────────────────────────────────────────────────────   |
|                                                              |
|  ┌────────────────────────────────────────────────────────┐ |
|  │ Weekly User Analytics                                   │ |
|  │ Every Monday at 9:00 AM                                 │ |
|  │ Recipients: admin@evofit.com                            │ |
|  │ Format: PDF                                             │ |
|  │ Status: ✅ Active                                        │ |
|  │ Next Run: Jan 20, 2025 at 9:00 AM                       │ |
|  │ Last Run: Jan 13, 2025 at 9:00 AM                       │ |
|  │ [Edit] [Pause] [Run Now] [Delete]                       │ |
|  ├────────────────────────────────────────────────────────┤ |
|  │ Monthly Financial Report                                 │ |
|  │ 1st of every month at 8:00 AM                           │ |
|  │ Recipients: finance@evofit.com, ceo@evofit.com          │ |
|  │ Format: Excel                                           │ |
|  │ Status: ✅ Active                                        │ |
|  │ Next Run: Feb 1, 2025 at 8:00 AM                        │ |
|  │ Last Run: Jan 1, 2025 at 8:00 AM                        │ |
|  │ [Edit] [Pause] [Run Now] [Delete]                       │ |
|  └────────────────────────────────────────────────────────┘ |
+--------------------------------------------------------------|
```

## Dependencies
- Charting library (Chart.js, Recharts)
- PDF generation (jsPDF, Puppeteer)
- Excel generation (ExcelJS)
- Email service for sharing
- Report scheduling system

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Report builder functional
- [ ] Templates saveable
- [ ] Multiple export formats working
- [ ] Scheduling system working
- [ ] Share functionality complete
- [ ] Visualizations rendering
- [ ] Drill-down capability
- [ ] Unit tests passing
- [ ] Code reviewed
- [ ] Documentation updated

## Performance Targets
- Report generation: < 10 seconds for typical report
- Large reports: < 30 seconds
- Export generation: < 5 seconds
- Template load: < 1 second

## Notes
- Provide template library for common reports
- Optimize queries for large datasets
- Cache generated reports
- Implement pagination for large reports
- Provide report examples
- Allow custom SQL for advanced users
- Support scheduled reports via cron
- Send reports via email
- Track report usage
