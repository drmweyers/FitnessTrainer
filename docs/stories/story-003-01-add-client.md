# Story 003-01: Add New Client

**Parent Epic**: [EPIC-003 - Client Management](../epics/epic-003-client-management.md)
**Story ID**: STORY-003-01
**Priority**: P0 (Critical)
**Story Points**: 8
**Sprint**: Sprint 3

## User Story
**As a** trainer
**I want to** add a new client to my roster
**So that I** can start training them

## Acceptance Criteria
- [ ] Can add client via two methods: invite by email or manual add
- [ ] Collect basic client information (name, email, phone)
- [ ] Set initial client status (default: Pending)
- [ ] Send welcome email when inviting by email
- [ ] Add to client list immediately upon creation
- [ ] Assign initial tags/categories during creation
- [ ] Validate email uniqueness
- [ ] Handle duplicate email gracefully
- [ ] Show success confirmation with client details
- [ ] Process takes less than 2 minutes

## Technical Implementation

### Frontend Tasks
1. **Create AddClientModal Component**
   - Build modal with two tabs: "Invite by Email" and "Add Manually"
   - Implement form validation
   - Add tag selector for initial categorization
   - Include status dropdown
   - Add email preview for invitations

2. **Create ClientForm Component**
   - Build reusable client information form
   - Include fields: first name, last name, email, phone
   - Add optional fields: date of birth, address
   - Implement real-time validation
   - Add custom message textarea for invitations

3. **Create TagSelector Component**
   - Display existing trainer tags
   - Allow tag creation during client add
   - Multi-select functionality
   - Color-coded tag display

### Backend Tasks
1. **Create Client Endpoints**
   ```typescript
   POST /api/clients/invite - Invite client by email
   POST /api/clients/manual - Manually add client
   GET /api/clients/check-email/:email - Check email uniqueness
   ```

2. **Implement ClientService**
   ```typescript
   class ClientService {
     async inviteClient(data: InviteClientDto, trainerId: string)
     async addClientManually(data: ManualClientDto, trainerId: string)
     async checkEmailAvailability(email: string, trainerId: string)
     async sendWelcomeEmail(email: string, trainerName: string, customMessage?: string)
   }
   ```

3. **Database Operations**
   - Insert into `trainer_clients` table
   - Create client invitation record (if invited)
   - Assign initial tags
   - Set status to 'pending' by default
   - Log creation in activity timeline

### Data Models
```typescript
interface InviteClientDto {
  email: string;
  firstName?: string;
  lastName?: string;
  customMessage?: string;
  tags?: string[];
  status?: ClientStatus;
}

interface ManualClientDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: string;
  tags?: string[];
  status?: ClientStatus;
}

type ClientStatus = 'active' | 'pending' | 'offline' | 'need_programming' | 'archived';

interface ClientInvitation {
  id: string;
  trainerId: string;
  clientEmail: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  customMessage?: string;
  sentAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
}
```

## Test Cases
1. **Happy Path - Invite Client**
   - Enter valid email
   - Add custom welcome message
   - Select initial tag
   - Submit invitation
   - Verify email sent
   - Check client appears in pending list
   - Verify invitation token created

2. **Happy Path - Manual Add**
   - Fill in all required fields
   - Add optional phone number
   - Select status as "Active"
   - Assign tags
   - Submit form
   - Verify client created immediately
   - Check client appears in active list

3. **Edge Cases**
   - Duplicate email detection
   - Invalid email format
   - Missing required fields
   - Email service failure
   - Expired invitation handling
   - Very long names or addresses
   - Special characters in names

4. **Validation Tests**
   - Email format validation
   - Phone number format validation
   - Required field validation
   - Maximum length validation
   - Tag validation

5. **Integration Tests**
   - Email service integration
   - Database transaction integrity
   - Tag assignment functionality
   - Activity logging

## UI/UX Mockups
```
+------------------------------------------+
|  Add New Client                    [X]   |
|                                          |
|  [Invite by Email]  [Add Manually]       |
|                                          |
|  Email:                          [*]     |
|  client@example.com                      |
|                                          |
|  First Name (optional):           [*]     |
|  John                                     |
|                                          |
|  Last Name (optional):            [*]     |
|  Doe                                      |
|                                          |
|  Custom Welcome Message:          [*]     |
|  I'd like to invite you to join    |
|  my training platform. Let's       |
|  achieve your fitness goals!       |
|                                          |
|  Initial Tags: (select to assign)  [*]    |
|  [×] New Client  [×] Online Training     |
|  [  ] In-Person  [  ] Premium            |
|                                          |
|  Initial Status:                 [▼]     |
|  Pending                                  |
|                                          |
|  [Cancel]                    [Send Invite]|
+------------------------------------------+
```

```
+------------------------------------------+
|  Add New Client                    [X]   |
|                                          |
|  [Invite by Email]  [Add Manually]       |
|                                          |
|  First Name:                    [*]      |
|  John                                     |
|                                          |
|  Last Name:                     [*]      |
|  Doe                                      |
|                                          |
|  Email:                         [*]      |
|  john.doe@example.com                     |
|                                          |
|  Phone (optional):               [*]      |
|  (555) 123-4567                            |
|                                          |
|  Date of Birth (optional):       [*]      |
|  [Select Date]                            |
|                                          |
|  Initial Tags: (select to assign)  [*]    |
|  [×] New Client  [×] VIP                  |
|                                          |
|  Initial Status:                 [▼]     |
|  Active                                   |
|                                          |
|  [Cancel]                      [Add Client]|
+------------------------------------------+
```

## Dependencies
- Authentication system (EPIC-002) must be complete
- Email service must be configured
- User profile system in place
- Tag system infrastructure ready
- Trainer-client relationship table exists

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for API endpoints
- [ ] Email sending functionality tested
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Performance benchmarks met (<2 minutes to add)
- [ ] Documentation updated
- [ ] Mobile responsive design verified

## Notes
- **ALREADY IMPLEMENTED** - This feature has been completed and is in production
- Email templates should be customizable by trainer in future iteration
- Consider adding bulk client import via CSV in future iteration
- GDPR compliance: ensure consent tracking for email communications
- Invitation expiry set to 30 days by default
- Welcome email should include platform setup instructions
