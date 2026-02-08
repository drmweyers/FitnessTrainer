# EvoFit Trainer — Launch Day Execution Plan (REVISED)
**Date:** February 8, 2026
**Goal:** Complete all remaining work for MVP launch TODAY
**Strategy:** 3 parallel tranches with non-conflicting file ownership

---

## Critical Findings from Review

### Architecture Discovery: DOUBLE LAYOUT NESTING
- `app/layout.tsx` wraps ALL pages in `AppLayout` (sidebar + nav + footer)
- BUT 14 pages ALSO import `Layout` component (ANOTHER sidebar + footer)
- **Result: Double sidebar + double footer on most pages**
- Pages affected: `/workouts`, `/exercises`, `/programs`, `/clients`, `/` (homepage), `/workout-tracker`, `/workouts/builder`, all `/dashboard/exercises/*`, all `/clients/*`
- Pages NOT affected: `/analytics`, `/auth/*`, `/profile/*`, `/workouts/history`

### Analytics Page: NOT Empty!
- `app/analytics/page.tsx` is 530 lines with full body measurement tracking
- It has 4 tabs: Overview, Charts & Trends, History, Photos
- It ALREADY has auth guard (lines 46-48)
- It gets AppLayout from root layout automatically — sidebar/nav is present
- **What's missing**: Performance metrics, Training Load, and Goals tabs
- **API client already exists**: `lib/api/analytics.ts` has `getPerformanceMetrics()`, `getTrainingLoad()`, `getGoalProgress()`, `getPersonalBests()`, `getMilestoneAchievements()` — all pre-built

### logo.png: EXISTS
- `public/logo.png` is present — previous 404 was likely a caching issue

### API Response Format (all consistent)
- All analytics APIs return: `{ success: boolean, data: T[] }`
- Performance: `prisma.performanceMetric.findMany()` with exercise include
- Training Load: `prisma.trainingLoad.findMany()` ordered by weekStartDate
- Goals: `prisma.userGoal.findMany()` with goalProgress include

### Build Config
- `ignoreBuildErrors: false` for TypeScript (must build clean)
- `ignoreDuringBuilds: true` for ESLint (warnings OK)
- `output: 'standalone'` (Vercel-ready)
- Security headers configured

---

## Revised Task List

### ACTUAL ISSUES (Priority Order)

| # | Issue | Severity | Est. Time | Tranche |
|---|-------|----------|-----------|---------|
| 1 | **14 pages have double Layout nesting** (Layout inside AppLayout) | HIGH | 20 min | T1 |
| 2 | **Homepage is Next.js boilerplate** | HIGH | 25 min | T1 |
| 3 | **Analytics missing Performance/Goals/Training Load tabs** | MEDIUM | 35 min | T2 |
| 4 | **Workout history no auth guard** | MEDIUM | 5 min | T3 |
| 5 | **Nested select warning** in ProgramBuilder | LOW | 10 min | T3 |

### NOT ISSUES (Resolved/Wrong)
- ~~logo.png missing~~ → EXISTS in `public/`
- ~~Analytics frontend empty~~ → 530-line page with 4 tabs, just missing 3 additional tabs
- ~~Analytics missing AppLayout~~ → Gets it from root layout automatically
- ~~Duplicate footer only~~ → Actually a DOUBLE LAYOUT problem (much bigger)

---

## Tranche Architecture — Zero Conflict Guarantee

### File Ownership Map

