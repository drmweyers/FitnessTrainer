# EvoFit Technical Architecture Document

## Executive Summary

EvoFit is a multi-tenant fitness training web application that enables personal trainers to create and manage workout programs for their clients. The system leverages the proven architecture of the existing FitnessMealPlanner application, ensuring we reuse a familiar tech stack and patterns. This document outlines the comprehensive system design, including the technology stack, major components, data flow, and implementation details for key features including AI-driven program generation, role-based access control, and cloud-based file storage.

## System Overview

### Architecture Principles
- **Multi-Tenant SaaS**: Single database with tenant isolation via application logic
- **Stateless API**: JWT-based authentication for horizontal scalability
- **Microservices-Ready**: Modular design allowing future service decomposition
- **Cloud-Native**: Containerized deployment with managed services
- **Type-Safe**: Full TypeScript stack with compile-time safety
- **Reusability**: Maximum code reuse from FitnessMealPlanner codebase

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Client    │     │  Mobile Client  │     │  External APIs  │
│  (React SPA)    │     │    (Future)     │     │ (OpenAI, Stripe)│
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                         │
         └───────────┬───────────┘                         │
                     │ HTTPS                               │
                     ▼                                     │
         ┌───────────────────────┐                         │
         │   Express API Server   │◄───────────────────────┘
         │  (Node.js/TypeScript)  │
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   PostgreSQL    │     │     AWS S3      │
│    Database     │     │  File Storage   │
└─────────────────┘     └─────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 13+ with TypeScript (App Router)
- **Build Tool**: Next.js built-in webpack configuration
- **Styling**: Tailwind CSS with custom component library
- **State Management**: 
  - Jotai for global state management (atoms)
  - React hooks for local state
  - Custom hooks for business logic
- **Routing**: Next.js App Router (file-based)
- **HTTP Client**: Native fetch with custom API wrapper
- **Icons**: Lucide React for consistent iconography
- **Testing**: Jest + React Testing Library

### Backend
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js with TypeScript
- **ORM**: Drizzle ORM for type-safe database access
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Zod for schema validation
- **API Documentation**: OpenAPI/Swagger (optional)
- **Testing**: Jest for unit/integration tests

### Database
- **Primary**: PostgreSQL 14+ (managed instance)
- **Caching**: Redis (future enhancement)
- **Migrations**: Drizzle Kit for schema management

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **Cloud Platform**: DigitalOcean App Platform
- **CDN**: DigitalOcean Spaces CDN for static assets
- **Monitoring**: DigitalOcean monitoring + Sentry (optional)

### External Services
- **File Storage**: AWS S3 for media assets
- **AI Provider**: OpenAI API (GPT-4/GPT-3.5)
- **Payment Processing**: Stripe
- **Authentication**: Google OAuth 2.0
- **Email**: SendGrid or similar (future)

### Data Assets
- **Exercise Database**: 
  - 1324 exercises with complete metadata
  - Animated GIF demonstrations for each exercise
  - JSON-based data structure for easy querying
  - Local storage for fast access and offline capability

## Component Architecture

### Frontend Architecture

#### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   │   └── badges/         # Badge management endpoints
│   ├── badges/             # Badge management pages
│   ├── clients/            # Client management pages
│   │   ├── components/     # Client-specific components
│   │   └── api/            # Client API utilities
│   ├── dashboard/          # Main dashboard
│   ├── exercises/          # Exercise library
│   ├── levels/             # Gamification levels
│   ├── check-ins/          # Client check-ins
│   ├── programs/           # Program calendar view
│   ├── analytics/          # Progress analytics
│   ├── workouts/           # Workout builder
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── providers.tsx       # Context providers
├── components/
│   ├── features/           # Feature-specific components
│   │   ├── Badges/         # Badge system components
│   │   ├── Calendar/       # Calendar grid for programs
│   │   ├── ClientDashboard/# Client profile components
│   │   ├── ExerciseLibrary/# Exercise browsing
│   │   ├── Levels/         # Level management
│   │   ├── CheckIns/       # Check-in forms
│   │   ├── Analytics/      # Progress charts
│   │   └── WorkoutBuilder/ # Workout composition
│   ├── layout/             # Layout components
│   │   ├── Header.tsx      # App header
│   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   ├── Layout.tsx      # Main layout wrapper
│   │   └── Footer.tsx      # App footer
│   ├── shared/             # Reusable UI components
│   │   ├── Button.tsx      # Button component
│   │   ├── Input.tsx       # Form inputs
│   │   ├── Card.tsx        # Card container
│   │   └── ...             # Other shared components
│   └── ui/                 # Base UI components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
├── state/                  # State management
│   ├── atoms.ts            # Jotai atoms
│   └── mockData.ts         # Mock data for development
├── types/                  # TypeScript definitions
│   ├── badge.ts
│   ├── exercise.ts
│   ├── checkin.ts
│   └── workout.ts
├── data/                   # Static data
│   └── mockCheckins.ts
└── exerciseDB/             # Exercise database assets
    ├── exercises.json      # 1324 exercise definitions
    ├── bodyParts.json      # 10 body part categories
    ├── equipments.json     # 28 equipment types
    ├── muscles.json        # 150+ muscle groups
    └── gifs/               # 1324 animated exercise GIFs
