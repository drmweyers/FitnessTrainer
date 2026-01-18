# Story 010-05: Issue Refunds

**Parent Epic**: [EPIC-010 - Payment & Billing](../epics/epic-010-payment-billing.md)
**Story ID**: STORY-010-05
**Priority**: P0 (Critical)
**Story Points**: 8
**Sprint**: Sprint 11

## User Story
**As a** trainer
**I want to** process refunds for clients
**So that I** can handle cancellations and disputes fairly

## Acceptance Criteria
- [ ] Can initiate full or partial refund
- [ ] Can select refund amount (up to original transaction)
- [ ] Must provide refund reason
- [ ] Automatic refund processing through Stripe
- [ ] Refund status tracking (pending, completed, failed)
- [ ] Credit note generated for refunds
- [ ] Client balance adjusted automatically
- [ ] Session credits revoked proportionally
- [ ] Refund notifications sent to client
- [ ] Refund policy enforcement (time limits, conditions)
- [ ] Refund history and audit trail

## Technical Implementation

### Frontend Tasks
1. **Create RefundModal Component**
   - Transaction selection dropdown
   - Refund amount input (with max validation)
   - Refund reason selector + custom input
   - Session credit adjustment preview
   - Confirmation step with summary
   - Refund policy display

2. **Create RefundHistory Component**
   - List of all refunds for trainer
   - Status indicators
   - Filter by status, date, amount
   - Export functionality
   - Refund details modal

3. **Create CreditNoteViewer Component**
   - Display credit note for refund
   - Download PDF option
   - Email credit note to client

### Backend Tasks
1. **Create Refund Endpoints**
   ```typescript
   POST /api/billing/refunds - Initiate refund
   GET  /api/billing/refunds - List refunds
   GET  /api/billing/refunds/:id - Get refund details
   GET  /api/billing/refunds/policy - Get refund policy
   POST /api/billing/refunds/:id/cancel - Cancel pending refund
   GET  /api/billing/transactions/:id/refundable-amount - Get max refundable amount
   ```

2. **Implement RefundService**
   ```typescript
   class RefundService {
     // Core refund operations
     async createRefund(data: CreateRefundDto, trainerId: string): Promise<Refund>
     async processRefund(refundId: string): Promise<RefundResult>
     async getRefund(refundId: string): Promise<Refund>
     async listRefunds(filters: RefundFilters): Promise<Refund[]>

     // Validation and policy
     async validateRefund(transactionId: string, amount: number): Promise<ValidationResult>
     async checkRefundPolicy(transactionId: string): Promise<RefundPolicy>
     async canRefund(transactionId: string): Promise<boolean>

     // Adjustments
     async adjustSessionCredits(transactionId: string, refundAmount: number): Promise<void>
     async generateCreditNote(refundId: string): Promise<CreditNote>
     async reverseCommission(transactionId: string, refundAmount: number): Promise<void>

     // Notifications
     async notifyRefundInitiated(refund: Refund): Promise<void>
     async notifyRefundCompleted(refund: Refund): Promise<void>
     async notifyRefundFailed(refund: Refund, error: Error): Promise<void>
   }
   ```

3. **Stripe Integration - Refunds**
   ```typescript
   class StripeRefundService {
     private stripe: Stripe;

     async createRefund(params: {
       charge: string;
       amount?: number; // Optional for partial refund
       reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'expired_uncaptured_charge';
       metadata?: Record<string, any>;
       idempotency_key?: string;
     }): Promise<Stripe.Refund>

     async retrieveRefund(refundId: string): Promise<Stripe.Refund>
     async listRefunds(params: Stripe.RefundListParams): Promise<Stripe.ApiList<Stripe.Refund>>
     async updateRefund(refundId: string, params: Stripe.RefundUpdateParams): Promise<Stripe.Refund>
   }
   ```

4. **Refund Policy Engine**
   ```typescript
   class RefundPolicyService {
     private readonly REFUND_WINDOW_DAYS = 30;
     private readonly PARTIAL_REFUND_RULES = {
       used_sessions: 0.75, // 75% refund if 1-3 sessions used
       time_passed: 0.50,   // 50% refund if >15 days
     };

     async getRefundPolicy(trainerId: string): Promise<RefundPolicy>
     async calculateRefundableAmount(transaction: Transaction): Promise<number>
     async checkEligibility(transaction: Transaction): Promise<EligibilityResult>
     async applyRefundRules(transaction: Transaction, requestedAmount: number): Promise<RefundCalculation>
   }
   ```

