---
name: forge-qa-warfare
description: Comprehensive actor-based QA warfare that systematically discovers, tests, and validates every trainer-client-admin interaction in EvoFit Trainer. Competitive research, TDD Playwright tests, progressive data seeding, multi-agent coverage verification. Invoke with /forge-qa-warfare or when user says "QA warfare", "comprehensive QA", "test everything", "full simulation".
---

# FORGE QA Warfare

**Philosophy:** If a real trainer can do it, we test it. If a real client can click it, we verify it. If a workflow produces data, we validate the downstream analytics. No smoke tests. No page-load checks. Every test simulates a HUMAN completing a REAL workflow.

---

## 7 Phases

### Phase 1: RECON (Competitive Research + Feature Discovery)

**Goal:** Build a complete map of what the platform SHOULD do and what it ACTUALLY does.

**Steps:**

1. **Competitive Scan** — Web-search the top 5 PT platforms (Trainerize, TrueCoach, My PT Hub, PTminder, Exercise.com). Extract their core trainer-client workflow chains:
   - Program creation → assignment → client delivery
   - Client onboarding (invite → intake forms → profile)
   - Workout execution → completion → trainer review loop
   - Progress monitoring → program adjustment
   - Communication (in-context, not siloed chat)
   - Scheduling & booking
   - Payment → access gating
   - Goal/habit tracking with compliance dashboards

2. **Codebase Scan** — Read `docs/businesslogic.md`, then systematically scan:
   - Every `app/**/page.tsx` (all user-facing pages)
   - Every `app/api/**/route.ts` (all API endpoints)
   - `config/navigation.ts` (role-based nav items)
   - All modal/dialog components (grep for Modal, Dialog, Sheet)
   - All form submit handlers
   - All button onClick handlers that call APIs

3. **Gap Analysis** — Compare competitive workflows against codebase. For each workflow:
   - EXISTS + TESTED: Skip
   - EXISTS + NOT TESTED: Flag for Phase 4
   - MISSING FROM BUSINESSLOGIC.MD: Update the doc
   - NOT IMPLEMENTED: Log as future feature (don't test what doesn't exist)

4. **Update `docs/businesslogic.md`** — Add any features discovered in codebase that aren't documented.

**Output:** `docs/plans/qa-warfare-recon.md` — Complete interaction matrix organized by actor.

---

### Phase 2: BATTLE PLAN (TDD Test Design)

**Goal:** Write the test plan BEFORE writing any test code. Every test is a workflow, not a page check.

**Organize tests into 4 categories:**

#### A. Workflow Suites (`tests/e2e/simulations/workflows/`)
Each suite tests one complete workflow chain end-to-end:

| Suite | Workflow | Key Assertions |
|-------|----------|---------------|
| 01-onboarding | Trainer invites → client registers → appears on roster | Client in trainer's list, profile complete |
| 02-program-lifecycle | Create program → add exercises → assign to client → client sees it | Program in DB, assignment exists, client view works |
| 03-workout-execution | Client starts workout → logs sets/reps/weight → completes | WorkoutSession created, sets logged, status=completed |
| 04-progress-tracking | Client logs measurements → logs goals → updates progress | Data persists, charts render, trends calculate |
| 05-analytics-validation | After data accumulation → trainer views client analytics | Performance tab, training load, goals all render with data |
| 06-scheduling | Trainer sets availability → client books session → both see it | Appointment in DB, calendar shows it, ICS export works |
| 07-ai-workout-builder | Generate workout → save to programs → find in program list | Program created in DB, visible on /programs page |
| 08-exercise-library | Search → filter → favorite → create collection → add exercises | All CRUD operations verified, data persists |
| 09-admin-operations | Admin views users → bulk operations → feature flags → system health | All admin endpoints respond, UI reflects changes |
| 10-communication | Trainer-client messaging context → notifications | Messages deliver, notifications fire |

#### B. Interaction Suites (`tests/e2e/simulations/interactions/`)
Cross-role workflows where TWO actors interact:

| Suite | Interaction Chain |
|-------|-------------------|
| trainer-client-loop | Trainer creates → assigns → client executes → trainer reviews → adjusts |
| multi-day-simulation | 14-day progressive simulation with daily trainer-client interactions |
| cross-role-data-verify | Same data viewed from trainer perspective AND client perspective matches |
| compliance-dashboard | Trainer sees all clients sorted by activity, completion %, flags inactive |

