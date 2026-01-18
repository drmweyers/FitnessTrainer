# Story 003-06: Client Notes & Tags

**Parent Epic**: [EPIC-003 - Client Management](../epics/epic-003-client-management.md)
**Story ID**: STORY-003-06
**Priority**: P0 (Critical)
**Story Points**: 8
**Sprint**: Sprint 4

## User Story
**As a** trainer
**I want to** add notes and tags to clients
**So that I** can organize and remember important information

## Acceptance Criteria
- [ ] Add/edit/delete client notes with timestamps
- [ ] Create custom tags with names and colors
- [ ] Apply multiple tags per client
- [ ] Filter clients by tags
- [ ] Search within client notes
- [ ] Notes are trainer-only (private)
- [ ] Pin important notes to top
- [ ] Rich text formatting for notes
- [ ] Tag management (create, edit, delete, merge)
- [ ] Bulk tag assignment
- [ ] Note categories/types
- [ ] Export notes for client

## Technical Implementation

### Frontend Tasks
1. **Create NotesSection Component**
   - Display notes in reverse chronological order
   - Pinned notes at top
   - Add note button
   - Edit/delete controls
   - Timestamp display
   - Note type/category badges

2. **Create NoteEditor Component**
   - Rich text editor (bold, italic, lists)
   - Note type/category selector
   - Pin toggle
   - Save/cancel buttons
   - Character count
   - Auto-save draft

3. **Create NoteViewer Component**
   - Render formatted note content
   - Show note type and timestamp
   - Edit/delete buttons
   - Pin indicator
   - Expand/collapse for long notes

4. **Create TagManager Component**
   - List all trainer tags
   - Create new tag modal
   - Edit tag (name, color)
   - Delete tag with confirmation
   - Merge duplicate tags
   - Tag usage statistics

5. **Create TagSelector Component**
   - Multi-select dropdown
   - Tag color display
   - Create new tag inline
   - Filter tags by name
   - Show recently used tags first

6. **Create TagBadge Component**
   - Color-coded tag display
   - Remove tag button
   - Hover tooltip with tag info
   - Click to filter by tag

7. **Create NotesSearch Component**
   - Search input with debouncing
   - Highlight matching text
   - Filter by note type
   - Filter by date range
   - Clear search button

8. **Create BulkTagAssign Component**
   - Select multiple clients
   - Show available tags
   - Assign/remove tags in bulk
   - Show assignment count
   - Confirm bulk action

### Backend Tasks
1. **Create Notes Endpoints**
   ```typescript
   POST /api/clients/:id/notes - Create note
   GET /api/clients/:id/notes - Get client notes
   PUT /api/clients/:id/notes/:noteId - Update note
   DELETE /api/clients/:id/notes/:noteId - Delete note
   POST /api/clients/:id/notes/:noteId/pin - Pin/unpin note
   GET /api/clients/:id/notes/search - Search notes
   POST /api/clients/notes/export - Export notes
   ```

2. **Create Tags Endpoints**
   ```typescript
   GET /api/tags - Get all trainer tags
   POST /api/tags - Create new tag
   PUT /api/tags/:id - Update tag
   DELETE /api/tags/:id - Delete tag
   POST /api/tags/:id/merge - Merge tags
   GET /api/tags/stats - Tag usage statistics
   PUT /api/clients/:id/tags - Assign tags to client
   DELETE /api/clients/:id/tags/:tagId - Remove tag from client
   POST /api/clients/tags/bulk - Bulk tag assignment
   ```

3. **Implement NotesService**
   ```typescript
   class NotesService {
     async createNote(clientId: string, data: CreateNoteDto, trainerId: string)
     async getNotes(clientId: string, filters?: NoteFilters)
     async updateNote(noteId: string, data: UpdateNoteDto, trainerId: string)
     async deleteNote(noteId: string, trainerId: string)
     async togglePin(noteId: string, trainerId: string)
     async searchNotes(clientId: string, query: string)
     async exportNotes(clientIds: string[])
   }
   ```

4. **Implement TagsService**
   ```typescript
   class TagsService {
     async createTag(data: CreateTagDto, trainerId: string)
     async getTags(trainerId: string)
     async updateTag(tagId: string, data: UpdateTagDto, trainerId: string)
     async deleteTag(tagId: string, trainerId: string)
     async mergeTags(sourceTagId: string, targetTagId: string, trainerId: string)
     async getTagStats(trainerId: string)
     async assignTagsToClient(clientId: string, tagIds: string[], trainerId: string)
     async removeTagFromClient(clientId: string, tagId: string, trainerId: string)
     async bulkAssignTags(clientIds: string[], tagIds: string[], trainerId: string)
   }
   ```

5. **Database Operations**
   - CRUD for client_notes table
   - CRUD for client_tags table
   - CRUD for client_tag_assignments table
   - Full-text search on notes
   - Tag usage aggregation
   - Pin ordering logic

