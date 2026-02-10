# EvoFit Trainer - Project Configuration
**Type:** Full-Stack Fitness SaaS (Everfit.io clone)
**Status:** MVP ~90% (Backend 98%, Frontend 85%)
**Branch:** `master` on `drmweyers/FitnessTrainer`
**Test Coverage:** 85%+ lines | 3,276 tests | 203 suites | ALL PASSING
**Production:** https://evofittrainer-six.vercel.app (LIVE - Frontend + Backend)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 App Router, React 18, TypeScript 5.6 |
| **UI** | Tailwind CSS 3.4, Radix UI, shadcn/ui, Framer Motion |
| **State** | TanStack Query (server), Jotai (client) |
| **Backend** | Next.js API routes (primary), Express 4.x (standalone) |
| **Database** | PostgreSQL 16, Prisma 5.22 |
| **Cache** | Redis / Upstash |
| **Auth** | JWT (15min access / 7d refresh), bcryptjs |
| **Testing** | Jest (unit), Playwright (E2E), RTL |
| **Deploy** | Vercel (production), Docker Compose (dev) |

---

## Quick Commands

```bash
npm run dev              # Next.js dev (port 3000)
npm run build            # Production build
npm test                 # Jest unit tests
npm run test:coverage    # Jest with coverage
npm run test:e2e         # Playwright E2E
npm run lint             # ESLint
```

### Backend (from backend/ directory)
```bash
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
  prisma/               # Full schema + migrations + seed
components/             # React components by feature
lib/                    # Utilities, services, types, middleware
docs/                   # BMAD docs (PRD, architecture, epics, stories)
tests/e2e/              # Playwright E2E tests
```

---

## Architecture Patterns

- **Dual Backend:** Vercel (Next.js API routes) / Docker (Express)
- **Dual Prisma:** `prisma/` (minimal) + `backend/prisma/` (full)
- **DB Conventions:** UUID PKs, soft deletes (`deletedAt`), snake_case DB → camelCase TS via `@map()`
- **API Response:** `{ success: boolean, data?: any, error?: string }`
- **Components:** Radix + shadcn/ui, React Hook Form + Zod, `@/*` path alias

---

## Epic Progress

| Epic | Feature | Status |
|------|---------|--------|
| 001 | User Profiles | ~95% |
| 002 | Authentication | 100% |
| 003 | Client Management | ~95% |
| 004 | Exercise Library | ~90% |
| 005 | Program Builder | ~95% |
| 006 | Workout Tracking | ~95% |
| 007 | Progress Analytics | ~95% |
| 008 | Messaging | 0% |
| 009 | Scheduling & Calendar | ~80% |
| 010 | Payments | 0% |
| 011 | Mobile | 0% |
| 012 | Admin Dashboard | ~75% |

---

## Known Blockers

| Issue | Action Needed |
|-------|--------------|
| **No production DATABASE_URL** | Need Neon/Supabase/Railway PostgreSQL → add to Vercel env |
| TypeScript build errors | `ignoreBuildErrors: true` (temporary) |
| Cloudinary env vars | Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Resend env var | Set `RESEND_API_KEY` for email |
| `.env.production` corrupted | Use `vercel env ls` as source of truth |

---

## Environment Variables

### Vercel Production
```bash
npx vercel env ls production    # Check current
printf 'value' | npx vercel env add NAME production  # Set new
```

| Variable | Set? |
|----------|------|
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Yes |
| `JWT_ACCESS_EXPIRE` / `JWT_REFRESH_EXPIRE` | Yes |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Yes |
| `CORS_ORIGIN` / `NODE_ENV` | Yes |
| `DATABASE_URL` | **NO** (critical) |
| `CLOUDINARY_*` | No |
| `RESEND_API_KEY` | No |

### Local Development
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/evofittrainer
JWT_ACCESS_SECRET=dev-access-secret
JWT_REFRESH_SECRET=dev-refresh-secret
REDIS_URL=redis://localhost:6380
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## Docker Services (Dev)

| Service | Port |
|---------|------|
| PostgreSQL | 5432 |
| Redis | 6380 |
| Backend API | 5000 |
| Frontend | 3001 |
| Mailhog | 8025 |
| pgAdmin | 5050 |

---

## Testing

- **Jest config:** `jest.config.js` (ignores `.worktrees/`, `.auto-claude/`, `backend/`, `tests/e2e/`)
- **Prisma mock:** `__mocks__/@prisma/client.ts` + `lib/db/__mocks__/prisma.ts`
- **Auth mock:** `jest.mock('@/lib/middleware/auth')` returns test user
- **Component tests:** `/** @jest-environment jsdom */` pragma
- **API route tests:** Import handlers directly, mock prisma + auth

---

## Documentation Map

| Document | Path |
|----------|------|
| PRD | `docs/prd.md` |
| Architecture | `docs/architecture.md` |
| Business Logic | `docs/businesslogic.md` |
| Epics | `docs/epics/*.md` (12 files) |
| Stories | `docs/stories/*.md` (108 files) |

---

*Workflows (BMAD, Superpowers, Auto-Claude, Ralph Loop) defined in global config: `~/.claude/CLAUDE.md`*
