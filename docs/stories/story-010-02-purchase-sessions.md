# Story 010-02: Purchase Sessions

**Parent Epic**: [EPIC-010 - Payment & Billing](../epics/epic-010-payment-billing.md)
**Story ID**: STORY-010-02
**Priority**: P0 (Critical)
**Story Points**: 13
**Sprint**: Sprint 10

## User Story
**As a** client
**I want to** purchase training sessions securely
**So that I** can book training sessions with my trainer

## Acceptance Criteria
- [ ] Can view all available pricing plans from my trainer
- [ ] Can select individual sessions or packages
- [ ] Can choose subscription plans
- [ ] Secure payment form with Stripe Elements
- [ ] Multiple payment methods (card, bank transfer)
- [ ] Apply promotional codes during checkout
- [ ] Instant payment confirmation
- [ ] Receive detailed receipt via email
- [ ] View complete payment history
- [ ] Save payment methods for future purchases
- [ ] Clear display of taxes and fees
- [ ] Mobile-optimized checkout flow

## Technical Implementation

### Frontend Tasks
1. **Create PurchaseFlow Component**
   - Multi-step checkout wizard
   - Plan selection with comparison
   - Stripe Elements integration
   - Payment method selection
   - Promotional code input
   - Order summary with tax breakdown
   - Confirmation page

2. **Create PackageSelector Component**
   - Display available plans in cards
   - Highlight recommended plans
   - Show savings/benefits
   - Filter by plan type
   - Compare plans side-by-side

3. **Create PaymentForm Component**
   - Stripe Card Element
   - Saved payment methods list
   - Add new payment method
   - Set default payment method
   - 3D Secure authentication flow

4. **Create CheckoutSummary Component**
   - Line item breakdown
   - Subtotal, taxes, discounts
   - Final total
   - Applied promo codes
   - Billing period preview

### Backend Tasks
1. **Create Purchase Endpoints**
   ```typescript
   GET  /api/billing/plans/available - Get trainer's pricing plans
   POST /api/billing/purchase/session - Purchase sessions
   POST /api/billing/purchase/subscription - Purchase subscription
   POST /api/billing/payment-methods - Add payment method
   GET  /api/billing/payment-methods - List saved methods
   PUT  /api/billing/payment-methods/:id/default - Set default
   DELETE /api/billing/payment-methods/:id - Remove method
   POST /api/billing/validate-promo - Validate promotional code
   GET  /api/billing/purchases/history - Purchase history
   ```

2. **Implement PurchaseService**
   ```typescript
   class PurchaseService {
     async purchaseSessions(data: PurchaseDto, clientId: string)
     async purchaseSubscription(data: SubscriptionDto, clientId: string)
     async addPaymentMethod(methodData: PaymentMethodDto, userId: string)
     async getPaymentMethods(userId: string)
     async setDefaultPaymentMethod(methodId: string, userId: string)
     async removePaymentMethod(methodId: string, userId: string)
     async validatePromoCode(code: string, planId: string, trainerId: string)
     async calculateTotal(planId: string, promoCode?: string, clientId: string)
     async createPurchaseReceipt(transactionId: string)
   }
   ```

3. **Stripe Integration**
   - Use Stripe Elements for secure card collection
   - Create Payment Intents for purchases
   - Handle 3D Secure authentication
   - Save payment methods to customer accounts
   - Setup mandates for recurring payments
   - Handle payment method updates
   - Webhook handling for payment events

4. **Database Schema**
   ```sql
   CREATE TABLE payment_methods (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES users(id),
     stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
     stripe_customer_id VARCHAR(255),
     type VARCHAR(50) NOT NULL CHECK (type IN ('card', 'bank_account')),
     last_four VARCHAR(4) NOT NULL,
     brand VARCHAR(50),
     expiry_month INTEGER,
     expiry_year INTEGER,
     cardholder_name VARCHAR(255),
     is_default BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
   CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default);

   CREATE TABLE purchases (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     client_id UUID NOT NULL REFERENCES users(id),
     trainer_id UUID NOT NULL REFERENCES users(id),
     pricing_plan_id UUID NOT NULL REFERENCES pricing_plans(id),
     transaction_id UUID REFERENCES transactions(id),
     amount DECIMAL(10,2) NOT NULL,
     tax_amount DECIMAL(10,2) DEFAULT 0,
     discount_amount DECIMAL(10,2) DEFAULT 0,
     currency VARCHAR(3) NOT NULL,
     status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
     payment_method_id UUID REFERENCES payment_methods(id),
     promo_code_id UUID REFERENCES promotional_codes(id),
     purchased_at TIMESTAMP DEFAULT NOW(),
     completed_at TIMESTAMP,
     metadata JSONB DEFAULT '{}'
   );

   CREATE INDEX idx_purchases_client ON purchases(client_id);
   CREATE INDEX idx_purchases_trainer ON purchases(trainer_id);
   CREATE INDEX idx_purchases_status ON purchases(status);
   CREATE INDEX idx_purchases_date ON purchases(purchased_at DESC);

   CREATE TABLE session_credits (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     client_id UUID NOT NULL REFERENCES users(id),
     trainer_id UUID NOT NULL REFERENCES users(id),
     purchase_id UUID NOT NULL REFERENCES purchases(id),
     pricing_plan_id UUID NOT NULL REFERENCES pricing_plans(id),
     total_sessions INTEGER NOT NULL CHECK (total_sessions > 0),
     used_sessions INTEGER DEFAULT 0 CHECK (used_sessions >= 0),
     expiry_date DATE NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     CHECK (used_sessions <= total_sessions)
   );

   CREATE INDEX idx_session_credits_client ON session_credits(client_id, trainer_id);
   CREATE INDEX idx_session_credits_expiry ON session_credits(expiry_date);
   ```

