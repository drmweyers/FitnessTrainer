# EvoFit Trainer - Marketing Business Logic Document

**Generated:** March 1, 2026
**Version:** 1.0
**Purpose:** Comprehensive feature reference for marketing copywriters
**Production URL:** https://evofittrainer-six.vercel.app

---

## Executive Summary

EvoFit Trainer is a professional fitness coaching platform that gives personal trainers everything they need to build programs, manage clients, track workouts, and grow their business -- all from one place. Built as a direct competitor to Everfit, TrueCoach, and Trainerize, EvoFit delivers enterprise-grade tools at a fraction of the cost, with a modern interface designed for real-world gym use.

The platform ships with 1,344 exercises (each with animated GIF demonstrations), supports 3 distinct user roles (Trainer, Client, Admin), and covers 12 major feature areas from program design to progress analytics. Trainers can design multi-week periodized programs with superset support, RPE/RIR tracking, and tempo prescriptions. Clients can log workouts in real time with rest timers, personal best detection, and offline support. Both roles benefit from a comprehensive analytics suite that tracks body composition, performance metrics, training load, and goal progress.

What makes EvoFit different is its depth. Most competitors offer basic program builders and simple logging. EvoFit goes further with advanced features like ACWR (Acute:Chronic Workload Ratio) monitoring, AI-powered insights, 7 different set types (warmup, working, drop, pyramid, AMRAP, cluster, rest-pause), 8 program types, and a sophisticated client management system with status tracking, color-coded tags, and invitation workflows. The platform is live in production, battle-tested with 4,594 unit tests and 69 end-to-end tests, and runs on a modern stack (Next.js, PostgreSQL, Redis) deployed on Vercel for lightning-fast global performance.

---

## Target Audience Profiles

### Primary: Independent Personal Trainers

**Who they are:** Fitness professionals aged 25-45 running their own training business. They may work out of a commercial gym, a private studio, or remotely. They typically manage 5 to 50+ clients and are looking to scale without drowning in administrative work.

**Pain points EvoFit solves:**
- **Juggling spreadsheets and apps:** Trainers currently use a patchwork of Google Sheets, WhatsApp, note-taking apps, and maybe a generic fitness app. EvoFit replaces all of these with one integrated platform.
- **Time spent on admin:** Every hour spent writing programs, chasing clients for check-ins, and managing schedules is an hour not spent training. EvoFit automates program templates, client tracking, and scheduling.
- **Looking unprofessional:** Sending clients a PDF workout via email doesn't inspire confidence. EvoFit provides a polished, branded experience that makes trainers look like they have a tech team behind them.
- **Can't scale:** Trading time for money means income is capped. With EvoFit's program templates, bulk assignment, and remote coaching tools, trainers can serve more clients in less time.
- **No visibility into client progress:** Without data, trainers are guessing. EvoFit gives them dashboards showing compliance, personal bests, training load, and goal progress for every client.

**What they value:** Efficiency, professional presentation, data-driven coaching, client retention tools, and the ability to grow revenue without working more hours.

### Secondary: Fitness Clients

**Who they are:** Health-conscious adults aged 25-55, typically busy professionals who invest in personal training because they want expert guidance, accountability, and results. They value convenience and expect a modern digital experience.

**Pain points EvoFit solves:**
- **Forgetting their workout:** No more screenshots of workout PDFs. Their program is always in their pocket, with animated demonstrations for every exercise.
- **Not seeing progress:** EvoFit tracks personal bests, body measurements, training streaks, and goal progress -- making improvements visible and motivating.
- **Lack of accountability:** With trainer feedback on sessions, activity feeds, and check-in tools, clients stay engaged between in-person sessions.
- **Gym confusion:** Animated GIF demonstrations for all 1,344 exercises mean clients never wonder "am I doing this right?"

**What they value:** Simplicity, motivation, seeing results, professional guidance, and flexibility to train on their own schedule.

### Tertiary: Gym Administrators

**Who they are:** Owners or managers of fitness facilities who need oversight of trainers, clients, and platform operations. They need to ensure quality, manage user accounts, and monitor system health.

**Pain points EvoFit solves:**
- **No visibility into trainer activity:** The admin dashboard shows platform-wide statistics, user management, and system health at a glance.
- **User management overhead:** Admins can activate/deactivate accounts, manage roles, and oversee all users from one interface.
- **System reliability concerns:** Built-in system health monitoring, rate limiting, and security audit logs provide confidence that the platform is running smoothly.

**What they value:** Control, oversight, reliability, and ease of management.

---

## Feature Deep Dives

### 1. User Profiles & Onboarding

**One-Line Pitch:** Complete your profile in minutes and start training with a personalized experience built around your goals, health history, and fitness level.

**Description:**
EvoFit's onboarding experience is designed to get trainers and clients up and running fast while capturing the information needed for safe, effective training. Trainers create a professional profile with certifications, specializations, and a bio that establishes their credibility. Clients complete a comprehensive health questionnaire covering medical conditions, injuries, medications, allergies, and lifestyle factors.

The platform tracks profile completion with a visual progress widget that gamifies the setup process. Users see exactly what's missing and get guided prompts to fill in their information. For trainers, this includes uploading certifications (with issuing organization, credential IDs, and expiry tracking) and defining their specializations with years of experience. For clients, it includes setting fitness goals (from 8 goal types), recording body measurements, and uploading progress photos.

Every profile includes WhatsApp integration for direct communication, timezone support for remote coaching, and the choice between metric and imperial units. Progress photos are organized by type (front, side, back) with privacy controls, creating a visual record of transformation that motivates clients and demonstrates trainer effectiveness.

**Key Capabilities:**
- Profile creation with bio, photo, date of birth, gender, phone, and WhatsApp number
- Health questionnaire capturing medical conditions, medications, allergies, injuries, surgeries, family history, and lifestyle factors
- 8 fitness goal types: weight loss, muscle gain, endurance, strength, flexibility, general fitness, sport-specific, rehabilitation
- Goal tracking with target values, target dates, priority ranking, and achievement tracking
- Trainer certifications with issuing organization, credential ID, issue/expiry dates, and document upload
- Trainer specializations with years of experience per specialization
- Progress photos organized by type (front, side, back, other) with privacy controls
- Profile completion tracking widget with percentage indicator and guided prompts
- Metric and imperial unit support
- Timezone-aware scheduling
- Emergency contact information storage

**User Benefits:**

| Benefit | Description |
|---------|-------------|
| Professional first impression | Trainers showcase certifications and specializations that build instant credibility with new clients |
| Safe training foundation | The health questionnaire ensures trainers know about medical conditions, injuries, and limitations before designing programs |
| Goal clarity | 8 goal types with specific targets and dates keep both trainer and client aligned on what success looks like |
| Visual motivation | Progress photos create a powerful before-and-after record that keeps clients motivated and proves trainer results |
| Quick setup | The profile completion widget guides users through setup step by step, making the process fast and painless |

**Data Points for Marketing:**
- "8 fitness goal types to match any training objective"
- "Comprehensive health questionnaire covers medical conditions, medications, injuries, and lifestyle"
- "Track trainer certifications with expiry date reminders"
- "Progress photos organized by angle (front, side, back) for accurate comparisons"
- "Support for both metric and imperial measurements"

**Competitive Differentiator:**
EvoFit's health questionnaire goes deeper than most competitors, capturing not just basics but family medical history, lifestyle factors (smoking, drinking, sleep, stress), surgical history, and emergency contacts. This gives trainers the complete picture they need for safe, informed programming -- especially important for rehabilitation and special populations work.

**Suggested Marketing Copy Angles:**
1. "Your complete client profile -- health history, goals, and progress photos -- all in one place."
2. "Professional trainer profiles that showcase your certifications and build instant credibility."
3. "From medical history to fitness goals: everything you need to train clients safely and effectively."

