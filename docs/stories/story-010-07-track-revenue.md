# Story 010-07: Track Revenue

**Parent Epic**: [EPIC-010 - Payment & Billing](../epics/epic-010-payment-billing.md)
**Story ID**: STORY-010-07
**Priority**: P0 (Critical)
**Story Points**: 13
**Sprint**: Sprint 12

## User Story
**As a** trainer
**I want to** track my revenue and financial performance
**So that I** can manage my business effectively

## Acceptance Criteria
- [ ] Revenue dashboard with key metrics
- [ ] Period-over-period comparison (MoM, YoY)
- [ ] Revenue breakdown by client
- [ ] Revenue breakdown by service type
- [ ] Pending/expected revenue display
- [ ] Growth trend visualization
- [ ] Export financial reports (CSV, PDF)
- [ ] Tax summaries and reports
- [ ] Payment success rate tracking
- [ ] Refund impact on revenue
- [ ] Commission and fee breakdown
- [ ] Custom date range filtering

## Technical Implementation

### Frontend Tasks
1. **Create RevenueDashboard Component**
   - Key metric cards (total revenue, net revenue, growth rate)
   - Period selector (this week, this month, this quarter, custom)
   - Revenue trend chart (line/bar)
   - Revenue by service pie chart
   - Top clients list
   - Pending payments summary
   - Quick action buttons

2. **Create RevenueAnalytics Component**
   - Detailed revenue breakdown tables
   - Client revenue ranking
   - Service performance comparison
   - Payment method distribution
   - Geographic revenue distribution (if applicable)
   - Advanced filtering

3. **Create FinancialReportGenerator Component**
   - Report type selector
   - Date range picker
   - Report template options
   - Preview report
   - Export options (CSV, PDF, Excel)
   - Schedule recurring reports

4. **Create TaxSummaryReport Component**
   - Taxable revenue calculation
   - Tax collected breakdown
   - Tax liability summary
   - Quarterly tax estimates
   - Tax form preparation data

### Backend Tasks
1. **Create Revenue Endpoints**
   ```typescript
   GET  /api/billing/revenue/overview - Revenue dashboard data
   GET  /api/billing/revenue/by-client - Revenue by client
   GET  /api/billing/revenue/by-service - Revenue by service type
   GET  /api/billing/revenue/trends - Revenue trends over time
   GET  /api/billing/revenue/pending - Pending/expected revenue
   GET  /api/billing/reports/financial - Generate financial report
   GET  /api/billing/reports/tax-summary - Tax summary report
   POST /api/billing/reports/schedule - Schedule recurring report
   GET  /api/billing/metrics/performance - Performance metrics
   ```

2. **Implement RevenueService**
   ```typescript
   class RevenueService {
     // Revenue calculations
     async calculateRevenue(trainerId: string, period: DateRange): Promise<RevenueSummary>
     async calculateNetRevenue(trainerId: string, period: DateRange): Promise<number>
     async calculateGrossRevenue(trainerId: string, period: DateRange): Promise<number>
     async calculatePendingRevenue(trainerId: string): Promise<number>

     // Breakdowns
     async getRevenueByClient(trainerId: string, period: DateRange): Promise<ClientRevenue[]>
     async getRevenueByService(trainerId: string, period: DateRange): Promise<ServiceRevenue[]>
     async getRevenueByPaymentMethod(trainerId: string, period: DateRange): Promise<PaymentMethodRevenue[]>

     // Trends and comparisons
     async getRevenueTrends(trainerId: string, period: DateRange, granularity: 'day' | 'week' | 'month'): Promise<RevenueTrend[]>
     async comparePeriods(trainerId: string, currentPeriod: DateRange, previousPeriod: DateRange): Promise<PeriodComparison>
     async calculateGrowthRate(trainerId: string, period: DateRange): Promise<number>

     // Reports
     async generateFinancialReport(trainerId: string, params: ReportParams): Promise<FinancialReport>
     async generateTaxSummary(trainerId: string, year: number, quarter?: number): Promise<TaxSummary>
     async exportReport(reportId: string, format: 'csv' | 'pdf' | 'excel'): Promise<Buffer>

     // Metrics
     async getPaymentSuccessRate(trainerId: string, period: DateRange): Promise<number>
     async getRefundImpact(trainerId: string, period: DateRange): Promise<RefundImpact>
     async getAverageRevenuePerClient(trainerId: string, period: DateRange): Promise<number>
   }
   ```

