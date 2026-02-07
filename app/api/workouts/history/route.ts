/**
 * Workout History API Route
 *
 * GET /api/workouts/history - Get workout history (completed sessions)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

// GET /api/workouts/history - Get workout history
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const clientId = searchParams.get('clientId');

    // Trainers can view client history
    let targetUserId = user.id;
    if (user.role === 'trainer' && clientId) {
      targetUserId = clientId;
    }

    const where: any = {
      ...(user.role === 'trainer' && !clientId
        ? { trainerId: user.id }
        : { clientId: targetUserId }),
      status: 'completed',
      ...(startDate || endDate
        ? {
            scheduledDate: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    const [sessions, total] = await Promise.all([
      prisma.workoutSession.findMany({
        where,
        include: {
          workout: {
            select: {
              name: true,
              workoutType: true,
              estimatedDuration: true,
            },
          },
          programAssignment: {
            select: {
              program: {
                select: {
                  name: true,
                  programType: true,
                },
              },
            },
          },
          exerciseLogs: {
            select: {
              id: true,
              exerciseId: true,
              skipped: true,
              personalBest: true,
              totalVolume: true,
              exercise: {
                select: {
                  name: true,
                  bodyPart: true,
                },
              },
            },
            orderBy: { orderIndex: 'asc' },
          },
          ...(user.role === 'trainer'
            ? {
                client: {
                  select: {
                    id: true,
                    email: true,
                    userProfile: {
                      select: {
                        bio: true,
                        profilePhotoUrl: true,
                      },
                    },
                  },
                },
              }
            : {}),
        },
        orderBy: { scheduledDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.workoutSession.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: sessions,
      meta: {
        total,
        hasMore: offset + limit < total,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error('Error fetching workout history:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
