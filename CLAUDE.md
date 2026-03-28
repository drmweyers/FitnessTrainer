# CLAUDE.md — EvoFit Trainer

## ⚡ SUPERPOWERS — MANDATORY FOR ALL DEV WORK
**Load and follow the Superpowers workflow before writing any code.**
Skill: `~/.openclaw/workspace/skills/superpowers/SKILL.md`
Flow: brainstorm → plan → TDD build → code review → finish. No exceptions.

## 🧪 PHASE 5: VERIFY — POST-DEPLOY SIMULATION (MANDATORY)
After every production deploy, run the FORGE User Simulation via **Bolt** (QA agent):
```bash
cd ~/.openclaw/workspace/FitnessTrainer
npx tsx scripts/seed-demo-data.ts && npx playwright test tests/e2e/flows/ --reporter=list
```
Skill: `~/.openclaw/workspace/skills/evofit-user-simulation/SKILL.md`
Agent: `.claude/agents/evofit-simulator.md`
Training: `~/.openclaw/workspace/skills/evofit-user-simulation/docs/agent-training.md`

---

## Overview

**EvoFit Trainer** — AI-powered fitness & nutrition platform for personal trainers.
Part of **BCI Innovation Labs** 4-brand architecture.

| Field | Value |
|-------|-------|
| **Production URL** | https://evofitmeals.com |
| **Vercel URL** | https://evofittrainer-six.vercel.app |
| **DO App Name** | `evofit-prod` (Toronto region) |
| **DO Registry** | `registry.digitalocean.com/bci/evofit:prod` |
| **Repo** | `drmweyers/FitnessTrainer` |
| **Default Branch** | `master` |
| **Brand Email** | evofit@bcinnovationlabs.com |

### Brand Context
- **Tagline:** "Built for You. Powered by AI."
- EvoFit = AI-powered nutrition and fitness meal planning
- Target: personal trainers managing clients, programs, and progress

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript 5.6 |
| **UI** | Tailwind CSS 3.4, Radix UI, shadcn/ui, Framer Motion |
| **State** | TanStack Query (server), Jotai (client) |
| **Backend** | Next.js API routes (primary) + Express 4.x (standalone) |
| **Database** | PostgreSQL 16, Prisma 5.22 (dual schemas) |
| **Cache** | Redis / Upstash |
| **Auth** | JWT (15min access / 7d refresh), bcryptjs |
| **Testing** | Jest (unit/integration), Playwright (E2E), RTL |
| **Deploy** | Vercel (frontend), DigitalOcean App Platform (Docker) |
| **Payments** | Stripe |
| **AI** | OpenAI API |
| **Storage** | AWS S3 |

---

## Project Structure

```
app/
  (auth)/               # Login, register pages
  (dashboard)/          # Protected dashboard routes
  api/                  # Next.js API routes (primary backend)
  admin/                # Admin panel
  analytics/            # Analytics dashboards
  clients/              # Client management
  exercises/            # Exercise library (1300+ exercises)
  programs/             # Program builder
backend/
  src/                  # Express API (standalone option)
  prisma/               # Full schema + migrations + seed
components/             # React components by feature domain
  ui/                   # shadcn/ui primitives
  shared/               # Cross-feature components
lib/                    # Utilities, services, types, middleware
prisma/                 # Minimal Prisma schema (Vercel deploy)
services/               # Business logic services
hooks/                  # Custom React hooks
contexts/               # React context providers
tests/                  # Playwright E2E + integration tests
__tests__/              # Jest unit tests
scripts/                # Utility scripts (cleanup, seed, etc.)
docs/                   # BMAD documentation
```

### Dual Backend Architecture
- **Vercel mode:** Next.js API routes in `app/api/` — used in production
- **Docker mode:** Express API in `backend/` — used for local dev with Docker Compose
- **Dual Prisma schemas:** `prisma/` (minimal, Vercel) + `backend/prisma/` (full, Docker)

