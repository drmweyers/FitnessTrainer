# Story 008-06: Form Check Videos

**Parent Epic**: [EPIC-008 - Communication & Messaging](../epics/epic-008-communication-messaging.md)
**Story ID**: STORY-008-06
**Priority**: P1 (High)
**Story Points**: 13
**Sprint**: Sprint 9

## User Story
**As a** client
**I want to** send form check videos
**So that my** trainer can review my technique

## Acceptance Criteria
- [ ] Dedicated video recording interface
- [ ] Multiple angle support (front, side, rear)
- [ ] Trainer annotation tools (draw on video)
- [ ] Slow-motion playback (0.5x, 0.25x)
- [ ] Side-by-side comparison with reference video
- [ ] Feedback overlay on video
- [ ] Save form checks for reference
- [ ] Privacy controls (who can view)
- [ ] Video quality settings
- [ ] Timestamped comments
- [ ] Frame-by-frame navigation
- [ ] Exercise selection for context
- [ ] Progress tracking over time

## Technical Implementation

### Frontend Tasks
1. **Create FormCheckRecorder Component**
   - Camera access with permission handling
   - Multi-angle recording interface
   - Exercise selection dropdown
   - Recording timer and duration limit
   - Preview before sending
   - Retake option
   - Upload progress indicator

2. **Create VideoAnnotation Component**
   - Canvas overlay on video
   - Drawing tools (line, circle, arrow, freehand)
   - Color selection
   - Line thickness control
   - Clear annotations button
   - Timestamp annotation placement
   - Save annotations to video

3. **Create VideoPlayer Component**
   - Custom video controls
   - Playback speed selector (0.25x, 0.5x, 1x)
   - Frame-by-frame navigation
   - Timeline with comment markers
   - Full-screen mode
   - Screenshot capture
   - Looping section

4. **Create SideBySideComparison Component**
   - Two video players side by side
   - Synchronized playback
   - Reference video library
   - Overlay mode (opacity blend)
   - Sync adjustment (offset alignment)
   - Playback controls for both videos

5. **Create FeedbackOverlay Component**
   - Video player with feedback layer
   - Timestamped feedback display
   - Feedback type indicators (good, improvement needed)
   - Jump to feedback timestamp
   - Add/edit feedback
   - Feedback summary list

6. **Create FormCheckGallery Component**
   - Grid view of form check history
   - Filter by exercise
   - Filter by date range
   - Progress visualization
   - Compare videos over time
   - Download videos

7. **Implement Video Processing**
   - Video compression before upload
   - Thumbnail generation
   - Format conversion (MP4, WebM)
   - Quality settings (360p, 480p, 720p, 1080p)
   - Bandwidth detection for optimal quality

### Backend Tasks
1. **Create Form Check Endpoints**
   ```typescript
   POST /api/form-checks/upload - Upload form check video
   GET  /api/form-checks/:id - Get form check details
   GET  /api/form-checks/conversation/:conversationId - List conversation form checks
   PUT  /api/form-checks/:id/feedback - Add/update feedback
   GET  /api/form-checks/:id/annotations - Get video annotations
   POST /api/form-checks/:id/annotations - Add annotation
   GET  /api/form-checks/exercise/:exerciseId - Get form checks by exercise
   GET  /api/form-checks/progress/:clientId - Get client progress
   DELETE /api/form-checks/:id - Delete form check
   ```

2. **Implement FormCheckService**
   ```typescript
   class FormCheckService {
     async uploadFormCheck(data: UploadFormCheckDto, clientId: string)
     async getFormCheck(id: string, userId: string)
     async addFeedback(id: string, trainerId: string, feedback: FeedbackDto)
     async addAnnotation(id: string, userId: string, annotation: AnnotationDto)
     async getProgress(clientId: string, exerciseId: string)
     async compareFormChecks(checkId1: string, checkId2: string)
     async generateThumbnail(videoUrl: string)
     async compressVideo(videoBuffer: Buffer, quality: VideoQuality)
   }
   ```

3. **Implement Video Processing Service**
   - FFmpeg integration for video processing
   - Thumbnail generation at multiple timestamps
   - Video compression
   - Format conversion
   - Watermarking (optional)

4. **Implement Storage Service**
   - S3/CloudFront for video storage
   - CDN delivery for fast playback
   - Presigned URLs for secure uploads
   - Lifecycle policies (move to cold storage after 180 days)

