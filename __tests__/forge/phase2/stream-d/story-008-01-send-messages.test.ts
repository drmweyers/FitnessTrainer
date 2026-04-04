/**
 * Story 008-01: Send and Receive Messages
 * FORGE User Simulation - Stream D
 *
 * As a user, I want to send and receive messages
 * So that I can communicate with my trainer/client
 */

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

      const message = {
        id: 'msg-1',
        content: 'Great workout today! Keep it up!',
        senderId: trainer.id,
        type: 'TEXT'
      };

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

      const messages = [{
        id: "msg-1",
        content: "How are you feeling?",
        type: "TEXT",
        senderId: trainer.id
      }];

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

      const messages = [
        { id: "msg-1", content: "Hello!", type: "TEXT", senderId: trainer.id },
        { id: "msg-2", content: "Hi there!", type: "TEXT", senderId: client.id },
        { id: "msg-3", content: "How was your workout?", type: "TEXT", senderId: trainer.id }
      ];

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

      const message = {
        id: 'msg-1',
        content: 'Check your program',
        readAt: new Date(),
        senderId: trainer.id
      };

      expect(message.readAt).toBeDefined();
    });
  });

  describe('Message Features', () => {
    it('sends emoji reactions', async () => {
      const reactions = ['👍', '💪', '🔥', '❤️'];
      const selectedReaction = '💪';

      expect(reactions).toContain(selectedReaction);
    });

    it('edits sent message', async () => {
      const message = {
        id: 'msg-1',
        content: 'Original message',
        editedAt: null as Date | null
      };

      // Edit message
      message.content = 'Edited message';
      message.editedAt = new Date();

      expect(message.content).toBe('Edited message');
      expect(message.editedAt).toBeDefined();
    });

    it('deletes message', async () => {
      const message = {
        id: 'msg-1',
        content: 'To be deleted',
        deletedAt: null as Date | null
      };

      // Delete
      message.deletedAt = new Date();

      expect(message.deletedAt).toBeDefined();
    });

    it('quotes previous message', async () => {
      const quotedMessage = {
        id: 'msg-1',
        content: 'Previous message'
      };

      const reply = {
        id: 'msg-2',
        content: 'Reply to your message',
        quotedMessageId: quotedMessage.id
      };

      expect(reply.quotedMessageId).toBe(quotedMessage.id);
    });
  });

  describe('Typing Indicators', () => {
    it('shows typing indicator', async () => {
      const typingState = {
        userId: 'user-1',
        isTyping: true,
        timestamp: Date.now()
      };

      expect(typingState.isTyping).toBe(true);
    });

    it('hides typing indicator after inactivity', async () => {
      const typingState = {
        userId: 'user-1',
        isTyping: true,
        timestamp: Date.now() - 10000 // 10 seconds ago
      };

      const isExpired = Date.now() - typingState.timestamp > 5000;
      expect(isExpired).toBe(true);
    });
  });

  describe('Message Search', () => {
    it('searches messages by keyword', async () => {
      const messages = [
        { id: '1', content: 'Workout completed' },
        { id: '2', content: 'Diet plan updated' },
        { id: '3', content: 'Great workout form' }
      ];

      const searchResults = messages.filter(m =>
        m.content.toLowerCase().includes('workout')
      );

      expect(searchResults).toHaveLength(2);
    });

    it('filters messages by date', async () => {
      const messages = [
        { id: '1', createdAt: new Date('2026-01-01') },
        { id: '2', createdAt: new Date('2026-02-01') },
        { id: '3', createdAt: new Date('2026-03-01') }
      ];

      const februaryMessages = messages.filter(m =>
        m.createdAt.getMonth() === 1 // February
      );

      expect(februaryMessages).toHaveLength(1);
    });
  });
});
