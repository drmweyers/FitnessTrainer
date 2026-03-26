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
import { GET, PUT } from '@/app/api/support/tickets/[id]/route';

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

const routeContext = { params: { id: 'ticket-uuid-001' } };

describe('GET /api/support/tickets/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns ticket detail for admin', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets/ticket-uuid-001'), { user: mockAdminUser })
    );
    mockedPrisma.supportTicket.findUnique.mockResolvedValueOnce(mockTicket);

    const response = await GET(
      makeRequest('/api/support/tickets/ticket-uuid-001'),
      routeContext
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('ticket-uuid-001');
  });

  it('returns ticket for owner (client)', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets/ticket-uuid-001'), { user: mockClientUser })
    );
    mockedPrisma.supportTicket.findUnique.mockResolvedValueOnce(mockTicket);

    const response = await GET(
      makeRequest('/api/support/tickets/ticket-uuid-001'),
      routeContext
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 404 when ticket not found', async () => {
    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets/nonexistent'), { user: mockAdminUser })
    );
    mockedPrisma.supportTicket.findUnique.mockResolvedValueOnce(null);

    const response = await GET(
      makeRequest('/api/support/tickets/nonexistent'),
      { params: { id: 'nonexistent' } }
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('returns 403 when client tries to access another user ticket', async () => {
    const anotherClientTicket = { ...mockTicket, userId: 'other-client-id' };

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(makeRequest('/api/support/tickets/ticket-uuid-001'), { user: mockClientUser })
    );
    mockedPrisma.supportTicket.findUnique.mockResolvedValueOnce(anotherClientTicket);

    const response = await GET(
      makeRequest('/api/support/tickets/ticket-uuid-001'),
      routeContext
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });
});

describe('PUT /api/support/tickets/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin can update ticket status', async () => {
    const updateBody = { status: 'in_progress' };

    const request = new NextRequest('http://localhost:3000/api/support/tickets/ticket-uuid-001', {
      method: 'PUT',
      body: JSON.stringify(updateBody),
      headers: { 'Content-Type': 'application/json' },
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(request, { user: mockAdminUser })
    );
    mockedPrisma.supportTicket.findUnique.mockResolvedValueOnce(mockTicket);
    mockedPrisma.supportTicket.update.mockResolvedValueOnce({
      ...mockTicket,
      status: 'in_progress',
    });

    const response = await PUT(request, routeContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('in_progress');
  });

  it('admin can add a reply to ticket', async () => {
    const updateBody = { reply: 'We are looking into this issue.' };

    const request = new NextRequest('http://localhost:3000/api/support/tickets/ticket-uuid-001', {
      method: 'PUT',
      body: JSON.stringify(updateBody),
      headers: { 'Content-Type': 'application/json' },
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(request, { user: mockAdminUser })
    );
    mockedPrisma.supportTicket.findUnique.mockResolvedValueOnce(mockTicket);
    mockedPrisma.supportTicket.update.mockResolvedValueOnce({
      ...mockTicket,
      replies: [{ message: 'We are looking into this issue.', createdAt: new Date(), adminId: mockAdminUser.id }],
    });

    const response = await PUT(request, routeContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 403 when non-admin tries to update ticket', async () => {
    const request = new NextRequest('http://localhost:3000/api/support/tickets/ticket-uuid-001', {
      method: 'PUT',
      body: JSON.stringify({ status: 'resolved' }),
      headers: { 'Content-Type': 'application/json' },
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(request, { user: mockClientUser })
    );

    const response = await PUT(request, routeContext);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('returns 404 when ticket not found', async () => {
    const request = new NextRequest('http://localhost:3000/api/support/tickets/nonexistent', {
      method: 'PUT',
      body: JSON.stringify({ status: 'resolved' }),
      headers: { 'Content-Type': 'application/json' },
    });

    mockedAuthenticate.mockResolvedValueOnce(
      Object.assign(request, { user: mockAdminUser })
    );
    mockedPrisma.supportTicket.findUnique.mockResolvedValueOnce(null);

    const response = await PUT(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });
});
