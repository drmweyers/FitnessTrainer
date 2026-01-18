# Story 008-02: Share Media

**Parent Epic**: [EPIC-008 - Communication & Messaging](../epics/epic-008-communication-messaging.md)
**Story ID**: STORY-008-02
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 8

## User Story
**As a** user
**I want to** share photos and videos
**So that I** can demonstrate form or show progress

## Acceptance Criteria
- [ ] Photo upload from device gallery
- [ ] Camera integration for in-app capture
- [ ] Video upload with size limits
- [ ] Automatic file compression
- [ ] Thumbnail previews in chat
- [ ] Full-screen media viewing
- [ ] Download media option
- [ ] Media gallery organization
- [ ] Multiple file selection
- [ ] Upload progress indicator
- [ ] Cancel upload functionality
- [ ] Image preview before sending
- [ ] Video trimming support (optional)
- [ ] Metadata preservation

## Technical Implementation

### Frontend Tasks
1. **Create MediaUploader Component**
   - File picker integration (multiple file support)
   - Camera capture integration
   - Drag-and-drop file upload
   - Upload progress tracking
   - File validation (size, type, dimensions)
   - Client-side compression before upload
   - Preview thumbnails

2. **Create MediaViewer Component**
   - Full-screen image viewer
   - Video player with controls
   - Swipe navigation between media
   - Zoom in/out functionality
   - Download button
   - Share button
   - Metadata display (date, size, dimensions)
   - Close with swipe down

3. **Create MediaThumbnail Component**
   - Generate thumbnail for images
   - Generate video preview thumbnail
   - Play icon overlay for videos
   - File size indicator
   - Duration display for videos
   - Lazy loading for performance

4. **Create MediaGallery Component**
   - Grid view of shared media
   - Filter by type (image/video)
   - Filter by date range
   - Filter by sender
   - Download all media option
   - Share to social media (optional)

5. **Implement File Compression**
   - Client-side image compression (Canvas API)
   - Video compression (FFmpeg.wasm or similar)
   - Quality settings
   - Maximum size enforcement

6. **Create UploadProgress Component**
   - Progress bar for each file
   - Upload speed indicator
   - Estimated time remaining
   - Cancel button per file
   - Retry failed uploads

### Backend Tasks
1. **Create Media Endpoints**
   ```typescript
   POST /api/messages/media/upload - Upload media file
   GET  /api/messages/media/:id - Get media file
   GET  /api/messages/media/:id/thumbnail - Get thumbnail
   DELETE /api/messages/media/:id - Delete media file
   GET  /api/messages/conversations/:id/media - Get conversation media
   ```

2. **Implement MediaService**
   ```typescript
   class MediaService {
     async uploadMedia(
       file: Express.Multer.File,
       uploaderId: string,
       conversationId: string
     ): Promise<MediaUploadResult>
     async getMedia(mediaId: string, userId: string)
     async getThumbnail(mediaId: string)
     async deleteMedia(mediaId: string, userId: string)
     async getConversationMedia(conversationId: string, filters: MediaFilters)
     async compressImage(buffer: Buffer, quality: number): Promise<Buffer>
     async generateThumbnail(buffer: Buffer, mediaType: string): Promise<Buffer>
     async validateFile(file: Express.Multer.File): Promise<ValidationResult>
   }
   ```

3. **Configure Storage Service**
   - S3/CloudFront integration
   - CDN configuration for fast delivery
   - Presigned URLs for secure uploads
   - Lifecycle policies for old media
   - Backup and redundancy

4. **Database Schema Updates**
   ```prisma
   model Media {
     id              String   @id @default(uuid())
     conversationId  String
     conversation    Conversation @relation(fields: [conversationId], references: [id])
     messageId       String
     message         Message  @relation(fields: [messageId], references: [id])
     uploaderId      String
     uploader        User     @relation(fields: [uploaderId], references: [id])
     type            MediaType
     originalName    String
     mimeType        String
     size            Int
     width           Int?
     height          Int?
     duration        Int? // For video in seconds
     url             String
     thumbnailUrl    String?
     metadata        Json?
     createdAt       DateTime @default(now())

     @@index([conversationId])
     @@index([messageId])
     @@index([uploaderId])
   }

   enum MediaType {
     IMAGE
     VIDEO
     AUDIO
     DOCUMENT
   }
   ```

5. **Implement File Upload Handler**
   - Multer configuration for multipart uploads
   - Chunked upload for large files
   - Virus scanning integration (ClamAV)
   - Duplicate detection (hash-based)

6. **Create Background Jobs**
   - Thumbnail generation job
   - Compression job queue
   - CDN cache invalidation
   - Cleanup orphaned media

