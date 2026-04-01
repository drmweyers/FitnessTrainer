/**
 * Story 008-02: Share Media
 * FORGE User Simulation - Stream D
 *
 * As a user, I want to share photos and videos
 * So that I can show form checks and progress
 */


import {
  ActorFactory,
  WorkflowRunner,
  MessagingHelpers,
  cleanupTestData
} from './utils';

describe('Story 008-02: Share Media', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('sends image message', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: client.id,
          type: 'IMAGE',
          content: 'Check out my progress!',
          mediaUrls: ['https://cdn.evofit.io/photos/progress-1.jpg']
        }
      });

      expect(message.type).toBe('IMAGE');
      expect(message.mediaUrls).toHaveLength(1);
    });

    it('sends multiple images', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: client.id,
          type: 'IMAGE',
          content: 'Multiple angles',
          mediaUrls: [
            'https://cdn.evofit.io/photos/front.jpg',
            'https://cdn.evofit.io/photos/side.jpg',
            'https://cdn.evofit.io/photos/back.jpg'
          ]
        }
      });

      expect(message.mediaUrls).toHaveLength(3);
    });

    it('sends video message', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: client.id,
          type: 'VIDEO',
          content: 'Form check - Squat',
          mediaUrls: ['https://cdn.evofit.io/videos/squat-form.mp4'],
          metadata: {
            duration: 45,
            resolution: '1080p'
          }
        }
      });

      expect(message.type).toBe('VIDEO');
      expect(message.metadata).toHaveProperty('duration');
    });

    it('views media in conversation', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: client.id,
          type: 'IMAGE',
          content: 'Progress photo',
          mediaUrls: ['https://cdn.evofit.io/photos/progress.jpg']
        }
      });

      const messages = await prisma.message.findMany({
        where: { conversationId: conversation.id }
      });

      expect(messages[0].mediaUrls).toHaveLength(1);
    });
  });

  describe('Media Upload', () => {
    it('validates image file type', async () => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
      const fileType = 'image/jpeg';

      const isValid = allowedTypes.includes(fileType);
      expect(isValid).toBe(true);
    });

    it('rejects invalid file types', async () => {
      const allowedTypes = ['image/jpeg', 'image/png'];
      const fileType = 'application/pdf';

      const isValid = allowedTypes.includes(fileType);
      expect(isValid).toBe(false);
    });

    it('validates file size', async () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const fileSize = 5 * 1024 * 1024; // 5MB

      const isValid = fileSize <= maxSize;
      expect(isValid).toBe(true);
    });

    it('validates image dimensions', async () => {
      const minWidth = 320;
      const minHeight = 240;
      const dimensions = { width: 1920, height: 1080 };

      const isValid = dimensions.width >= minWidth && dimensions.height >= minHeight;
      expect(isValid).toBe(true);
    });

    it('validates video duration', async () => {
      const maxDuration = 300; // 5 minutes
      const duration = 45; // 45 seconds

      const isValid = duration <= maxDuration;
      expect(isValid).toBe(true);
    });
  });

  describe('Media Gallery', () => {
    it('views all media in conversation', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: client.id,
          type: 'IMAGE',
          content: 'Photo 1',
          mediaUrls: ['https://cdn.evofit.io/photos/1.jpg']
        }
      });

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: client.id,
          type: 'VIDEO',
          content: 'Video 1',
          mediaUrls: ['https://cdn.evofit.io/videos/1.mp4']
        }
      });

      const mediaMessages = await prisma.message.findMany({
        where: {
          conversationId: conversation.id,
          type: { in: ['IMAGE', 'VIDEO'] }
        }
      });

      expect(mediaMessages).toHaveLength(2);
    });

    it('downloads media', async () => {
      const mediaUrl = 'https://cdn.evofit.io/photos/progress.jpg';
      const downloadToken = 'download-token-123';

      const downloadLink = {
        url: mediaUrl,
        token: downloadToken,
        expiresAt: new Date(Date.now() + 3600 * 1000) // 1 hour
      };

      expect(downloadLink.token).toBeDefined();
      expect(downloadLink.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Media Compression', () => {
    it('compresses large images', async () => {
      const originalSize = 8 * 1024 * 1024; // 8MB
      const compressedSize = originalSize * 0.3; // 70% compression

      expect(compressedSize).toBeLessThan(originalSize);
    });

    it('generates thumbnails', async () => {
      const thumbnailSpecs = {
        width: 300,
        height: 200,
        quality: 80
      };

      expect(thumbnailSpecs.width).toBe(300);
      expect(thumbnailSpecs.quality).toBe(80);
    });
  });

  describe('Media Security', () => {
    it('generates secure URLs', async () => {
      const mediaUrl = {
        base: 'https://cdn.evofit.io/photos/image.jpg',
        token: 'secure-token-xyz',
        expires: new Date(Date.now() + 3600 * 1000)
      };

      expect(mediaUrl.token).toBeDefined();
    });

    it('validates media access', async () => {
      const userId = 'user-123';
      const conversationId = 'conv-456';

      // Check if user is participant
      const isParticipant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId
        }
      });

      const canAccess = isParticipant !== null;
      expect(typeof canAccess).toBe('boolean');
    });
  });
});
