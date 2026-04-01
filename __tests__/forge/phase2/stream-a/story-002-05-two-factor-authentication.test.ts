/**
 * Story 002-05: Two-Factor Authentication
 * FORGE User Simulation Tests
 */

import { ActorFactory } from './utils/actor-factory';
import { WorkflowRunner } from './utils/workflow-runner';

describe('Story 002-05: Two-Factor Authentication', () => {
  it('sets up 2FA successfully', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'enable2FA', data: {} },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.twoFactorSetup).toBe(true);
    expect(result.data.secret).toBeDefined();
    expect(result.data.backupCodes).toHaveLength(10);
  });

  it('verifies 2FA with valid code', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'enable2FA', data: {} },
        { action: 'verify2FA', data: { token: '123456' } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.twoFactorEnabled).toBe(true);
  });

  it('rejects invalid 2FA code', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'enable2FA', data: {} },
        { action: 'verify2FA', data: { token: '000000' } },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects short 2FA code', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'enable2FA', data: {} },
        { action: 'verify2FA', data: { token: '123' } },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('generates 10 backup codes', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'enable2FA', data: {} },
      ],
    });
    expect(result.data.backupCodes).toHaveLength(10);
    expect(result.data.backupCodes[0]).toMatch(/BACKUP\d{4}/);
  });
});
