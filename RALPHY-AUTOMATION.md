# 🚀 Ralphy Automation Setup

**Created**: 2025-01-30
**Purpose**: Fastest parallel implementation of remaining Epic 004, 005, 006 work

---

## ✅ What's Already Done (Agent A's Code - 9 files)

### API Routes (5 files)
- ✅ `src/app/api/programs/route.ts` - GET/POST programs
- ✅ `src/app/api/programs/[id]/route.ts` - GET/PUT/DELETE
- ✅ `src/app/api/programs/[id]/assign/route.ts` - Client assignment
- ✅ `src/app/api/programs/[id]/duplicate/route.ts` - Duplicate program
- ✅ `src/app/api/programs/templates/route.ts` - Templates

### Service Layer (3 files)
- ✅ `src/services/programService.ts` - API client
- ✅ `src/hooks/usePrograms.ts` - React Query hooks
- ✅ `src/hooks/useProgramTemplates.ts` - Template hooks

### UI Components (1 file)
- ✅ `src/components/programs/ProgramList.tsx` - Program list with filters

**Estimated Time Saved**: 8-10 hours

---

## 🎯 Remaining Work by Epic

### Epic 005: Program Builder (8-10 hours remaining)

**Still Needed:**
- WeekBuilder.tsx
- WorkoutBuilder.tsx
- ExerciseSelector.tsx
- ExerciseConfiguration.tsx
- ProgramPreview.tsx
- ProgramTemplates.tsx
- ClientAssignment.tsx
- ProgramBuilder.tsx (main multi-step form)
- Pages: /programs/new, /programs/[id]/edit, /programs/[id], /programs/templates
- E2E tests

**Ralphy Command:**
```bash
ralphy "Implement remaining Program Builder UI components (WeekBuilder, WorkoutBuilder, ExerciseSelector, ExerciseConfiguration, ProgramPreview, ProgramTemplates, ClientAssignment, ProgramBuilder multi-step form) and all pages following Agent A's code patterns. Ensure all components use existing UI library components (Card, Button, Input, Select). Add proper TypeScript types, error handling, and accessibility." --max-iterations 20
```

---

### Epic 006: Workout Tracking (11-16 hours)

**Backend:** ✅ Already exists (1,298 lines in workoutService.ts)

**Still Needed:**
- 7 Next.js API routes
- Frontend service layer (workoutService.ts, hooks)
- 8 UI components:
  - ActiveWorkoutSession.tsx
  - WorkoutLogger.tsx (main)
  - SetLogger.tsx
  - RestTimer.tsx (with background support)
  - WorkoutHistory.tsx
  - WorkoutDetail.tsx
  - ProgressCharts.tsx
  - OfflineIndicator.tsx
- 4 pages
- Offline support (service worker, IndexedDB)
- E2E tests

**Ralphy Command:**
```bash
ralphy "Implement complete Workout Tracking feature following Agent B's plan. Create 7 API routes (workouts, [id], sets, complete, active, history, progress), service layer, 8 UI components (ActiveWorkoutSession, WorkoutLogger, SetLogger, RestTimer with background support, WorkoutHistory, WorkoutDetail, ProgressCharts, OfflineIndicator), 4 pages, and offline support with IndexedDB. Backend workoutService.ts already exists at backend/src/services/workoutService.ts - use it. Follow Agent A's code patterns from Program Builder." --max-iterations 20
```

---

### Epic 004: Exercise Library (16-22 hours)

**Backend:** ⚠️ Needs creation

**Still Needed:**
- Backend exerciseService.ts
- Exercise import from data source
- 6 Next.js API routes
- Frontend service layer
- 7 UI components:
  - ExerciseBrowser.tsx (main)
  - ExerciseGrid.tsx
  - ExerciseCard.tsx
  - ExerciseDetail.tsx
  - ExerciseFilters.tsx
  - ExerciseSearch.tsx
  - ExerciseImport.tsx
- Performance optimization for 1000+ exercises
- E2E tests

**Ralphy Command:**
```bash
ralphy "Implement complete Exercise Library feature following Agent C's plan. Create backend exerciseService.ts with CRUD operations and import functionality, 6 API routes, service layer, 7 UI components (ExerciseBrowser with search/filters, ExerciseGrid, ExerciseCard, ExerciseDetail with GIFs, ExerciseFilters, ExerciseSearch, ExerciseImport tool). Optimize for 1000+ exercises with lazy loading and caching. Follow Agent A's code patterns from Program Builder." --max-iterations 20
```

---

## ⚡ PARALLEL RALPHY EXECUTION (FASTEST - 18-25 hours)

### Option A: Run 3 Ralphy Processes in Parallel

