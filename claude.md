# EvoFit Trainer - Project Configuration
**Type:** Full-Stack Fitness SaaS (Everfit.io clone)
**Status:** MVP ~75% (Backend 95%, Frontend 70%)
**Branch:** `master` on `drmweyers/FitnessTrainer`
**Test Coverage:** 85.57% lines | 3,179 tests | 195 suites | ALL PASSING

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 App Router, React 18, TypeScript 5.6 |
| **UI** | Tailwind CSS 3.4, Radix UI, shadcn/ui, Framer Motion |
| **State** | TanStack Query (server), Jotai (client), React Context |
| **Backend** | Next.js API routes (primary), Express 4.x (optional standalone) |
| **Database** | PostgreSQL 16, Prisma 5.22 |
| **Cache** | Redis / Upstash |
| **Auth** | JWT (15min access / 7d refresh), bcryptjs |
| **Testing** | Jest (unit), Playwright (E2E - 47+ scenarios), RTL |
| **Deploy** | Vercel (production), Docker Compose (dev) |

---

## Quick Commands

```bash
# Development
npm run dev              # Next.js dev server (port 3000)
npm run build            # Production build
npm test                 # Jest unit tests
npm run test:e2e         # Playwright E2E tests

# Backend (from backend/ directory)
npm run dev              # Express API (port 5000)
npm run db:migrate       # Prisma migrations
npm run db:seed          # Seed database
npm run docker:up        # Start Docker services
```

---

## Project Structure

```
app/
  (auth)/               # Login, register pages
  (dashboard)/          # Protected dashboard routes
  api/                  # Next.js API routes (primary backend)
backend/
  src/                  # Express API (standalone option)
    controllers/
    services/
    middleware/
    routes/
  prisma/               # Full schema + migrations + seed
components/             # React components by feature
lib/                    # Utilities, services, types, middleware
prisma/                 # Minimal schema for Next.js
docs/                   # BMAD docs (PRD, architecture, epics, stories)
tests/e2e/              # Playwright E2E tests
```

---

## Architecture Patterns

### Backend Strategy
- **Vercel:** Next.js API routes (`app/api/`)
- **Docker:** Express API (`backend/src/`)
- **Dual Prisma:** `prisma/` (minimal) + `backend/prisma/` (full)

### Database Conventions
- **PKs:** UUID with `gen_random_uuid()`
- **Soft Deletes:** `deletedAt` timestamp
- **Naming:** `snake_case` DB → `camelCase` TS via `@map()`

### API Response Format
```typescript
{ success: boolean, data?: any, error?: string }
```

### Component Architecture
- **UI:** Radix + shadcn/ui conventions
- **Forms:** React Hook Form + Zod validation
- **Paths:** `@/*` → project root

---

## API Routes

| Route | Methods |
|-------|---------|
| `/api/auth/login` | POST |
| `/api/auth/register` | POST |
| `/api/auth/forgot-password` | POST |
| `/api/exercises` | GET, POST |
| `/api/exercises/[id]` | GET, PUT, DELETE |
| `/api/exercises/search` | GET |
| `/api/exercises/filters` | GET |
| `/api/exercises/favorites` | GET, POST, DELETE |
| `/api/exercises/collections` | GET, POST |
| `/api/exercises/collections/[id]` | GET, PUT, DELETE |
| `/api/programs` | GET, POST |
| `/api/programs/[id]` | GET, PUT, DELETE |
| `/api/programs/[id]/assign` | POST |
| `/api/programs/[id]/duplicate` | POST |
| `/api/programs/templates` | GET |
| `/api/workouts` | GET, POST |
| `/api/workouts/[id]` | GET, PUT, DELETE |
| `/api/workouts/[id]/complete` | POST |
| `/api/workouts/[id]/sets` | POST |
| `/api/workouts/active` | GET |
| `/api/workouts/history` | GET |
| `/api/workouts/progress` | GET |
| `/api/activities` | GET |
| `/api/dashboard/stats` | GET |
| `/api/profiles/me` | GET, PUT |
| `/api/profiles/health` | GET, PUT |
| `/api/analytics/performance` | GET, POST |
| `/api/analytics/performance/me` | GET |
| `/api/analytics/performance/me/personal-bests` | GET |
| `/api/analytics/training-load/me` | GET |
| `/api/analytics/training-load/calculate` | POST |
| `/api/analytics/goals` | GET, POST |
| `/api/analytics/goals/[id]` | GET, PUT, DELETE |
| `/api/analytics/goals/[id]/progress` | GET, POST |
| `/api/analytics/measurements` | GET, POST |
| `/api/analytics/measurements/me` | GET |
| `/api/analytics/milestones/me` | GET |
| `/api/health` | GET |

---

## Epic Progress

| Epic | Feature | Status |
|------|---------|--------|
| 001 | User Profiles | ~90% (profile pages + API done, avatar upload pending) |
| 002 | Authentication | 100% |
| 003 | Client Management | ~95% |
| 004 | Exercise Library | ~90% (GIF hosting remaining) |
| 005 | Program Builder | ~95% (frontend fully wired) |
| 006 | Workout Tracking | ~90% (overview page + builder working) |
| 007 | Progress Analytics | ~80% (API done, frontend empty) |
| 008-012 | Messaging, Scheduling, Payments, Mobile, Admin | 0% |

---

## Known Issues

