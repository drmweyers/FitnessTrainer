# Epic 001: User Profiles

## Epic Overview
**Epic ID**: EPIC-001  
**Epic Name**: User Profiles  
**Priority**: P0 (Critical)  
**Estimated Effort**: 5-6 weeks  
**Dependencies**: None (Foundation Epic)  

## Business Value
User profiles are the foundation of personalization in EvoFit. They enable trainers to provide customized training programs based on client goals, limitations, and progress. Rich profiles also help establish trust and professionalism, allowing trainers to showcase their expertise and clients to track their fitness journey.

## Features Included

### Profile Types
- Trainer profiles with certifications and specializations
- Client profiles with health and fitness information
- Public vs. private profile sections
- Profile completeness tracking
- Profile verification system

### Profile Information
- Personal details (name, photo, bio)
- Physical measurements and metrics
- Health questionnaire responses
- Fitness goals and preferences
- Medical conditions and limitations
- Emergency contact information

### Media Management
- Profile photo upload and management
- Progress photo galleries
- Before/after comparisons
- Certification document uploads
- Photo privacy controls

### Profile Customization
- Custom profile URLs for trainers
- Theme and layout options
- Highlight sections for achievements
- Social media integration
- Professional portfolio features

## User Stories

### Story 1: Create Initial Profile
**As a** new user  
**I want to** create my profile after registration  
**So that I** can start using the platform effectively  

**Acceptance Criteria:**
- Guided profile creation flow
- Required vs. optional fields clearly marked
- Progress indicator showing completion
- Skip option for optional sections
- Save and continue later functionality
- Different flows for trainers vs. clients
- Profile completion rewards/badges

### Story 2: Edit Profile Information
**As a** user  
**I want to** update my profile information  
**So that I** can keep my data current  

**Acceptance Criteria:**
- Edit individual sections
- Auto-save functionality
- Field validation
- Change history tracking
- Undo recent changes
- Mobile-friendly editing
- Bulk edit mode

### Story 3: Upload Profile Photo
**As a** user  
**I want to** upload and manage my profile photo  
**So that I** can personalize my account  

**Acceptance Criteria:**
- Drag-and-drop upload
- Image cropping tool
- Multiple format support (JPG, PNG, WebP)
- Size optimization (max 5MB)
- Thumbnail generation
- Replace existing photo
- Remove photo option

### Story 4: Complete Health Questionnaire
**As a** client  
**I want to** fill out a health questionnaire  
**So that my** trainer can create safe, effective programs  

**Acceptance Criteria:**
- Comprehensive health questions
- Medical conditions checklist
- Current medications field
- Injury history section
- Lifestyle questions
- Save progress functionality
- Update reminders
- Privacy assurance messaging

### Story 5: Set Fitness Goals
**As a** client  
**I want to** define my fitness goals  
**So that my** training can be properly directed  

**Acceptance Criteria:**
- Pre-defined goal categories
- Custom goal input
- Goal priority ranking
- Timeline setting
- Measurable targets
- Goal revision history
- Progress tracking setup

### Story 6: Trainer Certifications
**As a** trainer  
**I want to** showcase my certifications  
**So that** clients trust my expertise  

**Acceptance Criteria:**
- Add multiple certifications
- Upload verification documents
- Certification expiry dates
- Verification badge system
- Specialization tags
- Education history
- Years of experience

### Story 7: Progress Photos
**As a** client  
**I want to** upload progress photos  
**So that I** can track my physical transformation  

**Acceptance Criteria:**
- Private photo gallery
- Date-stamped uploads
- Front/side/back views
- Comparison view
- Share with trainer only
- Bulk upload option
- Delete photos
- Export photo timeline

## Technical Requirements

### Frontend Components
- ProfileWizard component
- ProfileEditor component
- PhotoUploader component
- HealthQuestionnaire component
- GoalsManager component
- CertificationManager component
- ProgressGallery component
- ProfileCompleteness component

### Backend Services
- ProfileService for CRUD operations
- MediaService for photo management
- ValidationService for data integrity
- PrivacyService for access control
- NotificationService for profile updates

