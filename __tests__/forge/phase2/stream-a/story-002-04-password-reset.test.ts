/**
 * Story 002-04: Password Reset
 * FORGE User Simulation Tests
 */

import { ActorFactory } from './utils/actor-factory';
import { WorkflowRunner } from './utils/workflow-runner';

describe('Story 002-04: Password Reset', () => {
  it('requests password reset', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'resetPassword', data: { email: trainer.email } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.resetRequested).toBe(true);
  });

  it('resets password with valid token', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'resetPassword', data: { token: 'valid-reset-token', newPassword: 'NewPass123!' } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.passwordReset).toBe(true);
  });

  it('rejects invalid reset token', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'resetPassword', data: { token: 'invalid-token', newPassword: 'NewPass123!' } },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects weak new password', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'resetPassword', data: { token: 'valid-token', newPassword: 'short' } },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects password reset with empty token', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'resetPassword', data: { token: '', newPassword: 'NewPass123!' } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.resetRequested).toBe(true);
  });
});
