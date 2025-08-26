# Epic 002: User Authentication & Onboarding

## Epic Overview
**Epic ID**: EPIC-002  
**Epic Name**: User Authentication & Onboarding  
**Priority**: P0 (Critical)  
**Estimated Effort**: 4-6 weeks  
**Dependencies**: None (Foundation epic)  

## Business Value
Authentication is the foundation of the platform, enabling secure access for trainers and clients. A smooth onboarding experience is critical for user adoption and sets the tone for the entire user experience. This epic establishes trust and security while making it easy for users to get started.

## Features Included

### User Registration & Login
- Email/password authentication
- Google OAuth integration
- Secure password requirements
- Email verification
- Password reset functionality

### Role-Based Access Control
- Three user roles: Admin, Trainer, Client
- Role-specific dashboards
- Permission-based feature access
- Trainer-client relationships

### Onboarding Flow
- Welcome wizard for new users
- Profile completion steps
- Trainer certification upload
- Client health questionnaire
- Initial goal setting

## User Stories

### Story 1: Email Registration
**As a** new user  
**I want to** register with my email and password  
**So that I** can create an account and start using the platform  

**Acceptance Criteria:**
- Email validation (proper format)
- Password strength requirements (8+ chars, 1 uppercase, 1 number)
- Duplicate email prevention
- Confirmation email sent
- Account created in 'pending' status until verified

### Story 2: Email Login
**As a** registered user  
**I want to** login with my email and password  
**So that I** can access my account  

**Acceptance Criteria:**
- Validate credentials against database
- Show appropriate error messages
- Implement rate limiting (5 attempts per 15 minutes)
- Remember me option (30 days)
- Redirect to role-appropriate dashboard

### Story 3: Google OAuth
**As a** user  
**I want to** sign in with my Google account  
**So that I** can access the platform without creating another password  

**Acceptance Criteria:**
- Google OAuth 2.0 flow implementation
- Auto-create account if new user
- Link to existing account by email
- Handle OAuth errors gracefully
- Store Google ID for future logins

### Story 4: Password Reset
**As a** user  
**I want to** reset my forgotten password  
**So that I** can regain access to my account  

**Acceptance Criteria:**
- Request reset via email
- Secure token generation (expires in 1 hour)
- Email with reset link
- New password validation
- Invalidate token after use

### Story 5: Trainer Onboarding
**As a** new trainer  
**I want to** complete my profile setup  
**So that I** can start training clients professionally  

**Acceptance Criteria:**
- Multi-step wizard
- Personal info collection
- Certification upload
- Specialization selection
- Business info (optional)
- Stripe account connection prompt

### Story 6: Client Onboarding
**As a** new client  
**I want to** provide my health information and goals  
**So that** my trainer can create appropriate programs  

**Acceptance Criteria:**
- Health questionnaire (PAR-Q)
- Goal selection (weight loss, muscle gain, etc.)
- Current fitness level assessment
- Injury/limitation disclosure
- Availability preferences
- Photo upload (optional)

## Technical Requirements

### Frontend Components
- LoginForm component
- RegisterForm component
- GoogleAuthButton component
- PasswordResetFlow components
- OnboardingWizard component
- RoleGuard wrapper component

### Backend Services
- AuthService for authentication logic
- UserService for user management
- EmailService for notifications
- TokenService for JWT handling
- GoogleAuthService for OAuth

### Database Tables
```sql
-- Users table (enhanced)
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role ENUM('admin', 'trainer', 'client') NOT NULL,
  google_id VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- User profiles table
user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20),
  timezone VARCHAR(50),
  avatar_url TEXT
)

-- Trainer profiles table
trainer_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  bio TEXT,
  certifications JSONB,
  specializations TEXT[],
  years_experience INTEGER,
  stripe_account_id VARCHAR(255),
  hourly_rate DECIMAL(10,2)
)
```

### API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/google
- GET /api/auth/google/callback
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/verify-email
- GET /api/auth/me
- PUT /api/users/profile
- POST /api/users/onboarding/complete

### Security Requirements
- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens for session management
- Secure HTTP-only cookies
- CSRF protection
- Rate limiting on auth endpoints
- Input sanitization
- SQL injection prevention

## Definition of Done
- [ ] All user stories completed and tested
- [ ] Unit tests written (>90% coverage for auth)
- [ ] Integration tests for all auth flows
- [ ] Security review completed
- [ ] Email templates created and tested
- [ ] Error handling for all edge cases
- [ ] Mobile responsive design
- [ ] Documentation updated
- [ ] Deployed to staging

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| OAuth implementation complexity | Medium | Use proven libraries (Passport.js) |
| Email deliverability | High | Use established service (SendGrid) |
| Security vulnerabilities | High | Security audit, penetration testing |
| Poor onboarding completion | Medium | A/B test flows, minimize steps |

## Metrics for Success
- Registration completion rate: >80%
- Onboarding completion rate: >70%
- Login success rate: >95%
- Password reset success rate: >90%
- Time to complete onboarding: <5 minutes
- Security incidents: 0

## Dependencies
- Email service must be configured
- SSL certificate required
- Google OAuth app must be created
- Database must be set up

## Out of Scope
- Two-factor authentication (future enhancement)
- Social login beyond Google (Facebook, Apple)
- Enterprise SSO/SAML
- Biometric authentication
