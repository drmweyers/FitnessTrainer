/**
 * Tests for PAR-Q responses stored via /api/profiles/health
 * PAR-Q is stored in the UserHealth.lifestyle JSON field under "parQ" key.
 */

import { NextResponse } from 'next/server';
import { GET, PUT } from '@/app/api/profiles/health/route';
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

describe('PAR-Q responses via /api/profiles/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('PUT - storing PAR-Q responses', () => {
    it('stores parQResponses in the lifestyle field', async () => {
      const parQData = { q1: 'no', q2: 'no', q3: 'yes', q4: 'no', q5: 'no', q6: 'no', q7: 'no' };
      const authReq = Object.assign(
        createMockRequest('/api/profiles/health', {
          method: 'PUT',
          body: { parQResponses: parQData },
        }),
        { user: { id: mockClientUser.id } }
      );
      const { authenticate } = require('@/lib/middleware/auth');
      (authenticate as jest.Mock).mockResolvedValue(authReq);

      const savedHealth = {
        userId: mockClientUser.id,
        lifestyle: { parQ: parQData },
      };
      mockPrisma.userHealth.upsert.mockResolvedValue(savedHealth);
      mockPrisma.profileCompletion.upsert.mockResolvedValue({});

      const response = await PUT(authReq);
      const { status, body } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(body.success).toBe(true);

      const upsertCall = mockPrisma.userHealth.upsert.mock.calls[0][0];
      expect(upsertCall.create.lifestyle).toEqual({ parQ: parQData });
      expect(upsertCall.update.lifestyle).toEqual({ parQ: parQData });
    });

    it('stores parQResponses without affecting other fields', async () => {
      const parQData = { q1: 'yes' };
      const authReq = Object.assign(
        createMockRequest('/api/profiles/health', {
          method: 'PUT',
          body: { bloodType: 'A+', parQResponses: parQData },
        }),
        { user: { id: mockClientUser.id } }
      );
      const { authenticate } = require('@/lib/middleware/auth');
      (authenticate as jest.Mock).mockResolvedValue(authReq);

      mockPrisma.userHealth.upsert.mockResolvedValue({});
      mockPrisma.profileCompletion.upsert.mockResolvedValue({});

      await PUT(authReq);

      const upsertCall = mockPrisma.userHealth.upsert.mock.calls[0][0];
      expect(upsertCall.create.bloodType).toBe('A+');
      expect(upsertCall.create.lifestyle).toEqual({ parQ: parQData });
    });

    it('does not include lifestyle in update when parQResponses not provided', async () => {
      const authReq = Object.assign(
        createMockRequest('/api/profiles/health', {
          method: 'PUT',
          body: { bloodType: 'B+' },
        }),
        { user: { id: mockClientUser.id } }
      );
      const { authenticate } = require('@/lib/middleware/auth');
      (authenticate as jest.Mock).mockResolvedValue(authReq);

      mockPrisma.userHealth.upsert.mockResolvedValue({});
      mockPrisma.profileCompletion.upsert.mockResolvedValue({});

      await PUT(authReq);

      const upsertCall = mockPrisma.userHealth.upsert.mock.calls[0][0];
      expect(upsertCall.update).not.toHaveProperty('lifestyle');
    });
  });

  describe('GET - retrieving PAR-Q responses', () => {
    it('returns health data including lifestyle with parQ', async () => {
      const parQData = { q1: 'no', q2: 'no' };
      const authReq = Object.assign(
        createMockRequest('/api/profiles/health'),
        { user: { id: mockClientUser.id } }
      );
      const { authenticate } = require('@/lib/middleware/auth');
      (authenticate as jest.Mock).mockResolvedValue(authReq);

      const mockHealth = {
        userId: mockClientUser.id,
        bloodType: 'O+',
        medicalConditions: [],
        medications: [],
        allergies: [],
        injuries: null,
        lifestyle: { parQ: parQData },
      };
      mockPrisma.userHealth.findUnique.mockResolvedValue(mockHealth);

      const response = await GET(authReq);
      const { status, body } = await parseJsonResponse(response);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.lifestyle.parQ).toEqual(parQData);
    });
  });
});