6. **Search Implementation**
   - Full-text search with PostgreSQL
   - Index note content for performance
   - Highlight matching terms
   - Relevance ranking

### Data Models
```typescript
type NoteType = 'general' | 'session' | 'progress' | 'medical' | 'nutrition' | 'other';

interface CreateNoteDto {
  content: string;
  type?: NoteType;
  isPinned?: boolean;
}

interface UpdateNoteDto {
  content?: string;
  type?: NoteType;
  isPinned?: boolean;
}

interface Note {
  id: string;
  clientId: string;
  trainerId: string;
  content: string;
  type: NoteType;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  trainer: {
    firstName: string;
    lastName: string;
  };
}

interface NoteFilters {
  type?: NoteType;
  startDate?: Date;
  endDate?: Date;
  pinnedOnly?: boolean;
  limit?: number;
}

interface CreateTagDto {
  name: string;
  color: string;
}

interface UpdateTagDto {
  name?: string;
  color?: string;
}

interface Tag {
  id: string;
  trainerId: string;
  name: string;
  color: string;
  clientCount: number;
  createdAt: Date;
}

interface TagStats {
  total: number;
  mostUsed: Tag[];
  unused: Tag[];
  usageDistribution: {
    tagId: string;
    tagName: string;
    count: number;
  }[];
}

interface BulkTagAssignmentDto {
  clientIds: string[];
  tagIds: string[];
  operation: 'assign' | 'remove';
}
```

## Test Cases
1. **Happy Path - Create Note**
   - Navigate to client profile
   - Click "Add Note"
   - Enter note content
   - Select note type
   - Save note
   - Verify note appears in list
   - Check timestamp correct
   - Verify trainer-only visibility

2. **Pin Note**
   - Find existing note
   - Click pin button
   - Verify note moves to top
   - Check pin indicator shows
   - Unpin note
   - Verify note returns to chronological position

3. **Edit/Delete Note**
   - Edit existing note
   - Update content
   - Change note type
   - Save changes
   - Verify updated timestamp
   - Delete note
   - Confirm deletion
   - Verify note removed

4. **Create Tag**
   - Open tag manager
   - Click "New Tag"
   - Enter tag name
   - Select color
   - Save tag
   - Verify tag appears in list
   - Check tag available for assignment

5. **Assign Tags**
   - Navigate to client profile
   - Click "Add Tag"
   - Select existing tag
   - Create new tag inline
   - Assign multiple tags
   - Verify tags display on client
   - Check tags in client list

6. **Search Notes**
   - Enter search query
   - Verify matching notes highlighted
   - Check results filtered
   - Clear search
   - Verify all notes show

7. **Bulk Tag Assignment**
   - Select multiple clients
   - Choose "Assign Tags"
   - Select tags to assign
   - Execute bulk assignment
   - Verify all clients updated
   - Check tag counts updated

8. **Merge Tags**
   - Find duplicate tags
   - Select merge option
   - Choose source and target
   - Execute merge
   - Verify source deleted
   - Check all clients have target tag

9. **Export Notes**
   - Select client(s)
   - Click "Export Notes"
   - Choose format (PDF/DOCX)
   - Generate export
   - Verify export includes all notes
   - Check formatting correct

10. **Edge Cases**
    - Empty note content validation
    - Very long notes
    - Special characters in notes
    - Duplicate tag names
    - Invalid tag colors
    - Search with no results
    - Merge tags with no assignments
    - Delete tag with active assignments

