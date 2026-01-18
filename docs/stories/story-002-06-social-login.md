# Story 002-06: Social Login

**Parent Epic**: [EPIC-002 - Authentication & Authorization](../epics/epic-002-authentication.md)
**Story ID**: STORY-002-06
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 3

## User Story
**As a** user
**I want to** login with my social media accounts (Google, Apple)
**So that I** can access the platform quickly without remembering another password

## Acceptance Criteria
- [ ] Google OAuth 2.0 integration
- [ ] Apple Sign In integration
- [ ] One-click authentication flow
- [ ] Account linking for existing users (social email matches existing email)
- [ ] Profile data import (name, email, profile picture)
- [ ] Email conflict handling (social email already exists with password login)
- [ ] Smooth redirect flow after authentication
- [ ] Mobile app support (iOS/Android)
- [ ] Error handling for cancelled social login
- [ ] Role selection on first social login (trainer/client)

## Technical Implementation

### Frontend Tasks
1. **Create SocialLoginButtons Component**
   - Google "Sign in with Google" button
   - Apple "Sign in with Apple" button
   - Proper branding and styling
   - Loading states during OAuth flow
   - Error handling

2. **Implement OAuth Flow**
   - Use `react-oauth/google` for Google OAuth
   - Use `@apple-sign-in/apple-sign-in` for Apple Sign In
   - Handle OAuth callback
   - Exchange authorization code for tokens
   - Send tokens to backend for verification

3. **Create RoleSelectionModal Component**
   - Show on first social login
   - Choose between trainer/client
   - Brief description of each role
   - One-time selection

4. **Create AccountLinkingPrompt Component**
   - Show when social email matches existing account
   - Option to link accounts
   - Require password confirmation for security
   - Clear explanation of what linking means

### Backend Tasks
1. **Create Google OAuth Endpoint**
   ```typescript
   POST /api/auth/oauth/google
   Body: {
     idToken: string, // Google ID token
     role?: 'trainer' | 'client' // Required on first login
   }
   Response: {
     success: true,
     data: {
       user: {
         id: string,
         email: string,
         name: string,
         role: string,
         profilePicture?: string
       },
       accessToken: string,
       refreshToken: string,
       isNewUser: boolean
     }
   }
   ```

2. **Create Apple Sign In Endpoint**
   ```typescript
   POST /api/auth/oauth/apple
   Body: {
     idToken: string, // Apple ID token
     firstName?: string,
     lastName?: string,
     role?: 'trainer' | 'client' // Required on first login
   }
   Response: {
     success: true,
     data: {
       user: {
         id: string,
         email: string,
         name: string,
         role: string
       },
       accessToken: string,
       refreshToken: string,
       isNewUser: boolean
     }
   }
   ```

3. **Implement OAuthService**
   ```typescript
   class OAuthService {
     // Verify Google ID token
     async verifyGoogleToken(idToken: string): Promise<GoogleProfile> {
       // Verify token signature
       // Verify token issuer (accounts.google.com)
       // Verify token audience (our client ID)
       // Verify token expiration
       // Extract user data (email, name, picture)
       // Return profile data
     }

     // Verify Apple ID token
     async verifyAppleToken(idToken: string): Promise<AppleProfile> {
       // Verify token signature
       // Verify token issuer (appleid.apple.com)
       // Verify token audience (our client ID)
       // Verify token expiration
       // Extract user data (email, name)
       // Handle email privacy (Apple may hide email)
       // Return profile data
     }

     // Handle OAuth login/signup
     async handleOAuthLogin(profile: OAuthProfile, provider: string, role?: string) {
       // Check if OAuth account exists
       // If exists:
       //   - Update profile data if changed
       //   - Generate tokens
       //   - Log login event
       //   - Return existing user
       // If not exists:
       //   - Check if email matches existing user
       //   - If email exists:
       //     - Link accounts (optional)
       //     - Generate tokens
       //     - Return existing user
       //   - If email doesn't exist:
       //     - Create new user
       //     - Create OAuth account record
       //     - Send welcome email
       //     - Generate tokens
       //     - Return new user
     }

     // Link OAuth account to existing user
     async linkOAuthAccount(userId: string, profile: OAuthProfile, provider: string) {
       // Verify user password (security)
       // Check if OAuth account already linked
       // Create OAuth account record
       // Log account linking event
       // Send confirmation email
     }
   }
   ```

4. **Implement Google OAuth Verification**
   ```typescript
   import { OAuth2Client } from 'google-auth-library';

   class GoogleOAuth {
     private client: OAuth2Client;

     constructor() {
       this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
     }

     async verifyToken(idToken: string) {
       const ticket = await this.client.verifyIdToken({
         idToken: idToken,
         audience: process.env.GOOGLE_CLIENT_ID
       });
       const payload = ticket.getPayload();
       return {
         googleId: payload.sub,
         email: payload.email,
         name: payload.name,
         picture: payload.picture,
         emailVerified: payload.email_verified
       };
     }
   }
   ```

5. **Implement Apple Sign In Verification**
   ```typescript
   import appleSignin from 'apple-signin-auth';

   class AppleSignIn {
     async verifyToken(idToken: string) {
       try {
         const { sub: appleId, email, firstName, lastName } =
           await appleSignin.verifyIdToken(idToken, {
             clientId: process.env.APPLE_CLIENT_ID
           });

         return {
           appleId,
           email,
           name: `${firstName} ${lastName}`.trim()
         };
       } catch (error) {
         throw new Error('Invalid Apple ID token');
       }
     }
   }
   ```

