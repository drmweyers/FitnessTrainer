# Story 002-03: User Login

**Parent Epic**: [EPIC-002 - Authentication & Authorization](../epics/epic-002-authentication.md)
**Story ID**: STORY-002-03
**Priority**: P0 (Critical)
**Story Points**: 5
**Sprint**: Sprint 2

## User Story
**As a** registered and verified user
**I want to** log into my account with email and password
**So that I** can access my dashboard and manage fitness programs

## Acceptance Criteria
- [ ] Email/password login form available
- [ ] "Remember me" checkbox for extended sessions
- [ ] Show/hide password toggle button
- [ ] Clear error messages for invalid credentials
- [ ] Account lockout after 5 failed login attempts
- [ ] "Forgot password" link visible
- [ ] Loading state during authentication
- [ ] Redirect to intended page after login (or default dashboard)
- [ ] JWT token generated and stored securely
- [ ] Refresh token generated for token renewal
- [ ] Last login timestamp updated

## Technical Implementation

### Frontend Tasks
1. **Create LoginPage Component**
   - Email input field with validation
   - Password input field with show/hide toggle
   - "Remember me" checkbox
   - "Forgot password?" link
   - Login button with loading state
   - Error message display
   - Link to registration page for new users
   - Social login buttons (Google, Apple) - placeholder for Story 002-06

2. **Implement Authentication Context/Store**
   - Store JWT token in httpOnly cookie or secure localStorage
   - Store refresh token in httpOnly cookie
   - Manage authentication state
   - Auto-refresh token before expiry
   - Handle logout

3. **Create ProtectedRoute Component**
   - Check authentication status
   - Redirect to login if not authenticated
   - Redirect to intended page after login
   - Handle token expiry gracefully

### Backend Tasks
1. **Create Login Endpoint**
   ```typescript
   POST /api/auth/login
   Body: {
     email: string,
     password: string,
     rememberMe: boolean
   }
   Response: {
     success: true,
     message: 'Login successful',
     data: {
       user: {
         id: string,
         email: string,
         role: string,
         isVerified: boolean
       },
       accessToken: string, // JWT (15 min expiry)
       refreshToken: string // JWT (7 days expiry)
     }
   }
   ```

2. **Implement AuthService.login()**
   ```typescript
   class AuthService {
     async login(credentials: LoginDto) {
       // Validate email format
       // Find user by email
       // Check if user exists
       // Check if account is locked
       // Check if email is verified
       // Compare password using bcrypt
       // Check failed attempts
       // If password incorrect:
       //   - Increment failed attempts
       //   - Lock account if 5 failed attempts
       //   - Log failed login attempt
       //   - Throw error
       // If password correct:
       //   - Reset failed attempts
       //   - Update lastLoginAt
       //   - Generate JWT access token (15 min)
       //   - Generate refresh token (7 days)
       //   - Create session record
       //   - Log successful login
       //   - Return user data with tokens
     }
   }
   ```

3. **Implement Account Lockout Logic**
   ```typescript
   class SecurityService {
     async handleFailedLogin(userId: string) {
       // Increment failed attempts
       // If 5 failed attempts:
       //   - Lock account for 30 minutes
       //   - Send security email
       //   - Log lockout event
     }

     async isAccountLocked(userId: string): boolean {
       // Check if account is locked
       // Return true if locked, false otherwise
     }

     async resetFailedAttempts(userId: string) {
       // Reset failed attempts to 0
       // Unlock account if locked
     }
   }
   ```

4. **Implement Refresh Token Endpoint**
   ```typescript
   POST /api/auth/refresh
   Body: {
     refreshToken: string
   }
   Response: {
     success: true,
     data: {
       accessToken: string, // New JWT
       refreshToken: string // Rotated refresh token
     }
   }
   ```

### Data Models
```typescript
interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: 'trainer' | 'client' | 'admin';
    isVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

interface UserSession {
  id: string;
  userId: string;
  tokenHash: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    browser: string;
  };
  ipAddress: string;
  expiresAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
}

interface AccountLockout {
  id: string;
  userId: string;
  lockedUntil: Date | null;
  failedAttempts: number;
  lastAttemptAt: Date;
  unlockedAt: Date | null;
}
```

### Database Schema
```sql
-- Users table (already exists)
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP
);

-- User sessions table
user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  device_info JSONB,
  ip_address INET,
  expires_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Account lockouts table
account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  locked_until TIMESTAMP,
  failed_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  unlocked_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_account_lockouts_user_id ON account_lockouts(user_id);
```

### JWT Token Structure
```typescript
// Access Token (15 minutes)
interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: string;
  type: 'access';
  iat: number;
  exp: number;
  jti: string; // unique token ID
}

// Refresh Token (7 days)
interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  iat: number;
  exp: number;
  jti: string;
}
```

