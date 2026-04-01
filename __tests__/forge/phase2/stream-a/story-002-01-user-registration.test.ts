/**
 * Story 002-01: User Registration
 * FORGE User Simulation Tests
 */

import { ActorFactory } from './utils/actor-factory';
import { WorkflowRunner } from './utils/workflow-runner';

describe('Story 002-01: User Registration', () => {
  it('registers new trainer successfully', async () => {
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
            agreeToTerms: true,
            agreeToPrivacy: true,
          },
        },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.registrationSuccess).toBe(true);
    expect(result.data.role).toBe('trainer');
    expect(result.data.isVerified).toBe(false);
  });

  it('registers new client successfully', async () => {
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
            agreeToTerms: true,
            agreeToPrivacy: true,
          },
        },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.registrationSuccess).toBe(true);
    expect(result.data.role).toBe('client');
  });

  it('requires terms agreement', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: { agreeToTerms: false, agreeToPrivacy: true } },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('requires privacy agreement', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: { agreeToTerms: true, agreeToPrivacy: false } },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('requires email', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: { email: '', password: 'test123' } },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('requires password', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: { email: 'test@example.com', password: '' } },
      ],
    });
    expect(result.success).toBe(false);
  });
});