## UI/UX Mockups
```
+--------------------------------------------------+
|  Client Notes - John Doe                [×]      |
|                                                  |
|  [+ Add Note]  [Search notes________]  [Export] |
|                                                  |
|  Filter: [All Types ▼]  [Pinned Only]           |
|                                                  |
|  Notes (24)                                      |
|                                                  |
|  +--------------------------------------------+  |
|  | [📌] PINNED                                |  |
|  | [Session ●] Today at 2:30 PM              |  |
|  |                                            |  |
|  | Great progress today! Client hit a new    |  |
|  | PR on deadlift at 225 lbs. Form was       |  |
|  | excellent. Next week we'll focus on       |  |
|  | increasing volume.                         |  |
|  |                                            |  |
|  | [Edit] [Delete]                            |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | [Medical ●] Yesterday at 10:15 AM         |  |
|  |                                            |  |
|  | Client mentioned knee discomfort during   |  |
|  | squats. Recommend reducing weight and     |  |
|  | focusing on mobility work next session.   |  |
|  |                                            |  |
|  | [Edit] [Delete] [Pin]                      |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | [General ●] Jan 15, 2025                  |  |
|  |                                            |  |
|  | Client is preparing for wedding in June.  |  |
|  | Primary goal is weight loss and           |  |
|  | toning. Very motivated!                   |  |
|  |                                            |  |
|  | [Edit] [Delete] [Pin]                      |  |
|  +--------------------------------------------+  |
|                                                  |
|  [Load More...]                                  |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Add Note                            [×]         |
|                                                  |
|  Note Type                               [▼]     |
|  General                                          |
|                                                  |
|  Rich Text Editor                                |
|  +--------------------------------------------+  |
|  | [B] [I] [U] [•] [1.] [🔗]            |  |
|  +--------------------------------------------+  |
|  |                                            |  |
|  | Great session today! Client showed         |  |
|  | excellent form on all exercises.           |  |
|  |                                            |  |
|  | Key points:                                |  |
|  | • Hit PR on bench press                    |  |
|  | • Improved mobility on squats              |  |
|  | • Ready for progression next week          |  |
|  |                                            |  |
|  +--------------------------------------------+  |
|                                                  |
|  Options                                         |
|  [📌] Pin this note                              |
|                                                  |
|  Characters: 247/5000                            |
|                                                  |
|  [Cancel]  [Save Draft]  [Save Note]             |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Manage Tags                         [×]         |
|                                                  |
|  [+ New Tag]  [Search tags________]             |
|                                                  |
|  Your Tags (12)                                  |
|                                                  |
|  +-------------------------------------------+   |
|  | [New Client] [■] (15 clients)             |   |
|  | [Edit] [Delete] [Merge]                   |   |
|  +-------------------------------------------+   |
|                                                  |
|  +-------------------------------------------+   |
|  | [VIP] [■] (8 clients)                     |   |
|  | [Edit] [Delete] [Merge]                   |   |
|  +-------------------------------------------+   |
|                                                  |
|  +-------------------------------------------+   |
|  | [Online Training] [■] (12 clients)        |   |
|  | [Edit] [Delete] [Merge]                   |   |
|  +-------------------------------------------+   |
|                                                  |
|  +-------------------------------------------+   |
|  | [In-Person] [■] (10 clients)              |   |
|  | [Edit] [Delete] [Merge]                   |   |
|  +-------------------------------------------+   |
|                                                  |
|  Unused Tags (2)                                |
|  +-------------------------------------------+   |
|  | [Old Tag] [■] (0 clients)                 |   |
|  | [Edit] [Delete] [Merge]                   |   |
|  +-------------------------------------------+   |
|                                                  |
|  Tag Statistics                                 |
|  • Most used: New Client (15)                   |
|  • Least used: Old Tag (0)                      |
|  • Avg tags per client: 2.3                     |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Create New Tag                       [X]        |
|                                                  |
|  Tag Name                                   [*]  |
|  Competition Prep                               |
|                                                  |
|  Tag Color                                       |
|  [■] [■] [■] [■] [■]                             |
|  [■] [■] [■] [■] [■]                             |
|  [■] [■] [■] [■] [■]                             |
|                                                  |
|  Or enter custom color:                  [*]    |
|  #FF5733                                         |
|                                                  |
|  Preview: [Competition Prep ■]                   |
|                                                  |
|  [Cancel]                      [Create Tag]      |
+--------------------------------------------------+
```

```
+--------------------------------------------------+
|  Bulk Assign Tags                                |
|                                                  |
|  Selected: 5 clients                             |
|                                                  |
|  Available Tags                                  |
|  [✓] New Client                                   |
|  [✓] Online Training                              |
|  [ ] VIP                                          |
|  [ ] In-Person                                    |
|  [ ] Competition Prep                             |
|  [ ] Post-Rehab                                   |
|                                                  |
|  Operation                                       |
|  (•) Assign selected tags                        |
|  ( ) Remove selected tags                        |
|                                                  |
|  Preview                                         |
|  5 clients will be updated:                      |
|  • New Client will be assigned                   |
|  • Online Training will be assigned              |
|                                                  |
|  [Cancel]                      [Assign Tags]     |
+--------------------------------------------------+
```

## Dependencies
- Client profile view (STORY-003-03) must be complete
- Rich text editor library installed
- Database tables for notes and tags
- Search infrastructure
- Export service for notes

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for notes and tags
- [ ] Search functionality tested
- [ ] Export functionality tested
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Performance tests with 100+ notes
- [ ] Documentation updated

## Notes
- **ALREADY IMPLEMENTED** - This feature has been completed and is in production
- Rich text editor should support basic formatting only
- Consider adding note templates for common use cases
- Tags should support emoji icons in future iteration
- Search should support regex patterns for power users
- Notes could support attachments (images, files) in future
- Consider adding reminder feature for important notes
- Tag colors should have high contrast for accessibility
- Note export should include client metadata
- Add note sharing capability between trainers (future)
- Consider AI-powered note summarization for long notes
