# Story 008-01: Send and Receive Messages

**Parent Epic**: [EPIC-008 - Communication & Messaging](../epics/epic-008-communication-messaging.md)
**Story ID**: STORY-008-01
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 8

## User Story
**As a** user
**I want to** send and receive messages
**So that I** can communicate with my trainer/client

## Acceptance Criteria
- [ ] Text message input with character limit
- [ ] Real-time message delivery
- [ ] Message history with infinite scroll
- [ ] Conversation list with unread counts
- [ ] Unread message indicators
- [ ] Search messages across all conversations
- [ ] Delete individual messages
- [ ] Edit recent messages (within 5 minutes)
- [ ] Message timestamps
- [ ] Online/offline status indicators
- [ ] Typing indicators
- [ ] Read receipts

## Technical Implementation

### Frontend Tasks
1. **Create MessageList Component**
   - Implement infinite scroll with pagination
   - Add message grouping by date/time
   - Display read receipts status
   - Show online/offline indicators
   - Auto-scroll to latest message on new messages

2. **Create MessageInput Component**
   - Textarea with auto-expand
   - Character counter (limit: 2000 chars)
   - Send button with keyboard shortcut (Enter)
   - Edit mode for recent messages
   - Attachment preview before sending

3. **Create ConversationList Component**
   - Display all user conversations
   - Show unread message count badge
   - Last message preview
   - Online status indicators
   - Search/filter conversations
   - Swipe actions for archive/delete

4. **Create MessageSearch Component**
   - Search across all conversations
   - Highlight matching text
   - Filter by date range
   - Filter by media type
   - Jump to message in context

5. **Implement WebSocket Connection**
   - Real-time message reception
   - Typing indicator broadcasts
   - Online status tracking
   - Reconnection logic with exponential backoff
   - Connection status indicator

6. **Create MessageBubble Component**
   - Sent vs received styling
   - Timestamp display
   - Read receipt ticks
   - Edit/delete actions
   - Long-press for options

### Backend Tasks
1. **Create Messaging Endpoints**
   ```typescript
   GET  /api/messages/conversations - List all conversations
   GET  /api/messages/conversations/:id - Get conversation details
   GET  /api/messages/conversations/:id/messages - Get paginated messages
   POST /api/messages/send - Send new message
   PUT  /api/messages/:id - Update message
   DELETE /api/messages/:id - Delete message
   POST /api/messages/:id/read - Mark as read
   GET  /api/messages/search - Search messages
   ```

2. **Implement MessagingService**
   ```typescript
   class MessagingService {
     async sendMessage(senderId: string, conversationId: string, content: string)
     async getConversationMessages(conversationId: string, pagination: PaginationDto)
     async updateMessage(messageId: string, userId: string, content: string)
     async deleteMessage(messageId: string, userId: string)
     async markAsRead(messageId: string, userId: string)
     async searchMessages(userId: string, query: string, filters: SearchFilters)
     async getConversations(userId: string, pagination: PaginationDto)
     async getUnreadCount(userId: string)
   }
   ```

3. **Implement WebSocket Handler**
   ```typescript
   class MessageWebSocketHandler {
     handleConnection(socket: Socket)
     handleMessage(socket: Socket, data: MessageData)
     handleTypingIndicator(socket: Socket, data: TypingData)
     handleReadReceipt(socket: Socket, data: ReadData)
     broadcastToConversation(conversationId: string, event: string, data: any)
   }
   ```

4. **Database Schema Updates**
   ```prisma
   model Conversation {
     id              String        @id @default(uuid())
     type            ConversationType @default(DIRECT)
     participants    ConversationParticipant[]
     messages        Message[]
     lastMessageAt   DateTime?
     createdAt       DateTime      @default(now())
     updatedAt       DateTime      @updatedAt
     archivedAt      DateTime?

     @@index([lastMessageAt])
   }

   model ConversationParticipant {
     id                      String   @id @default(uuid())
     conversationId          String
     conversation            Conversation @relation(fields: [conversationId], references: [id])
     userId                  String
     user                    User     @relation(fields: [userId], references: [id])
     joinedAt                DateTime @default(now())
     leftAt                  DateTime?
     isMuted                 Boolean  @default(false)
     lastReadAt              DateTime?
     notificationPreference  String   @default("all")
     lastDeliveredMessageId  String?

     @@unique([conversationId, userId])
     @@index([userId])
   }

   model Message {
     id              String      @id @default(uuid())
     conversationId  String
     conversation    Conversation @relation(fields: [conversationId], references: [id])
     senderId        String
     sender          User        @relation(fields: [senderId], references: [id])
     type            MessageType @default(TEXT)
     content         String      @db.Text
     mediaUrls       Json?
     metadata        Json?
     isEdited        Boolean     @default(false)
     editedAt        DateTime?
     deletedAt       DateTime?
     createdAt       DateTime    @default(now())

     statuses        MessageStatus[]
     reactions       MessageReaction[]

     @@index([conversationId, createdAt])
     @@index([senderId])
   }

   model MessageStatus {
     id          String    @id @default(uuid())
     messageId   String
     message     Message   @relation(fields: [messageId], references: [id])
     userId      String
     user        User      @relation(fields: [userId], references: [id])
     deliveredAt DateTime?
     readAt      DateTime?

     @@unique([messageId, userId])
     @@index([userId])
   }

   model MessageReaction {
     id        String   @id @default(uuid())
     messageId String
     message   Message  @relation(fields: [messageId], references: [id])
     userId    String
     user      User     @relation(fields: [userId], references: [id])
     reaction  String
     createdAt DateTime @default(now())

     @@unique([messageId, userId, reaction])
   }

   enum ConversationType {
     DIRECT
     GROUP
   }

   enum MessageType {
     TEXT
     IMAGE
     VIDEO
     VOICE
     FILE
     FORM_CHECK
   }
   ```

