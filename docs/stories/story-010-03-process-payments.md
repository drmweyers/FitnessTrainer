# Story 010-03: Process Payments

**Parent Epic**: [EPIC-010 - Payment & Billing](../epics/epic-010-payment-billing.md)
**Story ID**: STORY-010-03
**Priority**: P0 (Critical)
**Story Points**: 21
**Sprint**: Sprint 11

## User Story
**As a** trainer
**I want to** have payments processed automatically and reliably
**So that I** receive payment for my services without manual intervention

## Acceptance Criteria
- [ ] Automatic payment collection from clients
- [ ] Real-time payment status tracking
- [ ] Failed payment notifications to both trainer and client
- [ ] Automatic retry logic for failed payments
- [ ] Payment confirmation sent to client
- [ ] Commission deducted automatically (platform fee)
- [ ] Payout scheduled to trainer's bank account
- [ ] Detailed transaction records maintained
- [ ] Payment history accessible to trainer
- [ ] Webhook events processed reliably
- [ ] Idempotency to prevent duplicate charges
- [ ] Payment reconciliation reports

## Technical Implementation

### Frontend Tasks
1. **Create PaymentDashboard Component**
   - Real-time payment status display
   - Recent transactions list
   - Failed payment alerts
   - Pending payment queue
   - Revenue overview cards
   - Filter and search capabilities

2. **Create TransactionList Component**
   - Paginated transaction history
   - Status badges (pending, completed, failed)
   - Transaction details modal
   - Export functionality
   - Advanced filters (date, amount, status)

3. **Create PaymentAlerts Component**
   - Failed payment notifications
   - Retry status updates
   - Payment method expiry warnings
   - Action buttons for manual intervention

### Backend Tasks
1. **Create Payment Processing Endpoints**
   ```typescript
   POST /api/billing/charge - Process payment charge
   GET  /api/billing/payments/status - Get payment status
   POST /api/billing/payments/:id/retry - Retry failed payment
   GET  /api/billing/transactions - List transactions
   GET  /api/billing/transactions/:id - Transaction details
   POST /api/billing/webhooks/stripe - Stripe webhook handler
   GET  /api/billing/reconciliation - Payment reconciliation report
   POST /api/billing/sessions/deduct - Deduct session from credits
   ```

2. **Implement PaymentService**
   ```typescript
   class PaymentService {
     // Core payment processing
     async processCharge(data: ChargeDto): Promise<PaymentResult>
     async createPaymentIntent(amount: number, currency: string, metadata: PaymentMetadata)
     async confirmPayment(paymentIntentId: string, paymentMethodId: string)

     // Payment status management
     async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus>
     async updatePaymentStatus(transactionId: string, status: PaymentStatus)
     async handlePaymentWebhook(event: Stripe.Event): Promise<void>

     // Retry logic
     async retryPayment(transactionId: string): Promise<PaymentResult>
     async scheduleRetry(transactionId: string, retryAt: Date): Promise<void>
     async executeScheduledRetries(): Promise<void>

     // Commission and payouts
     async calculateCommission(amount: number): Promise<number>
     async deductCommission(transactionId: string): Promise<void>
     async schedulePayout(trainerId: string, amount: number): Promise<void>
     async processPendingPayouts(): Promise<void>

     // Transaction management
     async createTransaction(data: TransactionDto): Promise<Transaction>
     async getTransaction(transactionId: string): Promise<Transaction>
     async listTransactions(filters: TransactionFilters): Promise<Transaction[]>
     async refundTransaction(transactionId: string, amount?: number): Promise<Refund>
   }
   ```

3. **Stripe Integration - Payment Processing**
   ```typescript
   class StripePaymentService {
     private stripe: Stripe;

     // Payment Intents
     async createPaymentIntent(params: {
       amount: number;
       currency: string;
       customer?: string;
       payment_method?: string;
       metadata: Record<string, any>;
       idempotency_key?: string;
     }): Promise<Stripe.PaymentIntent>

     async confirmPaymentIntent(paymentIntentId: string, params: {
       payment_method: string;
       return_url?: string;
     }): Promise<Stripe.PaymentIntent>

     async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>

     // Payment Methods
     async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod>
     async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod>

     // Customers
     async createCustomer(params: {
       email?: string;
       name?: string;
       payment_method?: string;
       metadata?: Record<string, any>;
     }): Promise<Stripe.Customer>

     // Webhooks
     async constructWebhookEvent(payload: string, signature: string, webhookSecret: string): Promise<Stripe.Event>

     // Connect for payouts
     async createAccount(trainerId: string, params: Stripe.AccountCreateParams): Promise<Stripe.Account>
     async createTransfer(params: Stripe.TransferCreateParams): Promise<Stripe.Transfer>
   }
   ```

