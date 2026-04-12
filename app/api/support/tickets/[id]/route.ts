/**
 * Support Ticket Detail API Routes
 * GET /api/support/tickets/[id] - Get ticket details
 * PUT /api/support/tickets/[id] - Update ticket (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/support/tickets/[id]
 * Returns ticket details for authorized users
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const ticketId = params.id;

    // Get the ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
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
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check authorization - admin can see all, users can only see their own
    if (userRole !== 'admin' && ticket.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/support/tickets/[id]
 * Update ticket status and/or add reply (admin only)
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
    const ticketId = params.id;

    // Only admins can update tickets
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if ticket exists
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!existingTicket) {
      return NextResponse.json(
        { success: false, error: 'Not Found', message: 'Ticket not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, reply } = body;

    // Build update data
    const updateData: any = {};

    if (status) {
      updateData.status = status;
    }

    // Add reply if provided
    if (reply && reply.trim() !== '') {
      const newReply = {
        message: reply.trim(),
        adminId: req.user!.id,
        createdAt: new Date().toISOString(),
      };

      // Append to existing replies
      const currentReplies = (existingTicket.replies as any[]) || [];
      updateData.replies = [...currentReplies, newReply];
    }

    // Update the ticket
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
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
    });

    return NextResponse.json({
      success: true,
      data: updatedTicket,
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
