# FORGE v4 Brainstorm: Rendered-State Awareness

**Date:** 2026-04-17
**Author:** QA Architecture Review
**Status:** BRAINSTORM (not approved for implementation)

---

## The Core Problem

FORGE v3 tests are **structurally blind**. They verify:
- Pages load without JS errors
- APIs return 200 with correct shape
- State machines transition correctly

They do **NOT** verify:
- Seeded data actually renders on screen
- Error boundaries like "Analytics Unavailable" are hidden behind permissive assertions
- Charts contain real data points (not empty SVGs)
- Tables show correct row counts matching database records
- Form fields are pre-populated after profile save
- Every Prisma model field surfaces in SOME UI view

The `05-analytics-validation.spec.ts` test is the poster child. It checks:
```typescript
body?.includes('Analytics') ||
body?.includes('Analytics Unavailable')  // <-- THIS PASSES WHEN BROKEN
```

Both "working" and "broken" states satisfy the assertion. This is a no-op test.

---

## Section 1: Gap Analysis (Prisma Model Coverage)

Legend:
- SEED = `seed-enterprise-full.ts` populates this model
- API = Simulation tests hit CRUD endpoints for this model
- UI = Tests assert rendered data in the browser
- ??? = Coverage unknown/missing

### Auth & Identity (Epic 002)

| Model | Seed | API Test | UI Assertion |
|-------|------|----------|--------------|
| User | YES | YES (login/register) | NO -- no test checks user name/email renders on dashboard |
| EmailVerification | NO (bypassed) | NO | NO |
| PasswordReset | NO | NO | NO |
| TwoFactorAuth | NO | NO | NO |
| UserSession | Implicit (login) | YES (login creates) | NO |
| OAuthAccount | NO | NO | NO |
| SecurityAuditLog | Implicit (login) | NO | NO -- admin panel shows logs but untested |
| AccountLockout | NO | YES (adversarial) | NO |
| ApiToken | NO | NO | NO |

### User Profiles (Epic 001)

| Model | Seed | API Test | UI Assertion |
|-------|------|----------|--------------|
| UserProfile | YES (trainer + client) | YES (PUT /api/profiles/me) | NO -- no test verifies bio/phone renders on /profile |
| UserMeasurement | YES (8 weeks) | YES (POST + GET) | NO -- no test checks measurement values in analytics charts |
| UserHealth | YES (client) | YES (PUT) | NO -- no test checks health info renders on /profile/health |
| UserGoal | YES (4 goals) | YES (POST + GET) | NO -- no test checks goal cards render with correct target values |
| TrainerCertification | YES (3 certs) | YES (POST) | NO -- no test checks certs render on profile page |
| TrainerSpecialization | NO | NO | NO |
| ProgressPhoto | NO (photo uploads removed) | NO | NO |
| ProfileCompletion | NO | NO | NO |

### Client Management (Epic 003)

| Model | Seed | API Test | UI Assertion |
|-------|------|----------|--------------|
| TrainerClient | YES | YES (POST /api/clients) | PARTIAL -- checks "client appears" but not status badge |
| ClientInvitation | NO | NO | NO |
| ClientProfile | NO | NO | NO |
| ClientNote | NO | NO | NO |
| ClientTag | NO | NO | NO |
| ClientTagAssignment | NO | NO | NO |

### Exercise Library (Epic 004)

| Model | Seed | API Test | UI Assertion |
|-------|------|----------|--------------|
| Exercise | YES (fetched, not created) | YES (GET) | PARTIAL -- search test, but no card content assertion |
| ExerciseFavorite | YES (10 trainer, 5 client) | YES (POST) | NO -- no test checks favorites page shows correct count |
| ExerciseCollection | YES (2 collections) | YES (POST) | NO -- no test checks collection page renders exercises |
| CollectionExercise | YES | YES (POST) | NO |
| ExerciseUsage | NO | NO | NO |
| ExerciseSearchHistory | NO | NO | NO |

### Program Builder (Epic 005)

