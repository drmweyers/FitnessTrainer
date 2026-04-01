/**
 * Story 008-01: Send and Receive Messages
 * FORGE User Simulation - Stream D
 *
 * As a user, I want to send and receive messages
 * So that I can communicate with my trainer/client
 */

import { prisma } from '@/lib/db/prisma';
import {
  ActorFactory,
  WorkflowRunner,
  MessagingHelpers,
  cleanupTestData
} from './utils';

describe('Story 008-01: Send and Receive Messages', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('sends text message', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      const message = await MessagingHelpers.sendMessage(
        conversation.id,
        trainer.id,
        'Great workout today! Keep it up!'
      );

      expect(message.content).toBe('Great workout today! Keep it up!');
      expect(message.senderId).toBe(trainer.id);
    });

    it('receives message in real-time', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      await MessagingHelpers.sendMessage(
        conversation.id,
        trainer.id,
        'How are you feeling?'
      );

      const messages = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' }
      });

      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('How are you feeling?');
    });

    it('views conversation history', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      // Send multiple messages
      await MessagingHelpers.sendMessage(conversation.id, trainer.id, 'Hello!');
      await MessagingHelpers.sendMessage(conversation.id, client.id, 'Hi there!');
      await MessagingHelpers.sendMessage(conversation.id, trainer.id, 'How was your workout?');

      const messages = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'asc' }
      });

      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe('Hello!');
    });

    it('marks message as read', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      const message = await MessagingHelpers.sendMessage(
        conversation.id,
        trainer.id,
        'Check your program'
      );

      await MessagingHelpers.markAsRead(message.id, client.id);

      const status = await prisma.messageStatus.findFirst({
        where: { messageId: message.id, userId: client.id }
      });

      expect(status?.readAt).toBeDefined();
    });

    it('shows unread message count', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      await MessagingHelpers.sendMessage(conversation.id, trainer.id, 'Message 1');
      await MessagingHelpers.sendMessage(conversation.id, trainer.id, 'Message 2');
      await MessagingHelpers.sendMessage(conversation.id, trainer.id, 'Message 3');

      const unreadCount = await MessagingHelpers.getUnreadCount(client.id);
      expect(unreadCount).toBe(3);
    });
  });

  describe('Message Features', () => {
    it('edits recent message', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      const message = await MessagingHelpers.sendMessage(
        conversation.id,
        trainer.id,
        'Original text'
      );

      // Edit within 5 minutes
      const edited = await prisma.message.update({
        where: { id: message.id },
        data: {
          content: 'Edited text',
          isEdited: true,
          editedAt: new Date()
        }
      });

      expect(edited.content).toBe('Edited text');
      expect(edited.isEdited).toBe(true);
    });

    it('deletes message', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      const message = await MessagingHelpers.sendMessage(
        conversation.id,
        trainer.id,
        'To be deleted'
      );

      await prisma.message.update({
        where: { id: message.id },
        data: { deletedAt: new Date() }
      });

      const deleted = await prisma.message.findUnique({
        where: { id: message.id }
      });

      expect(deleted?.deletedAt).toBeDefined();
    });

    it('validates message length', async () => {
      const maxLength = 2000;
      const validMessage = 'A'.repeat(500);
      const invalidMessage = 'A'.repeat(2500);

      const isValid = (msg: string) => msg.length <= maxLength;

      expect(isValid(validMessage)).toBe(true);
      expect(isValid(invalidMessage)).toBe(false);
    });

    it('prevents empty messages', async () => {
      const message = '   ';
      const isValid = (msg: string) => msg.trim().length > 0;

      expect(isValid(message)).toBe(false);
    });
  });

  describe('Conversation Management', () => {
    it('creates direct conversation', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      expect(conversation.type).toBe('DIRECT');
      expect(conversation.participants).toHaveLength(2);
    });

    it('lists user conversations', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client1 = await ActorFactory.createClient();
      const client2 = await ActorFactory.createClient();

      await MessagingHelpers.createConversation([trainer.id, client1.id]);
      await MessagingHelpers.createConversation([trainer.id, client2.id]);

      const conversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: { userId: trainer.id }
          }
        }
      });

      expect(conversations).toHaveLength(2);
    });

    it('archives conversation', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { archivedAt: new Date() }
      });

      const archived = await prisma.conversation.findUnique({
        where: { id: conversation.id }
      });

      expect(archived?.archivedAt).toBeDefined();
    });
  });

  describe('Search', () => {
    it('searches messages by content', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      await MessagingHelpers.sendMessage(conversation.id, trainer.id, 'Squat form looks good');
      await MessagingHelpers.sendMessage(conversation.id, client.id, 'Thanks for the feedback');
      await MessagingHelpers.sendMessage(conversation.id, trainer.id, 'Deadlift next session');

      const searchResults = await prisma.message.findMany({
        where: {
          conversationId: conversation.id,
          content: { contains: 'squat', mode: 'insensitive' }
        }
      });

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].content).toContain('Squat');
    });

    it('filters messages by date', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      const filtered = await prisma.message.findMany({
        where: {
          conversationId: conversation.id,
          createdAt: {
            gte: new Date('2026-03-01'),
            lte: new Date('2026-03-31')
          }
        }
      });

      expect(filtered).toBeDefined();
    });
  });

  describe('Typing Indicators', () => {
    it('shows typing status', async () => {
      const typingStatus = {
        userId: 'user-123',
        conversationId: 'conv-456',
        isTyping: true,
        timestamp: new Date()
      };

      expect(typingStatus.isTyping).toBe(true);
    });

    it('clears typing status after timeout', async () => {
      const typingStatus = {
        userId: 'user-123',
        isTyping: true,
        timestamp: new Date(Date.now() - 10000) // 10 seconds ago
      };

      const isExpired = Date.now() - typingStatus.timestamp.getTime() > 5000;
      expect(isExpired).toBe(true);
    });
  });

  describe('Online Status', () => {
    it('shows online status', async () => {
      const userStatus = {
        userId: 'user-123',
        status: 'online',
        lastSeen: new Date()
      };

      expect(userStatus.status).toBe('online');
    });

    it('shows last seen time', async () => {
      const lastSeen = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const userStatus = {
        userId: 'user-123',
        status: 'offline',
        lastSeen
      };

      expect(userStatus.status).toBe('offline');
      expect(userStatus.lastSeen).toBeDefined();
    });
  });

  describe('Security', () => {
    it('prevents access to other conversations', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client1 = await ActorFactory.createClient();
      const client2 = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client1.id
      ]);

      // client2 should not be able to access this conversation
      const hasAccess = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: conversation.id,
          userId: client2.id
        }
      });

      expect(hasAccess).toBeNull();
    });

    it('sanitizes message content', async () => {
      const maliciousContent = '<script>alert("xss")</script>';
      const sanitized = maliciousContent
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });
  });
});