#### C. UI Coverage Suites (`tests/e2e/simulations/coverage/`)
Every interactive UI element gets clicked, filled, or toggled:

| Suite | Target |
|-------|--------|
| buttons-and-actions | Every button with an onClick handler |
| modals-and-dialogs | Every modal: open → interact → submit → verify result |
| forms-and-validation | Every form: fill → submit → verify API call → verify success state |
| dropdowns-and-filters | Every select/dropdown: change value → verify filtered results |

#### D. Long-Form Simulation (`tests/e2e/simulations/long-form/`)

| Suite | Duration | Purpose |
|-------|----------|---------|
| 14-day-progressive | Simulates 14 days | Fills DB with realistic data for analytics testing |
| analytics-after-data | Runs AFTER 14-day sim | Validates all analytics views with accumulated data |

**Output:** `docs/plans/qa-warfare-battle-plan.md` — Complete test plan with every test case listed.

---

### Phase 3: SEED (Data Foundation)

**Goal:** Create a seeding script that builds a complete, realistic world state via API calls.

**Create `tests/e2e/simulations/seed-simulation.ts`:**

```
SEED SEQUENCE:
1. Create simulation accounts (sim-trainer, sim-client-1, sim-client-2, sim-admin)
2. Trainer onboards both clients (POST /api/clients)
3. Trainer creates 3 programs (strength, cardio, flexibility)
4. Trainer assigns programs to clients
5. Client-1 completes 14 days of workouts (sets, reps, weight logged)
6. Client-1 logs measurements on days 1, 7, 14
7. Client-1 creates 3 fitness goals
8. Client-1 updates goal progress on days 5, 10, 14
9. Client-2 completes 7 days of workouts (less active client)
10. Trainer creates 5 appointments across 2 weeks
11. Trainer sets weekly availability
12. Admin creates feature flags
13. Verify: analytics endpoints return populated data
```

**Key Rules:**
- ALL seeding done via API calls (not Prisma direct) — tests the real stack
- Data PERSISTS — not cleaned up — analytics need it
- Use deterministic but realistic values (progressive overload on weights)
- Seed script is idempotent (409 conflicts handled gracefully)

---

### Phase 4: BUILD (TDD Implementation)

**Goal:** Write every test using strict RED-GREEN methodology.

**Process for each test:**
1. Write the Playwright test (it will FAIL — RED)
2. Run the test to confirm it fails for the RIGHT reason
3. If it fails because the FEATURE is broken → file bug, fix, re-run
4. If it fails because the TEST is wrong → fix the test
5. When it passes → GREEN → move to next test

**Actor Pattern — Every test uses actor helpers:**

```typescript
// Pattern: Actor performs action → verify result
test('trainer assigns program to client', async ({ page }) => {
  const trainer = new TrainerActor(page);
  await trainer.login();
  await trainer.navigateToPrograms();
  const program = await trainer.createProgram({
    name: 'Strength Basics',
    type: 'strength',
    difficulty: 'beginner',
    weeks: 4,
  });
  await trainer.assignProgramToClient(program.id, 'sim-client-1');
  
  // Verify from client perspective
  const client = new ClientActor(page);
  await client.login();
  await client.navigateToPrograms();
  await expect(page.getByText('Strength Basics')).toBeVisible();
});
```

**Build Order (dependencies flow down):**
1. Actor helpers (TrainerActor, ClientActor, AdminActor)
2. Seed script
3. Workflow suites (01-10)
4. Interaction suites
5. UI coverage suites
6. Long-form simulation
7. Analytics validation (depends on long-form data)

**Parallel Streams:**
- Stream A: Suites 01-03 (onboarding, programs, workouts)
- Stream B: Suites 04-06 (progress, analytics, scheduling)
- Stream C: Suites 07-09 (AI builder, exercises, admin)
- Stream D: UI coverage suites (buttons, modals, forms, dropdowns)

---

### Phase 5: LONG-FORM SIMULATION

**Goal:** Run a 14-day progressive simulation that fills the database with realistic usage data.

**Day-by-day script:**

