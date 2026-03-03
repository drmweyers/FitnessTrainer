# EvoFit Trainer: Codebase Analysis & Marketing Business Logic Documentation

## Role

You are a senior product analyst and technical marketing strategist with 15+ years of experience in SaaS product documentation, fitness industry knowledge, and developer-to-marketing translation. You combine deep technical understanding with compelling business storytelling. You know how to read source code, data models, and UI components, then distill them into clear value propositions that a marketing copywriter can immediately use to write website copy, landing pages, ad creative, and sales collateral.

## Objective

Perform a comprehensive three-phase analysis of the EvoFitTrainer codebase and production site to produce a complete, marketing-ready business logic document with visual evidence (screenshots). The final output must be a single deliverable that a copywriter can use -- without any additional technical context -- to write all marketing materials for the platform.

## Context

EvoFitTrainer is a full-stack fitness SaaS platform (an Everfit.io competitor) built for personal trainers and their clients. It is live in production at https://evofittrainer-six.vercel.app. The codebase is located at `C:\Users\drmwe\Claude\EvoFitTrainer`.

### Tech Stack
- Frontend: Next.js 14 App Router, React 18, TypeScript 5.6
- UI: Tailwind CSS 3.4, Radix UI, shadcn/ui, Framer Motion animations
- State: TanStack Query (server state), Jotai (client state)
- Backend: Next.js API routes, PostgreSQL 16 via Prisma 5.22, Redis/Upstash caching
- Auth: JWT (access + refresh tokens), bcryptjs, role-based (trainer/client/admin)
- Deployment: Vercel (production), Docker Compose (development)
- Testing: 4,594 unit tests (Jest), 69 E2E tests (Playwright), 85%+ coverage

### Production Data
- 1,344 exercises with animated GIF demonstrations
- 19 registered users, demo data seeded
- 10 body parts, 29 equipment types, 26 target muscles, 3 difficulty levels

### Known Feature Epics (12 total)
| Epic | Feature | Completion |
|------|---------|------------|
| 001 | User Profiles | ~98% |
| 002 | Authentication | 100% |
| 003 | Client Management | ~98% |
| 004 | Exercise Library | ~99% |
| 005 | Program Builder | ~95% |
| 006 | Workout Tracking | ~98% |
| 007 | Progress Analytics | ~98% |
| 008 | WhatsApp/Messaging | 100% |
| 009 | Scheduling & Calendar | ~95% |
| 010 | Payments | ON HOLD |
| 011 | Mobile PWA | ~40% |
| 012 | Admin Dashboard | ~95% |

---

## Phase 1: Deep Codebase Analysis

### Step 1.1: Read the Data Model

Read the full Prisma schema to understand every entity, relationship, and enum in the system. This is the foundation for understanding what the platform can do.

**File to read:**
```
C:\Users\drmwe\Claude\EvoFitTrainer\backend\prisma\schema.prisma
```

**Chain-of-thought:** For each model, ask yourself:
1. What user-facing feature does this model power?
2. What data points does it capture? Which ones are marketing-relevant?
3. How does it relate to other models? What workflows does it enable?
4. What business value does this data provide to trainers and clients?

**Extract and document:**
- All Prisma models (40+ models)
- All enums (ProgramType, WorkoutType, SetType, GoalType, etc.)
- Key relationships (trainer-client, program-workout-exercise, session-logs-sets)
- JSON fields that store flexible/rich data

### Step 1.2: Read All Page Routes

Read every page.tsx file to understand user-facing screens and navigation flows.

**Files to read (41 pages):**
```
app/page.tsx                                    # Landing page / homepage
app/login/page.tsx                              # Legacy login
app/register/page.tsx                           # Legacy register
app/auth/login/page.tsx                         # Login
app/auth/register/page.tsx                      # Registration
app/auth/forgot-password/page.tsx               # Password recovery
app/auth/reset-password/page.tsx                # Password reset
app/dashboard/page.tsx                          # Main dashboard
app/dashboard/trainer/page.tsx                  # Trainer-specific dashboard
app/dashboard/client/page.tsx                   # Client-specific dashboard
app/dashboard/admin/page.tsx                    # Admin dashboard
app/dashboard/clients/page.tsx                  # Client list (trainer view)
app/dashboard/clients/[id]/page.tsx             # Individual client detail
app/dashboard/exercises/page.tsx                # Exercise library (dashboard)
app/dashboard/exercises/[id]/page.tsx           # Exercise detail (dashboard)
app/dashboard/exercises/collections/[id]/page.tsx # Exercise collection
app/dashboard/exercises/favorites/page.tsx      # Favorite exercises
app/exercises/page.tsx                          # Public exercise library
app/exercises/[type]/page.tsx                   # Exercises by type
app/clients/page.tsx                            # Clients page
app/clients/[clientId]/page.tsx                 # Client detail
app/clients/[clientId]/history/page.tsx         # Client history
app/clients/[clientId]/programs/page.tsx        # Client programs
app/programs/page.tsx                           # Programs list
app/programs/new/page.tsx                       # Create new program
app/workouts/page.tsx                           # Workouts overview
app/workouts/[id]/page.tsx                      # Workout detail
app/workouts/builder/page.tsx                   # Workout builder
app/workouts/log/page.tsx                       # Workout logging
app/workouts/history/page.tsx                   # Workout history
app/workouts/progress/page.tsx                  # Workout progress
app/workout-tracker/page.tsx                    # Real-time workout tracker
app/profile/page.tsx                            # User profile
app/profile/edit/page.tsx                       # Edit profile
app/profile/health/page.tsx                     # Health questionnaire
app/schedule/page.tsx                           # Schedule / calendar
app/schedule/availability/page.tsx              # Trainer availability
app/analytics/page.tsx                          # Progress analytics
app/admin/page.tsx                              # Admin panel
app/admin/users/page.tsx                        # User management
app/admin/users/[id]/page.tsx                   # User detail (admin)
app/admin/system/page.tsx                       # System health
```