```

#### Key Frontend Components

1. **Authentication Flow**
   - JWT storage in httpOnly cookies (preferred) or memory
   - Auth context provider for user state
   - Protected route wrapper components
   - OAuth integration components

2. **Data Fetching Layer**
   - React Query for caching and synchronization
   - Custom hooks for each API resource
   - Optimistic updates for better UX
   - Automatic refetching and error handling

3. **UI Component Library**
   - Custom component library with Tailwind CSS
   - Form components with built-in validation
   - Responsive layouts with mobile-first design
   - Consistent card-based layouts
   - Reusable input components (TextInput, NumberInput, Textarea, DropdownSelect)

4. **AI Integration UI**
   - AI Workout Builder for quick program creation
   - AI-powered exercise recommendations
   - Natural language processing for requirements
   - Progress indicators during generation
   - Editable preview of generated content
   - Error handling for API failures

5. **Key UI Features**
   - **Sidebar Navigation**: Hierarchical menu with icon-based items
   - **Exercise Filters**: Advanced filtering by muscle group, equipment, difficulty
   - **Analytics Dashboard**: Performance metrics and progress charts
   - **Client Dashboard**: Comprehensive view with profile, goals, metrics, history
   - **Workout Builder**: Two-panel interface with drag-and-drop
   - **Calendar View**: 14-day program scheduling grid
   - **Badge & Level System**: Gamification with visual progress tracking

### Backend Architecture

#### Project Structure
```
server/
├── src/
│   ├── config/             # Configuration management
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic layer
│   │   ├── auth/           # Authentication services
│   │   ├── program/        # Workout program logic
│   │   ├── analytics/      # Progress analytics
│   │   ├── ai/             # OpenAI integration
│   │   ├── payment/        # Stripe integration
│   │   └── storage/        # S3 file operations
│   ├── models/             # Drizzle schema definitions
│   ├── routes/             # API route definitions
│   ├── utils/              # Helper functions
│   ├── types/              # TypeScript interfaces
│   └── app.ts              # Express app setup
├── migrations/             # Database migrations
├── tests/                  # Test suites
└── package.json
```

#### API Design

##### RESTful Endpoints

**Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Email/password login
- `GET /api/auth/google` - Google OAuth initiation
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - Session termination

**User Management**
- `GET /api/users/profile` - Get current user
- `PUT /api/users/profile` - Update profile
- `GET /api/users/:id` - Get user by ID (admin/trainer)
- `POST /api/users/invite` - Trainer invites client

**Program Management**
- `GET /api/programs` - List programs (filtered by role)
- `POST /api/programs` - Create new program
- `GET /api/programs/:id` - Get program details
- `PUT /api/programs/:id` - Update program
- `DELETE /api/programs/:id` - Delete program
- `POST /api/programs/generate` - AI generation

**Client Management**
- `GET /api/clients` - Trainer's client list
- `POST /api/clients` - Add new client
- `GET /api/clients/:id` - Client details
- `PUT /api/clients/:id` - Update client info

**Progress Tracking**
- `GET /api/progress` - Get progress logs
- `POST /api/progress` - Log workout completion
- `GET /api/progress/metrics` - Analytics data

**File Management**
- `POST /api/upload` - File upload to S3
- `DELETE /api/files/:key` - Remove file

**Payment**
- `POST /api/payment/checkout` - Create Stripe session
- `POST /api/payment/webhook` - Stripe webhook handler
- `GET /api/payment/subscription` - Current subscription

**Client Check-ins & Accountability**
- `GET /api/check-ins` - List check-ins
- `POST /api/check-ins` - Submit check-in
- `GET /api/check-ins/:id` - Get check-in details
- `PUT /api/check-ins/:id` - Update check-in
- `POST /api/check-ins/reminders` - Set check-in reminders
- `GET /api/accountability/streaks` - Get habit streaks
- `POST /api/accountability/habits` - Log habit completion
- `GET /api/accountability/compliance` - Get compliance metrics

#### Service Layer Architecture

1. **AuthService**
   - JWT token generation and validation
   - Password hashing with bcrypt
   - OAuth flow handling
   - Session management

2. **ProgramService**
   - CRUD operations for workout programs
   - Multi-tenant data isolation
   - Program template management
   - Exercise library integration

3. **AIService**
   - OpenAI API integration
   - Prompt engineering for workouts
   - Response parsing and formatting
   - Usage tracking and limits

4. **PaymentService**
   - Stripe customer management
   - Subscription lifecycle handling
   - Webhook processing
   - Invoice generation

5. **StorageService**
   - S3 file upload/download
   - Presigned URL generation
   - File type validation
   - Storage quota management

6. **NutritionService**
   - Recipe database management
   - Meal plan CRUD operations
   - Nutrition tracking and analytics
   - Macro calculation helpers

7. **AnalyticsService**
   - Progress tracking and reporting
   - Performance metrics calculation
   - Achievement detection
   - Data visualization preparation

## Database Design

### TypeScript Type Definitions

```typescript
// Check-in type definition
export interface CheckIn {
  id: string
  clientId: string
  date: string
  weight?: number
  measurements?: {
    chest?: number
    waist?: number
    hips?: number
    arms?: number
    thighs?: number
  }
  energyLevel?: number // 1-5
  sleepQuality?: number // 1-5
  mood?: number // 1-5
  workoutCompliance?: number // percentage
  photos?: string[]
  notes?: string
  trainerFeedback?: string
  createdAt: string
  updatedAt: string
}