**Screenshots:**
- Desktop: `screenshots/trainer/profile-desktop.png`
- Mobile: (captured at mobile viewport)

**Technical Notes for Copywriter:**
- Photo uploads are deferred post-MVP (routes currently return "coming soon"). Focus messaging on the profile and health data capture features.
- Custom exercise creation by trainers is not yet implemented.

---

### 2. Authentication & Security

**One-Line Pitch:** Enterprise-grade security with simple, fast login -- your clients' data is protected by the same standards used by financial institutions.

**Description:**
EvoFit takes security seriously. The authentication system uses industry-standard JWT tokens with short-lived access tokens (15 minutes) and longer refresh tokens (7 days), ensuring that even if a token is compromised, exposure is limited. Every login attempt is logged in a security audit trail that records IP addresses, device information, and success/failure status.

The platform includes built-in protection against brute-force attacks with automatic account lockout after failed attempts, password reset flows with time-limited tokens, and rate limiting on all API endpoints. Trainers can rest assured that their clients' sensitive health data -- medical conditions, injuries, medications -- is protected behind role-based access controls that ensure only authorized users can see what they're supposed to.

Registration supports distinct trainer and client roles from the start, with clients typically joining through a personalized email invitation from their trainer. The invitation system uses secure tokens with expiration dates and tracks invitation status (pending, accepted, expired) so trainers always know where their onboarding pipeline stands.

**Key Capabilities:**
- JWT authentication with 15-minute access tokens and 7-day refresh tokens
- Role-based registration (trainer, client, admin)
- Email-based password recovery with time-limited reset tokens
- Security audit logging (IP address, device info, user agent, success/failure)
- Account lockout protection after failed login attempts
- Rate limiting on all API endpoints
- Two-factor authentication support (database ready)
- OAuth social login infrastructure (Google, Apple, Facebook -- database ready)
- Session management with device tracking
- API token system for future integrations

**User Benefits:**

| Benefit | Description |
|---------|-------------|
| Client data protection | Sensitive health information is protected behind role-based access -- only the assigned trainer and the client can see it |
| Peace of mind | Security audit logs and account lockout protection mean trainers can assure clients their data is safe |
| Simple login experience | Despite robust security, the login experience is fast and frictionless |
| Invitation-based onboarding | Clients join through personalized trainer invitations, creating a professional first impression |
| Device management | Session tracking means trainers can see where their account is logged in and revoke access if needed |

**Data Points for Marketing:**
- "Bank-level security with JWT token authentication"
- "Automatic account lockout after failed login attempts"
- "Complete security audit trail for every login"
- "Role-based access ensures only authorized users see sensitive data"
- "3 user roles: Trainer, Client, and Administrator"

**Competitive Differentiator:**
Most fitness platforms treat security as an afterthought. EvoFit includes a full security audit trail, account lockout protection, and rate limiting from day one -- the kind of infrastructure typically found in enterprise software, not fitness apps.

**Suggested Marketing Copy Angles:**
1. "Your clients' health data deserves bank-level security. EvoFit delivers it."
2. "Professional onboarding: personalized email invitations that make your business look polished."
3. "Three roles, one platform: Trainer, Client, and Admin -- each with exactly the access they need."

**Screenshots:**
- Desktop: `screenshots/public/login-desktop.png`
- Register: `screenshots/public/register-desktop.png`

**Technical Notes for Copywriter:**
- Two-factor authentication and OAuth social login are infrastructure-ready but not yet enabled in the UI. Don't mention these as current features.
- Focus on the security audit trail and role-based access as differentiators.

---

### 3. Client Management

**One-Line Pitch:** Your complete client roster -- organized, searchable, and always up to date -- with status tracking, notes, tags, and invitation management in one view.

**Description:**
Client management is the operational backbone of every training business, and EvoFit treats it accordingly. The system tracks every client through a clear status lifecycle: from initial invitation (pending) through active training, to archived status when they move on. Trainers can see at a glance which clients need new programming, who hasn't been active lately, and which invitations are still outstanding.

The invitation system is particularly powerful. Trainers enter a client's email, optionally add a custom welcome message, and EvoFit sends a professional, branded invitation with a secure token link. The invitation tracks its status (pending, accepted, expired) with automatic expiry after 7 days. Once accepted, the trainer-client relationship is automatically established and the client appears in the trainer's roster.

Beyond basic contact management, EvoFit lets trainers organize clients with color-coded custom tags (e.g., "Morning Group", "Weight Loss", "VIP"), add private session notes that clients never see, track medical conditions and fitness levels, and manage the complete client lifecycle from a single dashboard.

**Key Capabilities:**
- 5 client status states: Active, Pending, Offline, Need Programming, Archived
- Email invitation system with custom welcome messages, secure tokens, and 7-day expiry
- Invitation status tracking (pending, accepted, expired)
- Client profiles with medical conditions, medications, allergies, injuries, and fitness level
- Private trainer notes per client (never visible to clients)
- Color-coded custom tags for organizing clients (unlimited tags, custom colors)
- Tag-based filtering for bulk operations
- Client-trainer relationship management with connection timestamps
- Soft-delete archiving (data retained, can be reactivated anytime)
- Client preferences and goals stored as flexible JSON data

**User Benefits:**

| Benefit | Description |
|---------|-------------|
| Never lose track of a client | 5 status states mean you always know who's active, who needs attention, and who's waiting for a program |
| Professional invitations | Branded email invitations with custom messages make your business look established and trustworthy |
| Organized at scale | Color-coded tags let you group clients by schedule, goal, level, or any category that makes sense for your business |
| Safe coaching | Medical conditions, injuries, and limitations are front and center in client profiles -- never program blind |
| Private notes that matter | Session observations, motivational strategies, and medical considerations stay between you and your records |

**Data Points for Marketing:**
- "5 client status states for complete lifecycle tracking"
- "Email invitations with custom messages and automatic 7-day expiry"
- "Color-coded tags for organizing clients by any criteria"
- "Private notes system -- session observations clients never see"
- "3 fitness levels: Beginner, Intermediate, Advanced"

**Competitive Differentiator:**
EvoFit's client management combines CRM-like organization (tags, notes, status tracking) with fitness-specific intelligence (medical conditions, fitness levels, injury tracking). Most competitors offer basic client lists; EvoFit gives trainers a full client operations center.

**Suggested Marketing Copy Angles:**
1. "From first invitation to long-term coaching: manage your entire client journey in one place."
2. "Color-coded tags, private notes, and 5 status states -- client management that scales with your business."
3. "Professional email invitations that make your first impression count."

**Screenshots:**
- Desktop: `screenshots/trainer/clients-list-desktop.png`

**Technical Notes for Copywriter:**
- Bulk operations are available (bulk invitation, bulk assignment). Mention these for the "scaling your business" angle.
- The client management system is fully functional and production-tested.

---

### 4. Exercise Library

**One-Line Pitch:** Access 1,344 professional exercises with animated demonstrations, advanced filters, and personal collections -- the largest built-in exercise database in its class.

**Description:**
The Exercise Library is the foundation of every training program on EvoFit. Trainers and clients can browse, search, and filter through 1,344 professionally curated exercises, each with an animated GIF demonstration showing proper form. Every exercise includes step-by-step instructions, target and secondary muscle identification, equipment requirements, and difficulty classification.

Unlike competitors that rely on static images or require trainers to upload their own content, EvoFit provides a ready-to-use library on day one. Trainers can build personal favorite lists and custom collections (e.g., "Knee Rehab Exercises" or "Home Workout Essentials") to speed up program creation. Collections support custom ordering and can be shared or kept private.

The advanced filter system lets users narrow exercises by body part (10 categories), equipment type (29 types), target muscle (26 groups), and difficulty level (3 tiers) -- simultaneously. Full-text search makes finding the right exercise instant. The mobile-optimized card layout with touch-friendly GIF player means the library works perfectly in the gym, where trainers often demo exercises for clients on their phone.