**Chain-of-thought:** For each page, identify:
1. What role(s) can access this page? (trainer, client, admin, public)
2. What is the primary user action on this page?
3. What data is displayed? What CRUD operations are available?
4. What is the emotional/business value of this screen?

### Step 1.3: Read All API Routes

Read every API route handler to understand backend capabilities and data flows.

**Files to read (65+ API routes):**
```
# Auth (6 routes)
app/api/auth/login/route.ts
app/api/auth/register/route.ts
app/api/auth/me/route.ts
app/api/auth/forgot-password/route.ts
app/api/auth/reset-password/route.ts

# Profiles (5 routes)
app/api/profiles/me/route.ts
app/api/profiles/me/photo/route.ts
app/api/profiles/health/route.ts
app/api/profiles/certifications/route.ts
app/api/profiles/certifications/[id]/route.ts
app/api/profiles/progress-photos/route.ts

# Clients (4 routes)
app/api/clients/route.ts
app/api/clients/trainer/route.ts
app/api/clients/[id]/status/route.ts

# Exercises (9 routes)
app/api/exercises/route.ts
app/api/exercises/search/route.ts
app/api/exercises/filters/route.ts
app/api/exercises/[id]/route.ts
app/api/exercises/by-id/[exerciseId]/route.ts
app/api/exercises/favorites/route.ts
app/api/exercises/collections/route.ts
app/api/exercises/collections/[id]/route.ts
app/api/exercises/collections/[id]/exercises/route.ts

# Programs (5 routes)
app/api/programs/route.ts
app/api/programs/templates/route.ts
app/api/programs/[id]/route.ts
app/api/programs/[id]/assign/route.ts
app/api/programs/[id]/duplicate/route.ts

# Workouts (7 routes)
app/api/workouts/route.ts
app/api/workouts/active/route.ts
app/api/workouts/history/route.ts
app/api/workouts/progress/route.ts
app/api/workouts/[id]/route.ts
app/api/workouts/[id]/complete/route.ts
app/api/workouts/[id]/sets/route.ts

# Analytics (12 routes)
app/api/analytics/measurements/route.ts
app/api/analytics/measurements/me/route.ts
app/api/analytics/measurements/[id]/route.ts
app/api/analytics/milestones/route.ts
app/api/analytics/milestones/me/route.ts
app/api/analytics/performance/route.ts
app/api/analytics/performance/me/route.ts
app/api/analytics/performance/me/personal-bests/route.ts
app/api/analytics/personal-bests/route.ts
app/api/analytics/reports/route.ts
app/api/analytics/training-load/route.ts
app/api/analytics/training-load/me/route.ts
app/api/analytics/training-load/calculate/route.ts
app/api/analytics/goals/route.ts
app/api/analytics/goals/[id]/route.ts
app/api/analytics/goals/[id]/progress/route.ts

# Schedule (4 routes)
app/api/schedule/appointments/route.ts
app/api/schedule/appointments/[id]/route.ts
app/api/schedule/availability/route.ts
app/api/schedule/slots/route.ts

# Admin (4 routes)
app/api/admin/dashboard/route.ts
app/api/admin/users/route.ts
app/api/admin/users/[id]/route.ts
app/api/admin/system/health/route.ts

# Other (3 routes)
app/api/activities/route.ts
app/api/dashboard/stats/route.ts
app/api/health/route.ts
```

**Chain-of-thought:** For each API route, identify:
1. HTTP methods supported (GET, POST, PUT, DELETE, PATCH)
2. What data does it return or modify?
3. What authentication/authorization is required?
4. What user-facing feature does it serve?

### Step 1.4: Read All Feature Components

Read every component in `components/features/` to understand UI capabilities and user interactions.

**Component groups to read:**

