# EvoFitTrainer Demo Simulator - Design Document
**Date:** 2026-02-10
**Approach:** Hybrid (API Seed + Playwright E2E)
**Execution:** Claude Agent Teams (parallel)

---

## Overview

Build a comprehensive demo simulation system that:
1. Populates realistic demo data via API calls (workouts, measurements, appointments, goals)
2. Validates 100% of platform usability via Playwright browser automation
3. Packaged as a reusable Claude skill + subagent for repeatable execution

## Architecture

```
scripts/
  seed-demo-data.ts          # API-based data seeder (runs against production)
tests/e2e/
  demo-simulation.spec.ts    # Playwright E2E test suite (all pages/flows)
  helpers/
    auth.ts                  # Login helpers
    api.ts                   # API call helpers
.claude/
  skills/evofit-demo-simulator/
    SKILL.md                 # Claude skill definition
  agents/
    evofit-simulator.md      # Subagent definition
```

## Phase 1: API Seed Script (`scripts/seed-demo-data.ts`)

### Authentication
- Login as coach.sarah@evofittrainer.com via POST /api/auth/login
- Store JWT token for subsequent API calls
- Login as each client for client-specific data

### Data Creation Order (dependency chain)
1. **Programs** (2 new) → POST /api/programs
2. **Program Assignments** → POST /api/programs/[id]/assign
3. **Workouts** (45-60 total) → POST /api/workouts
4. **Workout Sets** (4-6 per workout) → POST /api/workouts/[id]/sets
5. **Workout Completion** (past workouts) → POST /api/workouts/[id]/complete
6. **Body Measurements** (24-30 total) → POST /api/analytics/measurements
7. **Goals** (6-9 total) → POST /api/analytics/goals
8. **Appointments** (10-15 total) → POST /api/schedule/appointments
9. **Exercise Favorites** (5-10 per user) → POST /api/exercises/favorites
10. **Exercise Collections** (1-2 per user) → POST /api/exercises/collections

### Demo Data Spec

#### Programs to Create
1. **HIIT & Conditioning** (for emma.wilson)
   - 6 weeks, advanced, cardio focus
   - 4 workouts/week
   - Equipment: kettlebell, body weight, jump rope

2. **Beginner Full Body** (for olivia.martinez)
   - 8 weeks, beginner, full body
   - 3 workouts/week
   - Equipment: dumbbell, body weight, resistance band

#### Workouts Per Client (past 6 weeks)
- **alex.johnson** (intermediate, powerlifting):
  - 4x/week = ~24 completed workouts
  - Focus: squat, bench, deadlift, overhead press
  - Progressive overload: weights increase 2.5-5kg every 2 weeks
  - 2-3 in-progress/upcoming workouts

- **emma.wilson** (advanced, HIIT):
  - 4x/week = ~24 completed workouts
  - Focus: burpees, kettlebell swings, box jumps, sprints
  - Mix of timed (30-60s) and rep-based sets
  - 2 in-progress workouts

- **olivia.martinez** (beginner, full body):
  - 3x/week = ~18 completed workouts
  - Focus: goblet squats, push-ups, rows, lunges
  - Conservative progression (small weight increases)
  - 1 in-progress workout

#### Body Measurements (weekly for 8 weeks)
- **alex.johnson**: 185lbs → 182lbs (slight cut), BF 18% → 16%
- **emma.wilson**: 140lbs → 138lbs, BF 22% → 20%
- **olivia.martinez**: 165lbs → 158lbs (larger deficit), BF 30% → 27%

#### Goals
- **alex.johnson**: Squat 315lbs (70% progress), Bench 225lbs (85% progress), Compete in meet
- **emma.wilson**: Run sub-7 mile, 50 push-ups unbroken, Lose 5lbs (completed)
- **olivia.martinez**: Lose 15lbs (47% progress), Do 10 push-ups (80%), Workout 3x/week consistently

#### Appointments (coach.sarah's calendar)
- 5 past completed sessions (various clients)
- 3 upcoming this week (1 per client)
- 2 next week
- 1 assessment (olivia - new client onboarding)
- 1 cancelled (for realism)
- Mix of: 1-on-1 training, assessment, check-in

## Phase 2: Playwright E2E Test Suite

### Test Structure
```
tests/e2e/
  demo-simulation.spec.ts     # Master orchestrator
  flows/
    01-trainer-login.spec.ts
    02-trainer-dashboard.spec.ts
    03-client-management.spec.ts
    04-exercise-library.spec.ts
    05-program-builder.spec.ts
    06-workout-tracking.spec.ts
    07-analytics-dashboard.spec.ts
    08-schedule-calendar.spec.ts
    09-profile-management.spec.ts
    10-admin-dashboard.spec.ts
    11-client-login-flow.spec.ts
    12-responsive-mobile.spec.ts
```

### Test Coverage Matrix

#### 01 - Trainer Login
- [ ] Navigate to /login
- [ ] Fill email + password
- [ ] Click Sign In
- [ ] Verify redirect to /dashboard/trainer
- [ ] Verify JWT in localStorage
- [ ] Verify user info displayed in header

#### 02 - Trainer Dashboard
- [ ] Verify client stats cards (total, active, inactive, new)
- [ ] Verify client list renders
- [ ] Verify activity feed has entries
- [ ] Click each Quick Action button (Create Program, Add Client, Calendar, Reports)
- [ ] Verify profile completion widget

#### 03 - Client Management
- [ ] Navigate to /clients
- [ ] Verify 3 clients listed
- [ ] Search for "alex" → verify filter works
- [ ] Click filter tabs (Active, Pending, All)
- [ ] Click client → verify detail page loads
- [ ] Verify client profile sections (goals, limitations, notes)
- [ ] Click "Add Client" → verify modal opens

