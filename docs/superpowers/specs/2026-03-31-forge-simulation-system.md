# FORGE User Simulation System - Technical Specification

**Date:** March 31, 2026
**Version:** 1.0
**Status:** Approved
**Target:** 97% test coverage (from 92.65%)

---

## Overview

FORGE (Fidelity-Oriented Regression & Growth Engine) is a comprehensive user interaction simulation system that models real-world trainer-client workflows through TDD-driven unit tests. This system closes coverage gaps and validates multi-step business workflows.

---

## Phase 1: Gap Workflows (Target: 95% → 97%)

### 1.1 Missing API Routes (High Priority)

#### Support Ticket System
```typescript
// Routes to implement:
app/api/support/tickets/route.ts          // GET list, POST create
app/api/support/tickets/[id]/route.ts     // GET detail, PUT update

// Test files already exist (failing):
// __tests__/api/support/tickets.test.ts
// __tests__/api/support/ticket-detail.test.ts
```

**Workflow W1: Support Ticket Lifecycle**
1. Client creates ticket (subject, message, priority)
2. System assigns ticket ID, sets status 'open'
3. Admin views all tickets, filters by status
4. Admin updates status 'in-progress', adds reply
5. Client views ticket with reply thread
6. Admin resolves ticket, status 'closed'
7. Client can reopen if unresolved

**Edge Cases:**
- Client tries to view another user's ticket → 403
- Create ticket without subject → 400
- Update non-existent ticket → 404
- Non-admin tries to update → 403

#### Content Reporting System
```typescript
// Routes to implement:
app/api/reports/route.ts                  // GET list, POST create
app/api/reports/[id]/route.ts             // PUT update (admin only)

// Test files already exist (failing):
// __tests__/api/reports/reports.test.ts
```

**Workflow W2: Content Reporting**
1. User reports content (type: 'exercise'|'message', id, reason)
2. System creates report with status 'pending'
3. Admin views all reports, filters by status
4. Admin reviews reported content
5. Admin resolves: 'dismissed'|'content_removed'|'user_warned'
6. Reporter notified of resolution

**Edge Cases:**
- Invalid content type → 400
- Invalid reason enum → 400
- Non-admin resolve attempt → 403

### 1.2 Notification Delivery System

**Workflow W3: Multi-Channel Notification Delivery**

```typescript
// Services to test:
lib/services/notificationService.ts
lib/services/pushNotificationService.ts
lib/services/emailService.ts
```

**Test Scenarios:**
| Scenario | Channels | Test Count |
|----------|----------|------------|
| Workout reminder | Push + Email | 3 |
| New message | Push + In-app | 3 |
| Goal achieved | Push + Email + In-app | 4 |
| Appointment booked | Email + In-app | 3 |
| Certification expiring | Email only | 2 |
| Program assigned | Push + Email + In-app | 4 |

**Edge Cases:**
- Push subscription expired → fallback to email
- User disabled push → skip push channel
- Email bounce → log for retry
- All channels failed → queue for retry

### 1.3 Race Conditions & Concurrency

**Workflow W4: Concurrent Operations**

```typescript
// Services to test:
lib/services/workoutService.ts
lib/services/scheduleService.ts
lib/services/programAssignmentService.ts
```

**Test Scenarios:**
1. Two trainers edit same client notes simultaneously
2. Client starts workout while trainer modifies it
3. Double-booking: two clients book same time slot
4. Concurrent measurement updates
5. Program assignment while workout in progress

**Test Count:** 8 tests with simulated concurrent requests

### 1.4 Error Recovery & Resilience

**Workflow W5: Error Recovery Patterns**

```typescript
// Services to test:
lib/services/syncService.ts
lib/services/retryService.ts
lib/utils/errorHandler.ts
```

**Test Scenarios:**
1. Network failure during workout save → exponential retry
2. Database timeout → circuit breaker pattern
3. Partial sync failure → rollback and log
4. Redis connection lost → fallback behavior
5. Third-party API failure → degrade gracefully

**Test Count:** 10 tests

---

## Phase 2: All 108 Stories (Target: 97% → 99%+)

### 2.1 Agent Stream Assignment

| Stream | Lead | Epics | Stories | Files | Est Tests |
|--------|------|-------|---------|-------|-----------|
| **Stream A** | @forge-trainer-auth | 001-002 | 1-14 | User profiles, Auth | 180 |
| **Stream B** | @forge-client-exercise | 003-004 | 15-28 | Client mgmt, Exercise lib | 160 |
| **Stream C** | @forge-program-workout | 005-006 | 29-45 | Programs, Workouts | 200 |
| **Stream D** | @forge-analytics-chat | 007-008 | 46-61 | Analytics, Messaging | 170 |
| **Stream E** | @forge-schedule-admin | 009-012 | 62-87 | Scheduling, Mobile, Admin | 190 |

