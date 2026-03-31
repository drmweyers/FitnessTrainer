/**
 * Content Reports API Routes
 * GET /api/reports - List reports (admin only)
 * POST /api/reports - Create a new content report
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Valid content types and reasons
const VALID_CONTENT_TYPES = ['exercise', 'program', 'message', 'comment', 'user_profile'];
const VALID_REASONS = ['spam', 'inappropriate', 'copyright', 'harassment', 'misinformation', 'other', 'incorrect'];

/**
 * GET /api/reports
 * Returns all content reports (admin only)
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  try {
    const userRole = req.user!.role;

    // Only admins can view all reports
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Get reports with reporter data
    const [reports, total] = await Promise.all([
      prisma.contentReport.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              email: true,
              userProfile: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contentReport.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page: 1,
        limit: total,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error('Error fetching content reports:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports
 * Create a new content report
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  try {
    const body = await request.json();
    const { contentType, contentId, reason, notes } = body;

    // Validation
    if (!contentType || !VALID_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', message: 'Invalid content type' },
        { status: 400 }
      );
    }

    if (!contentId || contentId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Validation Error', message: 'Content ID is required' },
        { status: 400 }
      );
    }

    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', message: 'Invalid reason' },
        { status: 400 }
      );
    }

    // Create the report
    const report = await prisma.contentReport.create({
      data: {
        reporterId: req.user!.id,
        contentType,
        contentId: contentId.trim(),
        reason,
        notes: notes?.trim() || null,
        status: 'pending',
      },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            userProfile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: report },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating content report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: 'Failed to create report' },
      { status: 500 }
    );
  }
}
