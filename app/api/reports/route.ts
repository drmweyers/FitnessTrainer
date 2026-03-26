/**
 * Content Reports API Routes
 *
 * GET /api/reports - List reports (admin only)
 * POST /api/reports - Create a new content report (any authenticated user)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

const contentTypeEnum = z.enum(['exercise', 'program', 'user']);
const reasonEnum = z.enum(['inappropriate', 'incorrect', 'broken', 'other']);

const createReportSchema = z.object({
  contentType: contentTypeEnum,
  contentId: z.string().min(1),
  reason: reasonEnum,
  notes: z.string().max(2000).optional(),
});

/**
 * GET /api/reports
 * Admin only: returns all content reports
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const contentType = searchParams.get('contentType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      ...(status ? { status } : {}),
      ...(contentType ? { contentType } : {}),
    };

    const [reports, total] = await Promise.all([
      prisma.contentReport.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.contentReport.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reports,
      meta: { total, hasMore: offset + limit < total, limit, offset },
    });
  } catch (error: any) {
    console.error('Error fetching content reports:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports
 * Any authenticated user can report content
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const body = await request.json();
    const data = createReportSchema.parse(body);

    const report = await prisma.contentReport.create({
      data: {
        reporterId: user.id,
        contentType: data.contentType,
        contentId: data.contentId,
        reason: data.reason,
        notes: data.notes,
        status: 'pending',
      },
      include: {
        reporter: {
          select: { id: true, email: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, message: 'Report submitted', data: report },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating content report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create report' },
      { status: 500 }
    );
  }
}
