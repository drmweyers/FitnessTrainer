# Story 008-05: Message Templates

**Parent Epic**: [EPIC-008 - Communication & Messaging](../epics/epic-008-communication-messaging.md)
**Story ID**: STORY-008-05
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 9

## User Story
**As a** trainer
**I want to** use message templates
**So that I** can respond efficiently

## Acceptance Criteria
- [ ] Create custom message templates
- [ ] Template categories for organization
- [ ] Variable placeholders (client name, workout name, etc.)
- [ ] Quick template access in chat
- [ ] Edit existing templates
- [ ] Delete templates
- [ ] Template usage analytics
- [ ] Template search and filtering
- [ ] Template preview before sending
- [ ] Shareable templates (future)
- [ ] Template suggestions based on context
- [ ] Favorite templates
- [ ] Character limit indicator

## Technical Implementation

### Frontend Tasks
1. **Create TemplateManager Component**
   - List all templates with categories
   - Create/edit template modal
   - Delete confirmation dialog
   - Category management
   - Search/filter templates
   - Usage statistics display
   - Favorite/unfavorite templates

2. **Create TemplateEditor Component**
   - Rich text editor for template content
   - Variable insertion tool
   - Variable preview with sample data
   - Category selection
   - Character counter
   - Preview button
   - Save/cancel actions
   - Template validation

3. **Create TemplatePicker Component**
   - Quick access in chat input
   - Category tabs
   - Search templates
   - Variable highlighting
   - One-tap insert
   - Recent templates
   - Favorite templates

4. **Create VariableSelector Component**
   - List available variables
   - Variable descriptions
   - Variable syntax helper
   - Insert variable at cursor
   - Nested variable support

5. **Create TemplatePreview Component**
   - Render template with actual client data
   - Show populated variables
   - Highlight variable placeholders
   - Edit before sending option

6. **Create TemplateAnalytics Component**
   - Usage count per template
   - Most used templates
   - Response rate tracking
   - Last used date
   - Export analytics

### Backend Tasks
1. **Create Template Endpoints**
   ```typescript
   GET  /api/messages/templates - Get all templates
   POST /api/messages/templates - Create template
   GET  /api/messages/templates/:id - Get template details
   PUT  /api/messages/templates/:id - Update template
   DELETE /api/messages/templates/:id - Delete template
   POST /api/messages/templates/:id/use - Record template usage
   GET  /api/messages/templates/analytics - Get usage analytics
   POST /api/messages/templates/render - Render template with variables
   ```

2. **Implement TemplateService**
   ```typescript
   class TemplateService {
     async createTemplate(trainerId: string, data: CreateTemplateDto)
     async getTemplates(trainerId: string, filters: TemplateFilters)
     async getTemplate(id: string, trainerId: string)
     async updateTemplate(id: string, trainerId: string, data: UpdateTemplateDto)
     async deleteTemplate(id: string, trainerId: string)
     async recordUsage(templateId: string, trainerId: string)
     async getAnalytics(trainerId: string)
     async renderTemplate(templateId: string, variables: Record<string, any>)
     async suggestTemplates(trainerId: string, context: string)
   }
   ```

3. **Implement Template Variable System**
   - Variable parsing engine
   - Variable validation
   - Default values for missing variables
   - Nested variable support
   - Conditional variables
   - Custom variable types (text, date, number)

4. **Database Schema Updates**
   ```prisma
   model MessageTemplate {
     id              String   @id @default(uuid())
     trainerId       String
     trainer         User     @relation(fields: [trainerId], references: [id])
     title           String
     category        String
     content         String   @db.Text
     variables       Json // Array of variable definitions
     usageCount      Int      @default(0)
     isFavorite      Boolean  @default(false)
     isActive        Boolean  @default(true)
     createdAt       DateTime @default(now())
     updatedAt       DateTime @updatedAt
     lastUsedAt      DateTime?

     @@index([trainerId, category])
     @@index([trainerId, isFavorite])
     @@index([trainerId, usageCount])
   }

   model TemplateUsage {
     id              String   @id @default(uuid())
     templateId      String
     template        MessageTemplate @relation(fields: [templateId], references: [id])
     trainerId       String
     conversationId  String?
     sentAt          DateTime @default(now())

     @@index([templateId])
     @@index([trainerId, sentAt])
   }
   ```

5. **Implement Template Rendering Engine**
   - Variable substitution
   - Conditional rendering
   - Loop support (for lists)
   - Date formatting
   - Number formatting
   - Fallback values

### Data Models
```typescript
interface MessageTemplate {
  id: string;
  trainerId: string;
  title: string;
  category: string;
  content: string;
  variables: TemplateVariable[];
  usageCount: number;
  isFavorite: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

interface TemplateVariable {
  name: string;
  type: 'text' | 'date' | 'number' | 'boolean' | 'list';
  description: string;
  defaultValue?: any;
  required: boolean;
  placeholder?: string;
}

interface CreateTemplateDto {
  title: string;
  category: string;
  content: string;
  variables?: TemplateVariable[];
}

interface UpdateTemplateDto {
  title?: string;
  category?: string;
  content?: string;
  variables?: TemplateVariable[];
  isFavorite?: boolean;
  isActive?: boolean;
}

interface TemplateFilters {
  category?: string;
  search?: string;
  favorites?: boolean;
  sortBy?: 'title' | 'usage' | 'recent';
}

interface TemplateAnalytics {
  totalTemplates: number;
  totalUsage: number;
  mostUsedTemplates: MessageTemplate[];
  categoryUsage: Record<string, number>;
  recentUsage: TemplateUsage[];
}
```

