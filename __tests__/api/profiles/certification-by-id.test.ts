/**
 * Tests for app/api/profiles/certifications/[id]/route.ts
 * PUT /api/profiles/certifications/[id]
 * DELETE /api/profiles/certifications/[id]
 */

import { NextResponse } from 'next/server';
import { PUT, DELETE } from '@/app/api/profiles/certifications/[id]/route';
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

describe('PUT /api/profiles/certifications/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest('/api/profiles/certifications/cert-1', {
      method: 'PUT',
      body: { certificationName: 'Updated CPT' },
    });
    const response = await PUT(request, { params: { id: 'cert-1' } });

    expect(response.status).toBe(401);
  });

  it('returns 403 when user is not trainer', async () => {
    mockAuthAs({ id: mockClientUser.id, role: 'client' });

    const request = createMockRequest('/api/profiles/certifications/cert-1', {
      method: 'PUT',
      body: { certificationName: 'Updated CPT' },
    });
    const response = await PUT(request, { params: { id: 'cert-1' } });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain('Only trainers');
  });

  it('returns 404 when certification not found', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerCertification.findFirst.mockResolvedValue(null);

    const request = createMockRequest('/api/profiles/certifications/cert-1', {
      method: 'PUT',
      body: { certificationName: 'Updated CPT' },
    });
    const response = await PUT(request, { params: { id: 'cert-1' } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Certification not found');
  });

  it('successfully updates certification name', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerCertification.findFirst.mockResolvedValue({
      id: 'cert-1',
      trainerId: mockTrainerUser.id,
      certificationName: 'CPT',
      issuingOrganization: 'NASM',
    });
    mockedPrisma.trainerCertification.update.mockResolvedValue({
      id: 'cert-1',
      trainerId: mockTrainerUser.id,
      certificationName: 'Updated CPT',
      issuingOrganization: 'NASM',
    });

    const request = createMockRequest('/api/profiles/certifications/cert-1', {
      method: 'PUT',
      body: { certificationName: 'Updated CPT' },
    });
    const response = await PUT(request, { params: { id: 'cert-1' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.certificationName).toBe('Updated CPT');
  });

  it('successfully updates multiple fields', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerCertification.findFirst.mockResolvedValue({
      id: 'cert-1',
      trainerId: mockTrainerUser.id,
    });
    mockedPrisma.trainerCertification.update.mockResolvedValue({
      id: 'cert-1',
      trainerId: mockTrainerUser.id,
      certificationName: 'Advanced CPT',
      issuingOrganization: 'ACE',
      credentialId: 'NEW123',
    });

    const request = createMockRequest('/api/profiles/certifications/cert-1', {
      method: 'PUT',
      body: {
        certificationName: 'Advanced CPT',
        issuingOrganization: 'ACE',
        credentialId: 'NEW123',
      },
    });
    const response = await PUT(request, { params: { id: 'cert-1' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('converts date strings to Date objects', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerCertification.findFirst.mockResolvedValue({
      id: 'cert-1',
      trainerId: mockTrainerUser.id,
    });
    mockedPrisma.trainerCertification.update.mockResolvedValue({} as any);

    const request = createMockRequest('/api/profiles/certifications/cert-1', {
      method: 'PUT',
      body: {
        issueDate: '2020-01-01',
        expiryDate: '2025-01-01',
      },
    });
    await PUT(request, { params: { id: 'cert-1' } });

    expect(mockedPrisma.trainerCertification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          issueDate: expect.any(Date),
          expiryDate: expect.any(Date),
        }),
      })
    );
  });

  it('handles null values correctly', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerCertification.findFirst.mockResolvedValue({
      id: 'cert-1',
      trainerId: mockTrainerUser.id,
    });
    mockedPrisma.trainerCertification.update.mockResolvedValue({} as any);

    const request = createMockRequest('/api/profiles/certifications/cert-1', {
      method: 'PUT',
      body: {
        credentialId: null,
        issueDate: null,
        expiryDate: null,
      },
    });
    await PUT(request, { params: { id: 'cert-1' } });

    expect(mockedPrisma.trainerCertification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          credentialId: null,
          issueDate: null,
          expiryDate: null,
        }),
      })
    );
  });

  it('only updates provided fields', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerCertification.findFirst.mockResolvedValue({
      id: 'cert-1',
      trainerId: mockTrainerUser.id,
    });
    mockedPrisma.trainerCertification.update.mockResolvedValue({} as any);

    const request = createMockRequest('/api/profiles/certifications/cert-1', {
      method: 'PUT',
      body: { certificationName: 'Updated Name' },
    });
    await PUT(request, { params: { id: 'cert-1' } });

    const updateCall = mockedPrisma.trainerCertification.update.mock.calls[0][0];
    expect(updateCall.data).toHaveProperty('certificationName');
    expect(updateCall.data).not.toHaveProperty('issuingOrganization');
  });

  it('handles database errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerCertification.findFirst.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/profiles/certifications/cert-1', {
      method: 'PUT',
      body: { certificationName: 'Updated' },
    });
    const response = await PUT(request, { params: { id: 'cert-1' } });

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});

describe('DELETE /api/profiles/certifications/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthFailure();

    const request = createMockRequest('/api/profiles/certifications/cert-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'cert-1' } });

    expect(response.status).toBe(401);
  });

  it('returns 403 when user is not trainer', async () => {
    mockAuthAs({ id: mockClientUser.id, role: 'client' });

    const request = createMockRequest('/api/profiles/certifications/cert-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'cert-1' } });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain('Only trainers');
  });

  it('returns 404 when certification not found', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerCertification.findFirst.mockResolvedValue(null);

    const request = createMockRequest('/api/profiles/certifications/cert-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'cert-1' } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Certification not found');
  });

  it('successfully deletes certification', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerCertification.findFirst.mockResolvedValue({
      id: 'cert-1',
      trainerId: mockTrainerUser.id,
      certificationName: 'CPT',
    });
    mockedPrisma.trainerCertification.delete.mockResolvedValue({});

    const request = createMockRequest('/api/profiles/certifications/cert-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'cert-1' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.deleted).toBe(true);
  });

  it('verifies trainer owns the certification', async () => {
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });

    const request = createMockRequest('/api/profiles/certifications/cert-1', {
      method: 'DELETE',
    });
    await DELETE(request, { params: { id: 'cert-1' } });

    expect(mockedPrisma.trainerCertification.findFirst).toHaveBeenCalledWith({
      where: { id: 'cert-1', trainerId: mockTrainerUser.id },
    });
  });

  it('handles database errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAuthAs({ id: mockTrainerUser.id, role: 'trainer' });
    mockedPrisma.trainerCertification.findFirst.mockRejectedValue(new Error('DB error'));

    const request = createMockRequest('/api/profiles/certifications/cert-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { id: 'cert-1' } });

    expect(response.status).toBe(500);
    consoleErrorSpy.mockRestore();
  });
});