### Data Models
```typescript
interface Purchase {
  id: string;
  clientId: string;
  trainerId: string;
  pricingPlanId: string;
  pricingPlan?: PricingPlan;
  transactionId?: string;
  transaction?: Transaction;
  amount: number;
  taxAmount: number;
  discountAmount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethodId?: string;
  paymentMethod?: PaymentMethod;
  promoCodeId?: string;
  promoCode?: PromotionalCode;
  purchasedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

interface PaymentMethod {
  id: string;
  userId: string;
  stripePaymentMethodId: string;
  stripeCustomerId?: string;
  type: 'card' | 'bank_account';
  lastFour: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardholderName?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionCredits {
  id: string;
  clientId: string;
  trainerId: string;
  purchaseId: string;
  purchase?: Purchase;
  pricingPlanId: string;
  pricingPlan?: PricingPlan;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  expiryDate: Date;
  createdAt: Date;
}

interface PurchaseDto {
  pricingPlanId: string;
  paymentMethodId?: string;
  promoCode?: string;
  savePaymentMethod?: boolean;
  setAsDefault?: boolean;
}

interface CheckoutSummary {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  breakdown: {
    planName: string;
    sessions: number;
    unitPrice: number;
  };
  appliedPromo?: {
    code: string;
    discount: number;
  };
}
```

## Test Cases

### 1. Happy Path Tests
- Browse available pricing plans
- Select single session plan
- Complete payment with new card
- Receive confirmation email
- View session credits in dashboard
- Purchase with saved payment method
- Apply valid promotional code
- Purchase subscription plan

### 2. Payment Flow Tests
- Stripe Elements renders correctly
- Card validation works
- 3D Secure authentication flow
- Payment Intent creation
- Payment success confirmation
- Payment failure handling
- Insufficient funds handling
- Card declined scenarios

### 3. Edge Cases & Validation
- Invalid promotional code
- Expired promotional code
- Promotional code usage limit reached
- Payment method expiry validation
- Duplicate transaction prevention
- Network interruption during payment
- Concurrent purchase attempts
- Zero-amount purchase rejection

### 4. Security Tests
- **CRITICAL**: Card data never touches server (PCI compliance)
- **CRITICAL**: Payment method tokenization works
- **CRITICAL**: HTTPS enforced on all payment endpoints
- **CRITICAL**: CSRF protection on checkout
- **CRITICAL**: SQL injection prevention
- **CRITICAL**: XSS prevention in payment form
- Client cannot modify another client's payment methods
- Invalid payment method ID rejection
- Session fixation prevention

### 5. Stripe Integration Tests
- Stripe Elements loads correctly
- Payment Intent creation succeeds
- Webhook events process correctly
- 3D Secure authentication flow
- Saved payment methods persist
- Customer creation in Stripe
- Payment method attachment to customer
- Idempotent payment requests

### 6. Email & Notification Tests
- Payment confirmation email sent
- Receipt email contains all details
- Failed payment notification
- Payment method expiry reminder
- Session credits expiry warning

### 7. Performance Tests
- Checkout page loads < 2 seconds
- Payment processing < 5 seconds
- Payment method retrieval < 1 second
- Handle 100 concurrent purchases

## UI/UX Mockups