| Issue | Workaround |
|-------|-----------|
| PostgreSQL connection failures | Verify `DATABASE_URL` in `.env` |
| TypeScript build errors | `ignoreBuildErrors: true` (temporary) |
| ESLint warnings | Ignored during builds (needs cleanup) |
| Exercise GIF database (1.3GB) | Excluded from git via `.gitignore` |
| logo.png missing | Add logo to `public/` directory |
| Duplicate footer on sidebar pages | Footer renders in both layout and page |
| `/workouts/history` no auth guard | Does not redirect unauthenticated users |
| `/analytics` page empty | API exists but frontend not wired |
| Homepage default template | Root `/` still shows Next.js boilerplate |
| Nested `<select>` warning | On `/programs/new` builder page |

---

## Docker Services (Dev)

| Service | Port | Access |
|---------|------|--------|
| PostgreSQL | 5432 | `localhost:5432` |
| Redis | 6380 | `localhost:6380` |
| Backend API | 5000 | `http://localhost:5000` |
| Frontend | 3001 | `http://localhost:3001` |
| Mailhog | 8025 | `http://localhost:8025` |
| pgAdmin | 5050 | `http://localhost:5050` |

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/evofittrainer

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Redis Cache
REDIS_URL=redis://localhost:6380

# Deployment
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## Testing

### Current Status
| Metric | Value |
|--------|-------|
| **Line Coverage** | 85.57% |
| **Tests** | 3,179 |
| **Suites** | 195 (all passing) |
| **Failures** | 0 |

### Targets
| Metric | Target |
|--------|--------|
| **Unit Test Coverage** | 85%+ (achieved) |
| **E2E Scenarios** | 50+ critical paths |
| **Lighthouse Score** | 90+ |
| **Bundle Size (initial)** | <200KB gzipped |
| **FCP** | <1.5s |
| **LCP** | <2.5s |
| **CLS** | <0.1 |

### Test Architecture
- **Jest config**: `jest.config.js` (ignores `.worktrees/`, `.auto-claude/`, `backend/`, `tests/e2e/`)
- **Prisma mock**: `__mocks__/@prisma/client.ts` + `lib/db/__mocks__/prisma.ts`
- **Auth mock**: `jest.mock('@/lib/middleware/auth')` returns test user
- **Component tests**: Use `/** @jest-environment jsdom */` pragma
- **API route tests**: Import handlers directly, mock prisma + auth
- **Test helpers**: `tests/helpers/test-utils.ts`

---

## Design System

**Colors:**
- Primary: `bg-blue-600`
- Success: `bg-green-600`
- Error: `bg-red-600`
- Warning: `bg-yellow-600`

**Typography:**
- Headings: `font-bold text-xl`
- Body: `text-base`
- Small: `text-sm`

**Container:**
- `max-w-7xl mx-auto px-4`

---

## Browser Verification Results (Feb 7, 2026)

| Flow | Status | Notes |
|------|--------|-------|
| Login (`/auth/login`) | WORKS | Form, social login, test accounts |
| Register (`/auth/register`) | WORKS | Role selection, validation |
| Dashboard (`/dashboard`) | WORKS | Auth guard redirects to login |
| Exercise Library | WORKS | Search, filters, grid/list toggle |
| Programs (`/programs`) | WORKS | List, filters, create button |
| Program Builder (`/programs/new`) | WORKS | 4-step wizard |
| Workout Builder (`/workouts`) | WORKS | Sections, exercise search, save |
| Clients (`/clients`) | WORKS | List, add client button |
| Profile (`/profile`) | WORKS | View profile info |
| Workout History | PARTIAL | No auth redirect when unauthenticated |
| Analytics (`/analytics`) | PARTIAL | Page empty, API exists but UI not wired |

Full report: `docs/plans/2026-02-07-browser-verification-report.md`

---

## Parallel Agent Development (Proven Pattern)

### Quick Reference
```
# Coverage push (Ralph Loop)
Target: npx jest --coverage | grep "All files" → lines >= 85%
Fix failures first → target 0% dirs → target <50% → target <70% → iterate

# Parallel bug fix + test + verify
Phase 0: Commit dirty files, create worktrees, fix jest config
Phase 1: TeamCreate → TaskCreate → spawn agents (sonnet, bypassPermissions)
Phase 2: Monitor every 5min, nudge at 10min, take over at 20min
Phase 3: Merge streams, clean worktrees, TeamDelete
```

### Worktree Setup
```bash
git worktree add .worktrees/<name> -b <branch> HEAD
# CRITICAL: Add .worktrees/ to jest.config.js testPathIgnorePatterns + modulePathIgnorePatterns
```

### Agent Spawn Config
```
subagent_type: general-purpose
mode: bypassPermissions
model: sonnet (cost-effective for most tasks)
run_in_background: true
```

---

## Documentation Map

| Document | Path |
|----------|------|
| **PRD** | `docs/prd.md` |
| **Architecture** | `docs/architecture.md` |
| **Business Logic** | `docs/businesslogic.md` |
| **Epics** | `docs/epics/*.md` (12 files) |
| **Stories** | `docs/stories/*.md` (108 files) |
| **Browser Report** | `docs/plans/2026-02-07-browser-verification-report.md` |
| **Execution Plans** | `docs/plans/2026-02-07-parallel-abc-execution.md` |
| **Testing Protocol** | `docs/plans/2026-02-06-comprehensive-testing-protocol.md` |

---

*Project workflows (BMAD, Superpowers, Auto-Claude, Ralph Loop) defined in global config: `~/.claude/CLAUDE.md`*
