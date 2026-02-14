/**
 * Tests for app/api/profiles/certifications/route.ts
 * GET /api/profiles/certifications
 * POST /api/profiles/certifications
 */

import { NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/profiles/certifications/route';
import { prisma } from '@/lib/db/prisma';
import { createMockRequest, mockTrainerUser, mockClientUser } from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma');
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const mockedPrisma = prisma as any;
const { authenticate } = require('@/lib/middleware/auth');

function mockAuthAs(user: any) {
  authenticate.mockResolvedValue({ user });
}

function mockAuthFailure() {
  authenticate.mockResolvedValue(
    NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  );
}

describe('GET /api/profiles/certifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest('/api/profiles/certifications');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns 403 when user is not trainer', async () => {
    mockAuthAs({ id: mockClientUser.id, role: 'client' });

    const request = createMockRequest('/api/profiles/certifications');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain('Only trainers');
  });

  it('successfully fetches certifications for trainer', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });

    const mockCertifications = [
      {
        id: 'cert-1',
        trainerId: mockTrainerUser.id,
        certificationName: 'CPT',
        issuingOrganization: 'NASM',
        credentialId: 'ABC123',
        issueDate: new Date('2020-01-01'),
        expiryDate: new Date('2025-01-01'),
        createdAt: new Date('2020-01-01'),
      },
      {
        id: 'cert-2',
        trainerId: mockTrainerUser.id,
        certificationName: 'Nutrition Specialist',
        issuingOrganization: 'ACE',
        credentialId: null,
        issueDate: new Date('2021-01-01'),
        expiryDate: null,
        createdAt: new Date('2021-01-01'),
      },
    ];

    mockedPrisma.trainerCertification.findMany.mockResolvedValue(mockCertifications);

    const request = createMockRequest('/api/profiles/certifications');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].certificationName).toBe('CPT');
  });

  it('returns empty array when no certifications', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerCertification.findMany.mockResolvedValue([]);

    const request = createMockRequest('/api/profiles/certifications');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('orders certifications by createdAt desc', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });

    const request = createMockRequest('/api/profiles/certifications');
    await GET(request);

    expect(mockedPrisma.trainerCertification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('handles database errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerCertification.findMany.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/profiles/certifications');
    const response = await GET(request);

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});

describe('POST /api/profiles/certifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest('/api/profiles/certifications', {
      method: 'POST',
      body: { certificationName: 'CPT', issuingOrganization: 'NASM' },
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns 403 when user is not trainer', async () => {
    mockAuthAs({ id: mockClientUser.id, role: 'client' });

    const request = createMockRequest('/api/profiles/certifications', {
      method: 'POST',
      body: { certificationName: 'CPT', issuingOrganization: 'NASM' },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain('Only trainers');
  });

  it('returns 400 when certificationName is missing', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });

    const request = createMockRequest('/api/profiles/certifications', {
      method: 'POST',
      body: { issuingOrganization: 'NASM' },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('required');
  });

  it('returns 400 when issuingOrganization is missing', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });

    const request = createMockRequest('/api/profiles/certifications', {
      method: 'POST',
      body: { certificationName: 'CPT' },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('required');
  });

  it('successfully creates certification with required fields only', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });

    const mockCertification = {
      id: 'cert-1',
      trainerId: mockTrainerUser.id,
      certificationName: 'CPT',
      issuingOrganization: 'NASM',
      credentialId: null,
      issueDate: null,
      expiryDate: null,
      createdAt: new Date(),
    };

    mockedPrisma.trainerCertification.create.mockResolvedValue(mockCertification);

    const request = createMockRequest('/api/profiles/certifications', {
      method: 'POST',
      body: { certificationName: 'CPT', issuingOrganization: 'NASM' },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.certificationName).toBe('CPT');
  });

  it('successfully creates certification with all fields', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });

    const mockCertification = {
      id: 'cert-1',
      trainerId: mockTrainerUser.id,
      certificationName: 'CPT',
      issuingOrganization: 'NASM',
      credentialId: 'ABC123',
      issueDate: new Date('2020-01-01'),
      expiryDate: new Date('2025-01-01'),
      createdAt: new Date(),
    };

    mockedPrisma.trainerCertification.create.mockResolvedValue(mockCertification);

    const request = createMockRequest('/api/profiles/certifications', {
      method: 'POST',
      body: {
        certificationName: 'CPT',
        issuingOrganization: 'NASM',
        credentialId: 'ABC123',
        issueDate: '2020-01-01',
        expiryDate: '2025-01-01',
      },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.credentialId).toBe('ABC123');
  });

  it('converts date strings to Date objects', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });

    mockedPrisma.trainerCertification.create.mockResolvedValue({
      id: 'cert-1',
      trainerId: mockTrainerUser.id,
      certificationName: 'CPT',
      issuingOrganization: 'NASM',
    } as any);

    const request = createMockRequest('/api/profiles/certifications', {
      method: 'POST',
      body: {
        certificationName: 'CPT',
        issuingOrganization: 'NASM',
        issueDate: '2020-01-01',
        expiryDate: '2025-01-01',
      },
    });
    await POST(request);

    expect(mockedPrisma.trainerCertification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          issueDate: expect.any(Date),
          expiryDate: expect.any(Date),
        }),
      })
    );
  });

  it('handles database errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerCertification.create.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/profiles/certifications', {
      method: 'POST',
      body: { certificationName: 'CPT', issuingOrganization: 'NASM' },
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});