```
# Analytics (6 components)
components/features/Analytics/BodyCompositionChart.tsx
components/features/Analytics/MeasurementTracker.tsx
components/features/Analytics/MultiLineChart.tsx
components/features/Analytics/PhotoGallery.tsx
components/features/Analytics/PhotoUpload.tsx
components/features/Analytics/ProgressChart.tsx

# Calendar (4 components)
components/features/Calender/CalenderGrid.tsx
components/features/Calender/DayCell.tsx
components/features/Calender/WeekRow.tsx
components/features/Calender/WorkoutCard.tsx

# Client Dashboard (8 components)
components/features/ClientDashboard/ClientProfile.tsx
components/features/ClientDashboard/ClientProgramDashboard.tsx
components/features/ClientDashboard/EnhancedClientDashboard.tsx
components/features/ClientDashboard/GoalsSection.tsx
components/features/ClientDashboard/LimitationsSection.tsx
components/features/ClientDashboard/MetricsDisplay.tsx
components/features/ClientDashboard/NotesSection.tsx
components/features/ClientDashboard/TrainingOverview.tsx

# Client Management (3 components)
components/features/ClientManagement/ClientConnectionList.tsx
components/features/ClientManagement/InvitationNotifications.tsx
components/features/ClientManagement/InviteClientModal.tsx

# Exercise Library (10 components)
components/features/ExerciseLibrary/ExerciseLibrary.tsx
components/features/ExerciseLibrary/ExerciseGrid.tsx
components/features/ExerciseLibrary/ExerciseGridSkeleton.tsx
components/features/ExerciseLibrary/ExerciseCardMobile.tsx
components/features/ExerciseLibrary/ExerciseDetailView.tsx
components/features/ExerciseLibrary/ExerciseFiltersAdvanced.tsx
components/features/ExerciseLibrary/RelatedExercises.tsx
components/features/ExerciseLibrary/CollectionManager.tsx
components/features/ExerciseLibrary/GifPlayer.tsx
components/features/ExerciseLibrary/GifPlayerMobile.tsx

# Exercise Filters (1 component)
components/features/ExerciseFilters/ExerciseFilters.tsx

# Program Builder (10 components)
components/features/ProgramBuilder/ProgramBuilder.tsx
components/features/ProgramBuilder/ProgramBuilderContext.tsx
components/features/ProgramBuilder/ProgramForm.tsx
components/features/ProgramBuilder/ProgramPreview.tsx
components/features/ProgramBuilder/ExerciseSelector.tsx
components/features/ProgramBuilder/WeekBuilder.tsx
components/features/ProgramBuilder/WorkoutBuilder.tsx
components/features/ProgramBuilder/SupersetBuilder.tsx
components/features/ProgramBuilder/ProgressionBuilder.tsx
components/features/ProgramBuilder/RPEIntegration.tsx
components/features/ProgramBuilder/TemplateLibrary.tsx

# Programs (4 components)
components/features/Programs/ProgramCard.tsx
components/features/Programs/ProgramFilters.tsx
components/features/Programs/ProgramList.tsx
components/features/Programs/BulkAssignmentModal.tsx

# Trainer Dashboard (2 components)
components/features/TrainerDashboard/EnhancedTrainerDashboard.tsx
components/features/TrainerDashboard/TrainerProgressDashboard.tsx

# AI Workout Builder (1 component)
components/features/AIWorkoutBuilder/AIWorkoutBuilder.tsx

# Workout Builder / Modal (2 components)
components/features/WorkoutBuilder/WorkoutBuilder.tsx
components/features/WorkoutModal/WorkoutModal.tsx

# Dashboard (1 component)
components/features/Dashboard/ProfileCompletionWidget.tsx

# Profile (1 component)
components/features/Profile/ProgressPhotosGallery.tsx

# Exercise List (1 component)
components/features/ExerciseList/ExerciseList.tsx
```

**Chain-of-thought:** For each component, extract:
1. What does the user see and interact with?
2. What props/state does it manage? What API calls does it make?
3. What micro-interactions exist (animations, loading states, error handling)?
4. What is the UX quality level? (responsive? accessible? polished?)

### Step 1.5: Read Supporting Infrastructure

Read key service files, middleware, and utilities that reveal platform capabilities.

**Files to read:**
```
lib/services/exercise.service.ts        # Exercise search, filter, pagination
lib/services/activity.service.ts        # Activity feed logic
lib/services/tokenService.ts            # JWT token management
lib/services/email.ts                   # Email service (Mailgun)
lib/services/appointments.ts            # Scheduling service
lib/middleware/auth.ts                   # Authentication middleware
lib/middleware/authorize.ts             # Role-based authorization
lib/middleware/rate-limit.ts            # Rate limiting
lib/middleware/validation.ts            # Input validation
lib/api/apiClient.ts                    # Frontend API client
lib/api/auth.ts                         # Auth API helpers
lib/api/clients.ts                      # Client API helpers
lib/api/programs.ts                     # Program API helpers
lib/api/analytics.ts                    # Analytics API helpers
lib/offline/indexedDB.ts                # Offline storage (PWA)
lib/offline/syncManager.ts             # Offline sync logic
lib/utils/streakCalculator.ts          # Training streak calculation
```

