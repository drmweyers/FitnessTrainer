import { NextRequest } from 'next/server';

const mockFindMany = jest.fn();
const mockFindFirst = jest.fn();
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
const mockCreate = jest.fn();
const mockTrainerClientFindFirst = jest.fn();
const mockTrainerClientCreate = jest.fn();

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    clientInvitation: {
      findMany: (...args: any[]) => mockFindMany(...args),
      findFirst: (...args: any[]) => mockFindFirst(...args),
      findUnique: (...args: any[]) => mockFindUnique(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
    user: {
      findUnique: (...args: any[]) => jest.fn().mockResolvedValue({ id: 'trainer-1', email: 'trainer@test.com' })(...args),
    },
    trainerClient: {
      findFirst: (...args: any[]) => mockTrainerClientFindFirst(...args),
      create: (...args: any[]) => mockTrainerClientCreate(...args),
    },
  },
}));

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
  AuthenticatedRequest: {},
}));

jest.mock('@/lib/services/email', () => ({
  sendClientInvitationEmail: jest.fn().mockResolvedValue({ success: true }),
}));

import { authenticate } from '@/lib/middleware/auth';

const mockAuth = authenticate as jest.MockedFunction<typeof authenticate>;

describe('GET /api/clients/invitations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns array of trainer invitations', async () => {
    const { GET } = require('@/app/api/clients/invitations/route');
    mockAuth.mockResolvedValue({ user: { id: 'trainer-1', role: 'trainer' } } as any);
    const mockInvitations = [
      { id: 'inv-1', clientEmail: 'a@test.com', status: 'pending' },
      { id: 'inv-2', clientEmail: 'b@test.com', status: 'accepted' },
    ];
    mockFindMany.mockResolvedValue(mockInvitations);

    const req = new NextRequest('http://localhost:3000/api/clients/invitations');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(2);
  });
});

describe('POST /api/clients/invitations/[id]/resend', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates token and expiresAt on resend', async () => {
    const { POST } = require('@/app/api/clients/invitations/[id]/resend/route');
    mockAuth.mockResolvedValue({ user: { id: 'trainer-1', role: 'trainer' } } as any);

    const existingInvitation = {
      id: 'inv-1',
      trainerId: 'trainer-1',
      clientEmail: 'client@test.com',
      token: 'old-token',
      status: 'pending',
    };
    mockFindFirst.mockResolvedValue(existingInvitation);

    const updatedInvitation = {
      ...existingInvitation,
      token: 'new-token',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    mockUpdate.mockResolvedValue(updatedInvitation);

    const req = new NextRequest('http://localhost:3000/api/clients/invitations/inv-1/resend', { method: 'POST' });
    const res = await POST(req, { params: { id: 'inv-1' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe('POST /api/clients/invitations/accept', () => {
  beforeEach(() => jest.clearAllMocks());

  it('marks invitation as accepted', async () => {
    const { POST } = require('@/app/api/clients/invitations/accept/route');
    mockAuth.mockResolvedValue({ user: { id: 'client-1', role: 'client' } } as any);

    const invitation = {
      id: 'inv-1',
      trainerId: 'trainer-1',
      clientEmail: 'client@test.com',
      token: 'valid-token',
      status: 'pending',
      expiresAt: new Date(Date.now() + 86400000),
    };
    mockFindFirst.mockResolvedValue(invitation);
    mockUpdate.mockResolvedValue({ ...invitation, status: 'accepted', acceptedAt: new Date() });
    mockTrainerClientFindFirst.mockResolvedValue(null);
    mockTrainerClientCreate.mockResolvedValue({ id: 'tc-1' });

    const req = new NextRequest('http://localhost:3000/api/clients/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token' }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv-1' },
        data: expect.objectContaining({ status: 'accepted' }),
      })
    );
  });
});