5. **Credit Note Generator**
   ```typescript
   class CreditNoteService {
     async generateCreditNote(refund: Refund): Promise<CreditNote> {
       const creditNote = {
         id: this.generateCreditNoteId(),
         refundId: refund.id,
         clientName: refund.transaction.payer.name,
         trainerName: refund.transaction.payee.name,
         originalAmount: refund.transaction.amount,
         refundAmount: refund.amount,
         refundDate: refund.createdAt,
         reason: refund.reason,
         currency: refund.currency,
       };

       await this.saveCreditNote(creditNote);
       await this.generatePDF(creditNote);
       return creditNote;
     }

     async emailCreditNote(creditNoteId: string, recipientEmail: string): Promise<void>
   }
   ```

6. **Session Credit Adjustment**
   ```typescript
   class SessionCreditAdjustmentService {
     async revokeCreditsOnRefund(transactionId: string, refundPercentage: number): Promise<void> {
       const purchase = await this.getPurchaseByTransaction(transactionId);
       const credits = await this.getSessionCredits(purchase.id);

       const creditsToRevoke = Math.ceil(credits.totalSessions * (refundPercentage / 100));
       const newUsedCount = credits.usedSessions + creditsToRevoke;

       await this.updateSessionCredits(credits.id, {
         usedSessions: newUsedCount,
       });

       await this.logCreditRevocation(credits.id, creditsToRevoke, 'refund', transactionId);
     }
   }
   ```

7. **Database Schema Updates**
   ```sql
   CREATE TABLE refunds (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     transaction_id UUID NOT NULL REFERENCES transactions(id),
     amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
     currency VARCHAR(3) NOT NULL,
     reason VARCHAR(100) NOT NULL,
     reason_details TEXT,
     status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
     stripe_refund_id VARCHAR(255) UNIQUE,
     initiated_by UUID NOT NULL REFERENCES users(id),
     approved_by UUID REFERENCES users(id),
     metadata JSONB DEFAULT '{}',
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     completed_at TIMESTAMP
   );

   CREATE INDEX idx_refunds_transaction ON refunds(transaction_id);
   CREATE INDEX idx_refunds_initiator ON refunds(initiated_by);
   CREATE INDEX idx_refunds_status ON refunds(status);
   CREATE INDEX idx_refunds_stripe ON refunds(stripe_refund_id);

   CREATE TABLE credit_notes (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     refund_id UUID NOT NULL REFERENCES refunds(id),
     credit_note_number VARCHAR(50) UNIQUE NOT NULL,
     client_id UUID NOT NULL REFERENCES users(id),
     trainer_id UUID NOT NULL REFERENCES users(id),
     original_amount DECIMAL(10,2) NOT NULL,
     refund_amount DECIMAL(10,2) NOT NULL,
     currency VARCHAR(3) NOT NULL,
     issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
     pdf_url VARCHAR(500),
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_credit_notes_refund ON credit_notes(refund_id);
   CREATE INDEX idx_credit_notes_client ON credit_notes(client_id);
   CREATE INDEX idx_credit_notes_number ON credit_notes(credit_note_number);

   CREATE TABLE refund_policies (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     trainer_id UUID NOT NULL REFERENCES users(id),
     refund_window_days INTEGER NOT NULL DEFAULT 30,
     allow_partial_refunds BOOLEAN DEFAULT true,
     full_refund_cutoff_days INTEGER,
     conditions JSONB DEFAULT '{}',
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_refund_policies_trainer ON refund_policies(trainer_id);

   CREATE TABLE session_credit_adjustments (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     session_credit_id UUID NOT NULL REFERENCES session_credits(id),
     adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('revoke', 'grant', 'expire')),
     amount INTEGER NOT NULL,
     reason VARCHAR(100) NOT NULL,
     reference_id UUID, -- Can be refund_id, etc.
     reference_type VARCHAR(50),
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_credit_adjustments_credit ON session_credit_adjustments(session_credit_id);
   CREATE INDEX idx_credit_adjustments_reference ON session_credit_adjustments(reference_id);
   ```

