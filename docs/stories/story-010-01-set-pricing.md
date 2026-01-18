# Story 010-01: Set Pricing

**Parent Epic**: [EPIC-010 - Payment & Billing](../epics/epic-010-payment-billing.md)
**Story ID**: STORY-010-01
**Priority**: P0 (Critical)
**Story Points**: 13
**Sprint**: Sprint 10

## User Story
**As a** trainer
**I want to** set my pricing structure
**So that** clients know my rates and can purchase training sessions

## Acceptance Criteria
- [ ] Can create per-session pricing plans
- [ ] Can create session packages (e.g., 5 sessions, 10 sessions)
- [ ] Can create subscription plans (weekly, monthly)
- [ ] Can set different rates for different services (1-on-1, group, online)
- [ ] Can select currency (USD, EUR, GBP, etc.)
- [ ] Can configure tax rates and rules
- [ ] Can create promotional discount codes
- [ ] Can set pricing visibility (public, clients only, private)
- [ ] Can bulk update pricing across multiple plans
- [ ] Can archive/delete pricing plans
- [ ] All pricing changes are logged for audit

## Technical Implementation

### Frontend Tasks
1. **Create PricingManager Component**
   - Build pricing plans list with CRUD operations
   - Create pricing plan form builder
   - Implement currency selector with real-time conversion preview
   - Add tax configuration modal
   - Create promotional code manager
   - Implement bulk pricing update tool

2. **Create PricingPlanForm Component**
   - Plan type selector (per session, package, subscription)
   - Price input with currency formatting
   - Session count field for packages
   - Validity period setting
   - Feature list builder
   - Discount rules configuration
   - Preview card showing client view

3. **Create DiscountCodeManager Component**
   - Code generator with custom patterns
   - Discount type selector (percentage, fixed amount)
   - Usage limit settings
   - Date range picker
   - Applicable plans selector
   - Usage tracking dashboard

### Backend Tasks
1. **Create Pricing Endpoints**
   ```typescript
   POST   /api/billing/plans - Create new pricing plan
   GET    /api/billing/plans - List all pricing plans
   GET    /api/billing/plans/:id - Get plan details
   PUT    /api/billing/plans/:id - Update pricing plan
   DELETE /api/billing/plans/:id - Archive/delete plan
   POST   /api/billing/promotional-codes - Create discount code
   GET    /api/billing/promotional-codes - List discount codes
   PUT    /api/billing/promotional-codes/:id - Update discount code
   DELETE /api/billing/promotional-codes/:id - Delete discount code
   POST   /api/billing/tax-config - Configure tax rules
   GET    /api/billing/tax-config - Get tax configuration
   ```

2. **Implement PricingService**
   ```typescript
   class PricingService {
     async createPlan(data: CreatePricingPlanDto, trainerId: string)
     async updatePlan(id: string, data: UpdatePricingPlanDto, trainerId: string)
     async getPlans(trainerId: string, filters?: PlanFilters)
     async deletePlan(id: string, trainerId: string)
     async validatePromoCode(code: string, planId: string)
     async createPromoCode(data: CreatePromoCodeDto, trainerId: string)
     async calculateTax(amount: number, trainerId: string, clientLocation?: Location)
     async applyDiscount(amount: number, promoCode: string)
   }
   ```

3. **Stripe Integration**
   - Create Stripe Products for each pricing plan
   - Create Stripe Prices for each plan variation
   - Sync pricing plans with Stripe dashboard
   - Handle webhook events for product updates
   - Implement idempotency keys for plan creation