// Exercise type definition (simplified UI model)
export interface Exercise {
  id: string
  name: string
  thumbnail: string
  hasVideo: boolean
  muscleGroup: string
  equipment: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

// Complete Exercise Database Model
export interface ExerciseDBEntry {
  exerciseId: string       // Unique identifier matching GIF filename
  name: string            // Exercise name
  gifUrl: string          // Reference to animated GIF file
  targetMuscles: string[] // Primary muscles targeted
  bodyParts: string[]     // Body parts involved
  equipments: string[]    // Required equipment
  secondaryMuscles: string[] // Supporting muscles
  instructions: string[]  // Step-by-step instructions
}

// Exercise Database Categories
export interface ExerciseCategories {
  bodyParts: Array<{ name: string }> // 10 categories
  equipments: Array<{ name: string }> // 28 types
  muscles: Array<{ name: string }> // 150+ muscle groups
}

// Workout type definitions
export interface WorkoutExercise {
  id: string
  name: string
  sets: number
  reps: number
  weight?: string
  duration?: number // in seconds
  restTime?: number // in seconds
}

export interface Workout {
  id: string
  title: string
  type: 'strength' | 'cardio' | 'flexibility' | 'rest' | 'hiit'
  duration: number // in minutes
  exercises: WorkoutExercise[]
  completed: boolean
  synced: boolean
}

export interface DayPlan {
  date: Date
  workouts: Workout[]
  isActive: boolean
}

// Badge and Level types
export interface Badge {
  id: string
  name: string
  description: string
  imageUrl: string
  criteria: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Level {
  id: string
  name: string
  description: string
  numChallenges: number
  thumbnailUrl: string
  thumbnailType?: number
  thumbnailAttachmentId?: string
  thumbnailAttachmentName?: string
  createdAt?: Date
  updatedAt?: Date
}

// Client type definition
export interface Client {
  id: string
  name: string
  age: number
  email: string
  phone: string
  joinDate: string
  profileImage: string
  progressPhotos: Array<{
    id: string
    date: string
    url: string
  }>
  goals?: Array<{
    id: string
    text: string
    completed: boolean
  }>
  metrics?: {
    weight: Array<{ date: string, value: number }>
    bodyFat: Array<{ date: string, value: number }>
    muscleMass: Array<{ date: string, value: number }>
  }
  workouts?: Array<{
    id: string
    date: string
    name: string
    completed: boolean
    exercises: number
    completedExercises: number
    duration: number
  }>
  notes?: Array<{
    id: string
    date: string
    text: string
  }>
  limitations?: Array<{
    id: string
    text: string
  }>
  upcomingWorkouts?: Array<{
    id: string
    date: string
    name: string
    scheduled: boolean
  }>
}

// API Response types
export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  pageCount: number
}

export interface ApiResponse<T> {
  data: T
  meta?: PaginationMeta
  error?: string
}
```

### Schema Overview

```sql
-- Core user table with role-based access
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role ENUM('admin', 'trainer', 'client') NOT NULL,
    trainer_id UUID REFERENCES users(id),
    google_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    profile_image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Workout programs created by trainers
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES users(id),
    client_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_weeks INTEGER,
    goal VARCHAR(100),
    pdf_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_trainer_id (trainer_id),
    INDEX idx_client_id (client_id)
);

