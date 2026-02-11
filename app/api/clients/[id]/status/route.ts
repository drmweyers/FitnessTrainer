/**
 * Client Status API Route
 *
 * PATCH /api/clients/[id]/status - Update trainer-client relationship status
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

const updateStatusSchema = z.object({
  status: z.enum(['active', 'pending', 'offline', 'need_programming', 'archived']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    if (user.role !== 'trainer' && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Trainer or admin role required' },
        { status: 403 }
      );
    }

    const { id: clientId } = params;
    const body = await request.json();
    const data = updateStatusSchema.parse(body);

    const trainerClient = await prisma.trainerClient.findFirst({
      where: {
        trainerId: user.id,
        clientId,
      },
    });

    if (!trainerClient) {
      return NextResponse.json(
        { success: false, error: 'Client relationship not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.trainerClient.update({
      where: { id: trainerClient.id },
      data: {
        status: data.status as any,
        ...(data.status === 'archived' ? { archivedAt: new Date() } : {}),
      },
      include: {
        client: {
          select: { id: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Client status updated to ${data.status}`,
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating client status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update client status' },
      { status: 500 }
    );
  }
}
