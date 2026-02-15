/** @jest-environment node */
import { GET } from '@/app/api/clients/trainer/route';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// Mock the auth middleware
jest.mock('@/lib/middleware/auth', () => ({
  authenticate: jest.fn(),
}));

// Mock prisma
jest.mock('@/lib/db/prisma', () => ({
  __esModule: true,
  default: {
    trainerClient: {
      findFirst: jest.fn(),
    },
  },
}));

const { authenticate } = require('@/lib/middleware/auth');

describe('GET /api/clients/trainer', () => {
  const mockUserId = 'client-user-id-123';
  const mockTrainerId = 'trainer-user-id-456';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful authentication by default
    authenticate.mockResolvedValue({
      user: { id: mockUserId, email: 'client@example.com', role: 'client' },
    });
  });

  it('should return trainer info with WhatsApp number for connected client', async () => {
    // Mock database response with trainer connection
    const mockTrainerClient = {
      id: 'tc-123',
      trainerId: mockTrainerId,
      clientId: mockUserId,
      status: 'active',
      connectedAt: new Date('2026-01-01'),
      trainer: {
        id: mockTrainerId,
        email: 'coach.sarah@evofittrainer.com',
        role: 'trainer',
        userProfile: {
          whatsappNumber: '+1234567890',
          phone: '+1234567890',
        },
      },
    };

    (prisma.trainerClient.findFirst as jest.Mock).mockResolvedValue(mockTrainerClient);

    const request = new NextRequest('http://localhost:3000/api/clients/trainer');
    const response = await GET(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: {
        id: mockTrainerId,
        email: 'coach.sarah@evofittrainer.com',
        name: 'coach sarah',
        whatsappNumber: '+1234567890',
        phone: '+1234567890',
      },
    });

    // Verify prisma was called correctly
    expect(prisma.trainerClient.findFirst).toHaveBeenCalledWith({
      where: { clientId: mockUserId, status: 'active' },
      include: {
        trainer: {
          include: {
            userProfile: {
              select: {
                whatsappNumber: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { connectedAt: 'desc' },
    });
  });

  it('should return null data when no trainer connected', async () => {
    // Mock database response with no trainer connection
    (prisma.trainerClient.findFirst as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/clients/trainer');
    const response = await GET(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: null,
    });
  });

  it('should handle trainer without WhatsApp number', async () => {
    // Mock database response with trainer but no WhatsApp
    const mockTrainerClient = {
      id: 'tc-123',
      trainerId: mockTrainerId,
      clientId: mockUserId,
      status: 'active',
      connectedAt: new Date('2026-01-01'),
      trainer: {
        id: mockTrainerId,
        email: 'coach.mike@evofittrainer.com',
        role: 'trainer',
        userProfile: {
          whatsappNumber: null,
          phone: null,
        },
      },
    };

    (prisma.trainerClient.findFirst as jest.Mock).mockResolvedValue(mockTrainerClient);

    const request = new NextRequest('http://localhost:3000/api/clients/trainer');
    const response = await GET(request);

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: {
        id: mockTrainerId,
        email: 'coach.mike@evofittrainer.com',
        name: 'coach mike',
        whatsappNumber: null,
        phone: null,
      },
    });
  });

  it('should return 401 for unauthenticated request', async () => {
    // Mock authentication failure
    const mockErrorResponse = NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
    authenticate.mockResolvedValue(mockErrorResponse);

    const request = new NextRequest('http://localhost:3000/api/clients/trainer');
    const response = await GET(request);

    expect(response).toBe(mockErrorResponse);
    expect(response.status).toBe(401);

    // Prisma should not be called if auth fails
    expect(prisma.trainerClient.findFirst).not.toHaveBeenCalled();
  });

  it('should return 500 on database error', async () => {
    // Mock database error
    (prisma.trainerClient.findFirst as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/clients/trainer');
    const response = await GET(request);

    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: 'Failed to fetch trainer info',
    });
  });

  it('should handle email with underscores and dots in name formatting', async () => {
    // Mock database response with complex email
    const mockTrainerClient = {
      id: 'tc-123',
      trainerId: mockTrainerId,
      clientId: mockUserId,
      status: 'active',
      connectedAt: new Date('2026-01-01'),
      trainer: {
        id: mockTrainerId,
        email: 'john_doe.trainer@evofittrainer.com',
        role: 'trainer',
        userProfile: {
          whatsappNumber: '+1234567890',
          phone: '+1234567890',
        },
      },
    };

    (prisma.trainerClient.findFirst as jest.Mock).mockResolvedValue(mockTrainerClient);

    const request = new NextRequest('http://localhost:3000/api/clients/trainer');
    const response = await GET(request);

    const body = await response.json();
    expect(body.data.name).toBe('john doe trainer');
  });
});
