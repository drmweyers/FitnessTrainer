/**
 * Story 001-01: Create Initial Profile
 * FORGE User Simulation Tests
 */

import { ActorFactory } from './utils/actor-factory';
import { WorkflowRunner } from './utils/workflow-runner';

describe('Story 001-01: Create Initial Profile', () => {
  it('completes full trainer profile creation workflow', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: { email: trainer.email, password: trainer.password, role: 'trainer' } },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'completeProfile', data: { fullName: 'John Doe', bio: 'Certified trainer' } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.profileCreated).toBe(true);
  });

  it('completes full client profile creation workflow', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: { email: client.email, password: client.password, role: 'client' } },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'completeProfile', data: { fullName: 'Jane Smith', bio: 'Fitness enthusiast' } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.profileCreated).toBe(true);
  });

  it('requires email verification before profile completion', async () => {
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

  it('rejects invalid verification tokens', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'invalid-token' } },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects registration without terms agreement', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: { agreeToTerms: false, agreeToPrivacy: true } },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid timezone values', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'completeProfile', data: { fullName: 'Test', bio: 'Test', timezone: 'America/New_York' } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.profileData.timezone).toBe('America/New_York');
  });

  it('accepts valid unit preferences', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'completeProfile', data: { fullName: 'Test', bio: 'Test', preferredUnits: 'metric' } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.profileData.preferredUnits).toBe('metric');
  });

  it('calculates profile completion percentage', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'completeProfile', data: { fullName: 'Test', bio: 'Test' } },
      ],
    });
    expect(result.data.completionPercentage).toBeDefined();
  });
});