| Model | Seed | API Test | UI Assertion |
|-------|------|----------|--------------|
| Program | YES (3 programs) | YES (POST + GET) | PARTIAL -- checks name appears in list, not detail |
| ProgramWeek | YES (8+4+4 weeks) | Implicit | NO -- no test checks week cards render correctly |
| ProgramWorkout | YES (3/day * 8 weeks) | Implicit | NO -- no test checks workout details page |
| WorkoutExercise | YES (4/workout) | Implicit | NO |
| ProgramSection | NO | NO | NO |
| ExerciseConfiguration | YES | Implicit | NO |
| ProgramAssignment | YES (3 assignments) | YES (POST) | NO -- no test checks "Assigned" badge on program card |
| ProgramTemplate | NO | NO | NO |

### Workout Execution (Epic 006)

| Model | Seed | API Test | UI Assertion |
|-------|------|----------|--------------|
| WorkoutSession | YES (24 sessions) | YES (POST + PUT + complete) | NO -- no test checks /workouts/history shows 24 rows |
| WorkoutExerciseLog | YES (implicit) | Implicit | NO |
| WorkoutSetLog | YES (via /api/workouts/:id/sets) | YES (POST) | NO -- no test checks set log table renders |

### Progress Analytics (Epic 007)

| Model | Seed | API Test | UI Assertion |
|-------|------|----------|--------------|
| PerformanceMetric | YES (14-day sim) | YES (POST) | NO -- no test checks performance chart renders data |
| TrainingLoad | YES (8 weeks ACWR) | YES (POST calculate) | NO -- no test checks ACWR chart has 8 data points |
| GoalProgress | YES (4 goals * 8 entries) | YES (POST) | NO -- no test checks progress bar percentage |
| AnalyticsReport | NO | NO | NO |
| UserInsight | NO | NO | NO |
| MilestoneAchievement | NO | NO | NO |
| ChartPreference | NO | NO | NO |
| ComparisonBaseline | NO | NO | NO |

### Activity Feed

| Model | Seed | API Test | UI Assertion |
|-------|------|----------|--------------|
| Activity | NO | NO | NO |

### Scheduling (Epic 009)

| Model | Seed | API Test | UI Assertion |
|-------|------|----------|--------------|
| TrainerAvailability | YES (Mon-Fri) | YES (POST) | NO -- no test checks availability grid renders correctly |
| Appointment | YES (12 appointments) | YES (POST) | NO -- no test checks calendar shows appointment cards |

### Support & Reports

| Model | Seed | API Test | UI Assertion |
|-------|------|----------|--------------|
| SupportTicket | NO | YES (admin-operations) | NO |
| BugReport | NO | NO | NO |
| ContentReport | NO | NO | NO |

### Subscriptions

| Model | Seed | API Test | UI Assertion |
|-------|------|----------|--------------|
| TrainerSubscription | NO | NO | NO |

### Summary Counts

| Category | Total Models | Seeded | API Tested | UI Asserted |
|----------|-------------|--------|------------|-------------|
| Auth & Identity | 9 | 2 | 3 | 0 |
| User Profiles | 8 | 5 | 4 | 0 |
| Client Management | 6 | 1 | 1 | 0 (partial) |
| Exercise Library | 6 | 3 | 3 | 0 (partial) |
| Program Builder | 8 | 5 | 3 | 0 (partial) |
| Workout Execution | 3 | 3 | 3 | 0 |
| Progress Analytics | 8 | 3 | 3 | 0 |
| Activity Feed | 1 | 0 | 0 | 0 |
| Scheduling | 2 | 2 | 2 | 0 |
| Support & Reports | 3 | 0 | 1 | 0 |
| Subscriptions | 1 | 0 | 0 | 0 |
| **TOTALS** | **55** | **24 (44%)** | **23 (42%)** | **0 (0%)** |

**Zero models have genuine UI rendering assertions.** The "partial" notes indicate tests that check for text presence but not data correctness.

---

## Section 2: New Test Categories

### Category A: Rendered Data Assertions (RDA)

**Purpose:** After seeding, navigate to every data-backed page and assert specific values appear on screen.

**How it works:**
1. Seed script runs (or enterprise seed already ran)
2. Login as the seeded user
3. Navigate to a page
4. Assert SPECIFIC data values (not just "page has text")

**Example — what v3 does (bad):**
```typescript
const body = await page.textContent('body');
expect(body).toContain('Analytics');  // passes when broken
```

