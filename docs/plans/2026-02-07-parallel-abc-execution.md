# Parallel ABC Execution Plan - Feb 7, 2026

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Execute 3 parallel workstreams to push EvoFitTrainer toward production readiness.

**Baseline:** 71.45% line coverage, 2448 passing tests, 18 failing, 10 suites broken

---

## Stream A: Test Coverage Push (Ralph Loop → 85%)

**Branch:** `test/coverage-85`
**Agent:** test-agent
**Ralph Loop Config:**
- Completion promise: `COVERAGE_TARGET_MET`
- Binary check: jest coverage lines >= 85%
- Max iterations: 20
- Current: 71.45% → Target: 85%

### Tasks:
1. Fix 18 failing tests across 10 broken suites first
2. Identify uncovered files using jest --coverage report
3. Write tests for lowest-coverage files first (biggest impact)
4. Focus on: API routes, services, hooks (high blast radius)
5. Skip: shadcn/ui primitives, pure type files, simple page wrappers

### Success Criteria:
- All tests pass (0 failures)
- Line coverage >= 85%

---

## Stream B: Bug Fixing (Remaining Tasks)

**Branch:** `fix/remaining-bugs`
**Agent:** fix-agent

### Tasks (from stale evofit-fixers, verified against current state):
1. **Sidebar Navigation** - Fix broken links, remove duplicates, ensure /dashboard /analytics /workout-tracker accessible
2. **Programs Frontend Wiring** - Wire ProgramBuilder save to POST /api/programs, ProgramList to GET, delete/duplicate actions
3. **Workouts Page Consolidation** - Fix workouts page (not just builder), wire builder to exercises API, completion + set logging
4. **Client Management** - Wire client filters, program/history views
5. **Dashboard Polish** - Ensure all 3 dashboards show real data, remove remaining hardcoded values

### Success Criteria:
- Sidebar navigation links all resolve to real pages
- Programs CRUD works end-to-end
- Workout builder can load exercises and save workouts
- Client list with filters works
- All dashboards show real API data (no mock/hardcoded)

---

## Stream C: App Verification (Browser Testing)

**Branch:** none (runs against master dev server)
**Agent:** browser-agent

### Tasks:
1. Start dev server on port 3000
2. Test auth flow: login page loads, form submits, redirects to dashboard
3. Test trainer dashboard: stats load, clients display, quick actions work
4. Test exercise library: list loads, search works, filters work, detail page
5. Test programs: list loads, create works, assign works
6. Test workouts: history loads, builder loads
7. Document all broken flows with screenshots

### Success Criteria:
- Written report of working vs broken features
- Screenshots of key pages
- List of blocking issues found

---

## Merge Strategy
1. Stream A (tests) merges first - no functional code changes
2. Stream B (fixes) merges second - may require conflict resolution with A
3. Stream C produces report only
