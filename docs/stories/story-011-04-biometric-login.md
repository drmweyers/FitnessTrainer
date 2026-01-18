# Story 011-04: Biometric Login

**Parent Epic**: [EPIC-011 - Mobile App Features](../epics/epic-011-mobile-app-features.md)
**Story ID**: STORY-011-04
**Priority**: P1 (High)
**Story Points**: 5
**Sprint**: Sprint 12

## User Story
**As a** user
**I want to** login with biometric authentication
**So that I** can access the app quickly and securely

## Acceptance Criteria
- [ ] Face ID support on iOS devices (WebAuthn)
- [ ] Touch ID/Fingerprint support on capable devices (WebAuthn)
- [ ] Face Unlock support on Android (WebAuthn)
- [ ] Fallback to PIN/password when biometrics unavailable
- [ ] Secure credential storage using WebAuthn
- [ ] Remember device option for quick re-authentication
- [ ] Biometric registration/setup flow
- [ ] Biometric disable option in settings
- [ ] Session timeout with biometric re-authentication
- [ ] Clear error messages for biometric failures

## Technical Implementation

### Frontend Tasks
1. **WebAuthn Service**
   - Implement WebAuthn registration
   - Implement WebAuthn authentication
   - Handle credential storage
   - Manage biometric registration
   - Error handling for unsupported devices

2. **BiometricPrompt Component**
   - Display biometric authentication prompt
   - Handle biometric scan results
   - Show fallback options
   - Display appropriate error messages

3. **BiometricSettings Component**
   - Enable/disable biometric login
   - Register new biometric credential
   - Remove stored credentials
   - Test biometric authentication

4. **Session Management**
   - Store biometric credential securely
   - Implement session timeout
   - Require biometric for sensitive actions
   - Handle credential expiration

### Backend Tasks
1. **WebAuthn Endpoints**
   ```typescript
   POST /api/auth/webauthn/register/start - Start registration
   POST /api/auth/webauthn/register/finish - Complete registration
   POST /api/auth/webauthn/login/start - Start authentication
   POST /api/auth/webauthn/login/finish - Complete authentication
   ```

2. **WebAuthn Service**
   ```typescript
   import { GenerateRegistrationOptions, GenerateAuthenticationOptions } from '@simplewebauthn/server';

   class WebAuthnService {
     async generateRegistrationOptions(userId: string): Promise<RegistrationOptions>
     async verifyRegistration(response: RegistrationResponse): Promise<boolean>
     async generateAuthenticationOptions(userId: string): Promise<AuthenticationOptions>
     async verifyAuthentication(response: AuthenticationResponse): Promise<boolean>
   }
   ```

3. **Credential Storage**
   - Store public keys securely
   - Link credentials to user accounts
   - Track device information
   - Support multiple credentials per user

### Data Models
```typescript
interface WebAuthnCredential {
  id: string;
  userId: string;
  publicKey: string;
  counter: number;
  transports: string[];
  deviceType: 'singleDevice' | 'multiDevice';
  backedUp: boolean;
  name?: string;
  createdAt: Date;
  lastUsedAt: Date;
}

interface RegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: 'public-key';
    alg: number;
  }>;
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    requireResidentKey?: boolean;
    userVerification?: 'required' | 'preferred' | 'discouraged';
  };
  timeout: number;
}

interface AuthenticationOptions {
  challenge: string;
  allowCredentials?: Array<{
    id: string;
    type: 'public-key';
    transports?: string[];
  }>;
  userVerification?: 'required' | 'preferred' | 'discouraged';
  timeout: number;
}
```

### WebAuthn Implementation
```typescript
// Frontend WebAuthn helper
class WebAuthnClient {
  async register(username: string): Promise<boolean> {
    // Get registration options from server
    const options = await fetch('/api/auth/webauthn/register/start', {
      method: 'POST',
      body: JSON.stringify({ username })
    }).then(r => r.json());

    // Convert options to format expected by browser
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: this.base64ToArrayBuffer(options.challenge),
        rp: options.rp,
        user: {
          id: this.base64ToArrayBuffer(options.user.id),
          name: options.user.name,
          displayName: options.user.displayName
        },
        pubKeyCredParams: options.pubKeyCredParams,
        authenticatorSelection: options.authenticatorSelection,
        timeout: options.timeout
      }
    });

    // Send credential to server
    const response = await fetch('/api/auth/webauthn/register/finish', {
      method: 'POST',
      body: JSON.stringify({
        id: this.arrayBufferToBase64(credential.rawId),
        response: {
          clientDataJSON: this.arrayBufferToBase64(credential.response.clientDataJSON),
          attestationObject: this.arrayBufferToBase64(credential.response.attestationObject)
        }
      })
    });

    return response.ok;
  }

  async authenticate(username: string): Promise<boolean> {
    const options = await fetch('/api/auth/webauthn/login/start', {
      method: 'POST',
      body: JSON.stringify({ username })
    }).then(r => r.json());

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: this.base64ToArrayBuffer(options.challenge),
        allowCredentials: options.allowCredentials?.map(cred => ({
          id: this.base64ToArrayBuffer(cred.id),
          type: cred.type,
          transports: cred.transports
        })),
        userVerification: options.userVerification,
        timeout: options.timeout
      }
    });

    const response = await fetch('/api/auth/webauthn/login/finish', {
      method: 'POST',
      body: JSON.stringify({
        id: this.arrayBufferToBase64(credential.rawId),
        response: {
          clientDataJSON: this.arrayBufferToBase64(credential.response.clientDataJSON),
          authenticatorData: this.arrayBufferToBase64(credential.response.authenticatorData),
          signature: this.arrayBufferToBase64(credential.response.signature),
          userHandle: credential.response.userHandle ? this.arrayBufferToBase64(credential.response.userHandle) : null
        }
      })
    });

    return response.ok;
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
```