**Example — what v4 should do (good):**
```typescript
// After seeding 8 weeks of measurements...
await trainer.navigateToAnalytics();

// Assert the measurement chart renders at least 5 data points
const chartDataPoints = await page.locator('circle, [data-testid="chart-point"]').count();
expect(chartDataPoints).toBeGreaterThanOrEqual(5);

// Assert specific seeded value appears
await expect(page.getByText('75.1')).toBeVisible(); // latest weight
await expect(page.getByText('20.9')).toBeVisible(); // latest body fat %

// NEGATIVE: must NOT show error boundary
await expect(page.getByText('Analytics Unavailable')).not.toBeVisible();
await expect(page.getByText('Unable to load')).not.toBeVisible();
```

**Pages to cover with RDA tests:**

| Page | Route | Expected Rendered Data |
|------|-------|----------------------|
| Trainer Dashboard | /dashboard/trainer | Client count, upcoming appointment, recent activity |
| Client Dashboard | /dashboard/client | Assigned program name, next session, weight trend |
| Client List | /clients | Client name, status badge, tag colors |
| Client Detail | /clients/[id] | Bio, phone, health conditions, measurement history |
| Analytics Overview | /analytics | Weight chart with 8 data points, latest measurement values |
| Analytics Performance | /analytics (Performance tab) | Performance metric data points |
| Analytics Training Load | /analytics (Training Load tab) | ACWR ratio, 8 weekly bars |
| Analytics Goals | /analytics (Goals tab) | 4 goal cards, progress percentages (47.8%, 92.9%, etc.) |
| Programs List | /programs | 3 program cards with names, duration, difficulty badges |
| Program Detail | /programs/[id] | Week list (8 weeks), workout names, exercise counts |
| Workout History | /workouts/history | 24 completed sessions with dates |
| Exercise Library | /exercises | Exercise cards with body part, equipment labels |
| Exercise Favorites | /dashboard/exercises/favorites | 10 favorited exercises for trainer |
| Collections | /dashboard/exercises/collections/[id] | 6 exercises in "Upper Body" collection |
| Schedule | /schedule | 12 appointment cards in calendar view |
| Availability | /schedule/availability | Mon-Fri 06:00-20:00 slots marked available |
| Profile | /profile | Bio text, phone number, certifications (3) |
| Profile Edit | /profile/edit | Pre-populated form fields matching seeded data |
| Health Profile | /profile/health | Blood type O+, conditions, PAR-Q responses |
| Admin Panel | /admin | User count, recent activity |

### Category B: Error Boundary Detection (EBD)

**Purpose:** Scan every authenticated page for error boundary messages and fail immediately if found.

**How it works:**
```typescript
const ERROR_BOUNDARY_SIGNALS = [
  'Something went wrong',
  'Unavailable',
  'Unable to load',
  'Error loading',
  'Failed to fetch',
  'Unexpected error',
  'Try again later',
  '[object Object]',  // common render bug
  'undefined',         // when rendered as text
  'NaN',              // numeric render bug
];

async function assertNoErrorBoundary(page: Page): Promise<void> {
  const body = await page.textContent('body') || '';
  for (const signal of ERROR_BOUNDARY_SIGNALS) {
    // Use exact matching to avoid false positives
    const elements = page.locator(`text="${signal}"`);
    const count = await elements.count();
    if (count > 0) {
      // Check if it's a legitimate UI element (like a retry button label)
      // vs an actual error boundary
      for (let i = 0; i < count; i++) {
        const el = elements.nth(i);
        const parentClasses = await el.evaluate(
          e => e.closest('[class*="error"], [class*="boundary"], [role="alert"]')?.className || ''
        );
        if (parentClasses) {
          throw new Error(`Error boundary detected: "${signal}" in ${parentClasses}`);
        }
      }
    }
  }
}
```

**Test structure:** One suite that logs in as each role and visits every page:

```typescript
test.describe('Error Boundary Sweep', () => {
  const TRAINER_PAGES = [
    '/dashboard/trainer', '/clients', '/programs', '/exercises',
    '/analytics', '/schedule', '/workouts', '/profile',
  ];

  for (const route of TRAINER_PAGES) {
    test(`No error boundary on ${route}`, async ({ page }) => {
      const trainer = new TrainerActor(page);
      await trainer.login();
      await trainer.goto(route);
      await assertNoErrorBoundary(page);
    });
  }
});
```