3. **Revenue Calculation Engine**
   ```typescript
   class RevenueCalculationEngine {
     async calculateRevenueMetrics(trainerId: string, period: DateRange): Promise<RevenueMetrics> {
       const transactions = await this.getTransactions(trainerId, period);

       const grossRevenue = this.sumSuccessfulPayments(transactions);
       const refunds = this.sumRefunds(transactions);
       const commissions = this.sumCommissions(transactions);
       const fees = this.sumPlatformFees(transactions);
       const netRevenue = grossRevenue - refunds - commissions - fees;

       const pendingRevenue = await this.calculatePendingRevenue(trainerId);

       return {
         grossRevenue,
         netRevenue,
         refunds,
         commissions,
         fees,
         pendingRevenue,
         profitMargin: (netRevenue / grossRevenue) * 100,
       };
     }

     private sumSuccessfulPayments(transactions: Transaction[]): number {
       return transactions
         .filter(t => t.type === 'payment' && t.status === 'completed')
         .reduce((sum, t) => sum + t.amount, 0);
     }

     private sumRefunds(transactions: Transaction[]): number {
       return transactions
         .filter(t => t.type === 'refund' && t.status === 'completed')
         .reduce((sum, t) => sum + t.amount, 0);
     }
   }
   ```

4. **Trend Analysis Service**
   ```typescript
   class TrendAnalysisService {
     async getRevenueTrends(trainerId: string, period: DateRange, granularity: 'day' | 'week' | 'month'): Promise<RevenueTrend[]> {
       const transactions = await this.transactionRepository.findByTrainerAndPeriod(trainerId, period);

       const grouped = this.groupTransactionsByPeriod(transactions, granularity);

       return Object.entries(grouped).map(([date, txs]) => ({
         date: new Date(date),
         revenue: this.sumRevenue(txs),
         transactions: txs.length,
         uniqueClients: this.countUniqueClients(txs),
       }));
     }

     private groupTransactionsByPeriod(transactions: Transaction[], granularity: string): Record<string, Transaction[]> {
       return transactions.reduce((groups, tx) => {
         const key = this.getPeriodKey(tx.completedAt!, granularity);
         groups[key] = groups[key] || [];
         groups[key].push(tx);
         return groups;
       }, {} as Record<string, Transaction[]>);
     }

     async calculateGrowthTrends(trainerId: string, period: DateRange): Promise<GrowthTrend> {
       const currentRevenue = await this.revenueService.calculateRevenue(trainerId, period);
       const previousPeriod = this.getPreviousPeriod(period);
       const previousRevenue = await this.revenueService.calculateRevenue(trainerId, previousPeriod);

       const growthRate = ((currentRevenue.netRevenue - previousRevenue.netRevenue) / previousRevenue.netRevenue) * 100;

       return {
         currentPeriod: period,
         previousPeriod,
         currentRevenue: currentRevenue.netRevenue,
         previousRevenue: previousRevenue.netRevenue,
         growthRate,
         trend: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable',
       };
     }
   }
   ```

5. **Report Generation Service**
   ```typescript
   class ReportGenerationService {
     async generateFinancialReport(trainerId: string, params: ReportParams): Promise<FinancialReport> {
       const [revenue, expenses, clients, services] = await Promise.all([
         this.revenueService.calculateRevenue(trainerId, params.period),
         this.calculateExpenses(trainerId, params.period),
         this.getClientStats(trainerId, params.period),
         this.getServiceStats(trainerId, params.period),
       ]);

       const report: FinancialReport = {
         id: this.generateReportId(),
         trainerId,
         type: 'financial',
         period: params.period,
         generatedAt: new Date(),
         data: {
           revenue,
           expenses,
           netProfit: revenue.netRevenue - expenses.total,
           clientStats: clients,
           serviceStats: services,
           metrics: await this.calculateMetrics(trainerId, params.period),
         },
       };

       await this.saveReport(report);
       return report;
     }

     async generateTaxSummary(trainerId: string, year: number, quarter?: number): Promise<TaxSummary> {
       const period = this.getTaxPeriod(year, quarter);
       const transactions = await this.getTaxableTransactions(trainerId, period);

       const grossRevenue = this.sumGrossRevenue(transactions);
       const taxCollected = this.sumTaxCollected(transactions);
       const deductibleExpenses = await this.calculateDeductibleExpenses(trainerId, period);

       return {
         year,
         quarter,
         period,
         grossRevenue,
         taxCollected,
         taxableIncome: grossRevenue - deductibleExpenses.total,
         deductibleExpenses,
         estimatedTaxLiability: await this.estimateTaxLiability(trainerId, year, quarter),
       };
     }

     async exportReport(reportId: string, format: 'csv' | 'pdf' | 'excel'): Promise<Buffer> {
       const report = await this.getReport(reportId);

       switch (format) {
         case 'csv':
           return this.exportToCSV(report);
         case 'pdf':
           return this.exportToPDF(report);
         case 'excel':
           return this.exportToExcel(report);
         default:
           throw new Error(`Unsupported format: ${format}`);
       }
     }

     private exportToCSV(report: FinancialReport): Buffer {
       const csvData = this.convertReportToCSV(report.data);
       return Buffer.from(csvData, 'utf-8');
     }

     private exportToPDF(report: FinancialReport): Buffer {
       const template = await this.loadReportTemplate('financial');
       const html = template.render(report);
       return this.pdfService.generateFromHTML(html);
     }

     private exportToExcel(report: FinancialReport): Buffer {
       const workbook = this.createExcelWorkbook(report);
       return workbook.writeToBuffer();
     }
   }
   ```

