# Story 002-07: Session Management

**Parent Epic**: [EPIC-002 - Authentication & Authorization](../epics/epic-002-authentication.md)
**Story ID**: STORY-002-07
**Priority**: P0 (Critical)
**Story Points**: 5
**Sprint**: Sprint 3

## User Story
**As a** user
**I want my** sessions managed securely
**So that my** account stays protected across multiple devices

## Acceptance Criteria
- [ ] JWT token implementation with short expiry (15 minutes)
- [ ] Refresh token rotation on every use
- [ ] Configurable session timeout (default: 15 minutes)
- [ ] Active session list view in account settings
- [ ] Remote session termination (logout from specific device)
- [ ] Device identification and naming
- [ ] Security alerts for new device logins
- [ ] Concurrent session limits (max 5 active sessions)
- [ ] Session cleanup for expired/revoked sessions
- [ ] "Sign out all devices" functionality

## Technical Implementation

### Frontend Tasks
1. **Create SessionManager Service**
   - Auto-refresh access token before expiry
   - Handle token expiry gracefully
   - Store refresh token securely (httpOnly cookie)
   - Handle concurrent session limit errors
   - Logout on token refresh failure

2. **Create ActiveSessionsPage Component**
   - List all active sessions
   - Show device info (name, type, location)
   - Show session age and last activity
   - Indicate current session
   - "Sign out" button for each session
   - "Sign out all devices" button
   - Real-time session updates

3. **Create NewDeviceAlert Component**
   - Show notification on new device login
   - Display device info (location, type)
   - Show timestamp
   - "Wasn't you?" link to security settings
   - Option to revoke the new session

4. **Create TokenRefreshInterceptor**
   - Intercept API calls
   - Check token expiry
   - Refresh token automatically
   - Retry failed requests with new token

### Backend Tasks
1. **Create Session Endpoints**
   ```typescript
   GET /api/auth/sessions
   Requires: Authentication
   Response: {
     success: true,
     data: {
       sessions: Session[]
     }
   }

   DELETE /api/auth/sessions/:sessionId
   Requires: Authentication
   Response: {
     success: true,
     message: 'Session terminated'
   }

   DELETE /api/auth/sessions/all
   Requires: Authentication
   Response: {
     success: true,
     message: 'All sessions terminated'
   }
   ```

2. **Implement Token Refresh with Rotation**
   ```typescript
   class AuthService {
     async refreshAccessToken(refreshToken: string) {
       // Verify refresh token signature
       // Check if token exists in database
       // Check if token expired
       // Check if token revoked
       // Verify user still active
       // Check concurrent session limit
       // Generate new access token
       // Generate new refresh token (rotation)
       // Invalidate old refresh token
       // Update session last_activity
       // Return new tokens
     }
   }
   ```

3. **Implement SessionService**
   ```typescript
   class SessionService {
     // Create session
     async createSession(userId: string, deviceInfo: DeviceInfo, ipAddress: string): Promise<Session> {
       // Check concurrent session limit (max 5)
       // Remove oldest session if limit reached
       // Generate refresh token
       // Hash refresh token
       // Store session in database
       // Log session creation
       // Return session
     }

     // Get all user sessions
     async getUserSessions(userId: string): Promise<Session[]> {
       // Query all active sessions for user
       // Include device info and last activity
       // Order by last activity desc
       // Return sessions
     }

     // Terminate specific session
     async terminateSession(sessionId: string, userId: string): Promise<void> {
       // Verify session belongs to user
       // Delete session
       // Log session termination
     }

     // Terminate all user sessions (except current)
     async terminateAllSessions(userId: string, currentSessionId: string): Promise<void> {
       // Delete all sessions except current
       // Log mass session termination
     }

     // Check for new device login
     async isNewDevice(userId: string, deviceFingerprint: string): Promise<boolean> {
       // Check if device fingerprint exists for user
       // Return true if new device, false if recognized
     }

     // Clean up expired sessions
     async cleanupExpiredSessions(): Promise<void> {
       // Delete sessions where expires_at < NOW()
       // Run periodically (cron job)
     }

     // Enforce concurrent session limit
     async enforceSessionLimit(userId: string): Promise<void> {
       // Count active sessions
       // If > 5, remove oldest sessions
       // Keep only 5 most recent
     }
   }
   ```