```
TRANCHE 1 (Layout + Screenshots +         TRANCHE 2 (Analytics Tabs)               TRANCHE 3 (Quick Fixes +
Business Doc + Landing Page)                                                       Error Pages)
──────────────────────────────────        ──────────────────────────────────        ──────────────────────────────
OWNS:                                     OWNS:                                    OWNS:
• app/page.tsx (homepage)                 • app/analytics/page.tsx                 • app/workouts/history/page.tsx
• app/workouts/page.tsx                   • components/features/Analytics/*        • app/workouts/progress/page.tsx
• app/exercises/page.tsx                  • lib/api/analytics.ts                   • components/ui/select.tsx
• app/exercises/[type]/page.tsx           • lib/types/analytics.ts                 • app/not-found.tsx (NEW)
• app/programs/page.tsx                   • NEW: PerformanceTab.tsx                • app/error.tsx (NEW)
• app/clients/page.tsx                    • NEW: TrainingLoadTab.tsx               • app/api/auth/forgot-password/
• app/clients/[clientId]/**               • NEW: GoalsTab.tsx
• app/dashboard/exercises/**
• app/workout-tracker/page.tsx
• app/workouts/builder/page.tsx
• public/screenshots/* (NEW)
• docs/business-logic.md (NEW)

DOES NOT TOUCH:                           DOES NOT TOUCH:                          DOES NOT TOUCH:
• app/analytics/*                         • Any layout files                       • Any layout files
• components/features/Analytics/*         • Homepage or other pages                • app/analytics/*
• components/programs/*                   • components/programs/*                  • Homepage
• components/ui/*                         • public/screenshots/*                   • public/screenshots/*
```

### Execution Timeline