### 2.2 Story Mapping

#### Stream A: User Profiles & Authentication (Stories 1-14)

| Story | Workflow | Simulation Steps | Tests |
|-------|----------|------------------|-------|
| 001-01 | Create Initial Profile | Register → Complete profile → Verify email | 15 |
| 001-02 | Edit Profile | Login → Edit bio → Save → Verify persistence | 12 |
| 001-03 | Upload Profile Photo | Select photo → Upload → Crop → Save → View | 10 |
| 001-04 | Health Questionnaire | Navigate → Fill medical → Submit → Review | 15 |
| 001-05 | Set Fitness Goals | Add goal → Set target → Track progress | 12 |
| 001-06 | Trainer Certifications | Add cert → Upload doc → Verify dates | 10 |
| 001-07 | Progress Photos | Take photo → Upload → Compare over time | 10 |
| 002-01 | User Registration | Sign up → Verify → Onboard | 15 |
| 002-02 | Email Verification | Register → Receive email → Click link → Activate | 10 |
| 002-03 | User Login | Enter creds → Authenticate → Redirect | 12 |
| 002-04 | Password Reset | Forgot → Email sent → Reset → Login | 10 |
| 002-05 | Two-Factor Auth | Enable → Verify → Login with 2FA | 10 |
| 002-06 | Social Login | OAuth → Profile sync → Login | 10 |
| 002-07 | Session Management | Login → Extend → Logout → Expire | 8 |

#### Stream B: Client Management & Exercise Library (Stories 15-28)

| Story | Workflow | Simulation Steps | Tests |
|-------|----------|------------------|-------|
| 003-01 | Add Client | Invite → Accept → Setup → Assign program | 12 |
| 003-02 | Client List | View → Filter → Sort → Search | 10 |
| 003-03 | Client Profile | View → Edit notes → Track history | 10 |
| 003-04 | Client Invitation | Generate link → Send → Track status | 8 |
| 003-05 | Client Status | Activate → Pause → Resume → Deactivate | 8 |
| 003-06 | Client Notes & Tags | Add note → Tag → Filter by tag | 10 |
| 004-01 | Browse Exercise Library | Navigate → Filter → View details | 10 |
| 004-02 | Search Exercises | Type query → Results → Select | 10 |
| 004-03 | Filter Exercises | Apply filters → Results → Clear | 8 |
| 004-04 | View Exercise Details | Select → View GIF → Read instructions | 8 |
| 004-05 | Favorite Exercises | Star → View favorites → Unstar | 8 |
| 004-06 | Exercise Collections | Create collection → Add exercises → Share | 12 |

#### Stream C: Program Builder & Workout Tracking (Stories 29-45)

| Story | Workflow | Simulation Steps | Tests |
|-------|----------|------------------|-------|
| 005-01 | Create Program | New → Name → Description → Save draft | 10 |
| 005-02 | Build Weekly Structure | Add weeks → Set days → Configure | 12 |
| 005-03 | Add Exercises | Search → Select → Configure sets/reps | 15 |
| 005-04 | Configure Parameters | Set intensity → Rest → Progression | 12 |
| 005-05 | Supersets & Circuits | Group exercises → Configure timing | 10 |
| 005-06 | Templates | Save as template → Reuse → Modify | 10 |
| 005-07 | Assign Clients | Select program → Choose clients → Assign | 10 |
| 005-08 | Progressive Overload | Setup → Auto-increase → Track | 12 |
| 006-01 | Start Today's Workout | View schedule → Start → Timer begins | 10 |
| 006-02 | Log Sets and Reps | Complete set → Log weight/reps → Rest | 15 |
| 006-03 | Rest Timer | Start rest → Timer → Notify → Next set | 10 |
| 006-04 | Exercise Guidance | View instructions → Watch demo → Execute | 8 |
| 006-05 | Track Personal Records | Lift → PR detected → Celebrate → Save | 10 |
| 006-06 | Modify Workout | Skip exercise → Substitute → Log reason | 12 |
| 006-07 | Workout Summary | Complete → Review stats → Share → Save | 10 |
| 006-08 | Offline Tracking | Lose connection → Continue → Sync when back | 15 |

#### Stream D: Analytics & Messaging (Stories 46-61)