### Data Models
```typescript
interface Media {
  id: string;
  conversationId: string;
  messageId: string;
  uploaderId: string;
  uploader: User;
  type: MediaType;
  originalName: string;
  mimeType: string;
  size: number; // bytes
  width?: number; // pixels
  height?: number; // pixels
  duration?: number; // seconds for video
  url: string;
  thumbnailUrl?: string;
  metadata?: {
    compressionRatio?: number;
    uploadDuration?: number;
    deviceInfo?: string;
  };
  createdAt: Date;
}

interface MediaUploadResult {
  mediaId: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  compressedSize?: number;
}

interface MediaFilters {
  type?: MediaType;
  senderId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'uploading' | 'compressing' | 'complete' | 'error';
  speed?: number; // bytes/sec
  eta?: number; // seconds
  error?: string;
}

enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT'
}
```

## Test Cases
1. **Happy Path**
   - Upload single photo
   - Upload multiple photos (up to 10)
   - Upload video file
   - Capture photo from camera
   - View media in full screen
   - Download media file
   - Delete shared media
   - Browse conversation media gallery

2. **Edge Cases**
   - File size exceeds limit (max 50MB for video, 10MB for image)
   - Unsupported file format
   - Corrupted file upload
   - Network interruption during upload
   - Upload cancellation
   - Zero-byte file
   - Extremely large image resolution
   - Very long video duration

3. **Performance Tests**
   - Upload 100MB video file
   - Compress 4K image to reasonable size
   - Generate thumbnail for 10-minute video
   - Load 100 media items in gallery
   - CDN delivery speed test

4. **Security Tests**
   - Malicious file upload (EXE, JS)
   - File type spoofing detection
   - Access control (only conversation participants)
   - Presigned URL expiration
   - Virus scanning integration

## UI/UX Mockups
```
+------------------------------------------+
|  ← John Doe                   [⋮]        |
+------------------------------------------+
|  [You] Check out my form!                |
|         [📸 Image Thumbnail] [▶️ 0:45]   |
|                                          |
|  [John] Looking good! But lower your...  |
|                                          |
|  [_______________]          [📎] [Send 📤]|
+------------------------------------------+

+------------------------------------------+
|  Upload Media                            |
|                                          |
|  [Choose from Gallery] [📷 Camera]       |
|                                          |
|  Selected Files (3)                      |
|  +--------------------------------------+ |
|  | [📸] IMG_001.jpg          [Remove]   | |
|  |     2.4 MB → 1.1 MB ✓ 100%          | |
|  +--------------------------------------+ |
|  | [🎬] MOV_002.mp4          [Remove]   | |
|  |     45.3 MB → 12.8 MB 78% ████████▒│ |
|  |     [Cancel]                          | |
|  +--------------------------------------+ |
|  | [📸] IMG_003.jpg          [Remove]   | |
|  |     3.1 MB → 1.4 MB ✓ 100%          | |
|  +--------------------------------------+ |
|                                          |
|  [Add More Files]                        |
|                                          |
|  [Send 3 Files]          [Cancel]        |
+------------------------------------------+

+------------------------------------------+
|  Media Gallery                           |
|  [All ▼] [Any Date ▼] [All Senders ▼]   |
|                                          |
|  +---+---+---+                           |
|  |📸 |🎬 |📸 |                            |
|  +---+---+---+                           |
|  |🎬 |📸 |📸 |                            |
|  +---+---+---+                           |
|  |📸 |🎬 |📸 |                            |
|  +---+---+---+                           |
|                                          |
|  24 items  |  Download All               |
+------------------------------------------+

+------------------------------------------+
|  [←] [→]                                 |
|                                          |
|         [Full Screen Image]              |
|                                          |
|         Squat Form - Side View           |
|         Jan 15, 2025 • 2.4 MB            |
|                                          |
|         [📥 Download] [↗️ Share]          |
|                                          |
|  [×] Close                               |
+------------------------------------------+
```

## Dependencies
- STORY-008-01: Send and Receive Messages (must be completed first)
- AWS S3 or equivalent storage service
- CDN (CloudFront or similar)
- Image compression library (sharp for Node.js)
- Video processing library (FFmpeg)
- Virus scanning service (optional)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for media upload/download
- [ ] Performance tests for large files
- [ ] Security tests for file validation
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] CDN configured and tested
- [ ] Mobile responsive design verified

## Notes
- File size limits: Images 10MB, Videos 50MB
- Compression quality: Images 85%, Videos medium preset
- Thumbnail size: 300x300px for images, first frame for videos
- Retention period: 90 days, then move to cold storage
- Consider implementing bandwidth detection for mobile users
- GDPR: Allow users to delete all their media data
- Accessibility: Add alt text for images, captions for videos
