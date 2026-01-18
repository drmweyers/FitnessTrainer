# Story 008-08: Conversation Export

**Parent Epic**: [EPIC-008 - Communication & Messaging](../epics/epic-008-communication-messaging.md)
**Story ID**: STORY-008-08
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 10

## User Story
**As a** trainer
**I want to** export conversations
**So that I** can maintain records

## Acceptance Criteria
- [ ] Export conversation to PDF
- [ ] Date range selection
- [ ] Include/exclude media files option
- [ ] Include metadata (timestamps, read receipts)
- [ ] Batch export multiple conversations
- [ ] Secure download with authentication
- [ ] Export audit trail
- [ ] GDPR compliance (data portability)
- [ ] Export to JSON format
- [ ] Export status tracking
- [ ] Email export on completion
- [ ] Conversation search before export
- [ ] Redact sensitive information option

## Technical Implementation

### Frontend Tasks
1. **Create ExportWizard Component**
   - Step-by-step export process
   - Conversation selection
   - Date range picker
   - Export options (format, include media, etc.)
   - Preview before export
   - Progress tracking
   - Download completion

2. **Create ConversationSelector Component**
   - List all conversations with checkboxes
   - Search/filter conversations
   - Select all/none
   - Conversation preview
   - Message count display

3. **Create ExportOptions Component**
   - Format selection (PDF, JSON, CSV)
   - Date range inputs
   - Include media toggle
   - Include metadata toggle
   - Redact sensitive info toggle
   - Email on completion toggle

4. **Create ExportProgress Component**
   - Progress bar for export
   - Current step indicator
   - Estimated time remaining
   - Export status messages
   - Cancel export button

5. **Create ExportHistory Component**
   - List of past exports
   - Export date and size
   - Re-download option
   - Delete export files
   - Export status indicators

6. **Implement PDF Generation**
   - Client-side PDF generation (jsPDF)
   - Format messages for readability
   - Include media thumbnails
   - Add cover page with metadata
   - Table of contents
   - Page numbers

### Backend Tasks
1. **Create Export Endpoints**
   ```typescript
   POST /api/messages/export/request - Request export
   GET  /api/messages/export/:id - Get export status
   GET  /api/messages/export/:id/download - Download export
   GET  /api/messages/export/history - List exports
   DELETE /api/messages/export/:id - Delete export file
   POST /api/messages/export/:id/email - Email export file
   ```

2. **Implement ExportService**
   ```typescript
   class ExportService {
     async requestExport(userId: string, options: ExportOptions)
     async processExport(exportId: string)
     async generatePDF(conversationId: string, options: ExportOptions)
     async generateJSON(conversationId: string, options: ExportOptions)
     async generateCSV(conversationId: string, options: ExportOptions)
     async packageMedia(mediaUrls: string[]): Promise<string>
     async createAuditTrail(exportId: string, metadata: ExportMetadata)
     async cleanupExpiredExports()
     async sendExportEmail(exportId: string, email: string)
   }
   ```

3. **Implement Background Job Processing**
   - Queue export jobs
   - Process large exports asynchronously
   - Update progress status
   - Handle export failures
   - Retry failed exports
   - Send completion notifications

4. **Database Schema Updates**
   ```prisma
   model MessageExport {
     id              String   @id @default(uuid())
     userId          String
     user            User     @relation(fields: [userId], references: [id])
     type            ExportType
     format          ExportFormat
     conversationIds Json
     dateRangeStart  DateTime?
     dateRangeEnd    DateTime?
     includeMedia    Boolean  @default(false)
     includeMetadata Boolean  @default(true)
     redactSensitive Boolean  @default(false)
     status          ExportStatus @default(PENDING)
     fileUrl         String?
     fileSize        Int?
     progress        Int      @default(0)
     errorMessage    String?
     completedAt     DateTime?
     expiresAt       DateTime
     createdAt       DateTime @default(now())

     @@index([userId, status])
     @@index([userId, createdAt])
     @@index([expiresAt])
   }

   model ExportAuditTrail {
     id              String   @id @default(uuid())
     exportId        String
     export          MessageExport @relation(fields: [exportId], references: [id])
     action          String
     actorId         String
     actorIp         String?
     metadata        Json?
     createdAt       DateTime @default(now())

     @@index([exportId])
     @@index([actorId])
   }

   enum ExportType {
     SINGLE_CONVERSATION
     MULTIPLE_CONVERSATIONS
     ALL_CONVERSATIONS
     CLIENT_DATA
   }

   enum ExportFormat {
     PDF
     JSON
     CSV
     ZIP
   }

   enum ExportStatus {
     PENDING
     PROCESSING
     COMPLETED
     FAILED
     EXPIRED
   }
   ```