5. **Implement Pagination**
   - Cursor-based pagination for messages
   - Offset-based pagination for conversations
   - Efficient querying with proper indexes

### Data Models
```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  type: MessageType;
  content: string;
  mediaUrls?: string[];
  metadata?: Record<string, any>;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  statuses?: MessageStatus[];
  reactions?: MessageReaction[];
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participants: ConversationParticipant[];
  lastMessage?: Message;
  lastMessageAt?: Date;
  unreadCount: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationParticipant {
  id: string;
  userId: string;
  user: User;
  joinedAt: Date;
  lastReadAt?: Date;
  isMuted: boolean;
  notificationPreference: 'all' | 'mentions' | 'none';
}

interface SendMessageDto {
  conversationId: string;
  content: string;
  type?: MessageType;
  mediaUrls?: string[];
  metadata?: Record<string, any>;
}

interface PaginationDto {
  limit?: number;
  cursor?: string;
  before?: Date;
  after?: Date;
}

interface SearchFilters {
  query: string;
  conversationId?: string;
  startDate?: Date;
  endDate?: Date;
  messageType?: MessageType;
}
```

## Test Cases
1. **Happy Path**
   - Send text message successfully
   - Receive real-time message
   - View message history with pagination
   - Mark messages as read
   - Edit recent message
   - Delete message
   - Search messages across conversations
   - View conversation list with unread counts

2. **Edge Cases**
   - Empty message validation
   - Message exceeding character limit
   - Edit message after time limit (5 min)
   - Delete other user's message (should fail)
   - Send message to archived conversation
   - Network interruption during send
   - WebSocket disconnection handling
   - Concurrent message updates
   - Special characters and emoji handling

3. **Performance Tests**
   - Load 1000+ messages in conversation
   - Handle 100+ concurrent conversations
   - Search across 10,000+ messages
   - WebSocket message throughput (100 msg/sec)
   - Pagination performance at scale

4. **Security Tests**
   - Message access control (users only see their conversations)
   - Cross-conversation message access prevention
   - Input sanitization (XSS prevention)
   - Rate limiting on message sending
   - SQL injection prevention in search

## UI/UX Mockups
```
+------------------------------------------+
|  Messages                    [Search 🔍]  |
|  +--------------------------------------+ |
|  | 👤 John Doe                 [2]      | |
|  |   Hey, how's the workout going?      | |
|  |   2 min ago                           | |
|  +--------------------------------------+ |
|  | 👤 Jane Smith                        | |
|  |   Thanks for the update!             | |
|  |   1 hour ago                          | |
|  +--------------------------------------+ |
|  | 👤 Mike Johnson                       | |
|  |   See you tomorrow!                  | |
|  |   Yesterday                           | |
|  +--------------------------------------+ |
+------------------------------------------+

+------------------------------------------+
|  ← John Doe                   [⋮]        |
+------------------------------------------+
|  Yesterday                               |
|  [You] Hey! Ready for leg day?           |
|  [John] Absolutely! What's the plan?     |
|                                          |
|  Today                                   |
|  [John] Can we do squats again?          |
|  [You] Sure! I'll program 5x5           |
|  [You] ✓✓✓                               |
|  [John is typing...]                     |
|                                          |
|  [_______________]          [Send 📤]    |
+------------------------------------------+

+------------------------------------------+
|  Search Messages                         |
|  [Search___________________] [Filter ▼]  |
|                                          |
|  Filters:                                |
|  ◉ All conversations                     |
|  ○ Specific conversation                 |
|  Date: [Any ▼]                           |
|  Type: [All ▼]                           |
|                                          |
|  Results:                                |
|  "squats" found in 3 messages            |
|  - John Doe: "Can we do squats..."       |
|  - Jane Smith: "Squats went great..."    |
|  - You: "Let's add squats to..."         |
+------------------------------------------+
```

## Dependencies
- EPIC-002: Authentication system (completed)
- EPIC-003: Client management (completed)
- WebSocket infrastructure (Socket.io)
- Database with proper indexes
- Redis for caching and session management

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for messaging flows
- [ ] WebSocket connection tested
- [ ] Real-time message delivery verified
- [ ] Performance tests passed
- [ ] Security tests passed
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Mobile responsive design verified

## Notes
- This is the foundational story for all messaging features
- WebSocket reconnection logic is critical for reliability
- Message editing time limit should be configurable
- Consider adding message priority flags for future
- Ensure proper cleanup of deleted messages (soft delete)
- Implement message retention policy from the start
- Consider GDPR right to be forgotten (permanent delete option)