5. **Database Schema Updates**
   ```prisma
   model FormCheck {
     id              String   @id @default(uuid())
     messageId       String   @unique
     message         Message  @relation(fields: [messageId], references: [id])
     conversationId  String
     conversation    Conversation @relation(fields: [conversationId], references: [id])
     clientId        String
     client          User     @relation(fields: [clientId], references: [id])
     trainerId       String
     trainer         User     @relation("TrainerFormChecks", fields: [trainerId], references: [id])
     exerciseId      String
     exercise        Exercise @relation(fields: [exerciseId], references: [id])
     angles          Json // Array of angle recordings
     primaryVideoUrl String
     secondaryVideoUrl String?
     thumbnailUrl    String
     duration        Int // seconds
     quality         VideoQuality
     fileSizes       Json // Size of each video file
     privacy         FormCheckPrivacy @default(PRIVATE)
     feedback        Json? // Array of feedback items
     annotations     Json? // Array of annotations
     referenceVideoUrl String? // For comparison
     status          FormCheckStatus @default(PENDING_REVIEW)
     createdAt       DateTime @default(now())
     updatedAt       DateTime @updatedAt
     reviewedAt      DateTime?

     @@index([conversationId])
     @@index([clientId])
     @@index([trainerId])
     @@index([exerciseId])
     @@index([createdAt])
   }

   model FormCheckFeedback {
     id              String   @id @default(uuid())
     formCheckId     String
     formCheck       FormCheck @relation(fields: [formCheckId], references: [id])
     trainerId       String
     trainer         User     @relation(fields: [trainerId], references: [id])
     timestamp       Float // Seconds into video
     type            FeedbackType
     comment         String   @db.Text
     annotationData  Json? // Drawing coordinates, etc.
     createdAt       DateTime @default(now())

     @@index([formCheckId])
     @@index([trainerId])
   }

   model ReferenceVideo {
     id              String   @id @default(uuid())
     exerciseId      String
     exercise        Exercise @relation(fields: [exerciseId], references: [id])
     title           String
     description     String?
     videoUrl        String
     thumbnailUrl    String
     duration        Int
     uploadedBy      String // Admin/trainer ID
     isPublic        Boolean  @default(true)
     tags            Json?
     createdAt       DateTime @default(now())

     @@index([exerciseId])
     @@index([isPublic])
   }

   enum VideoQuality {
     LOW_360P
     MEDIUM_480P
     HIGH_720P
     FULL_HD_1080P
   }

   enum FormCheckPrivacy {
     PRIVATE // Only trainer and client
     SHARED // Can be shared as example
     PUBLIC // Public library
   }

   enum FormCheckStatus {
     PENDING_REVIEW
     IN_REVIEW
     REVIEWED
     NEEDS_RESUBMIT
   }

   enum FeedbackType {
     POSITIVE
     IMPROVEMENT_NEEDED
     CORRECTION
     TIP
   }
   ```

6. **Implement Video Streaming**
   - HLS (HTTP Live Streaming) for adaptive bitrate
   - Chunked video delivery
   - Progressive download fallback
   - Bandwidth detection

### Data Models
```typescript
interface FormCheck {
  id: string;
  messageId: string;
  conversationId: string;
  clientId: string;
  client: User;
  trainerId: string;
  trainer: User;
  exerciseId: string;
  exercise: Exercise;
  angles: VideoAngle[];
  primaryVideoUrl: string;
  secondaryVideoUrl?: string;
  thumbnailUrl: string;
  duration: number;
  quality: VideoQuality;
  fileSizes: Record<string, number>;
  privacy: FormCheckPrivacy;
  feedback?: FormCheckFeedback[];
  annotations?: VideoAnnotation[];
  referenceVideoUrl?: string;
  status: FormCheckStatus;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
}

interface VideoAngle {
  type: 'front' | 'side' | 'rear' | 'other';
  videoUrl: string;
  duration: number;
}

interface FormCheckFeedback {
  id: string;
  formCheckId: string;
  trainerId: string;
  timestamp: number; // Seconds into video
  type: FeedbackType;
  comment: string;
  annotationData?: {
    type: 'line' | 'circle' | 'arrow' | 'freehand';
    coordinates: number[][];
    color: string;
    thickness: number;
  };
  createdAt: Date;
}

interface VideoAnnotation {
  id: string;
  formCheckId: string;
  timestamp: number;
  type: 'line' | 'circle' | 'arrow' | 'freehand' | 'text';
  coordinates: number[][];
  color: string;
  thickness: number;
  text?: string;
  createdBy: string;
  createdAt: Date;
}

interface UploadFormCheckDto {
  exerciseId: string;
  primaryVideo: File;
  secondaryVideo?: File;
  angles: VideoAngle[];
  quality: VideoQuality;
  privacy: FormCheckPrivacy;
}

interface ProgressData {
  exerciseId: string;
  exerciseName: string;
  formChecks: FormCheck[];
  improvementScore: number;
  trend: 'improving' | 'stable' | 'declining';
  nextReviewDate?: Date;
}
```

## Test Cases
1. **Happy Path**
   - Record form check video
   - Upload with exercise context
   - Trainer reviews and adds feedback
   - Trainer adds annotations
   - Client views feedback
   - Compare with previous form check
   - Side-by-side with reference video
   - Playback at slow speed
   - Frame-by-frame review

