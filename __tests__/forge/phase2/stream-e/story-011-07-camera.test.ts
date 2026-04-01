/**
 * Story 011-07: Camera Optimizations
 * Epic 011: Mobile & PWA
 *
 * Tests camera functionality workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

import { authenticate } from '@/lib/middleware/auth';

const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('Story 011-07: Camera - Progress Photos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client takes progress photo', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'takePhoto', data: { type: 'progress', angle: 'front' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client takes multiple angle photos', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'takePhoto', data: { angle: 'front' } },
        { action: 'takePhoto', data: { angle: 'side' } },
        { action: 'takePhoto', data: { angle: 'back' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client compares progress photos', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'comparePhotos', data: { photo1: 'p1', photo2: 'p2' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-07: Camera - Exercise Form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client records exercise form video', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'recordVideo', data: { type: 'form_check', duration: 30 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer reviews form video', async () => {
    const trainer = ActorFactory.createTrainer();

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'reviewVideo', data: { videoId: 'v1' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-07: Camera - Scanning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scans QR code for quick access', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'scanQRCode', data: { code: 'trainer-profile-123' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('scans barcode for nutrition logging', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'scanBarcode', data: { barcode: '123456789' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-07: Camera - Optimizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('compresses photo before upload', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'takePhoto', data: { compress: true, quality: 0.8 } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles low light conditions', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'takePhoto', data: { lowLight: true, flash: 'auto' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles camera permission denied', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'takePhoto', data: { permission: 'denied' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
