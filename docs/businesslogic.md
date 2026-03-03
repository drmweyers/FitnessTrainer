# EvoFit Trainer Business Logic & Feature Documentation

**Version:** 2.0
**Last Updated:** March 2, 2026
**Status:** Production - https://evofittrainer-six.vercel.app
**Test Coverage:** 85%+ (4,594 unit tests, 69 E2E tests - all passing)

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [User Profiles & Onboarding](#user-profiles--onboarding)
3. [Authentication & Security](#authentication--security)
4. [Client Management](#client-management)
5. [Exercise Library](#exercise-library)
6. [Program Builder](#program-builder)
7. [Workout Tracking & Logging](#workout-tracking--logging)
8. [Progress Analytics](#progress-analytics)
9. [Messaging & Communication](#messaging--communication)
10. [Scheduling & Calendar](#scheduling--calendar)
11. [Payments & Subscriptions](#payments--subscriptions)
12. [Mobile PWA Support](#mobile-pwa-support)
13. [Admin Dashboard](#admin-dashboard)
14. [Advanced Features](#advanced-features)
15. [Complete Data Model](#complete-data-model-reference)
16. [API Endpoints Reference](#api-endpoints-reference)
17. [Glossary](#glossary)

---

## Platform Overview

### What is EvoFit Trainer?

EvoFit Trainer is a comprehensive fitness management platform designed for personal trainers and their clients. The platform streamlines every aspect of fitness coaching from client onboarding to progress tracking, making it easier for trainers to deliver exceptional results while scaling their business.

### Current Production Metrics

| Metric | Value |
|--------|-------|
| **Exercise Database** | 1,344 exercises with GIF demonstrations |
| **Production Users** | 19 users (trainers + clients) |
| **Unit Tests** | 4,594 tests across 262 suites |
| **E2E Tests** | 69 tests across 12 suites |
| **Test Coverage** | 85%+ line coverage |
| **Data Models** | 40+ Prisma models |
| **API Endpoints** | 65+ routes |
| **Feature Areas** | 12 major areas |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 App Router, React 18, TypeScript 5.6 |
| **UI** | Tailwind CSS 3.4, Radix UI, shadcn/ui, Framer Motion |
| **State Management** | TanStack Query (server), Jotai (client) |
| **Backend** | Next.js API routes (Vercel), Express 4.x (Docker) |
| **Database** | PostgreSQL 17 (Neon) |
| **Cache** | Redis (Upstash) |
| **Authentication** | JWT (15min access / 7d refresh), bcryptjs |
| **Testing** | Jest (unit), Playwright (E2E), React Testing Library |
| **Deployment** | Vercel (production), Docker Compose (dev) |

### Epic Completion Status

| Epic | Feature Area | Completion |
|------|--------------|------------|
| 001 | User Profiles & Onboarding | ~98% |
| 002 | Authentication & Security | 100% |
| 003 | Client Management | ~98% |
| 004 | Exercise Library | ~99% |
| 005 | Program Builder | ~95% |
| 006 | Workout Tracking | ~98% |
| 007 | Progress Analytics | ~98% |
| 008 | WhatsApp/Messaging | 100% |
| 009 | Scheduling & Calendar | ~95% |
| 010 | Payments | **ON HOLD** (post-MVP) |
| 011 | Mobile PWA | ~40% |
| 012 | Admin Dashboard | ~95% |

---

## User Profiles & Onboarding

### Overview

Complete profile creation with health questionnaires, fitness goals, certifications, specializations, and progress tracking - all gamified with a profile completion widget.

### Key Capabilities

#### Profile Creation
- **Basic Information**: Email, full name, date of birth, gender, phone number, WhatsApp number
- **Bio & Photos**: Profile bio (100-500 characters), profile photo, cover photo
- **Preferences**: Timezone selection, preferred units (metric/imperial), privacy settings
- **Public/Private Toggle**: Trainers can control profile visibility

#### Health Questionnaire
- **Medical Conditions**: Multiple selection from predefined list or custom entries
- **Medications**: Current medications with dosage tracking
- **Allergies**: Food and medication allergies
- **Injuries**: Current and past injuries with descriptions
- **Surgeries**: Surgical history with dates and notes
- **Family Medical History**: Hereditary conditions tracking
- **Lifestyle Factors**: Smoking, drinking, sleep quality, stress levels
- **Emergency Contact**: Name, relationship, phone number

#### Fitness Goals (8 Types)
1. **Weight Loss**: Target weight, target date, priority level
2. **Muscle Gain**: Target muscle mass, timeline
3. **Endurance**: Cardiovascular endurance targets
4. **Strength**: 1RM goals, powerlifting targets
5. **Flexibility**: Range of motion improvements
6. **General Fitness**: Overall health and wellness
7. **Sport-Specific**: Athletic performance goals
8. **Rehabilitation**: Recovery from injury or surgery

Each goal includes:
- Specific goal description (text)
- Target value (numeric)
- Target date
- Priority ranking (1-10)
- Active/inactive status
- Achievement tracking with timestamp

#### Trainer Certifications
- **Certification Name**: e.g., "NASM-CPT", "ACE Personal Trainer"
- **Issuing Organization**: e.g., "National Academy of Sports Medicine"
- **Credential ID**: Unique certification identifier
- **Issue Date** & **Expiry Date**: Automatic expiry reminders
- **Document Upload**: PDF/image upload for verification (deferred post-MVP)
- **Verification Status**: Manual admin verification workflow
- **Verified Timestamp**: When certification was verified by admin

#### Trainer Specializations
- **Specialization Area**: e.g., "Strength Training", "Nutrition", "Rehabilitation"
- **Years of Experience**: Per specialization
- **Description**: Optional specialization details

#### Progress Photos
- **Photo Types**: Front, Side, Back, Other
- **Privacy Control**: Public or private per photo
- **Date Tracking**: Automatic upload timestamp, optional custom "taken at" date
- **Thumbnails**: Automatic thumbnail generation (deferred post-MVP)
- **Notes**: Contextual notes per photo (weight, mood, etc.)

#### Profile Completion Widget
Gamified onboarding tracker showing:
- **Completion Percentage**: Calculated from required fields
- **Section Breakdown**: Basic info, photo, health, goals, measurements, certifications
- **Guided Prompts**: "Add your profile photo", "Set your first fitness goal"
- **Visual Progress Bar**: Green progress indicator
- **Missing Field Alerts**: Red highlights for required incomplete fields

### How To: Complete Your Profile

**For Trainers:**
1. Navigate to Profile → Edit Profile
2. Fill in bio, date of birth, gender, phone, WhatsApp number
3. Select timezone and preferred units
4. Upload profile photo (coming soon) or skip
5. Navigate to Certifications tab
6. Add each certification with organization, credential ID, dates
7. Navigate to Specializations tab
8. Add areas of expertise with years of experience
9. Navigate to Health tab (optional for trainers)
10. Profile completion widget shows 100% when all required fields filled

**For Clients:**
1. Complete basic info (step 2-4 above)
2. Navigate to Health tab - this is **required** for safe training
3. Complete medical conditions, medications, allergies
4. Add any current or past injuries
5. Fill lifestyle factors (sleep, stress, activity level)
6. Add emergency contact information
7. Navigate to Goals tab
8. Add 1-3 fitness goals with specific targets and dates
9. Navigate to Measurements (optional initially)
10. Profile completion widget guides through remaining steps

### UI Elements

| Screen | Element | Description |
|--------|---------|-------------|
| **Profile View** | Profile card | Bio, photo, role badge, WhatsApp link |
| **Edit Profile** | Form sections | Tabbed interface: Basic, Health, Goals, Certifications |
| **Health Tab** | Multi-select chips | Medical conditions, medications, allergies as chips |
| **Goals Tab** | Goal cards | Each goal as a card with type icon, target, progress bar |
| **Completion Widget** | Progress circle | Circular progress indicator with percentage |

### Data Model

```typescript
// User base
User {
  id: UUID
  email: string (unique)
  role: 'trainer' | 'client' | 'admin'
  isActive: boolean
  isVerified: boolean
}

// User profile (1:1)
UserProfile {
  userId: UUID (FK)
  bio: string
  dateOfBirth: date
  gender: string
  phone: string
  whatsappNumber: string
  timezone: string
  preferredUnits: 'metric' | 'imperial'
  profilePhotoUrl: string
  coverPhotoUrl: string
  isPublic: boolean
}

// Health info (1:1)
UserHealth {
  userId: UUID (FK)
  bloodType: string
  medicalConditions: string[]
  medications: string[]
  allergies: string[]
  injuries: JSON
  surgeries: JSON
  familyHistory: JSON
  lifestyle: JSON
  emergencyContact: JSON
}

// Goals (1:many)
UserGoal {
  userId: UUID (FK)
  goalType: enum (8 types)
  specificGoal: text
  targetValue: decimal
  targetDate: date
  priority: int
  isActive: boolean
  achievedAt: timestamp
}

// Trainer certifications (1:many)
TrainerCertification {
  trainerId: UUID (FK)
  certificationName: string
  issuingOrganization: string
  credentialId: string
  issueDate: date
  expiryDate: date
  documentUrl: string
  isVerified: boolean
  verifiedAt: timestamp
}

// Trainer specializations (1:many)
TrainerSpecialization {
  trainerId: UUID (FK)
  specialization: string
  yearsExperience: int
  description: text
}

// Progress photos (1:many)
ProgressPhoto {
  userId: UUID (FK)
  photoUrl: string
  thumbnailUrl: string
  photoType: 'front' | 'side' | 'back' | 'other'
  notes: text
  isPrivate: boolean
  takenAt: timestamp
}

// Profile completion (1:1)
ProfileCompletion {
  userId: UUID (FK)
  basicInfo: boolean
  profilePhoto: boolean
  healthInfo: boolean
  goalsSet: boolean
  measurements: boolean
  certifications: boolean (trainers only)
  completionPercentage: int
}
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/profiles/me` | Get current user's profile |
| PUT | `/api/profiles/me` | Update current user's profile |
| GET | `/api/profiles/health` | Get health information |
| PUT | `/api/profiles/health` | Update health information |
| POST | `/api/profiles/certifications` | Add certification |
| GET | `/api/profiles/certifications` | List certifications |
| PUT | `/api/profiles/certifications/:id` | Update certification |
| DELETE | `/api/profiles/certifications/:id` | Remove certification |
| POST | `/api/profiles/progress-photos` | Upload progress photo |
| GET | `/api/profiles/progress-photos` | List progress photos |
| POST | `/api/profiles/me/photo` | Upload profile photo |

### Known Limitations

- Photo uploads (profile, cover, progress, certification documents) are deferred post-MVP
- Routes return `501 Not Implemented` with message "Photo upload coming soon"
- Custom exercise creation by trainers is not yet implemented
- Bulk operations for photos not yet available

---

## Authentication & Security

### Overview

Enterprise-grade JWT-based authentication with role-based access control, security audit logging, account lockout protection, and rate limiting on all API endpoints.

### Key Capabilities

#### Authentication System
- **JWT Tokens**: 15-minute access tokens + 7-day refresh tokens
- **Role-Based Registration**: Separate flows for trainer, client, and admin roles
- **Email Verification**: Secure token-based verification with 24-hour expiry
- **Password Requirements**: Minimum 8 characters (enforced client + server side)
- **Invitation-Based Client Signup**: Clients register via secure trainer invitation links

#### Security Features
- **Account Lockout**: Automatic lockout after failed login attempts
- **Security Audit Log**: Every login attempt logged with IP, user agent, device info, success/failure
- **Rate Limiting**: All API endpoints protected against abuse
- **Session Management**: Device tracking, concurrent session limits, remote logout
- **Password Reset**: Secure token-based flow with 1-hour expiry
- **Two-Factor Authentication**: Database schema ready (UI pending)
- **OAuth Social Login**: Infrastructure ready for Google, Apple, Facebook (UI pending)

#### Role-Based Access Control (RBAC)

**3 User Roles:**

| Role | Capabilities |
|------|--------------|
| **Trainer** | Create/manage programs, invite clients, view assigned client data, manage own profile, create templates, assign programs, view client analytics |
| **Client** | View assigned programs, log workouts, track progress, update own profile, communicate with trainer, view exercise library |
| **Admin** | Platform-wide oversight, user management (activate/deactivate/change roles), system health monitoring, access all data for support |

### How To: Register as a Trainer

1. Navigate to `/auth/register`
2. Select "Trainer" role
3. Enter email address and create password (8+ characters)
4. Submit registration form
5. Check email for verification link
6. Click verification link (valid 24 hours)
7. Account activated - redirect to dashboard
8. Complete profile (certifications, specializations, bio)
9. Begin inviting clients

### How To: Accept Client Invitation

1. Receive email invitation from trainer
2. Click secure invitation link (valid 7 days)
3. Redirected to registration page with email pre-filled
4. Create password (8+ characters)
5. Account automatically linked to inviting trainer
6. Complete health questionnaire
7. Set fitness goals
8. Begin training

### How To: Reset Password

1. Navigate to `/auth/forgot-password`
2. Enter email address
3. Submit reset request
4. Check email for reset link (valid 1 hour)
5. Click reset link
6. Enter new password (8+ characters)
7. Confirm new password
8. All sessions terminated for security
9. Log in with new password

### UI Elements

| Screen | Element | Description |
|--------|---------|-------------|
| **Login** | Email + password form | Clean centered form with brand logo |
| **Register** | Role selection radio | Choose trainer, client, or admin |
| **Register** | Email + password fields | Password strength indicator |
| **Forgot Password** | Email input | Single field form |
| **Reset Password** | New password form | Confirm password matching |

### Data Model

```typescript
// Core user
User {
  id: UUID
  email: string (unique)
  passwordHash: string
  role: 'trainer' | 'client' | 'admin'
  isActive: boolean
  isVerified: boolean
  lastLoginAt: timestamp
}

// Email verification
EmailVerification {
  userId: UUID (FK)
  token: string (unique)
  expiresAt: timestamp
  verifiedAt: timestamp
}

// Password reset
PasswordReset {
  userId: UUID (FK)
  token: string (unique)
  expiresAt: timestamp
  usedAt: timestamp
}

// User sessions (JWT management)
UserSession {
  userId: UUID (FK)
  tokenHash: string (unique)
  deviceInfo: JSON
  ipAddress: inet
  expiresAt: timestamp
  lastActivityAt: timestamp
}

// Security audit log
SecurityAuditLog {
  userId: UUID (FK nullable)
  eventType: string ('login', 'logout', 'password_change', etc.)
  ipAddress: inet
  userAgent: text
  deviceInfo: JSON
  success: boolean
  failureReason: string
}

// Account lockout
AccountLockout {
  userId: UUID (FK)
  lockedUntil: timestamp
  failedAttempts: int
  lastAttemptAt: timestamp
  unlockedAt: timestamp
}

// OAuth accounts (ready but not enabled)
OAuthAccount {
  userId: UUID (FK)
  provider: string ('google', 'apple', 'facebook')
  providerUserId: string
  accessToken: text
  refreshToken: text
  tokenExpiresAt: timestamp
  profileData: JSON
}

// Two-factor auth (ready but not enabled)
TwoFactorAuth {
  userId: UUID (FK)
  secret: string
  backupCodes: string[]
  isEnabled: boolean
  enabledAt: timestamp
  lastUsedAt: timestamp
}

// API tokens (for future integrations)
ApiToken {
  userId: UUID (FK)
  name: string
  tokenHash: string (unique)
  permissions: string[]
  lastUsedAt: timestamp
  expiresAt: timestamp
}
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### Known Limitations

- Two-factor authentication infrastructure exists but UI is not yet implemented
- OAuth social login (Google, Apple, Facebook) infrastructure exists but UI is not yet implemented
- Don't mention these as active features in marketing

---

## Client Management

### Overview

Complete client relationship management with 5-status lifecycle tracking, email invitation system, color-coded custom tags, private trainer notes, and flexible client profiles.

### Key Capabilities

#### Client Status Lifecycle (5 States)

| Status | Description | Use Case |
|--------|-------------|----------|
| **Active** | Currently training, full access | Regular session attendance, program compliance >70%, payment current |
| **Pending** | Invitation sent, awaiting response | Trainer sent invitation, client hasn't registered yet |
| **Offline** | Temporarily paused | Vacation, injury, personal reasons - maintains historical data access |
| **Need Programming** | Requires new workout program | Completed current program, goals changed, returning from break |
| **Archived** | No longer active | Soft delete - data retained, can reactivate anytime, not in active count |

#### Email Invitation System
- **Invitation Creation**: Trainer enters client email + optional custom welcome message
- **Branded Email**: Professional EvoFit-branded invitation with trainer's name
- **Secure Token**: Unique token with 7-day expiry
- **Status Tracking**: Pending → Accepted → Expired
- **Resend Capability**: Can resend expired invitations
- **Auto-Linking**: Accepted invitation automatically creates trainer-client relationship

#### Custom Tags
- **Unlimited Tags**: Trainers create unlimited custom tags
- **Color Coding**: Each tag has custom color (hex values)
- **Multiple Tags Per Client**: Clients can have multiple tags simultaneously
- **Tag-Based Filtering**: Filter client list by one or more tags
- **Bulk Operations**: Tag-based bulk program assignment, bulk messaging

**Example Tags:**
- "Morning Group" (blue)
- "Weight Loss" (green)
- "VIP Client" (gold)
- "Beginners" (orange)
- "Competition Prep" (red)

#### Private Trainer Notes
- **Client-Specific Notes**: One note per trainer-client relationship
- **Never Visible to Clients**: Complete privacy for trainer observations
- **Rich Text Formatting**: Markdown support
- **Searchable History**: Search across all client notes
- **Pinnable Notes**: Pin important notes to top
- **Categories**: Session notes, medical notes, goal notes, general notes

#### Client Profiles
- **Medical Information**: Conditions, medications, allergies, injuries (from UserHealth)
- **Fitness Level**: Beginner, Intermediate, Advanced
- **Goals**: Referenced from UserGoal table
- **Preferences**: Training preferences, scheduling availability stored as JSON
- **Emergency Contact**: Name, relationship, phone number

### How To: Invite a New Client

1. Navigate to Clients → Invite Client
2. Enter client's email address
3. (Optional) Add custom welcome message
4. Click Send Invitation
5. Client receives branded email with secure link
6. Client clicks link → registration form with email pre-filled
7. Client creates account → automatically linked to your roster
8. You receive notification that invitation was accepted
9. Client appears in your roster with "Active" status
10. Assign their first program

### How To: Organize Clients with Tags

1. Navigate to Clients → Tags
2. Create new tag: name + color
3. Navigate back to client list
4. Click on a client → Assign Tags
5. Select one or more tags
6. Save - tags appear as colored badges on client card
7. Use filter dropdown to filter by tag
8. Select multiple tags to filter (AND/OR logic)

### How To: Add Private Notes

1. Navigate to Clients → Select Client
2. Click Notes tab
3. Add new note with category
4. Session notes auto-stamped with date
5. Medical notes flagged with red indicator
6. Notes never visible to client
7. Export notes for records if needed

### UI Elements

| Screen | Element | Description |
|--------|---------|-------------|
| **Client List** | Status badges | Color-coded: Active (green), Pending (yellow), Offline (gray), Need Programming (blue), Archived (red) |
| **Client Card** | Tag chips | Colored tag badges below client name |
| **Invite Modal** | Email + message form | Optional custom welcome message textarea |
| **Notes Section** | Category tabs | Session, Medical, Goal, General tabs |
| **Client Profile** | Medical alerts | Red warning badges for conditions/injuries |

### Data Model

```typescript
// Trainer-client relationship
TrainerClient {
  id: UUID
  trainerId: UUID (FK)
  clientId: UUID (FK)
  status: 'active' | 'pending' | 'offline' | 'need_programming' | 'archived'
  connectedAt: timestamp
  archivedAt: timestamp
}

// Client invitations
ClientInvitation {
  trainerId: UUID (FK)
  clientEmail: string
  token: string (unique)
  status: 'pending' | 'accepted' | 'expired'
  customMessage: text
  sentAt: timestamp
  expiresAt: timestamp (7 days)
  acceptedAt: timestamp
}

// Client profile (extended)
ClientProfile {
  userId: UUID (FK)
  emergencyContact: JSON
  medicalConditions: string[]
  medications: string[]
  allergies: string[]
  injuries: JSON
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
  goals: JSON
  preferences: JSON
}

// Client notes
ClientNote {
  trainerId: UUID (FK)
  clientId: UUID (FK)
  note: text
  createdAt: timestamp
  updatedAt: timestamp
}

// Client tags
ClientTag {
  id: UUID
  name: string (max 50 chars)
  color: string (hex, 7 chars)
  trainerId: UUID (FK)
}

// Tag assignments (many-to-many)
ClientTagAssignment {
  clientId: UUID (FK)
  tagId: UUID (FK)
  (composite PK)
}
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/clients` | List trainer's clients |
| GET | `/api/clients/trainer` | Get trainer-client connections |
| GET | `/api/clients/:id` | Get client details |
| PUT | `/api/clients/:id/status` | Update client status |
| POST | `/api/clients/invite` | Send client invitation |
| GET | `/api/clients/invitations` | List sent invitations |

### Known Limitations

- Bulk operations UI (bulk invite, bulk assign) is functional but could be more prominent
- Client-to-client comparison features are not yet implemented
- Automated status transitions (e.g., auto-archive after 90 days offline) are not yet implemented

---

## Exercise Library

### Overview

1,344 professional exercises with animated GIF demonstrations, advanced multi-filter search, favorites, custom collections, and detailed muscle mapping - the largest built-in exercise database in its class.

### Key Capabilities

#### Exercise Database (1,344 Exercises)

**Each Exercise Includes:**
- **Name**: Exercise name (e.g., "Barbell Bench Press")
- **Animated GIF**: High-quality demonstration loop
- **Body Part**: 10 categories (neck, shoulders, chest, back, upper arms, lower arms, waist, upper legs, lower legs, cardio)
- **Equipment**: 29 types (body weight, barbell, dumbbell, cable, resistance bands, machines, kettlebell, medicine ball, etc.)
- **Target Muscle**: 26 primary muscle groups with full anatomical names
- **Secondary Muscles**: Array of secondary muscles engaged
- **Instructions**: Step-by-step text instructions
- **Difficulty**: Beginner, Intermediate, or Advanced
- **Exercise ID**: Unique identifier from ExerciseDB

**10 Body Part Categories:**
1. Neck
2. Shoulders
3. Chest
4. Back
5. Upper Arms (biceps, triceps)
6. Lower Arms (forearms)
7. Waist (abs, obliques, core)
8. Upper Legs (quads, hamstrings, glutes)
9. Lower Legs (calves, tibialis)
10. Cardio

**29 Equipment Types:**
- Body Weight
- Barbell
- Dumbbell
- Cable
- Resistance Band
- Machine (various)
- Kettlebell
- Medicine Ball
- Stability Ball
- Foam Roll
- TRX/Suspension
- (and 18 more specialized equipment types)

**26 Target Muscle Groups:**
- Pectorals, Deltoids, Lats, Traps, Rhomboids
- Biceps, Triceps, Forearms
- Quads, Hamstrings, Glutes, Calves
- Abs, Obliques, Lower Back
- (and 11 more specific muscle groups)

**3 Difficulty Levels:**
- **Beginner**: Suitable for new exercisers, low technical complexity
- **Intermediate**: Moderate technical skill required
- **Advanced**: High technical skill, experience required

#### Advanced Search & Filtering

**Multi-Filter System** (all filters can be combined):
- **Body Part**: Select from 10 categories
- **Equipment**: Select from 29 types
- **Target Muscle**: Select from 26 groups
- **Difficulty**: Select beginner, intermediate, or advanced
- **Full-Text Search**: Search by exercise name

**Search Features:**
- **Instant Results**: Sub-second search response
- **Filter Stacking**: Apply multiple filters simultaneously (AND logic)
- **Filter Counts**: Shows number of results per filter option
- **Clear All Filters**: One-click reset to full library
- **Search History**: Recent searches tracked (logged-in users)

#### Exercise Favorites
- **One-Click Favorite**: Heart icon to favorite any exercise
- **Favorites List**: Dedicated view of favorited exercises
- **Quick Access**: Favorites appear first in program builder
- **Cross-Device Sync**: Favorites sync across all devices

#### Exercise Collections
- **Custom Collections**: Create unlimited named collections
- **Collection Description**: Optional description per collection
- **Ordering**: Drag-and-drop exercise ordering within collections
- **Public/Private**: Collections can be shared or kept private
- **Use Cases**: "Knee Rehab", "Home Workout Essentials", "Competition Prep"

#### Detailed Exercise View
- **Full Instructions**: Step-by-step execution
- **Muscle Diagram**: Visual representation of target and secondary muscles (planned)
- **Related Exercises**: Suggestions based on target muscles
- **Usage History**: Track how often you use each exercise
- **Add to Collection**: One-click add to any collection

### How To: Find the Perfect Exercise

1. Navigate to Exercises → Library
2. Use search bar to search by name (e.g., "squat")
3. Apply filters:
   - Select Body Part: "Upper Legs"
   - Select Equipment: "Barbell"
   - Select Difficulty: "Intermediate"
4. Browse filtered results (exercises matching ALL filters)
5. Click exercise card to view full details
6. Click GIF to see larger animated demonstration
7. Click heart icon to add to favorites
8. Click "Add to Collection" to organize

### How To: Create an Exercise Collection

1. Navigate to Exercises → Collections
2. Click "New Collection"
3. Enter collection name (e.g., "Home Workouts")
4. (Optional) Add description
5. Set visibility: Public or Private
6. Save collection
7. Browse exercise library
8. On each exercise, click "Add to Collection"
9. Select your collection from dropdown
10. Collection auto-updates with your selections

### UI Elements

| Screen | Element | Description |
|--------|---------|-------------|
| **Exercise Grid** | Responsive cards | 4 cols desktop, 2 cols tablet, 1 col mobile |
| **Exercise Card** | GIF + metadata | Animated GIF with overlay badges for difficulty |
| **Filter Panel** | Multi-select dropdowns | Body part, equipment, muscle, difficulty |
| **Search Bar** | Instant search | Debounced search with clear button |
| **GIF Player** | Touch-friendly controls | Tap to pause/play, mobile-optimized |
| **Detail View** | Modal overlay | Full instructions, related exercises |
| **Favorites** | Heart icon | Filled red when favorited |

### Data Model

```typescript
// Exercise (1,344 records in production)
Exercise {
  id: UUID
  exerciseId: string (unique, from ExerciseDB)
  name: string
  gifUrl: string (CDN URL)
  bodyPart: string (10 categories)
  equipment: string (29 types)
  targetMuscle: string (26 groups)
  secondaryMuscles: string[]
  instructions: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  searchVector: string (for full-text search)
  isActive: boolean
}

// Exercise favorites (many-to-many)
ExerciseFavorite {
  userId: UUID (FK)
  exerciseId: UUID (FK)
  favoritedAt: timestamp
}

// Exercise collections (1:many with user)
ExerciseCollection {
  id: UUID
  userId: UUID (FK)
  name: string
  description: text
  isPublic: boolean
}

// Collection exercises (many-to-many)
CollectionExercise {
  collectionId: UUID (FK)
  exerciseId: UUID (FK)
  position: int (for ordering)
  addedAt: timestamp
}

// Exercise usage tracking
ExerciseUsage {
  userId: UUID (FK)
  exerciseId: UUID (FK)
  context: string ('program', 'workout', 'viewed')
  usedAt: timestamp
}

// Exercise search history
ExerciseSearchHistory {
  userId: UUID (FK)
  searchQuery: string
  filters: JSON
  resultCount: int
  searchedAt: timestamp
}
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/exercises` | List exercises (paginated, filtered) |
| GET | `/api/exercises/:id` | Get exercise details |
| GET | `/api/exercises/by-id/:exerciseId` | Get by exerciseDB ID |
| GET | `/api/exercises/search` | Full-text search |
| GET | `/api/exercises/filters` | Get filter options with counts |
| POST | `/api/exercises/favorites` | Add to favorites |
| DELETE | `/api/exercises/favorites/:id` | Remove from favorites |
| GET | `/api/exercises/collections` | List user's collections |
| POST | `/api/exercises/collections` | Create collection |
| PUT | `/api/exercises/collections/:id` | Update collection |
| DELETE | `/api/exercises/collections/:id` | Delete collection |
| POST | `/api/exercises/collections/:id/exercises` | Add exercise to collection |
| DELETE | `/api/exercises/collections/:id/exercises/:exerciseId` | Remove from collection |

### Known Limitations

- Custom exercise creation (trainer-uploaded exercises) is not yet implemented
- Exercise video uploads (alternative to GIFs) are not yet supported
- Muscle diagram visualization is planned but not yet implemented
- Exercise rating/review system is planned but not yet implemented

---

## Program Builder

### Overview

Design sophisticated, periodized training programs with 8 program types, 7 set types, superset support, RPE/RIR tracking, tempo prescriptions, and template library - then assign to clients with one click or bulk assign to groups.

### Key Capabilities

#### Program Types (8 Categories)

| Type | Description | Best For |
|------|-------------|----------|
| **Strength** | Progressive overload, compound lifts, 3-6 rep ranges | Powerlifters, strength athletes |
| **Hypertrophy** | Muscle building, 8-12 rep ranges, volume focus | Bodybuilders, muscle gain |
| **Endurance** | High reps, circuit style, minimal rest | Endurance athletes, fat loss |
| **Powerlifting** | Competition lifts (squat, bench, deadlift), peaking | Competitive powerlifters |
| **Bodybuilding** | Isolation work, split routines, pump focus | Bodybuilding competitors |
| **General Fitness** | Balanced approach, variety, wellness | General population, beginners |
| **Sport-Specific** | Athletic performance, power, agility | Athletes preparing for sports |
| **Rehabilitation** | Injury recovery, mobility, gradual progression | Post-injury, physical therapy |

#### Program Structure

**Multi-Week Organization:**
- **Program Name**: Descriptive name (e.g., "12-Week Strength Builder")
- **Description**: Program overview and goals
- **Duration**: 1-52 weeks
- **Difficulty**: Beginner, Intermediate, or Advanced
- **Goals**: Multiple goal tags (strength, hypertrophy, etc.)
- **Equipment Needed**: Auto-generated from exercises used

**Week Structure:**
- **Week Number**: 1, 2, 3... up to 52
- **Week Name**: Optional (e.g., "Foundation Week", "Peak Week")
- **Week Description**: Coaching notes for the week
- **Deload Week**: Boolean flag for recovery weeks
- **Workouts**: 1-7 workout days per week

**Workout Day:**
- **Day Number**: 1-7 (Mon-Sun)
- **Workout Name**: (e.g., "Push Day", "Lower Body Power")
- **Workout Type**: Strength, Cardio, HIIT, Flexibility, Mixed, Recovery
- **Description**: Workout focus and objectives
- **Estimated Duration**: Minutes (auto-calculated from exercises + rest)
- **Rest Day**: Boolean flag for scheduled rest days

#### Exercise Configuration

**Per Exercise:**
- **Exercise Selection**: Search/filter from 1,344 exercise library
- **Order Index**: Position in workout (drag-and-drop to reorder)
- **Superset Group**: A/B/C grouping for supersets/circuits
- **Sets Configuration**: Array of set configurations
- **Notes**: Coaching cues, form tips, alternatives

**Per Set Configuration:**
- **Set Number**: 1, 2, 3...
- **Set Type**: (see 7 set types below)
- **Reps**: "8-10", "AMRAP", "30s" (flexible string format)
- **Weight Guidance**: "70% 1RM", "RPE 7", "Bodyweight", or specific weight
- **Rest Period**: Seconds between sets
- **Tempo**: "3-1-2-0" (eccentric-pause-concentric-pause)
- **RPE**: Rate of Perceived Exertion (1-10 scale)
- **RIR**: Reps in Reserve (0-5)
- **Notes**: Set-specific coaching

#### 7 Set Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Warmup** | Low intensity, prepare for working sets | First 1-2 sets, 50-60% working weight |
| **Working** | Main work sets at prescribed intensity | Core training volume |
| **Drop** | Reduce weight mid-set, continue to failure | Hypertrophy, muscle exhaustion |
| **Pyramid** | Increase weight each set (ascending) or decrease (descending) | Strength progression |
| **AMRAP** | As Many Reps As Possible at given weight | Test max reps, conditioning |
| **Cluster** | Short rest within set (e.g., 3 reps, 15s rest, 3 reps) | Powerlifting, strength-endurance |
| **Rest-Pause** | Set to failure, brief rest, continue | Hypertrophy, breaking plateaus |

#### Superset & Circuit Support

**Superset Groups:**
- **A Group**: First exercise(s) in superset
- **B Group**: Second exercise(s) in superset
- **C Group**: Third exercise(s) (for tri-sets)
- **Execution**: Complete one set of A, immediately one set of B, then rest

**Circuit Support:**
- All exercises in same letter group = circuit
- No rest between exercises in circuit
- Rest after complete circuit round

#### Progressive Overload Planning

- **Deload Weeks**: Mark weeks as deload (reduced volume/intensity)
- **Week-to-Week Progression**: Each week can have different set/rep/weight schemes
- **Automatic Progression Suggestions**: (planned feature)
- **Progressive Templates**: Pre-built templates with built-in progression

#### Template Library

**Saving as Template:**
- Save any program as reusable template
- Add category (Strength, Hypertrophy, etc.)
- Add tags for searchability
- Public/private toggle
- Use count tracking
- Rating system (planned)

**Using Templates:**
- Browse template library
- Filter by category, difficulty, duration
- Preview full program structure
- One-click duplicate to customize
- Assign template directly to client

#### Program Assignment

**Assign to Single Client:**
1. Select program
2. Choose client from roster
3. Set start date
4. Add custom notes
5. Client receives notification
6. Program appears in client's dashboard

**Bulk Assignment:**
- Select program
- Choose multiple clients (or filter by tag)
- Set start date (same for all or staggered)
- Add group-wide notes
- Assign all with one click

### How To: Build a 4-Week Strength Program

1. Navigate to Programs → New Program
2. Enter program name: "4-Week Strength Foundation"
3. Select program type: Strength
4. Set difficulty: Intermediate
5. Set duration: 4 weeks
6. Add goals: "Strength", "Muscle Gain"
7. Click "Add Week" (repeat 4 times)
8. For Week 1:
   - Name: "Foundation Week"
   - Add 4 workout days
9. For Day 1 "Upper Body Push":
   - Add "Barbell Bench Press"
     - Set 1: Warmup, 10 reps, 50% 1RM, 60s rest
     - Set 2: Warmup, 8 reps, 60% 1RM, 60s rest
     - Set 3: Working, 6 reps, 80% 1RM, 120s rest, RPE 8
     - Set 4: Working, 6 reps, 80% 1RM, 120s rest, RPE 8
     - Set 5: Working, 6 reps, 80% 1RM, 180s rest, RPE 9
   - Add "Overhead Press"
   - Add "Dips"
10. Repeat for all days and weeks
11. Preview full program
12. Save as template (optional)
13. Assign to client

### How To: Create Supersets

1. In workout builder, add first exercise (e.g., "Bench Press")
2. Set superset group: "A"
3. Add second exercise (e.g., "Bent Over Row")
4. Set superset group: "A" (same as first)
5. Configure sets for both (same number of sets)
6. Client will see:
   - "A1: Bench Press - 4x8"
   - "A2: Bent Over Row - 4x8"
7. Execution: Bench → Row → Rest → Repeat

### UI Elements

| Screen | Element | Description |
|--------|---------|-------------|
| **Program Builder** | Tabbed interface | Info, Weeks, Preview tabs |
| **Week Builder** | Accordion | Each week expands to show workout days |
| **Workout Builder** | Exercise list + config panel | Left: exercise list, Right: configuration |
| **Exercise Selector** | Modal with filters | Search + filter exercises to add |
| **Set Configuration** | Table view | Each row = one set with all parameters |
| **Superset Groups** | Letter badges | A/B/C badges on exercise cards |
| **Template Library** | Card grid | Filterable template cards |
| **Bulk Assignment** | Multi-select modal | Select multiple clients, set date, assign |

### Data Model

```typescript
// Program
Program {
  id: UUID
  trainerId: UUID (FK)
  name: string
  description: text
  programType: enum (8 types)
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  durationWeeks: int
  goals: string[] (tags)
  equipmentNeeded: string[] (auto-generated)
  isTemplate: boolean
  isPublic: boolean
}

// Program week (1:many with program)
ProgramWeek {
  id: UUID
  programId: UUID (FK)
  weekNumber: int
  name: string
  description: text
  isDeload: boolean
}

// Program workout (1:many with week)
ProgramWorkout {
  id: UUID
  programWeekId: UUID (FK)
  dayNumber: int (1-7)
  name: string
  description: text
  workoutType: enum (6 types)
  estimatedDuration: int (minutes, auto-calc)
  isRestDay: boolean
}

// Workout exercise (1:many with workout)
WorkoutExercise {
  id: UUID
  workoutId: UUID (FK)
  exerciseId: UUID (FK)
  orderIndex: int
  supersetGroup: string ('A', 'B', 'C', null)
  setsConfig: JSON (array of set config objects)
  notes: text
}

// Exercise configuration (1:many with workout exercise)
ExerciseConfiguration {
  id: UUID
  workoutExerciseId: UUID (FK)
  setNumber: int
  setType: enum (7 types)
  reps: string ("8-10", "AMRAP", "30s")
  weightGuidance: string ("70% 1RM", "RPE 7")
  restSeconds: int
  tempo: string ("3-1-2-0")
  rpe: int (1-10)
  rir: int (0-5)
  notes: text
}

// Program assignment (many-to-many)
ProgramAssignment {
  id: UUID
  programId: UUID (FK)
  clientId: UUID (FK)
  trainerId: UUID (FK)
  startDate: date
  endDate: date
  isActive: boolean
  customNotes: text
  progressData: JSON (completion tracking)
  assignedAt: timestamp
  completedAt: timestamp
}

// Program template (1:many with program)
ProgramTemplate {
  id: UUID
  programId: UUID (FK)
  name: string
  description: text
  category: string
  tags: string[]
  isPublic: boolean
  useCount: int
  rating: float
  createdBy: UUID (FK user)
}
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/programs` | Create new program |
| GET | `/api/programs` | List trainer's programs |
| GET | `/api/programs/:id` | Get program details |
| PUT | `/api/programs/:id` | Update program |
| DELETE | `/api/programs/:id` | Delete program |
| POST | `/api/programs/:id/duplicate` | Duplicate program |
| POST | `/api/programs/:id/assign` | Assign to client(s) |
| GET | `/api/programs/templates` | Browse templates |
| GET | `/api/programs/client/:clientId` | Get client's programs |

### Known Limitations

- Progressive overload UI is ~95% complete - minor polish updates may occur
- Automatic progression suggestions are planned but not yet implemented
- Drag-and-drop exercise reordering works but could be more intuitive on mobile
- Program sharing between trainers is not yet implemented

---

## Workout Tracking & Logging

### Overview

Real-time workout session tracking with set-by-set logging, rest timers, automatic personal best detection, adherence scoring, subjective feedback ratings, and offline support via IndexedDB.

### Key Capabilities

#### Workout Session Tracking

**Session Lifecycle:**
- **Scheduled**: Workout assigned to specific date
- **In Progress**: Client started workout, actively logging
- **Completed**: All sets logged, session finished
- **Skipped**: Client chose to skip workout
- **Missed**: Scheduled workout not completed by end of day

**Session Metadata:**
- **Scheduled Date**: When workout is planned
- **Actual Start/End Time**: Real timestamps when started/finished
- **Total Duration**: Minutes from start to end
- **Total Paused Time**: Cumulative pause/rest time
- **Current Progress**: Which exercise and set currently active

#### Set-by-Set Logging

**For Each Set:**
- **Planned vs Actual**: Shows prescribed reps/weight vs what was actually done
- **Actual Reps**: Number completed
- **Weight Used**: Actual weight lifted (in user's preferred units)
- **RPE**: Rate of Perceived Exertion (1-10)
- **RIR**: Reps in Reserve (0-5)
- **Duration**: For timed exercises (seconds)
- **Rest Time**: Actual rest taken between sets
- **Tempo**: If prescribed, track adherence
- **Completed**: Boolean flag for set completion
- **Skipped**: If set was intentionally skipped
- **Notes**: Per-set notes (e.g., "felt easy", "form breakdown")
- **Timestamp**: When set was completed

#### Rest Timer
- **Automatic Timer**: Starts countdown after completing a set
- **Prescribed Rest**: Shows target rest period from program
- **Actual Rest Tracking**: Records actual rest time taken
- **Audio/Visual Alerts**: Timer completion notification
- **Skip Rest**: Option to skip rest and move to next set
- **Pause Timer**: Pause for water break, restroom, etc.

#### Automatic Personal Best Detection

**Detected PRs:**
- **1RM PRs**: Calculated or actual 1-rep max
- **Volume PRs**: Total weight moved for an exercise in a session
- **Rep PRs**: Most reps at a specific weight
- **Endurance PRs**: Longest duration for timed exercises
- **Power PRs**: For explosive movements

**PR Celebration:**
- Visual confetti animation on screen
- "New PR!" badge on exercise log
- PR saved to performance metrics table
- PR appears in personal bests dashboard
- Trainer receives notification of client PR

#### Session Metrics (Auto-Calculated)

- **Total Volume**: Sum of (weight × reps) for all sets
- **Total Sets**: Count of completed sets
- **Completed Sets**: Sets marked as complete
- **Average RPE**: Mean RPE across all sets
- **Adherence Score**: Percentage of prescribed work completed (formula: completed sets / total prescribed sets × 100)

#### Subjective Feedback

**User Feedback Per Session:**
- **Effort Rating**: 1-10 scale (how hard was the workout)
- **Enjoyment Rating**: 1-10 scale (how much did you enjoy it)
- **Energy Before**: 1-10 scale (energy level pre-workout)
- **Energy After**: 1-10 scale (energy level post-workout)
- **Client Notes**: Free-form text notes
- **Trainer Feedback**: Trainer can add feedback after review

#### Workout History
- **Timeline View**: Chronological list of all completed workouts
- **Filter by Date Range**: Last week, month, year, custom
- **Filter by Program**: See all sessions for a specific program
- **Filter by Exercise**: See all sessions containing specific exercise
- **Search**: Search notes and feedback

#### Offline Support
- **Workout Download**: Download assigned programs for offline access
- **IndexedDB Storage**: Local database for offline workout data
- **Offline Logging**: Full logging capability without internet
- **Sync Manager**: Automatic background sync when reconnected
- **Conflict Resolution**: Handles sync conflicts gracefully
- **No Data Loss**: Queue ensures all data uploads when online

### How To: Log a Workout Session

1. Navigate to Today's Workout (Dashboard or Workouts page)
2. Click "Start Workout" button
3. Workout timer begins automatically
4. For each exercise:
   - View prescribed sets/reps/weight
   - View exercise GIF demonstration
   - For each set:
     - Enter actual weight used
     - Enter actual reps completed
     - (Optional) Enter RPE rating
     - Click "Complete Set"
     - Rest timer starts automatically
     - Wait for rest or skip to next set
   - Repeat for all sets
5. After all sets: mark exercise complete, move to next
6. After all exercises: click "Finish Workout"
7. Rate effort, enjoyment, energy (1-10 scales)
8. Add optional notes
9. Submit - workout saved, PRs detected, stats updated

### How To: Track Personal Bests

1. Complete a workout (logging as above)
2. If PR detected: confetti animation + "New PR!" alert
3. Navigate to Analytics → Personal Bests
4. View PRs by exercise:
   - 1RM records
   - Volume records
   - Rep records
5. View PR timeline chart
6. Export PR data as CSV

### How To: Review Workout History

1. Navigate to Workouts → History
2. Select date range (last 7 days, 30 days, all time)
3. (Optional) Filter by program or exercise
4. Click any workout card to view details:
   - All sets logged
   - Total volume
   - Adherence score
   - Effort/enjoyment ratings
   - Notes from client and trainer
5. Export history as PDF

### UI Elements

| Screen | Element | Description |
|--------|---------|-------------|
| **Active Workout** | Exercise cards | Each exercise as expandable card |
| **Set Logging** | Table rows | One row per set with input fields |
| **Rest Timer** | Countdown circle | Circular progress indicator |
| **PR Alert** | Confetti animation | Full-screen celebration with stats |
| **History Timeline** | Workout cards | Date, program name, duration, adherence |
| **Session Detail** | Stats grid | Volume, sets, avg RPE, adherence |
| **Feedback Form** | Slider inputs | 1-10 sliders for effort, enjoyment, energy |

### Data Model

```typescript
// Workout session (main logging table)
WorkoutSession {
  id: UUID
  programAssignmentId: UUID (FK)
  workoutId: UUID (FK program workout)
  clientId: UUID (FK)
  trainerId: UUID (FK)
  scheduledDate: date
  actualStartTime: timestamp
  actualEndTime: timestamp
  totalDuration: int (minutes)
  totalPausedTime: int (seconds)
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'missed'
  currentExerciseIndex: int
  currentSetIndex: int
  totalVolume: decimal
  totalSets: int
  completedSets: int
  averageRpe: decimal
  adherenceScore: decimal (percentage)
  effortRating: int (1-10)
  enjoymentRating: int (1-10)
  energyBefore: int (1-10)
  energyAfter: int (1-10)
  clientNotes: text
  trainerFeedback: text
}

// Workout exercise log (1:many with session)
WorkoutExerciseLog {
  id: UUID
  workoutSessionId: UUID (FK)
  workoutExerciseId: UUID (FK)
  exerciseId: UUID (FK)
  orderIndex: int
  supersetGroup: string
  skipped: boolean
  totalVolume: decimal
  personalBest: boolean (flagged if PR detected)
  notes: text
  startTime: timestamp
  endTime: timestamp
}

// Workout set log (1:many with exercise log)
WorkoutSetLog {
  id: UUID
  exerciseLogId: UUID (FK)
  setNumber: int
  plannedReps: string ("8-10", "AMRAP")
  actualReps: int
  weight: decimal
  rpe: decimal (1-10)
  rir: int (0-5)
  duration: int (seconds for timed)
  restTime: int (actual rest in seconds)
  tempo: string ("3-1-2-0")
  completed: boolean
  skipped: boolean
  notes: text
  timestamp: timestamp (when set was completed)
}
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/workouts` | List user's workouts |
| GET | `/api/workouts/active` | Get active workout session |
| POST | `/api/workouts` | Start new workout session |
| GET | `/api/workouts/:id` | Get workout session details |
| PUT | `/api/workouts/:id` | Update workout session |
| POST | `/api/workouts/:id/complete` | Mark workout complete |
| POST | `/api/workouts/:id/sets` | Log sets for workout |
| GET | `/api/workouts/history` | Get workout history |
| GET | `/api/workouts/progress` | Get workout progress stats |

### Known Limitations

- Offline support is ~40% complete - core logging works, but some sync edge cases remain
- Video recording of form (for trainer review) is planned but not implemented
- Live workout streaming to trainer is planned but not implemented
- Apple Watch / wearable integration is planned but not implemented

---

## Progress Analytics

### Overview

Comprehensive analytics suite with body composition tracking, 8 performance metric types, ACWR training load monitoring, AI-powered insights, goal progress tracking, milestone achievements, and downloadable reports.

### Key Capabilities

#### Body Composition Tracking (8 Metric Types)

| Metric Type | Description | Unit |
|-------------|-------------|------|
| **Body Weight** | Total body weight | kg or lbs |
| **Body Fat** | Body fat percentage | % |
| **Muscle Mass** | Lean muscle mass | kg or lbs |
| **1RM** | One-rep maximum for an exercise | kg or lbs |
| **Volume** | Total weight moved in a session | kg or lbs |
| **Endurance** | Cardio duration or reps at bodyweight | minutes or reps |
| **Power** | Explosive movement output | watts or velocity |
| **Speed** | Sprint or movement speed | m/s or mph |

#### Multi-Line Progress Charts
- **Time Range Selection**: 7 days, 30 days, 90 days, 1 year, all time, custom
- **Multiple Metrics**: Overlay weight, body fat %, and muscle mass on one chart
- **Interactive**: Hover for exact values, zoom in/out
- **Comparison Baselines**: Set "before" baseline to compare against
- **Export**: Download chart as PNG or data as CSV

#### Custom Body Measurements
**Flexible JSON Storage** for any measurements:
- Chest, Waist, Hips (standard)
- Arms (left/right), Thighs (left/right), Calves (left/right)
- Neck, Shoulders, Forearms
- Custom measurements (add any measurement name)

#### ACWR Training Load Monitoring

**Acute:Chronic Workload Ratio** - used by professional sports teams:

| Component | Description | Calculation |
|-----------|-------------|-------------|
| **Acute Load** | 7-day rolling average | Sum of last 7 days volume / 7 |
| **Chronic Load** | 28-day rolling average | Sum of last 28 days volume / 28 |
| **ACWR Ratio** | Acute / Chronic | Risk indicator |

**ACWR Interpretation:**
- **< 0.8**: Under-training risk (deconditioning)
- **0.8 - 1.3**: Sweet spot (optimal adaptation)
- **1.3 - 1.5**: Elevated risk (monitor closely)
- **> 1.5**: High injury risk (reduce load immediately)

**Training Load Components:**
- **Total Volume**: Weight × reps summed across week
- **Total Sets**: Count of all sets
- **Total Reps**: Count of all reps
- **Training Days**: Number of days trained
- **Average Intensity**: Mean weight used across all sets
- **Body Part Distribution**: JSON breakdown by muscle group

#### Personal Bests Tracking
- **Exercise-Specific PRs**: 1RM, volume, reps tracked per exercise
- **Automatic Detection**: PRs flagged during workout logging
- **PR Timeline**: Chart showing PR progression over time
- **PR Leaderboard**: Top PRs across all exercises
- **Celebration**: Confetti animation when PR achieved

#### Goal Progress Tracking
- **Visual Progress**: Percentage bars showing completion
- **Checkpoint Recording**: Log goal progress at intervals
- **Target Date Countdown**: Days remaining to goal deadline
- **On Track Indicator**: Green/yellow/red based on trajectory
- **Multi-Goal Dashboard**: See all active goals simultaneously

#### AI-Powered Insights

**Insight Generation** (rule-based system):
- **Training Volume Insights**: "Volume increased 15% this week - watch for overtraining"
- **Consistency Insights**: "You've trained 4 days/week for 8 weeks - excellent consistency"
- **Goal Progress Insights**: "At current rate, you'll reach your weight goal 2 weeks early"
- **Recovery Insights**: "RPE averaging 8.5 - consider a deload week"
- **Plateau Insights**: "Bench press volume hasn't increased in 4 weeks - time to switch rep range?"

**Insight Priority:**
- **High**: Immediate action needed (injury risk, overtraining)
- **Medium**: Opportunities for improvement (plateau, consistency)
- **Low**: Informational (milestones, celebrations)

**Insight Actions:**
- Mark as Read
- Mark Action Taken
- Dismiss
- Expiration (time-sensitive insights auto-expire)

#### Milestone Achievements

**Auto-Detected Milestones:**
- First workout completed
- 10, 25, 50, 100, 250, 500 workouts completed
- 10, 20, 30-day training streaks
- Body weight milestones (-5kg, -10kg, -20kg, etc.)
- Personal records (1RM, volume, reps)
- Program completion
- Goal achievement

**Milestone Display:**
- Badge icon
- Achievement title
- Description
- Date achieved
- Achieved value (if numeric)

#### Analytics Reports

**Report Generation:**
- **Report Types**: Weekly summary, monthly review, quarterly deep-dive
- **Period Selection**: Custom date range
- **Included Metrics**: User selects which metrics to include
- **Trainer Commentary**: Optional trainer notes added to report
- **Export Formats**: PDF (with charts), CSV (raw data)
- **White-Label**: Remove EvoFit branding for professional trainers (planned)

### How To: Track Body Composition Over Time

1. Navigate to Analytics → Body Composition
2. Click "Add Measurement"
3. Enter date, weight, body fat %, muscle mass
4. (Optional) Add custom measurements (chest, waist, etc.)
5. Save measurement
6. View multi-line chart showing all metrics
7. Select time range: 30 days, 90 days, 1 year
8. Set comparison baseline (e.g., Jan 1 start date)
9. Chart shows progress from baseline to current
10. Export chart as PNG or data as CSV

### How To: Monitor Training Load (ACWR)

1. Navigate to Analytics → Training Load
2. View current week's acute load
3. View 28-day chronic load
4. View ACWR ratio with color indicator:
   - Green: 0.8-1.3 (optimal)
   - Yellow: 1.3-1.5 (caution)
   - Red: >1.5 (high risk)
5. Review body part distribution pie chart
6. If ratio > 1.5: platform suggests deload or reduced volume
7. Export training load data

### How To: Generate Analytics Report

1. Navigate to Analytics → Reports
2. Click "Generate Report"
3. Select report type: Weekly/Monthly/Quarterly
4. Select date range
5. Choose metrics to include:
   - Body composition
   - Performance metrics
   - Goal progress
   - Workout compliance
   - Personal bests
6. (Trainer only) Add commentary
7. Click "Generate PDF"
8. Report downloads with charts, tables, and insights
9. Share with client or keep for records

### UI Elements

| Screen | Element | Description |
|--------|---------|-------------|
| **Body Composition** | Multi-line chart | Weight, body fat, muscle mass overlay |
| **Measurements Form** | Input grid | Date picker + numeric inputs |
| **Training Load** | Gauge chart | ACWR ratio with color zones |
| **Personal Bests** | Card grid | PR cards with exercise name, value, date |
| **Goal Progress** | Progress bars | Horizontal bars with percentage labels |
| **Insights Panel** | Alert cards | Priority-colored cards with action buttons |
| **Milestones** | Badge list | Achievement badges with dates |

### Data Model

```typescript
// User measurements (body composition)
UserMeasurement {
  userId: UUID (FK)
  height: decimal
  weight: decimal
  bodyFatPercentage: decimal
  muscleMass: decimal
  measurements: JSON (custom measurements: chest, waist, etc.)
  recordedAt: timestamp
}

// Performance metrics (8 types)
PerformanceMetric {
  userId: UUID (FK)
  exerciseId: UUID (FK nullable)
  metricType: 'one_rm' | 'volume' | 'endurance' | 'power' | 'speed' | 'body_weight' | 'body_fat' | 'muscle_mass'
  value: decimal
  unit: string
  recordedAt: timestamp
  workoutSessionId: UUID (FK nullable)
  notes: text
}

// Training load calculations
TrainingLoad {
  userId: UUID (FK)
  weekStartDate: date (unique per user)
  totalVolume: decimal
  totalSets: int
  totalReps: int
  trainingDays: int
  averageIntensity: decimal
  bodyPartDistribution: JSON
  acuteLoad: decimal (7-day rolling)
  chronicLoad: decimal (28-day rolling)
  loadRatio: decimal (acute/chronic)
  calculatedAt: timestamp
}

// Goal progress tracking
GoalProgress {
  goalId: UUID (FK)
  recordedDate: date
  currentValue: decimal
  percentageComplete: decimal
  notes: text
}

// User insights (AI-powered)
UserInsight {
  userId: UUID (FK)
  insightType: string ('volume', 'consistency', 'goal', 'recovery', 'plateau')
  title: string
  description: text
  data: JSON (supporting data)
  priority: 'low' | 'medium' | 'high'
  isRead: boolean
  actionTaken: boolean
  expiresAt: timestamp
}

// Milestone achievements
MilestoneAchievement {
  userId: UUID (FK)
  milestoneType: string ('workout_count', 'streak', 'weight_loss', 'pr', 'program_complete', 'goal')
  title: string
  description: text
  achievedValue: decimal
  achievedAt: timestamp
}

// Chart preferences
ChartPreference {
  userId: UUID (FK)
  chartType: string
  preferences: JSON (colors, ranges, display options)
  isDefault: boolean
}

// Comparison baselines
ComparisonBaseline {
  userId: UUID (FK)
  baselineName: string
  baselineDate: date
  measurements: JSON
  performanceData: JSON
  isActive: boolean
}

// Analytics reports
AnalyticsReport {
  userId: UUID (FK)
  trainerId: UUID (FK nullable)
  reportType: string
  periodStart: date
  periodEnd: date
  reportData: JSON
  fileUrl: string (PDF URL)
  generatedAt: timestamp
}
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/analytics/measurements` | List measurements |
| POST | `/api/analytics/measurements` | Add measurement |
| PUT | `/api/analytics/measurements/:id` | Update measurement |
| GET | `/api/analytics/measurements/me` | Get my measurements |
| GET | `/api/analytics/performance` | List performance metrics |
| POST | `/api/analytics/performance` | Add metric |
| GET | `/api/analytics/performance/me` | Get my metrics |
| GET | `/api/analytics/performance/me/personal-bests` | Get my PRs |
| GET | `/api/analytics/training-load` | List training load |
| POST | `/api/analytics/training-load/calculate` | Trigger calculation |
| GET | `/api/analytics/training-load/me` | Get my training load |
| GET | `/api/analytics/personal-bests` | Get personal bests |
| GET | `/api/analytics/goals` | List goals |
| POST | `/api/analytics/goals` | Create goal |
| PUT | `/api/analytics/goals/:id` | Update goal |
| POST | `/api/analytics/goals/:id/progress` | Log goal progress |
| GET | `/api/analytics/milestones` | List milestones |
| GET | `/api/analytics/milestones/me` | Get my milestones |
| POST | `/api/analytics/reports` | Generate report |
| GET | `/api/analytics/reports` | List reports |

### Known Limitations

- AI insights are rule-based, not true machine learning (yet)
- White-label PDF reports are planned but not yet implemented
- Integration with wearables (Fitbit, Apple Watch, Garmin) is planned but not yet implemented
- Predicted goal completion dates use linear regression (could be more sophisticated)

---

## Messaging & Communication

### Overview

Stay connected through WhatsApp integration, in-app activity feeds, invitation notifications, and session feedback - creating a continuous feedback loop between trainers and clients.

### Key Capabilities

#### WhatsApp Integration
- **WhatsApp Number Field**: Both trainers and clients can add WhatsApp numbers to profiles
- **Click-to-Message**: One-click link opens WhatsApp chat with user
- **Mobile-Optimized**: Direct WhatsApp app launch on mobile
- **Cross-Platform**: Works on iOS, Android, desktop (web.whatsapp.com)
- **No In-App Chat Needed**: Meets clients where they already communicate

#### Activity Feed
- **Chronological Timeline**: All platform activity in date-sorted feed
- **Activity Types**:
  - Workout completions
  - Milestone achievements
  - Program assignments
  - Goal updates
  - Invitation status changes
  - System events
- **Rich Metadata**: Each activity includes related IDs and types for deep linking
- **Click to Navigate**: Tap activity to jump to related workout, program, or achievement
- **User-Specific**: Each user sees their own activity feed

#### Invitation Notifications
- **Email Notifications**: Automated emails for invitation lifecycle
  - Trainer sends invitation → Client receives email
  - Client accepts → Trainer receives acceptance notification
  - Invitation expires → Trainer receives expiry notice
- **In-App Notifications**: Visual badges for pending invitations
- **Status Updates**: Real-time status changes (pending → accepted → expired)

#### Workout Session Feedback
- **Client Notes**: Free-form notes per workout session
- **Trainer Feedback**: Trainer can review session and add feedback
- **Two-Way Dialogue**: Creates ongoing coaching conversation
- **Historical Record**: All notes and feedback preserved in workout history

### How To: Connect with Client via WhatsApp

**For Trainers:**
1. Navigate to Clients → Select Client
2. View client profile card
3. If WhatsApp number present: click WhatsApp icon
4. WhatsApp opens with pre-filled message
5. Send message or start conversation
6. (If no number) Ask client to add WhatsApp to profile

**For Clients:**
1. Navigate to Profile → Edit Profile
2. Add WhatsApp number in international format (e.g., +1234567890)
3. Save profile
4. Trainer can now reach you via WhatsApp

### How To: Review Client Workout Feedback

1. Navigate to Dashboard (Trainer view)
2. View Activity Feed
3. See "Client completed workout" activities
4. Click activity → opens workout session detail
5. Read client's session notes
6. Add trainer feedback: "Great job on those PRs! Next week let's add 2.5kg to bench."
7. Save feedback
8. Client sees feedback in their workout history

### UI Elements

| Screen | Element | Description |
|--------|---------|-------------|
| **Profile Card** | WhatsApp link button | Green WhatsApp icon with "Message" label |
| **Activity Feed** | Timeline cards | Date-grouped activity cards with icons |
| **Activity Card** | Icon + title + description | Clickable card with metadata |
| **Workout Detail** | Feedback section | Separate client notes + trainer feedback areas |
| **Notification Badge** | Red count badge | Unread invitation count on clients tab |

### Data Model

```typescript
// User profile (WhatsApp field)
UserProfile {
  userId: UUID (FK)
  whatsappNumber: string
  // ... other profile fields
}

// Activity feed
Activity {
  id: UUID
  userId: UUID (FK)
  type: string ('workout', 'milestone', 'program', 'goal', 'invitation', 'system')
  title: string
  description: string
  relatedId: UUID (FK nullable - workout, program, etc.)
  relatedType: string ('workout', 'program', 'milestone', etc.)
  metadata: JSON (additional data)
  createdAt: timestamp
}

// Workout session (feedback fields)
WorkoutSession {
  // ... session fields
  clientNotes: text
  trainerFeedback: text
}

// Client invitation (for notifications)
ClientInvitation {
  // ... invitation fields
  status: 'pending' | 'accepted' | 'expired'
  sentAt: timestamp
  acceptedAt: timestamp
}
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/activities` | Get user's activity feed |
| POST | `/api/activities` | Create activity (system use) |

### Known Limitations

- Full in-app real-time messaging (chat) is not yet implemented
- Video calling is planned but not yet built
- Push notifications (web push) are planned but not yet implemented
- Group messaging for trainer-to-multiple-clients is not yet implemented

---

## Scheduling & Calendar

### Overview

Visual calendar with monthly/weekly/daily views, configurable trainer availability, 5 appointment types, full lifecycle tracking, and online session support with meeting links.

### Key Capabilities

#### Calendar Views
- **Monthly Grid**: Full month view with day cells showing workout cards
- **Weekly View**: 7-day horizontal layout with hour slots
- **Daily View**: Single day with detailed hour breakdown (planned)
- **Agenda View**: List format of upcoming appointments (planned)

#### Trainer Availability Configuration
- **Day of Week Slots**: Configure per-day availability (Sunday = 0, Saturday = 6)
- **Start/End Times**: "09:00" - "17:00" format
- **Multiple Slots Per Day**: Morning + evening slots
- **Location Per Slot**: "Main Gym", "Studio B", "Client's Home", "Online"
- **Availability Toggle**: Enable/disable specific slots
- **Recurring Schedule**: Set once, applies every week

**Example:**
- Monday: 06:00-12:00 (Main Gym), 18:00-21:00 (Studio B)
- Tuesday: 06:00-12:00 (Main Gym)
- Wednesday: OFF
- Thursday: 06:00-12:00 (Main Gym), 18:00-21:00 (Online)

#### 5 Appointment Types

| Type | Description | Typical Duration |
|------|-------------|------------------|
| **One-on-One** | Individual training session | 30-60 min |
| **Group Class** | Small group training (2-10 people) | 45-75 min |
| **Assessment** | Initial fitness assessment, movement screening | 60-90 min |
| **Consultation** | Goal setting, program planning, check-in | 30-45 min |
| **Online Session** | Virtual training via video call | 30-60 min |

#### 5 Appointment Statuses

| Status | Description |
|--------|-------------|
| **Scheduled** | Appointment booked, awaiting confirmation |
| **Confirmed** | Both parties confirmed |
| **Completed** | Session finished |
| **Cancelled** | Appointment cancelled |
| **No-Show** | Client didn't attend |

#### Appointment Details
- **Title**: e.g., "Upper Body Training - John Doe"
- **Description**: Session notes, preparation instructions
- **Start/End DateTime**: Full timestamp with timezone support
- **Duration**: Minutes (15, 30, 45, 60, 90, 120)
- **Location**: Physical location or "Online"
- **Meeting Link**: Zoom, Google Meet, or custom URL for online sessions
- **Cancellation Tracking**: Timestamp + reason for cancellations
- **Notes**: Additional session notes

#### Online Session Support
- **Meeting Link Field**: Store Zoom/Meet/Teams link
- **One-Click Join**: Client clicks link to join session
- **Link Display**: Meeting link visible 15 minutes before start
- **Link Validation**: Check for valid URL format
- **Integration**: Works with any video conferencing platform

### How To: Configure Weekly Availability

1. Navigate to Schedule → Availability
2. Click "Add Availability Slot"
3. Select day of week: Monday
4. Set start time: 09:00
5. Set end time: 12:00
6. Set location: "Main Gym"
7. Click Save
8. Repeat for all availability windows
9. Toggle "Available" checkbox to enable/disable slots
10. Availability appears on calendar, clients can book within these windows

### How To: Book an Appointment

**For Trainers:**
1. Navigate to Schedule → Calendar
2. Click date/time slot
3. Select client from dropdown
4. Select appointment type
5. Set duration
6. Add title and description
7. (If online) Add meeting link
8. Click "Book Appointment"
9. Client receives email notification
10. Appointment appears on both calendars

**For Clients:**
1. Navigate to Schedule
2. View trainer's available slots
3. Click available slot
4. Confirm appointment type and duration
5. Submit booking request
6. Trainer receives notification
7. Trainer confirms → appears on your calendar

### How To: Manage Cancellations

1. Open appointment from calendar
2. Click "Cancel Appointment"
3. Select cancellation reason:
   - Client request
   - Trainer unavailable
   - Weather/emergency
   - Other
4. (Optional) Add detailed reason
5. Confirm cancellation
6. Timestamp and reason recorded
7. Other party receives cancellation notification
8. Option to reschedule appears

### UI Elements

| Screen | Element | Description |
|--------|---------|-------------|
| **Calendar Grid** | Day cells | Monthly grid with workout cards in cells |
| **Workout Card** | Mini card | Time, title, type badge |
| **Availability Form** | Day/time inputs | Day dropdown, time pickers, location field |
| **Appointment Modal** | Booking form | Client select, type, duration, location, meeting link |
| **Meeting Link** | URL display | Clickable link with "Join Meeting" button |
| **Status Badge** | Colored badge | Green (confirmed), yellow (scheduled), red (cancelled), gray (no-show) |

### Data Model

```typescript
// Trainer availability (weekly recurring)
TrainerAvailability {
  id: UUID
  trainerId: UUID (FK)
  dayOfWeek: int (0-6, Sunday=0)
  startTime: string ("09:00")
  endTime: string ("17:00")
  isAvailable: boolean
  location: string
}

// Appointments
Appointment {
  id: UUID
  trainerId: UUID (FK)
  clientId: UUID (FK)
  title: string
  description: text
  appointmentType: 'one_on_one' | 'group_class' | 'assessment' | 'consultation' | 'online_session'
  startDatetime: timestamp
  endDatetime: timestamp
  durationMinutes: int
  location: string
  isOnline: boolean
  meetingLink: string (URL)
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  notes: text
  cancelledAt: timestamp
  cancelReason: text
}
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/schedule/availability` | Get trainer availability |
| POST | `/api/schedule/availability` | Add availability slot |
| PUT | `/api/schedule/availability/:id` | Update slot |
| DELETE | `/api/schedule/availability/:id` | Remove slot |
| GET | `/api/schedule/appointments` | List appointments |
| POST | `/api/schedule/appointments` | Create appointment |
| GET | `/api/schedule/appointments/:id` | Get appointment details |
| PUT | `/api/schedule/appointments/:id` | Update appointment |
| DELETE | `/api/schedule/appointments/:id` | Cancel appointment |
| GET | `/api/schedule/slots` | Get available booking slots |

### Known Limitations

- Google/Apple calendar sync (two-way) is not yet implemented
- Client self-booking is supported via API but UI could be more intuitive
- Recurring appointments (e.g., every Monday at 9am) are not yet supported
- Waitlist for fully-booked slots is not yet implemented
- Automated reminders (24hr, 1hr before) are planned but not yet implemented

---

## Payments & Subscriptions

### Overview

**Status:** ON HOLD (post-MVP)

Integrated payment processing for session packages, subscriptions, and invoicing is planned but not yet implemented.

### Planned Capabilities

#### Payment Processing (Planned)
- Stripe integration for credit card processing
- One-time and recurring subscription support
- Session package management (5, 10, 20 sessions)
- Tiered pricing (Starter, Professional, Business, Enterprise)
- Automated invoicing with trainer branding
- Payment retry for failed transactions
- Proration for plan changes
- Client self-cancellation options

#### Pricing Models (Planned)
- **Pay-per-session**: Single session booking
- **Session Packages**: Bulk discounts (5-pack, 10-pack, 20-pack)
- **Monthly Subscriptions**: Recurring online coaching
- **Group Class Memberships**: Unlimited group classes per month

#### Revenue Dashboard (Planned)
- Revenue trends and projections
- Average client value
- Payment method breakdown
- Outstanding balances
- Refund/dispute history

### Known Limitations

- **THIS FEATURE IS NOT YET LIVE**
- Always label as "Coming Soon" in marketing materials
- Database schema and API endpoints are planned but not implemented
- Do not make specific pricing claims until system is live

---

## Mobile PWA Support

### Overview

Mobile-first responsive design with offline workout tracking via IndexedDB, automatic sync, and PWA installable directly from the browser - no app store required.

### Key Capabilities

#### Responsive Design
- **Mobile-First**: Designed for 390px (iPhone) up to 1440px+ (desktop)
- **Breakpoints**: Mobile (390px), Tablet (768px), Desktop (1024px), Wide (1440px)
- **Touch-Optimized**: Large tap targets (44px minimum)
- **Mobile Navigation**: Hamburger menu on mobile, full nav on desktop
- **Adaptive Layouts**: Single column mobile → multi-column desktop

#### Mobile Exercise Cards
- **Compact Layout**: Condensed for small screens
- **GIF Player**: Touch-friendly controls (tap to pause/play)
- **Quick Actions**: Favorite, add to collection without modal
- **Swipe Support**: (planned) Swipe between exercises

#### Offline Capabilities (40% Complete)
- **Workout Download**: Download assigned programs for offline use
- **IndexedDB Storage**: Local database for offline workout data
- **Offline Logging**: Full set-by-set logging without internet
- **Sync Manager**: Automatic background sync when reconnected
- **Conflict Resolution**: Handles sync conflicts (last-write-wins)
- **No Data Loss**: Queue ensures all data uploads when online

#### PWA Features
- **Installable**: Add to home screen directly from browser
- **No App Store**: Instant access, no download friction
- **Same Codebase**: One codebase for mobile and desktop
- **Automatic Updates**: Updates deploy instantly, no version fragmentation
- **Offline Icon**: App icon appears on home screen like native app

### How To: Install EvoFit as PWA on Mobile

**iOS (Safari):**
1. Open https://evofittrainer-six.vercel.app in Safari
2. Tap Share button (box with arrow)
3. Scroll and tap "Add to Home Screen"
4. Name: "EvoFit"
5. Tap "Add"
6. App icon appears on home screen
7. Tap to launch full-screen PWA

**Android (Chrome):**
1. Open https://evofittrainer-six.vercel.app in Chrome
2. Tap three-dot menu
3. Tap "Add to Home screen"
4. Name: "EvoFit"
5. Tap "Add"
6. App icon appears on home screen
7. Tap to launch full-screen PWA

### How To: Log Workout Offline

1. (While online) Navigate to Today's Workout
2. Workout automatically downloaded to device
3. (Disconnect from internet)
4. Tap "Start Workout"
5. Log all sets normally (no internet needed)
6. Tap "Finish Workout"
7. Data saved to IndexedDB locally
8. (Reconnect to internet)
9. Sync manager automatically uploads data
10. Confirm sync: green checkmark appears

### UI Elements

| Screen | Element | Description |
|--------|---------|-------------|
| **Mobile Nav** | Hamburger menu | Three-line icon expands to full menu |
| **Exercise Card Mobile** | Compact card | GIF + name + quick actions |
| **GIF Player Mobile** | Touch controls | Tap to pause/play, pinch to zoom (planned) |
| **Offline Indicator** | Status badge | Orange "Offline" badge in header |
| **Sync Status** | Progress spinner | Spinning indicator during sync |

### Known Limitations

- PWA support is ~40% complete
- Core offline workout logging works, but not all features available offline
- Service worker for full offline capability is partially implemented
- Background sync is functional but could be more robust
- Do not claim full native app feature parity

---

## Admin Dashboard

### Overview

Platform-wide oversight with dashboard statistics, user management (search, filter, activate, deactivate, change roles), and system health monitoring.

### Key Capabilities

#### Dashboard Statistics
- **Total Users**: Count of all users (trainers + clients + admins)
- **Active Users**: Users with isActive = true
- **Total Exercises**: 1,344 in production
- **Total Sessions**: Workout sessions logged across platform
- **User Growth**: New users this week/month/year
- **Session Volume**: Total sessions this week/month/year

#### User Management
- **User List**: Paginated table of all users
- **Search**: By email, name, role
- **Filter**: By role (trainer, client, admin), status (active, inactive)
- **Sort**: By created date, last login, email
- **User Detail View**: Click user to see full profile + activity
- **Edit User**: Change email, role, active status
- **Activate/Deactivate**: Toggle user active status
- **Role Assignment**: Change user role (trainer ↔ client, admin)

#### System Health Monitoring
- **Database Status**: PostgreSQL connection health
- **Cache Status**: Redis connection health
- **API Status**: Backend API response time
- **Error Logs**: Recent errors and warnings (planned)
- **Performance Metrics**: Request latency, throughput (planned)

### How To: Manage User Accounts

1. Navigate to Admin → Users
2. View user list (paginated)
3. Use search bar to find specific user
4. Click user row to view details
5. View user's:
   - Profile information
   - Role and status
   - Created date and last login
   - Connected clients/trainers
   - Workout history
6. Click "Edit User"
7. Change role, email, or active status
8. Save changes
9. User updated immediately

### How To: Monitor System Health

1. Navigate to Admin → System Health
2. View dashboard cards:
   - Database: Green (connected) or Red (error)
   - Cache: Green (connected) or Red (error)
   - API: Response time (ms)
3. Click "Refresh" to re-check
4. If red: view error details
5. (Planned) View error logs and stack traces

### UI Elements

| Screen | Element | Description |
|--------|---------|-------------|
| **Dashboard** | Stats cards | Large metric cards with numbers + trends |
| **User List** | Sortable table | Columns: Email, Role, Status, Created, Actions |
| **User Detail** | Modal or page | Full user profile + activity timeline |
| **Health Monitor** | Status cards | Green/red cards for each system component |
| **Edit User Modal** | Form | Email, role dropdown, active toggle |

### Data Model

```typescript
// No new models - uses existing User model
User {
  role: 'trainer' | 'client' | 'admin'
  isActive: boolean
  // Admin can modify these fields
}
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/dashboard` | Get dashboard statistics |
| GET | `/api/admin/users` | List all users (admin only) |
| GET | `/api/admin/users/:id` | Get user details (admin only) |
| PUT | `/api/admin/users/:id` | Update user (admin only) |
| GET | `/api/admin/system/health` | Get system health status |

### Known Limitations

- System health monitoring is basic (database + cache checks only)
- Error log viewing UI is planned but not yet implemented
- Performance metrics dashboard is planned but not yet implemented
- Bulk user operations (bulk activate, bulk role change) are not yet implemented

---

## Advanced Features

### AI Workout Builder

**Overview:** Generate personalized workouts from the full 1,344 exercise library based on user preferences.

**How It Works:**
1. User selects preferences:
   - Focus Area: Upper body, lower body, full body, core, cardio
   - Difficulty: Beginner, intermediate, advanced
   - Duration: 15, 30, 45, 60, 90 minutes
   - Equipment Available: Body weight, barbell, dumbbell, cable, bands, etc.
   - Workout Type: Strength, cardio, flexibility, mixed
2. Algorithm filters 1,344 exercises by:
   - Equipment match
   - Difficulty match (relaxes if no matches)
   - Body part match
   - Workout type match
3. Generates balanced workout:
   - Selects 6-10 exercises
   - Assigns sets (3-5 per exercise)
   - Assigns reps ("8-10", "AMRAP", etc.)
   - Assigns rest periods (60-180s)
   - Estimates total duration
4. User can:
   - Regenerate with different preferences
   - Edit generated workout
   - Save as program
   - Assign to clients

**Key Implementation Detail:** Limit set to `2000` in API fetch to load full exercise database (line 51 of `AIWorkoutBuilder.tsx`).

### Profile Completion Widget

**Gamified Onboarding:**
- Calculates completion percentage from required fields
- Sections tracked:
  - Basic Info (name, DOB, gender, phone)
  - Profile Photo (uploaded or not)
  - Health Info (medical conditions, medications, etc.)
  - Goals Set (at least one fitness goal)
  - Measurements (at least one body measurement)
  - Certifications (trainers only - at least one cert)
- Visual progress circle with percentage
- Guided prompts: "Add your profile photo (+15%)"
- Color coding: Red (<50%), yellow (50-80%), green (>80%)

### Streak Calculator

**Training Consistency Tracking:**
- Calculates current streak (consecutive training days)
- Calculates best streak (longest ever consecutive days)
- Logic:
  - Uses workout completion dates
  - Counts consecutive days (gaps break streak)
  - Current streak only valid if latest workout is today or yesterday
  - Best streak = longest sequence ever recorded
- Displayed on dashboard as motivational metric
- Updates automatically after each workout

**Implementation:** `lib/utils/streakCalculator.ts` - pure function, no external dependencies.

### ACWR Training Load Monitoring

**Injury Prevention System:**
- Used by professional sports teams (NFL, NBA, etc.)
- Acute Load: 7-day rolling average of volume
- Chronic Load: 28-day rolling average of volume
- ACWR Ratio = Acute / Chronic
- Interpretation:
  - <0.8: Under-training (deconditioning risk)
  - 0.8-1.3: Sweet spot (optimal)
  - 1.3-1.5: Elevated risk
  - >1.5: High injury risk (immediate action needed)
- Visual gauge chart with color zones
- Weekly calculation via cron job (planned)
- Insights generated when ratio enters risk zones

### Bulk Operations

**Bulk Client Invitation:**
- Enter multiple email addresses (comma or newline separated)
- Same custom message to all
- All invitations sent simultaneously
- Bulk status tracking

**Bulk Program Assignment:**
- Select program
- Select multiple clients (or all clients with specific tag)
- Set start date (same for all or staggered)
- Assign all with one click
- Useful for group programs, bootcamps, challenges

---

## Complete Data Model Reference

### Core Entities (8)

1. **User**: Central user account (email, role, active status)
2. **UserProfile**: Extended profile (bio, photo, timezone, units)
3. **UserHealth**: Medical info (conditions, medications, allergies, injuries)
4. **UserGoal**: Fitness goals with targets and tracking
5. **TrainerCertification**: Professional credentials
6. **TrainerSpecialization**: Areas of expertise
7. **ProgressPhoto**: Transformation photos
8. **ProfileCompletion**: Onboarding progress tracking

### Client Management (6)

9. **TrainerClient**: Trainer-client relationship with status
10. **ClientInvitation**: Email invitations with tokens
11. **ClientProfile**: Client-specific profile data
12. **ClientNote**: Private trainer notes
13. **ClientTag**: Custom tags with colors
14. **ClientTagAssignment**: Tag-to-client many-to-many

### Exercise Library (5)

15. **Exercise**: Core exercise database (1,344 records)
16. **ExerciseFavorite**: User favorites
17. **ExerciseCollection**: Custom collections
18. **CollectionExercise**: Collection-to-exercise many-to-many
19. **ExerciseUsage**: Usage tracking

### Program Builder (8)

20. **Program**: Training program
21. **ProgramWeek**: Weekly structure
22. **ProgramWorkout**: Daily workouts
23. **WorkoutExercise**: Exercise selection
24. **ExerciseConfiguration**: Set/rep/weight details
25. **ProgramAssignment**: Client assignments
26. **ProgramTemplate**: Reusable templates
27. **ExerciseSearchHistory**: Search tracking

### Workout Logging (3)

28. **WorkoutSession**: Main session record
29. **WorkoutExerciseLog**: Exercise-level logs
30. **WorkoutSetLog**: Set-level logs

### Analytics (9)

31. **UserMeasurement**: Body composition
32. **PerformanceMetric**: Performance tracking (8 types)
33. **TrainingLoad**: ACWR calculations
34. **GoalProgress**: Goal checkpoint tracking
35. **UserInsight**: AI-powered insights
36. **MilestoneAchievement**: Achievement tracking
37. **ChartPreference**: Chart customization
38. **ComparisonBaseline**: Before/after comparisons
39. **AnalyticsReport**: Generated reports

### Scheduling (2)

40. **TrainerAvailability**: Weekly availability slots
41. **Appointment**: Bookings with 5 types

### Communication (1)

42. **Activity**: Activity feed entries

### Authentication & Security (9)

43. **EmailVerification**: Email verification tokens
44. **PasswordReset**: Password reset tokens
45. **TwoFactorAuth**: 2FA settings
46. **UserSession**: JWT session management
47. **OAuthAccount**: Social login accounts
48. **SecurityAuditLog**: Audit trail
49. **AccountLockout**: Brute-force protection
50. **ApiToken**: API integration tokens

**Total: 50 data models**

---

## API Endpoints Reference

### Authentication (5)
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password` - Reset password

### Profiles (9)
- GET `/api/profiles/me` - Get profile
- PUT `/api/profiles/me` - Update profile
- GET `/api/profiles/health` - Get health info
- PUT `/api/profiles/health` - Update health info
- POST `/api/profiles/certifications` - Add certification
- GET `/api/profiles/certifications` - List certifications
- PUT `/api/profiles/certifications/:id` - Update certification
- DELETE `/api/profiles/certifications/:id` - Delete certification
- POST `/api/profiles/progress-photos` - Upload photo
- POST `/api/profiles/me/photo` - Upload profile photo

### Clients (3)
- GET `/api/clients` - List clients
- GET `/api/clients/trainer` - Get connections
- PUT `/api/clients/:id/status` - Update status

### Exercises (12)
- GET `/api/exercises` - List exercises
- GET `/api/exercises/:id` - Get exercise
- GET `/api/exercises/by-id/:exerciseId` - Get by external ID
- GET `/api/exercises/search` - Search
- GET `/api/exercises/filters` - Get filters
- POST `/api/exercises/favorites` - Add favorite
- DELETE `/api/exercises/favorites/:id` - Remove favorite
- GET `/api/exercises/collections` - List collections
- POST `/api/exercises/collections` - Create collection
- PUT `/api/exercises/collections/:id` - Update collection
- DELETE `/api/exercises/collections/:id` - Delete collection
- POST `/api/exercises/collections/:id/exercises` - Add to collection

### Programs (7)
- POST `/api/programs` - Create program
- GET `/api/programs` - List programs
- GET `/api/programs/:id` - Get program
- PUT `/api/programs/:id` - Update program
- DELETE `/api/programs/:id` - Delete program
- POST `/api/programs/:id/duplicate` - Duplicate program
- POST `/api/programs/:id/assign` - Assign to client
- GET `/api/programs/templates` - Browse templates

### Workouts (6)
- GET `/api/workouts` - List workouts
- GET `/api/workouts/active` - Get active session
- POST `/api/workouts` - Start session
- GET `/api/workouts/:id` - Get session
- PUT `/api/workouts/:id` - Update session
- POST `/api/workouts/:id/complete` - Complete session
- POST `/api/workouts/:id/sets` - Log sets
- GET `/api/workouts/history` - Get history

### Analytics (14)
- GET `/api/analytics/measurements` - List measurements
- POST `/api/analytics/measurements` - Add measurement
- PUT `/api/analytics/measurements/:id` - Update measurement
- GET `/api/analytics/performance` - List metrics
- POST `/api/analytics/performance` - Add metric
- GET `/api/analytics/personal-bests` - Get PRs
- GET `/api/analytics/training-load` - Get training load
- POST `/api/analytics/training-load/calculate` - Calculate load
- GET `/api/analytics/goals` - List goals
- POST `/api/analytics/goals` - Create goal
- PUT `/api/analytics/goals/:id` - Update goal
- POST `/api/analytics/goals/:id/progress` - Log progress
- GET `/api/analytics/milestones` - List milestones
- POST `/api/analytics/reports` - Generate report

### Scheduling (6)
- GET `/api/schedule/availability` - Get availability
- POST `/api/schedule/availability` - Add slot
- PUT `/api/schedule/availability/:id` - Update slot
- GET `/api/schedule/appointments` - List appointments
- POST `/api/schedule/appointments` - Create appointment
- PUT `/api/schedule/appointments/:id` - Update appointment
- GET `/api/schedule/slots` - Get available slots

### Admin (4)
- GET `/api/admin/dashboard` - Dashboard stats
- GET `/api/admin/users` - List users
- GET `/api/admin/users/:id` - Get user
- PUT `/api/admin/users/:id` - Update user
- GET `/api/admin/system/health` - System health

### Misc (2)
- GET `/api/activities` - Get activity feed
- GET `/api/health` - API health check
- GET `/api/dashboard/stats` - Dashboard statistics

**Total: 68+ API endpoints**

---

## Glossary

**ACWR** - Acute:Chronic Workload Ratio. Metric comparing 7-day training load to 28-day average, used for injury prevention.

**AMRAP** - As Many Reps As Possible. A set type where you perform maximum reps at a given weight.

**Body Part** - One of 10 exercise categories (neck, shoulders, chest, back, upper arms, lower arms, waist, upper legs, lower legs, cardio).

**Cluster Set** - A set type with short rest periods within the set (e.g., 3 reps, 15s rest, 3 reps).

**Deload Week** - A planned reduction in training volume or intensity for recovery.

**Difficulty Level** - Beginner, Intermediate, or Advanced classification for exercises or programs.

**Drop Set** - A set type where weight is reduced mid-set to continue training to failure.

**Equipment Type** - One of 29 categories (body weight, barbell, dumbbell, cable, etc.).

**Fitness Level** - Client's training experience: Beginner, Intermediate, Advanced.

**Goal Type** - One of 8 fitness goals: weight loss, muscle gain, endurance, strength, flexibility, general fitness, sport-specific, rehabilitation.

**IndexedDB** - Browser-based local database for offline data storage.

**JWT** - JSON Web Token. Authentication method using access (15min) and refresh (7d) tokens.

**1RM** - One-Rep Maximum. The maximum weight that can be lifted for one repetition.

**Personal Best (PR)** - Personal record for a specific exercise or metric.

**Progressive Overload** - Gradually increasing training demands (weight, reps, sets, frequency) over time.

**Program Type** - One of 8 categories: strength, hypertrophy, endurance, powerlifting, bodybuilding, general fitness, sport-specific, rehabilitation.

**PWA** - Progressive Web App. Web application installable like a native app without app store.

**RBAC** - Role-Based Access Control. Security model using trainer, client, and admin roles.

**RIR** - Reps in Reserve. How many more reps could be performed (0-5 scale).

**RPE** - Rate of Perceived Exertion. Subjective difficulty rating (1-10 scale).

**Set Type** - One of 7 categories: warmup, working, drop, pyramid, AMRAP, cluster, rest-pause.

**Superset** - Two or more exercises performed back-to-back with minimal rest.

**Target Muscle** - The primary muscle worked by an exercise (one of 26 muscle groups).

**Tempo** - Speed of exercise execution in format "eccentric-pause-concentric-pause" (e.g., "3-1-2-0").

**Training Load** - Total volume (weight × reps) over a time period.

**Workout Type** - One of 6 categories: strength, cardio, HIIT, flexibility, mixed, recovery.

---

**Document Version:** 2.0
**Last Updated:** March 2, 2026
**Production URL:** https://evofittrainer-six.vercel.app
**For questions:** Contact development team via GitHub Issues

---

*This comprehensive documentation covers all 12 feature areas implemented in EvoFit Trainer as of March 2, 2026. All features listed are in production unless explicitly marked as "Coming Soon" or "Planned".*
