# Epic 003: Client Management

## Epic Overview
**Epic ID**: EPIC-003  
**Epic Name**: Client Management  
**Priority**: P0 (Critical)  
**Estimated Effort**: 6-8 weeks  
**Dependencies**: EPIC-002 (Authentication)  

## Business Value
Client management is central to the trainer's workflow. This epic provides trainers with the tools to efficiently manage their client roster, track client status, assign programs, and maintain organized client relationships. It directly impacts trainer productivity and client satisfaction.

## Features Included

### Client Roster Management
- Add new clients (invite or direct add)
- View all clients with filtering/sorting
- Client status tracking (Active, Pending, Offline, Archived)
- Client categorization and tagging
- Bulk actions for client management

### Client Profiles
- Comprehensive client information
- Health and fitness data
- Goals and limitations
- Progress photos
- Contact information
- Training history

### Client-Trainer Relationship
- Client invitation system
- Connection approval workflow
- Trainer assignment/reassignment
- Client access controls
- Communication preferences

### Client Dashboard
- Individual client view for trainers
- Program assignments
- Progress overview
- Recent activity
- Quick actions

## User Stories

### Story 1: Add New Client
**As a** trainer  
**I want to** add a new client to my roster  
**So that I** can start training them  

**Acceptance Criteria:**
- Two methods: invite by email or manual add
- Collect basic client information
- Set initial client status
- Send welcome email (if invited)
- Add to client list immediately
- Assign initial tags/categories

### Story 2: Client List Management
**As a** trainer  
**I want to** view and manage all my clients  
**So that I** can efficiently organize my training business  

**Acceptance Criteria:**
- List view with client cards
- Filter by status (Active, Pending, Offline, Archived)
- Search by name or email
- Sort by name, date added, last activity
- Bulk select for actions
- Quick status updates
- Pagination for large lists

### Story 3: Client Profile View
**As a** trainer  
**I want to** view detailed client information  
**So that I** can provide personalized training  

**Acceptance Criteria:**
- Personal information display
- Health questionnaire responses
- Current goals and limitations
- Progress photo gallery
- Measurement history
- Assigned programs
- Activity timeline
- Notes section

### Story 4: Client Invitation Flow
**As a** trainer  
**I want to** invite clients via email  
**So that** they can join the platform and connect with me  

**Acceptance Criteria:**
- Send customized invitation email
- Track invitation status
- Resend capability
- Invitation expiry (30 days)
- Auto-connect upon acceptance
- Welcome message option

### Story 5: Client Status Management
**As a** trainer  
**I want to** track client status  
**So that I** know who needs attention  

**Acceptance Criteria:**
- Status options: Active, Pending, Offline, Need Programming, Archived
- Automatic status updates based on activity
- Manual status override
- Status change history
- Filter clients by status
- Status-based notifications

### Story 6: Client Notes & Tags
**As a** trainer  
**I want to** add notes and tags to clients  
**So that I** can organize and remember important information  

**Acceptance Criteria:**
- Add/edit/delete notes with timestamps
- Create custom tags
- Apply multiple tags per client
- Filter by tags
- Search within notes
- Note privacy (trainer-only)

## Technical Requirements

### Frontend Components
- ClientList component
- ClientCard component
- ClientProfile component
- ClientInviteModal component
- ClientFilters component
- ClientStatusBadge component
- NotesSection component
- TagManager component

### Backend Services
- ClientService for client management
- InvitationService for invite flow
- RelationshipService for trainer-client connections
- NotificationService for client communications

### Database Tables
```sql
-- Trainer-client relationships
trainer_clients (
  id UUID PRIMARY KEY,
  trainer_id UUID REFERENCES users(id),
  client_id UUID REFERENCES users(id),
  status ENUM('active', 'pending', 'offline', 'need_programming', 'archived'),
  connected_at TIMESTAMP,
  archived_at TIMESTAMP,
  UNIQUE(trainer_id, client_id)
)

-- Client invitations
client_invitations (
  id UUID PRIMARY KEY,
  trainer_id UUID REFERENCES users(id),
  client_email VARCHAR(255),
  token VARCHAR(255) UNIQUE,
  status ENUM('pending', 'accepted', 'expired'),
  custom_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  accepted_at TIMESTAMP
)

-- Client profiles (extended)
client_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  emergency_contact JSONB,
  medical_conditions TEXT[],
  medications TEXT[],
  allergies TEXT[],
  injuries JSONB,
  fitness_level ENUM('beginner', 'intermediate', 'advanced'),
  goals JSONB,
  preferences JSONB
)

-- Client notes
client_notes (
  id UUID PRIMARY KEY,
  trainer_id UUID REFERENCES users(id),
  client_id UUID REFERENCES users(id),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
)

-- Client tags
client_tags (
  id UUID PRIMARY KEY,
  name VARCHAR(50),
  color VARCHAR(7),
  trainer_id UUID REFERENCES users(id)
)

-- Client tag assignments
client_tag_assignments (
  client_id UUID REFERENCES users(id),
  tag_id UUID REFERENCES client_tags(id),
  PRIMARY KEY (client_id, tag_id)
)
```

### API Endpoints
- GET /api/clients
- POST /api/clients
- GET /api/clients/:id
- PUT /api/clients/:id
- DELETE /api/clients/:id
- POST /api/clients/invite
- GET /api/clients/invitations
- POST /api/clients/invitations/:id/resend
- PUT /api/clients/:id/status
- POST /api/clients/:id/notes
- GET /api/clients/:id/notes
- POST /api/clients/tags
- PUT /api/clients/:id/tags

### UI/UX Requirements
- Mobile-responsive client cards
- Quick action buttons
- Drag-and-drop for status changes
- Inline editing for notes
- Real-time search
- Smooth animations
- Loading states
- Empty states

## Definition of Done
- [ ] All user stories completed
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests for client flows
- [ ] UI/UX review completed
- [ ] Performance testing (load 100+ clients)
- [ ] Mobile responsive testing
- [ ] Documentation updated
- [ ] Deployed to staging

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance with many clients | High | Implement pagination, virtual scrolling |
| Complex invitation flow | Medium | Clear UI, status tracking |
| Data privacy concerns | High | Strict access controls, audit logs |
| Client categorization complexity | Low | Start simple, iterate based on feedback |

## Metrics for Success
- Client invitation acceptance rate: >80%
- Average time to add client: <2 minutes
- Client profile completion: >90%
- Trainer satisfaction score: >4.5/5
- Page load time with 100 clients: <2 seconds
- Zero data breach incidents

## Dependencies
- Authentication system must be complete
- Email service must be configured
- User profile system in place

## Out of Scope
- Client self-registration (must be invited)
- Client transfer between trainers
- Team/group client management
- Client billing (separate epic)
- Advanced analytics (separate epic)