**Key Capabilities:**
- 1,344 exercises with animated GIF demonstrations
- 10 body part categories: neck, shoulders, chest, back, upper arms, lower arms, waist, upper legs, lower legs, cardio
- 29 equipment types: body weight, barbell, dumbbell, cable, resistance bands, machines, kettlebell, medicine ball, and 21 more
- 26 target muscle groups with secondary muscle mapping
- 3 difficulty levels: beginner, intermediate, advanced
- Full-text search with instant results
- Multi-filter stacking (body part + equipment + muscle + difficulty simultaneously)
- Favorite exercises for quick access
- Custom exercise collections with ordering and descriptions
- Detailed exercise view with step-by-step instructions
- Related exercises suggestions based on target muscles
- Mobile-optimized card layout with touch-friendly GIF player
- Responsive grid with skeleton loading states
- Exercise usage tracking and search history

**User Benefits:**

| Benefit | Description |
|---------|-------------|
| Save hours of content creation | No need to film, edit, or upload exercise demonstrations -- 1,344 are ready from day one |
| Professional client experience | Animated GIFs show exactly how to perform each movement, reducing confusion and injury risk |
| Find any exercise instantly | Advanced search plus multi-filter narrowing means you find the perfect exercise in seconds |
| Build your toolkit | Favorite exercises and custom collections speed up program creation by keeping your go-to moves one click away |
| Mobile gym companion | Mobile-optimized cards and GIF player work perfectly when showing clients exercises in the gym |

**Data Points for Marketing:**
- "1,344 exercises with animated GIF demonstrations"
- "10 body part categories, 29 equipment types, 26 target muscle groups"
- "Find the perfect exercise in seconds with advanced multi-filter search"
- "Build custom collections like 'Knee Rehab' or 'Home Workout Essentials'"
- "3 difficulty levels for every skill level"

**Competitive Differentiator:**
EvoFit ships with 1,344 ready-to-use exercises from day one -- no setup, no uploading, no content creation needed. Each exercise has an animated GIF (not a static image), step-by-step instructions, and complete muscle mapping including secondary muscles. Most competitors either have smaller built-in databases or require trainers to build their own library.

**Suggested Marketing Copy Angles:**
1. "1,344 exercises. Zero setup. Start building programs in minutes."
2. "Every exercise demonstrated with animated form guides -- your clients never guess."
3. "Filter by body part, equipment, muscle, or difficulty. Find the perfect exercise in seconds."

**Screenshots:**
- Desktop: `screenshots/trainer/exercises-library-desktop.png`
- Public: `screenshots/public/exercises-desktop.png`

**Technical Notes for Copywriter:**
- Custom exercise creation (trainer-uploaded exercises) is not yet implemented. Focus on the built-in library.
- Exercise GIFs are sourced from ExerciseDB, a professional exercise database.
- The exercise count is confirmed at 1,344 in production.

---

### 5. Program Builder

**One-Line Pitch:** Design professional multi-week training programs with supersets, progressive overload, RPE tracking, and tempo prescriptions -- then save as templates and assign to any client in seconds.

**Description:**
The Program Builder is where EvoFit's depth really shines. Trainers can create sophisticated, periodized training programs that rival what you'd find in elite strength and conditioning facilities. Programs are organized by weeks, with each week containing individual workout days. Each workout day holds exercises in a specific order, with support for superset grouping (A/B/C groups), circuit training, and detailed set configurations.

What sets EvoFit apart is the granularity of set configuration. Each set can be typed (warmup, working, drop, pyramid, AMRAP, cluster, rest-pause), with specific rep ranges ("8-10", "AMRAP", "30s"), weight guidance ("70% 1RM", "RPE 7", "Bodyweight"), rest periods, tempo prescriptions ("3-1-2-0" for eccentric-pause-concentric-pause), and RPE/RIR targets. This level of detail is typically only found in high-end coaching platforms used by competitive athletes.

Programs can be saved as templates with categories and tags, allowing trainers to build once and reuse unlimited times. Template ratings and use counts help trainers identify their most effective programs. When ready, trainers assign programs to clients with custom start dates, notes, and progress tracking -- or use bulk assignment to roll out the same program to an entire group.

**Key Capabilities:**
- 8 program types: Strength, Hypertrophy, Endurance, Powerlifting, Bodybuilding, General Fitness, Sport-Specific, Rehabilitation
- Multi-week program structure with named weeks and descriptions
- Deload week designation for recovery planning
- 6 workout types per day: Strength, Cardio, HIIT, Flexibility, Mixed, Recovery
- Rest day designation within program weeks
- Exercise ordering with drag-and-drop
- Superset/circuit grouping (A/B/C groups) for exercise pairing
- 7 set types: Warmup, Working, Drop, Pyramid, AMRAP, Cluster, Rest-Pause
- Rep range flexibility ("8-10", "AMRAP", "30s" for timed work)
- Weight guidance options: percentage-based (%1RM), RPE-based, bodyweight
- Tempo prescriptions (eccentric-pause-concentric-pause format, e.g., "3-1-2-0")
- RPE (Rate of Perceived Exertion, 1-10 scale) per set
- RIR (Reps in Reserve) per set
- Rest period configuration per set (in seconds)
- Exercise-level notes for coaching cues
- Estimated workout duration
- Program templates with categories, tags, ratings, and use count tracking
- Program duplication for quick variations
- Client assignment with custom start dates and notes
- Bulk assignment modal for group programs
- Program preview before publishing
- Equipment needed list per program
- Difficulty level setting (Beginner, Intermediate, Advanced)

**User Benefits:**

| Benefit | Description |
|---------|-------------|
| Build once, use forever | Save programs as templates and assign them to new clients in seconds -- no rebuilding from scratch |
| Elite-level programming | RPE, RIR, tempo, and 7 set types give you the tools to design programs as sophisticated as any S&C facility |
| Flexible for any goal | 8 program types cover everything from rehabilitation to powerlifting competition prep |
| Group efficiency | Bulk assignment lets you roll out the same program to an entire bootcamp or training group instantly |
| Smart periodization | Deload weeks, progressive overload planning, and multi-week structure support true periodized training |

**Data Points for Marketing:**
- "8 program types from general fitness to competitive powerlifting"
- "7 set types including AMRAP, drop sets, pyramids, and cluster sets"
- "Tempo prescriptions, RPE tracking, and percentage-based weight guidance"
- "Save unlimited templates -- build once, reuse forever"
- "Bulk assign programs to entire groups with one click"

**Competitive Differentiator:**
EvoFit's Program Builder offers elite S&C-level programming tools (RPE/RIR, tempo prescriptions, 7 set types, superset grouping) that competitors typically reserve for their highest pricing tiers or don't offer at all. The combination of depth and usability means trainers can design programs as simple or as sophisticated as their clients need.

**Suggested Marketing Copy Angles:**
1. "From beginner bodyweight to competition powerlifting: one builder for every program."
2. "RPE, tempo, supersets, and 7 set types -- the most powerful program builder in fitness coaching."
3. "Build once, assign to many. Templates that scale your programming efficiency."

**Screenshots:**
- Desktop: `screenshots/trainer/program-create-desktop.png`
- Programs list: `screenshots/trainer/programs-list-desktop.png`

**Technical Notes for Copywriter:**
- Drag-and-drop is supported for exercise ordering and week management.
- Progressive overload UI is ~95% complete -- it's functional but may see minor polish updates.
- The AI Workout Builder (separate feature) can auto-generate workouts from the full 1,344 exercise library.

---

### 6. Workout Tracking & Logging

**One-Line Pitch:** Log every rep, track every personal best, and review every session -- real-time workout tracking that turns data into motivation.

