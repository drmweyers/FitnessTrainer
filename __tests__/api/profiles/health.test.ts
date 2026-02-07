/**
 * Tests for GET/PUT /api/profiles/health
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

describe('GET /api/profiles/health', () => {
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

    const request = createMockRequest('/api/profiles/health');
    const response = await GET(request);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns health data when it exists', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/health'),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    const mockHealth = {
      userId: mockClientUser.id,
      bloodType: 'O+',
      medicalConditions: ['asthma'],
      medications: ['inhaler'],
      allergies: ['peanuts'],
      injuries: null,
    };

    mockPrisma.userHealth.findUnique.mockResolvedValue(mockHealth);

    const response = await GET(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(mockHealth);
    expect(mockPrisma.userHealth.findUnique).toHaveBeenCalledWith({
      where: { userId: mockClientUser.id },
    });
  });

  it('returns null data when no health record exists', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/health'),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userHealth.findUnique.mockResolvedValue(null);

    const response = await GET(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  it('returns 500 on database error', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/health'),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userHealth.findUnique.mockRejectedValue(new Error('DB error'));

    const response = await GET(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch health data');
  });
});

describe('PUT /api/profiles/health', () => {
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

    const request = createMockRequest('/api/profiles/health', {
      method: 'PUT',
      body: { bloodType: 'A+' },
    });
    const response = await PUT(request);
    const { status } = await parseJsonResponse(response);

    expect(status).toBe(401);
  });

  it('creates health record via upsert', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/health', {
        method: 'PUT',
        body: {
          bloodType: 'AB-',
          medicalConditions: ['diabetes'],
          medications: ['insulin'],
          allergies: ['shellfish', 'dairy'],
          injuries: { knee: 'torn ACL' },
        },
      }),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    const createdHealth = {
      userId: mockClientUser.id,
      bloodType: 'AB-',
      medicalConditions: ['diabetes'],
      medications: ['insulin'],
      allergies: ['shellfish', 'dairy'],
      injuries: { knee: 'torn ACL' },
    };
    mockPrisma.userHealth.upsert.mockResolvedValue(createdHealth);
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    const response = await PUT(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(createdHealth);

    expect(mockPrisma.userHealth.upsert).toHaveBeenCalledWith({
      where: { userId: mockClientUser.id },
      create: {
        userId: mockClientUser.id,
        bloodType: 'AB-',
        medicalConditions: ['diabetes'],
        medications: ['insulin'],
        allergies: ['shellfish', 'dairy'],
        injuries: { knee: 'torn ACL' },
      },
      update: {
        bloodType: 'AB-',
        medicalConditions: ['diabetes'],
        medications: ['insulin'],
        allergies: ['shellfish', 'dairy'],
        injuries: { knee: 'torn ACL' },
      },
    });
  });

  it('uses default values when fields are missing', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/health', {
        method: 'PUT',
        body: { bloodType: 'O+' },
      }),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userHealth.upsert.mockResolvedValue({ bloodType: 'O+' });
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    await PUT(authReq);

    const upsertCall = mockPrisma.userHealth.upsert.mock.calls[0][0];
    expect(upsertCall.create.bloodType).toBe('O+');
    expect(upsertCall.create.medicalConditions).toEqual([]);
    expect(upsertCall.create.medications).toEqual([]);
    expect(upsertCall.create.allergies).toEqual([]);
    expect(upsertCall.create.injuries).toBeNull();
  });

  it('only includes defined fields in update payload', async () => {
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
    expect(upsertCall.update).toHaveProperty('bloodType', 'B+');
    // Undefined fields should not be in update
    expect(upsertCall.update).not.toHaveProperty('medicalConditions');
    expect(upsertCall.update).not.toHaveProperty('medications');
    expect(upsertCall.update).not.toHaveProperty('allergies');
    expect(upsertCall.update).not.toHaveProperty('injuries');
  });

  it('updates all fields when all provided', async () => {
    const allFields = {
      bloodType: 'A+',
      medicalConditions: ['hypertension'],
      medications: ['lisinopril'],
      allergies: ['penicillin'],
      injuries: 'lower back pain',
    };

    const authReq = Object.assign(
      createMockRequest('/api/profiles/health', {
        method: 'PUT',
        body: allFields,
      }),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userHealth.upsert.mockResolvedValue(allFields);
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    await PUT(authReq);

    const upsertCall = mockPrisma.userHealth.upsert.mock.calls[0][0];
    expect(upsertCall.update.bloodType).toBe('A+');
    expect(upsertCall.update.medicalConditions).toEqual(['hypertension']);
    expect(upsertCall.update.medications).toEqual(['lisinopril']);
    expect(upsertCall.update.allergies).toEqual(['penicillin']);
    expect(upsertCall.update.injuries).toBe('lower back pain');
  });

  it('updates profileCompletion with healthInfo: true', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/health', {
        method: 'PUT',
        body: { bloodType: 'O+' },
      }),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userHealth.upsert.mockResolvedValue({});
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    await PUT(authReq);

    expect(mockPrisma.profileCompletion.upsert).toHaveBeenCalledWith({
      where: { userId: mockClientUser.id },
      create: {
        userId: mockClientUser.id,
        healthInfo: true,
      },
      update: {
        healthInfo: true,
      },
    });
  });

  it('returns 500 on database error', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/health', {
        method: 'PUT',
        body: { bloodType: 'A+' },
      }),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userHealth.upsert.mockRejectedValue(new Error('DB error'));

    const response = await PUT(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to update health data');
  });

  it('handles empty body gracefully', async () => {
    const authReq = Object.assign(
      createMockRequest('/api/profiles/health', {
        method: 'PUT',
        body: {},
      }),
      { user: { id: mockClientUser.id } }
    );
    const { authenticate } = require('@/lib/middleware/auth');
    (authenticate as jest.Mock).mockResolvedValue(authReq);

    mockPrisma.userHealth.upsert.mockResolvedValue({});
    mockPrisma.profileCompletion.upsert.mockResolvedValue({});

    const response = await PUT(authReq);
    const { status, body } = await parseJsonResponse(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);

    const upsertCall = mockPrisma.userHealth.upsert.mock.calls[0][0];
    expect(upsertCall.create.bloodType).toBeNull();
    expect(upsertCall.create.medicalConditions).toEqual([]);
    expect(upsertCall.create.medications).toEqual([]);
    expect(upsertCall.create.allergies).toEqual([]);
    expect(upsertCall.create.injuries).toBeNull();
    // Update should be empty (no fields defined)
    expect(Object.keys(upsertCall.update)).toHaveLength(0);
  });
});