### Step 1.6: Read Navigation and Layout

```
components/navigation/MainNavigation.tsx    # Primary nav bar
components/navigation/MobileMenu.tsx        # Mobile navigation
components/navigation/BreadcrumbNav.tsx     # Breadcrumb trail
components/navigation/UserMenu.tsx          # User dropdown menu
components/navigation/NavigationItem.tsx    # Nav item component
components/layout/Layout.tsx                # Page layout wrapper
components/shared/DashboardLayout.tsx       # Dashboard layout
components/shared/ActivityFeed.tsx          # Activity feed
components/shared/QuickActions.tsx          # Quick action buttons
components/shared/StatCard.tsx              # Statistics card
```

### Step 1.7: Read Existing Documentation

Read these docs for additional context on business logic and feature descriptions.

```
docs/prd.md                         # Full Product Requirements Document
docs/businesslogic.md               # Business logic guide
docs/architecture.md                # System architecture
docs/epics/epic-001-user-profiles.md
docs/epics/epic-002-authentication.md
docs/epics/epic-003-client-management.md
docs/epics/epic-004-exercise-library.md
docs/epics/epic-005-program-builder.md
docs/epics/epic-006-workout-tracking.md
docs/epics/epic-007-progress-analytics.md
docs/epics/epic-009-scheduling-calendar.md
docs/epics/epic-012-admin-dashboard.md
```

---

## Phase 2: Browser Screenshot Capture

Navigate the live production site and capture screenshots of every major page and feature. Use Playwright or the browser automation tool available.

### Screenshot Methodology

**Base URL:** `https://evofittrainer-six.vercel.app`

**Viewport sizes to capture:**
- Desktop: 1440x900
- Mobile: 390x844 (iPhone 14 Pro equivalent)

**Screenshot naming convention:**
```
screenshots/[section]/[page-name]-[viewport].png
```

### Screenshot Capture Plan

#### Public Pages (no auth required)
| # | Page | URL | Screenshot Name |
|---|------|-----|-----------------|
| 1 | Landing Page / Homepage | `/` | `public/homepage-desktop.png` |
| 2 | Landing Page (mobile) | `/` | `public/homepage-mobile.png` |
| 3 | Login Page | `/auth/login` | `public/login-desktop.png` |
| 4 | Registration Page | `/auth/register` | `public/register-desktop.png` |
| 5 | Forgot Password | `/auth/forgot-password` | `public/forgot-password-desktop.png` |
| 6 | Public Exercise Library | `/exercises` | `public/exercises-desktop.png` |

#### Trainer Dashboard (auth as trainer)
**Login credentials:** Use a valid trainer account.

| # | Page | URL | Screenshot Name |
|---|------|-----|-----------------|
| 7 | Trainer Dashboard | `/dashboard` | `trainer/dashboard-desktop.png` |
| 8 | Trainer Dashboard (mobile) | `/dashboard` | `trainer/dashboard-mobile.png` |
| 9 | Client List | `/dashboard/clients` or `/clients` | `trainer/clients-list-desktop.png` |
| 10 | Client Detail | `/dashboard/clients/[id]` or `/clients/[id]` | `trainer/client-detail-desktop.png` |
| 11 | Client History | `/clients/[id]/history` | `trainer/client-history-desktop.png` |
| 12 | Client Programs | `/clients/[id]/programs` | `trainer/client-programs-desktop.png` |
| 13 | Exercise Library (dashboard) | `/dashboard/exercises` | `trainer/exercises-library-desktop.png` |
| 14 | Exercise Detail | `/dashboard/exercises/[id]` | `trainer/exercise-detail-desktop.png` |
| 15 | Favorite Exercises | `/dashboard/exercises/favorites` | `trainer/exercises-favorites-desktop.png` |
| 16 | Programs List | `/programs` | `trainer/programs-list-desktop.png` |
| 17 | Create New Program | `/programs/new` | `trainer/program-create-desktop.png` |
| 18 | Workouts Overview | `/workouts` | `trainer/workouts-overview-desktop.png` |
| 19 | Workout Builder | `/workouts/builder` | `trainer/workout-builder-desktop.png` |
| 20 | Workout Tracker | `/workout-tracker` | `trainer/workout-tracker-desktop.png` |
| 21 | Workout History | `/workouts/history` | `trainer/workout-history-desktop.png` |
| 22 | Workout Progress | `/workouts/progress` | `trainer/workout-progress-desktop.png` |
| 23 | Analytics Dashboard | `/analytics` | `trainer/analytics-desktop.png` |
| 24 | Analytics (mobile) | `/analytics` | `trainer/analytics-mobile.png` |
| 25 | Schedule / Calendar | `/schedule` | `trainer/schedule-desktop.png` |
| 26 | Availability Settings | `/schedule/availability` | `trainer/availability-desktop.png` |
| 27 | Profile | `/profile` | `trainer/profile-desktop.png` |
| 28 | Edit Profile | `/profile/edit` | `trainer/profile-edit-desktop.png` |
| 29 | Health Profile | `/profile/health` | `trainer/health-profile-desktop.png` |
| 30 | Trainer-Specific Dashboard | `/dashboard/trainer` | `trainer/trainer-dashboard-desktop.png` |