**Description:**
Workout tracking is where the rubber meets the road, and EvoFit's logging system captures everything that matters. When a client starts a workout session, the platform tracks it in real time: which exercise they're on, which set they're doing, and how the session is progressing. For each set, clients log actual reps performed, weight used, RPE rating, and rest time taken -- all compared against the planned prescription.

The system automatically detects personal bests, calculates total session volume, tracks adherence scores (how closely the client followed the prescription), and captures subjective feedback including effort rating, enjoyment rating, and energy levels before and after the workout. Trainers can add their own feedback to any session, creating a coaching dialogue around the actual training data.

Workout history is maintained as a complete timeline, allowing both trainers and clients to look back at any session, compare performance over time, and identify trends. The offline support means clients can log workouts even without internet connection -- data syncs automatically when they reconnect.

**Key Capabilities:**
- Real-time workout session tracking with start/end time and duration
- Set-by-set logging: planned vs actual reps, weight, RPE, RIR
- Rest timer between sets with actual rest time recording
- Tempo tracking per set
- Automatic personal best detection with flagging
- Session metrics: total volume, total sets, completed sets, average RPE, adherence score
- User feedback: effort rating (1-10), enjoyment rating (1-10), energy before/after (1-10)
- Client notes per session
- Trainer feedback per session
- 5 workout statuses: Scheduled, In Progress, Completed, Skipped, Missed
- Current exercise and set index tracking for session resume
- Pause time tracking
- Workout history timeline
- Superset group tracking during execution
- Exercise-level volume calculations
- Offline workout support via IndexedDB with automatic sync
- Active workout indicator

**User Benefits:**

| Benefit | Description |
|---------|-------------|
| Never miss a personal best | Automatic PR detection means every achievement is captured and celebrated |
| Data-driven coaching | Adherence scores, volume tracking, and RPE data give trainers objective measures of client performance |
| Complete session picture | Effort, enjoyment, and energy ratings tell the whole story -- not just what was lifted but how it felt |
| Train anywhere | Offline support means clients can log workouts in basements, outdoor parks, or anywhere without signal |
| Two-way feedback | Clients add notes, trainers add feedback -- creating ongoing coaching dialogue around real training data |

**Data Points for Marketing:**
- "Track every rep, set, and personal best automatically"
- "5 subjective feedback metrics per session (effort, enjoyment, energy before/after, notes)"
- "Adherence scores show exactly how closely clients follow their programs"
- "Offline workout logging with automatic sync"
- "Complete workout history timeline for any time period"

**Competitive Differentiator:**
EvoFit captures both objective data (reps, weight, volume) and subjective data (effort, enjoyment, energy) in every session. This dual perspective gives trainers insight into not just what happened, but how it felt -- enabling smarter programming adjustments. The automatic adherence scoring is particularly valuable for remote coaching where trainers can't observe sessions directly.

**Suggested Marketing Copy Angles:**
1. "Every rep logged. Every personal best celebrated. Every session tells a story."
2. "Know how your clients train even when you're not there -- adherence scores, RPE data, and session feedback."
3. "Offline-ready workout logging: train anywhere, sync automatically."

**Screenshots:**
- Desktop: `screenshots/trainer/workouts-overview-desktop.png`
- Builder: `screenshots/trainer/workout-builder-desktop.png`

**Technical Notes for Copywriter:**
- The rest timer is built into the logging interface -- clients don't need a separate timer app.
- Offline support uses IndexedDB for local storage with a sync manager that handles reconnection.
- Personal best detection works automatically during logging -- no manual tracking needed.

---

### 7. Progress Analytics

**One-Line Pitch:** See the full picture of client progress -- body composition trends, performance metrics, training load monitoring, personal bests, and AI-powered insights -- all in visual dashboards.

**Description:**
EvoFit's analytics suite transforms raw training data into actionable insights. The platform tracks 8 performance metric types (1RM, volume, endurance, power, speed, body weight, body fat, muscle mass), calculates training load ratios, monitors goal progress, and generates AI-powered recommendations prioritized by impact.

Body composition tracking captures weight, body fat percentage, muscle mass, and custom measurements (chest, waist, hips, and more) over time, displayed as interactive multi-line charts with configurable time ranges. Trainers can set comparison baselines to show clients exactly how far they've come since day one.

The training load monitoring system calculates Acute:Chronic Workload Ratio (ACWR) -- the same metric used by professional sports teams to prevent overtraining and injuries. By comparing 7-day rolling load against 28-day chronic load, trainers can see when a client is in the "sweet spot" for progress or when they're at risk of overtraining. Combined with milestone achievements, goal progress tracking, and downloadable analytics reports, EvoFit gives trainers and clients complete visibility into every dimension of fitness progress.

**Key Capabilities:**
- 8 metric types tracked: 1RM, Volume, Endurance, Power, Speed, Body Weight, Body Fat, Muscle Mass
- Body composition charts with weight, body fat %, and muscle mass trends
- Custom body measurements (chest, waist, hips, arms, legs, etc.) stored as flexible JSON
- Multi-line progress charts with configurable time ranges
- Performance metrics linked to specific exercises and workout sessions
- Personal bests tracking and display
- Training load monitoring: acute load (7-day), chronic load (28-day), ACWR ratio
- Body part distribution analysis in training load
- Goal tracking with progress percentages and target dates
- Goal progress over time with recorded checkpoints
- Milestone achievements with types, titles, descriptions, and achieved values
- AI-powered insights with priority levels (low, medium, high), read/action tracking
- Chart preferences and customization per user
- Comparison baselines for before/after analysis
- Analytics reports with period selection, downloadable data, and optional trainer commentary
- Insight expiration for time-sensitive recommendations

**User Benefits:**

| Benefit | Description |
|---------|-------------|
| See progress you can't feel | Body composition charts and personal bests make invisible progress visible, keeping clients motivated |
| Prevent overtraining | ACWR monitoring flags when training load gets dangerous -- the same system used by professional sports teams |
| Data-driven programming | 8 metric types and exercise-specific tracking give trainers the data they need to make smart program adjustments |
| Goal accountability | Visual goal progress with percentages and target dates keeps clients focused on their objectives |
| AI-powered coaching insights | Prioritized recommendations surface the most impactful changes trainers should make for each client |

**Data Points for Marketing:**
- "8 performance metric types tracked automatically"
- "ACWR (Acute:Chronic Workload Ratio) monitoring -- used by professional sports teams"
- "AI-powered insights prioritized by impact"
- "Goal tracking with visual progress percentages"
- "Downloadable analytics reports for client reviews"

**Competitive Differentiator:**
EvoFit's ACWR training load monitoring is a feature typically found only in elite sports performance platforms, not consumer-grade coaching tools. Combined with AI-powered insights and 8 metric types, EvoFit offers the most comprehensive analytics suite in its price class. Most competitors stop at basic body weight tracking and simple strength charts.

**Suggested Marketing Copy Angles:**
1. "Professional sports analytics for every trainer. ACWR monitoring, AI insights, and 8 metric types."
2. "Show clients exactly how far they've come -- body composition charts, personal bests, and goal progress."
3. "Smart insights that tell you what to change and why -- data-driven coaching without the data science degree."

**Screenshots:**
- Desktop: `screenshots/trainer/analytics-desktop.png`
- Mobile: `screenshots/trainer/analytics-mobile.png`

**Technical Notes for Copywriter:**
- AI insights are generated based on training data patterns -- not from an external AI API. They're rule-based recommendations.
- Analytics reports can include trainer commentary, making them useful for client review sessions.
- Progress photos are part of the analytics suite but photo uploads are deferred post-MVP.

---

### 8. Messaging & Communication

**One-Line Pitch:** Stay connected with clients through WhatsApp integration, in-app activity feeds, and real-time invitation notifications.