### Category C: Data Completeness Verification (DCV)

**Purpose:** After a full simulation run, query the database via API and assert no critical fields are null.

**How it works:**
1. Run after the seed or after the 14-day simulation
2. Query each model endpoint
3. Assert key fields are non-null
4. Assert expected record counts

**Example:**
```typescript
test('Measurements have all required fields', async ({ page }) => {
  const client = new ClientActor(page);
  await client.login();

  const res = await client.apiCall('GET', '/api/analytics/measurements/me');
  const measurements = res.data || [];

  expect(measurements.length).toBeGreaterThanOrEqual(8);

  for (const m of measurements) {
    expect(m.weight).not.toBeNull();
    expect(m.bodyFatPercentage).not.toBeNull();
    expect(m.muscleMass).not.toBeNull();
    expect(m.recordedAt).not.toBeNull();
    // Ensure measurements JSON has body part data
    expect(m.measurements).toBeDefined();
    expect(m.measurements.chest).toBeGreaterThan(0);
    expect(m.measurements.waist).toBeGreaterThan(0);
  }
});
```

**Models to verify:**

| Model | Endpoint | Min Records | Required Non-Null Fields |
|-------|----------|-------------|-------------------------|
| UserProfile | GET /api/profiles/me | 1 | bio, gender, phone, timezone |
| UserHealth | GET /api/profiles/health | 1 | bloodType, medicalConditions, parQResponses |
| UserMeasurement | GET /api/analytics/measurements/me | 8 | weight, bodyFatPercentage, muscleMass, measurements |
| UserGoal | GET /api/analytics/goals | 4 | goalType, specificGoal, targetValue, targetDate |
| GoalProgress | GET /api/analytics/goals/:id | 8/goal | currentValue, notes, recordedDate |
| TrainerCertification | GET /api/profiles/certifications | 3 | certificationName, issuingOrganization, issueDate |
| Program | GET /api/programs | 3 | name, programType, durationWeeks, weeks |
| ProgramAssignment | implicit in programs | 3 | startDate, isActive |
| WorkoutSession | GET /api/workouts/history | 24 | status=completed, scheduledDate, totalVolume |
| TrainingLoad | GET /api/analytics/training-load/me | 8 | totalVolume, totalSets, acuteLoad, chronicLoad |
| Appointment | GET /api/schedule/appointments | 12 | title, startDatetime, appointmentType |
| TrainerAvailability | GET /api/schedule/availability | 5 | dayOfWeek, startTime, endTime |

### Category D: Visual Regression (Screenshot Diffing)

**Purpose:** Capture baseline screenshots of key pages with seeded data, then compare on subsequent runs.

**How it works:**
1. First run: capture golden screenshots
2. Subsequent runs: compare pixel-by-pixel (with threshold for font rendering differences)
3. Flag pages where layout shifted, data disappeared, or error boundaries appeared

**Tools:** Playwright's built-in `toHaveScreenshot()` with `maxDiffPixelRatio: 0.05`.

**Priority pages for visual regression:**
1. Analytics Overview (charts with data)
2. Trainer Dashboard (activity feed, stats)
3. Programs List (cards with metadata)
4. Client Detail (profile data, measurements)
5. Schedule Calendar (appointment blocks)

---

## Section 3: New Subagent Skills

### Skill 1: `@data-verifier-agent`

**Purpose:** After seeding, systematically navigate every data-backed page and assert specific values render.

**What it does:**
1. Reads the seed script to know what data was planted
2. Maps each seeded entity to its expected UI location(s)
3. Logs in as the appropriate role
4. Navigates to each page
5. Asserts seeded values are visible in the DOM
6. Produces a coverage report: "Model X field Y: VISIBLE at /route | MISSING"

**Tools needed:**
- Playwright browser context
- Seed manifest (JSON file listing every entity + expected values)
- Actor pattern (TrainerActor, ClientActor)