### Data Models
```typescript
interface Refund {
  id: string;
  transactionId: string;
  transaction: Transaction;
  amount: number;
  currency: string;
  reason: string;
  reasonDetails?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  stripeRefundId?: string;
  initiatedBy: string;
  initiatedByUser: User;
  approvedBy?: string;
  approvedByUser?: User;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

interface CreditNote {
  id: string;
  refundId: string;
  refund: Refund;
  creditNoteNumber: string;
  clientId: string;
  client: User;
  trainerId: string;
  trainer: User;
  originalAmount: number;
  refundAmount: number;
  currency: string;
  issueDate: Date;
  pdfUrl?: string;
  createdAt: Date;
}

interface RefundPolicy {
  id: string;
  trainerId: string;
  refundWindowDays: number;
  allowPartialRefunds: boolean;
  fullRefundCutoffDays?: number;
  conditions: {
    requireReason?: boolean;
    maxRefundPercentage?: number;
    excludedPlans?: string[];
  };
  isActive: boolean;
}

interface CreateRefundDto {
  transactionId: string;
  amount: number;
  reason: string;
  reasonDetails?: string;
  revokeCredits?: boolean;
}

interface RefundCalculation {
  maxRefundable: number;
  requestedAmount: number;
  approvedAmount: number;
  creditsToRevoke: number;
  commissionToReverse: number;
  reason: string;
}

interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  maxRefundable: number;
  policy: RefundPolicy;
}
```

## Test Cases

### 1. Happy Path Tests
- Process full refund within policy window
- Process partial refund
- Refund reason required and saved
- Credit note generated
- Session credits revoked correctly
- Client notified of refund
- Commission reversed to trainer
- Refund status updates correctly

### 2. Stripe Integration Tests
- Refund created in Stripe
- Partial refund amount correct
- Full refund processes entire transaction
- Stripe refund ID captured
- Webhook events processed
- Idempotent refund requests

### 3. Policy Enforcement Tests
- Refund rejected outside window
- Partial refund limits enforced
- Used sessions affect refund amount
- Time-based reduction applied
- Custom trainer policies respected

### 4. Session Credit Tests
- Credits revoked proportionally
- Cannot revoke more than used
- Credit adjustment log created
- Remaining credits updated correctly

### 5. Commission Tests
- Commission reversed on refund
- Partial refund reverses proportional commission
- Commission reversal logged

### 6. Security Tests
- **CRITICAL**: Trainer can only refund their own transactions
- **CRITICAL**: Refund amount cannot exceed transaction amount
- **CRITICAL**: Authorization required to initiate refund
- **CRITICAL**: SQL injection prevention
- **CRITICAL**: XSS protection in refund display
- **CRITICAL**: CSRF protection on refund endpoints
- Refund amount validated server-side
- Refund reason sanitized

### 7. Edge Cases
- Refund already refunded transaction
- Refund amount of zero
- Refund with negative amount (rejection)
- Concurrent refund attempts
- Refund after chargeback
- Refund for subscription payment

### 8. Notification Tests
- Refund initiated notification to client
- Refund completed notification
- Credit note email delivery
- Failed refund notification

## UI/UX Mockups

