# Story 008-03: Voice Messages

**Parent Epic**: [EPIC-008 - Communication & Messaging](../epics/epic-008-communication-messaging.md)
**Story ID**: STORY-008-03
**Priority**: P1 (High)
**Story Points**: 8
**Sprint**: Sprint 8

## User Story
**As a** user
**I want to** send voice messages
**So that I** can communicate more personally

## Acceptance Criteria
- [ ] Record voice messages with microphone
- [ ] Playback before sending
- [ ] Audio quality settings (low/medium/high)
- [ ] Maximum duration limits (5 minutes)
- [ ] Playback speed control (0.5x, 1x, 1.5x, 2x)
- [ ] Audio waveform display
- [ ] Background playback (continue while navigating app)
- [ ] Visual playback indicator
- [ ] Cancel recording
- [ ] Delete recorded voice message
- [ ] Pause/resume playback
- [ ] Seek within audio
- [ ] Visual recording timer
- [ ] Transcription placeholder (for future)

## Technical Implementation

### Frontend Tasks
1. **Create VoiceRecorder Component**
   - Microphone access and permission handling
   - Recording start/stop controls
   - Recording timer display
   - Visual recording indicator (pulsing animation)
   - Audio level meter (volume visualization)
   - Cancel recording button
   - Maximum duration enforcement

2. **Create AudioWaveform Component**
   - Real-time waveform visualization during recording
   - Static waveform display for playback
   - Canvas-based rendering
   - Color-coded audio levels
   - Playback progress indicator overlay
   - Click-to-seek functionality

3. **Create VoiceMessagePlayer Component**
   - Play/pause button
   - Playback speed selector
   - Duration display (current / total)
   - Seek bar with time scrubbing
   - Audio level visualization
   - Background playback support
   - Auto-play next message in sequence

4. **Create VoiceMessagePreview Component**
   - Preview before sending
   - Playback controls
   - Delete and re-record option
   - Duration and file size display
   - Send button
   - Compression indicator

5. **Implement Audio Recording**
   - MediaRecorder API integration
   - Audio format selection (MP3, AAC, or Opus)
   - Sample rate configuration (16kHz, 44.1kHz, 48kHz)
   - Bitrate settings (32kbps, 64kbps, 128kbps)
   - Noise reduction processing (Web Audio API)
   - Automatic gain control

6. **Implement Audio Compression**
   - Client-side compression before upload
   - Quality presets (low/medium/high)
   - File size optimization
   - Format conversion

7. **Handle Background Playback**
   - Audio session management
   - Interruption handling (calls, other audio)
   - Resume playback after interruption
   - Play/pause from notification (mobile)

### Backend Tasks
1. **Create Voice Message Endpoints**
   ```typescript
   POST /api/messages/voice/upload - Upload voice message
   GET  /api/messages/voice/:id - Get voice message
   GET  /api/messages/voice/:id/transcript - Get transcript (future)
   DELETE /api/messages/voice/:id - Delete voice message
   ```

2. **Implement VoiceMessageService**
   ```typescript
   class VoiceMessageService {
     async uploadVoiceMessage(
       file: Express.Multer.File,
       senderId: string,
       conversationId: string,
       metadata: VoiceMetadata
     ): Promise<VoiceUploadResult>
     async getVoiceMessage(messageId: string, userId: string)
     async deleteVoiceMessage(messageId: string, userId: string)
     async processAudio(file: Buffer, quality: AudioQuality): Promise<Buffer>
     async generateWaveform(audioBuffer: Buffer): Promise<number[]>
     async transcribeAudio(audioId: string): Promise<string> // Future
   }
   ```

3. **Configure Audio Storage**
   - S3/CloudFront for audio files
   - CDN delivery for fast playback
   - Presigned URLs for secure uploads
   - Lifecycle policies (move to cold storage after 90 days)

4. **Database Schema Updates**
   ```prisma
   model VoiceMessage {
     id              String   @id @default(uuid())
     messageId       String   @unique
     message         Message  @relation(fields: [messageId], references: [id])
     uploaderId      String
     uploader        User     @relation(fields: [uploaderId], references: [id])
     duration        Int // seconds
     fileSize        Int // bytes
     format          String // mp3, aac, opus
     sampleRate      Int // Hz
     bitrate         Int // kbps
     quality         AudioQuality
     url             String
     waveform        Json // Array of amplitude values
     transcript      String?  @db.Text
     metadata        Json?
     createdAt       DateTime @default(now())

     @@index([messageId])
     @@index([uploaderId])
   }

   enum AudioQuality {
     LOW
     MEDIUM
     HIGH
   }
   ```

5. **Implement Audio Processing**
   - FFmpeg integration for audio processing
   - Waveform generation algorithm
   - Format conversion
   - Quality optimization
   - Noise reduction (basic)