5. **Implement Media Packaging**
   - Download media files from storage
   - Create ZIP archive
   - Generate thumbnails for PDF
   - Optimize file sizes
   - Include media metadata

6. **Implement PDF Generation Service**
   - HTML to PDF conversion
   - Message formatting
   - Media embedding
   - Metadata inclusion
   - Pagination
   - Cover page generation

7. **Implement Security Measures**
   - Authentication for download
   - Signed URLs for secure download
   - Access control validation
   - Rate limiting
   - Export file encryption (optional)

### Data Models
```typescript
interface MessageExport {
  id: string;
  userId: string;
  type: ExportType;
  format: ExportFormat;
  conversationIds: string[];
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  includeMedia: boolean;
  includeMetadata: boolean;
  redactSensitive: boolean;
  status: ExportStatus;
  fileUrl?: string;
  fileSize?: number;
  progress: number; // 0-100
  errorMessage?: string;
  completedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

interface ExportOptions {
  conversationIds: string[];
  format: ExportFormat;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeMedia: boolean;
  includeMetadata: boolean;
  redactSensitive: boolean;
  emailOnComplete?: boolean;
}

interface ExportMetadata {
  requestedBy: string;
  requestedAt: Date;
  conversationCount: number;
  messageCount: number;
  mediaCount: number;
  fileSize: number;
}

interface ExportProgress {
  exportId: string;
  status: ExportStatus;
  progress: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
  error?: string;
}

interface PDFExportData {
  title: string;
  participants: Participant[];
  dateRange: string;
  messages: ExportedMessage[];
  media: ExportedMedia[];
  metadata: ExportMetadata;
}

interface ExportedMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  type: string;
  mediaUrls?: string[];
  metadata?: Record<string, any>;
}
```

## Test Cases
1. **Happy Path**
   - Export single conversation to PDF
   - Export multiple conversations
   - Export with date range filter
   - Export with media included
   - Export to JSON format
   - Download completed export
   - Email export on completion
   - Redact sensitive information

2. **Edge Cases**
   - Export conversation with no messages
   - Export very large conversation (10,000+ messages)
   - Export with future date range
   - Export with invalid conversation IDs
   - Export cancellation
   - Export failure (storage error)
   - Expired export file download

3. **Performance Tests**
   - Export 100 conversations
   - Export 50,000 messages
   - Package 1000 media files
   - Generate 100-page PDF
   - Background job queue performance
   - Concurrent export requests

4. **Security Tests**
   - Access control (only own conversations)
   - Export download authentication
   - Signed URL expiration
   - Sensitive data redaction
   - GDPR data portability
   - Audit trail integrity

5. **Compliance Tests**
   - GDPR right to data portability
   - Data retention policy
   - Audit trail completeness
   - Secure file deletion

