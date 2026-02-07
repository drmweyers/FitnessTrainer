# Comprehensive Unit Testing Protocol - 98% Coverage Target

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Achieve 98% unit test coverage across all API routes, services, hooks, contexts, and key components.

**Architecture:** Jest + React Testing Library. Tests organized by domain. Prisma mocked globally. Auth mocked via shared test utilities.

**Tech Stack:** Jest, @testing-library/react, @testing-library/jest-dom, jest-mock-extended (Prisma mocking)

---

## Testing Strategy

### Priority Order (by blast radius)
1. **Services & Middleware** (lib/) - Core business logic, auth, token handling
2. **API Routes** (app/api/) - All 43 routes, every HTTP method
3. **Hooks** (hooks/) - All 11 custom hooks
4. **Contexts** (contexts/) - Auth context provider
5. **Components** (components/) - Key feature components (not shadcn/ui primitives)

### What We DON'T Test
- shadcn/ui primitives (components/ui/) - tested by library authors
- Type definition files (types/) - no runtime behavior
- Next.js page files that are pure wrappers - only test pages with logic
- Backend Express code (backend/) - separate test suite exists

### Mocking Strategy
- **Prisma**: Global mock using `jest-mock-extended` or manual mock at `__mocks__/@prisma/client`
- **Auth middleware**: Mock `authenticate()` to return test user objects
- **NextRequest/NextResponse**: Use real objects from `next/server`
- **fetch()**: Mock with jest.fn() for frontend services

---

## Parallel Stream Assignment

### Stream 1: Auth & Core Infrastructure
- lib/middleware/auth.ts
- lib/middleware/authorize.ts
- lib/middleware/error-handler.ts
- lib/middleware/rate-limit.ts
- lib/middleware/validation.ts
- lib/services/tokenService.ts
- lib/db/prisma.ts (singleton test)
- lib/utils.ts
- contexts/AuthContext.tsx
- app/api/auth/login/route.ts
- app/api/auth/register/route.ts
- app/api/auth/forgot-password/route.ts
- app/api/health/route.ts

### Stream 2: Exercise Domain
- lib/services/exercise.service.ts
- services/exerciseService.ts
- hooks/useExerciseFilters.ts
- hooks/useFavorites.ts
- hooks/useCollections.ts
- app/api/exercises/route.ts (GET, POST)
- app/api/exercises/[id]/route.ts
- app/api/exercises/search/route.ts
- app/api/exercises/filters/route.ts
- app/api/exercises/favorites/route.ts
- app/api/exercises/collections/route.ts
- app/api/exercises/collections/[id]/route.ts
- app/api/exercises/collections/[id]/exercises/route.ts
- app/api/exercises/by-id/[exerciseId]/route.ts

### Stream 3: Program Domain
- services/programService.ts
- hooks/usePrograms.ts
- hooks/useProgramTemplates.ts
- app/api/programs/route.ts (GET, POST)
- app/api/programs/[id]/route.ts
- app/api/programs/[id]/assign/route.ts
- app/api/programs/[id]/duplicate/route.ts
- app/api/programs/templates/route.ts
- Key components: ProgramCard, ProgramList, ProgramFilters

### Stream 4: Workout Domain
- services/workoutService.ts
- hooks/useWorkouts.ts
- app/api/workouts/route.ts (GET, POST)
- app/api/workouts/[id]/route.ts
- app/api/workouts/[id]/complete/route.ts
- app/api/workouts/[id]/sets/route.ts
- app/api/workouts/active/route.ts
- app/api/workouts/history/route.ts
- app/api/workouts/progress/route.ts
- Key components: ActiveWorkoutSession, RestTimer, SetLogger, WorkoutHistory

### Stream 5: Analytics, Dashboard & Activity
- lib/services/activity.service.ts
- lib/api/analytics.ts
- app/api/activities/route.ts
- app/api/dashboard/stats/route.ts
- app/api/analytics/measurements/route.ts
- app/api/analytics/measurements/me/route.ts
- app/api/analytics/performance/route.ts
- app/api/analytics/performance/me/route.ts
- app/api/analytics/performance/me/personal-bests/route.ts
- app/api/analytics/training-load/me/route.ts
- app/api/analytics/training-load/calculate/route.ts
- app/api/analytics/goals/route.ts
- app/api/analytics/goals/[id]/route.ts
- app/api/analytics/milestones/me/route.ts
- Key components: StatCard, ActivityFeed, ProgressChart

### Stream 6: Profiles, Clients & Shared Components
- services/clientConnectionService.ts
- hooks/useClients.ts
- hooks/useTags.ts
- hooks/useNotes.ts
- hooks/useMediaQuery.ts
- hooks/useTouchGestures.ts
- app/api/profiles/me/route.ts
- app/api/profiles/health/route.ts
- Key components: ClientCard, ClientForm, ProfileForm
- Shared components: Button, Card, Input, Toast, DashboardLayout

---

## Test File Naming Convention
- API routes: `__tests__/api/[domain]/[route].test.ts`
- Services: `__tests__/services/[name].test.ts`
- Hooks: `__tests__/hooks/[name].test.ts`
- Components: `[component]/__tests__/[component].test.tsx`

## Test Patterns

### API Route Test Pattern
```typescript
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/[route]/route';
import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

describe('GET /api/[route]', () => {
  it('returns 401 when unauthenticated', async () => { ... });
  it('returns data for authenticated user', async () => { ... });
  it('handles pagination', async () => { ... });
  it('handles errors gracefully', async () => { ... });
});
```

### Hook Test Pattern
```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';

describe('useMyHook', () => {
  it('returns initial state', () => { ... });
  it('fetches data on mount', async () => { ... });
  it('handles errors', async () => { ... });
});
```
