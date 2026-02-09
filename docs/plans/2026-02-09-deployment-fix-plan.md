# EvoFitTrainer Production Deployment Fix Plan
**Date:** 2026-02-09
**Status:** Active
**Priority:** P0 - Production is broken

## Root Cause Analysis

### Problem 1: `.vercelignore` excludes critical files
The `.vercelignore` file excludes `public/` directory and all image formats (`*.png`, `*.jpg`, etc.), preventing static assets (logo, images) from being deployed. It also excludes `package-lock.json`, causing non-deterministic npm installs on Vercel.

### Problem 2: Redis cache unhealthy
The Upstash Redis credentials may be stale or the token from the Vercel env pull was malformed. The health endpoint reports `"Cache read/write failed"`.

### Problem 3: Module-level initialization crashes
`TokenService` was throwing at module load during Vercel build (fixed). But other services may have similar patterns that degrade gracefully but cause issues.

### Problem 4: No deployment validation
No automated checks verify the deployment works after build succeeds. Build passing != app working.

### Problem 5: Frontend rendering issues
Pages appear unreadable with no images in production. Likely caused by:
- Missing `public/` assets due to `.vercelignore`
- Possible CSS/Tailwind issues in production build
- `next/image` configuration may not match production domain

## Fix Plan (5 Parallel Streams)

### Stream A: Vercel Configuration Fix (Critical)
**Files:** `.vercelignore`, `vercel.json`, `next.config.js`

1. Rewrite `.vercelignore` to ONLY exclude what's truly unnecessary:
   - Keep: `public/` (CRITICAL), `package-lock.json`, all source code
   - Exclude: `exerciseDB/`, `backend/`, `__tests__/`, `docs/`, `.claude/`, test screenshots, coverage
2. Update `next.config.js`:
   - Add `evo-fitness-trainer.vercel.app` to image domains
   - Add Cloudinary domains for uploaded images
   - Verify `output: 'standalone'` is appropriate for Vercel
3. Update `vercel.json`:
   - Add proper caching headers
   - Ensure function configuration is correct
4. Write tests for vercel config validation

### Stream B: Redis & Infrastructure Fix
**Files:** `lib/db/redis.ts`, `app/api/health/route.ts`

1. Make Redis connection more resilient (graceful degradation already exists, but the health check should provide better diagnostics)
2. Update health endpoint to show which env vars are configured (without values)
3. Add env var validation utility that logs warnings instead of throwing
4. Write tests for Redis graceful degradation

### Stream C: Frontend Rendering Fix
**Files:** `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `components/layout/AppLayout.tsx`

1. Verify Tailwind CSS is building correctly for production
2. Ensure `logo.svg` is used as fallback (SVG doesn't need next/image optimization)
3. Check all Image components have proper width/height/alt attributes
4. Verify AppLayout renders correctly without auth context
5. Add loading states for images

### Stream D: Testing & Validation
**Files:** `__tests__/deployment/`, `__tests__/config/`

1. Write deployment validation tests:
   - `.vercelignore` doesn't exclude critical directories
   - `vercel.json` has valid configuration
   - `next.config.js` image domains include production
   - No module-level throws in services
2. Run full test suite
3. Verify build passes with production env simulation

### Stream E: Deployment Verification
1. Push fixes
2. Monitor Vercel deployment
3. Verify site renders correctly via browser testing
4. Document the deployment process

## Success Criteria
- [ ] `npm run build` passes with `NODE_ENV=production` and no env vars
- [ ] Vercel deployment succeeds
- [ ] Homepage renders with logo, proper styling
- [ ] Login page renders correctly
- [ ] `/api/health` returns healthy (or gracefully degraded)
- [ ] All existing tests still pass
- [ ] New deployment validation tests pass
