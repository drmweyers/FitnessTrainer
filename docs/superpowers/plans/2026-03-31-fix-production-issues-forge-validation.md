# Fix Production Issues + FORGE Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix exercise GIF display, analytics error, and double header issues, then run complete FORGE simulation with trainer-client workflow.

**Architecture:** Fix root causes in components (ExerciseCard image loading, PerformanceTab error boundaries, navigation deduplication), then run multi-actor FORGE simulation to verify end-to-end workflows.

**Tech Stack:** Next.js 14, React 18, TypeScript, Chart.js, react-chartjs-2, Tailwind CSS, Prisma, PostgreSQL

---

## Root Cause Analysis

### Issue 1: Exercise GIFs Not Showing
**Location:** `app/dashboard/exercises/page.tsx:329`, `components/features/ExerciseLibrary/ExerciseCard.tsx:94-101`
**Cause:** Image path `/exerciseGifs/${gifUrl}` may fail if gifUrl is null/undefined in database, or if Image component has loading issues
**Fix:** Add null checks, fallback placeholder, and proper error handling

### Issue 2: Analytics Error "Something went wrong"
**Location:** `components/features/Analytics/PerformanceTab.tsx`
**Cause:** react-chartjs-2 may fail if data is malformed or Chart.js not properly initialized
**Fix:** Add error boundary, null checks for metrics data, loading states

### Issue 3: Double Header
**Location:** `components/layout/AppLayout.tsx`, `components/navigation/MainNavigation.tsx`
**Cause:** Possible duplicate layout rendering or MobileMenu/Desktop both showing
**Fix:** Check navigation rendering logic, ensure single header instance

---

## Phase 1: Fix Exercise Library GIF Display

### Task 1: Fix ExerciseCard Image Loading

**Files:**
- Modify: `components/features/ExerciseLibrary/ExerciseCard.tsx:94-101`
- Modify: `components/features/ExerciseLibrary/ExerciseCard.tsx:220-232`

- [ ] **Step 1: Add null/undefined check for gifUrl**

```typescript
// Replace getGifPath function (lines 94-96)
const getGifPath = () => {
  if (!exercise.gifUrl || exercise.gifUrl === 'null' || exercise.gifUrl === 'undefined') {
    return null;
  }
  return `/exerciseGifs/${exercise.gifUrl}`;
}

// Replace getStaticImagePath function (lines 98-101)
const getStaticImagePath = () => {
  const gifPath = getGifPath();
  if (!gifPath || imageError) {
    return '/images/exercise-placeholder.jpg';
  }
  return gifPath;
}
```

- [ ] **Step 2: Update Image component to handle null src**

```typescript
// In grid view Image component (around line 221), replace src prop
src={getStaticImagePath()}
// Remove the complex ternary that may cause issues
```

- [ ] **Step 3: Add explicit width/height for Next.js Image**

```typescript
// Add explicit dimensions to prevent layout shift
width={320}
height={180}
// Keep fill prop for responsive behavior but add explicit dimensions
```

- [ ] **Step 4: Test fix locally**

Navigate to exercise library and verify GIFs display.

- [ ] **Step 5: Commit**

```bash
git add components/features/ExerciseLibrary/ExerciseCard.tsx
git commit -m "fix: handle null gifUrl and add error handling for exercise images

- Add null/undefined checks for gifUrl field
- Add fallback to placeholder image
- Fix image loading errors in exercise library"
```

### Task 2: Fix Popular Exercises Section

**Files:**
- Modify: `app/dashboard/exercises/page.tsx:327-332`

- [ ] **Step 1: Add null check for gifUrl in popular exercises**

```typescript
// Line 327-332, wrap the img element with null check
<div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
  {exercise.gifUrl ? (
    <img
      src={`/exerciseGifs/${exercise.gifUrl}`}
      alt={exercise.name}
      className="w-full h-full object-cover"
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/images/exercise-placeholder.jpg';
      }}
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-gray-200">
      <span className="text-gray-400 text-sm">No preview</span>
    </div>
  )}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/exercises/page.tsx
git commit -m "fix: add null check for exercise GIFs in popular exercises section"
```

---

## Phase 2: Fix Analytics Error

### Task 3: Add Error Boundary to PerformanceTab

**Files:**
- Modify: `components/features/Analytics/PerformanceTab.tsx:42-52`
- Modify: `components/features/Analytics/PerformanceTab.tsx:76-189`

- [ ] **Step 1: Wrap data fetching in try-catch and add error state**