```
+--------------------------------------------------+
|  Purchase Training Sessions                     |
|                                                  |
|  Step 1 of 3: Select Plan                        |
|                                                  |
|  Available Plans from Trainer Name              |
|                                                  |
|  +-------------------+  +---------------------+ |
|  |  Single Session   |  |  5-Session Package  | |
|  |  $85.00           |  |  $375.00            | |
|  |  1 session        |  |  5 sessions         | |
|  |  Valid: 30 days   |  |  Save $50 (12%)     | |
|  |  [Select]         |  |  Valid: 60 days     | |
|  +-------------------+  |  [Select]           | |
|                        +---------------------+ |
|                                                  |
|  +-------------------+  +---------------------+ |
|  |  10-Session Pack  |  |  Monthly Unlimited  | |
|  |  $700.00          |  |  $899/month         | |
|  |  10 sessions      |  |  Unlimited sessions  | |
|  |  Save $150 (18%)  |  |  Cancel anytime     | |
|  |  Valid: 90 days   |  |  Billed monthly     | |
|  |  [Select]         |  |  [Select]           | |
|  +-------------------+  +---------------------+ |
|                                                  |
|  Have a promo code? [Enter Code_______] [Apply]  |
|                                                  |
|                         [Back]  [Continue →]     |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Purchase Training Sessions                     |
|                                                  |
|  Step 2 of 3: Payment Information                |
|                                                  |
|  Selected: 10-Session Package                    |
|                                                  |
|  Saved Payment Methods:                          |
|  ⦿ Visa ending in 4242 (Default)                |
|  ○ Mastercard ending in 5555                     |
|  [+ Add New Payment Method]                      |
|                                                  |
|  --- OR Add New Card ---                         |
|                                                  |
|  +-------------------------------------------+   |
|  |  [Stripe Card Element - Secure Form]     |   |
|  |  Card Number                              |   |
|  |  Expiry  CVC                              |   |
|  +-------------------------------------------+   |
|                                                  |
|  ☑ Save this card for future purchases          |
|  ☑ Set as default payment method                |
|                                                  |
|  Order Summary:                                  |
|  10-Session Package              $700.00         |
|  Tax (8%)                         $56.00         |
|  Promo SUMMER2024 (20% off)    -$140.00         |
|  -------                                        |
|  Total                            $616.00        |
|                                                  |
|  [← Back]              [Complete Purchase →]     |
|                                                  |
|  🔒 Secured by Stripe                            |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Payment Successful! ✓                           |
|                                                  |
|  Thank you for your purchase!                    |
|                                                  |
|  Order Details:                                  |
|  Order #: PUR-2024-12345                         |
|  Date: January 15, 2024, 3:45 PM                |
|                                                  |
|  Item: 10-Session Package                        |
|  Trainer: John Smith                             |
|  Amount Paid: $616.00 USD                        |
|                                                  |
|  Your Session Credits:                           |
|  Total Sessions: 10                              |
|  Sessions Available: 10                         |
|  Expires: April 15, 2024                         |
|                                                  |
|  What's Next:                                    |
|  • Check your email for receipt                  |
|  • Book your first session                      |
|  • View your purchase history                   |
|                                                  |
|  [Book a Session]  [View Dashboard]              |
|                                                  |
|  A receipt has been sent to your email.          |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Payment History                                 |
|                                                  |
|  Filter: [All Purchases ▼]  Search: [_______]    |
|                                                  |
|  +----------------------------------------------+ |
|  |  10-Session Package              $616.00    | |
|  |  Jan 15, 2024                    Completed  | |
|  |  Transaction #txn_1abc123                  | |
|  |  [View Receipt] [Download Invoice]         | |
|  +----------------------------------------------+ |
|                                                  |
|  +----------------------------------------------+ |
|  |  Monthly Subscription               $899.00  | |
|  |  Dec 15, 2023                    Completed  | |
|  |  Recurring monthly                       | |
|  |  [View Details] [Manage Subscription]     | |
|  +----------------------------------------------+ |
|                                                  |
|  +----------------------------------------------+ |
|  |  Single Session                     $85.00  | |
|  |  Nov 20, 2023                    Completed  | |
|  |  Transaction #txn_1def456                  | |
|  |  [View Receipt] [Download Invoice]         | |
|  +----------------------------------------------+ |
+--------------------------------------------------+
```

## Dependencies
- Trainer pricing plans configured (Story 010-01)
- Stripe account set up and verified
- Client-trainer relationships established
- Email service configured
- Payment method tables created
- Transaction tracking system ready

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests with Stripe completed
- [ ] **Security audit passed - PCI DSS compliance verified**
- [ ] Payment flow tested with actual cards (test mode)
- [ ] 3D Secure authentication tested
- [ ] Email receipts working correctly
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical security vulnerabilities
- [ ] Mobile checkout tested
- [ ] Documentation updated

## Notes
- **CRITICAL SECURITY**: Never log or store raw card data. Use Stripe Elements for tokenization.
- **CRITICAL SECURITY**: All payment endpoints must use HTTPS exclusively.
- **CRITICAL SECURITY**: Validate all payment amounts server-side to prevent manipulation.
- Use Stripe's test mode for development, only use live keys in production.
- Implement payment method fingerprinting to detect fraud patterns.
- Always display taxes and fees clearly before final purchase.
- Session credits should be allocated immediately upon successful payment.
- Implement webhook retry logic for reliability.
- Consider implementing address verification service (AVS) for high-value purchases.
- Ensure payment form is accessible (WCAG 2.1 AA compliance).
- Save payment methods securely using Stripe's customer objects.
- Send payment confirmation even if email delivery fails (queue for retry).
- Log all payment attempts for audit trail and fraud analysis.