**Integration with existing actors:**
- Extends BaseActor with new `assertDataVisible(selector, expectedValue)` method
- Adds `assertChartHasDataPoints(minPoints)` to BaseActor
- Each actor gets page-specific verification methods:
  - `TrainerActor.verifyClientListData(expectedClients[])`
  - `TrainerActor.verifyAnalyticsData(expectedMeasurements[])`
  - `ClientActor.verifyDashboardData(expectedProgram, nextSession)`

### Skill 2: `@error-boundary-sweeper`

**Purpose:** Crawl every authenticated route and detect error boundaries, uncaught exceptions, and render bugs.

**What it does:**
1. Logs in as trainer, client, and admin
2. For each role, visits every route that role can access
3. On each page:
   - Checks for error boundary text patterns
   - Checks browser console for uncaught JS errors
   - Checks for `[object Object]` or `undefined` rendered as text
   - Checks for empty containers that should have data (e.g., empty table with 0 rows when seed has 24 sessions)
4. Produces a defect report with screenshots of every failure

**Tools needed:**
- Playwright browser context
- Console log listener (`page.on('console')` and `page.on('pageerror')`)
- Route manifest (all app routes by role)

**Integration with existing actors:**
- Adds `page.on('pageerror')` listener in BaseActor constructor
- New `BaseActor.getConsoleErrors(): string[]` method
- New `BaseActor.assertNoRenderBugs()` that checks for NaN, undefined, [object Object]

### Skill 3: `@seed-manifest-generator`

**Purpose:** Parse `seed-enterprise-full.ts` and produce a structured JSON manifest of every seeded entity with expected field values.

**What it does:**
1. Statically analyzes the seed script (AST or regex)
2. Extracts every API call and its payload
3. Produces `seed-manifest.json`:
   ```json
   {
     "trainerProfile": {
       "bio": "NASM-certified personal trainer...",
       "phone": "+27821234567",
       "gender": "male"
     },
     "measurements": [
       { "week": 1, "weight": 75.1, "bodyFat": 20.9, "muscleMass": 32.8 },
       ...
     ],
     "goals": [
       { "type": "weight_loss", "target": 72, "currentProgress": 47.8 },
       ...
     ],
     "programs": [
       { "name": "8-Week Strength Foundation", "weeks": 8, "type": "strength" },
       ...
     ]
   }
   ```
4. This manifest becomes the source of truth for RDA tests

**Tools needed:**
- TypeScript AST parser (ts-morph) or simple regex extraction
- File system write

**Integration:**
- Runs as a pre-test step in the FORGE pipeline
- RDA tests import the manifest instead of hardcoding expected values
- When seed script changes, manifest auto-regenerates

### Skill 4: `@coverage-gap-reporter`

**Purpose:** Cross-reference Prisma schema models/fields against seed data, API tests, and UI assertions to produce a gap report.

**What it does:**
1. Parses `prisma/schema.prisma` to extract all models and fields
2. Scans `seed-enterprise-full.ts` for which models/fields get populated
3. Scans `tests/e2e/simulations/**/*.spec.ts` for API endpoint calls
4. Scans for UI assertions (`.toBeVisible()`, `.toContain()`, `.getByText()`)
5. Produces a matrix:

```
Model: UserGoal (4 fields critical)
  goalType      -> SEEDED: yes | API: yes | UI: NO
  specificGoal  -> SEEDED: yes | API: yes | UI: NO
  targetValue   -> SEEDED: yes | API: yes | UI: NO
  targetDate    -> SEEDED: yes | API: yes | UI: NO

VERDICT: 0/4 critical fields have UI assertions. PRIORITY: HIGH
```

**Tools needed:**
- Prisma schema parser
- Grep/AST for test files
- Report formatter (markdown or JSON)

**Integration:**
- Runs as a CI step or on-demand
- Blocks PRs that reduce coverage below threshold
- Feeds into the `@data-verifier-agent` to know what to check

---

## Section 4: Enhanced Seed Coverage

### Models NOT Seeded by `seed-enterprise-full.ts`

