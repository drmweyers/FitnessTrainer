# EvoFit Trainer - Business Logic & Feature Reference

## Overview

EvoFit Trainer is a full-stack fitness SaaS platform designed for personal trainers, gym owners, and their clients. It provides tools to build training programs, track workouts, manage client relationships, and analyze progress -- all from a single web application.

The platform is built on Next.js 14 with React 18, TypeScript, Prisma ORM with PostgreSQL, and uses JWT-based authentication with role-based access control.

---

## User Roles

### Administrator
- Full platform oversight and configuration
- Manage all users (trainers and clients)
- Curate the global exercise library
- View platform-wide analytics and metrics
- Access all features available to trainers and clients

### Trainer
- Manage a personal roster of clients
- Create and assign training programs
- Build workouts using the exercise library
- Track client workout completion and progress
- View analytics for their clients
- Communicate with clients (future)

### Client
- Follow assigned training programs
- Log workouts in real time with set tracking
- Track personal records and milestones
- View progress analytics and body measurements
- Set and track fitness goals

---

## Core Features

### 1. Authentication & Authorization

Secure JWT-based authentication with role-based access control.

**Capabilities:**
- Email/password registration with role selection (Trainer or Client)
- Login with JWT access tokens (15-minute expiry) and refresh tokens (7-day expiry)
- Password reset via forgot-password flow
- Role-based navigation (each role sees a tailored sidebar)
- Protected API routes with middleware authentication
- Token stored in localStorage as `accessToken`

**Routes:**
- `POST /api/auth/register` -- Create new account with role
- `POST /api/auth/login` -- Authenticate and receive tokens
- `POST /api/auth/forgot-password` -- Initiate password reset

---

### 2. Dashboard

Role-specific dashboard providing an at-a-glance overview of key metrics.

**Capabilities:**
- Quick stats (active clients, workouts this week, programs, etc.)
- Quick action links to common tasks
- Activity feed showing recent events
- Tailored layout per role (admin, trainer, client)

**Routes:**
- `GET /api/dashboard/stats` -- Aggregated statistics for the authenticated user

---

### 3. Exercise Library

A comprehensive database of 1,300+ exercises with filtering, search, favorites, and collections.

**Capabilities:**
- Browse exercises with grid or list view toggle
- Filter by body part, equipment, target muscle, and difficulty
- Full-text search across exercise names and attributes
- Favorite exercises for quick access
- Create custom collections (named groups of exercises)
- Exercise detail view with instructions, muscle targeting, and media
- Category pages (strength, cardio, flexibility, balance)

**Routes:**
- `GET /api/exercises` -- List exercises with pagination and filters
- `POST /api/exercises` -- Create custom exercise
- `GET /api/exercises/[id]` -- Get exercise details
- `PUT /api/exercises/[id]` -- Update exercise
- `DELETE /api/exercises/[id]` -- Delete exercise
- `GET /api/exercises/search` -- Full-text search
- `GET /api/exercises/filters` -- Available filter options
- `GET /api/exercises/favorites` -- User's favorited exercises
- `POST /api/exercises/favorites` -- Add to favorites
- `DELETE /api/exercises/favorites` -- Remove from favorites
- `GET /api/exercises/collections` -- User's exercise collections
- `POST /api/exercises/collections` -- Create collection
- `GET /api/exercises/collections/[id]` -- Get collection details
- `PUT /api/exercises/collections/[id]` -- Update collection
- `DELETE /api/exercises/collections/[id]` -- Delete collection
- `GET /api/exercises/by-id/[exerciseId]` -- Lookup by exercise ID

---

### 4. Program Builder

Design multi-week training programs that can be assigned to clients.

**Capabilities:**
- Multi-step program creation wizard (4 steps)
- Define program name, description, duration, difficulty, and goals
- Add weekly workout schedules with exercises, sets, reps, and rest periods
- Save programs as reusable templates
- Assign programs to one or multiple clients
- Duplicate existing programs as starting points
- View template library for quick program creation

**Routes:**
- `GET /api/programs` -- List programs (with filters)
- `POST /api/programs` -- Create new program
- `GET /api/programs/[id]` -- Get program details with workouts
- `PUT /api/programs/[id]` -- Update program
- `DELETE /api/programs/[id]` -- Delete program
- `POST /api/programs/[id]/assign` -- Assign program to client(s)
- `POST /api/programs/[id]/duplicate` -- Clone program
- `GET /api/programs/templates` -- Browse template library