4. **Database Schema**
   ```sql
   CREATE TABLE pricing_plans (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     trainer_id UUID NOT NULL REFERENCES users(id),
     stripe_product_id VARCHAR(255) UNIQUE,
     stripe_price_id VARCHAR(255),
     name VARCHAR(255) NOT NULL,
     description TEXT,
     plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('per_session', 'package', 'subscription')),
     price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
     currency VARCHAR(3) NOT NULL DEFAULT 'USD',
     session_count INTEGER CHECK (session_count > 0),
     validity_days INTEGER CHECK (validity_days > 0),
     billing_interval VARCHAR(20) CHECK (billing_interval IN ('week', 'month', 'year')),
     features JSONB DEFAULT '[]',
     is_active BOOLEAN DEFAULT true,
     is_public BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     CHECK (
       (plan_type = 'per_session' AND session_count = 1) OR
       (plan_type = 'package' AND session_count > 1) OR
       (plan_type = 'subscription' AND billing_interval IS NOT NULL)
     )
   );

   CREATE INDEX idx_pricing_plans_trainer ON pricing_plans(trainer_id);
   CREATE INDEX idx_pricing_plans_type ON pricing_plans(plan_type);
   CREATE INDEX idx_pricing_plans_active ON pricing_plans(is_active);

   CREATE TABLE promotional_codes (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     code VARCHAR(50) UNIQUE NOT NULL,
     trainer_id UUID NOT NULL REFERENCES users(id),
     discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
     discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
     applicable_plans UUID[] DEFAULT '{}',
     usage_limit INTEGER CHECK (usage_limit > 0),
     usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
     valid_from TIMESTAMP NOT NULL,
     valid_until TIMESTAMP NOT NULL,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     CHECK (valid_until > valid_from)
   );

   CREATE INDEX idx_promo_codes_trainer ON promotional_codes(trainer_id);
   CREATE INDEX idx_promo_codes_active ON promotional_codes(is_active);
   CREATE INDEX idx_promo_codes_validity ON promotional_codes(valid_from, valid_until);

   CREATE TABLE tax_configurations (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     trainer_id UUID NOT NULL REFERENCES users(id),
     country VARCHAR(2) NOT NULL,
     region VARCHAR(100),
     tax_rate DECIMAL(5,2) NOT NULL CHECK (tax_rate >= 0),
     tax_name VARCHAR(100) NOT NULL,
     is_inclusive BOOLEAN DEFAULT false,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(trainer_id, country, region)
   );

   CREATE INDEX idx_tax_config_trainer ON tax_configurations(trainer_id);
   ```

### Data Models
```typescript
interface PricingPlan {
  id: string;
  trainerId: string;
  stripeProductId?: string;
  stripePriceId?: string;
  name: string;
  description?: string;
  planType: 'per_session' | 'package' | 'subscription';
  price: number;
  currency: string;
  sessionCount?: number;
  validityDays?: number;
  billingInterval?: 'week' | 'month' | 'year';
  features: string[];
  isActive: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PromotionalCode {
  id: string;
  code: string;
  trainerId: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  applicablePlans: string[];
  usageLimit: number;
  usageCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
}

interface TaxConfiguration {
  id: string;
  trainerId: string;
  country: string;
  region?: string;
  taxRate: number;
  taxName: string;
  isInclusive: boolean;
  isActive: boolean;
}

interface CreatePricingPlanDto {
  name: string;
  description?: string;
  planType: 'per_session' | 'package' | 'subscription';
  price: number;
  currency: string;
  sessionCount?: number;
  validityDays?: number;
  billingInterval?: 'week' | 'month' | 'year';
  features?: string[];
  isPublic?: boolean;
}
```

## Test Cases

### 1. Happy Path Tests
- Create per-session pricing plan
- Create 5-session package with discount
- Create monthly subscription plan
- Update existing plan price
- Apply promotional code to plan
- Calculate tax for different regions
- Archive old pricing plan

### 2. Edge Cases & Validation
- Zero or negative price rejection
- Invalid currency code
- Package with zero sessions
- Subscription without billing interval
- Expired promotional code
- Promotional code exceeding usage limit
- Duplicate plan names for same trainer
- Negative tax rate

### 3. Stripe Integration Tests
- Plan creation syncs with Stripe
- Price updates reflect in Stripe
- Deleted plans are archived in Stripe
- Webhook updates local database
- Idempotency prevents duplicate plans

### 4. Security Tests
- Trainer cannot modify other trainers' plans
- Invalid promo code returns appropriate error
- SQL injection prevention on plan search
- XSS prevention in plan descriptions
- CSRF protection on plan updates

### 5. Performance Tests
- Load 100+ pricing plans
- Search/filter performance
- Bulk update 50 plans
- Concurrent plan creation

