# EvoFitTrainer Screenshot Inventory

**Last Updated:** March 28, 2026
**Production URL:** https://trainer.evofit.io
**Total Screenshots:** 40
**Output Directory:** `docs/marketing/screenshots/`
**Captured by:** `scripts/capture-screenshots.ts`

---

## Public Pages (6 screenshots)

| Filename | URL | Description | Viewport |
|----------|-----|-------------|----------|
| `homepage.png` | `/` | Landing page — full page scroll, "Own Your Coaching Platform. Forever." hero | 1440x900 (fullPage) |
| `homepage-features.png` | `/` | Landing page scrolled to features section | 1440x900 |
| `homepage-pricing.png` | `/` | Landing page scrolled to pricing section | 1440x900 |
| `homepage-roles.png` | `/` | Landing page scrolled to roles/persona section | 1440x900 |
| `login.png` | `/login` | Login form with email/password fields | 1440x900 |
| `register.png` | `/register` | Registration form for new accounts | 1440x900 |

---

## Trainer Pages (22 screenshots)

All captured as qa-trainer@evofit.io (Trainer role). Viewport: 1440x900.

| Filename | URL | Description |
|----------|-----|-------------|
| `trainer-dashboard.png` | `/dashboard/trainer` | Trainer dashboard with client stats and quick actions |
| `clients-list.png` | `/clients` | All Clients list with client cards/rows |
| `client-detail.png` | `/clients/[id]` | Individual client profile and progress view |
| `exercises-library.png` | `/dashboard/exercises` | Exercise Library — 1,344 exercises in grid layout with search |
| `exercises-filters.png` | `/dashboard/exercises` | Exercise Library with Filters panel open |
| `exercise-detail.png` | `/dashboard/exercises/[id]` | Individual exercise detail page with GIF and muscle info |
| `exercises-favorites.png` | `/dashboard/exercises/favorites` | Saved/favorited exercises view |
| `programs-list.png` | `/programs` | Training Programs list with search, type/level filters |
| `program-builder.png` | `/programs/new` | New Program builder form |
| `workouts-hub.png` | `/workouts` | Workouts hub with Workout Builder, Full History, Progress cards |
| `workout-builder.png` | `/workouts/builder` | Custom workout builder interface |
| `workout-tracker.png` | `/workout-tracker` | Live workout tracking session UI |
| `analytics-overview.png` | `/analytics` | Analytics overview tab — measurement tracking |
| `analytics-performance.png` | `/analytics` | Analytics — Performance tab |
| `analytics-training-load.png` | `/analytics` | Analytics — Training Load tab |
| `analytics-goals.png` | `/analytics` | Analytics — Goals tab |
| `analytics-charts.png` | `/analytics` | Analytics — Charts & Trends tab |
| `schedule-calendar.png` | `/schedule` | Weekly calendar view with Export to Calendar and availability settings |
| `schedule-availability.png` | `/schedule/availability` | Availability settings for trainer booking |
| `profile-view.png` | `/profile` | Trainer profile view |
| `profile-edit.png` | `/profile/edit` | Profile edit form |
| `profile-health.png` | `/profile/health` | Health metrics and body measurements profile section |

---

## Client Pages (4 screenshots)

All captured as qa-client@evofit.io (Client role). Viewport: 1440x900.

| Filename | URL | Description |
|----------|-----|-------------|
| `client-dashboard.png` | `/dashboard/client` | Client-facing dashboard |
| `client-workouts.png` | `/workouts` | Workouts view for client role |
| `client-analytics.png` | `/analytics` | Analytics for client (progress tracking) |
| `client-profile.png` | `/profile` | Client profile page |

---

## Admin Pages (3 screenshots)

All captured as qa-admin@evofit.io (Admin role). Viewport: 1440x900.

| Filename | URL | Description |
|----------|-----|-------------|
| `admin-dashboard.png` | `/admin` | Admin panel overview — 134 users, 93 programs, 99 workouts, user growth chart and pie chart |
| `admin-users.png` | `/admin/users` | User management list with search and filters |
| `admin-system.png` | `/admin/system` | System health and platform settings |

---

## Mobile Screenshots (5 screenshots)

All captured as qa-trainer@evofit.io (Trainer role). Viewport: 375x812 (iPhone SE/standard).

| Filename | URL | Description |
|----------|-----|-------------|
| `mobile-dashboard.png` | `/dashboard/trainer` | Trainer dashboard on mobile — stats cards, New Program + Add Client CTAs |
| `mobile-exercises.png` | `/dashboard/exercises` | Exercise library on mobile — responsive grid layout |
| `mobile-workouts.png` | `/workouts` | Workouts hub on mobile |
| `mobile-analytics.png` | `/analytics` | Analytics page on mobile |
| `mobile-schedule.png` | `/schedule` | Schedule calendar on mobile |

---

## Production State Notes (March 28, 2026)

| Page | State | Notes |
|------|-------|-------|
| Schedule calendar | Excellent | Full week view (Mar 22-28), Export to Calendar, New Appointment CTA |
| Admin dashboard | Excellent | Live stats: 134 users, 93 programs, 99 workouts, user growth chart |
| Exercise Library | Excellent | 1,344 exercises, grid layout, search + filter controls visible |
| Mobile dashboard | Excellent | Responsive stats cards, action buttons, full sidebar nav |
| Login / Register | Excellent | Clean auth forms with EvoFit branding |
| Analytics (all tabs) | Error boundary | Runtime error in production analytics page ("Something went wrong") |
| Profile view | Error boundary | Runtime error on `/profile` for trainer role |
| Programs list | API error | "Error Loading Programs [object Object]" for QA user |
| Trainer dashboard | Partial | Dashboard header/nav loads; body shows "Loading dashboard..." spinner |
| Workouts hub | Partial | Hub structure loads; workout history section shows "Loading history..." |

---

## File Tree

```
docs/marketing/screenshots/
├── homepage.png
├── homepage-features.png
├── homepage-pricing.png
├── homepage-roles.png
├── login.png
├── register.png
├── trainer-dashboard.png
├── clients-list.png
├── client-detail.png
├── exercises-library.png
├── exercises-filters.png
├── exercise-detail.png
├── exercises-favorites.png
├── programs-list.png
├── program-builder.png
├── workouts-hub.png
├── workout-builder.png
├── workout-tracker.png
├── analytics-overview.png
├── analytics-performance.png
├── analytics-training-load.png
├── analytics-goals.png
├── analytics-charts.png
├── schedule-calendar.png
├── schedule-availability.png
├── profile-view.png
├── profile-edit.png
├── profile-health.png
├── client-dashboard.png
├── client-workouts.png
├── client-analytics.png
├── client-profile.png
├── admin-dashboard.png
├── admin-users.png
├── admin-system.png
├── mobile-dashboard.png
├── mobile-exercises.png
├── mobile-workouts.png
├── mobile-analytics.png
└── mobile-schedule.png
```

**Capture script:** `scripts/capture-screenshots.ts`
**Run with:** `npx tsx scripts/capture-screenshots.ts`
