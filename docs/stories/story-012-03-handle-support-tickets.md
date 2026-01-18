# Story 012-03: Handle Support Tickets

**Parent Epic**: [EPIC-012 - Admin Dashboard](../epics/epic-012-admin-dashboard.md)
**Story ID**: STORY-012-03
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 13

## User Story
**As an** admin
**I want to** manage support requests
**So that** users get timely help and excellent service

## Acceptance Criteria
- [ ] Ticket queue management with filters
- [ ] Priority levels (low, medium, high, urgent)
- [ ] Assignment to staff members
- [ ] Response templates for common issues
- [ ] Ticket history and timeline
- [ ] SLA tracking and alerts
- [ ] Escalation rules for overdue tickets
- [ ] Customer satisfaction ratings
- [ ] Bulk actions on tickets
- [ ] Ticket categories and tags
- [ ] Internal notes on tickets
- [ ] Email notifications for updates

## Technical Implementation

### Frontend Tasks
1. **SupportTickets Component** - Ticket list with filters and pagination
2. **TicketDetail Component** - Full ticket view with conversation
3. **TicketAssignment Component** - Assign to staff, set priority
4. **ResponseTemplate Component** - Quick responses for common issues
5. **SLATracker Component** - Display SLA status and time remaining

### Backend Tasks
1. **Support Endpoints**
   ```typescript
   GET /api/admin/tickets - List tickets
   GET /api/admin/tickets/:id - Get ticket details
   PUT /api/admin/tickets/:id - Update ticket
   POST /api/admin/tickets/:id/assign - Assign ticket
   POST /api/admin/tickets/:id/close - Close ticket
   GET /api/admin/tickets/templates - Get response templates
   POST /api/admin/tickets/:id/response - Add response
   GET /api/admin/tickets/sla - Get SLA report
   ```

2. **SupportService**
   ```typescript
   class SupportService {
     async listTickets(filters: TicketFilters): Promise<PaginatedTickets>
     async getTicket(ticketId: string): Promise<TicketDetail>
     async assignTicket(ticketId: string, adminId: string): Promise<void>
     async closeTicket(ticketId: string, resolution: string): Promise<void>
     async addResponse(ticketId: string, response: string): Promise<void>
     async checkSLA(): Promise<Ticket[]>
   }
   ```

### Data Models
```typescript
interface SupportTicket {
  id: string;
  userId: string;
  user: User;
  category: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  assignedTo?: string; // adminId
  assignedToAdmin?: AdminUser;
  responses: TicketResponse[];
  internalNotes: TicketNote[];
  slaDeadline?: Date;
  slaStatus: 'on_track' | 'at_risk' | 'breached';
  satisfactionRating?: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

interface TicketResponse {
  id: string;
  ticketId: string;
  senderId: string;
  sender: User;
  message: string;
  isInternal: boolean;
  createdAt: Date;
}

interface ResponseTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  variables: string[];
  createdAt: Date;
}
```

### Database Schema
```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES admin_users(id),
  sla_deadline TIMESTAMP,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE TABLE ticket_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  subject VARCHAR(255),
  body TEXT NOT NULL,
  variables TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Test Cases
1. **Ticket Queue** - View all tickets with filters
2. **Priority Assignment** - Set and change priorities
3. **Staff Assignment** - Assign tickets to admins
4. **Response Templates** - Use templates for quick responses
5. **SLA Tracking** - Track time to response
6. **Ticket Resolution** - Close tickets with resolution
7. **Satisfaction Ratings** - Collect user feedback
8. **Escalation** - Auto-escalate overdue tickets

## UI/UX Mockups
```
Support Tickets Queue

+--------------------------------------------------------------+
|  Support Tickets                    [New Ticket] [Export]     |
|  ─────────────────────────────────────────────────────────   |
|  Filters: [All▼] [Priority▼] [Assigned▼] [Status▼]          |
|                                                              |
|  ┌────────────────────────────────────────────────────────┐ |
|  │ Priority │ Subject           │ User   │ Assigned│ Status│ |
|  ├────────────────────────────────────────────────────────┤ |
|  │ 🔴 Urgent │ Can't login       │ John   │ Unassigned│ Open │ |
|  │ 🟡 High   │ Payment issue     │ Jane   │ Admin Smith│In Progress│ |
|  │ 🟢 Medium │ Feature request   │ Bob    │ Admin Jones│ Pending│ |
|  └────────────────────────────────────────────────────────┘ |
+--------------------------------------------------------------+
```

```
Ticket Detail View

+--------------------------------------------------------------+
|  ← Back  Ticket #1234                       [Close] [Escalate]|
+--------------------------------------------------------------+
|  Status: Open  Priority: High  SLA: ⚠️ 2h remaining          |
|                                                              |
|  User: John Smith (john@example.com)                        |
|  Category: Technical Issue                                   |
|                                                              |
|  Subject: Cannot access workout program                     |
|                                                              |
|  Description:                                                |
|  I'm trying to access my workout program but I get an       |
|  error message when I click on it.                          |
|                                                              |
|  ─────────────────────────────────────────────────────────   |
|                                                              |
|  Admin Smith (Today 2:30 PM)                                 |
|  Hi John, I'm looking into this issue. Can you tell me      |
|  what error message you're seeing?                          |
|                                                              |
|  John Smith (Today 2:45 PM)                                  |
|  It says "Error 404: Program not found"                     |
|                                                              |
|  ─────────────────────────────────────────────────────────   |
|                                                              |
|  [Response Template▼]                                       |
|  ┌──────────────────────────────────────────────────────┐   |
|  │ Type your response...                                │   |
|  │                                                      │   |
|  │                                                      │   |
|  └──────────────────────────────────────────────────────┘   |
|                                                              |
|  [Add Internal Note]  [Send Response]  [Resolve Ticket]      |
+--------------------------------------------------------------+
```

## Dependencies
- Admin authentication
- Email service
- User database
- Notification system

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Ticket management working
- [ ] Assignment system functional
- [ ] Response templates working
- [ ] SLA tracking implemented
- [ ] Satisfaction collection working
- [ ] Unit tests passing (>80%)
- [ ] Code reviewed
- [ ] Documentation updated

## Notes
- Provide canned responses for efficiency
- Auto-assign based on category
- Set appropriate SLAs by priority
- Monitor team workload
- Track common issues for product improvements