#### Admin Pages (auth as admin)
| # | Page | URL | Screenshot Name |
|---|------|-----|-----------------|
| 31 | Admin Dashboard | `/admin` or `/dashboard/admin` | `admin/dashboard-desktop.png` |
| 32 | User Management | `/admin/users` | `admin/users-desktop.png` |
| 33 | User Detail (admin) | `/admin/users/[id]` | `admin/user-detail-desktop.png` |
| 34 | System Health | `/admin/system` | `admin/system-health-desktop.png` |

#### Client Pages (auth as client)
| # | Page | URL | Screenshot Name |
|---|------|-----|-----------------|
| 35 | Client Dashboard | `/dashboard/client` | `client/dashboard-desktop.png` |
| 36 | Client Dashboard (mobile) | `/dashboard/client` | `client/dashboard-mobile.png` |

### Screenshot Execution Script

Use Playwright to capture screenshots. Here is the approach:

```typescript
// Pseudocode - adapt to your browser automation tool
import { chromium } from 'playwright';

const BASE_URL = 'https://evofittrainer-six.vercel.app';

// 1. Open browser
// 2. Navigate to login page
// 3. Authenticate as trainer
// 4. Iterate through each page URL
// 5. Wait for page load (networkidle)
// 6. Take full-page screenshot at desktop viewport
// 7. Resize to mobile viewport
// 8. Take mobile screenshot
// 9. Save to screenshots/ directory
// 10. Repeat for admin and client roles
```

**Important screenshot instructions:**
- Wait for `networkidle` before capturing
- Scroll to reveal lazy-loaded content where applicable
- Capture full-page screenshots (not just viewport)
- If a page requires specific data, note what data should be visible
- If a page shows "no data" states, capture that too (useful for empty-state marketing)

---

## Phase 3: Marketing Business Logic Document

### Output File

Write the final document to:
```
C:\Users\drmwe\Claude\EvoFitTrainer\docs\marketing\evofit-marketing-business-logic.md
```

### Document Structure

The marketing document MUST follow this exact structure:

