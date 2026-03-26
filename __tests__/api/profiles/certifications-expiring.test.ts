/**
 * Tests for GET /api/profiles/certifications/expiring
 * Returns trainer certifications expiring within 30 days.
 */

import { NextResponse } from 'next/server';
import { GET } from '@/app/api/profiles/certifications/expiring/route';
import { prisma } from '@/lib/db/prisma';
import {
  mockTrainerUser,
  mockClientUser,
  createMockRequest,
  parseJsonResponse,
} from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma');

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const mockPrisma = prisma as any;

describe('GET /api/profiles/certifications/expiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('returns 401 when unauthenticated', async () => {
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );

    const request = createMockRequest('/api/profiles/certifications/expiring');
    const response = await GET(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 403 when user is not a trainer', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/certifications/expiring'),
      { user: { id: mockClientUser.id, role: 'client' } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    const response = await GET(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/trainer/i);
  });

  it('returns empty array when no certifications are expiring soon', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/certifications/expiring'),
      { user: { id: mockTrainerUser.id, role: 'trainer' } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.trainerCertification.findMany.mockResolvedValue([]);

    const response = await GET(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('returns certifications expiring within 30 days', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/certifications/expiring'),
      { user: { id: mockTrainerUser.id, role: 'trainer' } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    const expiringCert = {
      id: 'cert-001',
      trainerId: mockTrainerUser.id,
      certificationName: 'NASM-CPT',
      issuingOrganization: 'NASM',
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      credentialId: 'NASM-12345',
    };

    mockPrisma.trainerCertification.findMany.mockResolvedValue([expiringCert]);

    const response = await GET(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].certificationName).toBe('NASM-CPT');
  });

  it('queries with the correct where clause for expiry within 30 days', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/certifications/expiring'),
      { user: { id: mockTrainerUser.id, role: 'trainer' } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.trainerCertification.findMany.mockResolvedValue([]);

    await GET(authReq);

    const findManyCall = mockPrisma.trainerCertification.findMany.mock.calls[0][0];
    expect(findManyCall.where.trainerId).toBe(mockTrainerUser.id);
    expect(findManyCall.where.expiryDate).toBeDefined();
    expect(findManyCall.where.expiryDate.not).toBeNull();
    // The upper bound should be within ~31 days from now
    const upperBound: Date = findManyCall.where.expiryDate.lte;
    const diffDays = (upperBound.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(29);
    expect(diffDays).toBeLessThan(32);
  });

  it('includes daysUntilExpiry in each returned certification', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/certifications/expiring'),
      { user: { id: mockTrainerUser.id, role: 'trainer' } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    const expiryDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days
    const cert = {
      id: 'cert-001',
      trainerId: mockTrainerUser.id,
      certificationName: 'CPR',
      issuingOrganization: 'Red Cross',
      expiryDate,
    };
    mockPrisma.trainerCertification.findMany.mockResolvedValue([cert]);

    const response = await GET(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.data[0]).toHaveProperty('daysUntilExpiry');
    expect(body.data[0].daysUntilExpiry).toBeGreaterThanOrEqual(9);
    expect(body.data[0].daysUntilExpiry).toBeLessThanOrEqual(11);
  });

  it('returns 500 on database error', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/certifications/expiring'),
      { user: { id: mockTrainerUser.id, role: 'trainer' } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.trainerCertification.findMany.mockRejectedValue(new Error('DB error'));

    const response = await GET(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch expiring certifications');
  });
});
