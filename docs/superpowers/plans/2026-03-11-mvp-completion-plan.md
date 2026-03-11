# MVP Completion Sprint - Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete 5 work items to bring EvoFitTrainer from ~90% to ~95%+ MVP completion.

**Architecture:** TDD approach across all items. Unit tests with Jest + RTL, browser verification with Playwright on localhost, production push only after 100% success. No new Prisma schema changes — all features built on existing models.

**Tech Stack:** Next.js 14, TypeScript, Jest, React Testing Library, Playwright, Prisma (existing schema only), Tailwind CSS, Radix UI/shadcn

**Spec:** `docs/superpowers/specs/2026-03-11-mvp-completion-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `lib/services/icalService.ts` | RFC 5545 iCal generation |
| `lib/services/progressionService.ts` | Progressive overload calculation engine |
| `app/api/admin/users/bulk/route.ts` | Bulk user operations API |
| `app/api/admin/activity/route.ts` | Activity log API (derived from existing tables) |
| `app/api/admin/feature-flags/route.ts` | Feature flags persistence API |
| `app/api/progression/suggestions/route.ts` | Progression suggestion API |
| `app/api/schedule/export/ics/route.ts` | ICS file download endpoint |
| `app/api/schedule/feed/[token]/route.ts` | Subscribable calendar feed |
| `components/shared/SyncStatus.tsx` | Offline sync status badge |
| `components/workouts/ProgressionSuggestion.tsx` | Post-workout suggestion card |
| `components/schedule/CalendarExport.tsx` | Calendar export UI (button + modal) |
| `public/timer-worker.js` | Background timer Web Worker |
| `hooks/useBackgroundTimer.ts` | Web Worker timer hook |
| `scripts/generate-icons.ts` | SVG to PNG icon generator |

### Modified Files
| File | Change |
|------|--------|
| `app/__tests__/page.test.tsx` | Rewrite to match current homepage content |
| `components/admin/BulkUserOperations.tsx` | Wire to real API |
| `components/admin/ActivityLog.tsx` | Replace mock data with API fetch |
| `components/admin/FeatureFlagManager.tsx` | Add API persistence |
| `lib/offline/syncManager.ts` | Add exponential backoff + conflict resolution |
| `public/manifest.json` | Add icon entries |
| `app/schedule/page.tsx` | Add calendar export button |
| `components/layout/AppLayout.tsx` | Add SyncStatus component |

### Deleted Files
| File | Reason |
|------|--------|
| `__tests__/app/page.test.tsx` | Duplicate of `app/__tests__/page.test.tsx` |

### New Test Files
| File | Tests For |
|------|-----------|
| `__tests__/lib/services/icalService.test.ts` | iCal generation, RFC 5545 compliance |
| `__tests__/lib/services/progressionService.test.ts` | Progression rules engine |
| `__tests__/api/admin/users-bulk.test.ts` | Bulk user operations |
| `__tests__/api/admin/activity.test.ts` | Activity log API |
| `__tests__/api/admin/feature-flags.test.ts` | Feature flags API |
| `__tests__/api/progression/suggestions.test.ts` | Progression API |
| `__tests__/api/schedule/export-ics.test.ts` | ICS export endpoint |
| `__tests__/api/schedule/feed.test.ts` | Calendar feed endpoint |
| `__tests__/components/admin/BulkUserOperations.test.tsx` | Bulk ops UI |
| `__tests__/components/admin/ActivityLog.test.tsx` | Activity log UI |
| `__tests__/components/admin/FeatureFlagManager.test.tsx` | Feature flags UI |
| `__tests__/components/shared/SyncStatus.test.tsx` | Sync status UI |
| `__tests__/components/workouts/ProgressionSuggestion.test.tsx` | Suggestion card UI |
| `__tests__/components/schedule/CalendarExport.test.tsx` | Calendar export UI |
| `__tests__/lib/offline/syncManager.test.ts` | Enhanced sync manager |
| `__tests__/hooks/useBackgroundTimer.test.ts` | Background timer hook |

---

## Chunk 1: Homepage Tests Fix

### Task 1: Delete duplicate test file

**Files:**
- Delete: `__tests__/app/page.test.tsx`

- [ ] **Step 1: Delete the duplicate test file**

```bash
rm __tests__/app/page.test.tsx
```

If the `__tests__/app/` directory is now empty, delete it too:
```bash
rmdir __tests__/app/ 2>/dev/null || true
```

- [ ] **Step 2: Run tests to confirm the 46 failures drop**

```bash
npx jest app/__tests__/page.test.tsx --no-coverage 2>&1 | tail -5
```

Expected: Still fails (these tests reference old content), but only ~23 failures now (one file instead of two).

- [ ] **Step 3: Commit deletion**

```bash
git add -A __tests__/app/
git commit -m "test: remove duplicate homepage test file"
```

### Task 2: Rewrite homepage tests

**Files:**
- Modify: `app/__tests__/page.test.tsx`
- Reference: `app/page.tsx` (the component being tested)

- [ ] **Step 1: Read the current homepage component**

Read `app/page.tsx` to identify all testable sections:
- Hero section: "Own Your Coaching Platform. Forever."
- Stats: 1,344 exercises, categories, etc.
- Feature sections with screenshots
- "Built for Trainers Who Refuse to Rent"
- Pricing section ($299 lifetime)
- "Stop Renting. Start Owning." CTA
- Footer

- [ ] **Step 2: Write the new test file**

Replace entire content of `app/__tests__/page.test.tsx` with tests matching current component. Key tests:

```tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'

