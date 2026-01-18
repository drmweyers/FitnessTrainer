# Story 001-01: Create Initial Profile

**Parent Epic**: [EPIC-001 - User Profiles](../epics/epic-001-user-profiles.md)
**Story ID**: STORY-001-01
**Priority**: P0 (Critical)
**Story Points**: 8
**Sprint**: Sprint 1

## User Story
**As a** new user
**I want to** create my profile after registration
**So that I** can start using the platform effectively

## Acceptance Criteria
- [ ] Guided profile creation flow with step-by-step wizard
- [ ] Required vs. optional fields clearly marked
- [ ] Progress indicator showing completion percentage
- [ ] Skip option for optional sections
- [ ] Save and continue later functionality
- [ ] Different flows for trainers vs. clients
- [ ] Profile completion rewards/badges displayed
- [ ] Mobile-optimized wizard layout
- [ ] Validation on each step before proceeding
- [ ] Welcome message after completion

## Technical Implementation

### Frontend Tasks
1. **Create ProfileWizard Component**
   - Multi-step form with progress indicator
   - Step navigation (next, previous, skip)
   - Save draft functionality
   - Role-based conditional rendering (trainer/client)

2. **Create ProfileSteps Components**
   - BasicInfoStep (name, bio, contact)
   - PhysicalInfoStep (measurements, metrics)
   - PreferencesStep (units, timezone)
   - TrainerSpecificStep (certifications preview)
   - ClientSpecificStep (goals preview)

3. **Create ProfileCompleteness Component**
   - Calculate completion percentage
   - Display progress bar
   - Show remaining required fields
   - Award completion badges

4. **State Management**
   - Form state management with Redux/Zustand
   - Auto-save draft to localStorage
   - Validation state tracking

### Backend Tasks
1. **Create Profile Endpoints**
   ```typescript
   POST /api/profile - Create initial profile
   PUT /api/profile - Update profile partially
   GET /api/profile/draft - Get draft profile
   POST /api/profile/complete - Mark profile as complete
   GET /api/profile/completion - Get completion status
   ```

2. **Implement ProfileService**
   ```typescript
   class ProfileService {
     async createProfile(userId: string, data: CreateProfileDto)
     async updateProfile(userId: string, data: UpdateProfileDto)
     async getDraftProfile(userId: string)
     async completeProfile(userId: string)
     async getCompletionStatus(userId: string)
   }
   ```

3. **Database Schema**
   ```sql
   -- User profiles table
   CREATE TABLE user_profiles (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) UNIQUE,
     bio TEXT,
     date_of_birth DATE,
     gender VARCHAR(20),
     phone VARCHAR(20),
     timezone VARCHAR(50) DEFAULT 'UTC',
     preferred_units VARCHAR(20) DEFAULT 'metric',
     profile_photo_url VARCHAR(500),
     is_public BOOLEAN DEFAULT true,
     completed_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Profile completion tracking
   CREATE TABLE profile_completion (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) UNIQUE,
     basic_info BOOLEAN DEFAULT false,
     profile_photo BOOLEAN DEFAULT false,
     health_info BOOLEAN DEFAULT false,
     goals_set BOOLEAN DEFAULT false,
     measurements BOOLEAN DEFAULT false,
     certifications BOOLEAN DEFAULT false,
     completion_percentage INTEGER DEFAULT 0,
     last_updated TIMESTAMP DEFAULT NOW()
   );
   ```

### Data Models
```typescript
interface CreateProfileDto {
  bio?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone?: string;
  timezone?: string;
  preferredUnits?: 'metric' | 'imperial';
}

interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  dateOfBirth?: Date;
  gender?: string;
  phone?: string;
  timezone: string;
  preferredUnits: 'metric' | 'imperial';
  profilePhotoUrl?: string;
  isPublic: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ProfileCompletion {
  basicInfo: boolean;
  profilePhoto: boolean;
  healthInfo: boolean;
  goalsSet: boolean;
  measurements: boolean;
  certifications: boolean;
  completionPercentage: number;
}
```

## Test Cases
1. **Happy Path - Client**
   - Register new client account
   - Complete basic info step
   - Skip optional photo upload
   - Set fitness goals
   - Complete profile wizard
   - Verify completion badge awarded

2. **Happy Path - Trainer**
   - Register new trainer account
   - Complete basic info step
   - Upload profile photo
   - Add certifications overview
   - Complete profile wizard
   - Verify trainer-specific fields

3. **Save and Continue Later**
   - Start profile creation
   - Complete first step
   - Close browser
   - Return and verify draft restored
   - Complete remaining steps

4. **Validation**
   - Try to proceed with invalid data
   - Verify error messages
   - Test required field enforcement
   - Test phone number format validation

5. **Mobile Responsiveness**
   - Test wizard on mobile device
   - Verify touch targets adequate size
   - Test landscape/portrait orientations
   - Verify keyboard doesn't hide inputs

## UI/UX Mockups
```
+------------------------------------------+
|  Create Your Profile          Step 1 of 4 |
|  ████████░░░░░░░░░░░░░░░░░  50%         |
+------------------------------------------+
|                                          |
|  Let's start with the basics             |
|                                          |
|  First Name *                    [_____] |
|  Last Name *                     [_____] |
|                                          |
|  Bio                                     |
|  Tell us about yourself...               |
|  [___________________________________]   |
|                                          |
|  Date of Birth                   [_____] |
|  Gender                  [Select ▼]       |
|  ○ Male  ○ Female  ○ Other  ○ Skip      |
|                                          |
|  Phone Number                    [_____] |
|  Optional                             +  |
|                                          |
|  [  Previous ]  [  Next  ]  [ Skip ]     |
+------------------------------------------+
```

```
+------------------------------------------+
|  Almost Done!                            |
|  ████████████████████░░░░░░  80%         |
+------------------------------------------+
|                                          |
|  Profile Complete! 🎉                    |
|                                          |
|  You've earned the Early Adopter badge   |
|                                          |
|  [  View Profile  ]  [  Go to Dashboard ]|
+------------------------------------------+
```

## Dependencies
- Authentication system (EPIC-002) must be completed
- User roles and permissions established
- Database tables created
- Image upload service ready (for photo step)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Profile wizard flows tested for both roles
- [ ] Save and continue functionality working
- [ ] Profile completion tracking accurate
- [ ] Unit tests written and passing (>85% coverage)
- [ ] Integration tests for API endpoints
- [ ] Mobile responsive design verified
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Notes
- Implementation Status: Not Started
- Priority depends on EPIC-002 (Authentication) completion
- Consider adding progress tracking to motivate completion
- Ensure data privacy compliance for health information
- Profile photo upload will be covered in STORY-001-03