## UI/UX Mockups
```
+------------------------------------------+
|  Export Conversations                     |
|                                          |
|  Step 1 of 3: Select Conversations       |
|                                          |
|  [✓] Select All                          |
|                                          |
|  Search: [Search conversations___________]|
|                                          |
|  +--------------------------------------+ |
|  | [✓] John Doe               47 msgs   | |
|  | [✓] Jane Smith             123 msgs  | |
|  | [✓] Mike Johnson           89 msgs   | |
|  | [✓] Sarah Williams         256 msgs  | |
|  | [✓] Tom Brown              34 msgs   | |
|  +--------------------------------------+ |
|                                          |
|  Selected: 5 conversations | 549 msgs   |
|                                          |
|  [Back] [Next: Options]                  |
+------------------------------------------+

+------------------------------------------+
|  Export Conversations                     |
|                                          |
|  Step 2 of 3: Export Options             |
|                                          |
|  Export Format                           |
|  ◉ PDF (Readable document)               |
|  ○ JSON (Machine-readable data)          |
|  ○ CSV (Spreadsheet format)              |
|                                          |
|  Date Range                              |
|  [ ] All time                            |
|  [●] Custom range                        |
|    From: [January 1, 2025 ▼]            |
|    To: [January 15, 2025 ▼]             |
|                                          |
|  Options                                 |
|  [✓] Include media files                |
|  [✓] Include metadata                   |
|  [✓] Redact sensitive information       |
|  [✓] Email when complete                 |
|                                          |
|  Estimated size: ~45 MB                  |
|  Estimated time: ~2 minutes              |
|                                          |
|  [Back] [Next: Review]                   |
+------------------------------------------+

+------------------------------------------+
|  Export Conversations                     |
|                                          |
|  Step 3 of 3: Review & Export            |
|                                          |
|  Export Summary                          |
|  • 5 conversations                       |
|  • 549 messages                          |
|  • 47 media files                        |
|  • Format: PDF                           |
|  • Date range: Jan 1 - Jan 15, 2025      |
|                                          |
|  Preview (first page)                    |
|  +--------------------------------------+ |
|  | Conversation: John Doe               | |
|  | Dates: Jan 1 - Jan 15, 2025          | |
|  |                                      | |
|  | Jan 1, 2025 9:15 AM                  | |
|  | John Doe: Hey, ready for...         | |
|  |                                      | |
|  | Jan 1, 2025 9:20 AM                  | |
|  | You: Absolutely! Let's start with...| |
|  +--------------------------------------+ |
|                                          |
|  [Back] [Start Export]                   |
+------------------------------------------+

+------------------------------------------+
|  Exporting...                             |
|                                          |
|  Please wait while we prepare your export|
|                                          |
|  Progress: ████████████░░░░░░░ 67%       |
|                                          |
|  Current step: Packaging media files...  |
|                                          |
|  Estimated time remaining: 45 seconds    |
|                                          |
|  You can close this window. We'll email  |
|  you when the export is ready.           |
|                                          |
|  [Cancel Export]                         |
+------------------------------------------+

+------------------------------------------+
|  Export Complete!                         |
|                                          |
|  Your export is ready to download.       |
|                                          |
|  Export Details:                         |
|  • 5 conversations                       |
|  • 549 messages                          |
|  • 47 media files                        |
|  • File size: 43.2 MB                    |
|  • Format: PDF                           |
|                                          |
|  [Download Export]                       |
|  [View Export History]                   |
|                                          |
|  This file will expire on Feb 15, 2025.  |
+------------------------------------------+

+------------------------------------------+
|  Export History                          |
|                                          |
|  [+ New Export]                           |
|                                          |
|  +--------------------------------------+ |
|  | Jan 15, 2025                         | |
|  | 5 conversations • 549 messages       | |
|  | PDF • 43.2 MB                        | |
|  | [Download] [Delete]                  | |
|  +--------------------------------------+ |
|  | Jan 10, 2025                         | |
|  | 2 conversations • 123 messages       | |
|  | JSON • 2.1 MB                        | |
|  | [Download] [Delete]                  | |
|  +--------------------------------------+ |
|  | Jan 5, 2025                          | |
|  | Expired                              | |
|  +--------------------------------------+ |
+------------------------------------------+
```

## Dependencies
- STORY-008-01: Send and Receive Messages
- PDF generation library (jsPDF, Puppeteer)
- Background job processor (Bull, Agenda)
- File storage (S3)
- Email service (SendGrid, AWS SES)
- ZIP compression library (archiver)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for export workflow
- [ ] PDF generation tested
- [ ] Media packaging tested
- [ ] Security tests passed
- [ ] GDPR compliance verified
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Export performance benchmarks met

## Notes
- Export retention: 30 days, then auto-delete
- Maximum export size: 1 GB, recommend splitting
- Supported formats: PDF, JSON, CSV
- PDF page size: Letter (8.5" x 11")
- Media in PDF: Thumbnails with captions, full files in ZIP
- Redaction patterns: Phone numbers, email addresses, credit cards
- Rate limiting: 5 exports per day per user
- Background job timeout: 30 minutes
- Email notification: Sent when export completes or fails
- GDPR: Provide complete data export for data portability requests
- Security: Encrypt exported files at rest
- Accessibility: Ensure PDF exports are accessible (tagged PDF)
- Future: Add more export formats (HTML, XML)
- Future: Schedule automatic recurring exports
