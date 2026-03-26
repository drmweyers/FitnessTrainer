/**
 * Tests for gender field CRUD in /api/profiles/me
 * Verifies that gender is accepted in PUT and returned in GET.
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

describe('Gender field in /api/profiles/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('PUT - gender field', () => {
    it('accepts male gender and stores it', async () => {
      const authReq = Object.assign(
        createMockRequest('/api/profiles/me', {
          method: 'PUT',
          body: { gender: 'male' },
        }),
        { user: { id: mockClientUser.id } }
      );
      const { authenticate } = require('@/lib/middleware/auth');
      (authenticate as jest.Mock).mockResolvedValue(authReq);

      const createdProfile = { userId: mockClientUser.id, gender: 'male' };
      mockPrisma.userProfile.upsert.mockResolvedValue(createdProfile);
      mockPrisma.profileCompletion.upsert.mockResolvedValue({});

      const response = await PUT(authReq);
      const { status, body } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.gender).toBe('male');

      const upsertCall = mockPrisma.userProfile.upsert.mock.calls[0][0];
      expect(upsertCall.create.gender).toBe('male');
      expect(upsertCall.update.gender).toBe('male');
    });

    it('accepts female gender and stores it', async () => {
      const authReq = Object.assign(
        createMockRequest('/api/profiles/me', {
          method: 'PUT',
          body: { gender: 'female' },
        }),
        { user: { id: mockClientUser.id } }
      );
      const { authenticate } = require('@/lib/middleware/auth');
      (authenticate as jest.Mock).mockResolvedValue(authReq);

      mockPrisma.userProfile.upsert.mockResolvedValue({ gender: 'female' });
      mockPrisma.profileCompletion.upsert.mockResolvedValue({});

      const response = await PUT(authReq);
      const { status, body } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      const upsertCall = mockPrisma.userProfile.upsert.mock.calls[0][0];
      expect(upsertCall.create.gender).toBe('female');
    });

    it('accepts non-binary gender', async () => {
      const authReq = Object.assign(
        createMockRequest('/api/profiles/me', {
          method: 'PUT',
          body: { gender: 'non-binary' },
        }),
        { user: { id: mockClientUser.id } }
      );
      const { authenticate } = require('@/lib/middleware/auth');
      (authenticate as jest.Mock).mockResolvedValue(authReq);

      mockPrisma.userProfile.upsert.mockResolvedValue({ gender: 'non-binary' });
      mockPrisma.profileCompletion.upsert.mockResolvedValue({});

      await PUT(authReq);

      const upsertCall = mockPrisma.userProfile.upsert.mock.calls[0][0];
      expect(upsertCall.create.gender).toBe('non-binary');
    });

    it('accepts prefer-not-to-say gender', async () => {
      const authReq = Object.assign(
        createMockRequest('/api/profiles/me', {
          method: 'PUT',
          body: { gender: 'prefer-not-to-say' },
        }),
        { user: { id: mockClientUser.id } }
      );
      const { authenticate } = require('@/lib/middleware/auth');
      (authenticate as jest.Mock).mockResolvedValue(authReq);

      mockPrisma.userProfile.upsert.mockResolvedValue({ gender: 'prefer-not-to-say' });
      mockPrisma.profileCompletion.upsert.mockResolvedValue({});

      await PUT(authReq);

      const upsertCall = mockPrisma.userProfile.upsert.mock.calls[0][0];
      expect(upsertCall.create.gender).toBe('prefer-not-to-say');
    });

    it('sets gender to null when not provided', async () => {
      const authReq = Object.assign(
        createMockRequest('/api/profiles/me', {
          method: 'PUT',
          body: { bio: 'Some bio' },
        }),
        { user: { id: mockClientUser.id } }
      );
      const { authenticate } = require('@/lib/middleware/auth');
      (authenticate as jest.Mock).mockResolvedValue(authReq);

      mockPrisma.userProfile.upsert.mockResolvedValue({ bio: 'Some bio', gender: null });
      mockPrisma.profileCompletion.upsert.mockResolvedValue({});

      await PUT(authReq);

      const upsertCall = mockPrisma.userProfile.upsert.mock.calls[0][0];
      expect(upsertCall.create.gender).toBeNull();
      // gender not in update when not in body
      expect(upsertCall.update).not.toHaveProperty('gender');
    });

    it('counts gender as basicInfo completion', async () => {
      const authReq = Object.assign(
        createMockRequest('/api/profiles/me', {
          method: 'PUT',
          body: { gender: 'male' },
        }),
        { user: { id: mockClientUser.id } }
      );
      const { authenticate } = require('@/lib/middleware/auth');
      (authenticate as jest.Mock).mockResolvedValue(authReq);

      mockPrisma.userProfile.upsert.mockResolvedValue({ gender: 'male', bio: null, phone: null });
      mockPrisma.profileCompletion.upsert.mockResolvedValue({});

      await PUT(authReq);

      const completionCall = mockPrisma.profileCompletion.upsert.mock.calls[0][0];
      expect(completionCall.create.basicInfo).toBe(true);
    });
  });

  describe('GET - gender field returned', () => {
    it('returns gender field in user profile', async () => {
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
        userProfile: { gender: 'female', bio: null, phone: null },
        userGoals: [],
        userMeasurements: [],
        profileCompletion: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await GET(authReq);
      const { status, body } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.userProfile.gender).toBe('female');
    });
  });
});
