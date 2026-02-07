# High & Medium Priority Features - Parallel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 5 features in parallel using git worktrees: Activity Feed, Workout Streak, User Profiles, Analytics API, and Exercise Library Polish.

**Architecture:** Each feature gets its own git worktree/branch. Only Activity Feed needs a schema change (new Activity model). All others use existing schema. Each branch merges independently back to master.

**Tech Stack:** Next.js 14 App Router, Prisma 5.22, PostgreSQL, TanStack Query, Radix UI + shadcn/ui, Tailwind CSS

---

## Parallel Execution Strategy

| Worktree | Branch | Agent | Scope | Est. Files |
|----------|--------|-------|-------|------------|
| WT-1 | `feature/activity-feed` | activity-agent | Activity model + API + service + dashboard wiring | 8-10 |
| WT-2 | `feature/workout-streak` | streak-agent | Streak calculation + dashboard stats API update | 3-4 |
| WT-3 | `feature/user-profiles` | profiles-agent | Profile pages + API routes + forms | 8-10 |
| WT-4 | `feature/analytics-api` | analytics-agent | Performance metrics + training load API routes | 8-10 |
| WT-5 | `feature/exercise-polish` | exercise-agent | Exercise detail page + filter polish | 4-5 |

**Schema Conflict Prevention:** Only WT-1 modifies `prisma/schema.prisma`. All other worktrees use the schema as-is.

---

## WT-1: Activity Feed (feature/activity-feed)

### Task 1.1: Add Activity model to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma` (add model at end)

Add Activity model:
```prisma
model Activity {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  type        String   // client_signup, workout_completed, program_assigned, milestone_reached, system_event
  title       String
  description String?
  relatedId   String?  @map("related_id") @db.Uuid
  relatedType String?  @map("related_type") // workout, program, user
  metadata    Json?    @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@index([userId, createdAt(sort: Desc)])
  @@index([type])
  @@map("activities")
}
```

Add `activities Activity[]` relation to User model.

Run: `npx prisma generate`

### Task 1.2: Create Activity API route

**Files:**
- Create: `app/api/activities/route.ts`

GET endpoint with pagination, role-based filtering:
- Trainer: sees activities for their clients
- Client: sees only own activities
- Admin: sees all activities
Query params: `?page=1&limit=20&type=workout_completed`

### Task 1.3: Create Activity logging service

**Files:**
- Create: `lib/services/activity.service.ts`

Functions:
- `logActivity(userId, type, title, description?, relatedId?, relatedType?, metadata?)`
- `logWorkoutCompleted(userId, workoutSessionId, workoutName)`
- `logProgramAssigned(trainerId, clientId, programId, programName)`
- `logClientSignup(userId, userName)`

### Task 1.4: Wire activity logging into existing API routes

**Files:**
- Modify: `app/api/workouts/[id]/complete/route.ts` - log workout_completed
- Modify: `app/api/programs/[id]/assign/route.ts` - log program_assigned
- Modify: `app/api/auth/register/route.ts` - log client_signup

### Task 1.5: Wire dashboards to real activity feed

**Files:**
- Modify: `app/dashboard/trainer/page.tsx` - fetch from /api/activities
- Modify: `app/dashboard/client/page.tsx` - fetch from /api/activities
- Modify: `app/dashboard/admin/page.tsx` - fetch from /api/activities

Replace hardcoded empty arrays with real API fetch using the existing ActivityFeed component.

---

## WT-2: Workout Streak (feature/workout-streak)

### Task 2.1: Add streak calculation to dashboard stats API

**Files:**
- Modify: `app/api/dashboard/stats/route.ts`

Add streak calculation for client role using $queryRaw:
```sql
-- Get consecutive days with completed workouts ending at today
WITH workout_days AS (
  SELECT DISTINCT DATE(completed_at) as workout_date
  FROM workout_sessions
  WHERE user_id = $userId AND status = 'completed' AND completed_at IS NOT NULL
  ORDER BY workout_date DESC
),
streak AS (
  SELECT workout_date,
    workout_date - (ROW_NUMBER() OVER (ORDER BY workout_date DESC))::int * INTERVAL '1 day' as grp
  FROM workout_days
)
SELECT COUNT(*) as streak_count FROM streak
WHERE grp = (SELECT grp FROM streak LIMIT 1)
```

Return `workoutStreak` in the client response alongside existing fields.

### Task 2.2: Also add streak to trainer dashboard stats

