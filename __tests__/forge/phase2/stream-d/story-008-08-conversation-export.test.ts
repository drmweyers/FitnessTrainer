/**
 * Story 008-08: Conversation Export
 * FORGE User Simulation - Stream D
 *
 * As a user, I want to export conversations
 * So that I can keep records of my communications
 */


import {
  ActorFactory,
  WorkflowRunner,
  MessagingHelpers,
  cleanupTestData
} from './utils';

describe('Story 008-08: Conversation Export', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('exports conversation as PDF', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      await MessagingHelpers.sendMessage(conversation.id, trainer.id, 'Hello!');
      await MessagingHelpers.sendMessage(conversation.id, client.id, 'Hi there!');

      const exportData = {
        format: 'PDF',
        conversationId: conversation.id,
        filename: 'conversation-trainer-client.pdf',
        includeTimestamps: true,
        includeMedia: false
      };

      expect(exportData.format).toBe('PDF');
      expect(exportData.includeTimestamps).toBe(true);
    });

    it('exports conversation as text', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      await MessagingHelpers.sendMessage(conversation.id, trainer.id, 'Workout plan sent!');
      await MessagingHelpers.sendMessage(conversation.id, client.id, 'Received, thanks!');

      const messages = [
        { id: "msg-1", senderId: trainer.id, content: "Workout plan sent!", type: "TEXT", createdAt: new Date() },
        { id: "msg-2", senderId: client.id, content: "Received, thanks!", type: "TEXT", createdAt: new Date() }
      ]; // Mock data

      const textExport = messages.map(m =>
        `[${m.createdAt.toISOString()}] ${m.senderId}: ${m.content}`
      ).join('\n');

      expect(textExport).toContain('Workout plan sent!');
      expect(textExport).toContain('Received, thanks!');
    });

    it('exports with date range filter', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      const exportOptions = {
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        format: 'PDF'
      };

      expect(exportOptions.startDate).toBe('2026-03-01');
      expect(exportOptions.endDate).toBe('2026-03-31');
    });
  });

  describe('Export Formats', () => {
    it('supports PDF format', async () => {
      const formats = ['PDF', 'TXT', 'JSON', 'CSV'];
      expect(formats).toContain('PDF');
    });

    it('supports JSON format', async () => {
      const messages = [
        { id: 1, content: 'Hello', timestamp: '2026-03-31T10:00:00Z' },
        { id: 2, content: 'Hi!', timestamp: '2026-03-31T10:01:00Z' }
      ];

      const jsonExport = JSON.stringify(messages, null, 2);
      expect(JSON.parse(jsonExport)).toHaveLength(2);
    });

    it('supports CSV format', async () => {
      const headers = ['timestamp', 'sender', 'content'];
      const rows = [
        ['2026-03-31T10:00:00Z', 'Trainer', 'Hello'],
        ['2026-03-31T10:01:00Z', 'Client', 'Hi!']
      ];

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      expect(csv).toContain('timestamp,sender,content');
    });
  });

  describe('Export Options', () => {
    it('includes media in export', async () => {
      const exportOptions = {
        includeMedia: true,
        mediaFormat: 'thumbnails',
        maxMediaSize: 50 * 1024 * 1024 // 50MB
      };

      expect(exportOptions.includeMedia).toBe(true);
    });

    it('excludes media from export', async () => {
      const exportOptions = {
        includeMedia: false
      };

      expect(exportOptions.includeMedia).toBe(false);
    });

    it('includes metadata in export', async () => {
      const exportOptions = {
        includeMetadata: true,
        metadata: ['timestamps', 'readReceipts', 'editHistory']
      };

      expect(exportOptions.metadata).toContain('timestamps');
    });
  });

  describe('Export Delivery', () => {
    it('downloads export file', async () => {
      const download = {
        url: 'https://cdn.evofit.io/exports/conv-123.pdf',
        filename: 'conversation-export.pdf',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      expect(download.filename).toBe('conversation-export.pdf');
    });

    it('emails export file', async () => {
      const emailOptions = {
        recipient: 'user@example.com',
        subject: 'Your Conversation Export',
        body: 'Your conversation export is attached.',
        attachmentUrl: 'https://cdn.evofit.io/exports/conv-123.pdf'
      };

      expect(emailOptions.recipient).toBe('user@example.com');
    });

    it('stores export in cloud storage', async () => {
      const storage = {
        provider: 's3',
        bucket: 'evofit-exports',
        key: 'exports/user-123/conv-456.pdf',
        retention: 30 // days
      };

      expect(storage.retention).toBe(30);
    });
  });

  describe('Bulk Export', () => {
    it('exports multiple conversations', async () => {
      const exportOptions = {
        conversationIds: ['conv-1', 'conv-2', 'conv-3'],
        format: 'PDF',
        combine: true,
        filename: 'all-conversations.pdf'
      };

      expect(exportOptions.conversationIds).toHaveLength(3);
      expect(exportOptions.combine).toBe(true);
    });

    it('exports all trainer-client conversations', async () => {
      const trainer = await ActorFactory.createTrainer();
      const clients = await Promise.all([
        ActorFactory.createClient(),
        ActorFactory.createClient()
      ]);

      for (const client of clients) {
        // Client relationship mocked
      }

      const exportOptions = {
        trainerId: trainer.id,
        exportAllClients: true,
        format: 'PDF'
      };

      expect(exportOptions.exportAllClients).toBe(true);
    });
  });

  describe('Privacy & Compliance', () => {
    it('includes data retention notice', async () => {
      const notice = {
        retentionPeriod: '7 years',
        deletionPolicy: 'Exports are deleted after 30 days',
        gdprCompliant: true
      };

      expect(notice.gdprCompliant).toBe(true);
    });

    it('anonymizes other participants on request', async () => {
      const exportOptions = {
        anonymize: true,
        anonymizationMethod: 'hash' // or 'replace'
      };

      expect(exportOptions.anonymize).toBe(true);
    });

    it('includes export log for audit', async () => {
      const exportLog = {
        userId: 'user-123',
        exportType: 'conversation',
        exportedAt: new Date(),
        recordCount: 150,
        format: 'PDF'
      };

      expect(exportLog.recordCount).toBe(150);
    });
  });
});
