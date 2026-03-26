/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
  AuthenticatedRequest: {},
}));

jest.mock('@/lib/db/prisma');

import { authenticate } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { GET, POST } from '@/app/api/reports/route';
import { PUT } from '@/app/api/reports/[id]/route';

const mockedPrisma = prisma as any;
const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

const mockAdminUser = {
  id: 'admin-uuid-9999',
  email: 'admin@test.com',
  role: 'admin' as const,
  isActive: true,
  isVerified: true,
};

const mockClientUser = {
  id: 'client-uuid-5678',
  email: 'client@test.com',
  role: 'client' as const,
  isActive: true,
  isVerified: true,
};

const mockReport = {
  id: 'report-uuid-001',
  reporterId: 'client-uuid-5678',
  contentType: 'exercise',
  contentId: 'exercise-uuid-123',
  reason: 'incorrect',
  notes: 'The exercise description is wrong.',
  status: 'pending',
  createdAt: new Date('2026-03-01T10:00:00Z'),
  updatedAt: new Date('2026-03-01T10:00:00Z'),
  reporter: { id: 'client-uuid-5678', email: 'client@test.com' },
};

describe('GET /api/reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all reports for admin', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/reports'), { user: mockAdminUser })
    );
    mockedPrisma.contentReport.findMany.mockResolvedValueOnce([mockReport]);
    mockedPrisma.contentReport.count.mockResolvedValueOnce(1);

    const response = await GET(makeRequest('/api/reports'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].reason).toBe('incorrect');
  });

  it('returns 403 for non-admin users', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/reports'), { user: mockClientUser })
    );

    const response = await GET(makeRequest('/api/reports'));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('returns 401 when not authenticated', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );

    const response = await GET(makeRequest('/api/reports'));
    expect(response.status).toBe(401);
  });

  it('supports status filter', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/reports?status=pending'), { user: mockAdminUser })
    );
    mockedPrisma.contentReport.findMany.mockResolvedValueOnce([mockReport]);
    mockedPrisma.contentReport.count.mockResolvedValueOnce(1);

    const response = await GET(makeRequest('/api/reports?status=pending'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe('POST /api/reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new report for authenticated user', async () => {
    const body = {
      contentType: 'exercise',
      contentId: 'exercise-uuid-123',
      reason: 'inappropriate',
      notes: 'This content is offensive.',
    };

    const request = new NextRequest('http://localhost:3000/api/reports', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(request, { user: mockClientUser })
    );

    mockedPrisma.contentReport.create.mockResolvedValueOnce({
      ...mockReport,
      reason: body.reason,
      notes: body.notes,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.reason).toBe('inappropriate');
  });

  it('returns 400 for invalid content type', async () => {
    const body = {
      contentType: 'invalid_type',
      contentId: 'some-uuid',
      reason: 'inappropriate',
    };

    const request = new NextRequest('http://localhost:3000/api/reports', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(request, { user: mockClientUser })
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 400 for invalid reason', async () => {
    const body = {
      contentType: 'exercise',
      contentId: 'exercise-uuid-123',
      reason: 'invalid_reason',
    };

    const request = new NextRequest('http://localhost:3000/api/reports', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(request, { user: mockClientUser })
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 401 when not authenticated', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );

    const request = new NextRequest('http://localhost:3000/api/reports', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'exercise', contentId: 'id', reason: 'incorrect' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});

describe('PUT /api/reports/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin can resolve a report', async () => {
    const request = new NextRequest('http://localhost:3000/api/reports/report-uuid-001', {
      method: 'PUT',
      body: JSON.stringify({ status: 'resolved' }),
      headers: { 'Content-Type': 'application/json' },
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(request, { user: mockAdminUser })
    );
    mockedPrisma.contentReport.findUnique.mockResolvedValueOnce(mockReport);
    mockedPrisma.contentReport.update.mockResolvedValueOnce({
      ...mockReport,
      status: 'resolved',
    });

    const response = await PUT(request, { params: { id: 'report-uuid-001' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('resolved');
  });

  it('returns 403 for non-admin users', async () => {
    const request = new NextRequest('http://localhost:3000/api/reports/report-uuid-001', {
      method: 'PUT',
      body: JSON.stringify({ status: 'resolved' }),
      headers: { 'Content-Type': 'application/json' },
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(request, { user: mockClientUser })
    );

    const response = await PUT(request, { params: { id: 'report-uuid-001' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('returns 404 when report not found', async () => {
    const request = new NextRequest('http://localhost:3000/api/reports/nonexistent', {
      method: 'PUT',
      body: JSON.stringify({ status: 'resolved' }),
      headers: { 'Content-Type': 'application/json' },
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(request, { user: mockAdminUser })
    );
    mockedPrisma.contentReport.findUnique.mockResolvedValueOnce(null);

    const response = await PUT(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });
});
