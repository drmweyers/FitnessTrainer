/**
 * Tests for GET/PUT /api/profiles/me
 */

import { NextResponse } from 'next/server';
import { GET, PUT } from '@/app/api/profiles/me/route';
import { prisma } from '@/lib/db/prisma';
import {
  mockClientUser,
  createMockRequest,
  parseJsonResponse,
} from '@/tests/helpers/test-utils';

jest.mock('@/lib/db/prisma');

jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

const mockPrisma = prisma as any;

describe('GET /api/profiles/me', () => {
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

    const request = createMockRequest('/api/profiles/me');
    const response = await GET(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns user profile when authenticated', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me'),
      { user: { id: mockClientUser.id, email: mockClientUser.email, role: 'CLIENT' } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    const mockUser = {
      id: mockClientUser.id,
      email: mockClientUser.email,
      role: 'CLIENT',
      isActive: true,
      isVerified: true,
      createdAt: new Date('2024-01-01'),
      userProfile: { bio: 'Test bio', phone: '123' },
      userGoals: [],
      userMeasurements: [],
      profileCompletion: null,
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const response = await GET(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(mockClientUser.id);
    expect(body.data.email).toBe(mockClientUser.email);
    expect(body.data.userProfile.bio).toBe('Test bio');
  });

  it('returns 404 when user not found', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me'),
      { user: { id: 'nonexistent' } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.user.findUnique.mockResolvedValue(null);

    const response = await GET(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('User not found');
  });

  it('returns 500 on database error', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me'),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.user.findUnique.mockRejectedValue(new Error('DB connection failed'));

    const response = await GET(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch profile');
  });

  it('queries with correct select fields and relations', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me'),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.user.findUnique.mockResolvedValue({ id: mockClientUser.id });

    await GET(authReq);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockClientUser.id },
      select: expect.objectContaining({
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        userProfile: true,
        userGoals: expect.objectContaining({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        }),
        userMeasurements: expect.objectContaining({
          orderBy: { recordedAt: 'desc' },
          take: 5,
        }),
        profileCompletion: true,
      }),
    });
  });
});

describe('PUT /api/profiles/me', () => {
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

    const request = createMockRequest('/api/profiles/me', {
      method: 'PUT',
      body: { bio: 'test' },
    });
    const response = await PUT(request);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(401);
  });

  it('creates profile via upsert when it does not exist', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me', {
        method: 'PUT',
        body: {
          bio: 'New bio',
          gender: 'male',
          phone: '+1234567890',
          timezone: 'America/New_York',
          preferredUnits: 'imperial',
          isPublic: false,
        },
      }),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    const createdProfile = {
      userId: mockClientUser.id,
      bio: 'New bio',
      gender: 'male',
      phone: '+1234567890',
    };
    mockPrisma.userProfile.upsert.mockResolvedValue(createdProfile);
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    const response = await PUT(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(createdProfile);

    expect(mockPrisma.userProfile.upsert).toHaveBeenCalledWith({
      where: { userId: mockClientUser.id },
      create: expect.objectContaining({
        userId: mockClientUser.id,
        bio: 'New bio',
        gender: 'male',
        phone: '+1234567890',
        timezone: 'America/New_York',
        preferredUnits: 'imperial',
        isPublic: false,
      }),
      update: expect.objectContaining({
        bio: 'New bio',
        gender: 'male',
        phone: '+1234567890',
        timezone: 'America/New_York',
        preferredUnits: 'imperial',
        isPublic: false,
      }),
    });
  });

  it('uses default values for missing optional fields in create', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me', {
        method: 'PUT',
        body: { bio: 'Just bio' },
      }),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userProfile.upsert.mockResolvedValue({ bio: 'Just bio' });
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    await PUT(authReq);

    const upsertCall = mockPrisma.userProfile.upsert.mock.calls[0][0];
    expect(upsertCall.create.preferredUnits).toBe('metric');
    expect(upsertCall.create.isPublic).toBe(true);
    expect(upsertCall.create.dateOfBirth).toBeNull();
    expect(upsertCall.create.gender).toBeNull();
    expect(upsertCall.create.phone).toBeNull();
    expect(upsertCall.create.timezone).toBeNull();
  });

  it('converts dateOfBirth string to Date object', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me', {
        method: 'PUT',
        body: { dateOfBirth: '1990-05-15' },
      }),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userProfile.upsert.mockResolvedValue({});
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    await PUT(authReq);

    const upsertCall = mockPrisma.userProfile.upsert.mock.calls[0][0];
    expect(upsertCall.create.dateOfBirth).toEqual(new Date('1990-05-15'));
    expect(upsertCall.update.dateOfBirth).toEqual(new Date('1990-05-15'));
  });

  it('sets dateOfBirth to null when falsy', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me', {
        method: 'PUT',
        body: { dateOfBirth: '' },
      }),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userProfile.upsert.mockResolvedValue({});
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    await PUT(authReq);

    const upsertCall = mockPrisma.userProfile.upsert.mock.calls[0][0];
    expect(upsertCall.create.dateOfBirth).toBeNull();
    expect(upsertCall.update.dateOfBirth).toBeNull();
  });

  it('only includes defined fields in update payload', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me', {
        method: 'PUT',
        body: { bio: 'Updated bio' },
      }),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userProfile.upsert.mockResolvedValue({ bio: 'Updated bio' });
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    await PUT(authReq);

    const upsertCall = mockPrisma.userProfile.upsert.mock.calls[0][0];
    expect(upsertCall.update).toHaveProperty('bio', 'Updated bio');
    // Fields not in body should not be in update
    expect(upsertCall.update).not.toHaveProperty('gender');
    expect(upsertCall.update).not.toHaveProperty('phone');
  });

  it('updates profileCompletion after profile upsert', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me', {
        method: 'PUT',
        body: { bio: 'My bio', phone: '123' },
      }),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userProfile.upsert.mockResolvedValue({
      bio: 'My bio',
      phone: '123',
      gender: null,
    });
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    await PUT(authReq);

    expect(mockPrisma.profileCompletion.upsert).toHaveBeenCalledWith({
      where: { userId: mockClientUser.id },
      create: {
        userId: mockClientUser.id,
        basicInfo: true, // bio and phone are truthy
      },
      update: {
        basicInfo: true, // bio || phone is truthy
      },
    });
  });

  it('sets basicInfo to false when no bio/phone/gender', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me', {
        method: 'PUT',
        body: { timezone: 'UTC' },
      }),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userProfile.upsert.mockResolvedValue({
      bio: null,
      phone: null,
      gender: null,
    });
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    await PUT(authReq);

    const completionCall = mockPrisma.profileCompletion.upsert.mock.calls[0][0];
    expect(completionCall.create.basicInfo).toBe(false);
    expect(completionCall.update.basicInfo).toBe(false);
  });

  it('returns 500 on database error', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/me', {
        method: 'PUT',
        body: { bio: 'test' },
      }),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userProfile.upsert.mockRejectedValue(new Error('DB error'));

    const response = await PUT(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to update profile');
  });
});