### Data Models
```typescript
interface OAuthAccount {
  id: string;
  userId: string;
  provider: 'google' | 'apple';
  providerUserId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  profileData: {
    name: string;
    email: string;
    picture?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

interface AppleProfile {
  appleId: string;
  email?: string;
  name: string;
}
```

### Database Schema
```sql
-- OAuth accounts table
oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL, -- 'google' or 'apple'
  provider_user_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  profile_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

-- Indexes
CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts(provider);
CREATE UNIQUE INDEX idx_oauth_accounts_provider_user
ON oauth_accounts(provider, provider_user_id);
```

### Environment Variables
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Apple Sign In
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY_PATH=/path/to/private/key.p8
```

## Test Cases
1. **Happy Path - Google OAuth (New User)**
   - Navigate to login page
   - Click "Sign in with Google"
   - Select Google account
   - Authorize app permissions
   - Verify redirected back to app
   - Select role (trainer/client)
   - Verify account created
   - Verify redirected to dashboard
   - Verify welcome email sent

2. **Happy Path - Apple Sign In (New User)**
   - Navigate to login page
   - Click "Sign in with Apple"
   - Authorize with Face ID / Touch ID
   - Choose email sharing (hide email option)
   - Select role (trainer/client)
   - Verify account created
   - Verify redirected to dashboard

3. **Happy Path - Social Login (Existing User)**
   - Existing user with Google account
   - Click "Sign in with Google"
   - Select Google account
   - Authorize app
   - Verify login successful
   - Verify redirected to dashboard
   - No role selection required

4. **Edge Cases - Account Linking**
   - User with password account (trainer@test.com)
   - Attempt Google login with same email
   - Prompt to link accounts
   - Enter password to confirm
   - Verify accounts linked
   - Verify can login with either method

5. **Edge Cases - Email Conflicts**
   - User with password account (trainer@test.com)
   - Attempt Apple login with same email
   - Choose not to link accounts
   - Verify error message displayed
   - Verify account not created

6. **Security Tests**
   - Verify ID token signature validation
   - Verify token issuer validation
   - Verify token audience validation
   - Verify token expiration check
   - Verify OAuth tokens stored securely
   - Verify OAuth tokens refreshed periodically
   - Verify rate limiting on OAuth endpoints

7. **Error Handling Tests**
   - Test cancelled OAuth flow
   - Test invalid ID token
   - Test expired ID token
   - Test revoked OAuth access
   - Test network errors during OAuth flow
   - Test denied permissions

## UI/UX Mockups
```
Login Page with Social Buttons:
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
|              - OR -                              |
|                                                  |
|  [ Sign in with Google ]                         |
|  [ Sign in with Apple  ]                         |
|                                                  |
|  Don't have an account? [Sign Up]                |
+--------------------------------------------------+

Role Selection (First Social Login):
+--------------------------------------------------+
|        Choose Your Account Type                  |
|                                                  |
|  How will you use FitnessTrainer?                |
|                                                  |
|  +----------------+    +----------------+       |
|  |   [ TRAINER ]   |    |    [ CLIENT ]  |       |
|  |   Train clients |    |   Get trained  |       |
|  +----------------+    +----------------+       |
|                                                  |
|  You can change this later in settings.          |
|                                                  |
|           [Continue]                             |
+--------------------------------------------------+

Account Linking Prompt:
+--------------------------------------------------+
|       Link Your Google Account?                  |
|                                                  |
|  We found an existing account with the same      |
|  email address (trainer@example.com).            |
|                                                  |
|  Link your Google account to sign in quickly     |
|  without a password.                             |
|                                                  |
|  To confirm, please enter your password:         |
|                                                  |
|  Password:                       [Show/Hide]     |
|  [**************************_______]             |
|                                                  |
|  [Link Accounts]  [Not Now]                      |
+--------------------------------------------------+
```

## Dependencies
- User registration and login (Stories 002-01, 002-03) complete
- Google Cloud project with OAuth 2.0 credentials
- Apple Developer account with Sign In enabled
- OAuth client libraries installed
- Database schema deployed (oauth_accounts table)
- Frontend OAuth libraries installed

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>90% coverage)
- [ ] Integration tests for OAuth endpoints
- [ ] Security tests passing (token verification, account linking)
- [ ] Manual testing completed with Google and Apple
- [ ] Tested on iOS and Android devices
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Documentation updated (API docs, OAuth setup guide)
- [ ] Error handling tested
- [ ] Accessibility compliant (WCAG 2.1 AA)

## Notes
- **ALREADY IMPLEMENTED**: This story has been implemented in the current codebase
- Implementation includes:
  - Google OAuth 2.0 integration with proper token verification
  - Apple Sign In integration with JWT verification
  - Account linking for existing users
  - Profile data import (name, email, profile picture)
  - Role selection on first social login
  - Comprehensive error handling
- Existing files:
  - `backend/src/services/oauthService.ts` - OAuth verification and handling
  - `backend/src/controllers/oauthController.ts` - OAuth endpoints
  - `backend/prisma/schema.prisma` - OAuthAccount model
  - Frontend social login components with Google and Apple buttons
- OAuth providers configured:
  - Google: OAuth 2.0 with ID token verification
  - Apple: Sign In with Apple with JWT verification
- Security features:
  - ID token signature verification
  - Token issuer and audience validation
  - Token expiration checking
  - OAuth tokens stored securely (encrypted at rest)
  - Access token refresh mechanism
  - Account linking requires password confirmation
- Account linking flow:
  - Detects email conflict between existing and social account
  - Prompts user to link accounts
  - Requires password verification for security
  - Links accounts after confirmation