### Database Schema
```sql
-- User profiles (extends users table)
user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  bio TEXT,
  date_of_birth DATE,
  gender VARCHAR(20),
  phone VARCHAR(20),
  timezone VARCHAR(50),
  preferred_units ENUM('metric', 'imperial') DEFAULT 'metric',
  profile_photo_url VARCHAR(500),
  cover_photo_url VARCHAR(500),
  is_public BOOLEAN DEFAULT true,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
)

-- Physical measurements
user_measurements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  height DECIMAL(5,2),
  weight DECIMAL(5,2),
  body_fat_percentage DECIMAL(4,2),
  muscle_mass DECIMAL(5,2),
  measurements JSONB, -- chest, waist, hips, etc.
  recorded_at TIMESTAMP DEFAULT NOW()
)

-- Health information
user_health (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  blood_type VARCHAR(10),
  medical_conditions TEXT[],
  medications TEXT[],
  allergies TEXT[],
  injuries JSONB,
  surgeries JSONB,
  family_history JSONB,
  lifestyle JSONB, -- smoking, drinking, sleep, stress
  last_physical_exam DATE,
  emergency_contact JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
)

-- Fitness goals
user_goals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  goal_type ENUM('weight_loss', 'muscle_gain', 'endurance', 'strength', 'flexibility', 'general_fitness', 'sport_specific', 'rehabilitation'),
  specific_goal TEXT,
  target_value DECIMAL(10,2),
  target_date DATE,
  priority INTEGER,
  is_active BOOLEAN DEFAULT true,
  achieved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Trainer certifications
trainer_certifications (
  id UUID PRIMARY KEY,
  trainer_id UUID REFERENCES users(id),
  certification_name VARCHAR(255),
  issuing_organization VARCHAR(255),
  credential_id VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  document_url VARCHAR(500),
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Trainer specializations
trainer_specializations (
  id UUID PRIMARY KEY,
  trainer_id UUID REFERENCES users(id),
  specialization VARCHAR(100),
  years_experience INTEGER,
  description TEXT
)

-- Progress photos
progress_photos (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  photo_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  photo_type ENUM('front', 'side', 'back', 'other'),
  notes TEXT,
  is_private BOOLEAN DEFAULT true,
  taken_at TIMESTAMP,
  uploaded_at TIMESTAMP DEFAULT NOW()
)

-- Profile completion tracking
profile_completion (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  basic_info BOOLEAN DEFAULT false,
  profile_photo BOOLEAN DEFAULT false,
  health_info BOOLEAN DEFAULT false,
  goals_set BOOLEAN DEFAULT false,
  measurements BOOLEAN DEFAULT false,
  certifications BOOLEAN DEFAULT false, -- trainers only
  completion_percentage INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
)
```

### API Endpoints
- GET /api/profile
- PUT /api/profile
- POST /api/profile/photo
- DELETE /api/profile/photo
- GET /api/profile/health
- PUT /api/profile/health
- POST /api/profile/measurements
- GET /api/profile/measurements
- POST /api/profile/goals
- GET /api/profile/goals
- PUT /api/profile/goals/:id
- POST /api/profile/certifications (trainer)
- GET /api/profile/certifications (trainer)
- POST /api/profile/progress-photos
- GET /api/profile/progress-photos
- DELETE /api/profile/progress-photos/:id
- GET /api/profile/completion

### Data Validation
- Email format validation
- Phone number formatting
- Date range validation
- Image file type/size limits
- Required field enforcement
- Cross-field validation
- Profanity filtering for public content

## Definition of Done
- [ ] All user stories completed
- [ ] Unit tests (>85% coverage)
- [ ] Integration tests for critical flows
- [ ] Profile creation flow tested
- [ ] Image upload tested across devices
- [ ] Performance tested with large images
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Deployed to staging

## UI/UX Requirements
- Step-by-step onboarding flow
- Progress indicators
- Inline validation
- Auto-save functionality
- Mobile-optimized forms
- Drag-and-drop interfaces
- Image preview before upload
- Loading states
- Success confirmations

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Large image uploads | High | Client-side compression, size limits |
| Privacy concerns | High | Granular privacy controls, encryption |
| Complex health forms | Medium | Progressive disclosure, save progress |
| Data validation complexity | Medium | Client and server validation |
| Profile completion rates | High | Gamification, progress tracking |

## Metrics for Success
- Profile completion rate: >80% within 7 days
- Average completion time: <10 minutes
- Photo upload success rate: >95%
- Health questionnaire completion: >90%
- Goal setting adoption: >85%
- User satisfaction: >4.5/5
- Zero privacy breaches

## Dependencies
- Image storage service (S3 or similar)
- CDN for image delivery
- Email service for notifications
- Frontend framework setup
- Database initialization

## Out of Scope
- Social media profile import
- Video uploads
- Public profile discovery
- Profile templates
- AI-powered recommendations
- Biometric integrations
- Third-party fitness app sync
