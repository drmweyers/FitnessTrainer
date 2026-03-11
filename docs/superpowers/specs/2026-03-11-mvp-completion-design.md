# MVP Completion Sprint - Design Spec
**Date:** 2026-03-11
**Status:** Approved (Rev 2 - spec review issues addressed)
**Scope:** 5 work items to reach MVP ~95%+

---

## Work Item 1: Fix Homepage Tests

**Problem:** 46 tests fail across 2 test files. Tests written for old marketing copy ("Transform Your Fitness Business") but component was rewritten to "Own Your Coaching Platform. Forever." in the marketing push (commit `0c4939d`).

**Files:**
- `app/__tests__/page.test.tsx` — PRIMARY (keep and rewrite)
- `__tests__/app/page.test.tsx` — DUPLICATE (delete entirely)

**Decision:** Single source of truth at `app/__tests__/page.test.tsx`. The `__tests__/app/` location is non-standard for this project (co-located tests are the pattern).

**Approach:**
1. Delete `__tests__/app/page.test.tsx` (duplicate)
2. Rewrite `app/__tests__/page.test.tsx` to match current component content:
   - "Own Your Coaching Platform. Forever." heading
   - "Get Lifetime Access" CTA button
   - "Built for Trainers Who Refuse to Rent" section
   - Stats: 1,344 exercises, 8 categories, etc.
   - Pricing section ($299 lifetime)
   - "Stop Renting. Start Owning." CTA
   - Footer with copyright
3. Add tests for new sections: Pricing, Feature Spotlight, Screenshots

**Success criteria:** 0 test failures in homepage suite. All assertions match live component.

---

## Work Item 2: Admin Dashboard Polish

**Problem:** 3 admin components use mock data or localStorage instead of real APIs. No unit tests for admin components or API routes.

**All 3 sub-items are MVP-critical:** BulkUserOperations is core admin UX, ActivityLog gives admin visibility, FeatureFlags enables feature rollout.

### 2a. BulkUserOperations — Wire to Real API

**Current:** Simulates API call with `setTimeout`.
**Target:** Call `PUT /api/admin/users/bulk` endpoint.

**New API endpoint:**
```
PUT /api/admin/users/bulk
Body: { userIds: string[], action: 'suspend' | 'activate' }
Response: { success: true, data: { updated: number } }
```

**Implementation:**
- Add `PUT` handler to existing `app/api/admin/users/route.ts` (same file, new export)
- Use Prisma `updateMany` with `where: { id: { in: userIds } }`
- Set `isActive: true` for activate, `isActive: false` for suspend
- Update `BulkUserOperations.tsx` to call real endpoint with `fetch('/api/admin/users/bulk', { method: 'PUT', ... })`

### 2b. ActivityLog — Real Data

**Current:** Hardcoded mock array.
**Target:** Query recent actions from existing DB tables.

**New API endpoint:**
```
GET /api/admin/activity?limit=20&page=1
Response: { success: true, data: ActivityLogEntry[], pagination: { total, page, limit } }
```

**Implementation (simplified — no union query):**
- Query ONLY from `User` table (recent logins via `lastLoginAt`), `Appointment` (recent bookings), and `WorkoutLog` (recent completions)
- 3 separate Prisma queries, each limited to `Math.ceil(limit / 3)` results
- Merge in JS, sort by date DESC, slice to limit
- Paginate with cursor-based approach (offset + limit)
- Index: `updatedAt` already indexed on all tables (Prisma default)

### 2c. FeatureFlags — localStorage-Only with Admin API Sync

**Revised decision:** Keep localStorage as primary storage (simple, no Redis complexity). Add API endpoint that reads/writes a JSON file on the server (`data/feature-flags.json`) for persistence across sessions. No Redis, no new DB tables.

**New API endpoints:**
```
GET  /api/admin/feature-flags
     Response: { success: true, data: Record<string, boolean> }

PUT  /api/admin/feature-flags
     Body: { flags: Record<string, boolean> }
     Response: { success: true }
```