-- Exercise library (populated from exerciseDB)
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id VARCHAR(50) UNIQUE NOT NULL, -- Maps to exerciseDB
    name VARCHAR(255) NOT NULL,
    gif_url VARCHAR(255) NOT NULL,
    target_muscles TEXT[] NOT NULL,
    body_parts TEXT[] NOT NULL,
    equipments TEXT[] NOT NULL,
    secondary_muscles TEXT[],
    instructions TEXT[] NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_body_parts (body_parts),
    INDEX idx_equipments (equipments),
    INDEX idx_target_muscles (target_muscles)
);

-- Program exercises with details
CREATE TABLE program_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id),
    day_index INTEGER NOT NULL,
    order_index INTEGER NOT NULL,
    sets INTEGER,
    reps VARCHAR(50),
    weight VARCHAR(50),
    rest_seconds INTEGER,
    notes TEXT,
    INDEX idx_program_day (program_id, day_index)
);

-- Client progress tracking
CREATE TABLE progress_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id),
    program_id UUID REFERENCES programs(id),
    exercise_id UUID REFERENCES exercises(id),
    logged_at TIMESTAMP DEFAULT NOW(),
    sets_completed INTEGER,
    reps_completed INTEGER[],
    weight_used DECIMAL[],
    rpe INTEGER,
    notes TEXT,
    INDEX idx_client_date (client_id, logged_at)
);

-- Subscription management
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan_id VARCHAR(100),
    status VARCHAR(50),
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Client check-ins
CREATE TABLE check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id),
    trainer_id UUID REFERENCES users(id),
    check_in_date DATE NOT NULL,
    weight DECIMAL(5,2),
    body_fat_percentage DECIMAL(4,2),
    measurements JSONB, -- {chest, waist, hips, arms, thighs}
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    workout_compliance_percentage INTEGER,
    habit_compliance JSONB, -- {water: true, sleep: false, etc}
    photos JSONB, -- array of photo URLs
    client_notes TEXT,
    trainer_feedback TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_client_date (client_id, check_in_date),
    INDEX idx_trainer_id (trainer_id)
);

-- Habit tracking
CREATE TABLE habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id),
    habit_type VARCHAR(50) NOT NULL, -- water, sleep, steps, custom
    target_value DECIMAL(10,2),
    actual_value DECIMAL(10,2),
    unit VARCHAR(20),
    logged_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_client_habit_date (client_id, habit_type, logged_date)
);

-- Achievement badges
CREATE TABLE client_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id),
    achievement_type VARCHAR(100) NOT NULL,
    achievement_value JSONB,
    achieved_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_client_achievements (client_id, achievement_type)
);
    INDEX idx_user_id (user_id),
    INDEX idx_recipe_id (recipe_id),
    UNIQUE(user_id, recipe_id)
);

-- Recipe collections
CREATE TABLE recipe_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_id (user_id),
    INDEX idx_public (is_public)
);