---

## Quick Commands

### Development
```bash
npm run dev              # Next.js dev server (port 3000)
npm run build            # Production build
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run type-check       # TypeScript type checking
npm run clean            # Remove .next cache
```

### Backend (from backend/ directory)
```bash
npm run dev              # Express API (port 5000)
npm run db:migrate       # Run Prisma migrations
npm run db:seed          # Seed database
npm run docker:up        # Start Docker services
```

### Testing
```bash
npm test                 # Jest unit tests
npm run test:watch       # Jest in watch mode
npm run test:coverage    # Jest with coverage report
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:prod    # E2E against production
npm run test:e2e:ui      # Playwright interactive UI
npm run test:e2e:debug   # Playwright debug mode
```

### Docker (local dev)
```bash
docker compose --profile dev up -d    # Start all services
docker compose down                    # Stop all services
```

### Scripts
```bash
npm run seed:exercises                 # Seed exercise library
npm run seed:analytics                 # Seed analytics data
npm run cleanup:production             # Clean production data
npm run cleanup:production:dry-run     # Preview cleanup
```

---

## Deployment

### Vercel (Frontend + API Routes)
- Auto-deploys on push to `master`
- Build: `npx prisma@5.22.0 generate && npm run build`
- Config: `vercel.json`

### DigitalOcean (Docker — Full Stack)
- App spec: `app.yaml`
- Region: Toronto (`tor`)
- Container registry: `registry.digitalocean.com/bci/evofit:prod`
- Auto-deploy enabled on registry push
- Managed PostgreSQL 14 + environment secrets

```bash
# Manual deploy to DO
doctl registry login
docker build --target prod -t evofit:prod .
docker tag evofit:prod registry.digitalocean.com/bci/evofit:prod
docker push registry.digitalocean.com/bci/evofit:prod
```

⚠️ **Push to `master` auto-deploys to Vercel. Docker push auto-deploys to DO.**

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` / `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Auth tokens |
| `OPENAI_API_KEY` | AI features |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` | S3 storage |
| `S3_BUCKET_NAME` | File uploads bucket |
| `STRIPE_PUBLIC_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Payments |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth login |
| `REDIS_URL` | Cache (Upstash in prod) |
| `NODE_ENV` | `development` / `production` |

---

## Architecture Patterns

- **DB Conventions:** UUID PKs, soft deletes (`deletedAt`), snake_case DB → camelCase TS via Prisma `@map()`
- **API Response:** `{ success: boolean, data?: any, error?: string }`
- **Components:** Radix + shadcn/ui primitives, React Hook Form + Zod validation
- **Path Alias:** `@/*` maps to project root
- **API Routes:** `app/api/` — 30s max duration on Vercel
- **Health Check:** `GET /api/health`

---

## Image Generation

Use **Nano Banana Pro** for any EvoFit marketing or feature images:
```bash
uv run ~/.openclaw/workspace/skills/nano-banana-pro/scripts/generate_image.py \
  --prompt "EvoFit fitness meal planning dashboard, modern UI" \
  --filename "evofit-hero.png" --resolution 2K
```

---

## Epic Progress

| Epic | Feature | Status |
|------|---------|--------|
| 001 | User Profiles | ~95% |
| 002 | Authentication | ✅ 100% |
| 003 | Client Management | ✅ Complete |
| 004 | Exercise Library | In Progress |
| — | Analytics Dashboard | Implemented |
| — | Landing Page | Live with screenshots |

---

## Important Notes

1. **Always run tests before pushing** — 3,276+ tests across 203+ suites
2. **Dual Prisma schemas** — changes may need updating in both `prisma/` and `backend/prisma/`
3. **BMAD methodology** — extensive docs in `docs/` and `.bmad-core/`
4. **Default branch is `master`** (not `main`)
5. **Read existing `claude.md`** (lowercase) for additional architecture details