---

### 5. Client Management

Manage a roster of clients with profiles, status tracking, and program assignments.

**Capabilities:**
- Client list with status filters (active, pending, offline, archived)
- Add new clients via modal form
- Client profile page with overview, workouts, programs, and progress tabs
- View client workout history with date filtering
- Assign programs to clients
- Quick actions (create workout, view history, send message)
- Client progress statistics

**Frontend Pages:**
- `/clients` -- Client roster with search and filters
- `/clients/[clientId]` -- Client profile with tabbed interface
- `/clients/[clientId]/programs` -- Client's assigned programs
- `/clients/[clientId]/history` -- Client's workout history

---

### 6. Workout Tracking

Real-time workout logging with set tracking, RPE scoring, and volume calculations.

**Capabilities:**
- Workout overview page with quick links (builder, history, progress)
- AI-powered workout builder for creating custom workouts
- Real-time workout execution with set-by-set logging
- Track weight, reps, RPE (Rate of Perceived Exertion) per set
- Rest timer between sets
- Automatic total volume calculation
- Workout completion with summary stats
- Active workout detection (resume in-progress workouts)
- Workout history with completion status

**Routes:**
- `GET /api/workouts` -- List workouts
- `POST /api/workouts` -- Create workout
- `GET /api/workouts/[id]` -- Get workout details
- `PUT /api/workouts/[id]` -- Update workout
- `DELETE /api/workouts/[id]` -- Delete workout
- `POST /api/workouts/[id]/complete` -- Mark workout as complete
- `POST /api/workouts/[id]/sets` -- Log set data
- `GET /api/workouts/active` -- Get active (in-progress) workouts
- `GET /api/workouts/history` -- Workout history with filters
- `GET /api/workouts/progress` -- Progress data over time

---

### 7. Progress Analytics

Track personal bests, training load, body measurements, and goal progress.

**Capabilities:**
- Performance tracking (personal bests, strength trends)
- Training load monitoring (volume, intensity, frequency)
- Body measurement logging and trend analysis
- Milestone tracking (achievements and records)
- Goal setting with progress tracking
- Visual dashboards with charts and trend lines

**Routes:**
- `GET /api/analytics/performance` -- Performance data
- `POST /api/analytics/performance` -- Log performance metric
- `GET /api/analytics/performance/me` -- Current user's performance
- `GET /api/analytics/performance/me/personal-bests` -- Personal records
- `GET /api/analytics/training-load/me` -- Training load data
- `POST /api/analytics/training-load/calculate` -- Calculate training load
- `GET /api/analytics/goals` -- List goals
- `POST /api/analytics/goals` -- Create goal
- `GET /api/analytics/goals/[id]` -- Get goal details
- `PUT /api/analytics/goals/[id]` -- Update goal
- `DELETE /api/analytics/goals/[id]` -- Delete goal
- `GET /api/analytics/goals/[id]/progress` -- Goal progress history
- `POST /api/analytics/goals/[id]/progress` -- Log goal progress
- `GET /api/analytics/measurements` -- List measurements
- `POST /api/analytics/measurements` -- Log measurement
- `GET /api/analytics/measurements/me` -- Current user's measurements
- `GET /api/analytics/milestones/me` -- Current user's milestones

---

### 8. User Profiles

User profile management with personal info and health data.

**Capabilities:**
- View and edit profile information (name, bio, avatar)
- Health profile with metrics (height, weight, body fat, etc.)
- Profile settings management

**Routes:**
- `GET /api/profiles/me` -- Get current user's profile
- `PUT /api/profiles/me` -- Update profile
- `GET /api/profiles/health` -- Get health profile
- `PUT /api/profiles/health` -- Update health profile

---

### 9. Activity Feed

Real-time feed of platform activity for connected users.

**Capabilities:**
- View recent activities (workouts completed, programs assigned, milestones)
- Activity types: workout_completed, program_assigned, milestone_achieved, etc.
- Filterable by activity type and date range

**Routes:**
- `GET /api/activities` -- List recent activities

---

### 10. System Health

Platform health monitoring endpoint.

**Routes:**
- `GET /api/health` -- System health check (database, cache status)

---

## Core Workflows

### Trainer: Creating and Assigning a Program

