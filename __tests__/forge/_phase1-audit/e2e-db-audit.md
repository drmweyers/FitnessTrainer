# FORGE QA Phase 1 — E2E/DB Audit

## Suite Inventory
**Total: 96 FORGE specs + 7 legacy = 103 E2E files, ~1,038 tests, 0 skips**

| Phase/Stream | Files | Tests | Focus |
|---|---|---|---|
| Phase 1 Resilience | 5 | 39 | Retries, race conditions, notifications |
| Phase 2-A Profile/Auth | 13 | 80 | Register, verify, login, 2FA, social, sessions |
| Phase 2-B Clients/Exercises | 12 | 40 | Invitations, browse/search/favorite |
| Phase 2-C Programs/Workouts | 16 | 188 | Create, supersets, assignments, offline |
| Phase 2-D Analytics/Messaging | 16 | 280 | Measurements, charts, training load, WhatsApp |
| Phase 2-E Schedule/Pay/PWA | 27 | 314 | Appointments, checkout, push, biometric, admin |
| Phase 2-F 14-Day Simulation | 7 | 97 | Actor-based workflows |

## Auth Mechanics
- `tests/e2e/helpers/auth.ts` — `loginViaAPI()` primary, `loginViaUI()` fallback
- JWT in localStorage: `accessToken` + `refreshToken` (15m / 7d)
- 5 retries exponential backoff 2s→8s for Neon cold-start
- 4 QA accounts (trainer/client/client2/admin @evofit.io) pwd `QaTest2026!`

## Global Setup — EXCEEDS 10-step template
Registers accounts → relationships → exercises → program assignments → certs → appts → goals → favorites → profile fields → health. 12 steps done. No gaps.

## Config
- Base: `http://localhost:3000` (or `E2E_BASE_URL`)
- Prod: `https://evofittrainer-six.vercel.app`
- 6 workers local / 2 prod / 15-retry Neon loop
- **Only Chromium project** — Firefox/Mobile NOT configured (extension opportunity)
- Reporters: HTML + JUnit + JSON

## Coverage Gaps (model-level, not workflow)
43 of 52 Prisma models lack isolated unit tests (covered indirectly via workflows):
Auth: EmailVerification, PasswordReset, TwoFactorAuth, UserSession, OAuthAccount, SecurityAuditLog, AccountLockout, ApiToken
Profile: UserProfile, UserMeasurement, UserHealth, UserGoal, TrainerCertification, ProfileCompletion
Client: TrainerClient, ClientInvitation, ClientNote, ClientTag
Exercise/Program/Workout/Analytics: many (see below)

## Last Failure (2026-04-01)
**ECONNRESET on POST /api/clients during global-setup Step 2**
Root cause: dev server down → localhost:3000 unreachable
**STATUS: FIXED** — dev server now running at http://localhost:3000 (verified 200 OK)

## Skipped Tests
**ZERO** — no `.skip()`, `.todo()`, or `test.skip()` anywhere.

## What's Missing vs. FORGE Spec
- Mobile viewport project (not configured in playwright.config.ts)
- Firefox + WebKit cross-browser runs
- The 15 brainstormed edge workflows from Workflow Agent (archive+reassign, offline sync, bulk-assign, JWT refresh mid-workflow, permission leak URL tampering, etc.)
- Model-isolated integration tests for the 43 gaps above
