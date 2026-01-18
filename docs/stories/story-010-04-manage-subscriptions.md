# Story 010-04: Manage Subscriptions

**Parent Epic**: [EPIC-010 - Payment & Billing](../epics/epic-010-payment-billing.md)
**Story ID**: STORY-010-04
**Priority**: P0 (Critical)
**Story Points**: 13
**Sprint**: Sprint 11

## User Story
**As a** client
**I want to** manage my subscription settings
**So that I** can control my membership and payments

## Acceptance Criteria
- [ ] Can view current subscription details
- [ ] Can update payment method for subscription
- [ ] Can pause subscription (trainer-defined pause limits)
- [ ] Can cancel subscription with proper notice period
- [ ] Can change subscription plan (upgrade/downgrade)
- [ ] Can view upcoming renewal date and amount
- [ ] Receives renewal reminders before billing
- [ ] Prorated charges for plan changes
- [ ] Subscription history accessible
- [ ] Can resume paused subscription
- [ ] Clear cancellation confirmation

## Technical Implementation

### Frontend Tasks
1. **Create SubscriptionManager Component**
   - Current subscription overview card
   - Plan comparison for upgrades/downgrades
   - Payment method update form
   - Pause/Cancel actions with confirmations
   - Renewal timeline visualization
   - Subscription history timeline

2. **Create PlanChangeWizard Component**
   - Display available plans for upgrade/downgrade
   - Show prorated charge calculations
   - Effective date selection
   - Feature comparison table
   - Confirmation step

3. **Create SubscriptionTimeline Component**
   - Visual timeline of subscription events
   - Renewal history
   - Plan changes
   - Pauses and cancellations
   - Payment history for subscription

4. **Create CancelSubscriptionModal Component**
   - Cancellation reason collection
   - Impact summary (what happens when cancelled)
   - Offer retention incentives (optional)
   - Final confirmation step

### Backend Tasks
1. **Create Subscription Endpoints**
   ```typescript
   GET  /api/billing/subscriptions - List client subscriptions
   GET  /api/billing/subscriptions/:id - Get subscription details
   PUT  /api/billing/subscriptions/:id/plan - Change subscription plan
   PUT  /api/billing/subscriptions/:id/payment-method - Update payment method
   POST /api/billing/subscriptions/:id/pause - Pause subscription
   POST /api/billing/subscriptions/:id/resume - Resume paused subscription
   POST /api/billing/subscriptions/:id/cancel - Cancel subscription
   GET  /api/billing/subscriptions/:id/history - Subscription history
   GET  /api/billing/subscriptions/:id/upcoming-invoice - Next invoice preview
   ```

2. **Implement SubscriptionService**
   ```typescript
   class SubscriptionService {
     // Subscription management
     async createSubscription(data: CreateSubscriptionDto, clientId: string, trainerId: string)
     async getSubscription(subscriptionId: string, userId: string)
     async updateSubscriptionPlan(subscriptionId: string, newPlanId: string, userId: string)
     async pauseSubscription(subscriptionId: string, pauseReason?: string, userId: string)
     async resumeSubscription(subscriptionId: string, userId: string)
     async cancelSubscription(subscriptionId: string, cancellationData: CancellationDto, userId: string)

     // Payment method updates
     async updateSubscriptionPaymentMethod(subscriptionId: string, paymentMethodId: string, userId: string)

     // Calculations
     async calculateProration(subscriptionId: string, newPlanId: string): Promise<ProrationCalculation>
     async getUpcomingInvoice(subscriptionId: string): Promise<UpcomingInvoice>
     async calculateRenewalDate(subscriptionId: string): Promise<Date>

     // History and reporting
     async getSubscriptionHistory(subscriptionId: string): Promise<SubscriptionEvent[]>
     async getSubscriptionUsage(subscriptionId: string, period: DateRange): Promise<UsageSummary>
   }
   ```

3. **Stripe Integration - Subscriptions**
   ```typescript
   class StripeSubscriptionService {
     // Create and manage subscriptions
     async createSubscription(params: {
       customer: string;
       payment_method: string;
       items: [{ price: string }];
       metadata: Record<string, any>;
       payment_behavior?: 'default_incomplete' | 'error_if_incomplete';
     }): Promise<Stripe.Subscription>

     async updateSubscription(subscriptionId: string, params: Stripe.SubscriptionUpdateParams): Promise<Stripe.Subscription>
     async cancelSubscription(subscriptionId: string, params?: { cancel_at_period_end: boolean }): Promise<Stripe.Subscription>

     // Plan changes
     async updateSubscriptionItem(subscriptionItemId: string, params: { price: string }): Promise<Stripe.Subscription>

     // Pause collection
     async pauseSubscription(subscriptionId: string, behavior: 'keep_as_draft' | 'mark_uncollectible' | 'void'): Promise<Stripe.Subscription>
     async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription>

     // Invoices
     async retrieveUpcomingInvoice(subscriptionId: string): Promise<Stripe.Invoice>
     async createInvoice(subscriptionId: string): Promise<Stripe.Invoice>
   }
   ```

