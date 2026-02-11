---
name: evofit-demo-simulator
description: Comprehensive demo simulation system for EvoFitTrainer. Seeds realistic demo data via API calls and validates platform usability via Playwright E2E tests.
---

# EvoFit Demo Simulator

## Description

Comprehensive demo simulation system for EvoFitTrainer. Seeds realistic demo data via API calls to the production environment and validates 100% of platform usability via Playwright E2E tests.

## Arguments

The skill accepts one argument specifying the mode:
- `seed` - Populate demo data via API calls to production
- `test` - Run Playwright E2E test suite against production
- `full` - Run both seed + test (complete simulation)
- `status` - Check current demo data state

## Instructions

### Mode: seed

Run the API seed script to populate demo data:

```bash
cd C:\Users\drmwe\Claude\EvoFitTrainer
npx tsx scripts/seed-demo-data.ts
```

This creates:
- 2 new training programs (HIIT & Conditioning, Beginner Full Body)
- Program assignments for 3 clients
- 55+ workout sessions (completed + upcoming)
- Sets with progressive overload for each workout
- 24+ body measurements (weekly for 8 weeks across 3 clients)
- 6-9 fitness goals with varying progress
- 10-15 appointments (past + future)
- Exercise favorites and collections

Target: https://evofittrainer-six.vercel.app
Accounts: coach.sarah@evofittrainer.com / Demo1234!

The script is idempotent - it handles 409 Conflict responses gracefully when data already exists.

### Mode: test

Run the Playwright E2E test suite:

```bash
cd C:\Users\drmwe\Claude\EvoFitTrainer
npx playwright test tests/e2e/flows/ --reporter=html
```

Tests cover 12 flows:
1. Trainer login and authentication
2. Trainer dashboard overview
3. Client management (list, view, edit)
4. Exercise library (search, filter, browse)
5. Program builder (create, assign, manage)
6. Workout tracking (log sets, complete workouts)
7. Analytics dashboard (charts, measurements, progress)
8. Schedule and calendar (appointments, upcoming)
9. Profile management (settings, preferences)
10. Admin dashboard (users, system stats)
11. Client login flow (client perspective)
12. Responsive and mobile layouts

Screenshots are saved to `tests/e2e/screenshots/` for visual verification.

Open the HTML report after tests complete:

```bash
npx playwright show-report
```

### Mode: full

Run seed first, then tests:

```bash
cd C:\Users\drmwe\Claude\EvoFitTrainer
npx tsx scripts/seed-demo-data.ts && npx playwright test tests/e2e/flows/ --reporter=html
```

This is the recommended mode for a complete demo simulation. The seed script populates all demo data, then the E2E tests validate every page has content and all interactions work.

### Mode: status

Check current demo data state by calling key APIs.

1. Authenticate as trainer:
```bash
cd C:\Users\drmwe\Claude\EvoFitTrainer
npx tsx -e "
const BASE = 'https://evofittrainer-six.vercel.app';
async function check() {
  const login = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'coach.sarah@evofittrainer.com', password: 'Demo1234!' })
  });
  const auth = await login.json();
  if (!auth.accessToken) { console.log('AUTH: FAILED'); return; }
  console.log('AUTH: OK');
  const token = auth.accessToken;
  const headers = { Authorization: 'Bearer ' + token };

  const endpoints = [
    ['/api/clients', 'Clients (expect 3+)'],
    ['/api/programs', 'Programs (expect 3+)'],
    ['/api/exercises', 'Exercises (expect 1300+)'],
    ['/api/schedule/appointments', 'Appointments (expect 10+)'],
  ];
  for (const [path, label] of endpoints) {
    const r = await fetch(BASE + path, { headers });
    const d = await r.json();
    const count = Array.isArray(d.data) ? d.data.length : (d.data?.length ?? 'N/A');
    console.log(label + ': ' + count);
  }
}
check().catch(e => console.error(e));
"
```

2. Verify expected counts:
   - Clients: 3+
   - Programs: 3+
   - Exercises: 1,300+
   - Appointments: 10+
   - Workouts: 55+
   - Measurements: 24+

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| BASE_URL | https://evofittrainer-six.vercel.app | Target environment |
| TRAINER_EMAIL | coach.sarah@evofittrainer.com | Trainer account |
| TRAINER_PASSWORD | Demo1234! | Trainer password |

## Prerequisites

- Node.js 18+ (for native fetch in seed script)
- `tsx` (via npx, for running TypeScript seed script)
- Playwright (via npx, for E2E tests - install with `npx playwright install chromium`)
- Working internet connection to reach production API

## Key Files

| File | Purpose |
|------|---------|
| `scripts/seed-demo-data.ts` | API seed script - creates all demo data |
| `tests/e2e/flows/*.spec.ts` | Playwright E2E test specs (12 flows) |
| `tests/e2e/helpers/` | Shared test utilities (auth, navigation) |
| `playwright.config.ts` | Playwright configuration |
| `tests/e2e/screenshots/` | Captured screenshots from test runs |
