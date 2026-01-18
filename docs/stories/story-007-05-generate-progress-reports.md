# Story 007-05: Generate Progress Reports

**Parent Epic**: [EPIC-007 - Progress Analytics](../epics/epic-007-progress-analytics.md)
**Story ID**: STORY-007-05
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 9

## User Story
**As a** trainer
**I want to** generate professional progress reports
**So that I** can demonstrate client results

## Acceptance Criteria
- [ ] Automated report generation from client data
- [ ] Custom report templates (weekly, monthly, quarterly)
- [ ] Multiple export formats (PDF, Excel, CSV)
- [ ] Branded reports with trainer/company logo
- [ ] Include charts and photos in reports
- [ ] Flexible period selection
- [ ] Client notes and feedback section
- [ ] Email delivery option
- [ ] Report scheduling (auto-generate and send)
- [ ] Print-ready formatting

## Technical Implementation

### Frontend Tasks
1. **Create ReportGenerator Component**
   - Client selector
   - Report type selector
   - Period picker
   - Template selector
   - Preview button

2. **Create ReportPreview Component**
   - Live preview of report
   - Pagination view
   - Edit content before export
   - Add custom notes

3. **Create TemplateManager Component**
   - Create custom templates
   - Edit existing templates
   - Template library
   - Drag-and-drop sections

4. **Create ReportScheduler Component**
   - Schedule recurring reports
   - Set delivery frequency
   - Manage scheduled reports
   - View delivery history

5. **Implement Export Functionality**
   - PDF generation
   - Excel/CSV export
   - Email integration
   - Download link generation

### Backend Tasks
1. **Create Report Endpoints**
   ```typescript
   POST /api/analytics/reports/generate - Generate report
   GET /api/analytics/reports/:id - Get report
   GET /api/analytics/reports - List reports
   POST /api/analytics/reports/:id/send - Email report
   POST /api/analytics/reports/schedule - Schedule report
   GET /api/analytics/reports/templates - Get templates
   POST /api/analytics/reports/templates - Create template
   ```

2. **Implement ReportService**
   ```typescript
   class ReportService {
     async generateReport(data: ReportRequest)
     async getReport(reportId: string)
     async sendReportEmail(reportId: string, recipients: string[])
     async scheduleReport(schedule: ReportSchedule)
     async createTemplate(userId: string, template: ReportTemplate)
     async getTemplates(userId: string)
     async exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv')
   }
   ```

3. **Report Generation**
   - Aggregate client data
   - Generate charts/graphs
   - Format photos
   - Apply template styling
   - Add branding
   - Create PDF/Excel files
   - Handle email delivery

4. **PDF Generation**
   - Use PDF generation library (PDFKit, jsPDF)
   - Handle layouts and formatting
   - Embed images and charts
   - Add headers/footers
   - Multi-page support
   - Print optimization

### Data Models
```typescript
interface ReportRequest {
  clientId: string;
  trainerId: string;
  reportType: 'weekly' | 'monthly' | 'quarterly' | 'custom' | 'assessment';
  periodStart: Date;
  periodEnd: Date;
  templateId?: string;
  includeSections: ReportSection[];
  customNotes?: string;
  format: 'pdf' | 'excel' | 'csv';
}

interface Report {
  id: string;
  clientId: string;
  clientName: string;
  trainerId: string;
  trainerName: string;
  reportType: string;
  periodStart: Date;
  periodEnd: Date;
  fileUrl: string;
  format: string;
  status: 'generating' | 'ready' | 'failed';
  generatedAt: Date;
  expiresAt: Date;
}

interface ReportTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'weekly' | 'monthly' | 'quarterly' | 'custom';
  sections: TemplateSection[];
  styling: ReportStyling;
  branding: ReportBranding;
  isDefault: boolean;
}

interface TemplateSection {
  id: string;
  type: 'summary' | 'charts' | 'measurements' | 'photos' | 'analytics' | 'notes' | 'custom';
  title: string;
  order: number;
  enabled: boolean;
  config: any;
}

interface ReportStyling {
  primaryColor: string;
  secondaryColor: string;
  font: string;
  fontSize: number;
  pageSize: 'letter' | 'a4';
  orientation: 'portrait' | 'landscape';
}

interface ReportBranding {
  logo?: string;
  companyName?: string;
  website?: string;
  contactEmail?: string;
  includeContactInfo: boolean;
}

interface ReportSchedule {
  id: string;
  clientId: string;
  trainerId: string;
  reportType: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  recipients: string[];
  nextRunDate: Date;
  lastRunDate?: Date;
  enabled: boolean;
}

interface ReportData {
  client: ClientInfo;
  period: DateRange;
  summary: ReportSummary;
  measurements: MeasurementReportData;
  performance: PerformanceReportData;
  charts: ChartData[];
  photos: PhotoData[];
  analytics: AnalyticsData;
  notes: NoteData[];
}

interface ReportSummary {
  totalWorkouts: number;
  completedWorkouts: number;
  adherenceRate: number;
  totalVolume: number;
  totalPRs: number;
  weightChange: number;
  measurementChanges: MeasurementChange[];
}

interface MeasurementChange {
  type: string;
  start: number;
  end: number;
  change: number;
  changePercentage: number;
}
```

## Test Cases
1. **Happy Path**
   - Trainer selects client
   - Chooses report type (monthly)
   - Selects period
   - Clicks generate
   - Preview displays correctly
   - Export to PDF works
   - Email sends successfully

2. **Edge Cases**
   - No data for selected period
   - Very long time period (years)
   - Very short time period (days)
   - Client with no measurements
   - Client with no photos
   - Custom template missing sections
   - PDF generation failure