4. **Implement Device Fingerprinting**
   ```typescript
   class DeviceService {
     generateFingerprint(userAgent: string, ipAddress: string): string {
       // Parse user agent
       // Extract browser, OS, device type
       // Create device fingerprint hash
       // Return fingerprint
     }

     getDeviceInfo(userAgent: string): DeviceInfo {
       // Parse user agent string
       // Extract browser name and version
       // Extract OS name and version
       // Detect device type (mobile, tablet, desktop)
       // Return structured device info
     }

     generateDeviceName(deviceInfo: DeviceInfo): string {
       // Generate human-readable name
       // Examples: "Chrome on Windows", "Safari on iPhone"
       // Return device name
     }
   }
   ```

5. **Implement Security Alerts**
   ```typescript
   class SecurityAlertService {
     async sendNewDeviceAlert(user: User, session: Session) {
       // Send email notification
       // Include device info
       // Include location (IP-based)
       // Include timestamp
       // Include "Wasn't you?" link
     }

     async sendSessionTerminationAlert(user: User, session: Session) {
       // Send email notification
       // Include device info
       // Include timestamp
       // Alert if suspicious activity detected
     }
   }
   ```

### Data Models
```typescript
interface UserSession {
  id: string;
  userId: string;
  refreshTokenHash: string;
  deviceInfo: {
    name: string;
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
    fingerprint: string;
  };
  ipAddress: string;
  location?: {
    country: string;
    city: string;
  };
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
}

interface DeviceInfo {
  userAgent: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  fingerprint: string;
}

interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: string;
  type: 'access' | 'refresh';
  sessionId: string; // Link refresh token to session
  iat: number;
  exp: number;
  jti: string; // unique token ID
}
```

### Database Schema
```sql
-- User sessions table
user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) UNIQUE NOT NULL,
  device_info JSONB NOT NULL,
  ip_address INET NOT NULL,
  location JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Partial index for active sessions only
CREATE INDEX idx_user_sessions_active
ON user_sessions(user_id, last_activity_at)
WHERE expires_at > NOW();

-- New device fingerprints table
device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  fingerprint VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(),
  is_trusted BOOLEAN DEFAULT false,
  UNIQUE(user_id, fingerprint)
);
```

### Token Management Strategy

**Access Token:**
- Expiry: 15 minutes
- Contains: user ID, email, role, session ID
- Stored: Memory (not persisted)
- Sent: Authorization header

**Refresh Token:**
- Expiry: 7 days
- Contains: user ID, session ID
- Stored: httpOnly cookie (secure)
- Rotated: On every use
- Hashed: Before storage in database

**Token Rotation:**
```typescript
// On refresh token use:
1. Verify old refresh token
2. Generate new access token
3. Generate new refresh token
4. Invalidate old refresh token
5. Store new refresh token hash
6. Return both tokens to client
```

## Test Cases
1. **Happy Path - Session Creation**
   - Login with email/password
   - Verify session created in database
   - Verify refresh token stored securely
   - Verify access token in response
   - Verify session has device info
   - Verify session has IP address

2. **Happy Path - Token Refresh**
   - Wait for access token to near expiry
   - Call refresh endpoint
   - Verify new access token received
   - Verify new refresh token received
   - Verify old refresh token invalidated
   - Verify session last_activity updated

3. **Happy Path - View Active Sessions**
   - Navigate to account settings
   - Click "Active Sessions"
   - Verify list of all sessions displayed
   - Verify current session marked
   - Verify device names shown
   - Verify last activity times shown
   - Verify IP addresses shown

4. **Happy Path - Terminate Remote Session**
   - Login on device A
   - Login on device B
   - On device A, view active sessions
   - Click "Sign out" for device B session
   - Verify session terminated
   - Verify device B logged out

5. **Happy Path - Sign Out All Devices**
   - Login on device A, B, C
   - On device A, click "Sign out all devices"
   - Verify all sessions terminated except current
   - Verify devices B and C logged out
   - Verify current session still active

6. **Edge Cases - Concurrent Session Limit**
   - Login on 6 different devices
   - Verify oldest session terminated automatically
   - Verify only 5 active sessions allowed
   - Verify notification sent to user

