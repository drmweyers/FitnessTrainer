/**
 * Activities API Route
 *
 * GET /api/activities - Get paginated activity feed
 * Query params: page, limit, type (optional filter)
 * Role-based: trainer sees their clients' activities, client sees own, admin sees all
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const typeFilter = searchParams.get('type');
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    let whereClause: any = {};

    if (user.role === 'admin') {
      // Admin sees all activities
    } else if (user.role === 'trainer') {
      // Trainer sees own activities + their clients' activities
      const clientIds = await prisma.trainerClient.findMany({
        where: { trainerId: user.id, status: 'active' },
        select: { clientId: true },
      });
      const userIds = [user.id, ...clientIds.map((c) => c.clientId)];
      whereClause.userId = { in: userIds };
    } else {
      // Client sees only their own activities
      whereClause.userId = user.id;
    }

    if (typeFilter) {
      whereClause.type = typeFilter;
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              userProfile: {
                select: {
                  bio: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activity.count({ where: whereClause }),
    ]);

    // Map to ActivityFeedItem format expected by the frontend
    const items = activities.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      description: a.description || '',
      timestamp: a.createdAt.toISOString(),
      user: {
        id: a.user.id,
        name: a.user.email.split('@')[0],
        avatar: undefined,
      },
      metadata: a.metadata as Record<string, any> | undefined,
    }));

    return NextResponse.json({
      success: true,
      data: {
        activities: items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
