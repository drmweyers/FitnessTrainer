/**
 * Client API Routes
 * GET /api/clients - List clients for authenticated trainer
 * POST /api/clients - Create/add a new client
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/clients
 * Returns clients for the authenticated trainer
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build where clause for TrainerClient
    const where: any = {};

    if (userRole === 'trainer') {
      where.trainerId = userId;
    } else if (userRole === 'admin') {
      // Admin can see all trainer-client relationships
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (status) {
      where.status = status;
    }

    // Get trainer-client relationships with user data
    const [trainerClients, total] = await Promise.all([
      prisma.trainerClient.findMany({
        where,
        include: {
          client: {
            include: {
              userProfile: true,
              clientProfile: true,
            },
          },
        },
        orderBy: { connectedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.trainerClient.count({ where }),
    ]);

    // Map to response format
    const clients = trainerClients.map((tc) => ({
      id: tc.client.id,
      email: tc.client.email,
      displayName: tc.client.email,
      avatar: tc.client.userProfile?.profilePhotoUrl || null,
      isActive: tc.client.isActive,
      lastLoginAt: tc.client.lastLoginAt,
      trainerClient: {
        id: tc.id,
        status: tc.status,
        connectedAt: tc.connectedAt,
        archivedAt: tc.archivedAt,
      },
      userProfile: tc.client.userProfile
        ? {
            phone: tc.client.userProfile.phone,
            profilePhotoUrl: tc.client.userProfile.profilePhotoUrl,
          }
        : null,
      clientProfile: tc.client.clientProfile
        ? {
            fitnessLevel: tc.client.clientProfile.fitnessLevel,
            goals: tc.client.clientProfile.goals,
          }
        : null,
    }));

    // Apply search filter on mapped data if provided
    let filteredClients = clients;
    if (search) {
      const term = search.toLowerCase();
      filteredClients = clients.filter(
        (c) =>
          c.displayName?.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term)
      );
    }

    return NextResponse.json({
      clients: filteredClients,
      pagination: {
        total: search ? filteredClients.length : total,
        page,
        limit,
        totalPages: Math.ceil((search ? filteredClients.length : total) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients
 * Add a new client (create user + trainer-client relationship)
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  if (req.user?.role !== 'trainer' && req.user?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Trainer or admin role required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email, name, phone, goals } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const clientUser = await prisma.user.findUnique({ where: { email } });

    if (!clientUser) {
      return NextResponse.json(
        { error: 'Not Found', message: 'No user found with that email. Send an invitation instead.' },
        { status: 404 }
      );
    }

    // Check if relationship already exists
    const existing = await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: {
          trainerId: req.user!.id,
          clientId: clientUser.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Conflict', message: 'This client is already in your roster' },
        { status: 409 }
      );
    }

    // Create trainer-client relationship
    const trainerClient = await prisma.trainerClient.create({
      data: {
        trainerId: req.user!.id,
        clientId: clientUser.id,
        status: 'active',
        connectedAt: new Date(),
      },
      include: {
        client: {
          include: {
            userProfile: true,
            clientProfile: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: trainerClient.client.id,
        email: trainerClient.client.email,
        displayName: trainerClient.client.email,
        trainerClient: {
          id: trainerClient.id,
          status: trainerClient.status,
          connectedAt: trainerClient.connectedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create client' },
      { status: 500 }
    );
  }
}
