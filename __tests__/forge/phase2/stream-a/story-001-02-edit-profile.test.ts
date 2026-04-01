/**
 * Story 001-02: Edit Profile Information
 * FORGE User Simulation Tests
 */

import { ActorFactory } from './utils/actor-factory';
import { WorkflowRunner } from './utils/workflow-runner';

describe('Story 001-02: Edit Profile Information', () => {
  it('updates single profile field successfully', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'completeProfile', data: { fullName: 'Initial', bio: 'Initial bio' } },
        { action: 'updateProfile', data: { bio: 'Updated bio' } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.profileUpdated).toBe(true);
    expect(result.data.profileData.bio).toBe('Updated bio');
  });

  it('updates multiple profile fields at once', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'completeProfile', data: { fullName: 'Test', bio: 'Test', phone: '+1-555-0000' } },
        { action: 'updateProfile', data: { fullName: 'New Name', phone: '+1-555-1111' } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.changes).toContain('fullName');
    expect(result.data.changes).toContain('phone');
  });

  it('tracks which fields were changed', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'completeProfile', data: { fullName: 'Test', bio: 'Test', phone: '0000' } },
        { action: 'updateProfile', data: { bio: 'New bio' } },
      ],
    });
    expect(result.data.changes).toContain('bio');
    expect(result.data.changes).not.toContain('fullName');
  });

  it('tracks last updated timestamp', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'completeProfile', data: { fullName: 'Test', bio: 'Test' } },
        { action: 'updateProfile', data: { bio: 'Updated' } },
      ],
    });
    expect(result.data.profileData.updatedAt).toBeDefined();
  });

  it('handles rapid successive updates', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'completeProfile', data: { fullName: 'Test', bio: 'V1' } },
        { action: 'updateProfile', data: { bio: 'V2' } },
        { action: 'updateProfile', data: { bio: 'V3' } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.profileData.bio).toBe('V3');
  });

  it('handles special characters in updates', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'completeProfile', data: { fullName: 'Test', bio: 'Test' } },
        { action: 'updateProfile', data: { bio: 'Bio with emojis 🏋️‍♀️ and unicode 你好' } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.profileData.bio).toContain('🏋️‍♀️');
  });
});
