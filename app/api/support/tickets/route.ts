/**
 * Support Tickets API Routes
 *
 * GET /api/support/tickets - List tickets (admin: all, user: own)
 * POST /api/support/tickets - Create a new support ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(255),
  message: z.string().min(1, 'Message is required').max(5000),
});

/**
 * GET /api/support/tickets
 * Admin: returns all tickets
 * Client/Trainer: returns own tickets only
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      ...(user.role !== 'admin' ? { userId: user.id } : {}),
      ...(status ? { status } : {}),
    };

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              userProfile: { select: { bio: true, profilePhotoUrl: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: tickets,
      meta: { total, hasMore: offset + limit < total, limit, offset },
    });
  } catch (error: any) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/support/tickets
 * Any authenticated user can create a support ticket
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const body = await request.json();
    const data = createTicketSchema.parse(body);

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject: data.subject,
        message: data.message,
        status: 'open',
        replies: [],
      },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, message: 'Ticket created', data: ticket },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