```typescript
// Add error state (after line 41)
const [error, setError] = useState<string | null>(null);

// Modify data fetching (lines 43-52)
const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery<PerformanceMetric[]>({
  queryKey: ['performance-metrics', clientId],
  queryFn: () => analyticsApi.getPerformanceMetrics(undefined, clientId || undefined),
  onError: (err) => {
    console.error('Failed to load performance metrics:', err);
    setError('Failed to load performance data');
  }
});
```

- [ ] **Step 2: Add error state rendering**

```typescript
// Add after line 61 (isLoading check)
if (error || metricsError) {
  return (
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load performance data</h3>
      <p className="text-gray-500 mb-4">{error || 'Please try again later'}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/features/Analytics/PerformanceTab.tsx
git commit -m "fix: add error handling to PerformanceTab

- Add error state for failed data fetching
- Display user-friendly error message
- Add retry button for recovery"
```

---

## Phase 3: Fix Double Header

### Task 4: Check Navigation Rendering

**Files:**
- Read: `components/navigation/MobileMenu.tsx`
- Modify: `components/navigation/MainNavigation.tsx:143-149`

- [ ] **Step 1: Check if MobileMenu duplicates header**

Read the MobileMenu component to see if it has its own header.

- [ ] **Step 2: If MobileMenu has header, remove duplicate**

If MobileMenu renders its own header/navbar, remove it so only MainNavigation renders the header.

- [ ] **Step 3: Commit**

```bash
git add components/navigation/
git commit -m "fix: remove duplicate header from navigation"
```

---

## Phase 4: FORGE User Simulation

### Task 5: Run FORGE Simulation - Trainer Creates Program for Client

**Files:**
- Run: `__tests__/forge/phase2/stream-b/story-003-01-trainer-assigns-program.test.ts`

- [ ] **Step 1: Start dev server**

```bash
npm run dev
# Wait for server to be ready on http://localhost:3000
```

- [ ] **Step 2: Run FORGE simulation with visual verification**

```bash
npm test -- __tests__/forge/phase2/stream-b/ --verbose
```

- [ ] **Step 3: Verify trainer can:**
- Log in as trainer.test@evofitmeals.com
- Create a new program
- Add exercises with visible GIFs
- Assign program to client

### Task 6: Run FORGE Simulation - Client Completes Workout

- [ ] **Step 1: Run client workflow simulation**

```bash
npm test -- __tests__/forge/phase2/stream-b/story-003-02-client-views-program.test.ts --verbose
```

- [ ] **Step 2: Verify client can:**
- Log in as customer.test@evofitmeals.com
- View assigned program
- See exercise GIFs animating
- Log workout completion

### Task 7: Run Analytics Verification

- [ ] **Step 1: Run analytics workflow simulation**

```bash
npm test -- __tests__/forge/phase2/stream-d/ --verbose
```

- [ ] **Step 2: Verify analytics page loads without errors**

### Task 8: Visual Verification with Playwright

**Files:**
- Run: Playwright E2E tests

- [ ] **Step 1: Run visual regression tests**

```bash
npm run test:e2e -- tests/e2e/flows/ --headed
```

- [ ] **Step 2: Manually verify:**
- Exercise library shows GIFs
- No console errors
- Analytics page loads
- Navigation shows single header

- [ ] **Step 3: Commit test data**

```bash
# If test data needs to be preserved, ensure it's committed
git add -A
git commit -m "test: FORGE simulation data for production validation

- Trainer test account created program
- Client test account assigned
- Workout logs created
- Analytics data generated"
```

---

## Phase 5: Push Fixes to Production

### Task 9: Deploy Fixes

- [ ] **Step 1: Push to master**

```bash
git push origin master
```

- [ ] **Step 2: Verify Vercel deployment**

Check Vercel dashboard for successful deployment.

- [ ] **Step 3: Verify fixes on production**

- Navigate to https://trainer.evofit.io/dashboard/exercises
- Confirm GIFs display
- Navigate to https://trainer.evofit.io/analytics
- Confirm no errors
- Check header shows only once

---

## Verification Checklist

- [ ] Exercise library displays animated GIFs on hover
- [ ] Popular exercises section shows images
- [ ] Analytics page loads without "Something went wrong" error
- [ ] Navigation header appears only once (no duplicates)
- [ ] FORGE simulation passes all tests
- [ ] Playwright E2E tests pass
- [ ] Production deployment successful

---

**Total Tasks:** 9
**Estimated Time:** 2-3 hours
**Priority:** Critical (production issues)
