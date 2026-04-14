/**
 * Program Templates API Route
 *
 * GET /api/programs/templates - Get program templates
 *
 * Enterprise trainers additionally receive team-shared templates from any
 * trainer in the same organisation. All other tiers receive only public templates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { attachEntitlements } from '@/lib/subscription/withTier';

export const dynamic = 'force-dynamic';

// GET /api/programs/templates - Get templates
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    // Determine whether this trainer has enterprise team-share access
    const entitlements = await attachEntitlements(request);
    const isEnterprise = entitlements?.features?.programBuilder?.teamShareTemplates === true;

    // Build where clause: public templates + team-shared templates for enterprise users
    const whereClause = isEnterprise
      ? {
          OR: [
            { isPublic: true },
            { isTeamShared: true },
          ],
          ...(category ? { category } : {}),
        }
      : {
          isPublic: true,
          ...(category ? { category } : {}),
        };

    const templates = await prisma.programTemplate.findMany({
      where: whereClause,
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