## UI/UX Mockups

```
+--------------------------------------------------+
|  Pricing Management                              |
|                                                  |
|  [+ Create New Plan]  [Discount Codes]  [Taxes]  |
|                                                  |
|  Filter: [Active Plans ▼]  Search: [_______]     |
|                                                  |
|  +----------------------------------------------+ |
|  |  Monthly Personal Training (12 sessions)     | |
|  |  $899.00 USD  |  Subscription  |  Active     | |
|  |  Features: ✓ 12 sessions ✓ Meal plans        | |
|  |  [Edit] [Duplicate] [Archive] [View Public]  | |
|  +----------------------------------------------+ |
|                                                  |
|  +----------------------------------------------+ |
|  |  Single Session Booking                      | |
|  |  $85.00 USD  |  Per Session  |  Active       | |
|  |  Features: ✓ 1 session ✓ Custom workout      | |
|  |  [Edit] [Duplicate] [Archive] [View Public]  | |
|  +----------------------------------------------+ |
|                                                  |
|  +----------------------------------------------+ |
|  |  10-Session Package                          | |
|  |  $750.00 USD  |  Package  |  Active          | |
|  |  Features: ✓ 10 sessions ✓ 15% discount      | |
|  |  [Edit] [Duplicate] [Archive] [View Public]  | |
|  +----------------------------------------------+ |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Create/Edit Pricing Plan                        |
|                                                  |
|  Plan Name: [Monthly Training Package_______]    |
|  Description: [Comprehensive monthly fitness____] |
|                                                  |
|  Plan Type:                                      |
|  ⦿ Per Session  ○ Package  ○ Subscription       |
|                                                  |
|  Price: [$99.00] Currency: [USD ▼]               |
|                                                  |
|  Package Options:                                |
|  Sessions: [12]                                  |
|  Validity: [30] days                             |
|                                                  |
|  Features:                                       |
|  [+ Add Feature]                                 |
|  ✓ 12 personal training sessions                 |
|  ✓ Customized workout plan                       |
|  ✓ Nutrition guidance                            |
|  ✓ Progress tracking                             |
|                                                  |
|  Settings:                                       |
|  ☑ Publicly visible                             |
|  ☑ Allow promotional codes                      |
|  ☐ Require trainer approval                      |
|                                                  |
|  [Cancel]  [Save as Draft]  [Publish]            |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Promotional Code Manager                        |
|                                                  |
|  [+ Create New Code]  [Bulk Import]              |
|                                                  |
|  +----------------------------------------------+ |
|  |  Code: SUMMER2024                            | |
|  |  Discount: 20% off                           | |
|  |  Applies to: All plans                       | |
|  |  Usage: 45/100                               | |
|  |  Valid: Jun 1 - Aug 31, 2024                 | |
|  |  [Edit] [Disable] [Delete]                   | |
|  +----------------------------------------------+ |
|                                                  |
|  +----------------------------------------------+ |
|  |  Code: NEWCLIENT10                           | |
|  |  Discount: $10.00 off                        | |
|  |  Applies to: First purchase only             | |
|  |  Usage: 12/50                                | |
|  |  Valid: Jan 1 - Dec 31, 2024                 | |
|  |  [Edit] [Disable] [Delete]                   | |
|  +----------------------------------------------+ |
+--------------------------------------------------+
```

## Dependencies
- Trainer account setup completed
- User authentication implemented
- Stripe account configured
- Database schema created
- Currency conversion API available

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests with Stripe completed
- [ ] Security review passed
- [ ] Pricing plans sync correctly with Stripe
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Audit logging functional

## Notes
- **CRITICAL**: Always validate pricing before creating Stripe products to avoid billing errors
- Use Stripe's idempotency keys to prevent duplicate charges
- All pricing changes must be logged for audit trail
- Consider implementing price change notifications for existing clients
- Tax calculation should be flexible enough to handle different jurisdictions
- Promotional codes should have clear expiration and usage limits
- Plan archiving (soft delete) is preferred over hard deletion for historical data
- Consider implementing price testing/vouchers for future marketing needs