| Model | Missing Fields | Proposed Seed Strategy |
|-------|---------------|----------------------|
| **TrainerSpecialization** | All (entire model) | Seed 3 specializations: "Strength & Conditioning" (12 yrs), "Body Recomposition" (10 yrs), "Injury Rehabilitation" (8 yrs) |
| **ProfileCompletion** | All | Seed via POST /api/profiles/completion or calculate from existing data. Set trainer to 95%, client to 80% |
| **ClientInvitation** | All | Create 2 invitations: 1 pending (for a new email), 1 accepted (for existing client) |
| **ClientProfile** | All | Seed via PUT endpoint: fitnessLevel=intermediate, goals JSON, preferences JSON |
| **ClientNote** | All | Seed 3 notes from trainer about client: session feedback, nutrition notes, progress observations |
| **ClientTag** | All | Seed 3 tags: "VIP" (gold), "Morning" (blue), "Competition Prep" (red) |
| **ClientTagAssignment** | All | Assign "VIP" and "Morning" tags to the seeded client |
| **ExerciseUsage** | All | After seeding workout sessions, the usage tracking should auto-populate. If not, seed 20 usage records |
| **ExerciseSearchHistory** | All | Seed 5 search queries: "bench press", "squat", "deadlift", "bicep", "shoulder" |
| **ProgramSection** | All | Seed at least 1 superset section and 1 circuit section in the strength program |
| **ProgramTemplate** | All | Create 1 template from the strength program: category="strength", tags=["beginner", "full-body"] |
| **AnalyticsReport** | All | Generate 2 reports: 1 monthly summary, 1 weekly performance report with reportData JSON |
| **UserInsight** | All | Seed 3 insights: "Squat 1RM up 15%" (high priority), "Recovery score improving" (medium), "Consider deload next week" (low) |
| **MilestoneAchievement** | All | Seed 3 milestones: "First 100kg squat", "10 sessions completed", "5kg weight loss" |
| **ChartPreference** | All | Seed default preferences for weight, body fat, and performance charts |
| **ComparisonBaseline** | All | Create "Day 1 Baseline" with week-1 measurement and performance data |
| **Activity** | All | Seed 10 activity entries: workout completions, measurement recordings, goal updates |
| **SupportTicket** | All | Seed 2 tickets: 1 open ("How to export CSV"), 1 resolved ("Password reset issue") |
| **BugReport** | All | Seed 1 bug report: "Chart not loading on mobile" with category=ui_issue, status=resolved |
| **ContentReport** | All | Seed 1 content report for a flagged exercise description |
| **TrainerSubscription** | All | Seed 1 active Professional tier subscription: tierLevel=2, status=active, amountPaidCents=29900 |
| **OAuthAccount** | All | SKIP -- requires real OAuth provider, not testable with seed |
| **TwoFactorAuth** | All | SKIP -- requires TOTP setup, complex to seed meaningfully |
| **ApiToken** | All | Seed 1 API token with name="Integration Token", permissions=["read:clients"] |
| **EmailVerification** | All | SKIP -- accounts are auto-verified in test flow |
| **PasswordReset** | All | SKIP -- transient data, not displayed in UI |
| **UserSession** | Implicit | SKIP -- created by login, ephemeral |
| **SecurityAuditLog** | Implicit | Created by login events, but seed could add 5 explicit entries for admin panel testing |
| **AccountLockout** | All | SKIP -- tested by adversarial suite, not a display model |

### Priority for Seeding (by UI impact)

**P0 — These models back visible UI features that are currently empty:**
1. ClientNote (client detail page has "Notes" section)
2. ClientTag + ClientTagAssignment (client list shows tag badges)
3. Activity (dashboard activity feed is empty)
4. TrainerSpecialization (profile page has specializations section)
5. TrainerSubscription (tier badge on dashboard)

**P1 — These models back analytics/admin features:**
6. AnalyticsReport (reports tab in analytics)
7. UserInsight (insights panel in analytics)
8. MilestoneAchievement (milestones section in analytics)
9. SupportTicket (admin support panel)
10. ProfileCompletion (profile completion bar)

**P2 — These are metadata/tracking models with lower UI visibility:**
11. ExerciseUsage
12. ExerciseSearchHistory
13. ChartPreference
14. ComparisonBaseline
15. ProgramTemplate
16. ProgramSection

---

## Section 5: Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goal:** Create the infrastructure for rendered-state testing.