```markdown
# EvoFit Trainer - Marketing Business Logic Document
**Generated:** [Date]
**Version:** 1.0
**Purpose:** Comprehensive feature reference for marketing copywriters
**Production URL:** https://evofittrainer-six.vercel.app

---

## Executive Summary

[2-3 paragraph overview of the platform, its market position, target audience,
and key differentiators. Written in marketing language, not technical language.
Include specific numbers: 1,344 exercises, 3 user roles, 12 feature areas.]

---

## Target Audience Profiles

### Primary: Independent Personal Trainers
[Persona description, pain points, how EvoFit solves them]

### Secondary: Fitness Clients
[Persona description, motivations, how EvoFit serves them]

### Tertiary: Gym Administrators
[Persona description, operational needs, how EvoFit helps]

---

## Feature Deep Dives

[For EACH of the 12 feature areas, provide the following structure:]

### [Feature Number]. [Feature Name]

**One-Line Pitch:** [Single sentence that could be a headline]

**Description:** [2-3 paragraph explanation of what this feature does,
written for a non-technical reader]

**Key Capabilities:**
- [Capability 1 with specific detail]
- [Capability 2 with specific detail]
- [Capability 3 with specific detail]
- [Continue for all capabilities discovered in codebase]

**User Benefits:**
| Benefit | Description |
|---------|-------------|
| [Benefit Name] | [How it helps the user, with emotional appeal] |

**Data Points for Marketing:**
- [Specific numbers, counts, measurements that can be used in copy]
- [Example: "1,344 exercises across 10 body parts and 29 equipment types"]

**Competitive Differentiator:**
[What makes this feature stand out vs Everfit, TrueCoach, Trainerize]

**Suggested Marketing Copy Angles:**
1. [Headline/tagline suggestion]
2. [Value proposition angle]
3. [Social proof / credibility angle]

**Screenshots:**
- Desktop: `screenshots/[section]/[name]-desktop.png`
- Mobile: `screenshots/[section]/[name]-mobile.png`

**Technical Notes for Copywriter:**
[Any technical constraints, limitations, or "coming soon" features the
copywriter should be aware of]

---

## Feature Areas to Document (use the structure above for each):

1. **User Profiles & Onboarding**
   - Profile creation and completion tracking
   - Health questionnaire
   - Fitness goals setting
   - Trainer certifications and specializations
   - Progress photos
   - Profile completion widget/gamification

2. **Authentication & Security**
   - Registration flow (trainer/client roles)
   - Login with JWT tokens
   - Password recovery (email-based)
   - Session management
   - Rate limiting and security audit logs
   - Account lockout protection

3. **Client Management**
   - Client roster with status tracking (active, pending, offline, archived, need_programming)
   - Client invitation system (email invitations with tokens)
   - Client profiles with medical conditions, injuries, fitness level
   - Client notes and tagging system (color-coded tags)
   - Client-trainer relationship management
   - Bulk operations

4. **Exercise Library**
   - 1,344 exercises from ExerciseDB
   - Animated GIF demonstrations for every exercise
   - 10 body part categories
   - 29 equipment types
   - 26 target muscle groups
   - 3 difficulty levels (beginner, intermediate, advanced)
   - Advanced search and multi-filter system
   - Favorite exercises
   - Custom exercise collections
   - Exercise detail views with instructions and secondary muscles
   - Related exercises suggestions
   - Mobile-optimized cards and GIF player

5. **Program Builder**
   - Multi-week program design
   - 8 program types (strength, hypertrophy, endurance, powerlifting, bodybuilding, general_fitness, sport_specific, rehabilitation)
   - Week-by-week structure with deload weeks
   - Workout builder with exercise ordering
   - Superset and circuit builder (A/B/C grouping)
   - Set configuration (warmup, working, drop, pyramid, AMRAP, cluster, rest_pause)
   - RPE and RIR integration
   - Tempo prescriptions (e.g., "3-1-2-0")
   - Weight guidance (%, RPE, bodyweight)
   - Progressive overload planning
   - Program templates (save and reuse)
   - Program duplication
   - Client assignment with custom notes
   - Bulk assignment modal
   - Program preview

6. **Workout Tracking & Logging**
   - Real-time workout session tracking
   - Set-by-set logging (planned vs actual reps, weight, RPE)
   - Rest timer between sets
   - Personal best detection
   - Workout completion with summary
   - Session metrics (total volume, completed sets, average RPE, adherence score)
   - User feedback (effort rating, enjoyment rating, energy before/after)
   - Trainer feedback on sessions
   - Active workout indicator
   - Workout history timeline
   - Offline workout support (IndexedDB + sync)

7. **Progress Analytics**
   - Body composition charts
   - Measurement tracking (weight, body fat, muscle mass, custom measurements)
   - Multi-line progress charts with time ranges
   - Performance metrics (1RM, volume, endurance, power, speed)
   - Personal bests tracking and display
   - Training load monitoring (acute vs chronic load, ACWR ratio)
   - Goal tracking with progress percentages
   - Goal progress over time
   - Milestone achievements
   - AI-powered insights (prioritized recommendations)
   - Analytics reports (downloadable)
   - Chart preferences and customization
   - Comparison baselines
   - Photo gallery for progress photos

8. **Messaging & Communication (WhatsApp Integration)**
   - WhatsApp number on user profiles
   - In-app activity feed
   - Notification system for invitations

9. **Scheduling & Calendar**
   - Calendar grid view (monthly)
   - Weekly and daily views
   - Trainer availability configuration (day-of-week, start/end times, location)
   - Appointment booking (5 types: one-on-one, group, assessment, consultation, online)
   - Appointment status tracking (scheduled, confirmed, completed, cancelled, no_show)
   - Online session support with meeting links
   - Duration-based scheduling
   - Location support

10. **Payments & Subscriptions** (ON HOLD - document as "coming soon")
    - Planned pricing tiers
    - Session packages
    - Subscription management
    - Invoice generation
    - Revenue tracking

11. **Mobile PWA Support** (~40% complete)
    - Responsive design across all pages
    - Mobile-optimized exercise cards
    - Mobile GIF player
    - Offline workout tracking (IndexedDB)
    - Sync manager for reconnection
    - Mobile navigation (hamburger menu)

12. **Admin Dashboard**
    - Platform-wide statistics
    - User management (list, search, edit, activate/deactivate)
    - System health monitoring
    - Role management (trainer/client/admin)
    - Dashboard statistics

---

## User Flows (for copywriter context)

Document these key user journeys:

### Trainer Onboarding Flow
1. Register -> Select "Trainer" role -> Complete profile -> Add certifications -> Set availability -> Invite first client

### Client Onboarding Flow
1. Receive email invitation -> Register -> Complete health questionnaire -> Set goals -> View assigned program -> Start first workout

### Program Creation Flow
1. Create program -> Name + type + difficulty -> Build weeks -> Add workouts -> Add exercises -> Configure sets/reps/weights -> Preview -> Save as template -> Assign to client(s)

### Workout Logging Flow
1. View today's workout -> Start session -> Log each set (reps, weight, RPE) -> Use rest timer -> Complete workout -> View summary with personal bests -> Rate effort and enjoyment

### Progress Review Flow
1. Open analytics -> View body composition trends -> Check personal bests -> Review training load -> Track goal progress -> Generate report

---

## Platform Statistics (for marketing copy)

Compile all hard numbers from the codebase:

| Metric | Value | Source |
|--------|-------|--------|
| Total exercises | 1,344 | Exercise DB seed |
| Body part categories | 10 | Prisma enum / exercise data |
| Equipment types | 29 | Exercise data |
| Target muscle groups | 26 | Exercise data |
| Difficulty levels | 3 | Prisma enum |
| Program types | 8 | ProgramType enum |
| Workout types | 6 | WorkoutType enum |
| Set types | 7 | SetType enum |
| Goal types | 8 | GoalType enum |
| User roles | 3 | Role enum (trainer, client, admin) |
| Appointment types | 5 | AppointmentType enum |
| Client statuses | 5 | ClientStatus enum |
| Metric types tracked | 8 | MetricType enum |
| API endpoints | 65+ | API route count |
| Pages/screens | 41 | Page route count |
| Feature components | 50+ | Component count |
| Unit tests | 4,594 | Jest suite |
| E2E tests | 69 | Playwright suite |
| Test coverage | 85%+ | Jest coverage |

---

## Competitive Positioning Matrix

| Feature | EvoFit | Everfit | TrueCoach | Trainerize |
|---------|--------|---------|-----------|------------|
| Exercise Library Size | 1,344+ | ~1,500 | ~800 | ~1,000 |
| GIF Demonstrations | Yes | Yes | Video | Video |
| Program Builder | Advanced | Advanced | Basic | Medium |
| Superset/Circuit Support | Yes | Yes | Limited | Yes |
| RPE/RIR Integration | Yes | Limited | No | No |
| Progressive Overload | Yes | Yes | Manual | Limited |
| Offline Support | Yes (PWA) | App only | No | App only |
| Training Load Monitoring | ACWR | Basic | No | No |
| AI Insights | Yes | No | No | Basic |
| Calendar/Scheduling | Built-in | Built-in | External | Basic |
| Custom Pricing | Affordable | $$$$ | $$$ | $$$ |

[Note: Competitor data should be verified. Use best available knowledge.]

---

## Tone & Voice Guidelines for Copywriter

Based on existing copy in the codebase (homepage, UI labels, CTAs):

- **Tone:** Professional but approachable, confident but not arrogant
- **Voice:** Active, direct, benefit-focused
- **Vocabulary:** "Transform", "Elevate", "Professional", "Powerful", "Seamless"
- **Avoid:** Overly technical jargon, hyperbole without proof, passive voice
- **CTAs observed:** "Get Started Free", "Create Your Account", "Sign In to Dashboard"
- **Brand tagline:** "Transform Your Fitness Business"
- **Supporting tagline:** "The all-in-one platform for personal trainers"
- **Brand color:** Blue (#2563eb) with indigo accents

---

## Appendix A: Complete File Inventory

[List all files read during analysis with their purpose]

## Appendix B: Screenshot Inventory

[Table of all screenshots captured with descriptions]

## Appendix C: Data Model Summary

[Simplified ERD description showing key entities and relationships]
```