**Implementation:**
- Server reads/writes `data/feature-flags.json` (gitignored, auto-created with defaults)
- On Vercel: use Edge Config or KV store. Fallback: return defaults if file doesn't exist.
- Component loads from API on mount, falls back to localStorage if API fails
- Saves to both API + localStorage on change
- TTL: No caching, always fetch fresh on admin page load

### 2d. Admin Tests

**New test files:**
- `__tests__/components/admin/BulkUserOperations.test.tsx`
- `__tests__/components/admin/ActivityLog.test.tsx`
- `__tests__/components/admin/FeatureFlagManager.test.tsx`
- `__tests__/api/admin/users-bulk.test.ts`
- `__tests__/api/admin/activity.test.ts`
- `__tests__/api/admin/feature-flags.test.ts`

**Existing tests:** `FeatureFlagManager.test.tsx` may already exist. If so, extend it with API integration tests rather than replacing.

---

## Work Item 3: PWA Improvements

### 3a. Splash Screen Icons

**Tool:** Use `sharp` npm package (already available in Node.js) to convert SVG to PNG.

**Script:** `scripts/generate-icons.ts`
```typescript
// Generates 4 PNG files from public/logo.svg:
// icon-192.png (192x192), icon-512.png (512x512)
// icon-maskable-192.png (192x192 with 20% safe zone padding)
// icon-maskable-512.png (512x512 with 20% safe zone padding)
```

**Maskable icons:** Add 20% padding around logo (safe zone per W3C spec). Background: #2563eb (brand blue).

**Update `manifest.json`:**
```json
"icons": [
  { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
  { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
  { "src": "/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
  { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
]
```

**Validation:** Test that generated PNGs match expected dimensions via sharp metadata check.

### 3b. Enhanced Sync Manager

**File:** `lib/offline/syncManager.ts` (modify existing)

**Backwards compatibility:** Keep existing `syncOfflineData()` function signature. Add new parameters with defaults.

**Add:**
- Exponential backoff retry: delays = [1000, 2000, 4000, 8000, 16000, 30000] (max 30s, 6 attempts)
- Last-write-wins conflict resolution: compare `updatedAt` timestamps, keep newer
- Return enhanced result: `{ synced: number, failed: number, conflicts: number, errors: string[] }`

**Error handling:** If all retries fail, return items to queue with `failedAt` timestamp. Don't lose data.

### 3c. Sync Status UI

**New component:** `components/shared/SyncStatus.tsx`

**Features:**
- Badge showing pending sync count (from `useOfflineQueue`)
- Sync-in-progress spinner
- Last sync timestamp (stored in localStorage `evofit-last-sync`)
- Manual "Sync Now" button
- Integrates with `useOfflineQueue` hook

### 3d. Background Timer (Web Worker)