4. **Webhook Event Handlers**
   ```typescript
   class WebhookHandler {
     async handlePaymentIntentSucceeded(event: Stripe.PaymentIntentSucceededEvent): Promise<void>
     async handlePaymentIntentFailed(event: Stripe.PaymentIntentFailedEvent): Promise<void>
     async handlePaymentIntentProcessing(event: Stripe.PaymentIntentProcessingEvent): Promise<void>
     async handlePaymentIntentRequiresAction(event: Stripe.PaymentIntentRequiresActionEvent): Promise<void>
     async handleChargeRefunded(event: Stripe.ChargeRefundedEvent): Promise<void>
     async handleChargeRefundUpdated(event: Stripe.ChargeRefundUpdatedEvent): Promise<void>
     async handlePaymentMethodAttached(event: Stripe.PaymentMethodAttachedEvent): Promise<void>
     async handlePaymentMethodDetached(event: Stripe.PaymentMethodDetachedEvent): Promise<void>
     async handleInvoicePaid(event: Stripe.InvoicePaidEvent): Promise<void>
     async handleInvoicePaymentFailed(event: Stripe.InvoicePaymentFailedEvent): Promise<void>
   }
   ```

5. **Retry Logic Implementation**
   ```typescript
   class PaymentRetryService {
     private readonly RETRY_SCHEDULE = [
       { hours: 1, attempt: 1 },    // Retry after 1 hour
       { hours: 6, attempt: 2 },    // Retry after 6 hours
       { hours: 24, attempt: 3 },   // Retry after 1 day
       { hours: 72, attempt: 4 },   // Retry after 3 days
     ];

     async scheduleRetry(transactionId: string): Promise<void>
     async executeScheduledRetries(): Promise<Promise<void>[]>
     async shouldRetry(failureCode: string, attemptNumber: number): Promise<boolean>
     async updateRetryStatus(transactionId: string, success: boolean): Promise<void>
   }
   ```

6. **Commission Service**
   ```typescript
   class CommissionService {
     private readonly PLATFORM_FEE_RATE = 0.05; // 5%

     async calculateCommission(amount: number): Promise<number>
     async deductCommission(transactionId: string): Promise<CommissionRecord>
     async getCommissionByTrainer(trainerId: string, period: DateRange): Promise<CommissionSummary>
     async generateCommissionReport(trainerId: string, month: number, year: number): Promise<Report>
   }
   ```

7. **Database Schema Updates**
   ```sql
   CREATE TABLE transactions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     payer_id UUID NOT NULL REFERENCES users(id),
     payee_id UUID NOT NULL REFERENCES users(id),
     amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
     currency VARCHAR(3) NOT NULL DEFAULT 'USD',
     type VARCHAR(50) NOT NULL CHECK (type IN ('payment', 'refund', 'payout', 'fee', 'commission')),
     status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
     stripe_payment_intent_id VARCHAR(255) UNIQUE,
     stripe_charge_id VARCHAR(255) UNIQUE,
     description TEXT,
     failure_code VARCHAR(50),
     failure_message TEXT,
     metadata JSONB DEFAULT '{}',
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     completed_at TIMESTAMP
   );

   CREATE INDEX idx_transactions_payer ON transactions(payer_id);
   CREATE INDEX idx_transactions_payee ON transactions(payee_id);
   CREATE INDEX idx_transactions_status ON transactions(status);
   CREATE INDEX idx_transactions_type ON transactions(type);
   CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
   CREATE INDEX idx_transactions_stripe_pi ON transactions(stripe_payment_intent_id);

   CREATE TABLE commission_records (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     transaction_id UUID NOT NULL REFERENCES transactions(id),
     trainer_id UUID NOT NULL REFERENCES users(id),
     amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
     rate DECIMAL(5,4) NOT NULL CHECK (rate > 0),
     description VARCHAR(255),
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_commission_trainer ON commission_records(trainer_id);
   CREATE INDEX idx_commission_transaction ON commission_records(transaction_id);

   CREATE TABLE payment_retries (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     transaction_id UUID NOT NULL REFERENCES transactions(id),
     attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
     scheduled_at TIMESTAMP NOT NULL,
     executed_at TIMESTAMP,
     status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'success', 'failed')),
     failure_reason TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_payment_retries_transaction ON payment_retries(transaction_id);
   CREATE INDEX idx_payment_retries_scheduled ON payment_retries(scheduled_at, status);
   CREATE INDEX idx_payment_retries_status ON payment_retries(status);

   CREATE TABLE payout_batches (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     trainer_id UUID NOT NULL REFERENCES users(id),
     total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
     transaction_count INTEGER NOT NULL CHECK (transaction_count > 0),
     currency VARCHAR(3) NOT NULL DEFAULT 'USD',
     status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
     stripe_payout_id VARCHAR(255) UNIQUE,
     period_start DATE NOT NULL,
     period_end DATE NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     processed_at TIMESTAMP
   );

   CREATE INDEX idx_payout_batches_trainer ON payout_batches(trainer_id);
   CREATE INDEX idx_payout_batches_status ON payout_batches(status);
   ```