1. **Create seed manifest generator** (`scripts/generate-seed-manifest.ts`)
   - Parse seed-enterprise-full.ts
   - Output `tests/e2e/simulations/fixtures/seed-manifest.json`
   - This becomes the single source of truth for expected UI values

2. **Enhance BaseActor with assertion methods**
   - `assertDataVisible(text: string)` -- strict visibility check (no `includes` fallback)
   - `assertNoErrorBoundary()` -- fail on ANY error boundary signal
   - `assertNoRenderBugs()` -- fail on [object Object], undefined, NaN in DOM
   - `assertMinimumElements(selector: string, min: number)` -- for charts, tables, lists
   - `getConsoleErrors(): string[]` -- capture JS errors during navigation

3. **Create Error Boundary Sweeper suite**
   - `tests/e2e/simulations/integrity/error-boundary-sweep.spec.ts`
   - Visits all 20+ authenticated routes for all 3 roles
   - Fails if ANY error boundary or JS exception is found
   - Runs first in the pipeline -- if this fails, nothing else matters

### Phase 2: Rendered Data Assertions (Week 2)

**Goal:** Assert that seeded data actually appears on screen.

4. **Profile & Identity RDA suite**
   - `tests/e2e/simulations/integrity/profile-data-rendering.spec.ts`
   - Verify trainer profile page shows bio, phone, 3 certifications
   - Verify client profile shows health info, PAR-Q responses
   - Verify profile edit form is pre-populated with correct values

5. **Analytics RDA suite**
   - `tests/e2e/simulations/integrity/analytics-data-rendering.spec.ts`
   - Verify measurement chart has 8+ data points
   - Verify latest weight (75.1) appears on overview
   - Verify Training Load tab shows ACWR data for 8 weeks
   - Verify Goals tab shows 4 goals with progress bars
   - Verify Performance tab shows metric data

6. **Program & Workout RDA suite**
   - `tests/e2e/simulations/integrity/program-data-rendering.spec.ts`
   - Verify programs list shows 3 programs with correct names
   - Verify program detail shows 8 weeks with workout names
   - Verify workout history shows 24 completed sessions
   - Verify assignment badge appears on assigned programs

7. **Client Management RDA suite**
   - `tests/e2e/simulations/integrity/client-data-rendering.spec.ts`
   - Verify client list shows correct client with status
   - Verify client detail page shows bio, measurements, goals

8. **Schedule RDA suite**
   - `tests/e2e/simulations/integrity/schedule-data-rendering.spec.ts`
   - Verify calendar shows appointment cards
   - Verify availability grid shows Mon-Fri slots

### Phase 3: Enhanced Seeding (Week 3)

**Goal:** Fill every model gap so RDA tests have data to verify.

9. **Enhance seed-enterprise-full.ts with missing models**
   - Add P0 models: ClientNote, ClientTag, Activity, TrainerSpecialization, TrainerSubscription
   - Add P1 models: AnalyticsReport, UserInsight, MilestoneAchievement, SupportTicket, ProfileCompletion
   - Run full seed and verify no errors

10. **Create additional RDA tests for newly seeded models**
    - Admin panel: verify support tickets render
    - Dashboard: verify activity feed has entries
    - Client list: verify tag badges render
    - Analytics: verify milestones and insights render
    - Profile: verify specializations and completion bar

### Phase 4: Data Completeness & Visual Regression (Week 4)

**Goal:** Ensure no null gaps and establish visual baselines.

11. **Data Completeness Verification suite**
    - `tests/e2e/simulations/integrity/data-completeness.spec.ts`
    - Query every seeded model via API
    - Assert record counts match expected (8 measurements, 24 sessions, etc.)
    - Assert critical fields are non-null
    - This catches seed script regressions

12. **Visual Regression baseline capture**
    - `tests/e2e/simulations/integrity/visual-regression.spec.ts`
    - Capture golden screenshots of 10 key pages with seeded data
    - Use `toHaveScreenshot()` for pixel comparison
    - Store baselines in `tests/e2e/simulations/screenshots/golden/`

13. **Coverage Gap Reporter**
    - `scripts/forge-coverage-report.ts`
    - Generates the model-field-coverage matrix
    - Outputs to console and optionally to markdown
    - Integrate into CI as a non-blocking report

