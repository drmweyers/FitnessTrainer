# EvoFit Trainer — Tier Feature Matrix & Marketing Copy

**Version:** 1.0
**Created:** March 28, 2026
**Production URL:** https://evofittrainer-six.vercel.app
**Stripe Tiers:** Starter ($199) · Professional ($299) · Enterprise ($399) · SaaS Add-on ($39.99/mo)

---

## Table of Contents

1. [Complete Feature Inventory](#section-1-complete-feature-inventory)
2. [Tier Feature Matrix](#section-2-tier-feature-matrix)
3. [Per-Tier Sales Copy](#section-3-per-tier-sales-copy)
4. [Competitive Positioning](#section-4-competitive-positioning)
5. [Key Numbers for Copy](#section-5-key-numbers-for-copy)
6. [Sales Funnel Page Structure](#section-6-sales-funnel-page-structure)

---

## Section 1: Complete Feature Inventory

### 1.1 Exercise Library

| Feature | Detail |
|---------|--------|
| Total exercises | **1,344** with animated GIF demonstrations |
| Body part categories | **10** (neck, shoulders, chest, back, upper arms, lower arms, waist, upper legs, lower legs, cardio) |
| Equipment types | **29** (barbell, dumbbell, cable, kettlebell, resistance bands, body weight, machines, medicine ball, TRX, foam roll, stability ball, and 18 more) |
| Target muscle groups | **26** (pectorals, deltoids, lats, traps, rhomboids, biceps, triceps, forearms, quads, hamstrings, glutes, calves, abs, obliques, lower back, and 11 more) |
| Secondary muscles | Full secondary muscle array per exercise |
| Difficulty levels | **3** (beginner, intermediate, advanced) |
| Step-by-step instructions | Yes — text instructions per exercise |
| Full-text search | Instant search with debounce |
| Multi-filter stacking | Body part + equipment + muscle + difficulty simultaneously (AND logic) |
| Filter counts | Shows result count per filter option |
| Search history | Tracked per logged-in user |
| Exercise favorites | One-click heart icon, cross-device sync |
| Favorites quick access | Favorites appear first in program builder |
| Custom collections | Unlimited named collections (e.g., "Knee Rehab", "Home Workouts") |
| Collection descriptions | Optional per collection |
| Collection ordering | Drag-and-drop exercise ordering within collections |
| Public/private collections | Per-collection toggle |
| Related exercises | Suggestions based on target muscles |
| Usage tracking | Tracks how often each exercise is used |
| Mobile GIF player | Touch-friendly tap-to-pause/play controls |
| Mobile exercise cards | Compact layout optimized for small screens |
| Alternative exercises | API endpoint for substitution suggestions |

### 1.2 Program Builder

| Feature | Detail |
|---------|--------|
| Program types | **8** (Strength, Hypertrophy, Endurance, Powerlifting, Bodybuilding, General Fitness, Sport-Specific, Rehabilitation) |
| Maximum duration | Up to 52 weeks |
| Workouts per week | Up to 7 per week |
| Set types | **7** (Warmup, Working, Drop, Pyramid, AMRAP, Cluster, Rest-Pause) |
| Workout types | **6** (Strength, Cardio, HIIT, Flexibility, Mixed, Recovery) |
| Superset support | A/B/C letter grouping for supersets and tri-sets |
| Circuit support | All exercises in same letter group = circuit |
| RPE tracking | Rate of Perceived Exertion (1-10 scale) per set |
| RIR tracking | Reps in Reserve (0-5) per set |
| Tempo prescription | "3-1-2-0" format (eccentric-pause-concentric-pause) |
| Rest period configuration | Per-set rest in seconds |
| Weight guidance | "70% 1RM", "RPE 7", bodyweight, specific weight |
| Reps format | Flexible string: "8-10", "AMRAP", "30s" |
| Deload weeks | Boolean deload flag per week with coaching notes |
| Exercise ordering | Drag-and-drop reordering |
| Superset execution order | Labeled A1/A2/B1/B2 for client clarity |
| Equipment auto-detection | Equipment needed auto-generated from exercises used |
| Template library | Save any program as reusable template |
| Template categories | Searchable by category, difficulty, duration |
| Template public/private | Share templates or keep private |
| Template use-count tracking | Track how many times each template is used |
| Duplicate program | One-click duplication to customize |
| Program assignment (single) | Select client, set start date, add notes |
| Bulk program assignment | Assign to multiple clients or filter by tag at once |
| Client dashboard view | Program appears in client's dashboard after assignment |
| Progress tracking | Completion tracking per assignment |

### 1.3 Client Management

| Feature | Detail |
|---------|--------|
| Client status states | **5** (Active, Pending, Offline, Need Programming, Archived) |
| Email invitation system | Branded email with 7-day secure token |
| Custom welcome message | Optional trainer-written message per invitation |
| Invitation status tracking | Pending → Accepted → Expired |
| Resend invitations | Can resend expired invitations |
| Auto-linking | Accepted invitation auto-creates trainer-client relationship |
| Custom tags | Unlimited tags per trainer, each with custom hex color |
| Multiple tags per client | Clients can have multiple tags simultaneously |
| Tag-based filtering | Filter roster by one or more tags |
| Tag-based bulk operations | Bulk program assignment and messaging by tag |
| Private trainer notes | Never visible to client; Markdown support |
| Note categories | Session, Medical, Goal, General tabs |
| Searchable notes | Search across all client notes |
| Client profile view | Medical conditions, medications, allergies, injuries |
| Fitness level tracking | Beginner / Intermediate / Advanced |
| Emergency contact | Name, relationship, phone per client |
| Bulk invite | Multiple emails (comma or newline separated) |
| Bulk program assignment | Select multiple clients or filter by tag |
| Client connection list | Visual roster with status badges and tag chips |
| Invitation notifications | In-app badge + email for each lifecycle event |

### 1.4 Workout Tracking & Logging

| Feature | Detail |
|---------|--------|
| Session lifecycle states | **5** (Scheduled, In Progress, Completed, Skipped, Missed) |
| Set-by-set logging | Planned vs. actual reps and weight per set |
| RPE logging | Per set (1-10) |
| RIR logging | Per set (0-5) |
| Duration logging | Seconds, for timed exercises |
| Rest time tracking | Actual rest between sets recorded |
| Tempo adherence | Track against prescribed tempo |
| Per-set notes | Free-form notes per set |
| Rest timer | Auto-starts countdown after each completed set |
| Prescribed rest display | Shows target rest from program |
| Audio/visual alerts | Timer completion notification |
| Skip rest | Option to skip rest and continue |
| Automatic PR detection | 1RM, volume, rep, endurance, power PRs auto-detected |
| PR celebration | Confetti animation + "New PR!" badge |
| PR saved | Saved to performance metrics and personal bests |
| Trainer PR notification | Trainer receives notification of client PRs |
| Total volume calculation | Sum of (weight × reps) for all sets |
| Adherence score | Completed sets / prescribed sets × 100% |
| Subjective feedback | Effort, enjoyment, energy before/after (1-10 each) |
| Trainer feedback | Trainer can review session and add feedback |
| Workout history | Chronological list with date range and program filters |
| History search | Search across session notes and feedback |
| Offline logging | Full set-by-set logging without internet (IndexedDB) |
| Sync manager | Automatic background sync on reconnection |
| Conflict resolution | Last-write-wins conflict handling |
| Exercise substitution | Substitute exercises mid-workout |
| Modification templates | Pre-built exercise modification options |
| Background timer | Web Worker-based timer that persists between navigations |

### 1.5 Progress Analytics

| Feature | Detail |
|---------|--------|
| Body composition metric types | **8** (Body Weight, Body Fat %, Muscle Mass, 1RM, Volume, Endurance, Power, Speed) |
| Custom body measurements | Chest, waist, hips, arms, thighs, calves, neck, shoulders, forearms + any custom |
| Multi-line progress charts | Overlay multiple metrics on one interactive chart |
| Time range selection | 7 days, 30 days, 90 days, 1 year, all time, custom |
| Comparison baselines | Set "before" date to compare against |
| Chart export | Download as PNG (chart) or CSV (raw data) |
| ACWR training load monitoring | Acute (7-day) / Chronic (28-day) workload ratio |
| ACWR risk zones | <0.8 under-training, 0.8-1.3 optimal, 1.3-1.5 caution, >1.5 high risk |
| Body part distribution | JSON breakdown of volume by muscle group per week |
| Personal bests tracking | PRs per exercise with timeline chart |
| PR leaderboard | Top PRs across all exercises |
| Goal types | **8** (Weight Loss, Muscle Gain, Endurance, Strength, Flexibility, General Fitness, Sport-Specific, Rehabilitation) |
| Goal progress tracking | Percentage bars, checkpoint recording, target date countdown |
| On-track indicator | Green/yellow/red based on trajectory |
| AI-powered insights | Rule-based insights: volume, consistency, goal, recovery, plateau |
| Insight priorities | High / Medium / Low with action buttons (Mark Read, Action Taken, Dismiss) |
| Milestone achievements | Auto-detected: 10/25/50/100/250/500 workouts, 10/20/30-day streaks, weight milestones, PRs, goal completion |
| Training streak tracker | Current streak + best-ever streak |
| Analytics reports | Weekly summary, monthly review, quarterly deep-dive |
| Report metrics selection | User selects which metrics to include |
| Trainer commentary | Trainer adds notes to client reports |
| Export formats | PDF (with charts), CSV (raw data) |

### 1.6 Scheduling & Calendar

| Feature | Detail |
|---------|--------|
| Calendar views | Monthly grid, weekly view (daily and agenda planned) |
| Trainer availability | Per-day-of-week slots with start/end time and location |
| Multiple slots per day | Morning + evening slots per day |
| Availability toggle | Enable/disable specific slots |
| Recurring weekly schedule | Set once, applies every week |
| Appointment types | **5** (One-on-One, Group Class, Assessment, Consultation, Online Session) |
| Appointment statuses | **5** (Scheduled, Confirmed, Completed, Cancelled, No-Show) |
| Duration options | 15, 30, 45, 60, 90, 120 minutes |
| Location field | Physical location or "Online" |
| Meeting link support | Zoom, Google Meet, Teams, or any URL |
| Meeting link display | Visible 15 minutes before session starts |
| Cancellation tracking | Timestamp + reason recorded |
| Rescheduling option | Presented after cancellation |
| Client booking | Client can book within trainer's available slots |
| iCal export | Download .ics file of appointments (RFC 5545 compliant) |
| Subscribable calendar feed | Subscribe URL for Google Calendar / Apple Calendar |
| Email notifications | Both parties notified on appointment creation, confirmation, cancellation |

### 1.7 AI Features

| Feature | Detail |
|---------|--------|
| AI workout generator | Generate full workout from 1,344 exercise library |
| Filter preferences | Focus area, difficulty, duration, equipment, workout type |
| Balanced workout output | 6-10 exercises, 3-5 sets each, rest periods, estimated duration |
| Regenerate option | Regenerate with different preferences |
| Edit generated workout | Modify before saving |
| Save to program | Save AI workout as a program |
| Assign to clients | Assign AI-generated program to clients |
| RPE-based progression suggestions | Analyzes recent workout data and suggests weight/rep adjustments |
| Progression strategies | increase_weight, increase_reps, maintain, deload, reduce |
| Progression confidence rating | High / Medium / Low confidence per suggestion |
| Plateau detection | Suggests variation change or deload after plateau |
| Progression insight types | Volume, consistency, goal progress, recovery, plateau |

### 1.8 PWA & Mobile

| Feature | Detail |
|---------|--------|
| Mobile-first responsive design | 390px (iPhone) to 1440px+ (desktop) |
| Touch-optimized UI | 44px minimum tap targets |
| Hamburger navigation | Mobile hamburger, full nav on desktop |
| PWA installable | Add to home screen, no app store required |
| No version fragmentation | Updates deploy instantly |
| PWA icons | 4 icon sizes generated from logo SVG |
| Offline workout logging | Full set-by-set logging without internet |
| IndexedDB storage | Local database for offline workout data |
| Background sync | Automatic upload when reconnected |
| Conflict resolution | Handles sync conflicts gracefully |
| Offline indicator | Orange "Offline" badge in header |
| Sync status component | Visual sync progress indicator |
| Background timer Web Worker | Timer persists during navigation (page changes don't reset timer) |
| Biometric login (prompt) | WebAuthn biometric prompt component (UI ready) |
| Biometric settings | Settings page for managing biometric preferences |
| Push notifications | Web push notification service (infrastructure ready) |
| Push notification settings | User preferences for notification types |

### 1.9 Admin Dashboard

| Feature | Detail |
|---------|--------|
| Dashboard statistics | Total users, active users, total exercises, total sessions, user growth, session volume |
| User management | Paginated list with search, filter, sort |
| User search | By email, name, role |
| User filter | By role (trainer, client, admin) and status (active, inactive) |
| User sort | By created date, last login, email |
| User detail view | Full profile + activity timeline |
| Edit user | Change email, role, active status |
| Activate / deactivate | Toggle user active status |
| Role assignment | Change role (trainer ↔ client, admin) |
| Bulk user operations | Bulk activate, deactivate, role change |
| Activity log | Platform-wide activity log with audit trail |
| Feature flags | API-backed feature flags with localStorage fallback |
| System health monitoring | PostgreSQL + Redis + API status |
| System health endpoint | GET /api/admin/system/health |

### 1.10 Support

| Feature | Detail |
|---------|--------|
| Support ticket system | POST /api/support/tickets |
| Contact form component | In-app contact form |
| Content flagging | POST /api/support/tickets for content reports |

### 1.11 Authentication & Security

| Feature | Detail |
|---------|--------|
| JWT access tokens | 15-minute expiry |
| JWT refresh tokens | 7-day expiry |
| Role-based registration | Separate flows for trainer, client, admin |
| Email verification | Token-based, 24-hour expiry |
| Invitation-based client signup | Clients register via secure trainer invitation links |
| Account lockout | Auto-lockout after failed login attempts |
| Security audit log | Every login attempt logged with IP, user agent, device info |
| Rate limiting | All API endpoints protected |
| Session management | Device tracking, concurrent session limits, remote logout |
| Password reset | Secure token-based flow, 1-hour expiry |
| API tokens | For future integrations (model ready) |
| Two-factor auth | Database schema and model ready |
| OAuth social login | Infrastructure ready for Google, Apple, Facebook |
| WebAuthn passkeys | BiometricPrompt component and BiometricSettings UI built |

### 1.12 Marketing & Commerce

| Feature | Detail |
|---------|--------|
| Landing page | Production homepage with animated hero, feature grid, pricing |
| 4-tier pricing | Starter ($199), Professional ($299), Enterprise ($399), SaaS Add-on ($39.99/mo) |
| Stripe checkout | POST /api/create-checkout-session — one-time and subscription modes |
| Combined checkout | Tier + SaaS add-on in one session (subscription mode) |
| Checkout success page | /landing/checkout-success.html |
| Checkout cancel page | /landing/checkout-cancel.html |
| Price ID validation | Server-side validation of tier-to-price-ID match |
| Blog infrastructure | Ready for content marketing |

---

## Section 2: Tier Feature Matrix

### Tier Philosophy

| Tier | Price | Target User | Core Value Prop |
|------|-------|-------------|-----------------|
| **Starter** | $199 one-time | Solo trainer, beginner, part-time coach | Own the platform forever. No monthly fees. Get started today. |
| **Professional** | $299 one-time | Full-time personal trainer, growing roster | Everything you need to run a professional coaching business at scale. |
| **Enterprise** | $399 one-time | Gym owner, studio operator, team of trainers | Platform-level control, oversight, and multi-trainer management. |
| **SaaS Add-on** | $39.99/month | Any tier buyer wanting AI + premium mobile | AI-powered workout generation and progression automation. |

---

### Tier Feature Matrix Table

| Feature | Starter $199 | Professional $299 | Enterprise $399 | SaaS Add-on $39.99/mo |
|---------|:-----------:|:-----------------:|:---------------:|:-------------------:|
| **EXERCISE LIBRARY** | | | | |
| 1,344 exercises with GIF demos | ✅ | ✅ | ✅ | — |
| 10 body part filters | ✅ | ✅ | ✅ | — |
| 29 equipment filters | ✅ | ✅ | ✅ | — |
| 26 target muscle filters | ✅ | ✅ | ✅ | — |
| 3 difficulty levels | ✅ | ✅ | ✅ | — |
| Full-text search | ✅ | ✅ | ✅ | — |
| Exercise favorites | ✅ | ✅ | ✅ | — |
| Custom collections | ✅ (3 max) | ✅ Unlimited | ✅ Unlimited | — |
| Related exercises | ✅ | ✅ | ✅ | — |
| Collection sharing (public) | ❌ | ✅ | ✅ | — |
| **CLIENT MANAGEMENT** | | | | |
| Active clients | Up to 5 | Unlimited | Unlimited | — |
| Email invitation system | ✅ | ✅ | ✅ | — |
| Client status tracking (5 states) | ✅ | ✅ | ✅ | — |
| Custom color tags | ✅ (3 tags) | ✅ Unlimited | ✅ Unlimited | — |
| Private trainer notes | ✅ | ✅ | ✅ | — |
| Tag-based filtering | ❌ | ✅ | ✅ | — |
| Bulk invite | ❌ | ✅ | ✅ | — |
| Bulk program assignment | ❌ | ✅ | ✅ | — |
| **PROGRAM BUILDER** | | | | |
| 8 program types | ❌ | ✅ | ✅ | — |
| 7 set types | ❌ | ✅ | ✅ | — |
| RPE / RIR / Tempo prescriptions | ❌ | ✅ | ✅ | — |
| Superset + circuit support | ❌ | ✅ | ✅ | — |
| Deload weeks | ❌ | ✅ | ✅ | — |
| Template library (save/reuse) | ❌ | ✅ | ✅ | — |
| Bulk program assignment | ❌ | ✅ | ✅ | — |
| Program duplication | ❌ | ✅ | ✅ | — |
| **WORKOUT TRACKING** | | | | |
| Set-by-set logging | ✅ | ✅ | ✅ | — |
| Rest timer | ✅ | ✅ | ✅ | — |
| Automatic PR detection | ✅ | ✅ | ✅ | — |
| PR celebration animation | ✅ | ✅ | ✅ | — |
| Workout history | ✅ | ✅ | ✅ | — |
| Adherence scoring | ✅ | ✅ | ✅ | — |
| Subjective feedback (effort/enjoyment/energy) | ✅ | ✅ | ✅ | — |
| Trainer feedback on sessions | ❌ | ✅ | ✅ | — |
| Exercise substitution mid-workout | ✅ | ✅ | ✅ | — |
| Offline workout logging | ✅ | ✅ | ✅ | — |
| Background sync | ✅ | ✅ | ✅ | — |
| **ANALYTICS** | | | | |
| Body composition tracking (8 metrics) | ✅ Basic | ✅ Full | ✅ Full | — |
| Custom body measurements | ✅ | ✅ | ✅ | — |
| Multi-line progress charts | ✅ | ✅ | ✅ | — |
| ACWR training load monitoring | ❌ | ✅ | ✅ | — |
| Personal bests tracking | ✅ | ✅ | ✅ | — |
| Goal progress tracking (8 goal types) | ✅ (2 goals) | ✅ Unlimited | ✅ Unlimited | — |
| Milestone achievements | ✅ | ✅ | ✅ | — |
| Training streak tracker | ✅ | ✅ | ✅ | — |
| AI-powered insights | ❌ | ✅ | ✅ | ✅ (enhanced) |
| Analytics reports (PDF/CSV export) | ❌ | ✅ | ✅ | — |
| Comparison baselines | ❌ | ✅ | ✅ | — |
| **SCHEDULING** | | | | |
| Calendar view (monthly/weekly) | ✅ | ✅ | ✅ | — |
| Trainer availability configuration | ❌ | ✅ | ✅ | — |
| 5 appointment types | ❌ | ✅ | ✅ | — |
| Online session meeting links | ❌ | ✅ | ✅ | — |
| iCal export (.ics download) | ❌ | ✅ | ✅ | — |
| Subscribable calendar feed | ❌ | ✅ | ✅ | — |
| **AI FEATURES** | | | | |
| AI workout generator | ❌ | ❌ | ❌ | ✅ |
| RPE-based progression suggestions | ❌ | ❌ | ❌ | ✅ |
| Plateau detection + deload suggestions | ❌ | ❌ | ❌ | ✅ |
| Enhanced AI insights | ❌ | ❌ | ❌ | ✅ |
| **PWA & MOBILE** | | | | |
| Mobile-first responsive design | ✅ | ✅ | ✅ | — |
| PWA installable (add to home screen) | ✅ | ✅ | ✅ | — |
| Offline workout logging | ✅ | ✅ | ✅ | — |
| Push notifications | ❌ | ❌ | ❌ | ✅ |
| Biometric login | ❌ | ❌ | ❌ | ✅ |
| **ADMIN & SUPPORT** | | | | |
| Admin dashboard | ❌ | ❌ | ✅ | — |
| User management | ❌ | ❌ | ✅ | — |
| Feature flags | ❌ | ❌ | ✅ | — |
| Activity log (audit trail) | ❌ | ❌ | ✅ | — |
| System health monitoring | ❌ | ❌ | ✅ | — |
| Bulk user operations | ❌ | ❌ | ✅ | — |
| Support ticket management | ❌ | ❌ | ✅ | — |
| Content moderation tools | ❌ | ❌ | ✅ | — |
| **AUTH & SECURITY** | | | | |
| JWT auth (15min/7d tokens) | ✅ | ✅ | ✅ | — |
| Email verification | ✅ | ✅ | ✅ | — |
| Password reset | ✅ | ✅ | ✅ | — |
| Account lockout protection | ✅ | ✅ | ✅ | — |
| Security audit log | ✅ | ✅ | ✅ | — |
| WebAuthn passkeys | ❌ | ❌ | ❌ | ✅ |

---

## Section 3: Per-Tier Sales Copy

---

### Tier 1: Starter — $199 One-Time

**Headline:**
Your Coaching Platform. Forever. $199.

**Subheadline:**
Stop paying $80/month for software you don't fully use. Get the essentials — 1,344 exercises, client tracking, workout logging — and own it forever.

**Unique Selling Proposition:**
The Starter tier is for the trainer who is tired of subscription fatigue. You have fewer than 5 clients right now. Maybe you're just getting started, maybe you're part-time, maybe you're testing the waters. You need real software — not a spreadsheet — but you don't need to go broke buying it. $199, once, and you're done. No renewal reminders. No price hike emails. No credit card required to "keep your data."

**Feature Bullets:**
- 1,344 professional exercises, each with an animated GIF demonstration — no need to explain form with words
- 10 body part categories × 29 equipment types × 26 target muscles — find the right exercise in seconds, not minutes
- Up to 5 active clients managed in one place with 5-status lifecycle tracking (Active, Pending, Offline, Need Programming, Archived)
- Set-by-set workout logging with automatic personal best detection and confetti-animation PR celebrations
- Built-in rest timer that starts automatically after each completed set — you never miss rest periods
- Adherence scoring shows exactly what percentage of the prescribed workout was completed
- Body composition tracking across 8 metric types with multi-line progress charts
- 2 active fitness goals with visual progress bars and target date countdown
- PWA-installable from the browser — works on iPhone, Android, desktop with no app store required
- Offline workout logging via IndexedDB — log sets in the gym even without Wi-Fi
- JWT authentication, email verification, and account lockout protection included

**Who It's For:**
The personal trainer who has 1-5 clients, coaches part-time, or is in their first year of business. Also perfect for independent coaches who want professional tools without committing to ongoing costs.

**CTA Text:**
Get Started for $199

**Objection Handler:**
*"Can I upgrade later?"* — Yes. Any time you outgrow Starter, you purchase the Professional or Enterprise upgrade and your existing data carries over. You never lose what you've built.

**Social Proof Angle:**
"Every serious trainer we know started with Starter. Most upgrade within 90 days — not because Starter is bad, but because they're growing. That's the point."

---

### Tier 2: Professional — $299 One-Time

**Headline:**
Run a Professional Coaching Business. Own It Forever.

**Subheadline:**
Unlimited clients, the full program builder, ACWR analytics, and scheduling — everything a full-time trainer needs in one platform, one price.

**Unique Selling Proposition:**
Professional is the tier that competes directly with Everfit, TrueCoach, and TrainHeroic — except you pay once. Those platforms charge $80-150/month. At $299 one-time, you break even in month 3 and everything after is pure margin. With Professional you get unlimited clients, the full Program Builder with 8 program types and 7 set types, ACWR training load monitoring used by professional sports teams, and calendar scheduling with iCal export. This is the "full kit."

**Feature Bullets:**
- Unlimited active clients — your roster can grow without your software bill growing
- 8 program types (Strength, Hypertrophy, Powerlifting, Bodybuilding, Sport-Specific, Rehabilitation, and more) for every client scenario
- 7 set types including Drop Sets, Pyramid Sets, AMRAP, Cluster Sets, and Rest-Pause for advanced programming
- RPE (Rate of Perceived Exertion), RIR (Reps in Reserve), and tempo prescriptions per set — the language of elite S&C coaches
- Superset and circuit support with A/B/C grouping so clients always know the execution order
- Deload week planning with automatically-reduced volume flags
- Template library — save your best programs and reuse them across clients with one click
- ACWR training load monitoring — the same acute:chronic workload ratio system used by the NFL and NBA, built in for free
- 5 appointment types (1-on-1, Group Class, Assessment, Consultation, Online Session) with meeting link support
- iCal export and subscribable calendar feed — your clients can subscribe in Google Calendar or Apple Calendar
- Analytics reports in PDF and CSV — generate weekly, monthly, or quarterly reports for clients
- Unlimited custom color tags to segment and filter your roster
- Bulk program assignment — assign one program to an entire tag group in one click

**Who It's For:**
The full-time personal trainer, online coach, or sports conditioning specialist who has (or expects to have) more than 5 clients and needs the complete platform to run their business professionally.

**CTA Text:**
Upgrade to Professional — $299

**Objection Handler:**
*"I'm not sure I need all the advanced programming features."* — You need them before you think you do. When a client plateaus, you need set types and RPE. When a client gets injured, you need the Rehabilitation program type. When you want to run a 6-week challenge, you need bulk assignment. Buy Professional once and have the tools before you need them — rather than upgrading under pressure mid-client engagement.

**Social Proof Angle:**
"Trainers on Professional typically recover their $299 in the first new client they land using EvoFit's professional analytics and reporting to justify their rates."

---

### Tier 3: Enterprise — $399 One-Time

**Headline:**
Platform-Level Control for Gym Owners and Studio Operators.

**Subheadline:**
Admin dashboard, feature flags, audit logs, and multi-trainer oversight — everything you need to manage a team and a platform, not just your own clients.

**Unique Selling Proposition:**
Enterprise is for the gym owner, studio operator, or lead trainer who needs to manage more than just their own clients. You need to see what's happening across your whole platform — who logged in, which features are enabled, which users need attention. Enterprise gives you the admin dashboard with platform-wide statistics, full user management (activate/deactivate/change roles), feature flags to roll out capabilities to specific users, a security audit trail, and bulk user operations. This is the tier that lets you run EvoFit as your studio's operating system.

**Feature Bullets:**
- Admin dashboard with platform-wide statistics: total users, active users, total sessions, growth trends
- Full user management: search, filter, activate/deactivate, change roles across all users on your instance
- Feature flags API — enable or disable specific features for specific users or groups without deploying code
- Activity log and security audit trail — see every login, role change, and system event with IP and device info
- Bulk user operations — activate, deactivate, or change roles for multiple users in one action
- System health monitoring dashboard showing PostgreSQL, Redis, and API status in real time
- Content moderation tools — flag and manage reported content via support ticket system
- Support ticket management — track and resolve user-submitted issues from within the platform
- All Professional features included — unlimited clients, full program builder, ACWR, scheduling, templates
- Account lockout controls — review and manage locked accounts from the admin panel
- Role assignment at scale — promote trainers to admin, demote clients, and manage org structure

**Who It's For:**
Gym owners managing a team of trainers, studio operators running multiple coaches, or lead trainers running a franchise-style business where they need platform-level visibility and control.

**CTA Text:**
Get Enterprise Access — $399

**Objection Handler:**
*"I'm just one trainer. Do I need Enterprise?"* — Probably not today. Enterprise is designed for operators managing multiple trainers or users who need administrative visibility. If you're flying solo with clients, Professional is the right fit and you can always upgrade to Enterprise later as your business grows.

**Social Proof Angle:**
"Studio owners on Enterprise tell us that the activity log alone is worth the upgrade — finally knowing exactly who's using what features and when, without asking anyone."

---

### Tier 4: SaaS Add-On — $39.99/Month

**Headline:**
Let AI Handle the Programming. You Handle the Coaching.

**Subheadline:**
AI workout generation, RPE-based progression suggestions, plateau detection, push notifications, and biometric login — your unfair advantage, $39.99/month on top of any tier.

**Unique Selling Proposition:**
The SaaS Add-on is the only recurring charge in the EvoFit ecosystem, and it's worth every dollar. It adds the AI layer on top of your platform: instant workout generation from the full 1,344-exercise library, automatic progression suggestions based on your clients' actual RPE data, and plateau detection that tells you when to deload before your client stalls. It also unlocks push notifications (so clients get pinged when it's workout time) and biometric login (Face ID / Touch ID) for a native-app-like experience. Think of it as the upgrade from "great software" to "software that thinks."

**Feature Bullets:**
- AI workout generator — select focus area, equipment, difficulty, and duration; get a full balanced workout in under 5 seconds from 1,344 exercises
- Filter by equipment available (home gym, hotel room, fully-equipped gym) — relevant workouts every time
- RPE-based progression suggestions — the system analyzes recent set data and tells you whether to increase weight, add reps, maintain, or deload — per exercise
- 6 progression rules: RPE 6-7 + hitting reps → increase weight; RPE 8+ → increase reps first; all sets at RPE 10 → reduce weight; >50% failed → deload; RPE <6 → double the increment
- Confidence-rated suggestions: High / Medium / Low based on data volume (requires 3+ sets for suggestions)
- Plateau detection — identifies when an exercise hasn't progressed in 4+ weeks and suggests variation changes
- Push notifications — browser-based web push to remind clients of scheduled workouts, program updates, and milestone achievements
- Biometric login — WebAuthn Face ID and Touch ID for instant, password-free login on mobile
- Enhanced AI insights — priority-rated coaching insights generated from training patterns across volume, consistency, recovery, and goal trajectories
- Stacks with any tier — add the SaaS Add-on to Starter, Professional, or Enterprise

**Who It's For:**
Trainers who want to save 30+ minutes per client per program cycle by having the AI suggest progressions, or those whose clients expect a high-tech, notification-driven experience. Also essential for online coaches managing large client volumes where manual progression calculations don't scale.

**CTA Text:**
Add AI Features — $39.99/mo

**Objection Handler:**
*"Can't I just calculate progressions manually?"* — You can. But at 10 clients each doing 4+ exercises per session, that's 40+ manual progression decisions per week. The SaaS Add-on does it in seconds based on actual RPE data — not gut feel. The $39.99/month pays for itself the moment you stop spending Saturday afternoons doing math in spreadsheets.

**Social Proof Angle:**
"Trainers with the SaaS Add-on report writing their first AI-generated workout in under 30 seconds. They use it to generate 'baseline' workouts and then spend their real coaching energy on the modifications — rather than starting from scratch every time."

---

## Section 4: Competitive Positioning

### Competitive Landscape

| Platform | Pricing Model | Monthly Cost | Per-Client Fee | EvoFit Advantage |
|----------|--------------|-------------|----------------|------------------|
| **Everfit** | Monthly subscription | ~$80–199/month | Tiered by client count | EvoFit: one-time payment, unlimited clients |
| **TrueCoach** | Monthly subscription | ~$19-150/month | Yes — per active client | EvoFit: no per-client fees, ever |
| **TrainHeroic** | Monthly subscription | ~$35-75/month | Team-based tiers | EvoFit: own the platform, no lock-in |
| **Google Sheets** | Free | $0/month | None | EvoFit: built-in PR detection, GIFs, analytics |

### The Core Differentiator

**One-time payment. Own forever. No per-client fees.**

Every competitor in this space charges recurring monthly fees and often additional fees per client. A trainer with 20 clients on TrueCoach's typical plan spends $1,200-1,800/year — every year. EvoFit Professional at $299 one-time means that same trainer breaks even in month 3 and has $900-1,500 in annual savings from year 1 onward.

### Feature Parity Comparison

| Feature | EvoFit Pro | Everfit | TrueCoach | TrainHeroic |
|---------|-----------|---------|-----------|-------------|
| Exercise library size | **1,344** | ~1,000 | ~1,000 | ~7,000 (athlete-focused) |
| ACWR training load | ✅ Built-in | Optional | ❌ | ✅ |
| iCal / calendar export | ✅ | Partial | ❌ | ❌ |
| RPE + RIR + Tempo | ✅ All three | ✅ | Partial | ✅ |
| Offline workout logging | ✅ | ❌ | ❌ | ❌ |
| One-time pricing | ✅ | ❌ | ❌ | ❌ |
| No per-client fee | ✅ | ❌ | ❌ | Varies |
| AI workout generation | ✅ (add-on) | Partial | ❌ | ❌ |
| Progression suggestions | ✅ (add-on) | ❌ | ❌ | Manual |

### Positioning Statement

> "EvoFit Trainer gives personal trainers the same tools as Everfit and TrueCoach — ACWR analytics, RPE programming, multi-type scheduling, unlimited clients — without the $80-200/month subscription. Pay once. Own it. Grow your business without growing your software bill."

### Objection: "Will it still be around in 5 years?"

EvoFit is deployed on Vercel with Neon PostgreSQL and Upstash Redis — production-grade infrastructure with SLAs. The codebase is open source compatible and you can export all your data in CSV format at any time. You own your clients' data and your programs. Even if EvoFit shut down tomorrow (it won't), you'd have a local export of everything you've built.

---

## Section 5: Key Numbers for Copy

These are the verified, production-accurate numbers to use in all marketing materials:

### Database & Content
| Stat | Value | Use In Copy As |
|------|-------|----------------|
| Total exercises | 1,344 | "1,344 professional exercises" |
| GIF demonstrations | 1,344 | "every exercise has an animated demo" |
| Body part categories | 10 | "10 body part categories" |
| Equipment types | 29 | "29 equipment types" |
| Target muscle groups | 26 | "26 target muscles" |
| Difficulty levels | 3 | "beginner to advanced" |
| Program types | 8 | "8 program types" |
| Set types | 7 | "7 set types" |
| Workout types | 6 | "6 workout types" |
| Appointment types | 5 | "5 appointment types" |
| Client status states | 5 | "5-stage client lifecycle" |
| Goal types | 8 | "8 goal types" |
| Body composition metrics | 8 | "8 performance metric types" |

### Technical Quality
| Stat | Value | Use In Copy As |
|------|-------|----------------|
| Unit tests | 4,720 | "4,720 automated tests" |
| E2E tests | 69 | "69 end-to-end tests" |
| Test suites | 276 | "276 test suites" |
| Test coverage | 85%+ | "85%+ code coverage" |
| Data models | 50 | "50 data models" |
| API endpoints | 68+ | "68+ API endpoints" |
| Feature areas | 12 | "12 major feature areas" |

### Business Numbers
| Stat | Value | Use In Copy As |
|------|-------|----------------|
| Monthly savings vs Everfit | $80-199 | "Save $960-2,388/year vs subscription tools" |
| Break-even vs monthly ($299 tier) | Month 3 | "Pay for itself in month 3" |
| 5-year savings vs $99.99/mo | $5,701 | "Save over $5,700 in 5 years" |

### ACWR Training Science
| Zone | Ratio | Use In Copy As |
|------|-------|----------------|
| Under-training | < 0.8 | "auto-detect under-training risk" |
| Optimal zone | 0.8 - 1.3 | "the sweet spot for adaptation" |
| Caution zone | 1.3 - 1.5 | "elevated injury risk" |
| High risk | > 1.5 | "immediate overtraining alert" |

---

## Section 6: Sales Funnel Page Structure

### Full Funnel Flow

```
[Traffic Source]
    ↓
[1. Landing Page] — Hero + Features + Social Proof + Single CTA
    ↓
[2. Pricing Page] — 4-tier comparison table + FAQ
    ↓
[3. Tier Detail Page] — Deep dive per tier (optional, driven by traffic)
    ↓
[4. Checkout] — Stripe hosted checkout
    ↓
[5. Upsell Page] — SaaS Add-on offer after one-time purchase
    ↓
[6. Success Page] — Confirmation + onboarding next steps
```

---

### Page 1: Landing Page

**URL:** `/` (production: evofittrainer-six.vercel.app)
**Goal:** Convert visitors to pricing page or direct signup

**Section Structure:**

1. **Hero**
   - Headline: "Own Your Coaching Platform. Forever."
   - Subheadline: "The all-in-one fitness coaching platform for personal trainers. No monthly fees. No per-client charges."
   - CTA: "See Pricing" (primary) + "Start Free" (secondary)
   - Trust signal: "1,344 exercises · 4,720 tests · Live on Vercel"

2. **Features Grid** (8 cards)
   - Exercise Library, Program Builder, Client Management, Workout Tracking, Analytics, Scheduling, AI Builder, Activity Feed

3. **Competitive Differentiator**
   - "Pay once vs. pay forever" comparison table (EvoFit vs Everfit, TrueCoach, TrainHeroic)
   - "$3$39$199 one-time vs. $1,200+/year"

4. **Numbers Section**
   - 1,344 exercises · 8 program types · 7 set types · ACWR analytics · Offline-first PWA

5. **Social Proof**
   - Testimonials from early users
   - "Built on the same analytics used by professional sports teams (ACWR)"

6. **Pricing Preview** (teaser cards)
   - Starter, Professional, Enterprise, SaaS Add-on
   - CTA: "Compare All Features →"

7. **Footer CTA**
   - "Start for $199 · Own it forever"

---

### Page 2: Pricing Page

**URL:** `/pricing`
**Goal:** Convert to checkout with correct tier selection

**Section Structure:**

1. **Header**
   - "Simple, One-Time Pricing"
   - "Pay once. Own forever. No monthly surprises."

2. **Toggle: One-Time Tiers | Monthly Add-On**

3. **Tier Cards (4 columns)**
   - Each card: price, headline, USP, 6 bullet highlights, CTA button
   - Highlight Professional as "Most Popular"
   - Show SaaS Add-on as "Stack on any tier"

4. **Full Feature Comparison Table**
   - Use Section 2 matrix from this document
   - Group by category (Exercise Library, Program Builder, etc.)
   - ✅/❌ checkmarks with quantity notes

5. **FAQ Section**
   - Q: Can I upgrade later? A: Yes, pay the difference.
   - Q: What if I have more than 5 clients on Starter? A: Upgrade to Professional.
   - Q: Is the SaaS Add-on required? A: No, it's optional.
   - Q: Do you charge per client? A: Never. All tiers except Starter have unlimited clients.
   - Q: What payment methods do you accept? A: All major credit cards via Stripe.
   - Q: Is there a free trial? A: Register for free and explore the platform before purchasing a tier.

6. **Guarantee**
   - "30-day money-back guarantee on all one-time purchases"

7. **Bottom CTA**
   - "Still not sure? Start free. Upgrade when you're ready."

---

### Page 3: Tier Detail Pages (Optional — Traffic-Driven)

**URLs:** `/pricing/starter`, `/pricing/professional`, `/pricing/enterprise`, `/pricing/saas`
**Goal:** Deep conversion for traffic landing on specific tier searches

**Section Structure (per tier):**

1. Tier headline + price + CTA above the fold
2. "Who is this for?" persona description
3. Full feature list for this tier (from Section 3 bullets, expanded)
4. Comparison: "How Starter compares to Professional" (upgrade nudge)
5. ROI calculator (e.g., "At $39.99/mo subscription alternative, you break even in 1 month")
6. Testimonial specific to this tier persona
7. CTA + objection handler inline
8. FAQ (tier-specific)

---

### Page 4: Stripe Checkout

**Implementation:** POST `/api/create-checkout-session`
**Mode:** `payment` for one-time tiers, `subscription` when SaaS add-on is included

**Checkout Parameters:**
- `tier`: starter | professional | enterprise
- `priceId`: validated against server-side VALID_PRICE_IDS map
- `saas`: boolean (optional)
- `saasPriceId`: validated if saas=true

**Success URL:** `/landing/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`
**Cancel URL:** `/landing/checkout-cancel.html`

**Trust Signals on Checkout:**
- Stripe badge ("Powered by Stripe")
- SSL lock icon
- "No recurring charges" note (for one-time tiers)
- Money-back guarantee badge

---

### Page 5: Post-Purchase Upsell

**URL:** `/landing/checkout-success.html` (enhanced)
**Trigger:** Shown after any one-time purchase (Starter, Professional, or Enterprise)
**Goal:** Convert one-time buyers to SaaS Add-on within 60 seconds of purchase

**Section Structure:**

1. **Confirmation Header**
   - "You're in! Welcome to EvoFit [Tier Name]."
   - "Your account is ready. One more thing before you get started..."

2. **SaaS Add-On Pitch**
   - "Unlock AI Workout Generation + Progression Suggestions for $39.99/month"
   - "Most trainers add this within 30 days. Save yourself the upgrade later."
   - 4 bullet highlights: AI workout builder, RPE progression, plateau detection, push notifications

3. **One-Click Add**
   - "Yes, add the AI layer — $39.99/month" (Stripe subscription)
   - "No thanks, I'll start without AI"

4. **No Pressure**
   - "You can add this any time from your account settings. It stacks with your existing tier."

---

### Page 6: Success / Onboarding Page

**URL:** `/landing/checkout-success.html` (final state after upsell decision)
**Goal:** Get new users into the app and complete their first meaningful action within 5 minutes

**Section Structure:**

1. **Celebration Header**
   - "You're set. Let's get your first program built."

2. **3-Step Quick Start**
   - Step 1: "Set up your profile" → link to /profile
   - Step 2: "Invite your first client" → link to /clients
   - Step 3: "Build your first program" → link to /programs/new

3. **Access Your Platform**
   - "Log in to EvoFit" → link to /auth/login
   - Or "Set your password" if auto-created account

4. **What to Do First (Trainer)**
   - Complete profile (certifications, specializations)
   - Invite first client (send branded email invitation)
   - Browse exercise library (1,344 exercises, filter by equipment)
   - Build first program (use template or start from scratch)

5. **Resources**
   - Link to business logic documentation
   - Link to FAQ
   - Support contact

---

*Document generated: March 28, 2026*
*Source: EvoFitTrainer codebase analysis — app/page.tsx, app/api/create-checkout-session/route.ts, docs/businesslogic.md, components/features/*, lib/services/*, prisma/schema.prisma*