**Description:**
Communication is the thread that holds the trainer-client relationship together, and EvoFit provides multiple channels to keep that connection strong. Every user profile includes a WhatsApp number field, enabling trainers to reach clients on the messaging platform they already use daily. The in-app activity feed creates a timeline of all platform activity -- workouts completed, milestones achieved, programs assigned, and more -- keeping both trainers and clients informed without requiring direct messages.

The notification system handles invitation workflows, alerting trainers when invitations are accepted and clients when new programs or sessions are assigned. Activity items are enriched with metadata and linked to related content, so users can tap any activity to jump directly to the relevant workout, program, or achievement.

**Key Capabilities:**
- WhatsApp number field on user profiles for direct messaging
- In-app activity feed with chronological timeline
- Activity types: workout completions, milestone achievements, program updates, system events
- Activity metadata with related IDs and types for deep linking
- Invitation notifications (sent, accepted, expired)
- Trainer feedback on workout sessions
- Client notes on workout sessions

**User Benefits:**

| Benefit | Description |
|---------|-------------|
| Meet clients where they are | WhatsApp integration lets trainers communicate on the platform clients already use every day |
| Stay in the loop | Activity feeds keep both parties informed about workouts, achievements, and program updates |
| Seamless workflows | Invitation notifications ensure the onboarding process moves smoothly without manual follow-up |

**Data Points for Marketing:**
- "WhatsApp integration for instant client communication"
- "Real-time activity feed tracking workouts, milestones, and program updates"
- "Notification system for invitations and program assignments"

**Competitive Differentiator:**
While many competitors build proprietary in-app messaging (which clients rarely check), EvoFit takes the practical approach of integrating with WhatsApp -- where clients already spend their time. Combined with the activity feed for platform-specific updates, trainers get the best of both worlds.

**Suggested Marketing Copy Angles:**
1. "Communicate where your clients already are -- WhatsApp integration built right in."
2. "Never miss a client milestone. Real-time activity feeds keep you connected."
3. "From invitation to first workout: automated notifications that keep onboarding on track."

**Screenshots:**
- Activity feed visible on dashboard screenshots

**Technical Notes for Copywriter:**
- Full in-app real-time messaging (chat) is not yet implemented. Focus on WhatsApp integration, activity feeds, and notification workflows.
- Video calling is planned but not yet built. Do not mention video consultations.

---

### 9. Scheduling & Calendar

**One-Line Pitch:** Manage your training schedule with a visual calendar, configurable availability, and 5 appointment types -- from one-on-one sessions to online consultations.

**Description:**
EvoFit's scheduling system gives trainers control over their availability while making it easy for clients to book sessions. Trainers configure their weekly availability by day of week, setting start and end times and optionally specifying a location for each time slot. The calendar displays appointments in a monthly grid view with day cells showing workout cards for scheduled sessions.

The appointment system supports 5 distinct session types: one-on-one training, group classes, assessments, consultations, and online sessions. Each appointment tracks its full lifecycle through 5 statuses (scheduled, confirmed, completed, cancelled, no-show), with cancellation timestamps and reasons recorded for business analytics. Online sessions include meeting link support, making virtual coaching seamless.

**Key Capabilities:**
- Monthly calendar grid view with day cells and workout cards
- Weekly and daily views for detailed scheduling
- Trainer availability configuration: day-of-week, start time, end time, location
- 5 appointment types: One-on-One, Group Class, Assessment, Consultation, Online Session
- 5 appointment statuses: Scheduled, Confirmed, Completed, Cancelled, No-Show
- Online session support with meeting links
- Duration-based scheduling (configurable minutes per session)
- Location support per availability slot and per appointment
- Cancellation tracking with timestamps and reasons
- Appointment notes for session preparation
- Index-optimized queries by trainer+date and client+date

**User Benefits:**

| Benefit | Description |
|---------|-------------|
| Control your time | Set exactly when and where you're available, down to specific time slots per day |
| Diverse session types | Whether it's a 1:1 session, group bootcamp, online consultation, or assessment -- one calendar handles it all |
| Full session lifecycle | Track every appointment from booking through completion, including cancellations and no-shows |
| Virtual coaching ready | Meeting link support makes online sessions as easy to schedule as in-person ones |
| Location flexibility | Set different locations for different time slots -- gym in the morning, park in the afternoon |

**Data Points for Marketing:**
- "5 appointment types: one-on-one, group, assessment, consultation, online"
- "5 status states for complete appointment lifecycle tracking"
- "Configurable availability by day, time, and location"
- "Built-in online session support with meeting links"

**Competitive Differentiator:**
EvoFit's scheduling includes online session support with meeting links natively, rather than requiring third-party calendar integrations. The 5 appointment types with full lifecycle tracking (including no-show and cancellation reason logging) provide business intelligence that basic calendar tools can't match.

**Suggested Marketing Copy Angles:**
1. "One calendar for every session type -- from 1:1 training to online consultations."
2. "Set your availability, manage your bookings, and never double-book again."
3. "Track no-shows and cancellations to optimize your schedule and protect your revenue."

**Screenshots:**
- Desktop: `screenshots/trainer/schedule-desktop.png`

**Technical Notes for Copywriter:**
- Google/Apple calendar sync is not yet implemented. Don't mention external calendar integration.
- Client self-booking is supported through the available slots API.

---

### 10. Payments & Subscriptions

**One-Line Pitch:** (Coming Soon) Integrated payment processing for session packages, subscriptions, and invoicing -- built to help you get paid effortlessly.

**Description:**
EvoFit's payment system is currently in planning for post-MVP release. The planned implementation includes Stripe integration for credit card processing, support for one-time and recurring subscription payments, session package management with tiered pricing, automated invoicing, and a revenue dashboard for business analytics.

The pricing model is designed to support multiple trainer business models: pay-per-session, session packages (5, 10, 20 sessions with bulk discounts), monthly subscriptions for online coaching, and group class memberships. The system will include automated payment retry for failed transactions, proration for plan changes, and self-service cancellation options for clients.

**Key Capabilities (Planned):**
- Stripe payment processing integration
- One-time and recurring subscription support
- Session package management (5, 10, 20-session bundles)
- Tiered pricing (Starter, Professional, Business, Enterprise)
- Automated invoicing with trainer branding
- Revenue dashboard and financial reporting
- Payment retry for failed transactions
- Proration for mid-cycle plan changes
- Client self-cancellation options
- Tax calculation support

**User Benefits:**

| Benefit | Description |
|---------|-------------|
| Get paid automatically | Recurring payments mean no more chasing invoices or remembering to charge clients |
| Flexible pricing | Session packages, subscriptions, and one-time payments support any business model |
| Business intelligence | Revenue dashboards show income trends, average client value, and financial projections |

**Data Points for Marketing:**
- "Planned: Stripe integration for seamless payment processing"
- "Support for session packages, subscriptions, and one-time payments"
- "Revenue dashboard for business analytics"

**Competitive Differentiator:**
While payment features are coming soon, EvoFit's planned implementation focuses on the unique needs of independent trainers -- not generic SaaS billing. Session packages with bulk discounts, hybrid pricing models, and trainer-branded invoices address the specific pain points of fitness business revenue management.

**Suggested Marketing Copy Angles:**
1. "Coming soon: Get paid effortlessly with integrated payment processing."
2. "Session packages, subscriptions, and one-time payments -- your pricing, your way."

**Screenshots:**
- Not yet available (feature in development)

**Technical Notes for Copywriter:**
- **THIS FEATURE IS NOT YET LIVE.** Always label as "Coming Soon" in all marketing materials.
- The database schema and API endpoints are planned but not yet implemented.
- Do not make specific pricing claims until the system is live.

---

### 11. Mobile PWA Support

**One-Line Pitch:** Train anywhere with a mobile-optimized experience, offline workout logging, and automatic data sync -- no app store download required.

