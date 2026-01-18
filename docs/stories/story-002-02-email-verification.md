# Story 002-02: Email Verification

**Parent Epic**: [EPIC-002 - Authentication & Authorization](../epics/epic-002-authentication.md)
**Story ID**: STORY-002-02
**Priority**: P0 (Critical)
**Story Points**: 3
**Sprint**: Sprint 2

## User Story
**As a** newly registered user
**I want to** verify my email address
**So that I** can activate my account and access the platform

## Acceptance Criteria
- [ ] Verification email sent immediately after registration
- [ ] Email contains clear verification instructions
- [ ] One-click verification link in email
- [ ] Verification link expires after 24 hours
- [ ] Resend verification option available
- [ ] Success confirmation page after verification
- [ ] Auto-login after successful verification
- [ ] Handle expired/invalid tokens gracefully
- [ ] Prevent verification if user already verified
- [ ] Redirect to appropriate dashboard based on role

## Technical Implementation

### Frontend Tasks
1. **Create EmailVerificationPage Component**
   - Display email sent confirmation message
   - Show email address for verification
   - Provide "Resend Verification Email" button
   - Implement countdown for resend button (30 seconds)
   - Handle verification token from URL
   - Show loading state during verification
   - Display success/error messages

2. **Create VerificationSuccessPage Component**
   - Congratulations message
   - Auto-redirect countdown (5 seconds) to dashboard
   - Manual "Continue to Dashboard" button
   - Brief onboarding introduction

3. **Create VerificationErrorPage Component**
   - User-friendly error messages
   - "Token Expired" with resend option
   - "Invalid Token" with support contact
   - "Already Verified" with login link

### Backend Tasks
1. **Create Verification Endpoint**
   ```typescript
   POST /api/auth/verify-email
   Body: {
     token: string
   }
   Response: {
     success: true,
     message: 'Email verified successfully',
     data: {
       userId: string,
       email: string,
       role: string,
       token: string // JWT for auto-login
     }
   }
   ```

2. **Create Resend Verification Endpoint**
   ```typescript
   POST /api/auth/resend-verification
   Body: {
     email: string
   }
   Response: {
     success: true,
     message: 'Verification email sent successfully'
   }
   ```

3. **Implement AuthService.verifyEmail()**
   ```typescript
   class AuthService {
     async verifyEmail(token: string) {
       // Find verification record by token
       // Check if token exists
       // Check if token expired
       // Check if already verified
       // Update user.isVerified = true
       // Mark verification.verifiedAt = NOW()
       // Generate JWT token for auto-login
       // Log verification event
       // Send welcome email
       // Return user data with JWT
     }

     async resendVerification(email: string) {
       // Validate email format
       // Find user by email
       // Check if already verified (return error)
       // Generate new verification token
       // Invalidate old tokens
       // Send new verification email
       // Log resend event
       // Rate limit: max 3 resend requests per hour
     }
   }
   ```

4. **Email Templates**
   - Verification email with branding
   - One-click verification button
   - Alternative copy-paste token option
   - Support contact information
   - Welcome email after verification

### Data Models
```typescript
interface EmailVerification {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  verifiedAt: Date | null;
  createdAt: Date;
}

interface VerifyEmailDto {
  token: string;
}

interface ResendVerificationDto {
  email: string;
}
```

### Database Schema
```sql
-- Email verifications table (already exists)
email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for token lookups
CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);

-- Constraint to prevent multiple unverified tokens
CREATE UNIQUE INDEX idx_email_verifications_user_unverified
ON email_verifications(user_id)
WHERE verified_at IS NULL;
```

## Test Cases
1. **Happy Path - Email Verification**
   - Register new user
   - Receive verification email
   - Click verification link
   - Verify redirected to success page
   - Verify auto-login occurs
   - Verify redirected to appropriate dashboard (trainer/client)
   - Verify user.isVerified = true in database
   - Verify JWT token generated and returned