### Data Models
```typescript
interface Transaction {
  id: string;
  payerId: string;
  payer?: User;
  payeeId: string;
  payee?: User;
  amount: number;
  currency: string;
  type: 'payment' | 'refund' | 'payout' | 'fee' | 'commission';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  description?: string;
  failureCode?: string;
  failureMessage?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

interface PaymentRetry {
  id: string;
  transactionId: string;
  transaction: Transaction;
  attemptNumber: number;
  scheduledAt: Date;
  executedAt?: Date;
  status: 'pending' | 'executing' | 'success' | 'failed';
  failureReason?: string;
  createdAt: Date;
}

interface CommissionRecord {
  id: string;
  transactionId: string;
  transaction: Transaction;
  trainerId: string;
  trainer: User;
  amount: number;
  rate: number;
  description?: string;
  createdAt: Date;
}

interface PayoutBatch {
  id: string;
  trainerId: string;
  trainer: User;
  totalAmount: number;
  transactionCount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stripePayoutId?: string;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  processedAt?: Date;
}

interface ChargeDto {
  clientId: string;
  trainerId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  description: string;
  metadata?: Record<string, any>;
  savePaymentMethod?: boolean;
}

interface PaymentResult {
  success: boolean;
  transaction?: Transaction;
  error?: {
    code: string;
    message: string;
    type: string;
  };
  requiresAction?: boolean;
  nextAction?: {
    type: string;
    redirectUrl?: string;
  };
}
```

## Test Cases

### 1. Happy Path Tests
- Process successful payment charge
- Payment intent created and confirmed
- Commission deducted correctly
- Payout scheduled for trainer
- Transaction recorded with completed status
- Payment confirmation email sent
- Session credits allocated to client

### 2. Payment Failure Tests
- Card declined handling
- Insufficient funds handling
- Expired card detection
- CVC mismatch handling
- Processing failure recovery
- Network timeout handling
- Retry logic execution
- Maximum retry attempts

### 3. Webhook Tests
- Payment intent succeeded webhook
- Payment intent failed webhook
- Payment intent requires action webhook
- Charge refunded webhook
- Invoice payment failed webhook
- Webhook signature verification
- Duplicate webhook prevention
- Webhook replay handling

### 4. Idempotency Tests
- Duplicate charge prevention
- Idempotency key enforcement
- Concurrent payment protection
- Race condition handling

### 5. Security Tests
- **CRITICAL**: Payment amount validation (server-side only)
- **CRITICAL**: User authorization for charges
- **CRITICAL**: Webhook signature verification
- **CRITICAL**: SQL injection prevention
- **CRITICAL**: XSS protection in transaction display
- **CRITICAL**: CSRF protection on charge endpoints
- Payment method ownership verification
- Transaction access control (payer/payee only)
- Audit logging for all payment operations

### 6. Commission Tests
- Commission calculated at correct rate
- Commission deducted before payout
- Commission records created accurately
- Multiple commission tiers (if applicable)
- Commission report generation

### 7. Performance Tests
- Process 1000 payments/minute
- Webhook processing < 1 second
- Retry execution performance
- Transaction query performance with 100k+ records
- Commission calculation performance

### 8. Integration Tests
- End-to-end payment flow
- Stripe integration with test cards
- Email notification delivery
- Session credit allocation
- Payout scheduling

## UI/UX Mockups