## Test Cases
1. **Happy Path - Successful Login**
   - Navigate to login page
   - Enter valid email (trainer@example.com)
   - Enter valid password (Trainer123!)
   - Click "Remember me" checkbox
   - Click login button
   - Verify loading state shown
   - Verify redirected to trainer dashboard
   - Verify JWT tokens received and stored
   - Verify session created in database
   - Verify lastLoginAt updated
   - Verify can access protected routes

2. **Happy Path - Login with "Remember Me"**
   - Login with "Remember me" checked
   - Close browser
   - Open browser and navigate to app
   - Verify still logged in
   - Verify refresh token works

3. **Edge Cases - Invalid Credentials**
   - Test with non-existent email
   - Test with incorrect password
   - Test with unverified email
   - Test with inactive account
   - Test with locked account
   - Test with empty fields

4. **Security Tests - Account Lockout**
   - Attempt login with wrong password 5 times
   - Verify account locked after 5th attempt
   - Verify lockout message displayed
   - Attempt login during lockout (should fail)
   - Wait for lockout to expire (or manually unlock)
   - Verify login works after lockout expires

5. **Security Tests - Token Security**
   - Verify JWT signed with strong secret
   - Verify access token expires in 15 minutes
   - Verify refresh token expires in 7 days
   - Verify tokens stored securely (httpOnly cookie)
   - Verify token includes JTI for revocation
   - Verify token can't be tampered with

6. **Security Tests - Session Management**
   - Verify multiple sessions allowed
   - Verify refresh token rotation on use
   - Verify old refresh tokens invalidated
   - Verify session cleanup on logout
   - Verify device info captured

7. **Performance Tests**
   - Login completes within 2 seconds
   - Password verification with bcrypt doesn't block
   - JWT generation is fast
   - Database queries optimized

## UI/UX Mockups
```
Login Page:
+--------------------------------------------------+
|              Welcome Back                        |
|                                                  |
|  Email:                                          |
|  [trainer@example.com__________________]         |
|                                                  |
|  Password:                    [Forgot Password?] |
|  [**********************] [👁️ Show/Hide]         |
|                                                  |
|  [✓] Remember me                                 |
|                                                  |
|           [ Log In ]                             |
|                                                  |
|  Or continue with:                               |
|  [ Google ]  [ Apple ]                           |
|                                                  |
|  Don't have an account? [Sign Up]                |
+--------------------------------------------------+

Account Locked Message:
+--------------------------------------------------+
|           Account Temporarily Locked             |
|                                                  |
|  Too many failed login attempts. Your account    |
|  has been locked for 30 minutes for security.    |
|                                                  |
|  Please try again later or reset your password.  |
|                                                  |
|           [Reset Password]                       |
|                                                  |
|  Need help? Contact support@fitnesstrainer.com   |
+--------------------------------------------------+

Unverified Email Message:
+--------------------------------------------------+
|          Email Not Verified                      |
|                                                  |
|  Please verify your email before logging in.     |
|                                                  |
|  A verification email was sent to:               |
|  trainer@example.com                             |
|                                                  |
|  [Resend Verification Email]                    |
+--------------------------------------------------+
```

## Dependencies
- User registration (Story 002-01) complete
- Email verification (Story 002-02) complete
- Database schema deployed (users, user_sessions, account_lockouts)
- JWT utilities configured
- bcrypt configured
- Frontend routing configured

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>90% coverage)
- [ ] Integration tests for login endpoint
- [ ] Security tests passing (bcrypt, JWT, account lockout)
- [ ] Manual testing completed for all scenarios
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Performance benchmarks met (<2s login time)
- [ ] Documentation updated (API docs, authentication guide)
- [ ] Error handling tested
- [ ] Accessibility compliant (WCAG 2.1 AA)

## Notes
- **ALREADY IMPLEMENTED**: This story has been implemented in the current codebase
- Implementation includes:
  - JWT-based authentication with 15-minute access tokens
  - Refresh token system with 7-day expiry and rotation
  - bcrypt password verification (12 rounds)
  - Account lockout after 5 failed attempts (30-minute lockout)
  - Session management with device tracking
  - "Remember me" functionality
  - Protected route middleware
  - Token refresh middleware
- Existing files:
  - `backend/src/services/authService.ts` - login() and refreshAccessToken() methods
  - `backend/src/controllers/authController.ts` - Login and refresh endpoints
  - `backend/src/middleware/auth.middleware.ts` - JWT verification and protected routes
  - `backend/src/middleware/refreshToken.middleware.ts` - Token refresh logic
  - `backend/prisma/schema.prisma` - User, UserSession, AccountLockout models
  - Frontend login page and auth context
- Test accounts working:
  - Trainer: trainer@test.com / Trainer123!
  - Client: client@test.com / Client123!
  - Admin: admin@test.com / Admin123!
- JWT configuration:
  - Access token expiry: 15 minutes
  - Refresh token expiry: 7 days
  - Token includes: sub (userId), email, role, type, iat, exp, jti