-- Nutrition tracking
CREATE TABLE nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id),
    logged_date DATE NOT NULL,
    meal_type VARCHAR(50),
    calories INTEGER,
    protein_grams DECIMAL(5,2),
    carbs_grams DECIMAL(5,2),
    fat_grams DECIMAL(5,2),
    food_items JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_client_date (client_id, logged_date)
);
```

### Multi-Tenancy Strategy

1. **Application-Level Isolation**
   - All queries include tenant context (trainer_id)
   - Service layer enforces access control
   - No cross-tenant data leakage possible

2. **Data Access Patterns**
   ```typescript
   // Example: Get programs for a trainer
   const programs = await db
     .select()
     .from(programs)
     .where(eq(programs.trainerId, currentUser.id));
   
   // Example: Verify client belongs to trainer
   const client = await db
     .select()
     .from(users)
     .where(
       and(
         eq(users.id, clientId),
         eq(users.trainerId, currentUser.id)
       )
     );
   ```

3. **Role-Based Queries**
   - Admin: Unrestricted access
   - Trainer: Access to own data + assigned clients
   - Client: Access to own data only

## Security Architecture

### Authentication & Authorization

1. **JWT Implementation**
   - Access tokens (15min expiry)
   - Refresh tokens (7 days)
   - Secure httpOnly cookies
   - CSRF protection

2. **Password Security**
   - Bcrypt with cost factor 12
   - Password strength requirements
   - Rate limiting on auth endpoints

3. **OAuth Integration**
   - Google OAuth 2.0 flow
   - Account linking by email
   - Secure state parameter

### API Security

1. **Request Validation**
   - Zod schemas for all inputs
   - SQL injection prevention via ORM
   - XSS protection headers

2. **Rate Limiting**
   - Express-rate-limit middleware
   - Different limits per endpoint
   - IP-based and user-based

3. **CORS Configuration**
   - Whitelist allowed origins
   - Credentials support for cookies

### Data Protection

1. **Encryption**
   - TLS 1.3 for all communications
   - Encrypted database connections
   - Sensitive data encryption at rest

2. **PII Handling**
   - GDPR compliance measures
   - Data minimization
   - Right to deletion support

## Exercise Database Implementation

### Database Structure
The exercise database consists of 1324 exercises stored as JSON files with corresponding animated GIF files. This provides a rich, comprehensive exercise library that can be used offline.

#### Data Organization
```
exerciseDB/
├── exercises.json      # Main exercise data (1324 entries)
├── bodyParts.json      # 10 body part categories
├── equipments.json     # 28 equipment types  
├── muscles.json        # 150+ muscle groups
└── gifs/              # 1324 animated GIF files
    ├── 2gPfomN.gif
    ├── Hy9D21L.gif
    └── ... (1324 total)
```

#### Exercise Data Model
```json
{
  "exerciseId": "2gPfomN",
  "name": "3/4 sit-up",
  "gifUrl": "2gPfomN.gif",
  "targetMuscles": ["abs"],
  "bodyParts": ["waist"],
  "equipments": ["body weight"],
  "secondaryMuscles": ["hip flexors", "lower back"],
  "instructions": [
    "Step:1 Lie flat on your back...",
    "Step:2 Place your hands...",
    "Step:3 Engaging your abs...",
    "Step:4 Pause for a moment...",
    "Step:5 Repeat for the desired..."
  ]
}
```

### Implementation Strategy

#### 1. Data Loading
- **Initial Load**: Import JSON data into PostgreSQL on first deployment
- **GIF Storage**: Store GIFs in CDN or local static folder
- **Caching**: Use Redis for frequently accessed exercises
- **Search Index**: Create full-text search indexes on exercise names and muscles

#### 2. Search & Filter Implementation
```typescript
class ExerciseService {
  async searchExercises(query: SearchQuery): Promise<Exercise[]> {
    const filters = [];
    
    if (query.bodyPart) {
      filters.push(sql`body_parts @> ${[query.bodyPart]}`);
    }
    
    if (query.equipment) {
      filters.push(sql`equipments @> ${[query.equipment]}`);
    }
    
    if (query.targetMuscle) {
      filters.push(sql`target_muscles @> ${[query.targetMuscle]}`);
    }
    
    if (query.searchTerm) {
      filters.push(sql`name ILIKE ${`%${query.searchTerm}%`}`);
    }
    
    return db.select().from(exercises)
      .where(and(...filters))
      .limit(query.limit || 50)
      .offset(query.offset || 0);
  }
}
```

#### 3. Performance Optimization
- **Lazy Loading**: Load GIFs only when visible in viewport
- **Thumbnail Generation**: Create static thumbnails from GIFs
- **Progressive Enhancement**: Show static image first, then load GIF
- **Offline Support**: Cache exercises in IndexedDB for offline access

#### 4. API Endpoints
- `GET /api/exercises` - List exercises with pagination
- `GET /api/exercises/search` - Advanced search with filters
- `GET /api/exercises/:id` - Get single exercise details
- `GET /api/exercises/categories` - Get all categories
- `GET /api/exercises/equipment` - Get all equipment types
- `GET /api/exercises/muscles` - Get all muscle groups

## Integration Architecture

### OpenAI Integration

```typescript
interface AIWorkoutRequest {
  clientProfile: {
    fitnessLevel: string;
    goals: string[];
    equipment: string[];
    restrictions: string[];
  };
  programDuration: number;
  programType: string;
}

