# EvoFit Trainer - Screenshot Inventory

**Captured:** March 1, 2026
**Production URL:** https://evofittrainer-six.vercel.app
**Authenticated as:** coach.sarah (Trainer role)
**Base Path:** `docs/marketing/screenshots/`

---

## Summary

| Category | Captured | Planned | Notes |
|----------|----------|---------|-------|
| Public Pages | 5 | 5 | Complete |
| Trainer Pages | 13 | 17 | Missing: client-detail, workout-log, workout-history, AI builder |
| Admin Pages | 0 | 4 | No admin credentials available |
| Client Pages | 0 | 2 | No client credentials available |
| **Total** | **18** | **28** | |

---

## Public Pages (5/5)

| File | Page | Viewport | Size | Description |
|------|------|----------|------|-------------|
| `public/homepage-desktop.png` | `/` | 1440x900 | 414 KB | Landing page hero with blue gradient, "Transform Your Fitness Business" headline, feature cards, benefit statements, role cards (Admin/Trainer/Client), CTA buttons |
| `public/homepage-mobile.png` | `/` | 390x844 | 227 KB | Mobile-responsive landing page showing stacked layout, hamburger menu, hero section with CTAs |
| `public/login-desktop.png` | `/login` | 1440x900 | 160 KB | Login form with email/password fields, "Sign In" button, "Create Account" link, EvoFit branding |
| `public/register-desktop.png` | `/register` | 1440x900 | 202 KB | Registration form with name, email, password fields, role selection, "Create Account" CTA |
| `public/exercises-desktop.png` | `/exercises` | 1440x900 | 142 KB | Public exercise library showing "Showing 20 of 1,344 exercises" with filter dropdowns (body part, equipment, target muscle, difficulty), exercise cards with GIF thumbnails |

---

## Trainer Pages (13/17)

| File | Page | Viewport | Size | Description |
|------|------|----------|------|-------------|
| `trainer/dashboard-desktop.png` | `/dashboard` | 1440x900 | 203 KB | Main dashboard with welcome message, quick stats cards, recent activity feed, navigation sidebar |
| `trainer/dashboard-mobile.png` | `/dashboard` | 390x844 | 179 KB | Mobile dashboard with stacked cards, hamburger menu, responsive layout |
| `trainer/trainer-dashboard-desktop.png` | `/trainer/dashboard` | 1440x900 | 194 KB | Trainer-specific dashboard showing 3 total clients, 3 active clients, activity feed (workout completions), Quick Actions (Create Program, Add Client, View Calendar, Client Reports) |
| `trainer/clients-list-desktop.png` | `/trainer/clients` | 1440x900 | 90 KB | Client management list with search, status filters, client cards showing name, email, status badges |
| `trainer/exercises-library-desktop.png` | `/trainer/exercises` | 1440x900 | 269 KB | Full exercise library (logged in) with body part, equipment, target muscle, difficulty filters; exercise cards showing animated GIF thumbnails, exercise names, muscle targets |
| `trainer/programs-list-desktop.png` | `/trainer/programs` | 1440x900 | 192 KB | Program management showing 6 programs: "Beginner Full Body" (8 weeks), "HIIT & Conditioning" (6 weeks), "Powerlifting Foundation" (8 weeks, 4 active clients); search bar, type/level filters, grid/list view toggle |
| `trainer/program-create-desktop.png` | `/trainer/programs/create` | 1440x900 | 106 KB | Program creation form with name, description, type selection, duration, difficulty level fields |
| `trainer/workouts-overview-desktop.png` | `/trainer/workouts` | 1440x900 | 135 KB | Workout overview page with workout cards, status indicators, date/time information |
| `trainer/workout-builder-desktop.png` | `/trainer/workouts/builder` | 1440x900 | 100 KB | Workout builder interface for adding exercises, configuring sets/reps/weight, drag-and-drop ordering |
| `trainer/analytics-desktop.png` | `/trainer/analytics` | 1440x900 | 220 KB | Analytics dashboard (NOTE: captured error state "Something went wrong" - may need retry with different account) |
| `trainer/analytics-mobile.png` | `/trainer/analytics` | 390x844 | 89 KB | Mobile analytics view (NOTE: same error state as desktop) |
| `trainer/schedule-desktop.png` | `/trainer/schedule` | 1440x900 | 122 KB | Weekly calendar view (Mar 1-7, 2026) with hourly time slots, "Availability Settings" and "+ New Appointment" buttons, status legend (Scheduled, Confirmed, Completed, Cancelled, No Show) |
| `trainer/profile-desktop.png` | `/trainer/profile` | 1440x900 | 152 KB | Trainer profile page with personal info, specializations, certification details, account settings |

### Not Captured (Trainer)

| Planned File | Page | Reason |
|--------------|------|--------|
| `trainer/client-detail-desktop.png` | `/trainer/clients/[id]` | Requires selecting a specific client |
| `trainer/workout-log-desktop.png` | `/trainer/workouts/[id]/log` | Requires active workout session |
| `trainer/workout-history-desktop.png` | `/trainer/workouts/history` | Page may not exist as standalone route |
| `trainer/ai-workout-builder-desktop.png` | AI Workout Builder modal | Requires navigating to builder and triggering AI |

---

## Admin Pages (0/4 - Not Captured)

| Planned File | Page | Reason |
|--------------|------|--------|
| `admin/dashboard-desktop.png` | `/admin/dashboard` | No admin credentials available |
| `admin/users-desktop.png` | `/admin/users` | No admin credentials available |
| `admin/exercises-desktop.png` | `/admin/exercises` | No admin credentials available |
| `admin/settings-desktop.png` | `/admin/settings` | No admin credentials available |

**To capture:** Need admin account credentials (Role: ADMIN in database).

---

## Client Pages (0/2 - Not Captured)

| Planned File | Page | Reason |
|--------------|------|--------|
| `client/dashboard-desktop.png` | `/client/dashboard` | No client credentials available |
| `client/workout-log-desktop.png` | `/client/workouts/[id]/log` | No client credentials available |

**To capture:** Need client account credentials (Role: CLIENT in database).

---

## Screenshot Quality Notes

- All screenshots captured at production URL (https://evofittrainer-six.vercel.app)
- Desktop viewport: 1440x900, Mobile viewport: 390x844
- Authenticated pages captured using E2E test credentials (coach.sarah, Trainer role)
- Analytics screenshots show error state - the analytics dashboard may have a runtime issue for this test account
- Exercise library screenshots confirm 1,344 exercises loaded with GIF thumbnails
- All screenshots are PNG format, suitable for marketing materials

---

## Usage Guidelines

- Screenshots are point-in-time captures (March 1, 2026) and may not reflect future UI changes
- For marketing materials, crop and annotate as needed
- Mobile screenshots demonstrate responsive design capability
- Error states (analytics) should not be used in marketing materials without verification
- Re-capture recommended after significant UI updates or bug fixes