### Phase 5: Integration & CI (Week 5)

**Goal:** Wire everything into the test pipeline.

14. **Pipeline ordering**
    ```
    1. Seed (seed-enterprise-full.ts)
    2. Error Boundary Sweep (Phase 1 — gate: if this fails, stop)
    3. Data Completeness Verification (Phase 4)
    4. Rendered Data Assertions (Phase 2, all suites)
    5. Visual Regression (Phase 4)
    6. Existing FORGE v3 suites (workflows, adversarial, cross-role, etc.)
    ```

15. **CI integration**
    - Error boundary sweep blocks the pipeline
    - RDA failures are errors (not warnings)
    - Visual regression diffs produce artifacts for review
    - Coverage gap report is informational

16. **Documentation**
    - Update FORGE QA design doc with v4 categories
    - Add `data-testid` attributes to UI components for stable selectors
    - Create runbook for adding RDA tests when building new features

---

## Estimated Test Count Impact

| Category | New Tests | Rationale |
|----------|-----------|-----------|
| Error Boundary Sweep | ~60 | 20 routes x 3 roles |
| Profile RDA | ~15 | Trainer profile, client profile, health, certs, edit form |
| Analytics RDA | ~20 | 5 tabs x 4 assertions each |
| Program/Workout RDA | ~15 | List, detail, history, assignments |
| Client Management RDA | ~10 | List, detail, notes, tags |
| Schedule RDA | ~8 | Calendar, availability |
| Admin RDA | ~8 | Support tickets, bug reports, user list |
| Data Completeness | ~12 | 12 models with field validation |
| Visual Regression | ~10 | 10 golden screenshots |
| **TOTAL NEW** | **~158** | |
| Existing FORGE v3 | 278 | |
| **FORGE v4 TOTAL** | **~436** | |

---

## Key Architectural Decisions

### 1. Seed Manifest vs. Hardcoded Values

**Decision:** Use a generated seed manifest JSON as the source of truth.
**Why:** When seed data changes, tests auto-update. No hardcoded "75.1kg" in test files that rot when seed changes weight to 76.2kg.

### 2. `data-testid` Attributes

**Decision:** Add `data-testid` to all data-rendering components.
**Why:** Text selectors are brittle (localization, formatting). `data-testid="measurement-weight"` survives refactors. Start with the 20 highest-priority assertions and expand.

### 3. Error Boundary Sweep as Pipeline Gate

**Decision:** Error boundary sweep runs FIRST and blocks all other tests.
**Why:** If a page is showing an error boundary, all other tests on that page are meaningless. Fix the error boundary first, then validate data rendering.

### 4. Separate Integrity Directory

**Decision:** All v4 tests go in `tests/e2e/simulations/integrity/`.
**Why:** Clear separation from existing workflow/adversarial/chaos tests. Integrity tests verify "does the rendered UI match the database?" which is a distinct concern from "does the workflow complete successfully?"

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Flaky selectors due to async React rendering | HIGH | MEDIUM | Use `waitForSelector` + `toBeVisible()` + reasonable timeouts. Prefer `data-testid` over text. |
| Neon cold-start causes empty data on first load | HIGH | HIGH | Add warmup ping before RDA suite. Use retry in BaseActor. |
| Chart libraries render differently across OS | MEDIUM | LOW | Visual regression uses 5% pixel threshold. Only compare structure, not exact pixels. |
| Seed manifest drifts from actual seed script | LOW | MEDIUM | CI step regenerates manifest before tests. Fail if stale. |
| data-testid attributes removed during refactor | LOW | MEDIUM | ESLint rule to preserve data-testid on key components. |

---

## Success Criteria

FORGE v4 is complete when:

1. Every page that renders seeded data has at least 1 RDA test asserting a specific value
2. Error boundary sweep covers all 20+ authenticated routes and finds 0 errors
3. Data completeness verification confirms all 24 seeded models have non-null critical fields
4. Coverage gap report shows >70% of Prisma model fields are either seeded, tested via API, or asserted in UI
5. Visual regression baselines exist for the 10 highest-traffic pages
6. The test that would have caught the "Analytics Unavailable" bug (the original motivation) passes when analytics works and fails when it does not