```
+--------------------------------------------------+
|  Payment Processing Dashboard                   |
|                                                  |
|  Overview (This Month)                           |
|  +-------------+  +-------------+  +----------+ |
|  |  Total      |  |  Successful |  |  Failed  | |
|  |  $12,450    |  |  147        |  |  3       | |
|  +-------------+  +-------------+  +----------+ |
|                                                  |
|  Recent Transactions                             |
|  Filter: [All ▼]  Status: [Any ▼]  Search: [__] |
|                                                  |
|  +--------------------------------------------+  |
|  |  ✓ John Doe - 10 Session Package    $700  |  |
|  |     Completed 2 min ago                  |  |
|  |     [View Details]                       |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  |  ✓ Jane Smith - Monthly Sub         $899  |  |
|  |     Completed 15 min ago                 |  |
|  |     [View Details]                       |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  |  ✗ Mike Brown - 5 Sessions        $375   |  |
|  |     Failed: Card declined (45 min ago)    |  |
|  |     [Retry] [View Details]               |  |
|  +--------------------------------------------+  |
|                                                  |
|  Failed Payments (3)                             |
|  Need attention: [Retry All] [Send Reminders]    |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Transaction Details                             |
|                                                  |
|  Transaction #txn_1abc123xyz                     |
|  Status: [Completed ✓]                           |
|                                                  |
|  Payment Information                             |
|  ─────────────────────────────                   |
|  Payer: John Doe (john@example.com)             |
|  Payee: Jane Smith (Trainer)                     |
|  Amount: $700.00 USD                             |
|  Date: January 15, 2024, 3:45 PM                 |
|                                                  |
|  Breakdown                                       |
|  ─────────────────────────────                   |
|  Plan: 10-Session Package                        |
|  Sessions: 10                                    |
|  Subtotal: $700.00                               |
|  Tax: $0.00                                     |
|  Commission (5%): $35.00                         |
|  Net to Trainer: $665.00                         |
|                                                  |
|  Payment Method                                  |
|  ─────────────────────────────                   |
|  Type: Credit Card                               |
|  Card: Visa ending in 4242                       |
|  Expires: 12/25                                  |
|                                                  |
|  Timeline                                        |
|  ─────────────────────────────                   |
|  ✓ Jan 15 3:45 PM - Payment initiated           |
|  ✓ Jan 15 3:45 PM - Card authorized              |
|  ✓ Jan 15 3:46 PM - Payment completed            |
|  ✓ Jan 15 3:46 PM - Commission deducted          |
|  ✓ Jan 15 3:46 PM - Payout scheduled            |
|                                                  |
|  Actions:                                        |
|  [View Receipt] [Refund] [Download Invoice]      |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Payment Failed Alert                            |
|                                                  |
|  ⚠ Payment Failed                                |
|                                                  |
|  Client: Mike Brown                              |
|  Plan: 5-Session Package ($375.00)               |
|                                                  |
|  Reason: Card declined - Insufficient funds      |
|  Time: 45 minutes ago                            |
|                                                  |
|  Automatic Retry Status:                         |
|  ✓ Retry 1: Scheduled in 15 minutes              |
|  ○ Retry 2: In 6 hours                          |
|  ○ Retry 3: In 24 hours                         |
|                                                  |
|  Actions:                                        |
|  [Retry Now] [Contact Client] [Cancel Retry]     |
|                                                  |
|  Client has been notified via email.             |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Commission & Payout Summary                     |
|                                                  |
|  This Month                                      |
|  ─────────────────────────────                   |
|  Gross Revenue: $12,450.00                       |
|  Commission (5%): $622.50                        |
|  Net Payout: $11,827.50                          |
|                                                  |
|  Upcoming Payout:                                |
|  Amount: $11,827.50                              |
|  Scheduled: January 31, 2024                     |
|  Bank Account: •••• 6789 (Chase)                |
|                                                  |
|  Recent Payouts                                  |
|  +-------------------------------------------+   |
|  |  Dec 31, 2023      $10,245.00  Completed  |   |
|  |  Nov 30, 2023      $9,875.00   Completed  |   |
|  |  Oct 31, 2023      $11,520.00  Completed  |   |
|  +-------------------------------------------+   |
|                                                  |
|  [View Full Payout History]                      |
+--------------------------------------------------+
```

## Dependencies
- Stripe Connect account configured for trainer payouts
- Payment methods saved (Story 010-02)
- Client-trainer relationships established
- Commission rate configured in system settings
- Email service for notifications
- Webhook endpoints configured in Stripe dashboard
- Session credit system ready (Story 010-02)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>90% coverage)
- [ ] Integration tests with Stripe completed
- [ ] **Security audit passed - Payment flow secure**
- [ ] **PCI DSS compliance verified**
- [ ] Webhook processing reliable with retry logic
- [ ] Idempotency working correctly
- [ ] Manual testing with Stripe test cards
- [ ] Load testing passed (1000 tx/min)
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Monitoring/alerting configured

## Notes
- **CRITICAL SECURITY**: All payment amounts must be validated server-side. Never trust client values.
- **CRITICAL SECURITY**: Use Stripe's idempotency keys to prevent duplicate charges.
- **CRITICAL SECURITY**: Webhook endpoints must verify Stripe signature before processing events.
- **CRITICAL SECURITY**: Never log full card numbers or CVC codes. Only log last 4 digits.
- Use Stripe Connect for marketplace-style payouts to trainers.
- Implement exponential backoff for failed payment retries.
- Consider implementing smart retry (e.g., retry at optimal times).
- Payment failures should trigger immediate notifications to both parties.
- Commission deduction should happen before payout calculation.
- Maintain detailed audit logs for all payment operations.
- Implement circuit breaker pattern for repeated webhook failures.
- Consider implementing fraud detection for suspicious patterns.
- Use database transactions for all payment-related database operations.
- Implement graceful degradation if Stripe services are temporarily unavailable.
- Monitor payment success rates and alert if below threshold.