class AIService {
  async generateWorkoutPlan(request: AIWorkoutRequest): Promise<Program> {
    const prompt = this.buildPrompt(request);
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    return this.parseAIResponse(completion.data);
  }
}

interface AIProgressInsightRequest {
  clientProfile: {
    goals: string[];
    currentMetrics: any;
    historicalData: any[];
  };
  timeframe: string;
  focusAreas: string[];
}

class ProgressAIService {
  async generateInsights(request: AIProgressInsightRequest): Promise<ProgressInsights> {
    const prompt = this.buildInsightPrompt(request);
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: PROGRESS_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    return this.parseInsightResponse(completion.data);
  }
  
  async predictProgress(clientData: ClientData): Promise<ProgressPrediction> {
    const trends = this.analyzeTrends(clientData);
    return this.generatePredictions(trends);
  }
}
```

### Stripe Integration

```typescript
class PaymentService {
  async createCheckoutSession(userId: string, planId: string) {
    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      line_items: [{
        price: planId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${BASE_URL}/payment/success`,
      cancel_url: `${BASE_URL}/payment/cancel`
    });
    
    return session;
  }
  
  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.activateSubscription(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.deactivateSubscription(event.data.object);
        break;
    }
  }
}
```

### AWS S3 Integration

```typescript
class StorageService {
  async uploadFile(file: Express.Multer.File, path: string) {
    const key = `${path}/${uuid()}-${file.originalname}`;
    
    await s3.upload({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private'
    }).promise();
    
    return this.getSignedUrl(key);
  }
  
  getSignedUrl(key: string, expires = 3600) {
    return s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Expires: expires
    });
  }
}
```

### Workout Video Flow Architecture

The workout video flow system enables trainers to create seamless workout videos with synchronized timers that can be played in-app, cast to TVs, or exported to YouTube.

#### Video Processing Pipeline

```typescript
interface VideoFlowConfig {
  exercises: Array<{
    exerciseId: string;
    duration: number; // seconds
    reps?: number;
    restAfter: number; // seconds
  }>;
  intro?: {
    videoUrl?: string;
    duration: number;
    text?: string;
  };
  outro?: {
    videoUrl?: string;
    duration: number;
    text?: string;
  };
  branding: {
    watermark?: string;
    backgroundColor: string;
    timerStyle: 'digital' | 'circular' | 'minimal';
  };
  audio: {
    backgroundMusic?: string;
    volumeLevel: number;
    voiceCues: boolean;
  };
}

class VideoFlowService {
  async generateWorkoutVideo(config: VideoFlowConfig): Promise<VideoOutput> {
    // 1. Validate all exercise videos exist
    const exercises = await this.validateExercises(config.exercises);
    
    // 2. Create video timeline
    const timeline = this.createTimeline(config, exercises);
    
    // 3. Generate video segments with timers
    const segments = await this.generateSegments(timeline);
    
    // 4. Concatenate videos using FFmpeg
    const outputPath = await this.concatenateVideos(segments);
    
    // 5. Add audio track and finalize
    return this.finalizeVideo(outputPath, config.audio);
  }

  private async generateSegments(timeline: Timeline): Promise<VideoSegment[]> {
    return Promise.all(timeline.items.map(async (item) => {
      if (item.type === 'exercise') {
        return this.createExerciseSegment(item);
      } else if (item.type === 'rest') {
        return this.createRestSegment(item);
      } else {
        return this.createBrandingSegment(item);
      }
    }));
  }

  private async createExerciseSegment(exercise: TimelineExercise): Promise<VideoSegment> {
    // Overlay timer on exercise video
    const command = ffmpeg(exercise.videoPath)
      .complexFilter([
        // Add timer overlay
        `drawtext=fontfile=/fonts/digital.ttf:text='%{eif\\:${exercise.duration}-t\\:d}':x=(w-tw)/2:y=50:fontsize=72:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2`,
        // Add exercise name
        `drawtext=text='${exercise.name}':x=(w-tw)/2:y=150:fontsize=36:fontcolor=white`
      ])
      .duration(exercise.duration);
      
    return command;
  }
}
```

#### Casting Architecture

```typescript
class CastingService {
  private castSession: any;
  private remotePlayer: any;
  
  async initializeCasting() {
    // Initialize Google Cast
    if (window.chrome && window.chrome.cast) {
      const castContext = cast.framework.CastContext.getInstance();
      castContext.setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
      });
    }
    
    // Initialize AirPlay for iOS
    if (window.WebKitPlaybackTargetAvailabilityEvent) {
      this.setupAirPlay();
    }
  }
  
  async castWorkoutVideo(videoUrl: string, metadata: WorkoutMetadata) {
    const mediaInfo = new chrome.cast.media.MediaInfo(videoUrl, 'video/mp4');
    mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
    mediaInfo.metadata.title = metadata.title;
    mediaInfo.metadata.subtitle = metadata.trainer;
    mediaInfo.metadata.images = [{ url: metadata.thumbnail }];
    
    const request = new chrome.cast.media.LoadRequest(mediaInfo);
    await this.castSession.loadMedia(request);
  }
  
  private setupAirPlay() {
    const video = document.querySelector('video');
    if (video && video.webkitShowPlaybackTargetPicker) {
      // Enable AirPlay button
      video.addEventListener('webkitplaybacktargetavailabilitychanged', (event) => {
        if (event.availability === 'available') {
          this.showAirPlayButton();
        }
      });
    }
  }
}
```

#### YouTube Export Integration

```typescript
class YouTubeExportService {
  private youtube: any;
  
  async exportToYouTube(videoPath: string, metadata: YouTubeMetadata) {
    // 1. Authenticate with YouTube API
    await this.authenticate();
    
    // 2. Create video resource
    const videoResource = {
      snippet: {
        title: metadata.title,
        description: this.generateDescription(metadata),
        tags: metadata.tags,
        categoryId: '17', // Sports category
        defaultLanguage: 'en',
        defaultAudioLanguage: 'en'
      },
      status: {
        privacyStatus: metadata.privacy || 'unlisted',
        selfDeclaredMadeForKids: false
      }
    };
    
    // 3. Upload video
    const response = await this.youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: videoResource,
      media: {
        body: fs.createReadStream(videoPath)
      }
    });
    
    // 4. Add chapter markers
    if (metadata.chapters) {
      await this.addChapters(response.data.id, metadata.chapters);
    }
    
    return response.data;
  }
  
  private generateDescription(metadata: YouTubeMetadata): string {
    let description = metadata.description + '\n\n';
    
    // Add timestamps for exercises
    description += 'Workout Timeline:\n';
    metadata.chapters.forEach((chapter) => {
      description += `${chapter.timestamp} - ${chapter.title}\n`;
    });
    
    // Add trainer info and links
    description += `\n\nTrainer: ${metadata.trainer}\n`;
    description += `Website: ${metadata.website}\n`;
    
    return description;
  }
}
```

#### Timer System Implementation

```typescript
class WorkoutTimerSystem {
  private timers: Map<string, Timer> = new Map();
  
  createTimer(config: TimerConfig): Timer {
    switch (config.type) {
      case 'countdown':
        return new CountdownTimer(config);
      case 'interval':
        return new IntervalTimer(config);
      case 'amrap':
        return new AMRAPTimer(config);
      case 'emom':
        return new EMOMTimer(config);
      case 'tabata':
        return new TabataTimer(config);
      default:
        return new StandardTimer(config);
    }
  }
}

class CountdownTimer implements Timer {
  private duration: number;
  private onTick: (remaining: number) => void;
  private onComplete: () => void;
  
  start() {
    let remaining = this.duration;
    const interval = setInterval(() => {
      remaining--;
      this.onTick(remaining);
      
      // Audio cues
      if (remaining <= 3 && remaining > 0) {
        this.playBeep();
      }
      
      if (remaining === 0) {
        clearInterval(interval);
        this.onComplete();
        this.playCompleteSound();
      }
    }, 1000);
  }
}
```

#### Video Storage and CDN Strategy

```typescript
class VideoStorageService {
  async storeGeneratedVideo(videoBuffer: Buffer, metadata: VideoMetadata) {
    // 1. Upload to S3
    const s3Key = `workouts/${metadata.trainerId}/${metadata.workoutId}/video.mp4`;
    await s3.upload({
      Bucket: process.env.VIDEO_BUCKET,
      Key: s3Key,
      Body: videoBuffer,
      ContentType: 'video/mp4',
      Metadata: {
        'workout-id': metadata.workoutId,
        'trainer-id': metadata.trainerId,
        'duration': metadata.duration.toString(),
        'exercises': JSON.stringify(metadata.exercises)
      }
    }).promise();
    
    // 2. Create CloudFront distribution for streaming
    const distribution = await this.createDistribution(s3Key);
    
    // 3. Generate HLS variants for adaptive streaming
    await this.generateHLSVariants(s3Key);
    
    // 4. Create thumbnail
    const thumbnailUrl = await this.generateThumbnail(videoBuffer);
    
    return {
      videoUrl: distribution.url,
      hlsUrl: `${distribution.url}/playlist.m3u8`,
      thumbnailUrl,
      s3Key
    };
  }
  
  private async generateHLSVariants(s3Key: string) {
    // Generate multiple quality variants for adaptive streaming
    const variants = [
      { resolution: '1920x1080', bitrate: '5000k', name: '1080p' },
      { resolution: '1280x720', bitrate: '2500k', name: '720p' },
      { resolution: '854x480', bitrate: '1000k', name: '480p' }
    ];
    
    for (const variant of variants) {
      await this.createHLSVariant(s3Key, variant);
    }
  }
}
```

## Deployment Architecture

### Container Strategy

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### DigitalOcean Deployment

1. **App Platform Configuration**
   - Frontend: Static site or container
   - Backend: Container service
   - Database: Managed PostgreSQL
   - Environment: Production variables

2. **Scaling Strategy**
   - Horizontal scaling for backend
   - CDN for static assets
   - Database read replicas (future)

3. **CI/CD Pipeline**
   - GitHub Actions for testing
   - Automatic deployment on merge
   - Blue-green deployments

## Performance Optimization

### Frontend Optimization
- Code splitting with React.lazy
- Image optimization and lazy loading
- Service worker for offline support
- React Query cache management

### Backend Optimization
- Database query optimization
- Connection pooling
- Response compression
- Caching strategy with Redis

### Infrastructure Optimization
- CDN for static assets
- Geographic distribution
- Auto-scaling policies
- Performance monitoring

## Development Workflow

### Local Development Setup

```bash
# Clone repository
git clone [repo-url]

# Backend setup
cd server
cp .env.example .env
npm install
npm run db:migrate
npm run dev

# Frontend setup
cd ../client
npm install
npm run dev

# Docker Compose (alternative)
docker-compose up
```

### Code Quality Standards

1. **TypeScript Configuration**
   - Strict mode enabled
   - No implicit any
   - Consistent formatting with Prettier

2. **Testing Requirements**
   - Unit tests for services
   - Integration tests for APIs
   - E2E tests for critical flows

3. **Code Review Process**
   - PR required for main branch
   - Automated CI checks
   - Security scanning

## Monitoring & Observability

### Application Monitoring
- Sentry for error tracking
- Custom metrics dashboard
- Performance monitoring
- User analytics

### Infrastructure Monitoring
- DigitalOcean metrics
- Database performance
- API response times
- Resource utilization

### Logging Strategy
- Structured JSON logging
- Log aggregation service
- Error alerting
- Audit trails

## Disaster Recovery

### Backup Strategy
- Daily database backups
- 30-day retention policy
- Point-in-time recovery
- Cross-region replication

### Recovery Procedures
- RTO: 4 hours
- RPO: 1 hour
- Automated failover
- Disaster recovery testing

## Future Enhancements

### Technical Roadmap
1. **Mobile Applications**: React Native apps
2. **Real-time Features**: WebSocket integration
3. **Advanced Analytics**: ML-powered insights
4. **Video Streaming**: Exercise demonstration videos
5. **Microservices**: Service decomposition
6. **GraphQL API**: Alternative to REST

### Scalability Considerations
- Message queue for async processing
- Caching layer with Redis
- CDN expansion
- Database sharding

## Conclusion

The EvoFit architecture provides a robust, scalable foundation built on proven patterns from FitnessMealPlanner. By leveraging existing code and infrastructure patterns, we minimize risk while accelerating development. The multi-tenant design with role-based access control ensures secure data isolation, while the integration of AI and payment services positions EvoFit as a modern, feature-rich platform for fitness professionals.

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-24  
**Status**: Final  
**Owner**: Engineering Team  
**Reviewers**: CTO, Lead Developer, Security Team
