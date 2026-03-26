# All Epics to 100% — Master Orchestration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Get all EvoFitTrainer epics to 100% completion via 7 parallel agent teams

**Architecture:** Each stream runs in an isolated git worktree on its own branch. Agents work autonomously with TDD (write test → verify fail → implement → verify pass → commit). Streams merge to master as they complete. Post-merge validation via spec-reviewer and quality-reviewer.

**Tech Stack:** Next.js 14, React 18, TypeScript 5.6, Prisma 5.22, PostgreSQL 16, Tailwind CSS, shadcn/ui, Jest, Web Push API, WebAuthn

---

## Phase 0: Setup (Sequential)

### Task 0.1: Create worktrees

```bash
cd C:/Users/drmwe/Claude/EvoFitTrainer
git worktree add .worktrees/stream-a -b feature/stream-a-profiles HEAD
git worktree add .worktrees/stream-b -b feature/stream-b-clients HEAD
git worktree add .worktrees/stream-c -b feature/stream-c-collections HEAD
git worktree add .worktrees/stream-d -b feature/stream-d-workout-exec HEAD
git worktree add .worktrees/stream-e -b feature/stream-e-program-polish HEAD
git worktree add .worktrees/stream-f -b feature/stream-f-pwa-mobile HEAD
git worktree add .worktrees/stream-g -b feature/stream-g-admin-sched HEAD
```

### Task 0.2: Ensure .worktrees/ is in all ignore configs

Verify jest.config.js, .eslintignore, tsconfig.json all ignore `.worktrees/`.

---

## Phase 1: Launch Parallel Agents

Launch 7 agents simultaneously, each with its own stream plan (see individual plan files).

| Agent | Worktree | Branch | Plan File | Model |
|-------|----------|--------|-----------|-------|
| stream-a | .worktrees/stream-a | feature/stream-a-profiles | stream-a-plan.md | sonnet |
| stream-b | .worktrees/stream-b | feature/stream-b-clients | stream-b-plan.md | sonnet |
| stream-c | .worktrees/stream-c | feature/stream-c-collections | stream-c-plan.md | sonnet |
| stream-d | .worktrees/stream-d | feature/stream-d-workout-exec | stream-d-plan.md | sonnet |
| stream-e | .worktrees/stream-e | feature/stream-e-program-polish | stream-e-plan.md | sonnet |
| stream-f | .worktrees/stream-f | feature/stream-f-pwa-mobile | stream-f-plan.md | sonnet |
| stream-g | .worktrees/stream-g | feature/stream-g-admin-sched | stream-g-plan.md | sonnet |

---

## Phase 2: Monitor & Merge

1. Check git log in each worktree every 5 minutes
2. Merge completed streams to master (fast-forward first)
3. If conflicts: resolve, then continue
4. After all 7 merged: full test suite run

---

## Phase 3: Review & Verify

1. Run `npx jest --no-coverage` — all tests must pass
2. Run `npx next build` — must succeed with 0 errors
3. Run spec-reviewer on all changes
4. Run quality-reviewer on all changes
5. If issues found: Ralph Loop to fix

---

## Stream Plan References

Each stream has a detailed plan with exact file paths, test code, and implementation code:

- Stream A: `docs/plans/2026-03-26-stream-a-profiles.md`
- Stream B: `docs/plans/2026-03-26-stream-b-clients.md`
- Stream C: `docs/plans/2026-03-26-stream-c-collections.md`
- Stream D: `docs/plans/2026-03-26-stream-d-workout-exec.md`
- Stream E: `docs/plans/2026-03-26-stream-e-program-polish.md`
- Stream F: `docs/plans/2026-03-26-stream-f-pwa-mobile.md`
- Stream G: `docs/plans/2026-03-26-stream-g-admin-sched.md`