2. **Happy Path - Resend Verification**
   - Register new user
   - Delete verification email (simulate lost email)
   - Navigate to resend verification page
   - Enter email address
   - Click "Resend Verification Email"
   - Verify new verification email received
   - Verify old token invalidated
   - Verify can verify with new token

3. **Edge Cases - Token Handling**
   - Test with expired token (>24 hours old)
   - Test with invalid token format
   - Test with non-existent token
   - Test with already verified user
   - Test with deleted user account
   - Test token reuse attempt
   - Test with malformed token

4. **Security Tests**
   - Verify token is cryptographically secure (random, unique)
   - Verify token expiration enforced
   - Verify rate limiting on resend endpoint (3/hour per email)
   - Verify email enumeration protection
   - Verify SQL injection protection in token handling
   - Verify only user can verify their own email
   - Verify token can't be guessed or brute-forced
   - Verify old tokens invalidated after resend

5. **Email Content Tests**
   - Verify email contains verification link
   - Verify email contains expiration time
   - Verify email has proper branding
   - Verify email has unsubscribe/opt-out info
   - Verify email renders correctly in multiple clients (Gmail, Outlook, Apple Mail)
   - Verify email passes SPF/DKIM validation

6. **Performance Tests**
   - Verification completes within 1 second
   - Email sending doesn't block response
   - Database queries optimized with indexes

## UI/UX Mockups
```
Email Verification Page:
+--------------------------------------------------+
|          Check Your Email                        |
|                                                  |
|  We've sent a verification email to:             |
|  trainer@example.com                             |
|                                                  |
|  Click the link in the email to verify your      |
|  account and start using FitnessTrainer.         |
|                                                  |
|  Didn't receive the email?                       |
|  [Resend Verification Email]                    |
|                                                  |
|  (Check your spam folder if you don't see it)    |
+--------------------------------------------------+

Verification Success Page:
+--------------------------------------------------+
|              Email Verified! ✓                   |
|                                                  |
|  Welcome to FitnessTrainer!                      |
|                                                  |
|  Your email has been verified and your account   |
|  is now active.                                  |
|                                                  |
|  Redirecting to dashboard in 5 seconds...        |
|                                                  |
|           [Continue to Dashboard]               |
+--------------------------------------------------+

Token Expired Page:
+--------------------------------------------------+
|           Verification Link Expired              |
|                                                  |
|  The verification link you clicked has expired.  |
|  Verification links are valid for 24 hours.      |
|                                                  |
|  Please request a new verification link below.   |
|                                                  |
|           [Resend Verification Email]           |
|                                                  |
|  Need help? Contact support@fitnesstrainer.com   |
+--------------------------------------------------+
```

## Dependencies
- User registration (Story 002-01) complete
- Email service configured (MailHog/SendGrid)
- Database schema deployed (email_verifications table)
- JWT utilities configured
- Frontend routing configured
- Email templates created

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>90% coverage)
- [ ] Integration tests for verification endpoints
- [ ] Security tests passing (token security, rate limiting)
- [ ] Email templates tested across multiple email clients
- [ ] Manual testing completed for all scenarios
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Performance benchmarks met (<1s verification time)
- [ ] Documentation updated (API docs, email setup guide)
- [ ] Error handling tested
- [ ] Accessibility compliant (WCAG 2.1 AA)

## Notes
- **ALREADY IMPLEMENTED**: This story has been implemented in the current codebase
- Implementation includes:
  - Secure token generation using crypto.randomBytes()
  - 24-hour token expiration
  - Email verification flow with auto-login
  - Resend verification functionality
  - Comprehensive error handling for expired/invalid tokens
  - Email template system with branding
- Existing files:
  - `backend/src/services/authService.ts` - verifyEmail() and resendVerification() methods
  - `backend/src/controllers/authController.ts` - Verification endpoints
  - `backend/src/services/emailService.ts` - Email sending logic
  - `backend/prisma/schema.prisma` - EmailVerification model
  - Frontend email verification pages
- Test flow working:
  - User registers → verification email sent
  - Click verification link → account verified → auto-login → redirect to dashboard
  - Resend verification available with rate limiting