**New file:** `public/timer-worker.js` (plain JS — Web Workers can't use TypeScript directly)

**Message protocol:**
```typescript
// Main thread → Worker
type WorkerCommand =
  | { type: 'start', duration: number }  // duration in seconds
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'stop' }

// Worker → Main thread
type WorkerMessage =
  | { type: 'tick', remaining: number }    // remaining seconds
  | { type: 'complete' }                    // timer finished
  | { type: 'paused', remaining: number }   // timer paused
```

**Worker implementation:** Uses `setInterval(1000)` internally. Posts `tick` every second with remaining time. Posts `complete` when remaining hits 0.

**Hook:** `hooks/useBackgroundTimer.ts`
```typescript
function useBackgroundTimer(): {
  start: (seconds: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
  remaining: number
  isRunning: boolean
}
```

**Error handling:** If `Worker` constructor fails (unsupported browser), fall back to standard `setInterval`. No crash.

**Vibration:** `navigator.vibrate?.(200)` on complete — optional, no-op if unsupported.

**Cleanup:** Worker terminated on hook unmount via `worker.terminate()`.

### 3e. PWA Tests

- `__tests__/lib/offline/syncManager.test.ts` — enhanced sync tests (backoff, conflicts, error recovery)
- `__tests__/components/shared/SyncStatus.test.tsx`
- `__tests__/hooks/useBackgroundTimer.test.ts` — test both Worker and fallback paths

---

## Work Item 4: Calendar Sync (iCal)

### 4a. ICS File Generation

**New file:** `lib/services/icalService.ts`

**No external library** — ICS format is simple enough to generate manually.

**Example ICS output (RFC 5545):**
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EvoFit Trainer//Schedule//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:EvoFit Training Schedule
BEGIN:VEVENT
UID:appointment-uuid@evofittrainer.app
DTSTART:20260315T100000Z
DTEND:20260315T110000Z
SUMMARY:1-on-1 Training - John Doe
DESCRIPTION:Personal training session
LOCATION:Main Gym
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

**Key RFC 5545 rules enforced:**
- UID must be globally unique (use appointment UUID + domain)
- DTSTART/DTEND in UTC format (YYYYMMDDTHHMMSSZ)
- Line folding at 75 chars (CRLF + space for continuation)
- Escape special chars in text fields (commas, semicolons, backslashes)
- STATUS maps: scheduled→TENTATIVE, confirmed→CONFIRMED, cancelled→CANCELLED

**Recurring appointments:** Not supported (single events only — recurring is not implemented in the app).

**Functions:**
```typescript
generateICS(appointments: Appointment[]): string  // multi-event calendar
generateSingleICS(appointment: Appointment): string  // single event download
escapeICalText(text: string): string  // escape special chars
formatICalDate(date: Date): string  // to YYYYMMDDTHHMMSSZ
```

### 4b. iCal Export Endpoint

```
GET /api/schedule/export/ics?startDate=...&endDate=...
Headers: Content-Type: text/calendar; charset=utf-8
         Content-Disposition: attachment; filename="evofit-schedule.ics"
```

Requires authentication (JWT). Returns trainer's appointments in date range.

### 4c. Calendar Feed URL

```
GET /api/schedule/feed/[token]
Headers: Content-Type: text/calendar; charset=utf-8
```

**Token generation:** `crypto.createHash('sha256').update(userId + JWT_ACCESS_SECRET).digest('hex').slice(0, 32)`

**No auth required** (token IS the auth). Returns all future appointments for the user.

### 4d. UI Integration

**Add to `app/schedule/page.tsx`:**
- "Export to Calendar" dropdown button with "Download .ics" and "Subscribe to Feed" options
- "Subscribe to Calendar Feed" modal with:
  - Copyable feed URL
  - Instructions: "Paste this URL in Google Calendar > Other calendars > From URL"
  - Similar instructions for Apple Calendar and Outlook

### 4e. Calendar Tests

- `__tests__/lib/services/icalService.test.ts` — ICS generation, escaping, date formatting, RFC compliance
- `__tests__/api/schedule/export-ics.test.ts` — endpoint auth, date range, content-type headers
- `__tests__/api/schedule/feed.test.ts` — token validation, public access, calendar content

**Validation tests:** Verify generated ICS contains required fields (VERSION, PRODID, VEVENT, UID, DTSTART, DTEND).

---

## Work Item 5: Progressive Overload Auto-Suggestions

### 5a. ProgressionService

**New file:** `lib/services/progressionService.ts`

**Data validation rules:**
- **Minimum data required:** At least 3 completed sets for the exercise in the last 4 weeks
- **NULL RPE handling:** If RPE is null, treat as RPE 7 (moderate default). If >50% sets have null RPE, set `confidence: 'low'`
- **Insufficient data response:** Return `{ strategy: 'maintain', reason: 'Insufficient data (need 3+ sets)', confidence: 'low' }`

**Core function:**
```typescript
interface ProgressionInput {
  exerciseId: string
  recentSets: WorkoutSetLog[]  // last 4 weeks
  currentConfig?: ExerciseConfiguration  // prescribed targets (optional)
  bodyPart?: string  // for increment size determination
}

interface ProgressionSuggestion {
  suggestedWeight: number
  suggestedReps: number
  strategy: 'increase_weight' | 'increase_reps' | 'maintain' | 'deload' | 'reduce'
  reason: string
  confidence: 'high' | 'medium' | 'low'
  dataPoints: number  // how many sets analyzed
}
```

**Rules engine:**
1. **Linear progression:** If avg RPE 6-7 and hit all target reps → +5 lbs (legs/back) or +2.5 lbs (arms/shoulders/chest)
2. **Rep progression:** If avg RPE 8+ but hitting reps → add 1 rep, maintain weight
3. **Weight reduction:** If >50% sets failed → suggest -5 lbs
4. **Maintain:** If avg RPE 8-9 and mixed rep hits → maintain current prescription
5. **Deload trigger:** If load ratio >1.5 for 2+ weeks → suggest 50% volume reduction

**Body part → increment mapping:**
- Lower body (legs, glutes): +5 lbs
- Upper body compound (chest, back): +5 lbs
- Upper body isolation (arms, shoulders): +2.5 lbs
- Default: +5 lbs

### 5b. Progression API

```
GET /api/progression/suggestions?exerciseId=...&clientId=...&weeks=4
Response: {
  success: true,
  data: ProgressionSuggestion
}

Error cases:
- 400: Missing exerciseId
- 404: Exercise not found or no workout data
- 200 with low confidence: Insufficient data (< 3 sets)
```

### 5c. Post-Workout Suggestion Card

**New component:** `components/workouts/ProgressionSuggestion.tsx`

**Shows after workout completion:**
- "Next session suggestion: 185 lbs (+5) x 8 reps"
- Strategy explanation: "All sets at RPE 6-7, ready to progress"
- Confidence indicator (high/medium/low)
- Accept / Dismiss buttons
- If insufficient data: "Log 3+ sets to get progression suggestions"

### 5d. Plateau Detection

**In ProgressionService:**
- Compare current 4-week avg weight to previous 4-week avg weight
- If <2% improvement and >6 data points → flag as plateau
- Return in suggestion: `{ strategy: 'maintain', reason: 'Plateau detected — consider variation change or deload' }`

### 5e. Progression Tests

- `__tests__/lib/services/progressionService.test.ts` — 20+ test cases:
  - RPE 6-7 with all reps hit → increase weight
  - RPE 8+ with reps hit → increase reps
  - >50% failed sets → reduce weight
  - Mixed RPE → maintain
  - Load ratio >1.5 → deload
  - NULL RPE handling (treat as 7, low confidence)
  - Insufficient data (<3 sets) → maintain with low confidence
  - Upper vs lower body increment sizes
  - Plateau detection (no progress 4+ weeks)
  - Zero sets → 404 response
- `__tests__/api/progression/suggestions.test.ts`
- `__tests__/components/workouts/ProgressionSuggestion.test.tsx`

---

## Exclusions (Next Session Todo)

- **Payments (Epic 010)** — Full Stripe integration, subscription management
- **Photo uploads** — Cloudinary hosting costs money
- **Push notifications** — Requires Firebase/FCM setup
- **Full calendar OAuth sync** — Requires Google/Apple/Microsoft API credentials
- **Support ticket system** — Requires new DB tables
- **Content moderation** — Requires new DB tables
- **Recurring appointments** — Not yet implemented in scheduling

---

## Testing Strategy (TDD)

All work items follow RED-GREEN-REFACTOR:
1. Write failing tests first
2. Implement minimal code to pass
3. Refactor for quality
4. Browser verification on localhost before push

**Browser testing on localhost (Playwright):**
- Start dev server (`npm run dev`)
- Homepage: verify renders, CTA buttons, pricing section
- Admin: verify bulk operations, activity log loads, feature flags toggle
- PWA: verify install prompt, offline indicator, sync status badge
- Schedule: verify calendar export button, .ics download, feed URL modal
- Workouts: verify progression suggestion card after mock workout
- Only push to production after 100% localhost success

---

## Estimated New Tests

| Work Item | New Tests | Edge Cases Included |
|-----------|-----------|---------------------|
| Homepage | ~20 | Responsive rendering, missing images |
| Admin Dashboard | ~45 | Empty states, API failures, bulk 0 users |
| PWA Improvements | ~30 | Worker fallback, sync retry exhaustion, offline |
| Calendar Sync | ~25 | Escaped chars, empty appointments, invalid dates |
| Progressive Overload | ~30 | Null RPE, 0 sets, plateau, upper/lower body |
| **Total** | **~150 new tests** |