## Test Cases
1. **Happy Path**
   - Create new template
   - Add variables to template
   - Render template with actual data
   - Use template in conversation
   - Edit existing template
   - Delete template
   - Search templates
   - Favorite/unfavorite template
   - View template analytics

2. **Edge Cases**
   - Empty template content
   - Missing required variables
   - Invalid variable syntax
   - Template exceeding character limit
   - Delete template with usage history
   - Render template with missing variables
   - Circular variable references

3. **Performance Tests**
   - Load 100+ templates
   - Search across 1000+ templates
   - Render template with 50+ variables
   - Analytics query with 10,000+ usage records

4. **Security Tests**
   - Access control (trainers only access their templates)
   - Template content sanitization (XSS prevention)
   - Variable injection attacks
   - Rate limiting on template creation

## UI/UX Mockups
```
+------------------------------------------+
|  Message Templates                       |
|  [+ New Template]        [Search 🔍]     |
|                                          |
|  Categories:                             |
|  [All] [Welcome] [Workouts] [Tips] [✕]   |
|                                          |
|  +--------------------------------------+ |
|  | ⭐ Welcome Message         Used 47x  | |
|  | Hi {client_name}! Welcome to...      | |
|  | Last used: 2 hours ago                | |
|  +--------------------------------------+ |
|  | ⭐ Weekly Check-in        Used 32x  | |
|  | Hey {client_name}! How's your...     | |
|  | Last used: 1 day ago                 | |
|  +--------------------------------------+ |
|  | Workout Reminder          Used 28x  | |
|  | Don't forget your workout today...   | |
|  | Last used: 3 days ago                | |
|  +--------------------------------------+ |
|  | Form Check Feedback      Used 15x  | |
|  | Great form on {exercise_name}!...    | |
|  | Last used: 1 week ago                | |
|  +--------------------------------------+ |
+------------------------------------------+

+------------------------------------------+
|  New Template                            |
|                                          |
|  Template Title                           |
|  [Weekly Check-in________________]       |
|                                          |
|  Category                                 |
|  | [Check-ins ▼]                         |
|                                          |
|  Variables                                |
|  [+ Add Variable]                         |
|  • client_name (Text) - Client's name    |
|  • workout_name (Text) - Workout name    |
|  • day_of_week (Text) - Day of week      |
|                                          |
|  Template Content                         |
|  +--------------------------------------+ |
|  | Hey {client_name}! Hope you had...  | |
|  |                                      | |
|  | Your {workout_name} workout is...   | |
|  |                                      | |
|  | Let me know how it goes!             | |
|  |                                      | |
|  |                                    0/2000|
|  +--------------------------------------+ |
|                                          |
|  [Preview] [Save] [Cancel]                |
+------------------------------------------+

+------------------------------------------|
|  Insert Template                         |
|                                          |
|  [Search templates_______________]       |
|                                          |
|  Recent                                  |
|  +--------------------------------------+ |
|  | ⭐ Weekly Check-in                   | |
|  +--------------------------------------+ |
|  | Workout Reminder                    | |
|  +--------------------------------------+ |
|                                          |
|  Favorites                               |
|  +--------------------------------------+ |
|  | ⭐ Welcome Message                  | |
|  +--------------------------------------+ |
|                                          |
|  Workouts                                |
|  +--------------------------------------+ |
|  | Workout Reminder                    | |
|  | Pre-workout Reminder                | |
|  | Post-workout Feedback               | |
|  +--------------------------------------+ |
|                                          |
|  [Cancel]                                |
+------------------------------------------+

+------------------------------------------|
|  Template Preview                         |
|                                          |
|  Rendered with: John Doe, Leg Day, Monday|
|                                          |
|  +--------------------------------------+ |
|  | Hey John Doe! Hope you had a great  | |
|  | weekend!                             | |
|  |                                      | |
|  | Your Leg Day workout is scheduled... | |
|  |                                      | |
|  | Let me know how it goes!             | |
|  +--------------------------------------+ |
|                                          |
|  Variables used:                          |
|  ✓ client_name → John Doe                |
|  ✓ workout_name → Leg Day                |
|  ✓ day_of_week → Monday                  |
|                                          |
|  [Edit] [Use This Template]              |
+------------------------------------------+
```

## Dependencies
- STORY-008-01: Send and Receive Messages
- Rich text editor library
- Template rendering engine

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for template system
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Sample templates created

## Notes
- Pre-populate with common trainer templates
- Variable syntax: {variable_name}
- Maximum template length: 2000 characters
- Maximum variables per template: 20
- Categories: Welcome, Check-ins, Workouts, Tips, Motivation, General
- Future: Share templates between trainers
- Future: AI-powered template suggestions
- Future: Template marketplace
- Accessibility: Ensure variable names are descriptive
- GDPR: Templates may contain client data, ensure proper handling