4. **Proration Calculator**
   ```typescript
   class ProrationService {
     async calculateProration(subscription: Subscription, newPlan: PricingPlan): Promise<ProrationResult> {
       const currentPeriodStart = subscription.currentPeriodStart;
       const currentPeriodEnd = subscription.currentPeriodEnd;
       const totalDays = this.daysBetween(currentPeriodStart, currentPeriodEnd);
       const daysUsed = this.daysBetween(currentPeriodStart, new Date());
       const daysRemaining = totalDays - daysUsed;

       const oldPlanDailyRate = subscription.pricingPlan.price / totalDays;
       const newPlanDailyRate = newPlan.price / totalDays;

       const oldPlanUnusedValue = oldPlanDailyRate * daysRemaining;
       const newPlanRemainingValue = newPlanDailyRate * daysRemaining;

       const proratedDifference = newPlanRemainingValue - oldPlanUnusedValue;

       return {
         daysRemaining,
         oldPlanDailyRate,
         newPlanDailyRate,
         creditAmount: oldPlanUnusedValue,
         newPlanCharge: newPlanRemainingValue,
         proratedCharge: proratedDifference,
         effectiveDate: new Date(),
       };
     }
   }
   ```

5. **Database Schema Updates**
   ```sql
   CREATE TABLE subscriptions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     client_id UUID NOT NULL REFERENCES users(id),
     trainer_id UUID NOT NULL REFERENCES users(id),
     pricing_plan_id UUID NOT NULL REFERENCES pricing_plans(id),
     stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
     stripe_customer_id VARCHAR(255) NOT NULL,
     status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'past_due', 'incomplete')),
     current_period_start TIMESTAMP NOT NULL,
     current_period_end TIMESTAMP NOT NULL,
     cancel_at_period_end BOOLEAN DEFAULT false,
     cancelled_at TIMESTAMP,
     pause_start TIMESTAMP,
     pause_end TIMESTAMP,
     pause_reason TEXT,
     cancellation_reason TEXT,
     metadata JSONB DEFAULT '{}',
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(client_id, trainer_id, pricing_plan_id, status)
   );

   CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);
   CREATE INDEX idx_subscriptions_trainer ON subscriptions(trainer_id);
   CREATE INDEX idx_subscriptions_status ON subscriptions(status);
   CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

   CREATE TABLE subscription_events (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     subscription_id UUID NOT NULL REFERENCES subscriptions(id),
     event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('created', 'updated', 'paused', 'resumed', 'cancelled', 'plan_changed', 'payment_method_changed')),
     previous_state JSONB,
     new_state JSONB,
     initiated_by UUID REFERENCES users(id),
     reason TEXT,
     metadata JSONB DEFAULT '{}',
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_subscription_events_subscription ON subscription_events(subscription_id);
   CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
   CREATE INDEX idx_subscription_events_date ON subscription_events(created_at DESC);

   CREATE TABLE subscription_invoices (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     subscription_id UUID NOT NULL REFERENCES subscriptions(id),
     stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
     invoice_number VARCHAR(100) UNIQUE,
     amount_due DECIMAL(10,2) NOT NULL,
     amount_paid DECIMAL(10,2) DEFAULT 0,
     currency VARCHAR(3) NOT NULL,
     status VARCHAR(50) NOT NULL,
     due_date DATE,
     paid_at TIMESTAMP,
     attempts INTEGER DEFAULT 0,
     next_payment_attempt TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_subscription_invoices_subscription ON subscription_invoices(subscription_id);
   CREATE INDEX idx_subscription_invoices_status ON subscription_invoices(status);
   ```