For each client in the trainer's list, calculate and return their streak.

### Task 2.3: Verify client dashboard displays streak correctly

**Files:**
- Verify: `app/dashboard/client/page.tsx` - already has StatCard for streak, just needs real data

---

## WT-3: User Profiles (feature/user-profiles)

### Task 3.1: Create Profile API routes

**Files:**
- Create: `app/api/profiles/me/route.ts` (GET + PUT)
- Create: `app/api/profiles/health/route.ts` (GET + PUT)

GET /api/profiles/me - returns user profile with related UserProfile, UserGoal, UserMeasurement
PUT /api/profiles/me - updates profile fields (bio, phone, timezone, etc.)
GET /api/profiles/health - returns UserHealth data
PUT /api/profiles/health - updates health questionnaire

### Task 3.2: Create Profile Edit page

**Files:**
- Create: `app/profile/page.tsx` (view profile)
- Create: `app/profile/edit/page.tsx` (edit form)
- Create: `app/profile/layout.tsx` (shared layout)

Profile edit form with sections:
- Basic info (name, bio, date of birth, gender, phone)
- Preferences (timezone, preferred units, public/private)
- Profile photo upload (placeholder - actual upload deferred)

### Task 3.3: Create Profile components

**Files:**
- Create: `components/features/Profile/ProfileForm.tsx`
- Create: `components/features/Profile/ProfileHeader.tsx`
- Create: `components/features/Profile/HealthQuestionnaire.tsx`

### Task 3.4: Add profile link to sidebar navigation

**Files:**
- Modify: `components/layout/Sidebar.tsx` (or equivalent navigation component)

Add "Profile" and "Settings" links to the sidebar.

---

## WT-4: Analytics API (feature/analytics-api)

### Task 4.1: Create Performance Metrics API routes

**Files:**
- Create: `app/api/analytics/performance/route.ts` (GET + POST)
- Create: `app/api/analytics/performance/personal-bests/route.ts` (GET)

GET - query performance metrics by exercise, date range, metric type
POST - record a new performance metric
GET personal-bests - get personal records per exercise

### Task 4.2: Create Training Load API routes

**Files:**
- Create: `app/api/analytics/training-load/route.ts` (GET)
- Create: `app/api/analytics/training-load/calculate/route.ts` (POST)

GET - get training load history (weekly)
POST calculate - calculate load from workout sessions in a date range

### Task 4.3: Create Goals API routes

**Files:**
- Create: `app/api/analytics/goals/route.ts` (GET + POST)
- Create: `app/api/analytics/goals/[id]/progress/route.ts` (GET + POST)

CRUD for goals + progress tracking.

### Task 4.4: Wire workout completion to auto-record metrics

**Files:**
- Modify: `app/api/workouts/[id]/complete/route.ts`

When workout is completed, extract set data (weight, reps, volume) and write PerformanceMetric records.

### Task 4.5: Wire analytics page to real API data

**Files:**
- Modify: `app/analytics/page.tsx`

Replace any mock/placeholder data with real API calls to the new endpoints.

---

## WT-5: Exercise Library Polish (feature/exercise-polish)

### Task 5.1: Polish exercise detail page

**Files:**
- Modify: `app/dashboard/exercises/[id]/page.tsx`

Ensure the detail page shows:
- Full GIF display (with fallback placeholder)
- Complete instructions list
- Target + secondary muscles with visual indicators
- Equipment needed
- Difficulty badge
- "Add to Collection" and "Favorite" actions

### Task 5.2: Add difficulty filter to exercise library

**Files:**
- Modify: `app/dashboard/exercises/page.tsx`
- Modify: `components/features/ExerciseLibrary/ExerciseFilters.tsx` (or ExerciseFiltersAdvanced.tsx)

Add difficulty dropdown (Beginner, Intermediate, Advanced) to the filter bar.

### Task 5.3: Add related exercises section

**Files:**
- Modify: `app/dashboard/exercises/[id]/page.tsx`

At bottom of detail page, show exercises targeting same muscle group (query existing API with same bodyPart filter).

---

## Merge Strategy

1. Merge WT-2 (streak) first - smallest, no conflicts
2. Merge WT-5 (exercise polish) second - small, isolated
3. Merge WT-1 (activity feed) - has schema change
4. Merge WT-3 (profiles) - independent pages
5. Merge WT-4 (analytics) - may touch workout complete route (resolve with WT-1 if conflict)

After all merges: run `npx prisma generate` and `npm run build` to verify.
