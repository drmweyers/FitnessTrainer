# Story 012-06: Manage Financial Data

**Parent Epic**: [EPIC-012 - Admin Dashboard](../epics/epic-012-admin-dashboard.md)
**Story ID**: STORY-012-06
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 14

## User Story
**As an** admin
**I want to** oversee financial operations
**So that I** can ensure accuracy and handle monetary issues

## Acceptance Criteria
- [ ] Transaction overview with filtering
- [ ] Refund management interface
- [ ] Payout monitoring for trainers
- [ ] Fee calculations verification
- [ ] Tax reporting capabilities
- [ ] Dispute handling tools
- [ ] Financial data exports
- [ ] Audit trails for all transactions
- [ ] Revenue analytics
- [ ] Payment gateway status
- [ ] Stripe/PayPal integration dashboard

## Technical Implementation

### Frontend Tasks
1. **FinancialOverview Component** - Transaction list and filters
2. **RefundManagement Component** - Process and track refunds
3. **PayoutMonitor Component** - View trainer payouts
4. **FinancialReports Component** - Revenue and tax reports
5. **DisputeHandling Component** - Manage payment disputes

### Backend Tasks
1. **Financial Endpoints**
   ```typescript
   GET /api/admin/financial/transactions - List transactions
   GET /api/admin/financial/refunds - Get refund requests
   POST /api/admin/financial/refunds/:id/process - Process refund
   GET /api/admin/financial/payouts - Get payouts
   POST /api/admin/financial/payouts/:id/approve - Approve payout
   GET /api/admin/financial/reports - Get financial reports
   GET /api/admin/financial/disputes - Get disputes
   PUT /api/admin/financial/disputes/:id - Handle dispute
   GET /api/admin/financial/export - Export financial data
   ```

2. **FinancialService**
   ```typescript
   class FinancialService {
     async getTransactions(filters: TransactionFilters): Promise<PaginatedTransactions>
     async processRefund(refundId: string, amount: number): Promise<void>
     async approvePayout(payoutId: string): Promise<void>
     async generateReport(type: ReportType, dateRange: DateRange): Promise<FinancialReport>
     async handleDispute(disputeId: string, resolution: DisputeResolution): Promise<void>
   }
   ```

### Data Models
```typescript
interface Transaction {
  id: string;
  userId: string;
  user: User;
  type: 'payment' | 'refund' | 'payout' | 'fee';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  paymentIntentId?: string;
  description?: string;
  metadata?: any;
  createdAt: Date;
  completedAt?: Date;
  refundedAt?: Date;
}

interface Refund {
  id: string;
  transactionId: string;
  transaction: Transaction;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requestedBy: string;
  processedBy?: string;
  createdAt: Date;
  processedAt?: Date;
}

interface Payout {
  id: string;
  trainerId: string;
  trainer: User;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed';
  period: {
    start: Date;
    end: Date;
  };
  transactions: Transaction[];
  bankAccount: string;
  createdAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
}

interface Dispute {
  id: string;
  transactionId: string;
  transaction: Transaction;
  reason: string;
  amount: number;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  evidence?: string[];
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

interface FinancialReport {
  type: 'revenue' | 'payouts' | 'fees' | 'tax';
  period: DateRange;
  data: ReportData;
  generatedAt: Date;
}
```

### Database Schema
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_intent_id VARCHAR(255),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  refunded_at TIMESTAMP
);

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES users(id) NOT NULL,
  processed_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  fee DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  bank_account VARCHAR(255) NOT NULL,
  approved_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

## Test Cases
1. **Transaction Overview** - View all transactions
2. **Refund Processing** - Process refund requests
3. **Payout Approval** - Approve trainer payouts
4. **Fee Verification** - Verify fee calculations
5. **Tax Reports** - Generate tax reports
6. **Dispute Resolution** - Handle payment disputes
7. **Revenue Analytics** - View revenue trends
8. **Financial Export** - Export financial data

## UI/UX Mockups
```
Financial Overview

+--------------------------------------------------------------+
|  Financial Operations                        [Export Reports]|
|  ─────────────────────────────────────────────────────────   |
|  Quick Stats                                                 |
|  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         |
|  │ Total Revenue│ │ Refunds      │ │ Pending      │         |
|  │ $128,450     │ │ $3,240       │ │ Payouts      │         |
|  │ ↑ 12%        │ │ 2.5%         │ │ $15,800      │         |
|  └──────────────┘ └──────────────┘ └──────────────┘         |
|                                                              |
|  Recent Transactions                                         |
|  ┌────────────────────────────────────────────────────────┐ |
|  │ ID     │ User    │ Type    │ Amount │ Status        │ |
|  ├────────────────────────────────────────────────────────┤ |
|  │ #TX001 │ John S. │ Payment │ $99.00 │ Completed     │ |
|  │ #TX002 │ Jane D. │ Refund  │ $49.00 │ Processing    │ |
|  │ #TX003 │ Bob W.  │ Payout  │$850.00 │ Pending       │ |
|  └────────────────────────────────────────────────────────┘ |
+--------------------------------------------------------------+
```

```
Payout Management

+--------------------------------------------------------------|
|  Payouts                                    [Approve Selected]|
|  ─────────────────────────────────────────────────────────   |
|  Filters: [Pending▼] [Period▼] [Trainer▼]                   |
|                                                              |
|  ┌────────────────────────────────────────────────────────┐ |
|  │ Trainer     │ Period    │ Amount   │ Fees   │ Net     │ |
|  ├────────────────────────────────────────────────────────┤ |
|  │ John Smith  │ Jan 1-31 │$1,200   │ $180   │$1,020   │ [Approve]│
|  │ Jane Doe    │ Jan 1-31 │ $950    │ $142.50│ $807.50 │ [Approve]│ |
|  │ Bob Wilson  │ Jan 1-31 │$1,450   │ $217.50│$1,232.50│ [Hold]   │ |
|  └────────────────────────────────────────────────────────┘ |
|                                                              |
|  Total Pending: $3,600.00                                    |
+--------------------------------------------------------------+
```

## Dependencies
- Payment gateway (Stripe)
- Bank account verification
- Tax calculation service
- Financial reporting tools

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Transaction tracking working
- [ ] Refund processing functional
- [ ] Payout system working
- [ ] Financial reports generated
- [ ] Dispute handling implemented
- [ ] Audit trails complete
- [ ] Unit tests passing
- [ ] Code reviewed
- [ ] Documentation updated

## Notes
- Ensure PCI compliance
- Secure handling of financial data
- Accurate fee calculations
- Timely payouts to trainers
- Clear refund policies
- Proper tax documentation
- Regular reconciliation
