# Story 002-04: Password Reset

**Parent Epic**: [EPIC-002 - Authentication & Authorization](../epics/epic-002-authentication.md)
**Story ID**: STORY-002-04
**Priority**: P0 (Critical)
**Story Points**: 5
**Sprint**: Sprint 2

## User Story
**As a** user
**I want to** reset my forgotten password
**So that I** can regain access to my account

## Acceptance Criteria
- [ ] "Forgot password" link available on login page
- [ ] Request password reset via email form
- [ ] Secure token generation (random, unique, time-limited)
- [ ] Password reset email sent with reset link
- [ ] Reset link expires after 1 hour
- [ ] Password reset page with token validation
- [ ] Password strength requirements enforced
- [ ] Confirmation of successful reset
- [ ] Auto-login after password reset
- [ ] All existing sessions invalidated after reset
- [ ] Security notification email sent after reset

## Technical Implementation

### Frontend Tasks
1. **Create ForgotPasswordPage Component**
   - Email input field
   - "Send Reset Link" button with loading state
   - Success message after email sent
   - Link back to login page
   - Clear instructions

2. **Create ResetPasswordPage Component**
   - Extract reset token from URL
   - Validate token on page load
   - Show error for expired/invalid tokens
   - New password input with strength indicator
   - Confirm password input
   - "Reset Password" button with loading state
   - Success message and redirect to dashboard

3. **Create PasswordResetSuccessPage Component**
   - Confirmation message
   - Auto-redirect countdown (5 seconds)
   - Manual "Continue to Dashboard" button
   - Security tips message

### Backend Tasks
1. **Create Forgot Password Endpoint**
   ```typescript
   POST /api/auth/forgot-password
   Body: {
     email: string
   }
   Response: {
     success: true,
     message: 'If an account exists with this email, a password reset link has been sent.'
   }
   ```

2. **Create Reset Password Endpoint**
   ```typescript
   POST /api/auth/reset-password
   Body: {
     token: string,
     newPassword: string
   }
   Response: {
     success: true,
     message: 'Password reset successfully',
     data: {
       user: {
         id: string,
         email: string,
         role: string
       },
       accessToken: string,
       refreshToken: string
     }
   }
   ```

3. **Implement AuthService.forgotPassword()**
   ```typescript
   class AuthService {
     async forgotPassword(email: string) {
       // Find user by email
       // If user doesn't exist, return success (email enumeration protection)
       // Generate secure reset token (crypto.randomBytes())
       // Set token expiration (1 hour)
       // Store token in database
       // Send password reset email
       // Log password reset request
       // Return success (don't reveal if email exists)
     }
   }
   ```

4. **Implement AuthService.resetPassword()**
   ```typescript
   class AuthService {
     async resetPassword(token: string, newPassword: string) {
       // Find reset token in database
       // Verify token exists
       // Verify token not expired
       // Verify token not already used
       // Validate new password strength
       // Hash new password using bcrypt
       // Update user password
       // Invalidate all existing sessions (security)
       // Mark token as used
       // Log password reset event
       // Send password reset confirmation email
       // Generate new JWT tokens for auto-login
       // Return user data with tokens
     }
   }
   ```

5. **Implement Session Invalidation**
   ```typescript
   class SessionService {
     async invalidateAllUserSessions(userId: string) {
       // Delete all sessions for user
       // Clear refresh tokens
       // Log session invalidation
     }
   }
   ```

### Data Models
```typescript
interface PasswordReset {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

interface ForgotPasswordDto {
  email: string;
}

interface ResetPasswordDto {
  token: string;
  newPassword: string;
}
```

### Database Schema
```sql
-- Password resets table
password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);

-- Constraint: prevent multiple active reset tokens
CREATE UNIQUE INDEX idx_password_resets_user_active
ON password_resets(user_id)
WHERE used_at IS NULL;
```

### Email Templates

**Password Reset Email:**
```
Subject: Reset Your FitnessTrainer Password

Hi [User Name],

We received a request to reset your password for your FitnessTrainer account.

Click the link below to reset your password:
[Reset Password Button]

This link will expire in 1 hour for your security.

If you didn't request this password reset, please ignore this email or contact support if you have concerns.

Thanks,
The FitnessTrainer Team
```

**Password Reset Confirmation Email:**
```
Subject: Your Password Has Been Reset

Hi [User Name],

Your password was successfully reset on [Date/Time].

For your security, all previous sessions have been invalidated and you'll need to log in again on all devices.

If you didn't make this change, please contact support immediately.

Thanks,
The FitnessTrainer Team
```

## Test Cases
1. **Happy Path - Password Reset**
   - Navigate to login page
   - Click "Forgot password?" link
   - Enter registered email
   - Click "Send Reset Link"
   - Verify success message displayed
   - Receive password reset email
   - Click reset link in email
   - Enter new strong password
   - Confirm new password
   - Click "Reset Password"
   - Verify password reset successfully
   - Verify auto-login occurs
   - Verify redirected to dashboard
   - Verify all previous sessions invalidated
   - Verify confirmation email sent