```
+--------------------------------------------------+
|  Issue Refund                                    |
|                                                  |
|  Select Transaction:                             |
|  [+ Search Transaction ______________]  [Browse] |
|                                                  |
|  Selected:                                       |
|  Transaction: #txn_1abc123                      |
|  Client: John Doe                                |
|  Amount: $700.00 (10-Session Package)           |
|  Date: Jan 15, 2024                              |
|                                                  |
|  Refund Details:                                 |
|  ───────────────────────────────────             |
|  Maximum refundable: $700.00                     |
|                                                  |
|  Refund Amount: [$700.00]                        |
|                                                  |
|  Refund Reason: [Dissatisfied with service ▼]    |
|  ○ Duplicate payment                             |
|  ○ Service not provided                         |
|  ○ Client cancellation                           |
|  ○ Schedule conflict                             |
|  ○ Other: [____________________]                 |
|                                                  |
|  Additional Details:                             |
|  [_________________________________________]     |
|  [_________________________________________]     |
|                                                  |
|  Session Credits:                                |
|  ☑ Revoke credits proportionally                 |
|  This will remove 10 sessions from client        |
|                                                  |
|  Summary:                                        |
|  • Refund amount: $700.00                        |
|  • Credits to revoke: 10                         |
|  • Commission to reverse: $35.00                 |
|  • Net client refund: $700.00                    |
|                                                  |
|  ⚠ This action cannot be undone.                 |
|                                                  |
|  [Cancel]  [Process Refund →]                    |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Refund Policy                                   |
|                                                  |
|  Standard Refund Policy                          |
|  ─────────────────────────────                   |
|  • Full refunds within 30 days of purchase       |
|  • Partial refunds available after 30 days       |
|  • Refunds processed within 5-7 business days     |
|  • Session credits will be revoked               |
|                                                  |
|  Refund Calculation Rules:                       |
|  ─────────────────────────────                   |
|  Time Since Purchase      Refund Percentage       |
|  0-7 days                 100%                    |
|  8-14 days                75%                     |
|  15-30 days               50%                     |
|  30+ days                 Case-by-case            |
|                                                  |
|  Used sessions reduce refund proportionally       |
|                                                  |
|  [Customize Policy]                               |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Refund History                                  |
|                                                  |
|  Filter: [All Status ▼]  Search: [___________]   |
|                                                  |
|  +--------------------------------------------+  |
|  |  RFD-2024-001                    $700.00   |  |
|  |  John Doe - 10 Session Package             |  |
|  |  Reason: Service not provided              |  |
|  |  Jan 20, 2024               [Completed ✓] |  |
|  |  [View Details] [Credit Note]             |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  |  RFD-2024-002                    $350.00   |  |
|  |  Jane Smith - 5 Session Package            |  |
|  |  Reason: Client cancellation (partial)     |  |
|  |  Jan 18, 2024               [Processing]  |  |
|  |  [View Details]                           |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  |  RFD-2024-003                    $85.00    |  |
|  |  Mike Brown - Single Session               |  |
|  |  Reason: Schedule conflict                |  |
|  |  Jan 15, 2024               [Completed ✓] |  |
|  |  [View Details] [Credit Note]             |  |
|  +--------------------------------------------+  |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Refund Details                                  |
|                                                  |
|  Refund: RFD-2024-001                            |
|  Status: [Completed ✓]                           |
|                                                  |
|  Original Transaction                            |
|  ───────────────────────────────────             |
|  Transaction ID: #txn_1abc123                   |
|  Client: John Doe                                |
|  Amount: $700.00                                 |
|  Date: January 15, 2024                          |
|  Payment Method: Visa •••• 4242                 |
|                                                  |
|  Refund Information                              |
|  ───────────────────────────────────             |
|  Refund Amount: $700.00                          |
|  Refund Reason: Service not provided             |
|  Processed: January 20, 2024                     |
|  Stripe Refund ID: re_123abc456def              |
|                                                  |
|  Adjustments                                     |
|  ───────────────────────────────────             |
|  Session Credits Revoked: 10                     |
|  Commission Reversed: $35.00                     |
|                                                  |
|  Actions:                                        |
|  [Download Credit Note] [Email to Client]        |
|  [View Transaction]                              |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  CREDIT NOTE                                     |
|                                                  |
|  Credit Note: CN-2024-001                        |
|  Date: January 20, 2024                          |
|                                                  |
|  FROM:                                           |
|  Jane Smith Fitness                             |
|  trainer@fitpro.com                             |
|                                                  |
|  TO:                                             |
|  John Doe                                       |
|  john.doe@email.com                             |
|                                                  |
|  CREDIT DETAILS:                                 |
|  ──────────────────────────────────              |
|  Original Transaction: txn_1abc123              |
|  Original Amount: $700.00                        |
|  Credit Amount: $700.00                          |
|  Reason: Service not provided                   |
|                                                  |
|  This credit note serves as proof of refund      |
|  for the transaction referenced above.          |
|                                                  |
|  Questions? Contact: trainer@fitpro.com         |
|                                                  |
|  [Download PDF]  [Print]                         |
+--------------------------------------------------+
```

## Dependencies
- Payment processing implemented (Story 010-03)
- Transaction history available
- Session credits system (Story 010-02)
- Commission system (Story 010-03)
- Email service configured
- Stripe account set up for refunds

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests with Stripe refunds
- [ ] Refund policy engine tested
- [ ] Credit note generation working
- [ ] Session credit adjustments tested
- [ ] Commission reversal tested
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Security review passed

## Notes
- **CRITICAL SECURITY**: Never allow refund amount greater than original transaction.
- **CRITICAL SECURITY**: Always verify trainer owns the transaction before allowing refund.
- **CRITICAL**: Use Stripe's idempotency keys to prevent duplicate refunds.
- Implement refund policy enforcement at the service layer, not just UI.
- Consider implementing approval workflow for large refunds.
- Credit notes should be stored permanently for audit purposes.
- Refund reason tracking helps identify business issues.
- Consider automatic refund for failed services (e.g., trainer no-show).
- Send clear communication to clients about refund timeline (5-7 business days).
- Log all refund attempts for fraud detection.
- Implement rate limiting on refund endpoints to prevent abuse.
- Consider refund analytics to identify problematic services or trainers.
- Ensure commission reversal doesn't affect already-paid-out amounts (handle in next payout cycle).