**Terminal 1:**
```bash
cd C:/Users/drmwe/claude_Code_Workspace/EvoFitTrainer
ralphy "Implement remaining Program Builder UI components (WeekBuilder, WorkoutBuilder, ExerciseSelector, ExerciseConfiguration, ProgramPreview, ProgramTemplates, ClientAssignment, ProgramBuilder multi-step form) and all pages following Agent A's code patterns. Use existing UI components from @/components/ui. Add TypeScript types, error handling, loading states, and accessibility (ARIA labels, keyboard navigation)." --max-iterations 20
```

**Terminal 2:**
```bash
cd C:/Users/drmwe/claude_Code_Workspace/EvoFitTrainer
ralphy "Implement complete Workout Tracking feature following Agent B's plan. Create 7 API routes, service layer, 8 UI components (ActiveWorkoutSession, WorkoutLogger, SetLogger, RestTimer with background support, WorkoutHistory, WorkoutDetail, ProgressCharts, OfflineIndicator), 4 pages, offline support. Use existing backend workoutService.ts. Follow Agent A's code patterns." --max-iterations 20
```

**Terminal 3:**
```bash
cd C:/Users/drmwe/claude_Code_Workspace/EvoFitTrainer
ralphy "Implement complete Exercise Library feature following Agent C's plan. Create backend exerciseService.ts with CRUD and import, 6 API routes, service layer, 7 UI components (ExerciseBrowser with search/filters, ExerciseGrid, ExerciseCard, ExerciseDetail, ExerciseFilters, ExerciseSearch, ExerciseImport). Optimize for 1000+ exercises. Follow Agent A's code patterns." --max-iterations 20
```

**Timeline:** 3 terminals running in parallel = ~18-25 hours total (6-8 hours per epic)

---

## 📋 SEQUENTIAL RALPHY EXECUTION (Safer - 35-48 hours)

If you prefer to run one at a time:

### Step 1: Complete Program Builder (6-8 hours)
```bash
ralphy "Implement remaining Program Builder UI components and pages. Follow Agent A's patterns. Use existing UI components." --max-iterations 15
```

### Step 2: Complete Workout Tracking (11-16 hours)
```bash
ralphy "Implement Workout Tracking feature. Follow Agent B's plan. Use existing backend workoutService.ts." --max-iterations 20
```

### Step 3: Complete Exercise Library (16-22 hours)
```bash
ralphy "Implement Exercise Library feature. Follow Agent C's plan. Optimize for 1000+ exercises." --max-iterations 20
```

**Timeline:** ~35-48 hours total

---

## 🔧 RALPHY CONFIGURATION

Ensure Ralphy is installed:
```bash
# Check if Ralphy is installed
ralphy --version

# If not installed:
npm install -g ralphy
```

---

## 📊 PROGRESS TRACKING

As Ralphy completes each epic, check off:

### Program Builder
- [ ] WeekBuilder component
- [ ] WorkoutBuilder component
- [ ] ExerciseSelector component
- [ ] ExerciseConfiguration component
- [ ] ProgramPreview component
- [ ] ProgramTemplates component
- [ ] ClientAssignment component
- [ ] ProgramBuilder main form
- [ ] Pages created
- [ ] Tests passing

### Workout Tracking
- [ ] API routes created
- [ ] Service layer created
- [ ] ActiveWorkoutSession component
- [ ] WorkoutLogger component
- [ ] SetLogger component
- [ ] RestTimer component
- [ ] WorkoutHistory component
- [ ] WorkoutDetail component
- [ ] ProgressCharts component
- [ ] OfflineIndicator component
- [ ] Pages created
- [ ] Offline support working
- [ ] Tests passing

### Exercise Library
- [ ] Backend exerciseService created
- [ ] Exercises imported
- [ ] API routes created
- [ ] Service layer created
- [ ] ExerciseBrowser component
- [ ] ExerciseGrid component
- [ ] ExerciseCard component
- [ ] ExerciseDetail component
- [ ] ExerciseFilters component
- [ ] ExerciseSearch component
- [ ] ExerciseImport component
- [ ] Performance optimized
- [ ] Tests passing

---

## 🎯 SUCCESS CRITERIA

When all Ralphy tasks complete:

✅ All 3 epics fully implemented
✅ All API routes working
✅ All UI components functional
✅ All tests passing (unit + E2E)
✅ Mobile responsive
✅ Lighthouse score >90
✅ WCAG 2.1 AA compliant
✅ Backend connected
✅ Offline support (Workout Tracking)
✅ Performance optimized (Exercise Library)

---

## 📞 NEXT STEPS

1. **Choose execution method:**
   - Parallel (3 terminals) - FASTEST (18-25h)
   - Sequential (1 terminal) - SAFER (35-48h)

2. **Open terminal(s) and run Ralphy commands**

3. **Monitor progress** - Ralphy will iterate until success or max iterations

4. **Test each epic** as it completes

5. **Commit changes** after each epic completes

---

**Recommended**: Start with Parallel execution for maximum speed. If issues arise, fall back to Sequential.

**Estimated Total Time**: 18-25 hours (parallel) or 35-48 hours (sequential)
