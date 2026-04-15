/**
 * Tests for WhatsApp Business Link support in GET/PUT /api/profiles/me
 * and GET /api/clients/trainer
 */

import { NextResponse } from 'next/server';
import { GET, PUT } from '@/app/api/profiles/me/route';
import { GET as getTrainer } from '@/app/api/clients/trainer/route';
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

// ---------------------------------------------------------------------------
// GET /api/profiles/me — whatsappLink returned in profile data
// ---------------------------------------------------------------------------
describe('GET /api/profiles/me — whatsappLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('returns whatsappLink in userProfile when set', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me'),
      { user: { id: mockTrainerUser.id, email: mockTrainerUser.email, role: 'trainer' } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    const mockUser = {
      id: mockTrainerUser.id,
      email: mockTrainerUser.email,
      role: 'trainer',
      isActive: true,
      isVerified: true,
      createdAt: new Date('2024-01-01'),
      userProfile: {
        bio: 'Trainer bio',
        phone: '+1234567890',
        whatsappNumber: '+1234567890',
        whatsappLink: 'https://wa.me/15551234567',
      },
      userGoals: [],
      userMeasurements: [],
      profileCompletion: null,
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const response = await GET(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userProfile.whatsappLink).toBe('https://wa.me/15551234567');
  });

  it('returns null whatsappLink when not set', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me'),
      { user: { id: mockTrainerUser.id, email: mockTrainerUser.email, role: 'trainer' } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    const mockUser = {
      id: mockTrainerUser.id,
      email: mockTrainerUser.email,
      role: 'trainer',
      isActive: true,
      isVerified: true,
      createdAt: new Date('2024-01-01'),
      userProfile: {
        bio: 'Trainer bio',
        phone: null,
        whatsappNumber: null,
        whatsappLink: null,
      },
      userGoals: [],
      userMeasurements: [],
      profileCompletion: null,
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const response = await GET(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userProfile.whatsappLink).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// PUT /api/profiles/me — whatsappLink saved correctly
// ---------------------------------------------------------------------------
describe('PUT /api/profiles/me — whatsappLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('saves whatsappLink in create and update when provided', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me', {
        method: 'PUT',
        body: { whatsappLink: 'https://wa.me/15551234567' },
      }),
      { user: { id: mockTrainerUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    const savedProfile = {
      userId: mockTrainerUser.id,
      whatsappLink: 'https://wa.me/15551234567',
    };
    mockPrisma.userProfile.upsert.mockResolvedValue(savedProfile);
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    const response = await PUT(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.whatsappLink).toBe('https://wa.me/15551234567');

    const upsertCall = mockPrisma.userProfile.upsert.mock.calls[0][0];
    expect(upsertCall.create.whatsappLink).toBe('https://wa.me/15551234567');
    expect(upsertCall.update.whatsappLink).toBe('https://wa.me/15551234567');
  });

  it('saves whatsappLink as null when empty string is provided', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me', {
        method: 'PUT',
        body: { whatsappLink: '' },
      }),
      { user: { id: mockTrainerUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userProfile.upsert.mockResolvedValue({ whatsappLink: null });
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    await PUT(authReq);

    const upsertCall = mockPrisma.userProfile.upsert.mock.calls[0][0];
    // create sets it to null (empty string is falsy)
    expect(upsertCall.create.whatsappLink).toBeNull();
    // update sets it to null via the || null guard
    expect(upsertCall.update.whatsappLink).toBeNull();
  });

  it('does not include whatsappLink in update when field is absent from body', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me', {
        method: 'PUT',
        body: { bio: 'Updated bio' },
      }),
      { user: { id: mockTrainerUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userProfile.upsert.mockResolvedValue({ bio: 'Updated bio' });
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    await PUT(authReq);

    const upsertCall = mockPrisma.userProfile.upsert.mock.calls[0][0];
    expect(upsertCall.update).not.toHaveProperty('whatsappLink');
  });

  it('supports wa.me short-format links', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me', {
        method: 'PUT',
        body: { whatsappLink: 'wa.me/BusinessName' },
      }),
      { user: { id: mockTrainerUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userProfile.upsert.mockResolvedValue({ whatsappLink: 'wa.me/BusinessName' });
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    await PUT(authReq);

    const upsertCall = mockPrisma.userProfile.upsert.mock.calls[0][0];
    expect(upsertCall.create.whatsappLink).toBe('wa.me/BusinessName');
    expect(upsertCall.update.whatsappLink).toBe('wa.me/BusinessName');
  });

  it('supports links with pre-filled message query params', async () => {
    const link = 'https://wa.me/15551234567?text=Hi%20I%27m%20interested';
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me', {
        method: 'PUT',
        body: { whatsappLink: link },
      }),
      { user: { id: mockTrainerUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userProfile.upsert.mockResolvedValue({ whatsappLink: link });
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    await PUT(authReq);

    const upsertCall = mockPrisma.userProfile.upsert.mock.calls[0][0];
    expect(upsertCall.create.whatsappLink).toBe(link);
  });
});

// ---------------------------------------------------------------------------
// GET /api/clients/trainer — whatsappLink included in response
// ---------------------------------------------------------------------------
describe('GET /api/clients/trainer — whatsappLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('returns whatsappLink when trainer has one set', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/clients/trainer'),
      { user: { id: mockClientUser.id, email: mockClientUser.email, role: 'client' } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.trainerClient.findFirst.mockResolvedValue({
      trainer: {
        id: mockTrainerUser.id,
        email: mockTrainerUser.email,
        userProfile: {
          whatsappNumber: '+1234567890',
          whatsappLink: 'https://wa.me/15551234567',
          phone: '+1234567890',
        },
      },
    });

    const response = await getTrainer(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.whatsappLink).toBe('https://wa.me/15551234567');
  });

  it('returns null whatsappLink when trainer has no business link', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/clients/trainer'),
      { user: { id: mockClientUser.id, email: mockClientUser.email, role: 'client' } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.trainerClient.findFirst.mockResolvedValue({
      trainer: {
        id: mockTrainerUser.id,
        email: mockTrainerUser.email,
        userProfile: {
          whatsappNumber: '+1234567890',
          whatsappLink: null,
          phone: '+1234567890',
        },
      },
    });

    const response = await getTrainer(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.whatsappLink).toBeNull();
  });

  it('returns null data when no trainer is connected', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/clients/trainer'),
      { user: { id: mockClientUser.id, email: mockClientUser.email, role: 'client' } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.trainerClient.findFirst.mockResolvedValue(null);

    const response = await getTrainer(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });
});
