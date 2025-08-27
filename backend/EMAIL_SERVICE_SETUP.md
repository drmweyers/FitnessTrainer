# Email Service Setup Guide

## Overview

The EvoFit email service is now fully configured and integrated with client invitation functionality. This guide explains how to set up and use the email service for sending client invitations and other transactional emails.

## Features

### ✅ Completed Email Functionality

1. **Client Invitation Emails**
   - Professional HTML email template with EvoFit branding
   - Trainer name personalization
   - Secure invitation links with tokens
   - Fallback plain text version
   - 7-day expiration notice

2. **Existing Email Types**
   - Email verification
   - Password reset
   - Welcome emails (role-specific for trainers/clients)
   - Security notifications

3. **Production-Ready Features**
   - Comprehensive error handling
   - SMTP configuration flexibility
   - Environment-based configuration
   - Logging integration
   - Connection verification

## Configuration

### Environment Variables

Update your `.env` file with the following email settings:

```bash
# Email Configuration
EMAIL_FROM="noreply@evofit.app"
SMTP_FROM_EMAIL="noreply@evofit.app"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_SECURE=false

# Frontend URL for email links
FRONTEND_URL="http://localhost:3000"
```

### SMTP Provider Examples

#### Gmail Setup
1. Enable 2FA on your Google account
2. Generate an App Password
3. Use these settings:
   ```bash
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-16-character-app-password"
   SMTP_SECURE=false
   ```

#### SendGrid Setup
```bash
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
SMTP_SECURE=false
```

#### AWS SES Setup
```bash
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT=587
SMTP_USER="your-ses-smtp-username"
SMTP_PASS="your-ses-smtp-password"
SMTP_SECURE=false
```

### Development Setup

For development, you can use MailCatcher to test emails locally:

1. Install MailCatcher:
   ```bash
   gem install mailcatcher
   ```

2. Start MailCatcher:
   ```bash
   mailcatcher
   ```

3. Use these development settings:
   ```bash
   SMTP_HOST="localhost"
   SMTP_PORT=1025
   SMTP_USER=""
   SMTP_PASS=""
   SMTP_SECURE=false
   ```

4. View emails at: http://localhost:1080

## Usage

### Client Invitation Integration

The email service is automatically integrated with the ClientService. When trainers invite clients:

```typescript
// In ClientService
await clientService.inviteClient({
  trainerId: 'trainer-id',
  clientEmail: 'client@example.com',
  customMessage: 'Welcome to my training program!'
});

// Email is automatically sent with:
// - Trainer's name
// - Professional invitation template
// - Secure invitation link
// - EvoFit branding
```

### Manual Email Sending

You can also send emails directly:

```typescript
import { emailService } from '../services/emailService';

// Send client invitation
await emailService.sendClientInvitation(
  'client@example.com',
  'John Smith', // trainer name
  'trainer@example.com',
  'invitation-token-123'
);

// Send custom email
await emailService.sendEmail(
  'recipient@example.com',
  'Subject Line',
  '<h1>HTML Content</h1>',
  'Plain text content'
);
```

## Email Template

The client invitation email includes:

- **Professional Header**: EvoFit branding with gradient design
- **Personalized Greeting**: Uses trainer's name
- **Feature Highlights**: 
  - Access personalized workout programs
  - Track progress and achievements
  - Communicate directly with trainer
  - Log workouts and nutrition
  - View detailed analytics
  - Schedule sessions
- **Call-to-Action Button**: Prominent "Accept Invitation" button
- **Fallback Link**: Copy-paste link if button doesn't work
- **Security Notice**: 7-day expiration warning
- **Professional Footer**: EvoFit branding and contact info

## Error Handling

The service includes comprehensive error handling:

- **Graceful Failures**: Email failures don't break invitation creation
- **Logging**: All email attempts are logged with details
- **Connection Verification**: Test SMTP settings with `verifyConnection()`
- **Fallback**: Service continues working even if email fails

## Testing

Run the email service integration tests:

```bash
npm test -- emailServiceIntegration
```

Test email functionality:

```bash
# Verify email service configuration
const isConnected = await emailService.verifyConnection();
console.log('Email service ready:', isConnected);
```

## Troubleshooting

### Common Issues

1. **Gmail "Less Secure Apps" Error**
   - Enable 2FA and use App Password instead
   - Don't use your regular Gmail password

2. **Connection Timeout**
   - Check firewall settings
   - Verify SMTP host and port
   - Try different SMTP_SECURE settings

3. **Authentication Failed**
   - Verify username/password
   - Check if provider requires specific auth method

4. **Emails Not Received**
   - Check spam folder
   - Verify recipient email address
   - Check email service logs

### Debug Mode

Enable debug logging:

```typescript
// In development
process.env.LOG_LEVEL = 'debug';
```

## Security Considerations

- **Environment Variables**: Never commit `.env` files with real credentials
- **App Passwords**: Use app-specific passwords, not account passwords
- **Token Security**: Invitation tokens are cryptographically secure (32 bytes)
- **Expiration**: All invitation links expire after 7 days
- **Error Logging**: Sensitive data is never logged

## Production Deployment

For production:

1. Use a professional email service (SendGrid, AWS SES, etc.)
2. Set up proper SPF/DKIM records for your domain
3. Configure rate limiting for email sending
4. Monitor email delivery rates
5. Set up proper error alerting

## Frontend Integration

Ensure your frontend handles invitation acceptance:

```typescript
// Accept invitation route: /accept-invitation?token=...
const token = searchParams.get('token');
await fetch('/api/auth/accept-invitation', {
  method: 'POST',
  body: JSON.stringify({ token }),
  headers: { 'Content-Type': 'application/json' }
});
```

## Email Service Methods

- `sendClientInvitation()` - Send trainer invitation to client
- `sendEmailVerification()` - Send email verification link
- `sendPasswordReset()` - Send password reset link
- `sendWelcomeEmail()` - Send welcome message after verification
- `sendSecurityNotification()` - Send security alerts
- `sendEmail()` - Send generic email
- `verifyConnection()` - Test SMTP configuration

The email service is now production-ready and fully integrated with the client management system!