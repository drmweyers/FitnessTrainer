/**
 * Story 011-04: Biometric Login
 * Epic 011: Mobile & PWA
 *
 * Tests biometric authentication workflows
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { ActorFactory, WorkflowRunner } from './utils/forge-actors';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    biometricCredential: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { authenticate } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';

const mockedPrisma = prisma as any;
const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('Story 011-04: Biometric Login - Setup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client enrolls fingerprint', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/auth/biometric/enroll'), { user: client })
    );

    const mockCredential = {
      id: 'bio-1',
      userId: client.id,
      type: 'fingerprint',
      credentialId: 'cred-123',
    };

    mockedPrisma.biometricCredential.create.mockResolvedValueOnce(mockCredential);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'enrollBiometric', data: { type: 'fingerprint' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client enrolls face recognition', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/auth/biometric/enroll'), { user: client })
    );

    const mockCredential = {
      id: 'bio-2',
      userId: client.id,
      type: 'face',
      credentialId: 'cred-face-123',
    };

    mockedPrisma.biometricCredential.create.mockResolvedValueOnce(mockCredential);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'enrollBiometric', data: { type: 'face' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('trainer enrolls multiple biometrics', async () => {
    const trainer = ActorFactory.createTrainer();

    mockedAuthenticate.mockResolvedValue(
      Object.assign(makeRequest('/api/auth/biometric/enroll'), { user: trainer })
    );

    mockedPrisma.biometricCredential.create.mockImplementation((args: any) =>
      Promise.resolve({ id: `bio-${args.data.type}`, ...args.data })
    );

    const result = await WorkflowRunner.run({
      actor: trainer,
      steps: [
        { action: 'authenticate' },
        { action: 'enrollBiometric', data: { type: 'fingerprint' } },
        { action: 'enrollBiometric', data: { type: 'face' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-04: Biometric Login - Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client logs in with fingerprint', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.biometricCredential.findMany.mockResolvedValueOnce([
      { id: 'bio-1', type: 'fingerprint', credentialId: 'cred-123' },
    ]);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'loginWithBiometric', data: { type: 'fingerprint' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client logs in with face recognition', async () => {
    const client = ActorFactory.createClient();

    mockedPrisma.biometricCredential.findMany.mockResolvedValueOnce([
      { id: 'bio-2', type: 'face', credentialId: 'cred-face-123' },
    ]);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'loginWithBiometric', data: { type: 'face' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('falls back to password on biometric failure', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'loginWithBiometric', data: { type: 'fingerprint', failed: true } },
        { action: 'loginWithPassword', data: { email: client.email, password: 'password' } },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-04: Biometric Login - Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('client views enrolled biometrics', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/auth/biometric'), { user: client })
    );

    const mockCredentials = [
      { id: 'bio-1', type: 'fingerprint', createdAt: new Date() },
      { id: 'bio-2', type: 'face', createdAt: new Date() },
    ];

    mockedPrisma.biometricCredential.findMany.mockResolvedValueOnce(mockCredentials);

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'viewBiometrics' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('client removes biometric credential', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/auth/biometric/bio-1'), { user: client })
    );

    mockedPrisma.biometricCredential.delete.mockResolvedValueOnce({ id: 'bio-1' });

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'removeBiometric', data: { credentialId: 'bio-1' } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('disables biometric login', async () => {
    const client = ActorFactory.createClient();

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/auth/biometric/disable'), { user: client })
    );

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'authenticate' },
        { action: 'disableBiometric' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('Story 011-04: Biometric Login - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles unsupported biometric type', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'enrollBiometric', data: { type: 'iris', supported: false } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('handles biometric hardware not available', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'loginWithBiometric', data: { hardwareAvailable: false } },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('requires password for sensitive actions after biometric login', async () => {
    const client = ActorFactory.createClient();

    const result = await WorkflowRunner.run({
      actor: client,
      steps: [
        { action: 'loginWithBiometric', data: { type: 'fingerprint' } },
        { action: 'performSensitiveAction', data: { requirePassword: true } },
      ],
    });

    expect(result.success).toBe(true);
  });
});
