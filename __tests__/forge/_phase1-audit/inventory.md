# FORGE QA Phase 1 — Inventory

## Surface Area
- **130+ user-facing routes** (public/trainer/client/admin)
- **95+ API endpoints** (auth, profiles, clients, exercises, programs, workouts, analytics, schedule, admin, support, notifications, utility)
- **40 Playwright suites / 461 tests** (FORGE QA System)
- **1,344 exercises** in library, 4-tier pricing

## Routes by Role (highlights)
**Public:** /, /pricing, /login, /register, /auth/*, /blog, /exercises, /checkout/*
**Trainer:** /dashboard/trainer, /clients, /clients/[id], /programs, /programs/new, /workouts, /workouts/[id], /workouts/builder, /schedule, /analytics, /profile, /profile/health, /dashboard/exercises
**Client:** /dashboard/client, /workout-tracker, /analytics (own data)
**Admin:** /admin, /admin/users, /admin/users/[id], /admin/system

## Known Bugs / Gaps (from CLAUDE.md + audit)
1. **STRIPE_SECRET_KEY not set** → checkout redirects broken
2. **/analytics, /profile, /programs error for QA user** — missing data relationships (works for demo users)
3. **Neon cold-start** — first E2E run fails (handled by retry loop)
4. **OAuth TODO** in auth/login/page.tsx ~L165 — only email/password works
5. **No email verification on signup**
6. **WhatsApp integration stubbed** (Epic 008 claims 100% but no /api/whatsapp/* routes)
7. **Role-guard inconsistency** — some API routes may not validate role; permission-leak testing needed
8. **Mass assignment risk** on /api/clients/bulk, /api/programs/[id]/assign (duplicate-key validation not confirmed)

## Gold Paths Naive Testers Miss
### Trainer
- Deload auto-detection in program builder progression chart
- RPE→progression logic (RPE 6 → suggest +5 lbs; RPE 9 → no increase)
- ACWR injury-risk alert threshold
- Client roster tier limits (Starter 5 clients; try 6th)
- Program inheritance on assignment (supersets + deload intact)
- Exercise substitution + progression tracking same movement pattern
- Multi-client analytics switcher (no data bleed)
- Cert expiry email 25-day alert
- iCal feed token rotation breaks old link

### Client
- Offline workout logging + sync
- PR detection + confetti
- Adherence % calculation
- Workout timer persists IndexedDB across tab close
- Substitution ban enforcement per program

### Admin
- Bulk user CSV partial success (invalid rows logged)
- Feature flag disables Service Worker caching
- Role downgrade trainer→client revokes /clients access
- Activity log pagination + filters

### Security
- JWT refresh rotation no session loss
- CORS wrong-origin 403
- Client data isolation (trainer A → client B 403)
- Admin-only endpoint non-admin 403
