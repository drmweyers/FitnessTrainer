import { NextRequest } from 'next/server';

const mockCreate = jest.fn();
const mockFindFirst = jest.fn();
const mockFindUnique = jest.fn();

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    clientInvitation: {
      create: (...args: any[]) => mockCreate(...args),
      findFirst: (...args: any[]) => mockFindFirst(...args),
    },
    user: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
    },
  },
}));

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
  AuthenticatedRequest: {},
}));

jest.mock('@/lib/services/email', () => ({
  sendClientInvitationEmail: jest.fn().mockResolvedValue({ success: true, id: 'msg-123' }),
}));

import { POST } from '@/app/api/clients/invite/route';
import { authenticate } from '@/lib/middleware/auth';
import { sendClientInvitationEmail } from '@/lib/services/email';

const mockAuth = authenticate as jest.MockedFunction<typeof authenticate>;
const mockSendEmail = sendClientInvitationEmail as jest.MockedFunction<typeof sendClientInvitationEmail>;

function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/clients/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/clients/invite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUnique.mockResolvedValue({ id: 'trainer-1', email: 'trainer@test.com' });
  });

  it('returns 401 without auth token', async () => {
    const { NextResponse } = await import('next/server');
    mockAuth.mockResolvedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );
    const res = await POST(makeRequest({ clientEmail: 'client@test.com' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 with missing clientEmail', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'trainer-1', role: 'trainer' } } as any);
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 200 and creates invitation with valid data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'trainer-1', role: 'trainer' } } as any);
    mockFindFirst.mockResolvedValue(null);
    const mockInvitation = {
      id: 'inv-1',
      trainerId: 'trainer-1',
      clientEmail: 'client@test.com',
      token: 'test-token',
      status: 'pending',
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    mockCreate.mockResolvedValue(mockInvitation);

    const res = await POST(makeRequest({ clientEmail: 'client@test.com', customMessage: 'Welcome!' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.clientEmail).toBe('client@test.com');
  });

  it('returns existing invitation if duplicate pending exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'trainer-1', role: 'trainer' } } as any);
    const existingInvitation = {
      id: 'inv-existing',
      trainerId: 'trainer-1',
      clientEmail: 'client@test.com',
      token: 'existing-token',
      status: 'pending',
    };
    mockFindFirst.mockResolvedValue(existingInvitation);

    const res = await POST(makeRequest({ clientEmail: 'client@test.com' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe('inv-existing');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('calls sendClientInvitationEmail with correct parameters', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'trainer-1', role: 'trainer' } } as any);
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: 'inv-1',
      trainerId: 'trainer-1',
      clientEmail: 'client@test.com',
      token: 'generated-token',
      status: 'pending',
      customMessage: 'Join me!',
      sentAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
    });

    await POST(makeRequest({ clientEmail: 'client@test.com', customMessage: 'Join me!' }));

    expect(mockSendEmail).toHaveBeenCalledWith(
      'client@test.com',
      expect.any(String),
      expect.stringContaining('/invite/'),
      'Join me!'
    );
  });
});