```
Day 1:  Trainer creates program "4-Week Strength Builder"
        Trainer assigns to client-1
        Client-1 views program, sees Day 1 workout

Day 2:  Client-1 executes Day 1 workout (bench 60kg, squat 80kg, deadlift 100kg)
        Client-1 logs body measurement (weight: 82kg, bf: 18%)

Day 3:  Client-1 executes Day 2 workout (OHP 40kg, rows 50kg)
        Trainer checks client-1 analytics

Day 4:  Client-1 rest day
        Client-2 joins platform, trainer adds to roster
        Trainer assigns program to client-2

Day 5:  Client-1 executes Day 3 workout (bench 62.5kg progressive overload)
        Client-1 updates goal progress
        Client-2 executes Day 1 workout

Day 6:  Both clients train
        Trainer reviews compliance dashboard

Day 7:  Client-1 logs measurement (weight: 81.5kg, bf: 17.5%)
        Trainer generates progress report

Days 8-13: Progressive workouts continue with increasing weights
           Client-2 misses Day 10 (compliance gap)
           Trainer sends follow-up message

Day 14: Client-1 logs final measurement (weight: 81kg, bf: 17%)
        Client-1 updates all goal progress
        Trainer reviews 2-week analytics: performance trends, training load, milestones
        VALIDATE: All analytics charts render with real data
        VALIDATE: Personal bests calculated correctly
        VALIDATE: Training load ratio within expected range
```

**This data STAYS in the database.** The next phase validates analytics against it.

---

### Phase 6: MULTI-AGENT VERIFICATION

**Goal:** 3 independent agents audit coverage from each role's perspective.

**Spawn 3 agents in parallel:**

#### Agent 1: Trainer Perspective
```
Prompt: You are a personal trainer using EvoFit. Review every test in
tests/e2e/simulations/. For EVERY action a trainer can take in the app
(check config/navigation.ts for trainer nav items, and every API route
that requires trainer role), verify a test exists that exercises it.
Report any untested trainer action.
```

#### Agent 2: Client Perspective
```
Prompt: You are a fitness client using EvoFit. Review every test in
tests/e2e/simulations/. For EVERY action a client can take (view programs,
execute workouts, log measurements, track goals, book appointments, view
analytics), verify a test exists. Report any untested client workflow.
```

#### Agent 3: Admin Perspective
```
Prompt: You are a platform admin. Review every test in tests/e2e/simulations/.
For EVERY admin capability (user management, bulk operations, feature flags,
system health, activity logs), verify a test exists. Report any gap.
```

**Each agent outputs:** A coverage gap report listing untested actions with the specific page/API/component that lacks coverage.

**After all 3 complete:** Build tests for any identified gaps.

---

### Phase 7: REPORT & UPDATE

**Goal:** Update all documentation and run the full suite.

1. **Run full Playwright suite:**
   ```bash
   npx playwright test tests/e2e/simulations/ --reporter=html
   ```

2. **Update `docs/plans/qa-warfare-results.md`:**
   - Total tests by category
   - Pass/fail/flaky counts
   - Coverage matrix (workflow × role)
   - Screenshots captured

3. **Update `docs/businesslogic.md`:**
   - Correct test counts
   - Update production metrics
   - Add any features discovered during recon

4. **Update project `CLAUDE.md`:**
   - New test counts
   - New test file locations
   - QA warfare results summary

5. **Update Hal bridge:** `~/Claude/second-brain/dev-updates/evofit.md`

---

## Actor Helper Reference

### TrainerActor Methods

