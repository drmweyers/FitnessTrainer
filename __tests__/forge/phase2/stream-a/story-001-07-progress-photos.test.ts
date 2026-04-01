/**
 * Story 001-07: Progress Photos
 * FORGE User Simulation Tests
 */

import { ActorFactory } from './utils/actor-factory';
import { WorkflowRunner } from './utils/workflow-runner';

describe('Story 001-07: Progress Photos', () => {
  it('uploads progress photo', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        {
          action: 'uploadProgressPhoto',
          data: {
            photoType: 'FRONT',
            notes: 'Starting point - Week 1',
            takenAt: '2026-01-01',
          },
        },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data.progressPhotoUploaded).toBe(true);
    expect(result.data.photo.photoType).toBe('FRONT');
  });

  it('uploads multiple photo types', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'uploadProgressPhoto', data: { photoType: 'FRONT' } },
        { action: 'uploadProgressPhoto', data: { photoType: 'SIDE' } },
        { action: 'uploadProgressPhoto', data: { photoType: 'BACK' } },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('sets photos as private by default', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        { action: 'uploadProgressPhoto', data: { photoType: 'FRONT' } },
      ],
    });
    expect(result.data.photo.isPrivate).toBe(true);
    expect(result.data.photo.sharedWithTrainer).toBe(false);
  });

  it('allows sharing with trainer', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        {
          action: 'uploadProgressPhoto',
          data: { photoType: 'FRONT', sharedWithTrainer: true },
        },
      ],
    });
    expect(result.data.photo.sharedWithTrainer).toBe(true);
  });

  it('stores photo notes', async () => {
    const client = ActorFactory.createClient();
    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'register', data: {} },
        { action: 'verifyEmail', data: { token: 'valid-token' } },
        {
          action: 'uploadProgressPhoto',
          data: { photoType: 'FRONT', notes: 'Feeling great today!' },
        },
      ],
    });
    expect(result.data.photo.notes).toBe('Feeling great today!');
  });
});
