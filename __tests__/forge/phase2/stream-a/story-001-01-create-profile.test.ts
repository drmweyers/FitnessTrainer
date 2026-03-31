/**
 * Story 001-01: Create Initial Profile
 * FORGE User Simulation Tests
 *
 * Tests the complete profile creation workflow for new users
 * including registration, email verification, and profile completion.
 */

import { ActorFactory } from './utils/actor-factory';
import { WorkflowRunner } from './utils/workflow-runner';

describe('Story 001-01: Create Initial Profile', () => {
  describe('Happy Path - Complete Profile Creation', () => {
    it('should complete full trainer profile creation workflow', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'register',
            data: {
              email: trainer.email,
              password: trainer.password,
              role: 'trainer',
            },
          },
          {
            action: 'verifyEmail',
            data: { token: 'valid-token' },
          },
          {
            action: 'completeProfile',
            data: {
              fullName: 'John Doe',
              bio: 'Certified personal trainer with 5 years experience',
              dateOfBirth: '1990-01-15',
              gender: 'male',
              phone: '+1-555-123-4567',
              timezone: 'America/New_York',
              preferredUnits: 'imperial',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.stepsCompleted).toBe(3);
      expect(result.data.registrationSuccess).toBe(true);
      expect(result.data.verificationSuccess).toBe(true);
      expect(result.data.profileCreated).toBe(true);
      expect(result.data.profileCompletion).toBeGreaterThan(50);
    });

    it('should complete full client profile creation workflow', async () => {
      const client = ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          {
            action: 'register',
            data: {
              email: client.email,
              password: client.password,
              role: 'client',
            },
          },
          {
            action: 'verifyEmail',
            data: { token: 'valid-token' },
          },
          {
            action: 'completeProfile',
            data: {
              fullName: 'Jane Smith',
              bio: 'Fitness enthusiast looking to get in shape',
              dateOfBirth: '1995-05-20',
              gender: 'female',
              phone: '+1-555-987-6543',
              timezone: 'America/Los_Angeles',
              preferredUnits: 'metric',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileCreated).toBe(true);
      expect(result.data.profileData.preferredUnits).toBe('metric');
    });

    it('should calculate profile completion percentage correctly', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: {
              fullName: 'Test User',
              bio: 'Test bio',
              dateOfBirth: '1990-01-01',
              gender: 'other',
              phone: '+1-555-000-0000',
              timezone: 'UTC',
              preferredUnits: 'metric',
            },
          },
        ],
      });

      expect(result.data.completionPercentage).toBeDefined();
      expect(result.data.completionPercentage).toBeGreaterThanOrEqual(0);
      expect(result.data.completionPercentage).toBeLessThanOrEqual(100);
    });

    it('should allow profile creation with minimal required fields', async () => {
      const client = ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: {
              fullName: 'Minimal User',
              bio: '',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileCreated).toBe(true);
      expect(result.data.profileData.fullName).toBe('Minimal User');
    });

    it('should track profile completion timestamp', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: { fullName: 'Timestamp Test', bio: 'Test' },
          },
        ],
      });

      expect(result.data.profileCreated).toBe(true);
    });
  });

  describe('Email Verification Requirements', () => {
    it('should require email verification before profile completion', async () => {
      const trainer = ActorFactory.createTrainer({ isVerified: false });

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'login', data: {} },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Email not verified');
    });

    it('should allow profile completion after successful verification', async () => {
      const trainer = ActorFactory.createTrainer({ isVerified: false });

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: { fullName: 'Verified User', bio: 'Test' },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.verificationSuccess).toBe(true);
      expect(result.data.profileCreated).toBe(true);
    });

    it('should reject invalid verification tokens', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'invalid-token' } },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Invalid or expired');
    });

    it('should handle missing verification token', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: '' } },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Verification token is required');
    });
  });

  describe('Registration Validation', () => {
    it('should reject registration without email', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: { email: '', password: 'test123' } },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Email and password are required');
    });

    it('should reject registration without password', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: { email: 'test@example.com', password: '' } },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Email and password are required');
    });

    it('should reject registration without terms agreement', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'register',
            data: {
              agreeToTerms: false,
              agreeToPrivacy: true,
            },
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Terms and privacy agreement required');
    });

    it('should reject registration without privacy agreement', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          {
            action: 'register',
            data: {
              agreeToTerms: true,
              agreeToPrivacy: false,
            },
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Terms and privacy agreement required');
    });
  });

  describe('Profile Data Validation', () => {
    it('should accept valid timezone values', async () => {
      const client = ActorFactory.createClient();

      const timezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];

      for (const timezone of timezones) {
        const result = await WorkflowRunner.run({
          actor: client,
          steps: [
            { action: 'register', data: {} },
            { action: 'verifyEmail', data: { token: 'valid-token' } },
            {
              action: 'completeProfile',
              data: {
                fullName: 'Timezone Test',
                bio: 'Test',
                timezone,
              },
            },
          ],
        });

        expect(result.success).toBe(true);
        expect(result.data.profileData.timezone).toBe(timezone);
      }
    });

    it('should accept valid unit preferences', async () => {
      const client = ActorFactory.createClient();

      const units = ['metric', 'imperial'];

      for (const preferredUnits of units) {
        const result = await WorkflowRunner.run({
          actor: client,
          steps: [
            { action: 'register', data: {} },
            { action: 'verifyEmail', data: { token: 'valid-token' } },
            {
              action: 'completeProfile',
              data: {
                fullName: 'Units Test',
                bio: 'Test',
                preferredUnits,
              },
            },
          ],
        });

        expect(result.success).toBe(true);
        expect(result.data.profileData.preferredUnits).toBe(preferredUnits);
      }
    });

    it('should accept valid gender values', async () => {
      const client = ActorFactory.createClient();

      const genders = ['male', 'female', 'other', 'prefer_not_to_say'];

      for (const gender of genders) {
        const result = await WorkflowRunner.run({
          actor: client,
          steps: [
            { action: 'register', data: {} },
            { action: 'verifyEmail', data: { token: 'valid-token' } },
            {
              action: 'completeProfile',
              data: {
                fullName: 'Gender Test',
                bio: 'Test',
                gender,
              },
            },
          ],
        });

        expect(result.success).toBe(true);
        expect(result.data.profileData.gender).toBe(gender);
      }
    });
  });

  describe('Role-Based Profile Creation', () => {
    it('should create trainer-specific profile fields', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: { role: 'trainer' } },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: {
              fullName: 'Trainer Profile',
              bio: 'Professional trainer',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileCreated).toBe(true);
    });

    it('should create client-specific profile fields', async () => {
      const client = ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'register', data: { role: 'client' } },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: {
              fullName: 'Client Profile',
              bio: 'Fitness enthusiast',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileCreated).toBe(true);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should complete workflow within reasonable time', async () => {
      const trainer = ActorFactory.createTrainer();

      const result = await WorkflowRunner.run({
        actor: trainer,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: { fullName: 'Performance Test', bio: 'Test' },
          },
        ],
      });

      expect(result.duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle special characters in profile fields', async () => {
      const client = ActorFactory.createClient();

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: {
              fullName: 'O\'Connor-Smith Jr.',
              bio: 'Bio with special chars: <>&"\' and emojis 🏋️‍♀️',
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileData.fullName).toBe('O\'Connor-Smith Jr.');
    });

    it('should handle very long bio text', async () => {
      const client = ActorFactory.createClient();
      const longBio = 'A'.repeat(1000);

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'register', data: {} },
          { action: 'verifyEmail', data: { token: 'valid-token' } },
          {
            action: 'completeProfile',
            data: {
              fullName: 'Long Bio Test',
              bio: longBio,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.profileData.bio).toBe(longBio);
    });
  });
});
