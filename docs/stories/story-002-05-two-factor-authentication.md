# Story 002-05: Two-Factor Authentication

**Parent Epic**: [EPIC-002 - Authentication & Authorization](../epics/epic-002-authentication.md)
**Story ID**: STORY-002-05
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 3

## User Story
**As a** security-conscious user
**I want to** enable two-factor authentication (2FA)
**So that my** account is more secure against unauthorized access

## Acceptance Criteria
- [ ] TOTP-based 2FA (Time-based One-Time Password)
- [ ] QR code generation for app setup (Google Authenticator, Authy, etc.)
- [ ] Backup codes generation (10 codes)
- [ ] SMS fallback option for users without authenticator app
- [ ] "Remember this device" option (30 days)
- [ ] Easy enable/disable process
- [ ] Recovery options if device lost
- [ ] 2FA status indicator in account settings
- [ ] 2FA required for login when enabled
- [ ] Verification during setup to confirm app working

## Technical Implementation

### Frontend Tasks
1. **Create TwoFactorSetupPage Component**
   - Step-by-step setup wizard
   - QR code display
   - Manual secret key entry option
   - Verification code input
   - "Verify and Enable" button
   - Backup codes display after setup
   - Download/print backup codes option
   - "Skip for now" option (can enable later)

2. **Create TwoFactorVerifyPage Component**
   - Display during login if 2FA enabled
   - 6-digit code input (auto-focus)
   - Remember device checkbox
   - "Verify" button
   - "Use backup code" link
   - "Lost your device?" link

3. **Create TwoFactorSettings Component**
   - Enable/Disable 2FA toggle
   - Current 2FA status (enabled/disabled)
   - Setup button if disabled
   - Generate new backup codes button
   - View backup codes (requires password confirmation)
   - Reset 2FA (requires password confirmation)

4. **Create BackupCodesDisplay Component**
   - Display all 10 backup codes
   - "Download" button (text file)
   - "Print" button
   - "I've saved my codes" confirmation
   - Warning about keeping codes safe

### Backend Tasks
1. **Create 2FA Setup Endpoint**
   ```typescript
   POST /api/auth/2fa/setup
   Requires: Authentication
   Body: {
     password: string // Re-authenticate for security
   }
   Response: {
     success: true,
     data: {
       secret: string, // TOTP secret
       qrCode: string, // Base64 encoded QR code image
       backupCodes: string[] // 10 backup codes
     }
   }
   ```

2. **Create 2FA Verify and Enable Endpoint**
   ```typescript
   POST /api/auth/2fa/enable
   Requires: Authentication
   Body: {
     token: string // 6-digit TOTP code
   }
   Response: {
     success: true,
     message: '2FA enabled successfully'
   }
   ```

3. **Create 2FA Disable Endpoint**
   ```typescript
   POST /api/auth/2fa/disable
   Requires: Authentication
   Body: {
     password: string, // Re-authenticate
     token: string // 6-digit TOTP code
   }
   Response: {
     success: true,
     message: '2FA disabled successfully'
   }
   ```

4. **Create Login 2FA Verification Endpoint**
   ```typescript
   POST /api/auth/verify-2fa
   Body: {
     userId: string,
     token: string, // 6-digit TOTP or backup code
     rememberDevice: boolean
   }
   Response: {
     success: true,
     data: {
       accessToken: string,
       refreshToken: string
     }
   }
   ```

5. **Implement TwoFactorService**
   ```typescript
   class TwoFactorService {
     // Generate TOTP secret
     async generateSecret(userId: string): Promise<string> {
       // Generate cryptographically secure secret
       // Store in database (not enabled yet)
       // Return secret for QR code generation
     }

     // Generate QR code
     async generateQRCode(secret: string, email: string): Promise<string> {
       // Use QR code library
       // Format: otpauth://totp/FitnessTrainer:user@email.com?secret=SECRET
       // Return base64 encoded image
     }

     // Generate backup codes
     async generateBackupCodes(userId: string): Promise<string[]> {
       // Generate 10 random codes (8 characters each)
       // Hash codes before storing
       // Return plain codes for user to save
     }

     // Verify TOTP token
     async verifyToken(userId: string, token: string): Promise<boolean> {
       // Get user's 2FA secret
       // Verify TOTP code (allow 1 time step window)
       // Return true if valid, false otherwise
     }

     // Verify backup code
     async verifyBackupCode(userId: string, code: string): Promise<boolean> {
       // Find matching backup code hash
       // Check if already used
       // Mark as used
       // Return true if valid, false otherwise
     }

     // Enable 2FA
     async enableTwoFactor(userId: string, token: string): Promise<void> {
       // Verify token is valid
       // Update user 2FA status to enabled
       // Log 2FA enabled event
     }

     // Disable 2FA
     async disableTwoFactor(userId: string, password: string, token: string): Promise<void> {
       // Verify password
       // Verify token is valid
       // Delete 2FA secret
       // Delete backup codes
       // Log 2FA disabled event
     }
   }
   ```