2. **Edge Cases**
   - Camera permission denied
   - Video upload failure
   - Corrupted video file
   - Very long video (>5 minutes)
   - Network interruption during upload
   - Invalid exercise ID
   - Reference video not available
   - Annotations overlapping

3. **Performance Tests**
   - Upload 1080p video (50MB+)
   - Video processing time
   - Streaming playback performance
   - Side-by-side video sync
   - Load 100+ form checks in gallery
   - Generate progress report

4. **Security Tests**
   - Access control (only assigned trainer can view)
   - Privacy setting enforcement
   - Video file validation
   - Malicious file upload prevention

## UI/UX Mockups
```
+------------------------------------------+
|  Form Check Upload                       |
|                                          |
|  Exercise                                |
|  | [Barbell Squat ▼]                     |
|                                          |
|  Recording Angles                        |
|  [✓] Front  [✓] Side  [ ] Rear           |
|                                          |
|  Video Quality                           |
|  ● 720p (Recommended)                    |
|  ○ 480p (Faster upload)                  |
|  ○ 1080p (Best quality)                  |
|                                          |
|  Privacy                                 |
|  ● Private (Only me and my trainer)      |
|  ○ Shared (Trainer can use as example)   |
|                                          |
|  [+ Record New Video]                    |
|                                          |
|  Videos Recorded (2)                     |
|  +--------------------------------------+ |
|  | [📹] Front View    0:45  [Remove]   | |
|  | [📹] Side View     0:45  [Remove]   | |
|  +--------------------------------------+ |
|                                          |
|  [Send Form Check]      [Cancel]         |
+------------------------------------------+

+------------------------------------------|
|  Barbell Squat - Form Check Review       |
|                                          |
|  Client: John Doe  |  Date: Jan 15, 2025 |
|                                          |
|  +--------------------------------------+ |
|  |                                       | |
|  |      [Video Player]                  | |
|  |                                       | |
|  |  0:12 ████████░░░░░░░░░░░ 0:45        | |
|  |                                       | |
|  |  [◀︎] [▶️] [▶︎]  [0.5x ▼]            | |
|  |                                       | |
|  |  Annotation Tools:                   | |
|  |  [━] [○] [→] [✏️] [✕]               | |
|  +--------------------------------------+ |
|                                          |
|  Feedback Timeline                       |
|  +--------------------------------------+ |
|  | [⭐] 0:08 - Great depth!             | |
|  | [⚠️] 0:15 - Knees caving in...       | |
|  | [💡] 0:22 - Keep chest up            | |
|  | [+] Add feedback at current time     | |
|  +--------------------------------------+ |
|                                          |
|  [Add Comment] [Compare] [Save Feedback] |
+------------------------------------------+

+------------------------------------------|
|  Side by Side Comparison                 |
|                                          |
|  Your Form Check          Reference Video |
|  +-----------------------+---------------+|
|  | [Video 1]             | [Video 2]     ||
|  |                       |               ||
|  | 0:15 ████████░░░░░    | 0:15 ████████░||
|  +-----------------------+---------------+|
|                                          |
|  [◀︎] [▶️] [▶︎]  Sync: [○]  [Opacity ▼] |
|                                          |
|  Offset Adjustment:                      |
|  [━━━○━━━] -0.5s                        |
|                                          |
|  [Close Comparison]                      |
+------------------------------------------+

+------------------------------------------|
|  Form Check Progress - Barbell Squat     |
|                                          |
|  Improvement Trend: 📈 Improving         |
|  Score: 78/100 (+12 from last review)    |
|                                          |
|  +--------------------------------------+ |
|  | Jan 15  ⭐⭐⭐⭐☆  78/100             | |
|  | [Thumbnail]                           | |
|  +--------------------------------------+ |
|  | Jan 8   ⭐⭐⭐☆☆  66/100             | |
|  | [Thumbnail]                           | |
|  +--------------------------------------+ |
|  | Jan 1   ⭐⭐⭐☆☆  65/100             | |
|  | [Thumbnail]                           | |
|  +--------------------------------------+ |
|                                          |
|  [View All] [Record New Check]           |
+------------------------------------------+
```

## Dependencies
- STORY-008-01: Send and Receive Messages
- STORY-008-02: Share Media
- EPIC-001: Exercise Library
- AWS S3 or equivalent for video storage
- FFmpeg for video processing
- HLS streaming service
- Camera access on device

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for form check workflow
- [ ] Video recording tested on iOS and Android
- [ ] Annotation tools tested
- [ ] Side-by-side comparison tested
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Sample reference videos created

## Notes
- Maximum video duration: 5 minutes per angle
- Recommended quality: 720p for balance
- Supported angles: Front, Side, Rear, Custom
- Video format: MP4 (H.264)
- Privacy levels: Private, Shared, Public
- Retention period: 1 year, then archive
- Future: AI-powered form analysis
- Future: Automatic improvement suggestions
- Future: Integration with wearables for form data
- Accessibility: Ensure video players are keyboard accessible
- GDPR: Allow clients to delete all their form check data
