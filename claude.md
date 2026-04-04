# EvoFit Trainer — Project Configuration

**Type:** Full-Stack Fitness SaaS for Personal Trainers
**Status:** All 13 Epics at 100% — Production Ready
**Production:** https://trainer.evofit.io
**Repo:** `drmweyers/FitnessTrainer` (branch: `master`)
**Tests:** 5,026 unit (311 suites) + 461 E2E (40 Playwright suites) = **5,487 total**
**Deploy:** Vercel (auto-deploy on push to master)

---

## BCI Claude Code Standard
This project follows BCCS v1.0.0. All tasks use: Brainstorm → Plan → TDD → Spec Review → Quality Review → Verify → Finish.
See: `~/Claude/second-brain/resources/BCI-CLAUDE-CODE-STANDARD.md`

## Hal Bridge Protocol
After every session: update `~/Claude/second-brain/dev-updates/evofit.md` and push.
Shared skills: `~/Claude/second-brain/shared-skills/`
See: `~/Claude/second-brain/dev-updates/HOW-IT-WORKS.md`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 App Router, React 18, TypeScript 5.6 |
| **UI** | Tailwind CSS 3.4, Radix UI, shadcn/ui, Framer Motion |
| **State** | TanStack Query (server), Jotai (client) |
| **Backend** | Next.js API routes (93 endpoints) |
| **Database** | PostgreSQL 16 (Neon serverless), Prisma 5.22 |
| **Cache** | Upstash Redis |
| **Auth** | JWT (15min/7d), WebAuthn passkeys, bcryptjs |
| **Payments** | Stripe Checkout (4 tiers) |
| **PWA** | Web Push API, Service Worker, IndexedDB |
| **Testing** | Jest (unit), Playwright (E2E), RTL |
| **Deploy** | Vercel (auto-deploy on push to master) |

---

## Pricing Tiers (Stripe)

| Tier | Price | Model | Stripe Price ID |
|------|-------|-------|-----------------|
| Starter | $199 | One-time | price_1TEwpaGo4HHYDfDVyvecwfMc |
| Professional | $299 | One-time | price_1TEwpcGo4HHYDfDVqNAFCnDt |
| Enterprise | $399 | One-time | price_1TEwpeGo4HHYDfDVe7M1XZTD |
| SaaS Add-on | $39.99/mo | Subscription | price_1TEwpdGo4HHYDfDVmtIVLSQo |

Checkout: `POST /api/create-checkout-session` (lazy-init Stripe to prevent build crash)

---

## Quick Commands

```bash
npm run dev              # Next.js dev (port 3000)
npm run build            # Production build
npm test                 # Jest unit tests (5,026)
npm run test:coverage    # Jest with coverage
npm run lint             # ESLint
```

### E2E Testing (FORGE QA System)
```bash
# Against localhost
npx playwright test tests/e2e/workflows/

# Against production
E2E_BASE_URL=https://trainer.evofit.io npx playwright test tests/e2e/workflows/

# Capture marketing screenshots
npx tsx scripts/capture-screenshots.ts
```

### Backend (from backend/ directory)
```bash
npm run dev              # Express API (port 5000)
npm run db:seed          # Seed database
npm run docker:up        # Start Docker services
```

---

## Project Structure

```
app/
  (auth)/               # Login, register pages
  (dashboard)/          # Protected dashboard routes
  api/                  # Next.js API routes (93 endpoints)
  admin/                # Admin panel
  analytics/            # Analytics dashboards
  clients/              # Client management
  pricing/              # Pricing page (Brunson funnel)
  checkout/             # Success + cancel pages
  blog/                 # Blog posts
components/             # React components by feature
lib/                    # Utilities, services, types, middleware
hooks/                  # Custom React hooks (audio, haptics, media session, etc.)
tests/e2e/              # Playwright E2E (40 suites, 461 tests)
  workflows/            # All E2E test files (01-40)
  helpers/              # Auth, constants, assertions
  global-setup.ts       # Seeds complete simulation data
__tests__/              # Jest unit tests (5,026)
docs/                   # BMAD docs, marketing assets, plans
scripts/                # Seed scripts, screenshot capture
prisma/                 # Prisma schema (50+ models)
```

---

## Epic Progress (All 100%)

| Epic | Feature | Status |
|------|---------|--------|
| 001 | User Profiles | **100%** (gender, PAR-Q, cert alerts) |
| 002 | Authentication | **100%** (JWT, WebAuthn, password reset) |
| 003 | Client Management | **100%** (bulk ops, profile editor, invites) |
| 004 | Exercise Library | **100%** (1,344 exercises, collections, favorites, CSV export) |
| 005 | Program Builder | **100%** (progression chart, deload config, calculator) |
| 006 | Workout Tracking | **100%** (substitution, modification templates, offline UI) |
| 007 | Progress Analytics | **100%** (ACWR, goals, milestones, reports) |
| 008 | WhatsApp/Messaging | **100%** |
| 009 | Scheduling & Calendar | **100%** (iCal, group classes, recurring sessions) |
| 010 | Payments/Stripe | **Active** (4-tier pricing, Stripe Checkout) |
| 011 | Mobile/PWA | **100%** (push notifications, biometric, audio, haptics) |
| 012 | Admin Dashboard | **100%** (user mgmt, feature flags, tickets, reports) |
| 013 | Marketing & Docs | **100%** (landing page, blog, funnel, screenshots) |