### Data Models
```typescript
interface Subscription {
  id: string;
  clientId: string;
  client?: User;
  trainerId: string;
  trainer?: User;
  pricingPlanId: string;
  pricingPlan?: PricingPlan;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: 'active' | 'paused' | 'cancelled' | 'past_due' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  pauseStart?: Date;
  pauseEnd?: Date;
  pauseReason?: string;
  cancellationReason?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface SubscriptionEvent {
  id: string;
  subscriptionId: string;
  eventType: 'created' | 'updated' | 'paused' | 'resumed' | 'cancelled' | 'plan_changed' | 'payment_method_changed';
  previousState?: Record<string, any>;
  newState: Record<string, any>;
  initiatedBy?: string;
  initiatedByUser?: User;
  reason?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

interface SubscriptionInvoice {
  id: string;
  subscriptionId: string;
  subscription?: Subscription;
  stripeInvoiceId: string;
  invoiceNumber: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: string;
  dueDate?: Date;
  paidAt?: Date;
  attempts: number;
  nextPaymentAttempt?: Date;
  createdAt: Date;
}

interface ProrationCalculation {
  daysRemaining: number;
  oldPlanDailyRate: number;
  newPlanDailyRate: number;
  creditAmount: number;
  newPlanCharge: number;
  proratedCharge: number;
  effectiveDate: Date;
}

interface UpcomingInvoice {
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  dueDate: Date;
  lineItems: {
    description: string;
    amount: number;
    period: { start: Date; end: Date };
  }[];
}

interface CancellationDto {
  reason: string;
  feedback?: string;
  cancelAtPeriodEnd?: boolean;
}

interface PlanChangeDto {
  newPlanId: string;
  effectiveImmediately?: boolean;
}
```

## Test Cases

### 1. Happy Path Tests
- View current subscription details
- Update payment method successfully
- Pause subscription for defined period
- Resume paused subscription
- Upgrade subscription plan with proration
- Downgrade subscription plan with credit
- Cancel subscription at period end
- Cancel subscription immediately

### 2. Plan Change Tests
- Proration calculation accuracy
- Upgrade charges immediately
- Downgrade credits remaining time
- Effective date selection
- Multiple plan changes in single period
- Plan change before first payment complete

### 3. Pause/Resume Tests
- Pause subscription (if allowed by trainer)
- Resume paused subscription
- Pause limit enforcement
- Automatic resume after pause period
- Billing after resume

### 4. Cancellation Tests
- Cancel at period end
- Cancel immediately (if allowed)
- Cancellation reason collected
- Access after cancellation
- Reactivation after cancellation (new subscription)
- Retention incentives offered

### 5. Payment Method Tests
- Update payment method
- Failed payment method update
- Payment method expires during subscription
- Backup payment method (if configured)

### 6. Stripe Integration Tests
- Subscription created in Stripe
- Plan changes sync with Stripe
- Pause collection works in Stripe
- Cancellation processes in Stripe
- Invoice generation accurate
- Webhook events for subscription updates

### 7. Security Tests
- **CRITICAL**: Client can only manage their own subscriptions
- **CRITICAL**: Trainer cannot cancel client subscription without permission
- **CRITICAL**: Payment method ownership verification
- **CRITICAL**: Cancellation requires authentication
- **CRITICAL**: SQL injection prevention
- **CRITICAL**: XSS protection in subscription display

### 8. Edge Cases
- Pause when already paused
- Resume when not paused
- Cancel already cancelled subscription
- Plan change to same plan
- Concurrent modification handling
- Subscription during trial period

### 9. Notification Tests
- Renewal reminder sent
- Payment failure notification
- Cancellation confirmation
- Plan change confirmation
- Pause/resume notifications

## UI/UX Mockups