2. **Edge Cases - Token Handling**
   - Test with expired token (>1 hour old)
   - test with invalid token format
   - test with non-existent token
   - Test with already used token
   - Test with non-existent email
   - Test password reset twice (old token should be invalid)

3. **Security Tests**
   - Verify reset token is cryptographically secure
   - Verify token expiration enforced (1 hour)
   - Verify all sessions invalidated after reset
   - Verify email enumeration protection (same message for existing/non-existing emails)
   - Verify SQL injection protection
   - Verify rate limiting on forgot password endpoint (5 attempts per IP per hour)
   - Verify password strength requirements enforced
   - Verify new password can't be same as old password (optional)

4. **Password Strength Tests**
   - Test with weak password (should be rejected)
   - Test with password < 8 characters
   - Test with password without uppercase
   - Test with password without number
   - Test with password without special character
   - Test with strong password (should be accepted)

5. **Session Invalidation Tests**
   - Login on device A
   - Login on device B
   - Reset password
   - Verify device A logged out
   - Verify device B logged out
   - Verify new login works

6. **Performance Tests**
   - Password reset completes within 2 seconds
   - Email sending doesn't block response
   - Database queries optimized

## UI/UX Mockups
```
Forgot Password Page:
+--------------------------------------------------+
|           Reset Your Password                    |
|                                                  |
|  Enter your email address and we'll send you     |
|  a link to reset your password.                 |
|                                                  |
|  Email:                                          |
|  [trainer@example.com__________________]         |
|                                                  |
|           [Send Reset Link]                      |
|                                                  |
|  [← Back to Login]                               |
+--------------------------------------------------+

Reset Password Page:
+--------------------------------------------------+
|           Create New Password                    |
|                                                  |
|  New Password:                   [Show/Hide]     |
|  [**************************_______]             |
|                                                  |
|  Confirm Password:                               |
|  [**************************_______]             |
|                                                  |
|  Password Strength:          [████████] Strong   |
|                                                  |
|           [Reset Password]                       |
+--------------------------------------------------+

Reset Success Page:
+--------------------------------------------------+
|         Password Reset Successful! ✓             |
|                                                  |
|  Your password has been reset successfully.      |
|                                                  |
|  For your security, you've been logged out of    |
|  all other devices.                              |
|                                                  |
|  Redirecting to dashboard in 5 seconds...        |
|                                                  |
|           [Continue to Dashboard]               |
+--------------------------------------------------+

Link Expired Page:
+--------------------------------------------------+
|           Reset Link Expired                     |
|                                                  |
|  The password reset link has expired.            |
|  Reset links are valid for 1 hour.               |
|                                                  |
|  Please request a new password reset below.      |
|                                                  |
|  [Request New Reset Link]                        |
+--------------------------------------------------+
```

## Dependencies
- User login (Story 002-03) complete
- Email service configured (MailHog/SendGrid)
- Database schema deployed (password_resets table)
- JWT utilities configured
- bcrypt configured
- Session management implemented
- Password validation utilities

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>90% coverage)
- [ ] Integration tests for password reset endpoints
- [ ] Security tests passing (token security, session invalidation)
- [ ] Email templates tested
- [ ] Manual testing completed for all scenarios
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Performance benchmarks met (<2s reset time)
- [ ] Documentation updated (API docs, password reset guide)
- [ ] Error handling tested
- [ ] Accessibility compliant (WCAG 2.1 AA)

## Notes
- **ALREADY IMPLEMENTED**: This story has been implemented in the current codebase
- Implementation includes:
  - Secure token generation using crypto.randomBytes()
  - 1-hour token expiration
  - Password reset flow with token validation
  - Session invalidation after password reset
  - Security notification emails
  - Email enumeration protection
  - Rate limiting on forgot password endpoint
- Existing files:
  - `backend/src/services/authService.ts` - forgotPassword() and resetPassword() methods
  - `backend/src/controllers/authController.ts` - Password reset endpoints
  - `backend/src/services/emailService.ts` - Password reset email templates
  - `backend/src/services/sessionService.ts` - Session invalidation logic
  - `backend/prisma/schema.prisma` - PasswordReset model
  - Frontend password reset pages
- Test flow working:
  - User clicks "Forgot password" → enters email → receives reset email
  - Clicks reset link → creates new password → password reset successful
  - All previous sessions invalidated
  - Auto-login with new credentials
- Security features:
  - Rate limiting: 5 attempts per IP per hour
  - Token expiry: 1 hour
  - Session invalidation: All devices logged out
  - Email enumeration protection: Same response for existing/non-existing emails
