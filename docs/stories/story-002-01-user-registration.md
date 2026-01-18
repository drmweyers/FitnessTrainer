# Story 002-01: User Registration

**Parent Epic**: [EPIC-002 - Authentication & Authorization](../epics/epic-002-authentication.md)
**Story ID**: STORY-002-01
**Priority**: P0 (Critical)
**Story Points**: 5
**Sprint**: Sprint 2

## User Story
**As a** new user
**I want to** register for an account as a trainer or client
**So that I** can access the platform and start managing fitness programs

## Acceptance Criteria
- [ ] Separate registration flows for trainers and clients
- [ ] Email and password required (minimum validation)
- [ ] Password strength indicator with visual feedback
- [ ] Terms of service acceptance required
- [ ] Privacy policy acknowledgment required
- [ ] Email verification sent immediately after registration
- [ ] Clear error messages for invalid inputs
- [ ] Prevention of duplicate email accounts
- [ ] Role selection (trainer/client) mandatory
- [ ] User redirected to email verification page after successful registration

## Technical Implementation

### Frontend Tasks
1. **Create RegistrationPage Component**
   - Implement role selection (trainer/client) with clear visual distinction
   - Build registration form with email, password, confirm password fields
   - Add password strength indicator (weak, medium, strong)
   - Include terms of service checkbox with link
   - Include privacy policy checkbox with link
   - Add real-time validation feedback
   - Implement loading state during registration
   - Handle error states gracefully

2. **Create PasswordStrengthIndicator Component**
   - Visual strength meter (color-coded: red, yellow, green)
   - Requirements checklist:
     - Minimum 8 characters
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number
     - At least one special character
   - Real-time updates as user types

3. **Create RoleSelector Component**
   - Toggle between trainer and client registration
   - Visual cards with icons for each role
   - Brief description of each role's benefits
   - Selected state clearly visible

### Backend Tasks
1. **Create Registration Endpoint**
   ```typescript
   POST /api/auth/register
   Body: {
     email: string,
     password: string,
     role: 'trainer' | 'client',
     agreeToTerms: boolean,
     agreeToPrivacy: boolean
   }
   Response: {
     success: true,
     message: 'Registration successful. Please check your email to verify your account.',
     data: {
       userId: string,
       email: string,
       role: string,
       isVerified: false
     }
   }
   ```

2. **Implement AuthService.register()**
   ```typescript
   class AuthService {
     async register(data: RegisterDto) {
       // Validate email format
       // Check for existing email
       // Validate password strength
       // Hash password using bcrypt (12 rounds)
       // Create user with role
       // Generate email verification token
       // Send verification email
       // Log registration attempt
       // Return user data without sensitive info
     }
   }
   ```

3. **Email Service Integration**
   - Send verification email using MailHog (dev) / SendGrid (prod)
   - Email template with verification link
   - Include user's name and verification instructions
   - Handle email delivery failures

### Data Models
```typescript
interface RegisterDto {
  email: string;
  password: string;
  role: 'trainer' | 'client';
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

interface User {
  id: string;
  email: string;
  passwordHash: string; // bcrypt hash
  role: 'trainer' | 'client' | 'admin';
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

interface EmailVerification {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  verifiedAt: Date | null;
  createdAt: Date;
}
```

### Database Schema
```sql
-- Users table (already exists)
users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('trainer', 'client', 'admin')),
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Email verifications table
email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);
```

## Test Cases
1. **Happy Path - Trainer Registration**
   - Navigate to registration page
   - Select "Trainer" role
   - Enter valid email (trainer@example.com)
   - Enter strong password (FitnessTrainer123!)
   - Confirm password matches
   - Check terms of service checkbox
   - Check privacy policy checkbox
   - Submit registration
   - Verify success message displayed
   - Verify redirected to email verification page
   - Verify user created in database
   - Verify password hash stored (not plain text)
   - Verify email verification email sent

