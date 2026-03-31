/**
 * Support Tickets API Routes
 * GET /api/support/tickets - List tickets (admin sees all, users see own)
 * POST /api/support/tickets - Create a new support ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/support/tickets
 * Returns tickets for authenticated user (admin sees all, clients see own)
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {};

    if (userRole === 'admin') {
      // Admin can see all tickets
      if (status) {
        where.status = status;
      }
    } else {
      // Non-admin users can only see their own tickets
      where.userId = userId;
      if (status) {
        where.status = status;
      }
    }

    // Get tickets with user data
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
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
      prisma.supportTicket.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: 1,
        limit: total,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/support/tickets
 * Create a new support ticket
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  try {
    const body = await request.json();
    const { subject, message } = body;

    // Validation
    if (!subject || subject.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Validation Error', message: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Validation Error', message: 'Message is required' },
        { status: 400 }
      );
    }

    // Create the ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user!.id,
        subject: subject.trim(),
        message: message.trim(),
        status: 'open',
        replies: [],
      },
      include: {
        user: {
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
      { success: true, data: ticket },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