**Description:**
EvoFit is built mobile-first, with every page and feature designed to work beautifully on phones and tablets. The responsive design adapts seamlessly from desktop (1440px+) to mobile (390px), with mobile-specific optimizations like touch-friendly GIF players, mobile exercise cards, and a hamburger navigation menu.

The offline capabilities are powered by IndexedDB for local data storage and a custom sync manager that handles reconnection gracefully. Clients can download their workout programs, log sessions without internet, and have everything sync automatically when they reconnect. This is critical for gym environments where cell signal is often weak or nonexistent.

As a Progressive Web App (PWA), EvoFit can be installed directly from the browser -- no app store required. This means instant access for clients, no update friction, and the same codebase serving both desktop and mobile users.

**Key Capabilities:**
- Fully responsive design across all pages (mobile, tablet, desktop)
- Mobile-optimized exercise cards with compact layout
- Mobile GIF player with touch controls
- Mobile navigation (hamburger menu)
- Offline workout tracking via IndexedDB
- Sync manager for automatic reconnection and data upload
- PWA installable from browser (no app store needed)
- Touch-optimized UI elements throughout

**User Benefits:**

| Benefit | Description |
|---------|-------------|
| Train without signal | Offline workout logging means basement gyms, outdoor parks, and rural training centers are all covered |
| No app store hassle | Install directly from the browser -- clients can be logging workouts in under a minute |
| Real gym interface | Touch-friendly buttons, mobile exercise cards, and optimized GIF player are designed for sweaty hands and quick glances |
| Automatic sync | Data uploads seamlessly when connection returns -- clients never lose a rep |

**Data Points for Marketing:**
- "Works offline: log workouts without internet, sync automatically"
- "No app store download required -- install from the browser"
- "Mobile-optimized interface designed for real gym use"
- "Touch-friendly GIF player for exercise demonstrations on the go"

**Competitive Differentiator:**
Most competitors require native app downloads from app stores, creating friction for client onboarding. EvoFit's PWA approach means clients can be logging their first workout within minutes of receiving their invitation -- no download, no update, no waiting.

**Suggested Marketing Copy Angles:**
1. "No signal? No problem. Offline workout logging that syncs automatically."
2. "Skip the app store. Install EvoFit in one tap from your browser."
3. "Designed for the gym floor: touch-friendly, sweat-proof, and fast."

**Screenshots:**
- Mobile dashboard: `screenshots/trainer/dashboard-mobile.png`
- Mobile analytics: `screenshots/trainer/analytics-mobile.png`
- Mobile homepage: `screenshots/public/homepage-mobile.png`

**Technical Notes for Copywriter:**
- PWA support is approximately 40% complete. Core offline workout logging works, but not all features are available offline.
- Focus messaging on the responsive design and offline workout logging, which are production-ready.
- Do not claim full native app feature parity.

---

### 12. Admin Dashboard

**One-Line Pitch:** Platform-wide oversight with user management, system health monitoring, and dashboard statistics -- everything an administrator needs in one view.

**Description:**
The Admin Dashboard provides complete platform oversight for administrators. From a single interface, admins can see platform-wide statistics, manage all user accounts (activate, deactivate, change roles), and monitor system health including database connectivity, cache status, and API performance.

The user management system supports searching, filtering, and editing any user account on the platform. Admins can view individual user details, modify roles (trainer, client, admin), and activate or deactivate accounts as needed. The system health page provides real-time monitoring of critical infrastructure components.

**Key Capabilities:**
- Platform-wide dashboard statistics (total users, active users, exercises, sessions)
- User management with search, filter, and pagination
- Individual user detail views with edit capabilities
- Role management (assign/change trainer, client, admin roles)
- Account activation/deactivation
- System health monitoring (database, cache, API status)
- Dashboard statistics API with key metrics

**User Benefits:**

| Benefit | Description |
|---------|-------------|
| Complete visibility | See everything happening on the platform at a glance -- users, activity, and system status |
| Easy user management | Search, filter, and manage any user account from one interface |
| Proactive monitoring | System health checks ensure issues are caught before they affect trainers and clients |

**Data Points for Marketing:**
- "Platform-wide statistics dashboard"
- "User management with role assignment and account controls"
- "Real-time system health monitoring"

**Competitive Differentiator:**
Many fitness platforms lack proper admin tools, relying on database-level access for user management. EvoFit provides a purpose-built admin interface with user management, role assignment, and system health monitoring -- ready for multi-trainer and gym-scale deployments.

**Suggested Marketing Copy Angles:**
1. "Full platform control from one dashboard -- users, roles, and system health."
2. "Built for scale: admin tools that grow with your training business."

**Screenshots:**
- Desktop: `screenshots/admin/dashboard-desktop.png`

**Technical Notes for Copywriter:**
- Admin features are approximately 95% complete and fully functional in production.
- Admin access requires the "admin" role -- it's not available to regular trainer or client accounts.

---

## User Flows (for copywriter context)

### Trainer Onboarding Flow
1. **Register** -- Visit /auth/register, enter email and password, select "Trainer" role
2. **Complete profile** -- Add bio, photo, phone, WhatsApp number, timezone, preferred units
3. **Add certifications** -- Enter certification name, issuing organization, credential ID, issue and expiry dates
4. **Set specializations** -- Define areas of expertise with years of experience
5. **Set availability** -- Configure weekly schedule with time slots and locations
6. **Invite first client** -- Enter client email with optional welcome message, send branded invitation

### Client Onboarding Flow
1. **Receive invitation** -- Get email from trainer with personalized welcome message
2. **Register** -- Click secure link, create account (auto-linked to trainer)
3. **Complete health questionnaire** -- Enter medical conditions, injuries, medications, allergies, lifestyle factors
4. **Set fitness goals** -- Choose from 8 goal types, set specific targets and dates
5. **Record measurements** -- Enter height, weight, body composition data
6. **View assigned program** -- See workout program with exercise demonstrations
7. **Start first workout** -- Begin logging with animated exercise guides

### Program Creation Flow
1. **Create program** -- Name the program, select type (strength, hypertrophy, etc.), set difficulty level
2. **Define structure** -- Add weeks with names, mark deload weeks, set duration
3. **Build workouts** -- Add workout days per week, name each session, set workout type
4. **Add exercises** -- Search/filter the 1,344 exercise library, add to workout in order
5. **Configure sets** -- For each exercise: set type, rep range, weight guidance, rest period, tempo, RPE target
6. **Create supersets** -- Group exercises into superset/circuit groups (A/B/C)
7. **Preview program** -- Review complete program structure before saving
8. **Save as template** -- Optionally save for reuse with category, tags, and description
9. **Assign to client(s)** -- Select client(s), set start date, add custom notes, send notification

### Workout Logging Flow
1. **View today's workout** -- See prescribed exercises, sets, and targets
2. **Start session** -- Tap "Start Workout" to begin timing
3. **Log each set** -- Enter actual reps, weight, and RPE for each set (compared to plan)
4. **Use rest timer** -- Built-in timer counts rest between sets
5. **Complete exercises** -- Move through each exercise, see animated GIF demos as needed
6. **Finish workout** -- Complete session, see automatic summary
7. **View personal bests** -- See any new PRs detected during the session
8. **Rate session** -- Provide effort rating, enjoyment rating, and energy levels
9. **Add notes** -- Write session notes for trainer to review

### Progress Review Flow
1. **Open analytics** -- Navigate to analytics dashboard
2. **View body composition** -- Check weight, body fat, and muscle mass trends
3. **Check personal bests** -- Review strength records across exercises
4. **Review training load** -- See acute vs chronic load ratio (ACWR) for injury prevention
5. **Track goal progress** -- View percentage completion and trajectory toward each goal
6. **Review milestones** -- See achievements earned based on training milestones
7. **Generate report** -- Create downloadable analytics report for a selected time period