---

## Funnel Pages

| Page | URL | Purpose |
|------|-----|---------|
| Landing | `/` | Hero + features + pricing cards + CTA |
| Pricing | `/pricing` | Brunson funnel — stack slide, comparison, FAQ, guarantee |
| Checkout Success | `/checkout/success` | SaaS upsell + onboarding quick start |
| Checkout Cancel | `/checkout/cancel` | Recovery page |
| Blog | `/blog` | SEO content |

---

## FORGE QA System (40 Playwright Suites)

| Category | Suites | Tests |
|----------|--------|-------|
| Auth & Sessions | 1-4 | 38 |
| Profile & Onboarding | 5-6 | 27 |
| Client Management | 7-10 | 42 |
| Exercise Library | 11-13 | 39 |
| Program Builder | 14-16 | 35 |
| Workout Execution | 17-20 | 47 |
| Analytics & Measurements | 21-24 | 45 |
| Scheduling & Calendar | 25-27 | 31 |
| Admin & Support | 28-31 | 40 |
| PWA & Responsive | 32-35 | 40 |
| E2E Journeys | 36-38 | 37 |
| Error & Edge Cases | 39-40 | 35 |

### QA Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Trainer | qa-trainer@evofit.io | QaTest2026! |
| Client | qa-client@evofit.io | QaTest2026! |
| Client 2 | qa-client2@evofit.io | QaTest2026! |
| Admin | qa-admin@evofit.io | QaTest2026! |

Global setup (`tests/e2e/global-setup.ts`) seeds complete simulation: 4 accounts, 2 clients on roster, program + assignment, certification, appointment, measurement, goal, favorites.

---

## Environment Variables (Vercel — 16 total)

| Variable | Status |
|----------|--------|
| `DATABASE_URL` | SET |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | SET |
| `JWT_ACCESS_EXPIRE` / `JWT_REFRESH_EXPIRE` | SET |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | SET |
| `CORS_ORIGIN` | SET |
| `MAILGUN_API_KEY` / `MAILGUN_DOMAIN` / `EMAIL_FROM` | SET |
| `NEXT_PUBLIC_APP_URL` | SET |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | SET |
| `STRIPE_SECRET_KEY` | **NOT SET** (needs Stripe dashboard) |

---

## Architecture Patterns

- **API Response:** `{ success: boolean, data?: any, error?: string }`
- **DB Conventions:** UUID PKs, soft deletes (`deletedAt`), snake_case DB → camelCase TS via `@map()`
- **Components:** Radix + shadcn/ui, React Hook Form + Zod, `@/*` path alias
- **Stripe lazy-init:** `getStripe()` function prevents build-time crash without env var
- **Push notifications:** Web Push API + Upstash Redis (key: `evofit:push-sub:{userId}`)
- **Offline:** IndexedDB + SyncManager with exponential backoff + conflict resolution

---

## Local Skills (9)

| Skill | Path | Purpose |
|-------|------|---------|
| evofit-demo-simulator | `.claude/skills/evofit-demo-simulator/` | Seed demo data + E2E validation |
| evofit-help-generator | `.claude/skills/evofit-help-generator/` | Generate help files from businesslogic.md |
| evofit-landing-page | `.claude/skills/evofit-landing-page/` | Update landing page marketing copy |
| evofit-marketing-analysis | `.claude/skills/evofit-marketing-analysis/` | Deep-dive codebase → marketing doc |
| evofit-screenshot-capture | `.claude/skills/evofit-screenshot-capture/` | Playwright screenshot capture |
| parallel-workflow | `.claude/skills/parallel-workflow/` | Multi-agent parallel development |
| ralph-loop-tdd | `.claude/skills/ralph-loop-tdd/` | TDD with Ralph retry loop |
| test-credentials-helper | `.claude/skills/test-credentials-helper/` | Get valid auth credentials |
| database-setup | `.claude/skills/database-setup/` | Database initialization |

---

## Documentation Map

| Document | Path |
|----------|------|
| Tier Feature Matrix | `docs/marketing/tier-feature-matrix.md` (838 lines) |
| 40 Screenshots | `docs/marketing/screenshots/*.png` |
| Business Logic | `docs/businesslogic.md` |
| PRD | `docs/prd.md` |
| Architecture | `docs/architecture.md` |
| Epics | `docs/epics/*.md` (12 files) |
| Stories | `docs/stories/*.md` (108 files) |
| QA Design | `docs/plans/2026-03-26-qa-system-design.md` |

---

## Known Issues

1. **STRIPE_SECRET_KEY not set** — checkout redirects won't work until added
2. **Neon free-tier cold start** — DB auto-suspends, first E2E run fails. Re-run passes.
3. **3 page errors for QA user** — /analytics, /profile, /programs show errors (missing data relationships). Works for demo users.

---

## Important Rules

1. **Always run tests before pushing** — `npm test` (5,026) + E2E if touching UI
2. **Default branch is `master`** (not `main`)
3. **After every session: Update Hal** — edit `~/Claude/second-brain/dev-updates/evofit.md` and push
4. **Shared skills** → `~/Claude/second-brain/shared-skills/`
5. **Prisma schema changes** → run `npx prisma generate` before build
6. **New Prisma models** → use `@db.Uuid` for FKs referencing User.id
