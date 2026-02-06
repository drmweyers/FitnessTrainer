# EvoFit Trainer - Project Configuration
**Type:** Full-Stack Fitness SaaS (Everfit.io clone)
**Status:** MVP ~40% (Backend 60%, Frontend 30%)
**Branch:** `master` on `drmweyers/FitnessTrainer`

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
| `/api/exercises` | GET, POST |
| `/api/exercises/search` | GET |
| `/api/programs` | GET, POST |
| `/api/programs/assign` | POST |
| `/api/workouts` | GET, POST |
| `/api/workouts/active` | GET |
| `/api/workouts/history` | GET |
| `/api/workouts/complete` | POST |
| `/api/health` | GET |

---

## Epic Progress

| Epic | Feature | Status |
|------|---------|--------|
| 001 | User Profiles | 70-80% |
| 002 | Authentication | 100% |
| 003 | Client Management | 100% |
| 004 | Exercise Library | 40-60% |
| 005 | Program Builder | Backend 100%, Frontend 25% |
| 006 | Workout Tracking | 40-60% |
| 007 | Progress Analytics | 30-50% |
| 008-012 | Messaging, Scheduling, Payments, Mobile, Admin | 0% |

---

## Known Issues

| Issue | Workaround |
|-------|-----------|
| PostgreSQL connection failures | Verify `DATABASE_URL` in `.env` |
| TypeScript build errors | `ignoreBuildErrors: true` (temporary) |
| ESLint warnings | Ignored during builds (needs cleanup) |
| Exercise GIF database (1.3GB) | Excluded from git via `.gitignore` |

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

## Documentation Map

| Document | Path |
|----------|------|
| **PRD** | `docs/prd.md` |
| **Architecture** | `docs/architecture.md` |
| **Business Logic** | `docs/businesslogic.md` |
| **Epics** | `docs/epics/*.md` (12 files) |
| **Stories** | `docs/stories/*.md` (108 files) |

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

## Testing Targets

| Metric | Target |
|--------|--------|
| **Unit Test Coverage** | 80%+ |
| **E2E Scenarios** | 50+ critical paths |
| **Lighthouse Score** | 90+ |
| **Bundle Size (initial)** | <200KB gzipped |
| **FCP** | <1.5s |
| **LCP** | <2.5s |
| **CLS** | <0.1 |

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

*Project workflows (BMAD, Superpowers, Auto-Claude, Ralph Loop) defined in global config: `~/.claude/CLAUDE.md`*