---

## Platform Statistics (for marketing copy)

| Metric | Value | Source |
|--------|-------|--------|
| Total exercises | 1,344 | Production database (ExerciseDB seed) |
| Body part categories | 10 | Exercise data (neck, shoulders, chest, back, upper arms, lower arms, waist, upper legs, lower legs, cardio) |
| Equipment types | 29 | Exercise data (body weight, barbell, dumbbell, cable, and 25 more) |
| Target muscle groups | 26 | Exercise data |
| Difficulty levels | 3 | DifficultyLevel enum (beginner, intermediate, advanced) |
| Program types | 8 | ProgramType enum (strength, hypertrophy, endurance, powerlifting, bodybuilding, general_fitness, sport_specific, rehabilitation) |
| Workout types | 6 | WorkoutType enum (strength, cardio, hiit, flexibility, mixed, recovery) |
| Set types | 7 | SetType enum (warmup, working, drop, pyramid, amrap, cluster, rest_pause) |
| Goal types | 8 | GoalType enum (weight_loss, muscle_gain, endurance, strength, flexibility, general_fitness, sport_specific, rehabilitation) |
| User roles | 3 | Role enum (trainer, client, admin) |
| Appointment types | 5 | AppointmentType enum (one_on_one, group_class, assessment, consultation, online_session) |
| Client statuses | 5 | ClientStatus enum (active, pending, offline, need_programming, archived) |
| Metric types tracked | 8 | MetricType enum (one_rm, volume, endurance, power, speed, body_weight, body_fat, muscle_mass) |
| Workout statuses | 5 | WorkoutStatus enum (scheduled, in_progress, completed, skipped, missed) |
| Appointment statuses | 5 | AppointmentStatus enum (scheduled, confirmed, completed, cancelled, no_show) |
| Insight priority levels | 3 | InsightPriority enum (low, medium, high) |
| Photo types | 4 | PhotoType enum (front, side, back, other) |
| Fitness levels | 3 | FitnessLevel enum (beginner, intermediate, advanced) |
| Invitation statuses | 3 | InvitationStatus enum (pending, accepted, expired) |
| API endpoints | 65+ | API route count |
| Pages/screens | 41+ | Page route count |
| Feature components | 55+ | React component count |
| Unit tests | 4,594 | Jest test suite |
| E2E tests | 69 | Playwright test suite |
| Test coverage | 85%+ | Jest coverage report |
| Data models | 40+ | Prisma schema |
| Production users | 19 | Production database |

---

## Competitive Positioning Matrix

| Feature | EvoFit | Everfit | TrueCoach | Trainerize |
|---------|--------|---------|-----------|------------|
| **Exercise Library Size** | 1,344+ | ~1,500 | ~800 | ~1,000 |
| **GIF Demonstrations** | Yes (all exercises) | Yes | Video clips | Video clips |
| **Program Types** | 8 types | 6 types | 3 types | 4 types |
| **Set Types** | 7 (incl. cluster, rest-pause) | 4-5 | 3 (basic) | 4 |
| **Superset/Circuit Support** | Yes (A/B/C grouping) | Yes | Limited | Yes |
| **RPE/RIR Tracking** | Yes (per set) | Limited | No | No |
| **Tempo Prescriptions** | Yes (4-digit format) | Yes | No | No |
| **Progressive Overload Planning** | Yes | Yes | Manual only | Limited |
| **Offline Workout Support** | Yes (PWA/IndexedDB) | Native app only | No | Native app only |
| **Training Load Monitoring** | ACWR (acute/chronic) | Basic volume | No | No |
| **AI-Powered Insights** | Yes (prioritized) | No | No | Basic |
| **Client Status Tracking** | 5 states | 3 states | 2 states | 3 states |
| **Custom Tags** | Yes (color-coded) | Yes | Limited | No |
| **Calendar/Scheduling** | Built-in (5 types) | Built-in | External only | Basic |
| **Admin Dashboard** | Yes (system health) | Yes | Limited | Yes |
| **Starting Price** | Affordable | $$$ | $$ | $$ |
| **No App Store Required** | Yes (PWA) | No (app required) | No | No |
| **Test Coverage** | 85%+ (4,594 tests) | Unknown | Unknown | Unknown |

*Note: Competitor data is based on publicly available information and may have changed. Verify current competitor features before publishing.*

---

## Tone & Voice Guidelines for Copywriter

