/**
 * Support Ticket Detail API Routes
 *
 * GET /api/support/tickets/[id] - Get ticket detail (admin or owner)
 * PUT /api/support/tickets/[id] - Update ticket status/add reply (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  reply: z.string().min(1).max(5000).optional(),
});

/**
 * GET /api/support/tickets/[id]
 * Admin: any ticket
 * Client/Trainer: own ticket only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            userProfile: { select: { bio: true, profilePhotoUrl: true } },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Non-admins can only view their own tickets
    if (user.role !== 'admin' && ticket.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: any) {
    console.error('Error fetching support ticket:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/support/tickets/[id]
 * Admin only: update status and/or add reply
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

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = updateTicketSchema.parse(body);

    const updateData: any = {};

    if (data.status) {
      updateData.status = data.status;
    }

    if (data.reply) {
      const existingReplies = Array.isArray(ticket.replies) ? ticket.replies : [];
      updateData.replies = [
        ...existingReplies,
        {
          message: data.reply,
          adminId: user.id,
          createdAt: new Date().toISOString(),
        },
      ];
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ticket updated',
      data: updatedTicket,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating support ticket:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
