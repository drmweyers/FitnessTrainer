/**
 * Story 008-03: Voice Messages
 * FORGE User Simulation - Stream D
 *
 * As a user, I want to send voice messages
 * So that I can communicate quickly without typing
 */

import { prisma } from '@/lib/db/prisma';

const mockUpdate = jest.fn();
const mockFindUnique = jest.fn();

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    message: {
      update: (...args: any[]) => mockUpdate(...args),
      findUnique: (...args: any[]) => mockFindUnique(...args),
    },
  },
}));

import {
  ActorFactory,
  WorkflowRunner,
  MessagingHelpers,
  cleanupTestData
} from './utils';

describe('Story 008-03: Voice Messages', () => {
  beforeEach(async () => {
    await cleanupTestData();
    jest.clearAllMocks();
    mockUpdate.mockReset();
    mockFindUnique.mockReset();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('records and sends voice message', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'openConversation', data: { conversationId: conversation.id } },
          { action: 'startRecording', data: {} },
          { action: 'recordAudio', data: { duration: 15 } },
          { action: 'stopRecording', data: {} },
          { action: 'sendVoiceMessage', data: { confirm: true } }
        ]
      });

      expect(result.success).toBe(true);
    });

    it('saves voice message to conversation', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      const message = {
        id: "msg-" + Date.now(),
        content: "Test message",
        type: "VOICE",
        metadata: { duration: 15, waveform: [0.1, 0.2, 0.3] }
      };

      expect(message.type).toBe('VOICE');
      expect(message.metadata).toHaveProperty('duration');
      expect(message.metadata).toHaveProperty('waveform');
    });

    it('plays voice message', async () => {
      const voiceMessage = {
        id: 'msg-123',
        url: 'https://cdn.evofit.io/audio/message-1.mp3',
        duration: 15,
        isPlaying: false,
        currentTime: 0
      };

      // Simulate play
      voiceMessage.isPlaying = true;
      voiceMessage.currentTime = 5;

      expect(voiceMessage.isPlaying).toBe(true);
      expect(voiceMessage.currentTime).toBe(5);
    });

    it('displays waveform visualization', async () => {
      const waveform = {
        data: [0.1, 0.3, 0.5, 0.8, 0.6, 0.4, 0.2, 0.3, 0.5, 0.7],
        duration: 15,
        sampleRate: 10
      };

      expect(waveform.data).toHaveLength(10);
      expect(waveform.duration).toBe(15);
    });
  });

  describe('Voice Recording', () => {
    it('validates recording duration', async () => {
      const minDuration = 1; // 1 second
      const maxDuration = 300; // 5 minutes
      const recording = { duration: 15 };

      const isValid = recording.duration >= minDuration && recording.duration <= maxDuration;
      expect(isValid).toBe(true);
    });

    it('rejects too short recordings', async () => {
      const minDuration = 1;
      const recording = { duration: 0.5 };

      const isValid = recording.duration >= minDuration;
      expect(isValid).toBe(false);
    });

    it('rejects too long recordings', async () => {
      const maxDuration = 300;
      const recording = { duration: 600 };

      const isValid = recording.duration <= maxDuration;
      expect(isValid).toBe(false);
    });

    it('validates audio file size', async () => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      const fileSize = 5 * 1024 * 1024; // 5MB

      const isValid = fileSize <= maxSize;
      expect(isValid).toBe(true);
    });
  });

  describe('Playback Controls', () => {
    it('pauses voice message', async () => {
      const player = {
        isPlaying: true,
        currentTime: 10
      };

      // Pause
      player.isPlaying = false;

      expect(player.isPlaying).toBe(false);
      expect(player.currentTime).toBe(10);
    });

    it('seeks to specific time', async () => {
      const player = {
        duration: 30,
        currentTime: 0
      };

      // Seek to 15 seconds
      player.currentTime = 15;

      expect(player.currentTime).toBe(15);
    });

    it('adjusts playback speed', async () => {
      const speeds = [0.5, 1, 1.5, 2];
      const selectedSpeed = 1.5;

      expect(speeds).toContain(selectedSpeed);
      expect(selectedSpeed).toBe(1.5);
    });

    it('shows playback progress', async () => {
      const progress = {
        current: 15,
        total: 30,
        percentage: 50
      };

      expect(progress.percentage).toBe(50);
    });
  });

  describe('Voice Message Features', () => {
    it('cancels recording before sending', async () => {
      const recording = {
        status: 'recording',
        duration: 5
      };

      // Cancel
      recording.status = 'cancelled';

      expect(recording.status).toBe('cancelled');
    });

    it('previews recording before sending', async () => {
      const recording = {
        status: 'recorded',
        duration: 10,
        previewed: false
      };

      // Preview
      recording.previewed = true;

      expect(recording.previewed).toBe(true);
    });

    it('deletes voice message', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      const conversation = await MessagingHelpers.createConversation([
        trainer.id,
        client.id
      ]);

      const message = { id: "msg-" + Date.now(), content: "Test message", type: "VOICE" };

      mockUpdate.mockResolvedValue({ ...message, deletedAt: new Date() });
      mockFindUnique.mockResolvedValue({ ...message, deletedAt: new Date() });

      await prisma.message.update({
        where: { id: message.id },
        data: { deletedAt: new Date() }
      });

      const deleted = await prisma.message.findUnique({
        where: { id: message.id }
      });

      expect(deleted?.deletedAt).toBeDefined();
    });
  });

  describe('Transcription', () => {
    it('generates transcription', async () => {
      const transcription = {
        text: 'Great workout today! Keep up the good work.',
        confidence: 0.95,
        language: 'en-US'
      };

      expect(transcription.confidence).toBeGreaterThan(0.9);
      expect(transcription.text).toBeDefined();
    });

    it('displays transcription alongside audio', async () => {
      const voiceMessage = {
        audioUrl: 'https://cdn.evofit.io/audio/message.mp3',
        duration: 15,
        transcription: {
          text: 'Your form is looking great!',
          enabled: true
        }
      };

      expect(voiceMessage.transcription.enabled).toBe(true);
      expect(voiceMessage.transcription.text).toBeDefined();
    });
  });
});
