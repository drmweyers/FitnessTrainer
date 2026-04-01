/**
 * Story 002-02: Email Verification
 * FORGE User Simulation Tests
 */

import { ActorFactory } from './utils/actor-factory';
import { WorkflowRunner } from './utils/workflow-runner';

describe('Story 002-02: Email Verification', () => {
  it('verifies email with valid token', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.verificationSuccess).toBe(true);
    expect(result.data.isVerified).toBe(true);
  });

  it('rejects invalid verification token', async () => {
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

  it('rejects empty verification token', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: '' } },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('tracks verification timestamp', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
      ],
    });
    expect(result.data.verifiedAt).toBeDefined();
  });
});
