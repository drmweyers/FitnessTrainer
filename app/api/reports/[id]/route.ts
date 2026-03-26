/**
 * Content Report Detail API Routes
 *
 * PUT /api/reports/[id] - Update report status (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

const updateReportSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'resolved', 'dismissed']),
  adminNotes: z.string().max(2000).optional(),
});

/**
 * PUT /api/reports/[id]
 * Admin only: resolve or dismiss a content report
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const report = await prisma.contentReport.findUnique({
      where: { id: params.id },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = updateReportSchema.parse(body);

    const updatedReport = await prisma.contentReport.update({
      where: { id: params.id },
      data: {
        status: data.status,
        ...(data.adminNotes ? { adminNotes: data.adminNotes } : {}),
      },
      include: {
        reporter: {
          select: { id: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Report updated',
      data: updatedReport,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating content report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update report' },
      { status: 500 }
    );
  }
}
