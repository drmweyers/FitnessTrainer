# FORGE QA Phase 2 — Design

## Existing State
- 40 workflow suites (tests/e2e/workflows/01-40), 461 tests
- 12 flow suites (tests/e2e/flows/01-12)
- 7 legacy specs (smoke, client-management, exercise-library-*)
- Zero test.skip() calls
- Global-setup does 12 seed steps (exceeds FORGE 10-step baseline)

## Bugs Found in Phase 1/2 (Pre-Fix)
1. **smoke.spec.ts** — hardcoded port 4000 (legacy backend) with wrong response shape expectation. **FIXED**
2. **global-setup.ts Step 3** — expected `data.exercises` but API returns top-level `{exercises, pagination, filters}`. Cascaded: empty programs, 0 favorites, likely source of CLAUDE.md "known issue" page errors for QA user. **FIXED**

## New Edge Suite Plan (tests/e2e/edge/)
All new suites live under new directory to avoid disturbing the numbered workflows.

### HIGH priority (write now)
- **E01** trainer-deactivation-cascade: admin deactivates trainer → clients lose action ability, historic data preserved, reactivation restores
- **E02** program-assignment-cascade: ProgramAssignment → WorkoutSession auto-gen verify; bulk-assign 10 clients atomic (all-or-rollback)
- **E03** concurrent-workout-complete: rapid double-submit `/api/workouts/[id]/complete` idempotency — only one PerformanceMetric per exercise
- **E06** permission-leak: URL tampering — client A vs B data, trainer A vs trainer B clients, non-admin hitting /api/admin/*, client POSTing /api/programs
- **E07** jwt-refresh-mid-workflow: access token expires mid workout logging, auth flow refreshes seamlessly

### MEDIUM priority
- **E04** photo-measurement-sync: ProgressPhoto uploaded before BodyMeasurement; overlay consistency
- **E05** invitation-token-race: re-invite before expiry; no duplicate TrainerClient
- **E08** client-switch-trainer: historic data preserved when client changes trainer mid-program
- **E09** program-duplicate-isolation: clone program, edit copy, original untouched at Prisma relation level
- **E10** search-injection-safety: `O'Brien & Co.`, XSS payload, empty, 10000-char string
- **E15** tier-limit-enforcement: Starter 5-client cap, 6th invite rejected or upsells

### LOW priority
- **E11** empty-state-new-client: zero workouts analytics renders, CTA
- **E12** pagination-boundaries: 500 clients, page 10, off-by-one
- **E13** offline-sync-multi-workout: log 3 offline, reconnect, SyncManager resolves
- **E14** archive-reassign-client: blocked; unarchive restores

## Infra Improvements
- Add mobile + Firefox projects to playwright.config.ts (currently only Chromium)

## Test Account Strategy
Reuse existing `qa-trainer`, `qa-client`, `qa-client2`, `qa-admin` from global-setup. No new accounts needed.