| Story | Workflow | Simulation Steps | Tests |
|-------|----------|------------------|-------|
| 007-01 | Track Body Measurements | Add measurement → View trend → Compare | 12 |
| 007-02 | View Progress Charts | Select metric → View chart → Change timeframe | 10 |
| 007-03 | Progress Photos Comparison | Select photos → Compare → View timeline | 10 |
| 007-04 | Performance Analytics | View dashboard → Filter → Export | 10 |
| 007-05 | Generate Progress Reports | Select period → Generate → Review → Send | 12 |
| 007-06 | Goal Tracking | View goals → Update progress → Achieve | 10 |
| 007-07 | Training Load Monitoring | View ACWR → Adjust → Alert if overreaching | 10 |
| 007-08 | Insights & Recommendations | View AI insights → Apply → Track result | 10 |
| 008-01 | Send Messages | Compose → Send → Receive → Reply | 12 |
| 008-02 | Share Media | Attach photo/video → Send → View | 10 |
| 008-03 | Voice Messages | Record → Send → Play → Reply | 10 |
| 008-04 | Notification Management | Configure → Receive → Manage | 8 |
| 008-05 | Message Templates | Create → Use → Edit → Delete | 10 |
| 008-06 | Form Check Videos | Record → Send → Receive feedback → Apply | 12 |
| 008-07 | Business Hours | Set hours → Auto-reply outside hours | 8 |
| 008-08 | Conversation Export | Select chat → Export → Download | 8 |

#### Stream E: Scheduling, Mobile & Admin (Stories 62-87)

| Story | Workflow | Simulation Steps | Tests |
|-------|----------|------------------|-------|
| 009-01 | View Schedule | Navigate calendar → View appointments | 10 |
| 009-02 | Availability | Set available hours → Block time → Save | 10 |
| 009-03 | Book Session | Select time → Confirm → Receive notification | 12 |
| 009-04 | Recurring Sessions | Create series → Modify instance → Cancel | 12 |
| 009-05 | Cancellations | Cancel → Reason → Notify → Reschedule | 10 |
| 009-06 | Reminders | Set reminder → Receive → Confirm | 8 |
| 009-07 | Calendar Sync | Connect Google/Apple → Sync → Update | 10 |
| 009-08 | Group Classes | Create class → Set capacity → Book → Manage | 15 |
| 010-01 | Set Pricing | Define tiers → Set features → Publish | 10 |
| 010-02 | Purchase Sessions | Select package → Checkout → Confirm | 12 |
| 010-03 | Process Payments | Enter card → Process → Receipt → Invoice | 12 |
| 010-04 | Manage Subscriptions | View → Upgrade → Downgrade → Cancel | 10 |
| 010-05 | Issue Refunds | View transaction → Refund → Process → Notify | 8 |
| 010-06 | Generate Invoices | Select period → Generate → Send → Track | 10 |
| 010-07 | Track Revenue | View dashboard → Filter → Export report | 8 |
| 010-08 | Handle Payouts | Setup bank → Request payout → Track | 10 |
| 011-01 | PWA Workout Tracking | Install → Offline mode → Sync | 15 |
| 011-02 | Push Notifications | Subscribe → Receive → Interact | 12 |
| 011-03 | Offline Mode | Go offline → Continue → Sync when back | 15 |
| 011-04 | Biometric Login | Enable → Authenticate → Use | 10 |
| 011-05 | Health App Integration | Connect Apple/Google Health → Sync data | 10 |
| 011-06 | Quick Actions | Configure widget → Use shortcuts | 8 |
| 011-07 | Camera Optimizations | Record form check → Upload → Review | 10 |
| 012-01 | View Platform Metrics | Dashboard → Users → Activity → Revenue | 10 |
| 012-02 | Manage Users | Search → View → Edit → Suspend | 10 |
| 012-03 | Handle Support Tickets | View queue → Assign → Resolve | 12 |
| 012-04 | Monitor System Health | View metrics → Alerts → Investigate | 8 |
| 012-05 | Moderate Content | Review reports → Take action → Document | 10 |
| 012-06 | Manage Financial Data | View transactions → Reconcile → Report | 8 |
| 012-07 | Configure Platform | Settings → Features → Toggle → Save | 8 |
| 012-08 | Generate Reports | Select type → Configure → Generate → Export | 10 |

---

## 3. FORGE Simulation Architecture

### 3.1 Simulation Engine Components

```typescript
// Core simulation types
interface Actor {
  id: string;
  role: 'trainer' | 'client' | 'admin';
  state: UserState;
  preferences: UserPreferences;
}

interface WorkflowStep {
  id: string;
  action: (actor: Actor, context: Context) => Promise<Result>;
  assertions: (result: Result) => void;
  onError?: (error: Error) => void;
}

interface Workflow {
  id: string;
  name: string;
  actors: Actor[];
  steps: WorkflowStep[];
  expectedDuration: number;
  successCriteria: () => boolean;
}

interface SimulationResult {
  workflowId: string;
  completed: boolean;
  stepsCompleted: number;
  errors: Error[];
  coverage: CoverageMetrics;
}
```

