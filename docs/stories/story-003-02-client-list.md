# Story 003-02: Client List Management

**Parent Epic**: [EPIC-003 - Client Management](../epics/epic-003-client-management.md)
**Story ID**: STORY-003-02
**Priority**: P0 (Critical)
**Story Points**: 13
**Sprint**: Sprint 3

## User Story
**As a** trainer
**I want to** view and manage all my clients in a list
**So that I** can efficiently organize my training business

## Acceptance Criteria
- [ ] Display all clients in card/list view
- [ ] Filter clients by status (Active, Pending, Offline, Archived)
- [ ] Search clients by name or email
- [ ] Sort clients by name, date added, last activity
- [ ] Bulk select clients for actions
- [ ] Quick status updates from list view
- [ ] Pagination for large client lists (>20 clients)
- [ ] Show client count by status
- [ ] Responsive design for mobile devices
- [ ] Empty state with helpful guidance
- [ ] Loading states for async operations
- [ ] Quick actions per client (view, edit, message)

## Technical Implementation

### Frontend Tasks
1. **Create ClientList Component**
   - Implement client cards with key information
   - Add filter dropdown
   - Build search bar with real-time filtering
   - Implement pagination controls
   - Add bulk selection checkboxes
   - Create sort dropdown
   - Include empty state design
   - Add loading skeletons

2. **Create ClientCard Component**
   - Display client photo/avatar
   - Show name and status badge
   - Display last activity date
   - Include assigned tags
   - Add quick action buttons
   - Implement hover effects
   - Show connection date

3. **Create ClientFilters Component**
   - Status filter with checkboxes
   - Tag filter with multi-select
   - Date range filter for added/active
   - Clear all filters button
   - Active filter count display

4. **Create BulkActions Component**
   - Archive selected clients
   - Change status for selected
   - Assign tags to selected
   - Send bulk message (future)
   - Export selected clients (future)

### Backend Tasks
1. **Create Client List Endpoints**
   ```typescript
   GET /api/clients - Get paginated client list
   GET /api/clients/search - Search clients
   GET /api/clients/stats - Get client statistics
   PUT /api/clients/bulk/status - Bulk status update
   PUT /api/clients/bulk/tags - Bulk tag assignment
   DELETE /api/clients/bulk - Bulk archive
   ```

2. **Implement ClientQueryService**
   ```typescript
   class ClientQueryService {
     async getClients(trainerId: string, filters: ClientFilters)
     async searchClients(trainerId: string, query: string)
     async getClientStats(trainerId: string)
     async bulkUpdateStatus(clientIds: string[], status: ClientStatus)
     async bulkAssignTags(clientIds: string[], tagIds: string[])
   }
   ```

3. **Database Queries**
   - Join `users` and `trainer_clients` tables
   - Implement pagination with LIMIT/OFFSET
   - Add search with ILIKE for name/email
   - Filter by status with WHERE clause
   - Sort with ORDER BY
   - Index email and status columns for performance
   - Count queries for pagination

4. **Caching Strategy**
   - Cache client list in Redis (5-minute TTL)
   - Cache stats separately
   - Invalidate on client changes
   - Use pagination cache keys

