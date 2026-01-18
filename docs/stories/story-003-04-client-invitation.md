# Story 003-04: Client Invitation Flow

**Parent Epic**: [EPIC-003 - Client Management](../epics/epic-003-client-management.md)
**Story ID**: STORY-003-04
**Priority**: P0 (Critical)
**Story Points**: 8
**Sprint**: Sprint 3

## User Story
**As a** trainer
**I want to** invite clients via email
**So that** they can join the platform and connect with me

## Acceptance Criteria
- [ ] Send customized invitation email to client
- [ ] Track invitation status (pending, accepted, expired)
- [ ] Resend invitation capability
- [ ] Invitations expire after 30 days
- [ ] Auto-connect trainer-client upon acceptance
- [ ] Include welcome message from trainer
- [ ] Show invitation history
- [ ] Cancel pending invitations
- [ ] View invitation delivery status
- [ ] Handle bounced emails gracefully
- [ ] Support multiple invitation attempts
- [ ] Customizable invitation template

## Technical Implementation

### Frontend Tasks
1. **Create InvitationModal Component**
   - Email input field with validation
   - Custom welcome message textarea
   - Preview email button
   - Send invitation button
   - Loading state during send
   - Success/error feedback

2. **Create InvitationStatus Component**
   - Display invitation status badge
   - Show sent date and expiry
   - Resend button with cooldown
   - Cancel button for pending
   - View email content button
   - Delivery status indicator

3. **Create InvitationsList Component**
   - List all pending invitations
   - Show accepted invitations
   - Display expired invitations
   - Filter by status
   - Search by email
   - Bulk resend capability

4. **Create EmailPreview Component**
   - Render email preview
   - Show dynamic fields (trainer name, client name)
   - Display custom message
   - Include platform logo
   - Show action button preview

5. **Create InvitationTracker Component**
   - Real-time status updates
   - Show delivery confirmation
   - Display open tracking (optional)
   - Show click tracking
   - Display acceptance timestamp

### Backend Tasks
1. **Create Invitation Endpoints**
   ```typescript
   POST /api/clients/invite - Send new invitation
   GET /api/clients/invitations - List all invitations
   GET /api/clients/invitations/:id - Get invitation details
   POST /api/clients/invitations/:id/resend - Resend invitation
   DELETE /api/clients/invitations/:id - Cancel invitation
   GET /api/invitations/:token/accept - Accept invitation (public)
   POST /api/invitations/:token/accept - Process acceptance
   GET /api/clients/invitations/stats - Invitation statistics
   ```

2. **Implement InvitationService**
   ```typescript
   class InvitationService {
     async sendInvitation(data: InviteDto, trainerId: string)
     async resendInvitation(invitationId: string, trainerId: string)
     async cancelInvitation(invitationId: string, trainerId: string)
     async acceptInvitation(token: string, userData: RegisterDto)
     async getInvitationByToken(token: string)
     async checkExpiration(invitation: Invitation)
     async getInvitationStats(trainerId: string)
   }
   ```

3. **Email Service Integration**
   - Generate secure invitation token
   - Create invitation link with token
   - Render email template with trainer info
   - Send via email service (SendGrid/Mailgun)
   - Track delivery status
   - Handle bounce/complaint notifications

4. **Token Management**
   - Generate unique tokens (UUID)
   - Set 30-day expiration
   - Store hashed tokens
   - Invalidate after acceptance
   - Rate limit resend attempts

5. **Database Operations**
   - Insert invitation record
   - Update status on send/accept/expire
   - Log delivery attempts
   - Track acceptance timestamp
   - Clean up expired invitations

6. **Background Jobs**
   - Check for expired invitations daily
   - Send reminder emails (optional)
   - Clean up old invitations
   - Update delivery status

### Data Models
```typescript
interface InviteDto {
  email: string;
  firstName?: string;
  lastName?: string;
  customMessage?: string;
  tags?: string[];
}

interface Invitation {
  id: string;
  trainerId: string;
  trainer: {
    firstName: string;
    lastName: string;
    email: string;
    photo?: string;
  };
  clientEmail: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  customMessage?: string;
  sentAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  deliveryStatus?: 'sent' | 'delivered' | 'bounced' | 'failed';
  lastResentAt?: Date;
  resendCount: number;
}

interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  cancelled: number;
  acceptanceRate: number;
  avgAcceptanceTime: number; // in hours
}

interface InvitationEmailTemplate {
  subject: string;
  body: string;
  trainerName: string;
  customMessage?: string;
  invitationLink: string;
  expiryDate: Date;
  platformName: string;
}
```

## Test Cases
1. **Happy Path - Send Invitation**
   - Enter valid email
   - Add custom welcome message
   - Send invitation
   - Verify email sent
   - Check invitation created with pending status
   - Verify token generated
   - Check expiry set to 30 days

2. **Happy Path - Accept Invitation**
   - Client receives email
   - Clicks invitation link
   - Lands on signup page with token
   - Completes registration
   - Verify auto-connect to trainer
   - Check invitation status updated to accepted
   - Verify timestamp recorded