// Mock next modules
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props
    return <img {...rest} />
  },
}))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: Record<string, unknown>) => <section {...props}>{children}</section>,
    h1: ({ children, ...props }: Record<string, unknown>) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: Record<string, unknown>) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: Record<string, unknown>) => <p {...props}>{children}</p>,
    span: ({ children, ...props }: Record<string, unknown>) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useScroll: () => ({ scrollYProgress: { current: 0 } }),
  useTransform: () => ({ current: 0 }),
  useMotionValue: () => ({ current: 0, set: jest.fn() }),
  useSpring: () => ({ current: 0 }),
}))

import HomePage from '../page'

describe('HomePage', () => {
  beforeEach(() => {
    render(<HomePage />)
  })

  describe('Hero Section', () => {
    it('renders the main heading', () => {
      expect(screen.getByText(/Own Your Coaching Platform/i)).toBeInTheDocument()
    })

    it('renders the "Forever" tagline', () => {
      expect(screen.getByText(/Forever/i)).toBeInTheDocument()
    })

    it('renders the primary CTA button', () => {
      expect(screen.getByRole('link', { name: /Get Lifetime Access/i })).toBeInTheDocument()
    })
  })

  describe('Stats Section', () => {
    it('shows exercise count', () => {
      expect(screen.getByText(/1,344/)).toBeInTheDocument()
    })
  })

  describe('Features Section', () => {
    it('renders the "Built for Trainers" heading', () => {
      expect(screen.getByText(/Built for Trainers/i)).toBeInTheDocument()
    })
  })

  describe('Pricing Section', () => {
    it('shows lifetime price', () => {
      expect(screen.getByText(/\$299/)).toBeInTheDocument()
    })
  })

  describe('Final CTA Section', () => {
    it('renders "Stop Renting" heading', () => {
      expect(screen.getByText(/Stop Renting/i)).toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    it('renders copyright', () => {
      expect(screen.getByText(/EvoFit Trainer/i)).toBeInTheDocument()
    })
  })
})
```

NOTE: The above is a skeleton. The implementing agent MUST read `app/page.tsx` first and write assertions that match the EXACT text content rendered by the component. Do NOT guess — read the source.

- [ ] **Step 3: Run tests to verify all pass**

```bash
npx jest app/__tests__/page.test.tsx --no-coverage -v 2>&1 | tail -20
```

Expected: ALL PASS, 0 failures.

- [ ] **Step 4: Run full test suite to verify no regressions**

```bash
npx jest --no-coverage 2>&1 | tail -10
```

Expected: All suites pass (previously passing suites + fixed homepage = 0 failures).

- [ ] **Step 5: Commit**

```bash
git add app/__tests__/page.test.tsx
git commit -m "test: rewrite homepage tests to match current marketing copy"
```

---

## Chunk 2: Admin Dashboard — Bulk User Operations

### Task 3: Write bulk user operations API tests

**Files:**
- Create: `__tests__/api/admin/users-bulk.test.ts`
- Reference: `app/api/admin/users/route.ts` (existing GET handler)
- Reference: `lib/middleware/admin.ts` (admin auth middleware)

- [ ] **Step 1: Write failing tests for PUT /api/admin/users/bulk**

```typescript
import { PUT } from '@/app/api/admin/users/bulk/route'
import { NextRequest } from 'next/server'
import prisma from '@/lib/db/prisma'

jest.mock('@/lib/db/prisma')
jest.mock('@/lib/middleware/admin', () => ({
  authenticateAdmin: jest.fn((handler) => handler),
}))

describe('PUT /api/admin/users/bulk', () => {
  it('suspends multiple users', async () => {
    const mockUpdateMany = prisma.user.updateMany as jest.Mock
    mockUpdateMany.mockResolvedValue({ count: 3 })

    const req = new NextRequest('http://localhost/api/admin/users/bulk', {
      method: 'PUT',
      body: JSON.stringify({ userIds: ['id1', 'id2', 'id3'], action: 'suspend' }),
    })

    const res = await PUT(req)
    const data = await res.json()

    expect(data.success).toBe(true)
    expect(data.data.updated).toBe(3)
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['id1', 'id2', 'id3'] } },
      data: { isActive: false },
    })
  })

  it('activates multiple users', async () => {
    const mockUpdateMany = prisma.user.updateMany as jest.Mock
    mockUpdateMany.mockResolvedValue({ count: 2 })

    const req = new NextRequest('http://localhost/api/admin/users/bulk', {
      method: 'PUT',
      body: JSON.stringify({ userIds: ['id1', 'id2'], action: 'activate' }),
    })

    const res = await PUT(req)
    const data = await res.json()

    expect(data.success).toBe(true)
    expect(data.data.updated).toBe(2)
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['id1', 'id2'] } },
      data: { isActive: true },
    })
  })

  it('returns 400 for missing userIds', async () => {
    const req = new NextRequest('http://localhost/api/admin/users/bulk', {
      method: 'PUT',
      body: JSON.stringify({ action: 'suspend' }),
    })

    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid action', async () => {
    const req = new NextRequest('http://localhost/api/admin/users/bulk', {
      method: 'PUT',
      body: JSON.stringify({ userIds: ['id1'], action: 'delete' }),
    })

    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty userIds array', async () => {
    const req = new NextRequest('http://localhost/api/admin/users/bulk', {
      method: 'PUT',
      body: JSON.stringify({ userIds: [], action: 'suspend' }),
    })

    const res = await PUT(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run to verify tests fail (module not found)**

```bash
npx jest __tests__/api/admin/users-bulk.test.ts --no-coverage 2>&1 | tail -5
```

Expected: FAIL — Cannot find module `@/app/api/admin/users/bulk/route`

- [ ] **Step 3: Implement the bulk API route**

Create `app/api/admin/users/bulk/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { authenticateAdmin } from '@/lib/middleware/admin'

async function handlePUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { userIds, action } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'userIds must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!['suspend', 'activate'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'action must be "suspend" or "activate"' },
        { status: 400 }
      )
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { isActive: action === 'activate' },
    })

    return NextResponse.json({
      success: true,
      data: { updated: result.count },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update users' },
      { status: 500 }
    )
  }
}

export const PUT = authenticateAdmin(handlePUT)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/api/admin/users-bulk.test.ts --no-coverage -v 2>&1 | tail -10
```

Expected: ALL PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/users/bulk/route.ts __tests__/api/admin/users-bulk.test.ts
git commit -m "feat: add bulk user operations API endpoint with tests"
```

### Task 4: Wire BulkUserOperations component to real API

**Files:**
- Modify: `components/admin/BulkUserOperations.tsx`
- Create: `__tests__/components/admin/BulkUserOperations.test.tsx`

- [ ] **Step 1: Write component tests**

Write tests that verify:
1. Renders action bar when users are selected
2. Shows user count badge
3. Calls `/api/admin/users/bulk` with correct payload on "Suspend" click
4. Calls `/api/admin/users/bulk` with `action: 'activate'` on "Activate" click
5. Shows success message after API returns
6. Shows error message on API failure
7. Hides action bar when no users selected

- [ ] **Step 2: Run to verify tests fail**

```bash
npx jest __tests__/components/admin/BulkUserOperations.test.tsx --no-coverage 2>&1 | tail -5
```

- [ ] **Step 3: Update BulkUserOperations.tsx**

Replace the `setTimeout` simulation with actual `fetch('/api/admin/users/bulk', ...)` call. Read the current component first to understand the exact structure, then modify only the handler function.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/components/admin/BulkUserOperations.test.tsx --no-coverage -v 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add components/admin/BulkUserOperations.tsx __tests__/components/admin/BulkUserOperations.test.tsx
git commit -m "feat: wire BulkUserOperations to real API endpoint"
```

### Task 5: Activity Log API + Component Update

**Files:**
- Create: `app/api/admin/activity/route.ts`
- Create: `__tests__/api/admin/activity.test.ts`
- Modify: `components/admin/ActivityLog.tsx`
- Create: `__tests__/components/admin/ActivityLog.test.tsx`

- [ ] **Step 1: Write API tests**

Test that `GET /api/admin/activity?limit=20` returns recent activity entries derived from User, Appointment, and WorkoutLog tables. Test pagination, default limit, and empty results.

- [ ] **Step 2: Run to verify fail**

```bash
npx jest __tests__/api/admin/activity.test.ts --no-coverage 2>&1 | tail -5
```

- [ ] **Step 3: Implement activity API route**

Create `app/api/admin/activity/route.ts`:
- Query `prisma.user.findMany({ orderBy: { lastLoginAt: 'desc' }, take: limit/3 })` for login activity
- Query `prisma.appointment.findMany({ orderBy: { updatedAt: 'desc' }, take: limit/3 })` for scheduling activity
- Query recent workouts similarly
- Merge, sort by date DESC, slice to limit
- Map each to `{ id, action, resourceType, description, userId, userName, timestamp }`

- [ ] **Step 4: Run tests to verify pass**

- [ ] **Step 5: Write component tests for ActivityLog**

Test that component fetches from `/api/admin/activity` and renders entries. Test loading state, empty state, error state.

- [ ] **Step 6: Update ActivityLog component**

Replace hardcoded mock data with `useEffect` + `fetch('/api/admin/activity?limit=20')`. Keep the same UI rendering but use real data.

- [ ] **Step 7: Run all activity tests**

```bash
npx jest __tests__/api/admin/activity.test.ts __tests__/components/admin/ActivityLog.test.tsx --no-coverage -v 2>&1 | tail -15
```

- [ ] **Step 8: Commit**

```bash
git add app/api/admin/activity/ __tests__/api/admin/activity.test.ts components/admin/ActivityLog.tsx __tests__/components/admin/ActivityLog.test.tsx
git commit -m "feat: replace ActivityLog mock data with real API"
```

### Task 6: Feature Flags API + Component Update

**Files:**
- Create: `app/api/admin/feature-flags/route.ts`
- Create: `__tests__/api/admin/feature-flags.test.ts`
- Modify: `components/admin/FeatureFlagManager.tsx`
- Create or extend: `__tests__/components/admin/FeatureFlagManager.test.tsx`

- [ ] **Step 1: Write API tests**

Test GET returns flags object, PUT saves flags, GET after PUT returns updated flags. Test default flags when no saved data exists.

- [ ] **Step 2: Implement feature flags API**

Create `app/api/admin/feature-flags/route.ts`:
- Use Upstash Redis to store flags as JSON string at key `evofit:feature-flags`
- GET: Read from Redis, parse JSON, return. If key doesn't exist, return defaults.
- PUT: Write JSON to Redis. Return success.
- If Redis unavailable (no env vars), use in-memory Map as fallback (resets on deploy).

Default flags:
```typescript
const DEFAULT_FLAGS: Record<string, boolean> = {
  'whatsapp-messaging': true,
  'pwa-features': true,
  'payment-processing': false,
}
```

- [ ] **Step 3: Run API tests**

- [ ] **Step 4: Write/extend component tests**

Check if `__tests__/components/admin/FeatureFlagManager.test.tsx` exists. If so, extend. If not, create. Test: loads from API, toggles flag, saves to API, adds new flag, deletes flag.

- [ ] **Step 5: Update FeatureFlagManager component**

Add API fetch on mount (with localStorage fallback). On toggle/add/delete, save to both API + localStorage.

- [ ] **Step 6: Run all feature flag tests**

- [ ] **Step 7: Commit**

```bash
git add app/api/admin/feature-flags/ __tests__/api/admin/feature-flags.test.ts components/admin/FeatureFlagManager.tsx __tests__/components/admin/FeatureFlagManager.test.tsx
git commit -m "feat: persist feature flags via API with Redis storage"
```

---

## Chunk 3: PWA Improvements

### Task 7: Generate PWA Icons

**Files:**
- Create: `scripts/generate-icons.ts`
- Create: `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-192.png`, `public/icon-maskable-512.png`
- Modify: `public/manifest.json`

- [ ] **Step 1: Install sharp (if not already installed)**

```bash
npm ls sharp 2>/dev/null || npm install --save-dev sharp
```

- [ ] **Step 2: Create icon generation script**

Create `scripts/generate-icons.ts` that:
- Reads `public/logo.svg`
- Uses sharp to resize to 192x192 and 512x512
- Creates maskable variants with 20% padding on #2563eb background
- Outputs to `public/icon-*.png`

- [ ] **Step 3: Run the script**

```bash
npx tsx scripts/generate-icons.ts
```

Verify files exist:
```bash
ls -la public/icon-*.png
```

- [ ] **Step 4: Update manifest.json**

Add icon entries with proper `sizes`, `type`, and `purpose` attributes.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-icons.ts public/icon-*.png public/manifest.json
git commit -m "feat: generate PWA icons from logo SVG and update manifest"
```

### Task 8: Enhanced Sync Manager

**Files:**
- Modify: `lib/offline/syncManager.ts`
- Create: `__tests__/lib/offline/syncManager.test.ts`

- [ ] **Step 1: Write failing tests for enhanced sync**

Test exponential backoff (1s, 2s, 4s delays), last-write-wins conflict resolution, return value with counts, and error recovery (items stay in queue on failure).

- [ ] **Step 2: Run to verify fail**

```bash
npx jest __tests__/lib/offline/syncManager.test.ts --no-coverage 2>&1 | tail -5
```

- [ ] **Step 3: Enhance syncManager.ts**

Read current `lib/offline/syncManager.ts` first. Then add:
- `syncWithRetry()` function with exponential backoff
- Conflict detection via `updatedAt` comparison
- Enhanced return type: `{ synced: number, failed: number, conflicts: number, errors: string[] }`
- Keep backwards compatibility with existing `syncOfflineData()` function

- [ ] **Step 4: Run tests**

- [ ] **Step 5: Commit**

```bash
git add lib/offline/syncManager.ts __tests__/lib/offline/syncManager.test.ts
git commit -m "feat: add exponential backoff and conflict resolution to sync manager"
```

### Task 9: Sync Status UI Component

**Files:**
- Create: `components/shared/SyncStatus.tsx`
- Create: `__tests__/components/shared/SyncStatus.test.tsx`
- Modify: `components/layout/AppLayout.tsx`

- [ ] **Step 1: Write component tests**

Test: shows badge with pending count, shows spinner during sync, shows "Sync Now" button, updates after sync completes, hides when queue empty.

- [ ] **Step 2: Run to verify fail**

- [ ] **Step 3: Implement SyncStatus component**

Small component that uses `useOfflineQueue` hook. Renders a badge in bottom-left showing pending count. "Sync Now" button triggers manual sync. Shows last sync timestamp from localStorage.

- [ ] **Step 4: Add SyncStatus to AppLayout**

Read `components/layout/AppLayout.tsx` and add `<SyncStatus />` alongside existing PWA components.

- [ ] **Step 5: Run tests**

- [ ] **Step 6: Commit**

```bash
git add components/shared/SyncStatus.tsx __tests__/components/shared/SyncStatus.test.tsx components/layout/AppLayout.tsx
git commit -m "feat: add SyncStatus component showing offline queue status"
```

### Task 10: Background Timer Web Worker

**Files:**
- Create: `public/timer-worker.js`
- Create: `hooks/useBackgroundTimer.ts`
- Create: `__tests__/hooks/useBackgroundTimer.test.ts`

- [ ] **Step 1: Write hook tests**

Test: starts countdown, decrements each second, fires complete callback, pause/resume works, stop resets, falls back to setInterval if Worker unavailable.

- [ ] **Step 2: Run to verify fail**

- [ ] **Step 3: Create timer-worker.js**

```javascript
let interval = null
let remaining = 0

self.onmessage = function(e) {
  const { type, duration } = e.data

  if (type === 'start') {
    remaining = duration
    clearInterval(interval)
    interval = setInterval(() => {
      remaining--
      if (remaining <= 0) {
        clearInterval(interval)
        interval = null
        self.postMessage({ type: 'complete' })
      } else {
        self.postMessage({ type: 'tick', remaining })
      }
    }, 1000)
  } else if (type === 'pause') {
    clearInterval(interval)
    interval = null
    self.postMessage({ type: 'paused', remaining })
  } else if (type === 'resume') {
    interval = setInterval(() => {
      remaining--
      if (remaining <= 0) {
        clearInterval(interval)
        interval = null
        self.postMessage({ type: 'complete' })
      } else {
        self.postMessage({ type: 'tick', remaining })
      }
    }, 1000)
  } else if (type === 'stop') {
    clearInterval(interval)
    interval = null
    remaining = 0
  }
}
```

- [ ] **Step 4: Implement useBackgroundTimer hook**

```typescript
import { useEffect, useRef, useState, useCallback } from 'react'

export function useBackgroundTimer() {
  const workerRef = useRef<Worker | null>(null)
  const fallbackRef = useRef<NodeJS.Timeout | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const onCompleteRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    try {
      workerRef.current = new Worker('/timer-worker.js')
      workerRef.current.onmessage = (e) => {
        const { type, remaining: r } = e.data
        if (type === 'tick') setRemaining(r)
        if (type === 'complete') {
          setRemaining(0)
          setIsRunning(false)
          navigator.vibrate?.(200)
          onCompleteRef.current?.()
        }
        if (type === 'paused') {
          setRemaining(r)
          setIsRunning(false)
        }
      }
    } catch {
      // Worker not supported — will use fallback
    }
    return () => {
      workerRef.current?.terminate()
      if (fallbackRef.current) clearInterval(fallbackRef.current)
    }
  }, [])

  const start = useCallback((seconds: number, onComplete?: () => void) => {
    onCompleteRef.current = onComplete || null
    setRemaining(seconds)
    setIsRunning(true)

    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'start', duration: seconds })
    } else {
      // Fallback to setInterval
      let r = seconds
      if (fallbackRef.current) clearInterval(fallbackRef.current)
      fallbackRef.current = setInterval(() => {
        r--
        setRemaining(r)
        if (r <= 0) {
          clearInterval(fallbackRef.current!)
          setIsRunning(false)
          navigator.vibrate?.(200)
          onCompleteRef.current?.()
        }
      }, 1000)
    }
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'pause' })
    } else if (fallbackRef.current) {
      clearInterval(fallbackRef.current)
    }
  }, [])

  const resume = useCallback(() => {
    setIsRunning(true)
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'resume' })
    } else {
      // Restart fallback with current remaining
      let r = remaining
      fallbackRef.current = setInterval(() => {
        r--
        setRemaining(r)
        if (r <= 0) {
          clearInterval(fallbackRef.current!)
          setIsRunning(false)
          onCompleteRef.current?.()
        }
      }, 1000)
    }
  }, [remaining])

  const stop = useCallback(() => {
    setRemaining(0)
    setIsRunning(false)
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' })
    } else if (fallbackRef.current) {
      clearInterval(fallbackRef.current)
    }
  }, [])

  return { start, pause, resume, stop, remaining, isRunning }
}
```

- [ ] **Step 5: Run tests**

- [ ] **Step 6: Commit**

```bash
git add public/timer-worker.js hooks/useBackgroundTimer.ts __tests__/hooks/useBackgroundTimer.test.ts
git commit -m "feat: add background timer Web Worker with setInterval fallback"
```

---

## Chunk 4: Calendar Sync (iCal)

### Task 11: iCal Service

**Files:**
- Create: `lib/services/icalService.ts`
- Create: `__tests__/lib/services/icalService.test.ts`

- [ ] **Step 1: Write failing tests for iCal generation**

Test cases:
1. Single appointment generates valid VCALENDAR with one VEVENT
2. Multiple appointments generate multiple VEVENTs
3. Dates formatted as YYYYMMDDTHHMMSSZ (UTC)
4. Special characters escaped (commas → \, semicolons → \; backslashes → \\)
5. UID contains appointment ID + domain
6. STATUS maps correctly (scheduled→TENTATIVE, confirmed→CONFIRMED, cancelled→CANCELLED)
7. Empty appointments array returns valid empty VCALENDAR
8. PRODID header is `-//EvoFit Trainer//Schedule//EN`
9. Line length does not exceed 75 chars (RFC 5545 folding)