### Data Models
```typescript
interface ClientFilters {
  status?: ClientStatus[];
  tags?: string[];
  searchQuery?: string;
  sortBy?: 'name' | 'dateAdded' | 'lastActivity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface ClientListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  status: ClientStatus;
  tags: Tag[];
  dateAdded: Date;
  lastActivity?: Date;
  completedWorkouts?: number;
}

interface ClientStats {
  total: number;
  active: number;
  pending: number;
  offline: number;
  archived: number;
  needProgramming: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

## Test Cases
1. **Happy Path - View Clients**
   - Load client list
   - Verify all clients displayed
   - Check status badges correct
   - Verify pagination works
   - Test sorting by name
   - Test sorting by date added

2. **Filtering Tests**
   - Filter by Active status
   - Filter by multiple statuses
   - Filter by tags
   - Combine status and tag filters
   - Clear all filters
   - Verify count updates

3. **Search Tests**
   - Search by first name
   - Search by last name
   - Search by email
   - Partial name search
   - Case-insensitive search
   - Empty search results

4. **Bulk Actions Tests**
   - Select multiple clients
   - Bulk status update
   - Bulk tag assignment
   - Bulk archive
   - Select all on page
   - Clear selection

5. **Performance Tests**
   - Load with 100+ clients
   - Search performance
   - Filter performance
   - Pagination speed
   - Cache hit rate

6. **Edge Cases**
   - Empty client list
   - Single client
   - Very long names
   - Special characters in search
   - Invalid pagination parameters
   - Concurrent modifications

## UI/UX Mockups
```
+--------------------------------------------------+
|  Clients                           [+ Add Client] |
|                                                  |
|  [Search clients________________]  [▼ Filter]    |
|                                                  |
|  Active (15) | Pending (3) | Offline (2) | All   |
|                                                  |
|  Sort by: [Date Added ▼]    View: [Grid] [List] |
|                                                  |
|  +----------------+  +----------------+          |
|  | [✓] John Doe   |  | [ ] Jane Smith |          |
|  |                |  |                |          |
|  | [Photo]        |  | [Photo]        |          |
|  | Active ●       |  | Pending ●      |          |
|  |                |  |                |          |
|  | Last: Today    |  | Last: 2d ago   |          |
|  | [New] [VIP]    |  | [New]          |          |
|  |                |  |                |          |
|  | [View][Msg][≡] |  | [View][Msg][≡] |          |
|  +----------------+  +----------------+          |
|                                                  |
|  +----------------+  +----------------+          |
|  | [ ] Bob Wilson  |  | [ ] Alice Brown|          |
|  |                |  |                |          |
|  | [Photo]        |  | [Photo]        |          |
|  | Offline ●      |  | Active ●       |          |
|  |                |  |                |          |
|  | Last: 1w ago   |  | Last: Yesterday|
|  | [In-Person]    |  | [Online]       |          |
|  |                |  |                |          |
|  | [View][Msg][≡] |  | [View][Msg][≡] |          |
|  +----------------+  +----------------+          |
|                                                  |
|  Bulk Actions: [Archive▼] [Assign Tags]         |
|                                                  |
|  < Previous  1 2 3 4 5  Next >                  |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Filter Options                          [×]     |
|                                                  |
|  Status                                          |
|  [✓] Active (15)                                 |
|  [✓] Pending (3)                                  |
|  [ ] Offline (2)                                  |
|  [ ] Need Programming (0)                         |
|  [ ] Archived (5)                                 |
|                                                  |
|  Tags                                            |
|  [✓] New Client                                   |
|  [ ] VIP                                          |
|  [ ] Online Training                              |
|  [ ] In-Person                                    |
|  [ ] Premium                                      |
|                                                  |
|  Date Added                                      |
|  From: [Select Date]                             |
|  To:   [Select Date]                             |
|                                                  |
|  [Clear All]                      [Apply Filters]|
+--------------------------------------------------+
```

## Dependencies
- Client creation (STORY-003-01) must be complete
- Database indexes on client tables
- Pagination infrastructure
- Caching layer (Redis) configured
- Status system implemented

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for list endpoints
- [ ] Performance tests with 100+ clients
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Page load time <2 seconds with 100 clients
- [ ] Mobile responsive design verified
- [ ] Documentation updated

## Notes
- **ALREADY IMPLEMENTED** - This feature has been completed and is in production
- Consider infinite scroll as alternative to pagination for mobile
- Virtual scrolling for very large lists (>500 clients)
- Cache invalidation strategy needs refinement for real-time updates
- Bulk actions should have confirmation modals
- Consider adding "quick filters" for common queries
- Accessibility: keyboard navigation for list items
- Status badges should be color-coded with high contrast