---

## Example Output (for one feature section)

Here is an example of the expected output quality for the Exercise Library section:

```markdown
### 4. Exercise Library

**One-Line Pitch:** Access 1,344 professional exercises with animated demonstrations, advanced filters, and personal collections -- the largest built-in exercise database in its class.

**Description:**
The Exercise Library is the foundation of every training program on EvoFit. Trainers and clients can browse, search, and filter through 1,344 professionally curated exercises, each with an animated GIF demonstration showing proper form. Every exercise includes step-by-step instructions, target and secondary muscle identification, equipment requirements, and difficulty classification.

Unlike competitors that rely on static images or require trainers to upload their own content, EvoFit provides a ready-to-use library on day one. Trainers can build personal favorite lists and custom collections (e.g., "Knee Rehab Exercises" or "Home Workout Essentials") to speed up program creation.

The advanced filter system lets users narrow exercises by body part (10 categories), equipment type (29 types), target muscle (26 groups), and difficulty level (3 tiers) -- simultaneously. Full-text search with autocomplete makes finding the right exercise instant.

**Key Capabilities:**
- 1,344 exercises with animated GIF demonstrations
- 10 body part categories (neck, shoulders, chest, back, upper arms, lower arms, waist, upper legs, lower legs, cardio)
- 29 equipment types (body weight, barbell, dumbbell, cable, resistance bands, machines, and 23 more)
- 26 target muscle groups with secondary muscle mapping
- 3 difficulty levels (beginner, intermediate, advanced)
- Full-text search with instant results
- Multi-filter stacking (body part + equipment + muscle + difficulty simultaneously)
- Favorite exercises for quick access
- Custom exercise collections with ordering
- Detailed exercise view with step-by-step instructions
- Related exercises suggestions based on target muscles
- Mobile-optimized card layout with touch-friendly GIF player
- Responsive grid with skeleton loading states

**User Benefits:**
| Benefit | Description |
|---------|-------------|
| Save hours of content creation | No need to film, edit, or upload exercise demonstrations |
| Professional client experience | Animated GIFs show exactly how to perform each movement |
| Find any exercise instantly | Advanced search + filters narrow 1,344 exercises to exactly what you need |
| Build your toolkit | Favorite exercises and custom collections speed up program creation |
| Mobile gym companion | Mobile-optimized cards and GIF player work perfectly in the gym |

**Data Points for Marketing:**
- "1,344 exercises with animated GIF demonstrations"
- "10 body part categories, 29 equipment types, 26 target muscle groups"
- "Find the perfect exercise in seconds with advanced multi-filter search"
- "Build custom collections like 'Knee Rehab' or 'Home Workout Essentials'"

**Competitive Differentiator:**
EvoFit ships with 1,344 ready-to-use exercises from day one -- no setup, no uploading, no content creation needed. Each exercise has an animated GIF (not a static image), step-by-step instructions, and complete muscle mapping. Most competitors require trainers to build their own library or offer significantly smaller built-in databases.

**Suggested Marketing Copy Angles:**
1. "1,344 exercises. Zero setup. Start building programs in minutes."
2. "Every exercise demonstrated with animated form guides -- your clients never guess."
3. "Filter by body part, equipment, muscle, or difficulty. Find the perfect exercise in seconds."

**Screenshots:**
- Desktop: `screenshots/trainer/exercises-library-desktop.png`
- Mobile: `screenshots/trainer/exercises-library-mobile.png`
- Detail: `screenshots/trainer/exercise-detail-desktop.png`

**Technical Notes for Copywriter:**
- Custom exercise creation (trainer-uploaded exercises) is not yet implemented -- focus on the built-in library
- Exercise GIFs are sourced from ExerciseDB, a professional exercise database
- Photo uploads are deferred post-MVP (routes return "coming soon")
```