### 3.2 Test Structure

```
__tests__/forge/
├── phase1-gap-workflows/
│   ├── support/
│   │   ├── ticket-lifecycle.test.ts      # W1
│   │   └── ticket-edge-cases.test.ts
│   ├── reports/
│   │   ├── content-reporting.test.ts     # W2
│   │   └── report-resolution.test.ts
│   ├── notifications/
│   │   ├── multi-channel.test.ts         # W3
│   │   ├── delivery-failures.test.ts
│   │   └── preference-respect.test.ts
│   ├── concurrency/
│   │   ├── race-conditions.test.ts       # W4
│   │   └── deadlock-prevention.test.ts
│   └── resilience/
│       ├── error-recovery.test.ts        # W5
│       ├── retry-logic.test.ts
│       └── circuit-breaker.test.ts
│
└── phase2-all-stories/
    ├── stream-a-trainer-auth/
    ├── stream-b-client-exercise/
    ├── stream-c-program-workout/
    ├── stream-d-analytics-chat/
    └── stream-e-schedule-admin/
```

### 3.3 Test Utilities

```typescript
// __tests__/forge/utils/simulation-helpers.ts

export class ActorFactory {
  static createTrainer(overrides?: Partial<Trainer>): Trainer;
  static createClient(overrides?: Partial<Client>): Client;
  static createAdmin(overrides?: Partial<Admin>): Admin;
}

export class WorkflowRunner {
  static async run(workflow: Workflow): Promise<SimulationResult>;
  static async runConcurrent(workflows: Workflow[]): Promise<SimulationResult[]>;
  static async simulateLatency(ms: number): Promise<void>;
  static async simulateFailure(rate: number): Promise<boolean>;
}

export class CoverageTracker {
  static track(file: string, lines: number[]): void;
  static report(): CoverageMetrics;
  static assertMinimum(percent: number): void;
}
```

---

## 4. Implementation Phases

### Phase 1: Gap Workflows (Week 1)

**Day 1-2: Missing Routes**
- Implement support ticket API routes
- Implement content reporting API routes
- Fix failing tests

**Day 3-4: Notification System**
- Mock notification services
- Test multi-channel delivery
- Test failure scenarios

**Day 5: Race Conditions & Resilience**
- Simulate concurrent operations
- Test retry logic
- Verify circuit breakers

**Target:** 97% line coverage

### Phase 2: All 108 Stories (Weeks 2-3)

**Parallel Execution:**
- 5 agent teams in separate worktrees
- Each team responsible for 1 stream
- Daily sync meetings
- Shared test utilities

**Per Stream:**
- Day 1: Setup and first 5 stories
- Day 2: Stories 6-10
- Day 3: Stories 11-15
- Day 4: Edge cases and integration
- Day 5: Review and coverage push

**Target:** 99%+ line coverage

---

## 5. Success Criteria

| Metric | Current | Phase 1 | Phase 2 |
|--------|---------|---------|---------|
| Line Coverage | 92.65% | 97% | 99%+ |
| Statement Coverage | 91.01% | 96% | 98%+ |
| Function Coverage | 89.42% | 95% | 98%+ |
| Branch Coverage | 82.62% | 90% | 95%+ |
| Total Tests | 5,246 | 5,500+ | 6,000+ |
| E2E Tests | 461 | 500+ | 550+ |

---

## 6. Deliverables

1. **Phase 1:**
   - Support ticket API routes (2 files)
   - Content reporting API routes (2 files)
   - Notification simulation tests (20 tests)
   - Race condition tests (8 tests)
   - Resilience tests (10 tests)

2. **Phase 2:**
   - 900+ new unit tests across 5 streams
   - 90+ new E2E tests
   - FORGE simulation utilities
   - Coverage reports

3. **Documentation:**
   - FORGE methodology guide
   - Test pattern library
   - Coverage gap analysis

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Context window overflow | Medium | High | Worktree isolation, 5 streams max |
| Test flakiness | Medium | Medium | Deterministic mocks, no real timers |
| Coverage plateau | Low | Medium | Target uncovered branches specifically |
| Time overrun | Medium | Medium | Parallel streams, Ralph Loop automation |

---

**Approved by:** User
**Next Step:** Invoke `writing-plans` to create implementation plan with parallel agent execution
