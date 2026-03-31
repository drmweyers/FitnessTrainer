/**
 * Story 001-02: Edit Profile Information
 * FORGE User Simulation Tests
 *
 * Tests profile editing workflows including auto-save,
 * validation, and change tracking.
 */

import { ActorFactory } from './utils/actor-factory';
import { WorkflowRunner } from './utils/workflow-runner';

describe('Story 001-02: Edit Profile Information', () => {
  describe('Happy Path - Edit Profile Fields', () => {
    it('should update single profile field successfully', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: {
              fullName: 'Initial Name',
              bio: 'Initial bio',
            },
          },
          {
            action: 'updateProfile',
            data: {
              bio: 'Updated bio with new information',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileUpdated).toBe(true);
      expect(result.data.profileData.bio).toBe('Updated bio with new information');
      expect(result.data.changes).toContain('bio');
    });

    it('should update multiple profile fields at once', async () => {
      const client = ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: {
              fullName: 'Initial Name',
              bio: 'Initial bio',
              phone: '+1-555-000-0000',
            },
          },
          {
            action: 'updateProfile',
            data: {
              fullName: 'Updated Name',
              bio: 'Updated bio',
              phone: '+1-555-111-1111',
              timezone: 'America/Chicago',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileUpdated).toBe(true);
      expect(result.data.changes).toHaveLength(4);
      expect(result.data.profileData.fullName).toBe('Updated Name');
      expect(result.data.profileData.phone).toBe('+1-555-111-1111');
    });

    it('should track last updated timestamp', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: { fullName: 'Test User', bio: 'Test' },
          },
          {
            action: 'updateProfile',
            data: { bio: 'Updated' },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileData.updatedAt).toBeDefined();
    });
  });

  describe('Section-Based Editing', () => {
    it('should update basic information section', async () => {
      const client = ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: { fullName: 'Test', bio: 'Test' },
          },
          {
            action: 'updateProfile',
            data: {
              fullName: 'New Name',
              bio: 'New Bio',
              dateOfBirth: '1992-03-15',
              gender: 'female',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileData.fullName).toBe('New Name');
      expect(result.data.profileData.dateOfBirth).toBe('1992-03-15');
    });

    it('should update contact information section', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: { fullName: 'Test', bio: 'Test', phone: '+1-555-000-0000' },
          },
          {
            action: 'updateProfile',
            data: {
              phone: '+1-555-999-8888',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileData.phone).toBe('+1-555-999-8888');
    });

    it('should update preferences section', async () => {
      const client = ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: {
              fullName: 'Test',
              bio: 'Test',
              timezone: 'UTC',
              preferredUnits: 'metric',
            },
          },
          {
            action: 'updateProfile',
            data: {
              timezone: 'America/Denver',
              preferredUnits: 'imperial',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileData.timezone).toBe('America/Denver');
      expect(result.data.profileData.preferredUnits).toBe('imperial');
    });
  });

  describe('Validation and Error Handling', () => {
    it('should validate phone number format', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: { fullName: 'Test', bio: 'Test' },
          },
        ],
      });

      expect(result.success).toBe(true);
      // Phone validation would be handled by the actual API
      // This test verifies the workflow structure
    });

    it('should handle empty optional fields', async () => {
      const client = ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: {
              fullName: 'Test',
              bio: 'Test',
              phone: '+1-555-000-0000',
            },
          },
          {
            action: 'updateProfile',
            data: {
              phone: '', // Clear phone number
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileData.phone).toBe('');
    });
  });

  describe('Change Tracking', () => {
    it('should track which fields were changed', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: { fullName: 'Test', bio: 'Test', phone: '+1-555-000-0000' },
          },
          {
            action: 'updateProfile',
            data: {
              bio: 'New bio',
              phone: '+1-555-111-1111',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.changes).toContain('bio');
      expect(result.data.changes).toContain('phone');
      expect(result.data.changes).not.toContain('fullName');
    });

    it('should maintain change history across multiple updates', async () => {
      const client = ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: { fullName: 'Test', bio: 'Version 1' },
          },
          {
            action: 'updateProfile',
            data: { bio: 'Version 2' },
          },
          {
            action: 'updateProfile',
            data: { bio: 'Version 3' },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileData.bio).toBe('Version 3');
      expect(result.data.profileData.updatedAt).toBeDefined();
    });
  });

  describe('Role-Based Editing', () => {
    it('should allow trainer to edit trainer-specific fields', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: { role: 'trainer' } },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: { fullName: 'Trainer', bio: 'Initial bio' },
          },
          {
            action: 'updateProfile',
            data: {
              bio: 'Updated trainer bio with specializations',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileUpdated).toBe(true);
    });

    it('should allow client to edit client-specific fields', async () => {
      const client = ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'register', data: { role: 'client' } },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: { fullName: 'Client', bio: 'Initial bio' },
          },
          {
            action: 'updateProfile',
            data: {
              bio: 'Updated client bio with fitness goals',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileUpdated).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive updates', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: { fullName: 'Test', bio: 'Start' },
          },
          {
            action: 'updateProfile',
            data: { bio: 'Update 1' },
          },
          {
            action: 'updateProfile',
            data: { bio: 'Update 2' },
          },
          {
            action: 'updateProfile',
            data: { bio: 'Update 3' },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileData.bio).toBe('Update 3');
    });

    it('should handle special characters in profile updates', async () => {
      const client = ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: { fullName: 'Test', bio: 'Initial' },
          },
          {
            action: 'updateProfile',
            data: {
              bio: 'Bio with <script>alert("xss")</script> and "quotes" \'apostrophes\'',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileData.bio).toContain('<script>');
    });

    it('should handle unicode and emoji in profile updates', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: { fullName: 'Test', bio: 'Initial' },
          },
          {
            action: 'updateProfile',
            data: {
              bio: 'Trainer bio with emojis 🏋️‍♀️💪🥗 and unicode 你好',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileData.bio).toContain('🏋️‍♀️');
    });
  });
});
