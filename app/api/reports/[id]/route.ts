/**
 * Content Report Detail API Routes
 * PUT /api/reports/[id] - Update report status (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Valid statuses for reports
const VALID_STATUSES = ['pending', 'reviewing', 'resolved', 'dismissed'];

/**
 * PUT /api/reports/[id]
 * Update report status and/or add admin notes (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  try {
    const userRole = req.user!.role;
    const reportId = params.id;

    // Only admins can update reports
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if report exists
    const existingReport = await prisma.contentReport.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'Report not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, adminNotes } = body;

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Invalid status value',
          details: { validStatuses: VALID_STATUSES }
        },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (status) {
      updateData.status = status;
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes?.trim() || null;
    }

    // Update the report
    const updatedReport = await prisma.contentReport.update({
      where: { id: reportId },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      data: updatedReport,
    });
  } catch (error) {
    console.error('Error updating content report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: 'Failed to update report' },
      { status: 500 }
    );
  }
}