- [ ] **Step 2: Run to verify fail**

```bash
npx jest __tests__/lib/services/icalService.test.ts --no-coverage 2>&1 | tail -5
```

- [ ] **Step 3: Implement icalService.ts**

```typescript
interface ICalAppointment {
  id: string
  title: string
  description?: string
  location?: string
  startDatetime: Date
  endDatetime: Date
  status: string
}

export function generateICS(appointments: ICalAppointment[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EvoFit Trainer//Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:EvoFit Training Schedule',
  ]

  for (const appt of appointments) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${appt.id}@evofittrainer.app`)
    lines.push(`DTSTART:${formatICalDate(appt.startDatetime)}`)
    lines.push(`DTEND:${formatICalDate(appt.endDatetime)}`)
    lines.push(`SUMMARY:${escapeICalText(appt.title)}`)
    if (appt.description) lines.push(`DESCRIPTION:${escapeICalText(appt.description)}`)
    if (appt.location) lines.push(`LOCATION:${escapeICalText(appt.location)}`)
    lines.push(`STATUS:${mapStatus(appt.status)}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return foldLines(lines).join('\r\n')
}

export function generateSingleICS(appointment: ICalAppointment): string {
  return generateICS([appointment])
}

export function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    scheduled: 'TENTATIVE',
    confirmed: 'CONFIRMED',
    completed: 'CONFIRMED',
    cancelled: 'CANCELLED',
    no_show: 'CANCELLED',
  }
  return map[status] || 'TENTATIVE'
}

function foldLines(lines: string[]): string[] {
  return lines.map(line => {
    if (line.length <= 75) return line
    const parts = []
    parts.push(line.slice(0, 75))
    let i = 75
    while (i < line.length) {
      parts.push(' ' + line.slice(i, i + 74))
      i += 74
    }
    return parts.join('\r\n')
  })
}
```

- [ ] **Step 4: Run tests to verify pass**

- [ ] **Step 5: Commit**

```bash
git add lib/services/icalService.ts __tests__/lib/services/icalService.test.ts
git commit -m "feat: add iCal service for RFC 5545 calendar generation"
```

### Task 12: iCal Export & Feed Endpoints

**Files:**
- Create: `app/api/schedule/export/ics/route.ts`
- Create: `app/api/schedule/feed/[token]/route.ts`
- Create: `__tests__/api/schedule/export-ics.test.ts`
- Create: `__tests__/api/schedule/feed.test.ts`

- [ ] **Step 1: Write export endpoint tests**

Test: returns 200 with Content-Type text/calendar, Content-Disposition attachment, valid ICS content. Test auth required. Test date range filtering.

- [ ] **Step 2: Write feed endpoint tests**

Test: valid token returns ICS feed, invalid token returns 401, feed contains future appointments only.

- [ ] **Step 3: Implement export endpoint**

`app/api/schedule/export/ics/route.ts`:
- Authenticate user via JWT
- Query appointments with date range filter
- Generate ICS via `generateICS()`
- Return with `Content-Type: text/calendar` and `Content-Disposition: attachment`

- [ ] **Step 4: Implement feed endpoint**

`app/api/schedule/feed/[token]/route.ts`:
- Validate token (SHA-256 hash of userId + JWT_ACCESS_SECRET)
- Look up user by iterating or decoding token
- Query future appointments for that user
- Return ICS feed (no auth header needed — token IS auth)

Token generation helper:
```typescript
import crypto from 'crypto'

export function generateFeedToken(userId: string): string {
  const secret = process.env.JWT_ACCESS_SECRET || ''
  return crypto.createHash('sha256').update(userId + secret).digest('hex').slice(0, 32)
}
```

- [ ] **Step 5: Run all calendar API tests**

```bash
npx jest __tests__/api/schedule/export-ics.test.ts __tests__/api/schedule/feed.test.ts --no-coverage -v 2>&1 | tail -15
```

- [ ] **Step 6: Commit**

```bash
git add app/api/schedule/export/ app/api/schedule/feed/ __tests__/api/schedule/export-ics.test.ts __tests__/api/schedule/feed.test.ts
git commit -m "feat: add iCal export and subscribable calendar feed endpoints"
```

### Task 13: Calendar Export UI

**Files:**
- Create: `components/schedule/CalendarExport.tsx`
- Create: `__tests__/components/schedule/CalendarExport.test.tsx`
- Modify: `app/schedule/page.tsx`

- [ ] **Step 1: Write component tests**

Test: renders "Export to Calendar" button, clicking opens dropdown with "Download .ics" and "Subscribe to Feed" options, "Subscribe" opens modal with feed URL, copy button works, modal has instructions for Google/Apple/Outlook.

- [ ] **Step 2: Implement CalendarExport component**

Dropdown button with two options. "Download" triggers `fetch('/api/schedule/export/ics')` and downloads file. "Subscribe" shows modal with feed URL and instructions.

- [ ] **Step 3: Add CalendarExport to schedule page**

Read `app/schedule/page.tsx` and add `<CalendarExport />` in the header area next to existing buttons.

- [ ] **Step 4: Run tests**

- [ ] **Step 5: Commit**

```bash
git add components/schedule/CalendarExport.tsx __tests__/components/schedule/CalendarExport.test.tsx app/schedule/page.tsx
git commit -m "feat: add calendar export UI with download and subscribe options"
```

---

## Chunk 5: Progressive Overload

### Task 14: Progression Service

**Files:**
- Create: `lib/services/progressionService.ts`
- Create: `__tests__/lib/services/progressionService.test.ts`

- [ ] **Step 1: Write comprehensive failing tests**

20+ test cases covering:
1. RPE 6-7, all reps hit → `increase_weight` (+5 lbs lower body)
2. RPE 6-7, all reps hit → `increase_weight` (+2.5 lbs upper body)
3. RPE 8+, reps hit → `increase_reps` (+1 rep)
4. >50% failed sets → `reduce` (-5 lbs)
5. RPE 8-9, mixed hits → `maintain`
6. Load ratio >1.5 → `deload`
7. NULL RPE values treated as RPE 7, confidence: `low`
8. <3 sets → `maintain` with `low` confidence, "Insufficient data"
9. 0 sets → same as #8
10. Upper body exercises: +2.5 lbs increment
11. Lower body exercises: +5 lbs increment
12. Default body part: +5 lbs
13. Plateau detection: <2% improvement over 8 weeks → mention in reason
14. High confidence when >10 data points
15. Medium confidence when 5-10 data points
16. Low confidence when 3-4 data points
17. Mixed RPE values (some null, some not)
18. All sets at RPE 10 → `reduce`
19. Returns correct `dataPoints` count
20. Deload suggestion has specific volume reduction text

- [ ] **Step 2: Run to verify fail**

```bash
npx jest __tests__/lib/services/progressionService.test.ts --no-coverage 2>&1 | tail -5
```

- [ ] **Step 3: Implement progressionService.ts**

Core implementation following the rules engine from the spec. Key types:

```typescript
export interface ProgressionInput {
  exerciseId: string
  recentSets: Array<{
    weight: number
    reps: number
    rpe: number | null
    targetReps?: number
    failed?: boolean
    createdAt: Date
  }>
  bodyPart?: string
}

export interface ProgressionSuggestion {
  suggestedWeight: number
  suggestedReps: number
  strategy: 'increase_weight' | 'increase_reps' | 'maintain' | 'deload' | 'reduce'
  reason: string
  confidence: 'high' | 'medium' | 'low'
  dataPoints: number
}

export function calculateProgression(input: ProgressionInput): ProgressionSuggestion
```

- [ ] **Step 4: Run tests iteratively until all 20+ pass**

```bash
npx jest __tests__/lib/services/progressionService.test.ts --no-coverage -v 2>&1 | tail -30
```

- [ ] **Step 5: Commit**

```bash
git add lib/services/progressionService.ts __tests__/lib/services/progressionService.test.ts
git commit -m "feat: add progression service with RPE-based auto-suggestions"
```

### Task 15: Progression API Endpoint

**Files:**
- Create: `app/api/progression/suggestions/route.ts`
- Create: `__tests__/api/progression/suggestions.test.ts`

- [ ] **Step 1: Write API tests**

Test: returns suggestion for valid exercise with data, returns 400 for missing exerciseId, returns low-confidence maintain for exercise with no data, requires authentication.

- [ ] **Step 2: Implement endpoint**

```typescript
// GET /api/progression/suggestions?exerciseId=...&clientId=...&weeks=4
// 1. Authenticate user
// 2. Query WorkoutSetLog for exercise in last N weeks
// 3. Pass to calculateProgression()
// 4. Return suggestion
```

- [ ] **Step 3: Run tests**

- [ ] **Step 4: Commit**

```bash
git add app/api/progression/suggestions/ __tests__/api/progression/suggestions.test.ts
git commit -m "feat: add progression suggestions API endpoint"
```

### Task 16: Progression Suggestion UI Component

**Files:**
- Create: `components/workouts/ProgressionSuggestion.tsx`
- Create: `__tests__/components/workouts/ProgressionSuggestion.test.tsx`

- [ ] **Step 1: Write component tests**

Test: renders suggestion card with weight/reps, shows strategy reason, shows confidence badge, Accept button calls callback, Dismiss button hides card, shows "insufficient data" message for low-confidence suggestions.

- [ ] **Step 2: Implement component**

Card component showing:
- Suggested weight + change indicator (+5 lbs)
- Suggested reps
- Strategy reason text
- Confidence badge (green/yellow/orange)
- Accept / Dismiss buttons

- [ ] **Step 3: Run tests**

- [ ] **Step 4: Commit**

```bash
git add components/workouts/ProgressionSuggestion.tsx __tests__/components/workouts/ProgressionSuggestion.test.tsx
git commit -m "feat: add ProgressionSuggestion card component"
```

---

## Chunk 6: Integration, Browser Testing & Production Push

### Task 17: Full Unit Test Suite Verification

- [ ] **Step 1: Run complete test suite**

```bash
npx jest --no-coverage 2>&1 | tail -20
```

Expected: 0 failures. If any failures, fix them before proceeding.

- [ ] **Step 2: Run with coverage**

```bash
npx jest --coverage 2>&1 | tail -30
```

Verify coverage meets threshold (70%+ global).

- [ ] **Step 3: Commit any fixes**

### Task 18: Build Verification

- [ ] **Step 1: Run production build**

```bash
npm run build 2>&1 | tail -30
```

Expected: Build completes with 0 errors.

- [ ] **Step 2: Run lint**

```bash
npm run lint 2>&1 | tail -10
```

Expected: 0 errors.

- [ ] **Step 3: Fix any build/lint issues and commit**

### Task 19: Browser Testing on Localhost

Start dev server and verify all features with Playwright browser automation:

- [ ] **Step 1: Start dev server**

```bash
npm run dev &
# Wait for "Ready" message
```

- [ ] **Step 2: Homepage verification**

Navigate to `http://localhost:3000`. Verify:
- "Own Your Coaching Platform. Forever." heading visible
- "Get Lifetime Access" button visible
- "$299" pricing visible
- "Stop Renting. Start Owning." CTA visible
- Footer renders

- [ ] **Step 3: Admin dashboard verification**

Navigate to `http://localhost:3000/admin` (requires login as admin). Verify:
- Dashboard loads with metrics
- Activity log shows real data (not hardcoded mock)
- Feature flags can be toggled
- User management page loads

- [ ] **Step 4: Schedule page verification**

Navigate to `http://localhost:3000/schedule`. Verify:
- Calendar renders
- "Export to Calendar" button visible
- Download .ics works
- Subscribe modal shows feed URL

- [ ] **Step 5: PWA verification**

Check manifest loads correctly:
- Navigate to `http://localhost:3000`
- Verify PWA icons load (check Network tab or manifest)
- Verify SyncStatus component appears when offline queue has items

- [ ] **Step 6: Stop dev server**

- [ ] **Step 7: Document browser test results**

### Task 20: Production Push

**ONLY if all previous tasks pass with 100% success.**

- [ ] **Step 1: Final git status check**

```bash
git status
git log --oneline -10
```

- [ ] **Step 2: Push to master**

```bash
git push origin master
```

- [ ] **Step 3: Verify Vercel deployment succeeds**

Check Vercel dashboard or:
```bash
npx vercel ls 2>&1 | head -5
```

- [ ] **Step 4: Verify production site**

Navigate to `https://evofittrainer-six.vercel.app` and spot-check:
- Homepage renders with new content
- Admin features work
- Schedule export works

---

## Next Session Todo (Not In Scope)

- [ ] **Payments (Epic 010)** — Stripe integration, subscription management, invoicing
- [ ] **Photo uploads** — Set Cloudinary env vars, enable upload routes
- [ ] **Push notifications** — Firebase Cloud Messaging setup
- [ ] **Full calendar OAuth sync** — Google/Apple/Microsoft API credentials
- [ ] **Support ticket system** — New DB tables + admin UI
- [ ] **Content moderation** — New DB tables + review queue
- [ ] **Recurring appointments** — RecurringAppointment model + UI