```
T+0:00  ─── PHASE 0: PREP (sequential, on master) ───
        • git stash any dirty files (claude.md)
        • Create 3 worktrees from HEAD
        • Add .worktrees/ to jest.config.js ignores
        • Copy fixed jest config to all worktrees

T+0:05  ─── PHASE 1: LAUNCH ALL 3 TRANCHES (parallel) ───

        TRANCHE 1: Layout Fix + Screenshots + Business Doc + Homepage (Opus, ~60 min)
        │
        ├── TASK 1.1: Remove Layout wrapper from 14 pages (FIRST — sequential)
        │   ├── These pages already get AppLayout from root layout.tsx
        │   ├── Remove `import Layout` and `<Layout>` wrapper from:
        │   │   • app/page.tsx
        │   │   • app/workouts/page.tsx
        │   │   • app/exercises/page.tsx, app/exercises/[type]/page.tsx
        │   │   • app/programs/page.tsx
        │   │   • app/clients/page.tsx, app/clients/[clientId]/*.tsx
        │   │   • app/dashboard/exercises/**/*.tsx
        │   │   • app/workout-tracker/page.tsx
        │   │   • app/workouts/builder/page.tsx
        │   ├── Keep the page CONTENT, just remove the Layout wrapper
        │   └── This fixes: double sidebar, double footer, double header
        │
        ├── TASK 1.2: Capture Product Screenshots (AFTER layout fix)
        │   ├── Start dev server: npm run dev (from worktree)
        │   ├── Login with test account (testuser or register new)
        │   ├── Capture screenshots of each feature using Playwright:
        │   │
        │   │   Screenshot 1: DASHBOARD
        │   │   • URL: /dashboard/trainer (or /dashboard/client)
        │   │   • Shows: Stats cards, quick actions, activity feed
        │   │   • Save: public/screenshots/dashboard.png
        │   │
        │   │   Screenshot 2: EXERCISE LIBRARY
        │   │   • URL: /exercises
        │   │   • Shows: Search bar, filter sidebar, exercise grid with cards
        │   │   • Save: public/screenshots/exercises.png
        │   │
        │   │   Screenshot 3: PROGRAM BUILDER
        │   │   • URL: /programs/new
        │   │   • Shows: 4-step wizard, week/workout structure
        │   │   • Save: public/screenshots/program-builder.png
        │   │
        │   │   Screenshot 4: WORKOUT TRACKING
        │   │   • URL: /workouts
        │   │   • Shows: Active workouts, workout overview, quick actions
        │   │   • Save: public/screenshots/workouts.png
        │   │
        │   │   Screenshot 5: ANALYTICS & PROGRESS
        │   │   • URL: /analytics
        │   │   • Shows: Charts, measurement tracking, progress overview
        │   │   • Save: public/screenshots/analytics.png
        │   │
        │   │   Screenshot 6: CLIENT MANAGEMENT
        │   │   • URL: /clients
        │   │   • Shows: Client list, status indicators
        │   │   • Save: public/screenshots/clients.png
        │   │
        │   └── All screenshots: 1280x720, clean state, representative data
        │
        ├── TASK 1.3: Create Business Logic & Features Document
        │   ├── File: docs/business-logic.md
        │   ├── PURPOSE: Dual-use document for Help Menu + Marketing Material
        │   ├── Structure:
        │   │
        │   │   ## EvoFit Trainer — Platform Overview
        │   │   Brief product description for marketing context
        │   │
        │   │   ## User Roles
        │   │   • Admin: Full platform management, user oversight, analytics
        │   │   • Trainer: Client management, program design, workout assignment
        │   │   • Client: Workout tracking, progress analytics, goal setting
        │   │
        │   │   ## Core Features
        │   │
        │   │   ### 1. Intelligent Dashboard
        │   │   Role-specific dashboards with real-time stats, activity feeds,
        │   │   and quick-action shortcuts. Trainers see client overview with
        │   │   workout streaks. Clients see progress summaries.
        │   │   [Screenshot: dashboard.png]
        │   │
        │   │   ### 2. Exercise Library (800+ Exercises)
        │   │   Searchable, filterable exercise database organized by muscle group,
        │   │   equipment, and difficulty. Animated GIF demonstrations. Favorites
        │   │   and custom collections for quick access.
        │   │   [Screenshot: exercises.png]
        │   │
        │   │   ### 3. Program Builder
        │   │   Visual drag-and-drop program design with weekly periodization.
        │   │   4-step wizard: Details → Weeks → Workouts → Review. Support for
        │   │   strength, hypertrophy, endurance, and custom program types.
        │   │   Templates for rapid program creation.
        │   │   [Screenshot: program-builder.png]
        │   │
        │   │   ### 4. Workout Tracking & Logging
        │   │   Real-time workout logging with set/rep/weight tracking. RPE
        │   │   integration, rest timers, and exercise substitution. Active
        │   │   workout management with completion tracking.
        │   │   [Screenshot: workouts.png]
        │   │
        │   │   ### 5. Progress Analytics
        │   │   Comprehensive body measurement tracking (weight, body fat,
        │   │   muscle mass, circumference measurements). Multi-line trend
        │   │   charts, body composition analysis, progress photo gallery.
        │   │   Performance metrics, training load monitoring, and goal tracking
        │   │   with progress visualization.
        │   │   [Screenshot: analytics.png]
        │   │
        │   │   ### 6. Client Management
        │   │   Trainer-centric client roster with status tracking, workout
        │   │   assignment, program delivery, and progress monitoring.
        │   │   Per-client workout history and program management.
        │   │   [Screenshot: clients.png]
        │   │
        │   │   ## Technical Capabilities
        │   │   • JWT authentication with role-based access control
        │   │   • Real-time data sync across devices
        │   │   • Responsive design (desktop + mobile)
        │   │   • API-first architecture for future integrations
        │   │
        │   │   ## Data & Privacy
        │   │   • All data encrypted at rest and in transit
        │   │   • User-controlled data visibility
        │   │   • Progress photos with privacy controls
        │   │
        │   └── Written in marketing-ready language, factually grounded in codebase
        │
        ├── TASK 1.4: Build Landing Page with Screenshots + Marketing Copy
        │   ├── File: app/page.tsx → complete rewrite
        │   ├── Design:
        │   │
        │   │   SECTION 1: HERO
        │   │   ├── Headline: "Your Complete Fitness Training Platform"
        │   │   ├── Subheadline: "Design programs. Track workouts. Monitor progress."
        │   │   ├── CTA: "Get Started Free" → /auth/register
        │   │   ├── Secondary CTA: "Sign In" → /auth/login
        │   │   └── If authenticated → redirect to /dashboard
        │   │
        │   │   SECTION 2: FEATURE SHOWCASE (6 features, alternating layout)
        │   │   ├── Each feature: Screenshot on one side, description on other
        │   │   ├── Feature descriptions pulled from business-logic.md
        │   │   ├── Uses Next.js Image component for optimized loading
        │   │   ├── Screenshots from public/screenshots/*.png
        │   │   └── Alternating left/right for visual variety
        │   │
        │   │   SECTION 3: ROLE-BASED VALUE PROPS
        │   │   ├── "For Trainers" — Manage clients, build programs, track progress
        │   │   ├── "For Clients" — Log workouts, see progress, achieve goals
        │   │   └── "For Admins" — Full platform oversight and analytics
        │   │
        │   │   SECTION 4: FINAL CTA
        │   │   ├── "Ready to Transform Your Training?"
        │   │   └── CTA: "Create Your Account" → /auth/register
        │   │
        │   └── Uses Tailwind CSS, matches existing design system (blue-600 primary)
        │
        ├── TASK 1.5: Write tests
        │   ├── Homepage renders hero, features, CTAs
        │   ├── Homepage shows all 6 feature sections with screenshots
        │   ├── Homepage redirects authenticated users to /dashboard
        │   ├── Business logic document exists and has all sections
        │   └── Layout pages render single sidebar/footer (no double Layout)
        │
        └── Commit to worktree branch

        TRANCHE 2: Analytics Tabs (Sonnet, ~40 min)
        ├── TASK 2.1: Add Performance tab to analytics page
        │   ├── New: components/features/Analytics/PerformanceTab.tsx
        │   ├── Uses: analyticsApi.getPerformanceMetrics()
        │   ├── Uses: analyticsApi.getPersonalBests()
        │   ├── Shows: Personal bests cards, exercise performance chart
        │   └── API returns: { success: true, data: PerformanceMetric[] }
        │
        ├── TASK 2.2: Add Training Load tab
        │   ├── New: components/features/Analytics/TrainingLoadTab.tsx
        │   ├── Uses: analyticsApi.getTrainingLoad(12)
        │   ├── Shows: Weekly volume bar chart, load trend line
        │   └── API returns: { success: true, data: TrainingLoad[] }
        │
        ├── TASK 2.3: Add Goals tab
        │   ├── New: components/features/Analytics/GoalsTab.tsx
        │   ├── Uses: analyticsApi.getGoalProgress(), goals endpoint
        │   ├── Shows: Active goals with progress bars, create new goal form
        │   ├── Goal types: weight_loss, muscle_gain, endurance, strength,
        │   │   flexibility, general_fitness, sport_specific, rehabilitation
        │   └── API returns: { success: true, data: UserGoal[] }
        │
        ├── TASK 2.4: Wire tabs into analytics page
        │   ├── Add 3 new tabs to existing tab navigation
        │   ├── Import new tab components
        │   └── Add tab content rendering
        │
        ├── TASK 2.5: Write tests
        │   ├── PerformanceTab renders with mock data
        │   ├── TrainingLoadTab renders chart
        │   ├── GoalsTab renders goals and create form
        │   └── Analytics page shows all 7 tabs
        │
        └── Commit to worktree branch

        TRANCHE 3: Quick Fixes (Sonnet, ~15 min)
        ├── TASK 3.1: Workout history auth guard
        │   ├── File: app/workouts/history/page.tsx
        │   ├── Add: useAuth import, isAuthenticated check
        │   ├── Pattern: Copy from app/analytics/page.tsx lines 46-48
        │   │   if (!authLoading && !isAuthenticated) {
        │   │     window.location.href = '/login';
        │   │     return null;
        │   │   }
        │   └── Add loading spinner while auth initializes
        │
        ├── TASK 3.2: Fix nested select warning
        │   ├── Search ProgramBuilder components for Select usage
        │   ├── Likely: shadcn Select wrapping native <select>
        │   ├── Fix: Use only shadcn Select OR native, not both
        │   └── If can't reproduce, skip (low priority)
        │
        ├── TASK 3.3: Write tests
        │   ├── Workout history redirects unauthenticated users
        │   └── ProgramBuilder renders without console warnings
        │
        └── Commit to worktree branch

T+1:00  ─── PHASE 2: MERGE (sequential, fast-forward preferred) ───
        • Merge Tranche 3 first (smallest, error pages + quick fixes)
        • Merge Tranche 2 second (analytics tabs, new components)
        • Merge Tranche 1 last (largest: layout fixes + homepage + screenshots + docs)
        • Run full test suite: npx jest --coverage

T+1:10  ─── PHASE 3: RALPH LOOP — FIX ANY TEST FAILURES ───
        /ralph-loop "Run npx jest --coverage. Fix any failing tests.
        Ensure coverage stays above 85%. Do not stop until all tests pass."
        --completion-promise complete
        --max-iterations 10

T+1:25  ─── PHASE 4: BROWSER VERIFICATION ───
        • Homepage → branded landing with 6 feature screenshots + CTAs
        • Login → dashboard redirect
        • Dashboard → single sidebar, single footer
        • Exercises → single sidebar, no double layout
        • Programs → single sidebar, program builder works
        • Workouts → single sidebar, overview page
        • Workout History → auth guard redirects
        • Workout Progress → auth guard redirects
        • Analytics → all 7 tabs render, data loads
        • Clients → single sidebar, client list
        • 404 page → shows branded not-found page
        • Error boundary → shows branded error page

T+1:40  ─── PHASE 5: FINAL COMMIT + PUSH ───
        • Commit any browser-test fixes
        • Push to origin/master
        • LAUNCH READY

---

## Deferred to Post-Launch

| Item | Reason |
|------|--------|
| Exercise GIF CDN hosting | 1.3GB, needs S3/Cloudinary setup, placeholder works |
| Epics 008-012 | Messaging, Scheduling, Payments, Mobile, Admin — Phase 2 |
| Avatar upload | Profile works without it |
| ESLint warnings cleanup | Ignored during builds, cosmetic |

---

## Ralph Loop Configuration

| Phase | Criteria | Keyword | Max Iter | Model |
|-------|----------|---------|----------|-------|
| Post-merge QA | All tests pass, coverage >= 85% | "complete" | 10 | Sonnet |
| If tranche fails tests | Fix until green | "done" | 5 | Sonnet |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Layout removal breaks page styling | MEDIUM | HIGH | Agent must keep page content intact, only remove Layout wrapper |
| Merge conflicts | LOW | MEDIUM | Strict file ownership, merge smallest first |
| Analytics API returns no data | LOW | LOW | Empty states already handled in existing page |
| Test coverage drops | LOW | MEDIUM | Ralph Loop post-merge |
| TypeScript build errors | LOW | HIGH | ignoreBuildErrors is FALSE — agent must write valid TS |

---

## Success Criteria

### Landing Page + Marketing
- [ ] Homepage shows branded EvoFit landing page with hero + CTAs
- [ ] Homepage displays 6 real product screenshots with marketing descriptions
- [ ] Homepage has role-based value props (Trainers, Clients, Admins)
- [ ] Homepage redirects authenticated users to /dashboard
- [ ] `docs/business-logic.md` exists with all 6 features documented in marketing-ready language
- [ ] `public/screenshots/` contains 6 product screenshots (dashboard, exercises, program-builder, workouts, analytics, clients)

### Layout & Navigation
- [ ] All pages have single sidebar + single footer (no double Layout)
- [ ] 14 pages stripped of legacy Layout wrapper

### Analytics
- [ ] Analytics page has 7 tabs: Overview, Charts, History, Photos, Performance, Training Load, Goals
- [ ] Performance tab shows personal bests and exercise trends
- [ ] Training Load tab shows weekly volume chart
- [ ] Goals tab shows active goals with progress bars
- [ ] API envelope mismatch fixed (analyticsApi unwraps .data)

### Security & Hardening
- [ ] `.env.production` removed from git, added to .gitignore
- [ ] Test/debug API routes deleted (`/api/auth/test`, `/api/auth/testlogin`)
- [ ] Exercise CRUD routes require authentication
- [ ] Branded 404 page (`app/not-found.tsx`)
- [ ] Error boundary page (`app/error.tsx`)
- [ ] Workout history AND progress redirect unauthenticated users
- [ ] Forgot-password endpoint disabled with honest message
- [ ] No nested select console warnings (SelectTrigger fix)

### Quality
- [ ] All 3,179+ tests passing
- [ ] Coverage >= 85%
- [ ] All browser flows verified working
- [ ] Pushed to remote