### Data Models
```typescript
interface VoiceMessage {
  id: string;
  messageId: string;
  uploaderId: string;
  uploader: User;
  duration: number; // seconds
  fileSize: number; // bytes
  format: 'mp3' | 'aac' | 'opus';
  sampleRate: number; // Hz
  bitrate: number; // kbps
  quality: AudioQuality;
  url: string;
  waveform: number[]; // amplitude values for visualization
  transcript?: string;
  metadata?: {
    originalFormat?: string;
    compressionRatio?: number;
    recordingDevice?: string;
  };
  createdAt: Date;
}

interface VoiceMetadata {
  duration: number;
  quality: AudioQuality;
  format: string;
}

interface VoiceUploadResult {
  voiceMessageId: string;
  url: string;
  duration: number;
  waveform: number[];
  fileSize: number;
}

enum AudioQuality {
  LOW = 'LOW',      // 32kbps, 16kHz
  MEDIUM = 'MEDIUM', // 64kbps, 44.1kHz
  HIGH = 'HIGH'     // 128kbps, 48kHz
}

interface RecordingState {
  isRecording: boolean;
  duration: number;
  audioLevels: number[];
  waveform: number[];
}
```

## Test Cases
1. **Happy Path**
   - Record voice message successfully
   - Playback recorded message
   - Change playback speed
   - Seek within audio
   - Delete and re-record
   - Send voice message
   - Receive and play voice message
   - Background playback

2. **Edge Cases**
   - Deny microphone permission
   - Microphone not available
   - Maximum duration reached (auto-stop)
   - Network interruption during upload
   - Corrupted audio file
   - Zero-length recording
   - Very quiet audio (need gain boost)
   - Very loud audio (clipping)

3. **Performance Tests**
   - 5-minute recording
   - Real-time waveform rendering
   - Playback with speed adjustment
   - Background playback performance
   - Multiple voice messages loaded

4. **Security Tests**
   - Microphone permission handling
   - Audio file validation
   - Access control (only conversation participants)
   - Malicious audio file upload

5. **Accessibility Tests**
   - Keyboard controls for playback
   - Screen reader announcements
   - Visual indicators for audio playback
   - Alternative text for waveform

## UI/UX Mockups
```
+------------------------------------------+
|  ← John Doe                   [⋮]        |
+------------------------------------------+
|  [You] Here's a quick tip for your...    |
|  2:15 min ago                            |
|                                          |
|  [John] Thanks! Let me record a...       |
|  1:30 min ago                            |
|         [🎙️ Voice Message: 0:45]         |
|         ▓▓▓▓▓▓▓░░░░░░░░░░░░░ 0:15 / 0:45 |
|         [⏪] [▶️] [⏩]  [1.5x ▼]          |
|                                          |
|  [_______________]          [📤] [Send 📤]|
+------------------------------------------+

+------------------------------------------+
|  Record Voice Message                    |
|                                          |
|         [●] 0:32 / 5:00                  |
|                                          |
|     ╱╱╱╲╲╲╲╲╱╱╱╱╱╲╲╲╲╲╲╲╱╱╱           |
|    ╱╲╲╲╲╲╲╲╱╱╱╱╲╲╲╲╲╲╲╲╱╱╱╱╲╲           |
|   ╲╲╲╲╱╱╱╱╲╲╲╲╲╲╲╲╲╲╱╱╱╲╲╲╲╲╲           |
|                                          |
|         Recording...                     |
|         Quality: High (128 kbps)         |
|                                          |
|         [✕ Cancel]  [⏹ Stop]            |
+------------------------------------------+

+------------------------------------------+
|  Preview Voice Message                   |
|                                          |
|         [🎙️ 0:45]  2.3 MB                |
|                                          |
|         ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░ 0:00 / 0:45 |
|                                          |
|    [⏮] [◀︎] [▶️] [▶︎] [⏹]               |
|         [0.5x] [1x] [1.5x] [2x]         |
|                                          |
|         [🗑 Delete]  [✓ Send]            |
+------------------------------------------+

+------------------------------------------+
|  Voice Message Settings                  |
|                                          |
|  Recording Quality                       |
|  ○ Low  (32 kbps,  ~500 KB/min)         |
|  ● Medium (64 kbps,  ~1 MB/min)          |
|  ○ High  (128 kbps, ~2 MB/min)           |
|                                          |
|  Maximum Duration                        |
|  ● 5 minutes                             |
|  ○ 3 minutes                             |
|  ○ 1 minute                              |
|                                          |
|  [Save Settings]                         |
+------------------------------------------+
```

## Dependencies
- STORY-008-01: Send and Receive Messages (must be completed first)
- AWS S3 or equivalent for audio storage
- CDN for fast audio delivery
- FFmpeg for audio processing
- Web Audio API (browser)
- MediaRecorder API (browser)
- Mobile audio recording permissions

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for voice recording/playback
- [ ] Performance tests for long recordings
- [ ] Security tests for file validation
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Mobile microphone access tested
- [ ] Background playback tested on mobile

## Notes
- Maximum recording duration: 5 minutes (configurable)
- Default quality: Medium (64kbps) for balance
- Supported formats: MP3 (most compatible), AAC, Opus (best compression)
- Waveform resolution: 100 points per second of audio
- Auto-cancel recording if below 1 second
- Consider adding voice-to-text transcription in future
- Accessibility: Ensure keyboard controls work for all playback features
- Privacy: Voice messages should have same retention policy as text messages
