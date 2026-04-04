/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock auth first
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
  AuthenticatedRequest: {},
}));

// Mock prisma
jest.mock('@/lib/db/prisma');

import { authenticate } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { GET, POST } from '@/app/api/support/tickets/route';

const mockedPrisma = prisma as any;
const mockedAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

const mockTrainerUser = {
  id: 'trainer-uuid-1234',
  email: 'trainer@test.com',
  role: 'trainer' as const,
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

const mockAdminUser = {
  id: 'admin-uuid-9999',
  email: 'admin@test.com',
  role: 'admin' as const,
  isActive: true,
  isVerified: true,
};

const mockTicket = {
  id: 'ticket-uuid-001',
  userId: 'client-uuid-5678',
  subject: 'Cannot log workout',
  message: 'I get an error when trying to log my workout session.',
  status: 'open',
  createdAt: new Date('2026-03-01T10:00:00Z'),
  updatedAt: new Date('2026-03-01T10:00:00Z'),
  replies: [],
  user: { id: 'client-uuid-5678', email: 'client@test.com', userProfile: null },
};

describe('GET /api/support/tickets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all tickets for admin user', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets'), { user: mockAdminUser })
    );
    mockedPrisma.supportTicket.findMany.mockResolvedValueOnce([mockTicket]);
    mockedPrisma.supportTicket.count.mockResolvedValueOnce(1);

    const response = await GET(makeRequest('/api/support/tickets'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].subject).toBe('Cannot log workout');
  });

  it('returns only own tickets for client user', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets'), { user: mockClientUser })
    );
    mockedPrisma.supportTicket.findMany.mockResolvedValueOnce([mockTicket]);
    mockedPrisma.supportTicket.count.mockResolvedValueOnce(1);

    const response = await GET(makeRequest('/api/support/tickets'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockedPrisma.supportTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'client-uuid-5678' }),
      })
    );
  });

  it('returns 401 when not authenticated', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );

    const response = await GET(makeRequest('/api/support/tickets'));
    expect(response.status).toBe(401);
  });

  it('supports status filter', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets?status=open'), { user: mockAdminUser })
    );
    mockedPrisma.supportTicket.findMany.mockResolvedValueOnce([mockTicket]);
    mockedPrisma.supportTicket.count.mockResolvedValueOnce(1);

    const response = await GET(makeRequest('/api/support/tickets?status=open'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('supports status filter for non-admin users', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets?status=open'), { user: mockClientUser })
    );
    mockedPrisma.supportTicket.findMany.mockResolvedValueOnce([mockTicket]);
    mockedPrisma.supportTicket.count.mockResolvedValueOnce(1);

    const response = await GET(makeRequest('/api/support/tickets?status=open'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockedPrisma.supportTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'client-uuid-5678', status: 'open' }),
      })
    );
  });

  it('returns 500 when database error occurs during fetch', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets'), { user: mockAdminUser })
    );
    mockedPrisma.supportTicket.findMany.mockRejectedValueOnce(new Error('DB connection failed'));

    const response = await GET(makeRequest('/api/support/tickets'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal Server Error');
  });
});

describe('POST /api/support/tickets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new ticket for authenticated user', async () => {
    const body = {
      subject: 'Payment issue',
      message: 'I was charged twice for this month.',
    };

    const createdTicket = {
      ...mockTicket,
      id: 'ticket-new-001',
      subject: body.subject,
      message: body.message,
      userId: mockClientUser.id,
    };

    mockedPrisma.supportTicket.create.mockResolvedValueOnce(createdTicket);

    const request = new NextRequest('http://localhost:3000/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(request, { user: mockClientUser })
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.subject).toBe(body.subject);
  });

  it('returns 400 when subject is missing', async () => {
    const body = { message: 'No subject provided' };

    const request = new NextRequest('http://localhost:3000/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const authedRequest = Object.assign(request, { user: mockClientUser });
    mockedAuthenticate.mockResolvedValueOnce(authedRequest);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 400 when message is missing', async () => {
    const body = { subject: 'Missing message' };

    const request = new NextRequest('http://localhost:3000/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const authedRequest = Object.assign(request, { user: mockClientUser });
    mockedAuthenticate.mockResolvedValueOnce(authedRequest);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 401 when not authenticated', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );

    const request = new NextRequest('http://localhost:3000/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify({ subject: 'Test', message: 'Test message' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 500 when database error occurs during creation', async () => {
    const body = {
      subject: 'Database Error Test',
      message: 'This will fail.',
    };

    mockedPrisma.supportTicket.create.mockRejectedValueOnce(new Error('DB connection failed'));

    const request = new NextRequest('http://localhost:3000/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(request, { user: mockClientUser })
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal Server Error');
  });
});
