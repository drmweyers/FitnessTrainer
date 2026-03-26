# EvoFit Trainer - Project Configuration
**Type:** Full-Stack Fitness SaaS (Everfit.io clone)
**Status:** MVP ~90% (Backend 98%, Frontend 85%)
**Branch:** `master` on `drmweyers/FitnessTrainer`
**Test Coverage:** 85%+ lines | 3,276 tests | 203 suites | ALL PASSING
**Production:** https://evofittrainer-six.vercel.app (LIVE - Frontend + Backend)

---

## BCI Claude Code Standard
This project follows BCCS v1.0.0. All tasks use: Brainstorm → Plan → TDD → Spec Review → Quality Review → Verify → Finish.
See: `~/Claude/second-brain/resources/BCI-CLAUDE-CODE-STANDARD.md`

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
| 004 | Exercise Library | ~90% (1,344 exercises seeded) |
| 005 | Program Builder | ~95% |
| 006 | Workout Tracking | ~95% |
| 007 | Progress Analytics | ~95% |
| 008 | Messaging | 0% |
| 009 | Scheduling & Calendar | ~80% |
| 010 | Payments | 0% (post-MVP) |
| 011 | Mobile | 0% (post-MVP) |
| 012 | Admin Dashboard | ~75% |
| 013 | Marketing & Documentation | 100% (landing page, docs v2.0, skills) |

---

## Known Blockers

| Issue | Action Needed |
|-------|--------------|
| TypeScript build errors | RESOLVED (ignoreBuildErrors: false) |
| Photo uploads | Deferred post-MVP (routes return 501 "coming soon") |

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
| `CORS_ORIGIN` | Yes |
| `DATABASE_URL` | Yes |
| `MAILGUN_API_KEY` / `MAILGUN_DOMAIN` | Yes |
| `EMAIL_FROM` / `NEXT_PUBLIC_APP_URL` | Yes |

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
| Business Logic | `docs/businesslogic.md` (v2.0 - March 2026) |
| Epics | `docs/epics/*.md` (12 files) |
| Stories | `docs/stories/*.md` (108 files) |

---

## Marketing & Documentation

| Resource | Path | Purpose |
|----------|------|---------|
| Landing Page | `app/page.tsx` | Production homepage with "pay once" copy |
| Business Logic v2.0 | `docs/businesslogic.md` | Comprehensive feature documentation |
| Marketing Analysis | `docs/marketing/evofit-marketing-business-logic.md` | Deep-dive feature inventory |
| Screenshot Inventory | `docs/marketing/screenshot-inventory.md` | All app pages for screenshot capture |
| Screenshots | `docs/marketing/screenshots/` | Production app screenshots (pending capture) |

### Marketing Skills

| Skill | Purpose |
|-------|---------|
| `evofit-landing-page` | Update landing page with marketing copy |
| `evofit-help-generator` | Generate help files and FAQs from businesslogic.md |
| `evofit-screenshot-capture` | Automated screenshot capture via Playwright |

---

*Workflows (BMAD, Superpowers, Auto-Claude, Ralph Loop) defined in global config: `~/.claude/CLAUDE.md`*