6. **Implement Device Remember Feature**
   ```typescript
   class DeviceService {
     async rememberDevice(userId: string, deviceFingerprint: string): Promise<void> {
       // Store device fingerprint
       // Set expiration (30 days)
     }

     async isDeviceRemembered(userId: string, deviceFingerprint: string): Promise<boolean> {
       // Check if device exists and not expired
       // Return true if remembered, false otherwise
     }

     async forgetDevice(userId: string, deviceFingerprint: string): Promise<void> {
       // Remove device from remembered list
     }
   }
   ```

### Data Models
```typescript
interface TwoFactorAuth {
  id: string;
  userId: string;
  secret: string; // TOTP secret (encrypted)
  backupCodes: string[]; // Hashed backup codes
  isEnabled: boolean;
  enabledAt: Date | null;
  lastUsedAt: Date | null;
}

interface BackupCodeUsage {
  code: string; // Hashed backup code
  usedAt: Date | null;
}

interface RememberedDevice {
  id: string;
  userId: string;
  deviceFingerprint: string;
  userAgent: string;
  ipAddress: string;
  expiresAt: Date;
  createdAt: Date;
}
```

### Database Schema
```sql
-- Two-factor authentication table
two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  secret VARCHAR(255) NOT NULL, -- Encrypted TOTP secret
  backup_codes TEXT[] NOT NULL, -- Array of hashed backup codes
  is_enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Remembered devices table
remembered_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_fingerprint VARCHAR(255) UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address INET,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_two_factor_auth_user_id ON two_factor_auth(user_id);
CREATE INDEX idx_remembered_devices_user_id ON remembered_devices(user_id);
CREATE INDEX idx_remembered_devices_fingerprint ON remembered_devices(device_fingerprint);
```

### Dependencies
- `speakeasy` or `otplib` - TOTP generation and verification
- `qrcode` or `qr-image` - QR code generation
- `device-detection` - Device fingerprinting

## Test Cases
1. **Happy Path - Enable 2FA with TOTP**
   - Navigate to account settings
   - Click "Enable 2FA"
   - Enter password to confirm
   - See QR code displayed
   - Scan QR code with authenticator app
   - Enter 6-digit code from app
   - Click "Verify and Enable"
   - Verify success message
   - Verify backup codes displayed
   - Download backup codes
   - Confirm codes saved
   - Verify 2FA status shows "Enabled"

2. **Happy Path - Login with 2FA**
   - Navigate to login page
   - Enter email and password
   - Click login
   - Verify redirected to 2FA verification page
   - Enter 6-digit TOTP code
   - Check "Remember this device"
   - Click "Verify"
   - Verify login successful
   - Verify redirected to dashboard
   - Verify device remembered for 30 days

3. **Happy Path - Use Backup Code**
   - Navigate to login page
   - Enter email and password
   - Click login
   - On 2FA page, click "Use backup code"
   - Enter one of the 10 backup codes
   - Click "Verify"
   - Verify login successful
   - Verify backup code marked as used
   - Verify remaining backup codes still valid

4. **Edge Cases - Invalid Token**
   - Test with invalid 6-digit code
   - Test with expired code (TOTP time window passed)
   - Test with code from wrong account
   - Verify error message displayed
   - Verify can retry

5. **Security Tests**
   - Verify TOTP secret is encrypted in database
   - Verify backup codes are hashed
   - Verify backup codes single-use only
   - Verify 2FA verification required during login
   - Verify can't bypass 2FA
   - Verify rate limiting on 2FA verification (10 attempts per minute)
   - Verify device fingerprint is secure
   - Verify remember device expires after 30 days

