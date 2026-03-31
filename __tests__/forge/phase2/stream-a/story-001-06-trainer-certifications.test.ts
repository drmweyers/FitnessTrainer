/**
 * Story 001-06: Trainer Certifications
 * FORGE User Simulation Tests
 */

import { ActorFactory } from './utils/actor-factory';
import { WorkflowRunner } from './utils/workflow-runner';

describe('Story 001-06: Trainer Certifications', () => {
  it('adds certification for trainer', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: { role: 'trainer' } },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        {
          action: 'addCertification',
          data: {
            certificationName: 'NASM-CPT',
            issuingOrganization: 'National Academy of Sports Medicine',
            credentialId: 'NASM-12345',
            issueDate: '2020-01-15',
            expiryDate: '2025-01-15',
            isPublic: true,
          },
        },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.certificationAdded).toBe(true);
    expect(result.data.certification.certificationName).toBe('NASM-CPT');
  });

  it('prevents client from adding certifications', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: { role: 'client' } },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        {
          action: 'addCertification',
          data: { certificationName: 'Test Cert' },
        },
      ],
    });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Only trainers can add certifications');
  });

  it('adds multiple certifications', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: { role: 'trainer' } },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        {
          action: 'addCertification',
          data: { certificationName: 'NASM-CPT', issuingOrganization: 'NASM' },
        },
        {
          action: 'addCertification',
          data: { certificationName: 'ACE-CPT', issuingOrganization: 'ACE' },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('sets certification as unverified by default', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: { role: 'trainer' } },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        {
          action: 'addCertification',
          data: { certificationName: 'Test Cert', issuingOrganization: 'Test Org' },
        },
      ],
    });
    expect(result.data.certification.isVerified).toBe(false);
  });

  it('supports private certifications', async () => {
    const trainer = ActorFactory.createTrainer();
    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'register', data: { role: 'trainer' } },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        {
          action: 'addCertification',
          data: { certificationName: 'Private Cert', issuingOrganization: 'Org', isPublic: false },
        },
      ],
    });
    expect(result.data.certification.isPublic).toBe(false);
  });
});