3. **Export Tests**
   - PDF renders correctly
   - Excel has all data
   - CSV imports to spreadsheet
   - Charts are visible in PDF
   - Photos display correctly
   - Formatting preserved

4. **Email Tests**
   - Email delivers
   - Attachments work
   - Multiple recipients
   - BCC/CC handling
   - Scheduled emails send on time

## UI/UX Mockups
```
+------------------------------------------+
|  Generate Progress Report                |
|  [← Back]                                 |
+------------------------------------------+
|                                           |
|  Client: [John Doe ▼]                     |
|                                           |
|  Report Type:                             |
|  ◉ Weekly Progress                       |
|  ○ Monthly Summary                       |
|  ○ Quarterly Review                      |
|  ○ Assessment                           |
|  ○ Custom                               |
|                                           |
|  Period:                                  |
|  From: [Oct 1, 2025]                      |
|  To:   [Oct 31, 2025]                     |
|                                           |
|  Template:                                |
|  [Standard Monthly ▼]                     |
|  Or [Create Custom Template]             |
|                                           |
|  Include:                                 |
|  ☑ Summary Statistics                    |
|  ☑ Progress Charts                       |
|  ☑ Body Measurements                     |
|  ☑ Progress Photos                       |
* ☑ Performance Analytics                 *
* ☑ Workout History                       *
* ☐ Client Notes                          *
* ☐ Trainer Recommendations               *
                                           |
|  Export As:                               |
|  ◉ PDF (Recommended)                     |
|  ○ Excel/CSV                            |
|                                           |
|  Delivery:                                |
|  ⬦ Download only                         |
* ⬦ Email to client                        *
* ⬦ Email to me                           *
* ⬜ Schedule recurring                    *
                                           |
|  [Preview]  [Generate Report]             |
+------------------------------------------+
```

**Report Preview:**
```
+------------------------------------------+
|  Report Preview - Monthly Progress       |
|  John Doe - October 2025    [← Back][Send]|
+------------------------------------------+
|                                           |
|  Page 1 of 5                              |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │  [Trainer Logo]    Monthly Progress  │  |
|  │                     October 2025     │  |
|  │                                     │  |
|  │  Client: John Doe                   │  |
|  │  Trainer: Jane Smith                │  |
|  │  Period: Oct 1 - Oct 31, 2025       │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │  SUMMARY                            │  |
|  │                                     │  |
|  │  Workouts Completed: 18/20 (90%)    │  |
|  │  Total Volume: 245,000 lbs          │  |
|  │  Personal Records: 3                │  |
|  │  Weight Change: -3 lbs              │  |
|  │  Waist Change: -1 inch              │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │  WEIGHT PROGRESS                    │  |
|  │  [Weight chart image]               │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │  PROGRESS PHOTOS                    │  |
|  │  [Before photo]    [After photo]    │  |
|  │  Sep 30, 2025      Oct 31, 2025     │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  [< Previous] [1] [2] [3] [4] [5] [Next >]|
|                                           |
|  [Edit] [Download PDF] [Send Email]      |
+------------------------------------------+
```

**Template Manager:**
```
+------------------------------------------+
|  Report Templates                        |
|  [← Back]                    [+ New]     |
+------------------------------------------+
|                                           |
|  My Templates:                            |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │ 📄 Standard Monthly                 │  |
|  │    Summary, Charts, Measurements,   │  |
|  │    Photos, Analytics                │  |
|  │    [Edit] [Duplicate] [Delete]      │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │ 📄 Weekly Check-in                  │  |
|  │    Summary, Charts, Notes           │  |
|  │    [Edit] [Duplicate] [Delete]      │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  System Templates:                        |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │ 📄 Assessment Report                │  |
|  │    Comprehensive analysis           │  |
|  │    [Use Template]                   │  |
|  └─────────────────────────────────────┘  |
|                                           |
|  ┌─────────────────────────────────────┐  |
|  │ 📄 Quarterly Review                 │  |
|  │    3-month summary                  │  |
|  │    [Use Template]                   │  |
|  └─────────────────────────────────────┘  |
+------------------------------------------+
```

**Schedule Report:**
```
+------------------------------------------+
|  Schedule Recurring Reports              |
|  [← Back]                                 |
+------------------------------------------+
|                                           |
|  Client: [John Doe ▼]                     |
|                                           |
|  Report Type: [Monthly Summary ▼]         |
|                                           |
|  Frequency:                               |
|  ◉ Weekly (every ___ day)                |
|  ○ Monthly (day ___ of month)            |
* ○ Quarterly (every 3 months)             *
                                           |
|  Email To:                                 |
|  [john.doe@email.com]                     |
|  [trainer@email.com]                      |
* [+ Add Recipient]                         *
                                           |
|  Start Date: [Nov 1, 2025]                |
|                                           |
|  ☑ Send me a copy when report is sent    |
|                                           |
|  [Schedule Report]                        |
+------------------------------------------+
```

## Dependencies
- All Epic 007 data sources (measurements, charts, photos, analytics)
- PDF generation library
- Email service integration
- File storage for reports
- Template management system

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for report generation
- [ ] Manual testing completed
- [ ] PDF export verified
- [ ] Email delivery tested
- [ ] Templates tested
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated

## Notes
- Professional reports are a key value proposition for trainers
- PDF generation must be reliable and formatted correctly
- Template flexibility is important for different use cases
- Scheduled reports improve client engagement
- Consider adding branded email templates
- Report generation may be resource-intensive - optimize carefully
- Check implementation status: ❌ Not Started