6. **Device Remember Tests**
   - Login with "Remember this device" checked
   - Close browser and reopen
   - Login again with same credentials
   - Verify 2FA not required (device remembered)
   - Verify expires after 30 days

7. **Disable 2FA Tests**
   - Navigate to account settings
   - Click "Disable 2FA"
   - Enter password to confirm
   - Enter current TOTP code
   - Confirm disable
   - Verify 2FA disabled
   - Verify can login without 2FA

## UI/UX Mockups
```
2FA Setup Page:
+--------------------------------------------------+
|           Two-Factor Authentication Setup        |
|                                                  |
|  Step 1 of 2: Scan QR Code                       |
|                                                  |
|  1. Install an authenticator app:                |
|     • Google Authenticator                       |
|     • Authy                                      |
|     • Microsoft Authenticator                    |
|                                                  |
|  2. Scan this QR code with your app:             |
|                                                  |
|       [███████████████████]                      |
|       [███████████████████]                      |
|       [███████████████████]                      |
|       [███████████████████]                      |
|                                                  |
|  Or enter this code manually:                    |
|  [JBSWY3DPEHPK3PXP__________________] [Copy]     |
|                                                  |
|  3. Enter the 6-digit code from your app:        |
|  [______]                                        |
|                                                  |
|           [Verify and Continue]                  |
+--------------------------------------------------+

2FA Setup - Backup Codes:
+--------------------------------------------------+
|  Step 2 of 2: Save Your Backup Codes             |
|                                                  |
|  These are one-time use backup codes. Save them  |
|  in a safe place. You can use them to access     |
|  your account if you lose your device.           |
|                                                  |
|  [ Download ]  [ Print ]                          |
|                                                  |
|  1. ABC12345                                     |
|  2. DEF67890                                     |
|  3. GHI24680                                     |
|  ...                                             |
|  10. MNO13579                                    |
|                                                  |
|  ✓ I've saved my backup codes safely             |
|                                                  |
|           [Complete Setup]                       |
+--------------------------------------------------+

Login - 2FA Verification:
+--------------------------------------------------+
|           Two-Factor Authentication              |
|                                                  |
|  Enter the 6-digit code from your authenticator  |
|  app to complete login.                          |
|                                                  |
|  Code:                                           |
|  [______]                                        |
|                                                  |
|  [✓] Remember this device for 30 days            |
|                                                  |
|           [Verify]                               |
|                                                  |
|  [Use backup code]  [Lost your device?]          |
+--------------------------------------------------+
```

## Dependencies
- User login (Story 002-03) complete
- QR code library installed (qrcode or qr-image)
- TOTP library installed (speakeasy or otplib)
- Device fingerprinting library
- Database schema deployed (two_factor_auth, remembered_devices)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>90% coverage)
- [ ] Integration tests for 2FA endpoints
- [ ] Security tests passing (token security, backup code hashing)
- [ ] Manual testing completed with multiple authenticator apps
- [ ] QR code tested with multiple scanning apps
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Documentation updated (API docs, 2FA setup guide)
- [ ] Error handling tested
- [ ] Accessibility compliant (WCAG 2.1 AA)

## Notes
- **ALREADY IMPLEMENTED**: This story has been implemented in the current codebase
- Implementation includes:
  - TOTP-based 2FA using speakeasy library
  - QR code generation for easy app setup
  - 10 backup codes with single-use enforcement
  - Device remember feature (30 days)
  - 2FA verification during login
  - Complete 2FA settings page
- Existing files:
  - `backend/src/services/twoFactorService.ts` - Complete 2FA logic
  - `backend/src/controllers/twoFactorController.ts` - 2FA endpoints
  - `backend/src/middleware/twoFactor.middleware.ts` - 2FA verification middleware
  - `backend/prisma/schema.prisma` - TwoFactorAuth, RememberedDevice models
  - Frontend 2FA setup and verification pages
- Supported apps:
  - Google Authenticator
  - Authy
  - Microsoft Authenticator
  - Any TOTP-compatible app
- Security features:
  - TOTP secret encrypted at rest
  - Backup codes individually hashed
  - Rate limiting: 10 attempts per minute
  - Device fingerprinting for remember feature
  - Backup codes single-use only