#### 04 - Exercise Library
- [ ] Navigate to /exercises or /dashboard/exercises
- [ ] Verify exercises load (grid of cards with GIFs)
- [ ] Search for "squat" → verify results filter
- [ ] Open body part filter → select "chest" → verify filter
- [ ] Open equipment filter → select "barbell" → verify
- [ ] Click exercise card → verify detail view
- [ ] Verify GIF loads
- [ ] Verify instructions display
- [ ] Click favorite button → verify toggle
- [ ] Switch grid/list view
- [ ] Test pagination (next page)

#### 05 - Program Builder
- [ ] Navigate to /programs
- [ ] Verify existing programs listed
- [ ] Verify program cards show stats (weeks, workouts, clients)
- [ ] Navigate to /programs/new
- [ ] Fill program name, description
- [ ] Select type, difficulty, duration
- [ ] Add exercises to workout
- [ ] Configure sets/reps
- [ ] Save program (if form complete)
- [ ] Verify program appears in list

#### 06 - Workout Tracking
- [ ] Navigate to /workouts
- [ ] Verify workout hub links
- [ ] Navigate to /workouts/history
- [ ] Verify completed workouts listed (from seed data)
- [ ] Navigate to /workouts/builder
- [ ] Verify workout builder form
- [ ] Navigate to /workout-tracker
- [ ] Verify tracker interface
- [ ] Navigate to /workouts/progress
- [ ] Verify progress data displays

#### 07 - Analytics Dashboard
- [ ] Navigate to /analytics
- [ ] **Overview tab**: Verify stats, recent measurements
- [ ] **Performance tab**: Verify personal bests section
- [ ] **Training Load tab**: Verify volume data
- [ ] **Goals tab**: Verify goals with progress bars
- [ ] **Charts tab**: Verify chart renders
- [ ] **History tab**: Verify measurement list
- [ ] **Photos tab**: Verify gallery (may be empty)
- [ ] Record a new measurement via form
- [ ] Create a new goal via form

#### 08 - Schedule & Calendar
- [ ] Navigate to /schedule
- [ ] Verify calendar renders (week view)
- [ ] Verify appointments appear on calendar
- [ ] Click appointment → verify detail modal
- [ ] Click "New Appointment" → verify creation form
- [ ] Fill appointment form (client, date, time, type)
- [ ] Navigate to /schedule/availability
- [ ] Verify availability settings page

#### 09 - Profile Management
- [ ] Navigate to /profile
- [ ] Verify profile info displays
- [ ] Navigate to /profile/edit
- [ ] Verify edit form fields
- [ ] Change a field (e.g., phone) → save
- [ ] Navigate to /profile/health
- [ ] Verify health questionnaire

#### 10 - Admin Dashboard
- [ ] Login as admin@evofittrainer.com
- [ ] Navigate to /admin
- [ ] Verify admin metrics (total users, active, programs)
- [ ] Navigate to /admin/users
- [ ] Verify user list
- [ ] Click a user → verify detail view
- [ ] Navigate to /admin/system
- [ ] Verify system health data

#### 11 - Client Login Flow
- [ ] Login as alex.johnson@example.com
- [ ] Verify redirect to /dashboard/client
- [ ] Verify client dashboard stats (streak, workouts, PRs)
- [ ] Verify "Today's Workout" section
- [ ] Navigate to workout → verify exercise list
- [ ] Log a set (weight, reps)
- [ ] Navigate to /analytics → verify measurements chart
- [ ] Navigate to /profile → verify client profile

#### 12 - Responsive/Mobile
- [ ] Resize viewport to 375x812 (iPhone)
- [ ] Verify hamburger menu appears
- [ ] Open mobile nav → verify all links
- [ ] Verify login form usable on mobile
- [ ] Verify exercise cards stack vertically
- [ ] Verify calendar is scrollable

## Phase 3: Claude Skill + Subagent

### Skill: `evofit-demo-simulator`
**Location:** `.claude/skills/evofit-demo-simulator/SKILL.md`

Provides two commands:
- `/evofit-demo-simulator seed` - Run API seed script
- `/evofit-demo-simulator test` - Run Playwright E2E suite
- `/evofit-demo-simulator full` - Seed + Test (complete simulation)

### Subagent: `evofit-simulator`
**Location:** `.claude/agents/evofit-simulator.md`

Autonomous agent that:
1. Checks current demo data state
2. Seeds missing data
3. Runs full E2E suite
4. Generates test report with screenshots
5. Reports pass/fail with coverage %

## Execution Plan (Agent Teams)

```
Phase 0: Setup (sequential)
├── Create task list
├── Create team
└── Assign agents

Phase 1: Parallel Build (3 agents simultaneously)
├── Agent 1 "api-seeder": Build scripts/seed-demo-data.ts
├── Agent 2 "e2e-tester": Build tests/e2e/ test suite
└── Agent 3 "skill-builder": Build .claude/skills/ and .claude/agents/

Phase 2: Integration (sequential)
├── Run seed script against production
├── Run E2E tests against production
└── Fix any failures

Phase 3: Verification
├── Generate test report
├── Screenshot all pages
└── Commit all files
```

## Success Criteria
- [ ] All pages render with real demo data (no empty states)
- [ ] 100% of test flows pass
- [ ] Workouts page has 45+ completed workouts across 3 clients
- [ ] Analytics shows charts with trending data
- [ ] Schedule shows past + upcoming appointments
- [ ] Skill is reusable (`/evofit-demo-simulator full` works)
- [ ] Screenshots captured for all major pages