## Test Cases
1. **Biometric Registration**
   - User registers biometric credential
   - Prompt shows biometric option
   - Successful registration stores credential
   - Error handled if biometric fails
   - Fallback to password available

2. **Biometric Login**
   - User with registered biometric logs in
   - Biometric prompt appears
   - Successful authentication logs user in
   - Failed authentication shows error
   - Fallback options available

3. **Session Re-authentication**
   - Session expires after timeout
   - Biometric prompt for re-authentication
   - Successful re-authentication restores session
   - Failed re-authentication redirects to login

4. **Multiple Devices**
   - User registers biometric on phone
   - Registers biometric on laptop
   - Both credentials work
   - Can manage credentials in settings

5. **Biometric Disable**
   - User disables biometric login
   - Biometric option removed
   - Password login still works
   - Can re-enable biometric later

6. **Unsupported Device**
   - Device without biometric support
   - Graceful fallback to password
   - Clear message about biometric availability
   - Option to enable on supported device

7. **Security Tests**
   - Credential stored securely
   - Cannot extract private key
   - Replay attack prevented
   - Man-in-the-middle attack prevented

## UI/UX Mockups
```
Login Screen with Biometric

+----------------------------------+
|          EvoFit                  |
|                                  |
|      [Logo]                      |
|                                  |
|  Welcome back, John!             |
|                                  |
|  [👁️ Sign in with Face ID]       |
|  [👆 Sign in with Touch ID]      |
|                                  |
|  ────────────  or  ────────────  |
|                                  |
|  Email: [john@example.com___]    |
|  Password: [••••••••________]    |
|                                  |
|  [Sign In]                       |
|                                  |
|  Forgot password?                |
+----------------------------------+
```

```
Biometric Registration Prompt

+----------------------------------+
|  🔐 Setup Biometric Login        |
+----------------------------------+
|  Use your face or fingerprint    |
|  to sign in quickly and securely.|
|                                  |
|  [📷 Scan Face ID]               |
|  [👆 Scan Fingerprint]           |
|                                  |
|  You'll still be able to sign in |
|  with your password if needed.   |
|                                  |
|  [Cancel]  [Set Up]              |
+----------------------------------+
```

```
Biometric Settings

+----------------------------------+
|  ← Back  Security Settings       |
+----------------------------------+
|  Biometric Authentication        |
|  ─────────────────────────────   |
|  Enable biometric login    [ON]  |
|                                  |
|  Registered Methods              |
|  ✓ Face ID (iPhone)              |
|  ✓ Fingerprint (Pixel)           |
|                                  |
|  [+ Add Another Method]          |
|                                  |
|  Security Options                |
|  ─────────────────────────────   |
|  Require biometric for:          |
|  [x] Logging in                  |
|  [x] Viewing progress photos     |
|  [ ] Editing workouts            |
|  [ ] Sending messages            |
|                                  |
|  Session timeout: [1 hour ▼]     |
|                                  |
|  [Remove All Credentials]        |
+----------------------------------+
```

```
Biometric Authentication Prompt

+----------------------------------+
|                                  |
|          [Face ID Icon]          |
|                                  |
|       Look at your iPhone        |
|                                  |
|    to authenticate with EvoFit   |
|                                  |
|                                  |
+----------------------------------+
```

## Dependencies
- WebAuthn browser support
- HTTPS required
- User device with biometric capability
- @simplewebauthn/server package
- @simplewebauthn/browser package

## Definition of Done
- [ ] All acceptance criteria met
- [ ] WebAuthn registration working
- [ ] WebAuthn authentication working
- [ ] Fallback to password functional
- [ ] Settings page complete
- [ ] Session timeout implemented
- [ ] Security audit completed
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for WebAuthn flow
- [ ] Manual testing on real devices
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Browser Compatibility
- Chrome 67+: Full WebAuthn support
- Safari 13+: Full WebAuthn support
- Firefox 60+: Full WebAuthn support
- Edge 18+: Full WebAuthn support
- iOS Safari 13.3+: Full support
- Android Chrome 70+: Full support

## Security Considerations
- HTTPS is mandatory for WebAuthn
- Store only public keys on server
- Private key never leaves device
- Implement proper challenge generation
- Use secure random number generator
- Validate attestation and assertion
- Protect against replay attacks
- Monitor for suspicious activity

## Performance Targets
- Biometric prompt: < 1 second
- Authentication time: < 3 seconds
- Registration time: < 5 seconds
- Fallback to password: Instant

## Accessibility
- Screen reader announcements
- Keyboard navigation support
- Clear error messages
- Alternative authentication methods
- Respect user's accessibility preferences

## Notes
- WebAuthn is the modern standard for web authentication
- Replaces older FIDO U2F and proprietary APIs
- Works on most modern browsers and devices
- Platform authenticators (Face ID, Touch ID) use "platform" attachment
- Security keys use "cross-platform" attachment
- Consider supporting security keys as alternative
- Biometric data never leaves the device
- Provide clear user education about biometric security
- Test on various devices and browsers
