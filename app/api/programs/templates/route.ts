/**
 * Program Templates API Route
 *
 * GET /api/programs/templates - Get program templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

// GET /api/programs/templates - Get templates
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    const templates = await prisma.programTemplate.findMany({
      where: {
        isPublic: true,
        ...(category && { category }),
      },
      include: {
        program: {
          include: {
            weeks: {
              include: {
                workouts: {
                  include: {
                    exercises: {
                      include: {
                        exercise: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        creator: {
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
      orderBy: {
        useCount: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
