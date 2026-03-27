# Stripe Checkout Integration — Design & Plan

## Design

### Flow
1. User navigates funnel: upgrade-professional → upgrade-enterprise → upgrade-saas → checkout
2. After upgrade-saas.html, instead of going to welcome.html, `goToStripeCheckout()` is called
3. This POSTs to `/api/create-checkout-session` with `{ tierPriceId, saasPriceId?, tier }`
4. API creates Stripe Checkout Session:
   - **Tier only (no SaaS):** `mode: 'payment'`, single line item
   - **Tier + SaaS:** `mode: 'subscription'`, tier as one-time line item + SaaS as recurring
5. Returns `{ url }` → browser redirects to Stripe Checkout
6. Success → `/landing/checkout-success.html`
7. Cancel → `/landing/upgrade-saas.html` (return to last funnel page)

### Price ID Mapping (in funnel.js)
| Tier | Price ID | Mode |
|------|----------|------|
| starter | price_1TEwpaGo4HHYDfDVyvecwfMc | payment |
| professional | price_1TEwpcGo4HHYDfDVqNAFCnDt | payment |
| enterprise | price_1TEwpeGo4HHYDfDVe7M1XZTD | payment |
| saas | price_1TEwpdGo4HHYDfDVmtIVLSQo | subscription |

### API Endpoint: POST /api/create-checkout-session
- Input: `{ priceId: string, tier: string, saas?: boolean, saasPriceId?: string }`
- Creates Stripe Checkout Session
- Returns: `{ success: true, data: { url: string } }`

### Files to Create/Modify
1. `app/api/create-checkout-session/route.ts` — API endpoint
2. `public/landing/js/funnel.js` — add price IDs, goToStripeCheckout()
3. `public/landing/upgrade-saas.html` — wire buttons to checkout
4. `public/landing/checkout-success.html` — success page
5. `public/landing/checkout-cancel.html` — cancel page
6. `.env` — add Stripe test keys
7. `package.json` — add stripe dependency

### Test Plan
1. Unit test for API route: valid request, invalid priceId, missing fields
2. Integration test: verify Stripe session creation with mocked Stripe

---

## Implementation Tasks

### Task 1: Install stripe & add env vars
- `npm install stripe`
- Create `.env` with `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`

### Task 2: Create API endpoint with tests
- Write test: POST /api/create-checkout-session returns checkout URL
- Write test: invalid priceId returns 400
- Write test: SaaS mode creates subscription session
- Implement `app/api/create-checkout-session/route.ts`

### Task 3: Update funnel.js with Stripe checkout flow
- Add PRICE_IDS mapping
- Add goToStripeCheckout() that collects selection, POSTs to API, redirects

### Task 4: Update upgrade-saas.html to trigger checkout
- Wire both buttons to call goToStripeCheckout() instead of goTo('welcome.html')

### Task 5: Create success and cancel pages
- checkout-success.html — confirmation with order details
- checkout-cancel.html — "changed your mind?" with return link

### Task 6: Commit and verify