6. **Database Schema Updates**
   ```sql
   CREATE TABLE revenue_snapshots (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     trainer_id UUID NOT NULL REFERENCES users(id),
     snapshot_date DATE NOT NULL,
     gross_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
     net_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
     pending_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
     refunds DECIMAL(10,2) NOT NULL DEFAULT 0,
     commissions DECIMAL(10,2) NOT NULL DEFAULT 0,
     fees DECIMAL(10,2) NOT NULL DEFAULT 0,
     transaction_count INTEGER DEFAULT 0,
     unique_clients INTEGER DEFAULT 0,
     period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
     created_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(trainer_id, snapshot_date, period_type)
   );

   CREATE INDEX idx_revenue_snapshots_trainer ON revenue_snapshots(trainer_id);
   CREATE INDEX idx_revenue_snapshots_date ON revenue_snapshots(snapshot_date DESC);
   CREATE INDEX idx_revenue_snapshots_period ON revenue_snapshots(period_type);

   CREATE TABLE financial_reports (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     trainer_id UUID NOT NULL REFERENCES users(id),
     report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('financial', 'tax', 'performance', 'custom')),
     report_name VARCHAR(255),
     period_start DATE NOT NULL,
     period_end DATE NOT NULL,
     data JSONB NOT NULL,
     file_url VARCHAR(500),
     format VARCHAR(20),
     status VARCHAR(50) DEFAULT 'completed',
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_financial_reports_trainer ON financial_reports(trainer_id);
   CREATE INDEX idx_financial_reports_type ON financial_reports(report_type);
   CREATE INDEX idx_financial_reports_date ON financial_reports(period_start, period_end);

   CREATE TABLE scheduled_reports (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     trainer_id UUID NOT NULL REFERENCES users(id),
     report_type VARCHAR(50) NOT NULL,
     report_name VARCHAR(255) NOT NULL,
     frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
     next_run_date TIMESTAMP NOT NULL,
     recipients TEXT[] NOT NULL,
     format VARCHAR(20) DEFAULT 'pdf',
     parameters JSONB DEFAULT '{}',
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     last_run_at TIMESTAMP
   );

   CREATE INDEX idx_scheduled_reports_trainer ON scheduled_reports(trainer_id);
   CREATE INDEX idx_scheduled_reports_active ON scheduled_reports(is_active, next_run_date);
   ```

### Data Models
```typescript
interface RevenueSummary {
  trainerId: string;
  period: DateRange;
  grossRevenue: number;
  netRevenue: number;
  refunds: number;
  commissions: number;
  fees: number;
  pendingRevenue: number;
  profitMargin: number;
  transactionCount: number;
  uniqueClients: number;
}

interface ClientRevenue {
  clientId: string;
  client: User;
  totalRevenue: number;
  transactionCount: number;
  averageTransactionValue: number;
  lastTransactionDate: Date;
  growthRate?: number;
}

interface ServiceRevenue {
  serviceType: string;
  pricingPlanId: string;
  pricingPlan: PricingPlan;
  totalRevenue: number;
  transactionCount: number;
  averageRevenue: number;
  shareOfTotal: number;
}

interface RevenueTrend {
  date: Date;
  revenue: number;
  transactions: number;
  uniqueClients: number;
  averageTransactionValue: number;
}

interface PeriodComparison {
  currentPeriod: {
    period: DateRange;
    revenue: number;
    transactions: number;
    clients: number;
  };
  previousPeriod: {
    period: DateRange;
    revenue: number;
    transactions: number;
    clients: number;
  };
  growthRate: {
    revenue: number;
    transactions: number;
    clients: number;
  };
}

interface FinancialReport {
  id: string;
  trainerId: string;
  type: 'financial' | 'tax' | 'performance' | 'custom';
  reportName?: string;
  period: DateRange;
  generatedAt: Date;
  data: any;
  fileUrl?: string;
  format?: string;
  status: string;
}

interface TaxSummary {
  year: number;
  quarter?: number;
  period: DateRange;
  grossRevenue: number;
  taxCollected: number;
  taxableIncome: number;
  deductibleExpenses: {
    equipment: number;
    software: number;
    marketing: number;
    education: number;
    other: number;
    total: number;
  };
  estimatedTaxLiability: number;
}

interface ReportParams {
  reportType: string;
  period: DateRange;
  includeMetrics?: string[];
  groupBy?: string;
  format?: 'csv' | 'pdf' | 'excel';
}
```