3. **Resend Invitation**
   - Find pending invitation
   - Click resend
   - Verify new email sent
   - Check resend count incremented
   - Verify expiry extended
   - Test resend rate limiting

4. **Cancel Invitation**
   - Select pending invitation
   - Cancel invitation
   - Verify status updated to cancelled
   - Check token invalidated
   - Verify client cannot accept

5. **Expiration Handling**
   - Create invitation >30 days old
   - Run expiration job
   - Verify status updated to expired
   - Check token invalidated
   - Test acceptance fails

6. **Edge Cases**
   - Duplicate email invitations
   - Invalid email format
   - Already connected client
   - Expired token acceptance attempt
   - Cancelled token acceptance
   - Malformed token
   - Email delivery failure
   - Network timeout during send

7. **Security Tests**
   - Token uniqueness
   - Token cannot be guessed
   - Token invalidation after use
   - Rate limiting on resend
   - SQL injection prevention
   - XSS in custom message

8. **Integration Tests**
   - Email service integration
   - Database transaction integrity
   - Background job execution
   - Client registration flow
   - Trainer-client relationship creation

## UI/UX Mockups
```
+------------------------------------------+
|  Invite Client                    [×]    |
|                                          |
|  Email Address                  [*]     |
|  client@example.com                      |
|                                          |
|  Client Name (optional)         [*]     |
|  First: John   Last: Doe                  |
|                                          |
|  Personal Message (optional)    [*]     |
|  I'm excited to work with you on |
|  your fitness journey! Let's     |
|  achieve your goals together.    |
|                                          |
|  [Preview Email]                          |
|                                          |
|  Initial Tags (optional)        [*]     |
|  [×] New Client                            |
|                                          |
|  This invitation will expire in 30 days. |
|                                          |
|  [Cancel]                      [Send Invite]|
+------------------------------------------+
```

```
+------------------------------------------+
|  Invitation Email Preview       [×]      |
|                                          |
|  Subject: You're invited! Join John      |
|   Smith on FitnessTrainer                |
|                                          |
|  +------------------------------------+  |
|  | From: John Smith <john@trainer.com>|  |
|  | To: client@example.com             |  |
|  | Subject: You're invited!           |  |
|  +------------------------------------+  |
|                                          |
|  | Hi [Client Name],                    |
|  |                                      |  |
|  | John Smith has invited you to join  |  |
|  | FitnessTrainer!                      |  |
|  |                                      |  |
|  | Personal message:                    |  |
|  | "I'm excited to work with you on    |  |
|  | your fitness journey! Let's achieve |  |
|  | your goals together."                |  |
|  |                                      |  |
|  | [Accept Invitation]                 |  |
|  |                                      |  |
|  | This invitation expires in 30 days. |  |
|  |                                      |  |
|  | © 2025 FitnessTrainer               |  |
|  +------------------------------------+  |
|                                          |
|                          [Close] [Send]   |
+------------------------------------------+
```

```
+--------------------------------------------------+
|  Client Invitations                              |
|                                                  |
|  [Pending] [Accepted] [Expired] [All]           |
|                                                  |
|  +--------------------------------------------+  |
|  | client@example.com                          |  |
|  | Status: [Pending ●]                         |  |
|  | Sent: Jan 15, 2025  |  Expires: Feb 14, 2025|  |
|  | Delivery: [✓ Delivered]                     |  |
|  |                                            |  |
|  | [Resend] [Cancel] [View Email]              |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | john.doe@example.com                        |  |
|  | Status: [Accepted ●]                         |  |
|  | Sent: Jan 10, 2025  |  Accepted: Jan 11, 2025| |
|  | Delivery: [✓ Delivered]                      |  |
|  |                                            |  |
|  | [View Client]                               |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | old@email.com                               |  |
|  | Status: [Expired ●]                         |  |
|  | Sent: Dec 1, 2024  |  Expired: Dec 31, 2024 |  |
|  | Delivery: [✗ Bounced]                       |  |
|  |                                            |  |
|  | [Resend] [Remove]                           |  |
|  +--------------------------------------------+  |
|                                                  |
|  Stats: 5 Pending | 12 Accepted | 2 Expired     |
|  Acceptance Rate: 80.5%                         |
+--------------------------------------------------+
```

## Dependencies
- Authentication system (EPIC-002) must be complete
- Email service configured (SendGrid/Mailgun)
- User registration flow exists
- Client creation (STORY-003-01) infrastructure
- Database tables for invitations
- Background job scheduler

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for email service
- [ ] Manual testing with real emails
- [ ] Security audit for token management
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Email deliverability tested
- [ ] Documentation updated
- [ ] Acceptance tracking verified

## Notes
- **ALREADY IMPLEMENTED** - This feature has been completed and is in production
- Email templates should be customizable in future iterations
- Consider adding reminder emails for pending invitations
- Track email open rates to optimize invitation timing
- Implement SPF/DKIM for better email deliverability
- Add webhook support for invitation events
- Consider adding calendar invites for initial consultation
- A/B test email subject lines for better acceptance rates
- Monitor bounce rates and implement suppression list
- Add support for inviting via SMS in future iteration
- Consider bulk invitation upload from CSV