---

## Execution Instructions

### Prerequisites
- Access to the codebase at `C:\Users\drmwe\Claude\EvoFitTrainer`
- Browser automation tool (Playwright recommended) for screenshots
- Valid login credentials for trainer, client, and admin accounts
- Internet access to reach `https://evofittrainer-six.vercel.app`

### Execution Order
1. **Phase 1** (Codebase Analysis): Read all files listed above, building understanding progressively from data model to pages to components
2. **Phase 2** (Screenshots): Navigate production site and capture all screenshots
3. **Phase 3** (Document): Write the marketing business logic document, using insights from Phase 1 and referencing screenshots from Phase 2

### Output Files
1. `C:\Users\drmwe\Claude\EvoFitTrainer\docs\marketing\evofit-marketing-business-logic.md` -- The main marketing document
2. `C:\Users\drmwe\Claude\EvoFitTrainer\docs\marketing\screenshots\` -- Directory containing all captured screenshots
3. `C:\Users\drmwe\Claude\EvoFitTrainer\docs\marketing\screenshot-inventory.md` -- Inventory of all screenshots with descriptions

### Quality Checklist

Before delivering the final document, verify:

- [ ] All 12 feature areas are documented with the full template structure
- [ ] Every feature section includes: one-line pitch, description, key capabilities, user benefits, data points, competitive differentiator, marketing copy angles, screenshots, technical notes
- [ ] All specific numbers are accurate (cross-referenced with codebase)
- [ ] Screenshots captured for all 36 planned pages
- [ ] User flows are documented for all 5 key journeys
- [ ] Platform statistics table is complete with accurate counts
- [ ] Competitive positioning matrix is filled in
- [ ] Tone and voice guidelines are documented
- [ ] No technical jargon remains unexplained
- [ ] A copywriter could use this document without asking a single technical question
- [ ] Document is properly formatted with consistent heading hierarchy
- [ ] All file paths in screenshot references are correct

### Estimated Effort
- Phase 1 (Codebase Analysis): ~45-60 minutes
- Phase 2 (Screenshots): ~20-30 minutes
- Phase 3 (Document Writing): ~60-90 minutes
- Total: ~2-3 hours

---

## Constraints

- Do NOT invent features that do not exist in the codebase
- Do NOT include features marked as "ON HOLD" or "0%" as if they are live -- clearly label them as "Coming Soon"
- Do NOT use technical implementation details in marketing copy (no mention of Prisma, JWT, PostgreSQL, etc.)
- DO translate technical capabilities into user benefits
- DO use specific numbers wherever possible (they build credibility)
- DO maintain accuracy -- every claim must be traceable to the codebase
- DO write for a non-technical copywriter audience
- DO include "coming soon" features with appropriate labeling for future marketing planning