2. **Happy Path - Client Registration**
   - Navigate to registration page
   - Select "Client" role
   - Enter valid email (client@example.com)
   - Enter strong password (ClientFitness456!)
   - Confirm password matches
   - Check terms of service checkbox
   - Check privacy policy checkbox
   - Submit registration
   - Verify success message displayed
   - Verify redirected to email verification page

3. **Edge Cases - Validation**
   - Test with invalid email format
   - Test with weak password (less than 8 characters)
   - Test with passwords that don't match
   - Test with unchecked terms of service
   - Test with unchecked privacy policy
   - Test with existing email (duplicate)
   - Test with SQL injection attempts in email field
   - Test with XSS attempts in input fields

4. **Security Tests**
   - Verify password is hashed using bcrypt (12 rounds)
   - Verify plain text password never logged
   - Verify SQL injection protection
   - Verify XSS protection in error messages
   - Verify rate limiting on registration endpoint (5 attempts per IP per minute)
   - Verify email enumeration protection (same error for existing/non-existing emails)
   - Verify CSRF token required
   - Verify input sanitization

5. **Performance Tests**
   - Registration completes within 2 seconds
   - Password hashing doesn't block response
   - Email sending is asynchronous
   - Database queries are optimized with indexes

## UI/UX Mockups
```
+--------------------------------------------------+
|              Create Your Account                 |
|                                                  |
|  I am a:                                         |
|  +----------------+    +----------------+       |
|  |   [ TRAINER ]   |    |    [ CLIENT ]  |       |
|  |   Train clients |    |   Get trained  |       |
|  +----------------+    +----------------+       |
|                                                  |
|  Email:                                          |
|  [trainer@example.com__________________]         |
|                                                  |
|  Password:                       [Show/Hide]     |
|  [**************************_______]             |
|                                                  |
|  Confirm Password:                               |
|  [**************************_______]             |
|                                                  |
|  Password Strength:          [████████] Strong   |
|  ✓ 8+ characters                                     |
|  ✓ Upper & lowercase                                |
|  ✓ Number & special character                       |
|                                                  |
|  [✓] I agree to the Terms of Service              |
|  [✓] I agree to the Privacy Policy                |
|                                                  |
|           [ Create Account ]                     |
|                                                  |
|  Already have an account? [Log In]               |
+--------------------------------------------------+
```

## Dependencies
- Email service configured (MailHog for dev, SendGrid for prod)
- Database schema deployed (users, email_verifications tables)
- Prisma client generated
- JWT utilities configured
- bcrypt library installed
- Validation libraries installed (zod/joi)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>90% coverage)
- [ ] Integration tests for registration API endpoint
- [ ] Security tests passing (bcrypt, SQL injection, XSS, rate limiting)
- [ ] Manual testing completed for both trainer and client flows
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Performance benchmarks met (<2s registration time)
- [ ] Documentation updated (API docs, component docs)
- [ ] Email templates tested
- [ ] Error handling tested
- [ ] Accessibility compliant (WCAG 2.1 AA)

## Notes
- **ALREADY IMPLEMENTED**: This story has been implemented in the current codebase
- Implementation includes:
  - JWT-based authentication with 15-minute expiry
  - bcrypt password hashing with 12 rounds
  - Email verification token system
  - Role-based user model (trainer/client/admin)
  - Rate limiting on auth endpoints
  - Comprehensive error handling
- Existing files:
  - `backend/src/services/authService.ts` - Core authentication logic
  - `backend/src/controllers/authController.ts` - Request handling
  - `backend/prisma/schema.prisma` - User and EmailVerification models
  - `backend/src/middleware/auth.middleware.ts` - JWT verification
  - Frontend registration components in auth module
- Test accounts available:
  - Trainer: trainer@test.com / Trainer123!
  - Client: client@test.com / Client123!
  - Admin: admin@test.com / Admin123!