1. Navigate to Programs > Create Program
2. Fill in program details (name, duration, difficulty, goals)
3. Add weekly workout schedule with exercises from the library
4. Configure sets, reps, rest periods per exercise
5. Save the program
6. Navigate to a client's profile
7. Click "Assign Program" and select the program
8. Client receives the program in their dashboard

### Client: Completing a Workout

1. Open the Workouts page
2. Select an active workout from their assigned program
3. Start the workout (enters execution mode)
4. For each exercise, log weight and reps for each set
5. Optionally log RPE (1-10) for each set
6. Use rest timer between sets
7. Complete the workout to see summary stats
8. Workout appears in history with volume and completion data

### Trainer: Monitoring Client Progress

1. Navigate to Clients page
2. Select a client from the roster
3. Switch to the Progress tab
4. View workout completion rates, volume trends, and personal bests
5. Check training load to ensure proper periodization
6. Review goal progress and milestones

### Admin: Managing the Exercise Library

1. Navigate to Exercises
2. Browse, search, or filter existing exercises
3. Create new custom exercises with name, description, body parts, equipment, and instructions
4. Organize exercises into collections
5. Exercises are available platform-wide for all trainers

---

## Data Model Overview

### Core Entities
- **User** -- Account with email, password hash, role, and profile
- **TrainerClient** -- Relationship between trainer and client users
- **Exercise** -- Exercise definition with name, body parts, muscles, equipment
- **Program** -- Multi-week training program with metadata
- **ProgramWorkout** -- Individual workout within a program
- **ProgramWorkoutExercise** -- Exercise configuration within a workout
- **WorkoutSession** -- Instance of a workout being performed
- **WorkoutSet** -- Individual set data (weight, reps, RPE)
- **ExerciseFavorite** -- User's favorited exercises
- **ExerciseCollection** -- Named group of exercises
- **Activity** -- Activity feed event record
- **Goal** -- User-defined fitness goal with progress tracking
- **Measurement** -- Body measurement record
- **PersonalBest** -- Personal record for an exercise

### Key Relationships
- A Trainer has many Clients (via TrainerClient)
- A Program has many ProgramWorkouts
- A ProgramWorkout has many ProgramWorkoutExercises
- A WorkoutSession belongs to a User and optionally a ProgramWorkout
- A WorkoutSession has many WorkoutSets
- Goals, Measurements, and PersonalBests belong to a User

---

## Navigation Structure

### Admin Navigation
- Dashboard (`/dashboard`)
- Clients (`/clients`)
- Programs (`/programs`)
- Exercises (`/exercises`)
- Analytics (`/analytics`)

### Trainer Navigation
- Dashboard (`/dashboard`)
- My Clients (`/clients`)
- Programs (`/programs`) with sub-items: My Programs, Create Program
- Exercises (`/exercises`)
- Workouts (`/workouts`)
- Analytics (`/analytics`)

### Client Navigation
- Dashboard (`/dashboard`)
- My Workouts (`/workouts`)
- My Programs (`/programs`)
- Progress (`/workouts/progress`)
- Analytics (`/analytics`)
- Profile (`/profile`)

### Common (User Menu)
- Dashboard (`/dashboard`)
- Profile Settings (`/profile/edit`)

---

## API Response Format

All API endpoints return responses in a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": "Error message describing what went wrong"
}
```

---

## Authentication Flow

1. User registers or logs in via `/api/auth/register` or `/api/auth/login`
2. Server returns JWT access token (15-min expiry) and refresh token (7-day expiry)
3. Client stores access token in localStorage as `accessToken`
4. All authenticated API requests include `Authorization: Bearer <token>` header
5. Server middleware (`authenticate()`) validates token and injects user context
6. On token expiry, client uses refresh token to obtain new access token

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend Framework | Next.js 14 (App Router) |
| UI Library | React 18 |
| Language | TypeScript 5.6 |
| Styling | Tailwind CSS 3.4 |
| UI Components | Radix UI + shadcn/ui |
| Animations | Framer Motion |
| Server State | TanStack Query |
| Client State | Jotai + React Context |
| Database | PostgreSQL 16 |
| ORM | Prisma 5.22 |
| Cache | Redis / Upstash |
| Authentication | JWT (bcryptjs) |
| Testing | Jest + React Testing Library + Playwright |
| Deployment | Vercel (production), Docker Compose (development) |