## Test Cases

### 1. Revenue Calculation Tests
- Gross revenue calculated correctly
- Net revenue accounts for refunds and fees
- Pending revenue includes scheduled payments
- Commission deductions accurate
- Period calculations correct (inclusive of start/end dates)

### 2. Trend Analysis Tests
- Daily/weekly/monthly trend data accurate
- Growth rate calculations correct
- Period-over-period comparison accurate
- Seasonal patterns detected

### 3. Breakdown Tests
- Revenue by client accurate
- Revenue by service accurate
- Payment method distribution correct
- Geographic breakdown (if applicable)

### 4. Report Generation Tests
- Financial report generates successfully
- Tax summary calculations accurate
- Export to CSV works
- Export to PDF works
- Export to Excel works
- Report data is complete

### 5. Performance Tests
- Dashboard loads < 2 seconds
- Reports generate in reasonable time
- Large date ranges handled efficiently
- Multiple concurrent report requests

### 6. Security Tests
- **CRITICAL**: Trainer can only view their own revenue
- **CRITICAL**: SQL injection prevention in all queries
- **CRITICAL**: Proper authorization on all endpoints
- **CRITICAL**: Data export is access-controlled
- Report access restricted to owner

### 7. Edge Cases
- Period with no transactions returns zero
- Invalid date range rejected
- Future date range rejected
- Very long date ranges (> 1 year)
- Division by zero in growth rate calculations

### 8. Integration Tests
- Revenue syncs with transactions
- Real-time updates after new payment
- Historical data accuracy

## UI/UX Mockups

