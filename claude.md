# EvoFit Trainer - Project Configuration
**Type:** Full-Stack Fitness SaaS (Everfit.io clone)
**Status:** MVP ~90% (Backend 98%, Frontend 85%)
**Branch:** `master` on `drmweyers/FitnessTrainer`
**Test Coverage:** 85%+ lines | 3,276 tests | 203 suites | ALL PASSING

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
| `/api/profiles/me/photo` | POST, DELETE |
| `/api/profiles/progress-photos` | GET, POST, DELETE |
| `/api/profiles/certifications` | GET, POST |
| `/api/profiles/certifications/[id]` | GET, PUT, DELETE |
| `/api/analytics/reports` | POST |
| `/api/auth/reset-password` | POST |
| `/api/schedule/availability` | GET, POST, PUT, DELETE |
| `/api/schedule/appointments` | GET, POST |
| `/api/schedule/appointments/[id]` | GET, PUT, DELETE |
| `/api/schedule/slots` | GET |
| `/api/admin/dashboard` | GET |
| `/api/admin/users` | GET |
| `/api/admin/users/[id]` | GET, PUT |
| `/api/admin/system/health` | GET |

---

## Epic Progress

| Epic | Feature | Status |
|------|---------|--------|
| 001 | User Profiles | ~95% (avatar upload via Cloudinary, certs, progress photos) |
| 002 | Authentication | 100% (password reset with email) |
| 003 | Client Management | ~95% |
| 004 | Exercise Library | ~90% (GIF hosting remaining) |
| 005 | Program Builder | ~95% (frontend fully wired) |
| 006 | Workout Tracking | ~95% (overview page + builder working) |
| 007 | Progress Analytics | ~95% (7 tabs + report generation) |
| 008 | Messaging | 0% |
| 009 | Scheduling & Calendar | ~80% (APIs + UI done, needs polish) |
| 010 | Payments | 0% |
| 011 | Mobile | 0% |
| 012 | Admin Dashboard | ~75% (metrics, user mgmt, system health) |

---

## Known Issues

| Issue | Workaround |
|-------|-----------|
| **No production DATABASE_URL** | Need Neon/Supabase/Railway PostgreSQL, add to Vercel env |
| TypeScript build errors | `ignoreBuildErrors: true` (temporary) |
| ESLint warnings | Ignored during builds (needs cleanup) |
| Exercise GIF database (1.3GB) | Excluded from git via `.gitignore` |
| Duplicate footer on sidebar pages | Footer renders in both layout and page |
| Cloudinary env vars needed | Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in Vercel |
| Resend env var needed | Set `RESEND_API_KEY` in Vercel for email sending |
| Scheduling needs DB migration | Run `npx prisma migrate dev` for new Appointment/TrainerAvailability tables |
| Nested `<select>` warning | On `/programs/new` builder page |
| `.env.production` file corrupted | Don't trust values - use `vercel env ls` as source of truth |

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

### Local Development
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/evofittrainer
JWT_ACCESS_SECRET=dev-access-secret
JWT_REFRESH_SECRET=dev-refresh-secret
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
REDIS_URL=redis://localhost:6380
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Vercel Production (set via CLI)
```bash
# Check current: npx vercel env ls production
# Set new:       printf 'value' | npx vercel env add NAME production
# Remove:        npx vercel env rm NAME production
```

| Variable | Set? | Notes |
|----------|------|-------|
| `JWT_ACCESS_SECRET` | Yes | |
| `JWT_REFRESH_SECRET` | Yes | |
| `JWT_ACCESS_EXPIRE` | Yes | `15m` |
| `JWT_REFRESH_EXPIRE` | Yes | `7d` |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | |
| `CORS_ORIGIN` | Yes | `https://evofittrainer.vercel.app` |
| `NODE_ENV` | Yes | `production` |
| `DATABASE_URL` | **NO** | Need production PostgreSQL |
| `CLOUDINARY_*` | No | For photo uploads |
| `RESEND_API_KEY` | No | For email sending |
| `NEXT_PUBLIC_APP_URL` | No | For password reset links |

---

## Testing

### Current Status
| Metric | Value |
|--------|-------|
| **Line Coverage** | 85%+ |
| **Tests** | 3,276 |
| **Suites** | 203 (all passing) |
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

## Vercel Deployment (Feb 9, 2026)

**Production URL:** `https://evofittrainer-six.vercel.app`
**Status:** Frontend LIVE, Backend DEGRADED (needs DATABASE_URL)

### Env Vars Configured in Vercel (production):
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRE`, `JWT_REFRESH_EXPIRE`,
`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CORS_ORIGIN`, `NODE_ENV`

### Env Vars Still Needed:
`DATABASE_URL` (critical), `CLOUDINARY_*` (photos), `RESEND_API_KEY` (email), `NEXT_PUBLIC_APP_URL`

### Logo
- Uses `public/logo.svg` (dumbbell + "EvoFit" text)
- All references use `<img src="/logo.svg">` (not next/image `<Image>`)
- `public/logo.png` was deleted (was a fake text file)

---

## Browser Verification Results (Feb 9, 2026 - Production)

| Flow | Status | Notes |
|------|--------|-------|
| Homepage (`/`) | WORKS | Full landing page, SVG logo, all sections, CTAs |
| Login (`/auth/login`) | WORKS | Form, social login, test accounts, forgot pw link |
| Register (`/auth/register`) | WORKS | Full form, role selection, ToS links |
| Forgot Password (`/auth/forgot-password`) | WORKS | Email form, back link |
| Exercises (`/exercises`) | UI WORKS | Renders, API fails (no DATABASE_URL) |
| Programs (`/programs`) | AUTH GUARD WORKS | Redirects to login correctly |
| Dashboard (`/dashboard`) | AUTH GUARD WORKS | Redirects to login correctly |
| Health (`/api/health`) | DEGRADED | Reports missing DATABASE_URL |

Previous local verification (Feb 7): `docs/plans/2026-02-07-browser-verification-report.md`

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
| **Browser Report (local)** | `docs/plans/2026-02-07-browser-verification-report.md` |
| **Launch Day Plan** | `docs/plans/2026-02-08-launch-day-plan.md` |
| **Execution Plans** | `docs/plans/2026-02-07-parallel-abc-execution.md` |
| **Testing Protocol** | `docs/plans/2026-02-06-comprehensive-testing-protocol.md` |
| **Project Memory** | `~/.claude/projects/.../memory/MEMORY.md` |

---

*Project workflows (BMAD, Superpowers, Auto-Claude, Ralph Loop) defined in global config: `~/.claude/CLAUDE.md`*
