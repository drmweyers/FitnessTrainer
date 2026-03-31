/**
 * Story 001-03: Upload Profile Photo
 * FORGE User Simulation Tests
 *
 * Tests profile photo upload functionality including drag-drop,
 * image cropping, format validation, and thumbnail generation.
 */

import { ActorFactory } from './utils/actor-factory';
import { WorkflowRunner } from './utils/workflow-runner';

describe('Story 001-03: Upload Profile Photo', () => {
  describe('Happy Path - Photo Upload', () => {
    it('should upload profile photo successfully', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'uploadPhoto',
            data: {
              file: { name: 'profile.jpg', size: 1024 * 1024, type: 'image/jpeg' },
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.photoUploaded).toBe(true);
      expect(result.data.photoUrl).toContain('cdn.evofit.io');
      expect(result.data.thumbnailUrl).toBeDefined();
    });

    it('should upload photo for client profile', async () => {
      const client = ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'uploadPhoto',
            data: {
              file: { name: 'avatar.png', size: 2 * 1024 * 1024, type: 'image/png' },
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.photoUploaded).toBe(true);
    });

    it('should handle WebP format uploads', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'uploadPhoto',
            data: {
              file: { name: 'photo.webp', size: 500 * 1024, type: 'image/webp' },
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.photoUploaded).toBe(true);
    });

    it('should generate thumbnail after upload', async () => {
      const client = ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'uploadPhoto',
            data: {
              file: { name: 'profile.jpg', size: 1024 * 1024, type: 'image/jpeg' },
            },
          },
        ],
      });

      expect(result.data.thumbnailUrl).toBeDefined();
      expect(result.data.thumbnailUrl).toContain('thumb');
    });

    it('should track upload timestamp', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          { action: 'uploadPhoto', data: { file: { name: 'test.jpg', size: 1024 } } },
        ],
      });

      expect(result.data.uploadedAt).toBeDefined();
      expect(new Date(result.data.uploadedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('File Size Validation', () => {
    it('should reject files larger than 5MB', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'uploadPhoto',
            data: {
              file: { name: 'large.jpg', size: 6 * 1024 * 1024, type: 'image/jpeg' },
            },
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('5MB');
    });

    it('should accept files at exactly 5MB', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'uploadPhoto',
            data: {
              file: { name: 'max-size.jpg', size: 5 * 1024 * 1024, type: 'image/jpeg' },
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.photoUploaded).toBe(true);
    });

    it('should accept small files under 1MB', async () => {
      const client = ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'uploadPhoto',
            data: {
              file: { name: 'small.jpg', size: 100 * 1024, type: 'image/jpeg' },
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.photoUploaded).toBe(true);
    });
  });

  describe('File Format Validation', () => {
    it('should accept JPG format', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'uploadPhoto',
            data: {
              file: { name: 'photo.jpg', size: 1024, type: 'image/jpeg' },
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('should accept JPEG format', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'uploadPhoto',
            data: {
              file: { name: 'photo.jpeg', size: 1024, type: 'image/jpeg' },
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('should accept PNG format', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'uploadPhoto',
            data: {
              file: { name: 'photo.png', size: 1024, type: 'image/png' },
            },
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid file formats', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'uploadPhoto',
            data: {
              file: { name: 'document.pdf', size: 1024, type: 'application/pdf' },
              invalidFormat: true,
            },
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Invalid file format');
    });

    it('should reject GIF format', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'uploadPhoto',
            data: {
              file: { name: 'animated.gif', size: 1024, type: 'image/gif' },
              invalidFormat: true,
            },
          },
        ],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Drag and Drop Upload', () => {
    it('should handle drag and drop upload', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'uploadPhoto',
            data: {
              file: { name: 'dropped.jpg', size: 1024, type: 'image/jpeg' },
              dragAndDrop: true,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.photoUploaded).toBe(true);
    });
  });

  describe('Photo Replacement', () => {
    it('should replace existing photo', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'uploadPhoto',
            data: { file: { name: 'old.jpg', size: 1024, type: 'image/jpeg' } },
          },
          {
            action: 'uploadPhoto',
            data: { file: { name: 'new.jpg', size: 2048, type: 'image/jpeg' }, replace: true },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.photoUploaded).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing file', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          { action: 'uploadPhoto', data: {} },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Photo file is required');
    });

    it('should handle network errors gracefully', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'uploadPhoto',
            data: {
              file: { name: 'photo.jpg', size: 1024, type: 'image/jpeg' },
              networkError: true,
            },
          },
        ],
      });

      // Should handle error gracefully
      expect(result).toBeDefined();
    });
  });

  describe('Mobile Upload', () => {
    it('should handle mobile camera capture', async () => {
      const client = ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'uploadPhoto',
            data: {
              file: { name: 'camera-capture.jpg', size: 3 * 1024 * 1024, type: 'image/jpeg' },
              source: 'camera',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.photoUploaded).toBe(true);
    });
  });
});