```
+--------------------------------------------------+
|  Revenue Dashboard                               |
|                                                  |
|  Period: [This Month ▼]  [Custom Range...]       |
|                                                  |
|  +-------------+  +-------------+  +----------+ |
|  |  Gross      |  |  Net        |  |  Growth  | |
|  |  Revenue    |  |  Revenue    |  |  Rate    | |
|  |  $12,450    |  |  $11,827    |  |  +15.3%  | |
|  |  +23% vs    |  |  +22% vs    |  |  vs MoM  | |
|  |  last month |  |  last month |  |          | |
|  +-------------+  +-------------+  +----------+ |
|                                                  |
|  +-------------+  +-------------+                |
|  |  Pending    |  |  Refunds    |                |
|  |  $2,100     |  |  $623       |                |
|  |  12 pending |  |  3 refunds  |                |
|  +-------------+  +-------------+                |
|                                                  |
|  Revenue Trend (This Year)                       |
|  ┌─────────────────────────────────┐             |
|  |    $                            |             |
|  | 15k│         ╱╲                  |             |
|  | 14k│       ╱  ╲                 |             |
|  | 13k│     ╱      ╲╱╲             |             |
|  | 12k│   ╱            ╲           |             |
|  | 11k│ ╱              ╲╱╲         |             |
|  | 10k├───────────────────────     |             |
|  |    Jan Feb Mar Apr May Jun      |             |
|  └─────────────────────────────────┘             |
|                                                  |
|  [Generate Report]  [Export Data]  [View Details] |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Revenue Breakdown                               |
|                                                  |
|  By Client                    By Service Type     |
|  +-----------------------+   +----------------+  |
|  | Top Clients           |   | Services       |  |
|  +-----------------------+   +----------------+  |
|  | 1. John Doe    $2,450  |   │ 1:1 Training  |  |
|  |    12 sessions        |   | 45% ($5,602)  |  |
|  |    +18% vs last mo    |   | ████░░░░░░░░   |  |
|  | [View Details]        |   |                |  |
//                       |   │ 2: Group      |  |
|  | 2. Jane Smith   $1,800 |   | 30% ($3,735)  |  |
|  |    8 sessions         |   | ███░░░░░░░░░   |  |
|  |    +5% vs last mo     |   |                |  |
|  | [View Details]        |   │ Online        |  |
|  +-----------------------+   | 25% ($3,113)  |  |
|  | 3. Mike Brown  $1,200 |   | ██░░░░░░░░░░   |  |
|  |    5 sessions         |   +----------------+  |
|  |    -2% vs last mo     |                     |
|  | [View Details]        |   View All Clients  |
|  +-----------------------+                     |
|                                                  |
|  Payment Methods                  Avg Transaction|
|  +-----------------------+     +-------------+  |
|  │ Card          75%      |     |  $142.50     |  |
//  │ ███████████████░░░░░   |     +-------------+  |
|  │ Bank         20%       |                      |
|  │ ████░░░░░░░░░░░░░░░░   |   Payment Success:  |
|  │ Other         5%       |   +-------------+    |
|  │ ██░░░░░░░░░░░░░░░░░░░  |   |  96.5%       |    |
|  +-----------------------+   +-------------+    |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Financial Report Generator                      |
|                                                  |
|  Report Type: [Financial Summary ▼]              |
|                                                  |
|  Options:                                        |
|  ───────────────────────────────────             |
|  Date Range:                                     |
|  From: [Jan 1, 2024 📅]                          |
|  To: [Mar 31, 2024 📅]                           |
|  [This Quarter] [This Year] [Custom]             |
|                                                  |
|  Include:                                        |
|  ☑ Revenue breakdown                            |
|  ☑ Client analysis                              |
|  ☑ Service performance                          |
//  ☑ Tax summary                                 |
|  ☐ Payment method analysis                      |
|  ☐ Geographic distribution                      |
|                                                  |
|  Group By: [Month ▼]                             |
|                                                  |
|  Output Format:                                  |
|  ⦿ PDF  ○ Excel  ○ CSV                          |
|                                                  |
|  [Preview]  [Generate Report]  [Schedule]        |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Tax Summary Report - Q1 2024                    |
|                                                  |
|  Period: January 1 - March 31, 2024              |
|                                                  |
|  Income Summary                                  |
|  ───────────────────────────────────             |
|  Gross Revenue:              $35,200.00          |
|  Tax Collected:                $2,816.00         |
//  Net Revenue:                 $32,384.00          |
|                                                  |
|  Deductible Expenses                             |
|  ───────────────────────────────────             |
|  Equipment:                  $1,200.00           |
|  Software (platform):        $623.00             |
|  Marketing:                  $450.00             |
|  Education/Certification:    $800.00             |
|  Other:                      $250.00             |
//  Total Deductible:            $3,323.00          |
|                                                  |
|  Tax Calculation                                  |
|  ───────────────────────────────────             |
|  Taxable Income:             $29,061.00          |
|  Estimated Tax Rate:        25%                  |
|  Estimated Tax Liability:    $7,265.25           |
|                                                  |
|  Quarterly Estimate                               |
|  ───────────────────────────────────             |
|  Q1 Payment Due: April 15, 2024                  |
|  Recommended Payment:        $7,265.25           |
|                                                  |
|  [Download PDF]  [Export to Excel]  [Send to CPA]|
+--------------------------------------------------+
```

## Dependencies
- Transactions system fully functional (Story 010-03)
- Refunds system implemented (Story 010-05)
- Commission tracking (Story 010-03)
- Client data available
- Service/pricing plan data
- PDF generation library
- Chart/visualization library

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Revenue calculations verified accurate
- [ ] Dashboard loads quickly (< 2 seconds)
- [ ] All report formats work (CSV, PDF, Excel)
- [ ] Charts render correctly
- [ ] Period filtering tested
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Performance benchmarks met

## Notes
- **CRITICAL**: All revenue calculations must be server-side and auditable.
- **CRITICAL**: Never trust client-side calculations for financial reporting.
- Implement caching for frequently accessed dashboard data.
- Consider using a time-series database for efficient trend queries.
- Revenue snapshots should be calculated daily for performance.
- Use proper decimal/numeric types for all money calculations.
- Implement data validation for edge cases (negative revenue, division by zero).
- Consider implementing anomaly detection for unusual revenue patterns.
- Tax calculations should be configurable for different jurisdictions.
- Report generation should be asynchronous for large date ranges.
- Provide clear explanations for all metrics and calculations.
- Allow customization of dashboard layout and metrics.
- Consider implementing forecasting/predictive analytics.
- Support comparison with industry benchmarks.
- Ensure all currency conversions use real-time rates.
- Implement proper timezone handling for date ranges.