```typescript
class TrainerActor {
  login(): Promise<void>
  navigateToDashboard(): Promise<void>
  navigateToClients(): Promise<void>
  navigateToPrograms(): Promise<void>
  navigateToExercises(): Promise<void>
  navigateToWorkouts(): Promise<void>
  navigateToAnalytics(): Promise<void>
  navigateToSchedule(): Promise<void>

  // Client Management
  inviteClient(email: string, message?: string): Promise<void>
  viewClient(clientId: string): Promise<void>
  archiveClient(clientId: string): Promise<void>

  // Program Management
  createProgram(data: ProgramInput): Promise<{ id: string }>
  assignProgramToClient(programId: string, clientId: string): Promise<void>
  duplicateProgram(programId: string): Promise<{ id: string }>
  deleteProgram(programId: string): Promise<void>

  // Analytics (viewing client data)
  viewClientAnalytics(clientId: string): Promise<void>
  viewClientPerformance(clientId: string): Promise<void>
  viewClientTrainingLoad(clientId: string): Promise<void>
  generateReport(clientId: string, dateRange: DateRange): Promise<void>

  // Schedule
  setAvailability(slots: AvailabilitySlot[]): Promise<void>
  createAppointment(data: AppointmentInput): Promise<void>

  // Exercise Library
  searchExercises(query: string): Promise<void>
  favoriteExercise(exerciseId: string): Promise<void>
  createCollection(name: string): Promise<void>

  // AI Workout Builder
  generateAIWorkout(preferences: WorkoutPreferences): Promise<void>
  saveGeneratedWorkout(): Promise<void>
}
```

### ClientActor Methods

```typescript
class ClientActor {
  login(): Promise<void>
  navigateToDashboard(): Promise<void>
  navigateToPrograms(): Promise<void>
  navigateToWorkouts(): Promise<void>
  navigateToAnalytics(): Promise<void>
  navigateToSchedule(): Promise<void>
  navigateToProfile(): Promise<void>

  // Workout Execution
  viewTodaysWorkout(): Promise<void>
  startWorkout(workoutId: string): Promise<void>
  logSet(data: { exercise: string, weight: number, reps: number }): Promise<void>
  completeWorkout(): Promise<void>

  // Progress Tracking
  logMeasurement(data: MeasurementInput): Promise<void>
  createGoal(data: GoalInput): Promise<void>
  updateGoalProgress(goalId: string, value: number): Promise<void>

  // Analytics
  viewPerformance(): Promise<void>
  viewTrainingLoad(): Promise<void>
  viewGoals(): Promise<void>

  // Profile
  updateProfile(data: ProfileInput): Promise<void>
  updateHealthInfo(data: HealthInput): Promise<void>

  // Schedule
  viewSchedule(): Promise<void>
  bookAppointment(slotId: string): Promise<void>
}
```

### AdminActor Methods

```typescript
class AdminActor {
  login(): Promise<void>
  navigateToAdminPanel(): Promise<void>
  
  // User Management
  listUsers(filters?: UserFilters): Promise<void>
  viewUser(userId: string): Promise<void>
  updateUser(userId: string, data: Partial<UserData>): Promise<void>
  bulkOperation(userIds: string[], action: string): Promise<void>

  // System
  viewSystemHealth(): Promise<void>
  viewActivityLog(): Promise<void>
  getFeatureFlags(): Promise<void>
  updateFeatureFlag(flag: string, enabled: boolean): Promise<void>
}
```

---

## Test File Structure

```
tests/e2e/simulations/
  actors/
    base-actor.ts              # Shared login, navigation, assertions
    trainer-actor.ts           # TrainerActor class
    client-actor.ts            # ClientActor class
    admin-actor.ts             # AdminActor class
  seed/
    seed-simulation.ts         # Complete world-state seeding via API
  workflows/
    01-onboarding.spec.ts
    02-program-lifecycle.spec.ts
    03-workout-execution.spec.ts
    04-progress-tracking.spec.ts
    05-analytics-validation.spec.ts
    06-scheduling.spec.ts
    07-ai-workout-builder.spec.ts
    08-exercise-library.spec.ts
    09-admin-operations.spec.ts
    10-communication.spec.ts
  interactions/
    trainer-client-loop.spec.ts
    multi-day-simulation.spec.ts
    cross-role-data-verify.spec.ts
  coverage/
    buttons-and-actions.spec.ts
    modals-and-dialogs.spec.ts
    forms-and-validation.spec.ts
    dropdowns-and-filters.spec.ts
  long-form/
    14-day-progressive.spec.ts
    analytics-after-data.spec.ts
```

---

## Invocation

When this skill is invoked, execute phases 1-7 in order. Use parallel agent streams where indicated (Phase 4 streams A-D, Phase 6 verification agents).

**Prerequisites:**
- Dev server running (`npm run dev`)
- Database accessible (warm Neon)
- Playwright installed (`npx playwright install chromium`)

**Estimated scope:** ~200-300 new Playwright tests across 20+ suite files.
