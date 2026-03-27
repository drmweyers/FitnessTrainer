# Ironclad QA System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a comprehensive Playwright E2E test suite with 40 suites (~451 tests) covering every workflow, button, and interaction in EvoFitTrainer for both trainer and client roles.

**Architecture:** Playwright CLI tests organized by user workflow, not by page. Each suite simulates real user journeys. Global setup creates 3 QA test accounts (trainer/client/admin) and seeds prerequisite data. Tests run on localhost:3000 first, then trainer.evofit.io via config flag.

**Tech Stack:** Playwright 1.50+, TypeScript, Node.js 18+

---

## Test Accounts

| Account | Email | Password | Role |
|---------|-------|----------|------|
| QA Trainer | qa-trainer@evofit.io | QaTest2026! | trainer |
| QA Client | qa-client@evofit.io | QaTest2026! | client |
| QA Admin | qa-admin@evofit.io | QaTest2026! | admin |

Created in `global-setup.ts` via `/api/auth/register` (auto-verified).

## 40 Suites Across 12 Phases

### Phase 1: Auth & Sessions (Suites 1-4, ~38 tests)
### Phase 2: Profile & Onboarding (Suites 5-6, ~27 tests)
### Phase 3: Client Management (Suites 7-10, ~42 tests)
### Phase 4: Exercise Library (Suites 11-13, ~39 tests)
### Phase 5: Program Builder (Suites 14-16, ~35 tests)
### Phase 6: Workout Execution (Suites 17-20, ~47 tests)
### Phase 7: Analytics & Measurements (Suites 21-24, ~40 tests)
### Phase 8: Scheduling (Suites 25-27, ~30 tests)
### Phase 9: Admin & Support (Suites 28-31, ~40 tests)
### Phase 10: PWA & Responsiveness (Suites 32-35, ~41 tests)
### Phase 11: E2E Journeys (Suites 36-38, ~37 tests)
### Phase 12: Error & Edge Cases (Suites 39-40, ~35 tests)

## 8 Parallel Streams

| Stream | Suites | Tests |
|--------|--------|-------|
| QA-A | 1-4 (Auth) | ~38 |
| QA-B | 5-6 (Profiles) | ~27 |
| QA-C | 7-10 (Client Mgmt) | ~42 |
| QA-D | 11-13 (Exercises) | ~39 |
| QA-E | 14-16 (Programs) | ~35 |
| QA-F | 17-24 (Workouts + Analytics) | ~87 |
| QA-G | 25-35 (Schedule + Admin + PWA) | ~71 |
| QA-H | 36-40 (Journeys + Edge Cases) | ~72 |

## Execution Order

1. Build shared infrastructure (global-setup, helpers, config)
2. QA-A runs first (creates accounts)
3. QA-B through QA-G launch in parallel
4. QA-H runs last (cross-cutting)
5. Ralph Loop on failures until 100% green
6. Run against localhost → fix → run against production → fix