### Brand Identity
- **Brand Name:** EvoFit Trainer
- **Brand Tagline:** "Transform Your Fitness Business"
- **Supporting Tagline:** "The all-in-one platform for personal trainers"
- **Brand Color:** Blue (#2563eb) with indigo accents (#4338ca - #4f46e5)
- **Logo:** SVG logo at `public/logo.svg`, blue rounded square with fitness icon
- **Typography:** Modern, clean sans-serif (system font stack with Tailwind defaults)

### Voice Characteristics
- **Tone:** Professional but approachable, confident but not arrogant
- **Voice:** Active, direct, benefit-focused
- **Register:** Speaks to fitness professionals as peers, not as customers

### Vocabulary to Use
- "Transform", "Elevate", "Professional", "Powerful", "Seamless"
- "Build", "Track", "Manage", "Grow", "Scale"
- "Smart", "Comprehensive", "Intuitive", "Efficient"

### Vocabulary to Avoid
- Overly technical jargon (no mention of PostgreSQL, JWT, Prisma, API routes)
- Hyperbole without proof ("best in the world", "revolutionary")
- Passive voice ("workouts are tracked" vs "track every workout")
- Generic startup buzzwords ("synergy", "disrupt", "pivot")

### CTAs Observed in the Codebase
- **Primary CTA:** "Get Started Free" (white button on blue, with arrow icon)
- **Secondary CTA:** "Sign In" / "Sign In to Dashboard"
- **Tertiary CTA:** "Create Your Account"

### Section Headlines from Landing Page
- "Transform Your Fitness Business" (hero)
- "Everything You Need to Train Smarter" (features)
- "Built for Trainers, By Trainers" (benefits)
- "One Platform, Three Perspectives" (roles)
- "Ready to Elevate Your Training?" (CTA)

### Marketing Messages from Existing Copy
- "The all-in-one platform for personal trainers"
- "Build programs, track workouts, manage clients, and grow your business with powerful analytics"
- "Whether you train one client or a hundred, EvoFit scales with your business"
- "Stop juggling spreadsheets and start delivering results"
- "From exercise libraries to advanced analytics, EvoFit gives you the tools to deliver exceptional training experiences"

### Benefit Statements from Landing Page
- "Manage unlimited clients from one dashboard"
- "Build and assign programs in minutes"
- "Track every rep, set, and personal record"
- "Monitor client progress with analytics"
- "Works on desktop, tablet, and mobile"

---

## Appendix A: Complete Data Model Summary

### Core Entities and Relationships

```
User (central entity)
├── UserProfile (1:1) -- bio, photo, contact, preferences
├── UserHealth (1:1) -- medical conditions, medications, injuries, lifestyle
├── UserGoal (1:many) -- fitness goals with targets and progress
├── TrainerCertification (1:many) -- professional credentials
├── TrainerSpecialization (1:many) -- areas of expertise
├── ProgressPhoto (1:many) -- transformation photos
├── ProfileCompletion (1:1) -- onboarding progress tracking
│
├── TrainerClient (many:many) -- trainer-client relationships with status
├── ClientInvitation (1:many) -- email invitations sent
├── ClientProfile (1:1) -- fitness level, medical info, preferences
├── ClientNote (1:many) -- private trainer notes per client
├── ClientTag (1:many) -- custom color-coded tags
│
├── Program (1:many) -- training programs created
│   ├── ProgramWeek (1:many) -- weekly structure with deload marking
│   │   └── ProgramWorkout (1:many) -- daily workouts
│   │       └── WorkoutExercise (1:many) -- exercises with superset groups
│   │           └── ExerciseConfiguration (1:many) -- set/rep/weight details
│   ├── ProgramAssignment (1:many) -- client assignments
│   └── ProgramTemplate (1:many) -- reusable templates
│
├── Exercise (standalone, 1,344 records)
│   ├── ExerciseFavorite (many:many with User)
│   ├── ExerciseCollection (many:many with User)
│   └── ExerciseUsage (tracking)
│
├── WorkoutSession (1:many) -- logged workout sessions
│   └── WorkoutExerciseLog (1:many) -- per-exercise logs
│       └── WorkoutSetLog (1:many) -- per-set actual data
│
├── PerformanceMetric (1:many) -- tracked metrics (8 types)
├── TrainingLoad (1:many) -- weekly load calculations (ACWR)
├── UserInsight (1:many) -- AI-powered recommendations
├── MilestoneAchievement (1:many) -- earned achievements
├── GoalProgress (via UserGoal) -- goal checkpoint data
├── AnalyticsReport (1:many) -- generated reports
│
├── TrainerAvailability (1:many) -- weekly time slots
├── Appointment (1:many) -- booked sessions (5 types)
│
├── Activity (1:many) -- activity feed entries
│
└── Security models:
    ├── EmailVerification, PasswordReset
    ├── TwoFactorAuth, UserSession
    ├── OAuthAccount, SecurityAuditLog
    ├── AccountLockout, ApiToken
```

### Enum Reference (All Values)

| Enum | Values |
|------|--------|
| **Role** | trainer, client, admin |
| **GoalType** | weight_loss, muscle_gain, endurance, strength, flexibility, general_fitness, sport_specific, rehabilitation |
| **PhotoType** | front, side, back, other |
| **PreferredUnits** | metric, imperial |
| **ClientStatus** | active, pending, offline, need_programming, archived |
| **InvitationStatus** | pending, accepted, expired |
| **FitnessLevel** | beginner, intermediate, advanced |
| **DifficultyLevel** | beginner, intermediate, advanced |
| **ProgramType** | strength, hypertrophy, endurance, powerlifting, bodybuilding, general_fitness, sport_specific, rehabilitation |
| **WorkoutType** | strength, cardio, hiit, flexibility, mixed, recovery |
| **SetType** | warmup, working, drop, pyramid, amrap, cluster, rest_pause |
| **WorkoutStatus** | scheduled, in_progress, completed, skipped, missed |
| **MetricType** | one_rm, volume, endurance, power, speed, body_weight, body_fat, muscle_mass |
| **InsightPriority** | low, medium, high |
| **AppointmentStatus** | scheduled, confirmed, completed, cancelled, no_show |
| **AppointmentType** | one_on_one, group_class, assessment, consultation, online_session |

---

## Appendix B: Screenshot Inventory

| # | Page | Screenshot Path | Viewport | Description |
|---|------|----------------|----------|-------------|
| 1 | Homepage | screenshots/public/homepage-desktop.png | 1440x900 | Landing page with hero, features, benefits, roles, and CTA sections |
| 2 | Homepage (mobile) | screenshots/public/homepage-mobile.png | 390x844 | Mobile-responsive landing page |
| 3 | Login | screenshots/public/login-desktop.png | 1440x900 | Login form with email/password fields |
| 4 | Register | screenshots/public/register-desktop.png | 1440x900 | Registration form with role selection |
| 5 | Public Exercises | screenshots/public/exercises-desktop.png | 1440x900 | Public exercise library with filters |
| 6 | Trainer Dashboard | screenshots/trainer/dashboard-desktop.png | 1440x900 | Main trainer dashboard with stats and activity |
| 7 | Trainer Dashboard (mobile) | screenshots/trainer/dashboard-mobile.png | 390x844 | Mobile trainer dashboard |
| 8 | Client List | screenshots/trainer/clients-list-desktop.png | 1440x900 | Client roster with status indicators |
| 9 | Exercise Library | screenshots/trainer/exercises-library-desktop.png | 1440x900 | Full exercise library with advanced filters |
| 10 | Programs List | screenshots/trainer/programs-list-desktop.png | 1440x900 | Programs overview with cards |
| 11 | Program Builder | screenshots/trainer/program-create-desktop.png | 1440x900 | New program creation interface |
| 12 | Workouts Overview | screenshots/trainer/workouts-overview-desktop.png | 1440x900 | Workouts listing page |
| 13 | Workout Builder | screenshots/trainer/workout-builder-desktop.png | 1440x900 | Workout design interface |
| 14 | Analytics | screenshots/trainer/analytics-desktop.png | 1440x900 | Analytics dashboard with charts |
| 15 | Analytics (mobile) | screenshots/trainer/analytics-mobile.png | 390x844 | Mobile analytics view |
| 16 | Schedule | screenshots/trainer/schedule-desktop.png | 1440x900 | Calendar with appointments |
| 17 | Profile | screenshots/trainer/profile-desktop.png | 1440x900 | User profile page |
| 18 | Trainer Dashboard | screenshots/trainer/trainer-dashboard-desktop.png | 1440x900 | Trainer-specific dashboard view |

*Note: Actual screenshot availability depends on authentication status at capture time. Some authenticated pages may show login redirects if credentials have changed.*

---

## Appendix C: File Inventory (Key Files Analyzed)

| Category | File | Purpose |
|----------|------|---------|
| **Data Model** | backend/prisma/schema.prisma | Complete database schema (1,215 lines, 40+ models) |
| **Landing Page** | app/page.tsx | Homepage with marketing copy, features, benefits, CTAs |
| **Documentation** | docs/prd.md | Product Requirements Document (980 lines) |
| **Documentation** | docs/businesslogic.md | Business Logic Guide (1,903 lines) |
| **Documentation** | docs/architecture.md | System architecture reference |
| **Epics** | docs/epics/epic-001 through epic-012 | Feature epic documentation (12 files) |
| **Auth Pages** | app/auth/login/page.tsx, register/page.tsx | Authentication screens |
| **Dashboard Pages** | app/dashboard/*.tsx | 5+ dashboard pages (main, trainer, client, admin, clients) |
| **Exercise Pages** | app/exercises/*.tsx, app/dashboard/exercises/*.tsx | Exercise library screens |
| **Program Pages** | app/programs/*.tsx | Program list and creation screens |
| **Workout Pages** | app/workouts/*.tsx, app/workout-tracker/page.tsx | 6+ workout screens |
| **Analytics** | app/analytics/page.tsx | Analytics dashboard |
| **Schedule** | app/schedule/*.tsx | Calendar and availability screens |
| **Admin** | app/admin/*.tsx | Admin dashboard and user management |
| **Profile** | app/profile/*.tsx | Profile, edit, and health screens |
| **Components** | components/features/**/*.tsx | 55+ feature components |
| **Services** | lib/services/*.ts | Exercise, activity, token, email, appointments |
| **Middleware** | lib/middleware/*.ts | Auth, authorization, rate limiting, validation |
| **API Client** | lib/api/*.ts | Frontend API helpers (auth, clients, programs, analytics) |
| **Offline** | lib/offline/*.ts | IndexedDB storage and sync manager |
| **Utilities** | lib/utils/streakCalculator.ts | Training streak calculation |
| **API Routes** | app/api/**/*.ts | 65+ API route handlers |
| **E2E Tests** | tests/e2e/*.spec.ts | 12 Playwright test suites (69 tests) |
| **Seed Script** | scripts/seed-exercises.ts | Exercise database seeding (1,324 exercises) |

---

*This document was generated through comprehensive analysis of the EvoFitTrainer codebase, production site, and existing documentation. All statistics and feature descriptions are verified against the actual codebase and production deployment as of March 1, 2026.*

*For questions about this document, contact the development team.*