7. **Security Tests - New Device Alert**
   - Login from new device
   - Verify email alert sent
   - Verify alert contains device info
   - Verify alert contains location
   - Verify alert contains timestamp
   - Verify "Wasn't you?" link works

8. **Security Tests - Token Rotation**
   - Login and get refresh token
   - Use refresh token to get new tokens
   - Attempt to reuse old refresh token
   - Verify old token rejected (already used)
   - Verify security alert sent

9. **Performance Tests**
   - Token refresh completes within 500ms
   - Session list loads within 1 second
   - Session termination completes within 500ms
   - Database queries optimized

## UI/UX Mockups
```
Active Sessions Page:
+--------------------------------------------------+
|              Active Sessions                     |
|                                                  |
|  You have 3 active sessions                      |
|                                                  |
|  Current Session                                 |
|  +--------------------------------------------+  |
|  | Chrome on Windows                     [✓]  |  |
|  | New York, US • Last active: Now             |  |
|  | IP: 192.168.1.1                             |  |
|  +--------------------------------------------+  |
|                                                  |
|  Other Sessions                                  |
|  +--------------------------------------------+  |
|  | Safari on iPhone                       [×]  |  |
|  | Los Angeles, US • Last active: 5 min ago   |  |
|  | IP: 10.0.0.1                               |  |
|  +--------------------------------------------+  |
|  +--------------------------------------------+  |
|  | Firefox on Mac                          [×]  |  |
|  | London, UK • Last active: 1 hour ago      |  |
|  | IP: 172.16.0.1                             |  |
|  +--------------------------------------------+  |
|                                                  |
|           [Sign Out All Other Devices]           |
+--------------------------------------------------+

New Device Alert:
+--------------------------------------------------+
|  🔔 New Sign In Detected                         |
|                                                  |
|  We noticed a new sign-in to your account:       |
|                                                  |
|  Device: Safari on iPhone                        |
|  Location: Los Angeles, US                       |
|  Time: January 7, 2026 at 3:45 PM               |
|                                                  |
|  If this was you, you can ignore this email.     |
|                                                  |
|  If you didn't sign in, secure your account:     |
|  [Secure Account]                                |
+--------------------------------------------------+
```

## Dependencies
- User login (Story 002-03) complete
- JWT utilities configured
- Device fingerprinting library
- IP geolocation service (optional, for location data)
- Database schema deployed (user_sessions, device_fingerprints)
- Email service configured (for security alerts)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>90% coverage)
- [ ] Integration tests for session endpoints
- [ ] Security tests passing (token rotation, concurrent limit)
- [ ] Manual testing completed across multiple devices
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Documentation updated (API docs, session management guide)
- [ ] Error handling tested
- [ ] Accessibility compliant (WCAG 2.1 AA)

## Notes
- **ALREADY IMPLEMENTED**: This story has been implemented in the current codebase
- Implementation includes:
  - JWT token implementation with 15-minute access token expiry
  - Refresh token rotation on every use
  - Session management with device identification
  - Active session list view in account settings
  - Remote session termination
  - Concurrent session limit (max 5 active)
  - Security alerts for new device logins
  - "Sign out all devices" functionality
  - Automatic cleanup of expired sessions
- Existing files:
  - `backend/src/services/sessionService.ts` - Complete session management logic
  - `backend/src/services/authService.ts` - Token refresh with rotation
  - `backend/src/controllers/sessionController.ts` - Session endpoints
  - `backend/src/middleware/auth.middleware.ts` - JWT verification and refresh
  - `backend/prisma/schema.prisma` - UserSession, DeviceFingerprint models
  - Frontend session manager and active sessions page
- Token configuration:
  - Access token expiry: 15 minutes
  - Refresh token expiry: 7 days
  - Concurrent sessions: Max 5 per user
  - Token rotation: On every refresh
  - Session cleanup: Automated via cron job
- Security features:
  - Refresh tokens hashed at rest (SHA-256)
  - Token rotation prevents replay attacks
  - Device fingerprinting detects suspicious logins
  - IP address tracking for location data
  - Email alerts for new device sign-ins
  - Automatic session termination after limit
- Session management features:
  - View all active sessions
  - Terminate specific sessions
  - Sign out all other devices
  - Device identification (browser, OS, type)
  - Last activity tracking
  - IP-based geolocation
  - Current session indication