```
+--------------------------------------------------+
|  My Subscription                                 |
|                                                  |
|  Current Plan: Monthly Premium                   |
|  Status: [Active ✓]                              |
|                                                  |
|  Plan Details:                                   |
|  • Unlimited sessions per month                  |
|  • Customized workout plans                      |
|  • Nutrition guidance                            |
|  • 24/7 chat support                             |
|                                                  |
|  Billing Information:                            |
|  ───────────────────────────────────             |
|  Monthly amount: $299.00                         |
|  Next billing: Feb 15, 2024                      |
|  Payment method: Visa •••• 4242                 |
|                                                  |
|  Quick Actions:                                  |
|  [Change Plan]  [Pause]  [Cancel Subscription]   |
|                                                  |
|  Need to update payment method?                  |
|  [Update Payment Method]                         |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Change Subscription Plan                        |
|                                                  |
|  Current Plan: Monthly Basic - $99/month         |
|                                                  |
|  Available Plans:                                |
|                                                  |
|  +---------------------+  +---------------------+ |
|  |  Monthly Premium    |  |  Yearly Pro         | |
|  |  $299/month         |  |  $2,999/year        | |
|  |  (Current Plan) ⦿   |  |  Save $589 (16%)    | |
|  |                     |  |                     | |
|  |  ✓ Unlimited        |  |  ✓ Unlimited        | |
|  |  ✓ All features     |  |  ✓ All features     | |
|  |                     |  |  ✓ Priority support | |
|  +---------------------+  +---------------------+ |
|                                                  |
|  Upgrade to Yearly Pro:                          |
|  ───────────────────────────────────             |
|  Prorated credit: $49.50                         |
|  Remaining period charge: $2,749.00             |
|  One-time charge today: $2,699.50                |
|  New billing cycle: Annual                       |
|                                                  |
|  When should this take effect?                   |
|  ⦿ Immediately (prorated)                        |
|  ○ Next billing period (Feb 15, 2024)            |
|                                                  |
|  [Keep Current Plan]  [Upgrade to Yearly Pro →]  |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Pause Subscription                               |
|                                                  |
|  You can pause your subscription for up to       |
|  2 months. During this time:                     |
|                                                  |
|  • You won't be charged                           |
|  • Session access will be suspended              |
|  • Your plan features will be on hold            |
|                                                  |
|  Select pause duration:                           |
|  ⦿ 1 month                                       |
|  ○ 2 months                                      |
|  ○ Custom: [___] months                          |
|                                                  |
|  Your subscription will resume automatically     |
|  on [resume date].                               |
|                                                  |
|  Reason for pause (optional):                    |
|  [________________________________________]       |
|                                                  |
|  [Cancel]  [Confirm Pause]                       |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Cancel Subscription                              |
|                                                  |
|  We're sorry to see you go!                       |
|                                                  |
|  Before you cancel, consider:                     |
|  • You can pause instead and resume later         |
|  • You can downgrade to a cheaper plan           |
|  • Your progress will be saved for 30 days       |
|                                                  |
|  What happens when you cancel:                    |
|  • Access continues until [end date]             |
|  • No further charges                             |
|  • All data retained for 30 days                  |
|  • Can reactivate anytime                         |
|                                                  |
|  Why are you cancelling? (Required)               |
|  ○ Too expensive                                 |
|  ○ Not using enough                              |
|  ○ Found alternative                             |
|  ○ Technical issues                              |
|  ○ Other: [_______________________]              |
|                                                  |
|  Additional feedback (optional):                 |
|  [_________________________________________]     |
|  [_________________________________________]     |
|                                                  |
|  ☑ I understand this action cannot be undone.    |
|                                                  |
|  [Never Mind, Keep Subscription]                 |
|  [Yes, Cancel Subscription]                      |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Subscription History                             |
|                                                  |
|  From: January 2024                              |
|                                                  |
|  Timeline:                                       |
|                                                  |
|  Jan 15  [Started]                               |
|           Subscribed to Monthly Premium          |
|                                                  |
|  Jan 20  [Plan Change]                           |
|           Upgraded to Yearly Pro                 |
|           One-time charge: $2,699.50            |
|                                                  |
|  Feb 15  [Payment Failed]                        |
|           Card declined - Updated payment method |
|                                                  |
|  Feb 15  [Payment Successful]                    |
|           $299.00 charged                        |
|                                                  |
|  Current: Active - Next billing Feb 15, 2025     |
|                                                  |
|  ------------------------------------------------|
|                                                  |
|  Invoices:                                       |
|  +--------------------------------------------+  |
|  |  Feb 2024           $299.00  [Paid ✓]     |  |
|  |  Jan 2024 (upgrade) $2,699.50 [Paid ✓]   |  |
|  |  Jan 2024           $299.00  [Paid ✓]     |  |
|  +--------------------------------------------+  |
+--------------------------------------------------+
```

## Dependencies
- Pricing plans configured (Story 010-01)
- Stripe subscription products created
- Client-trainer relationships established
- Payment methods saved (Story 010-02)
- Email service configured
- Webhook handlers set up

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests with Stripe subscriptions
- [ ] Proration calculations tested and accurate
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Cancellation flow tested
- [ ] Plan changes tested with various scenarios
- [ ] Pause/resume functionality tested
- [ ] Documentation updated
- [ ] User notifications working

## Notes
- **CRITICAL**: Always validate plan changes server-side to prevent abuse.
- **CRITICAL**: Use Stripe's subscription proration engine for accuracy.
- Trainer should have option to disable pauses for their subscriptions.
- Consider implementing retention offers when users try to cancel.
- Send clear renewal reminders 7 days and 1 day before billing.
- Allow clients to view invoice before automatic payment.
- Implement grace period for failed subscription payments.
- Track cancellation reasons for business analytics.
- Consider implementing "hibernation" mode for long-term pauses.
- Make reactivation after cancellation as easy as possible.
- Ensure subscription events are logged for audit trail.
- Test timezone handling for period calculations.
- Consider implementing subscription analytics for trainers.
