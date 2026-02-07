/**
 * Assign Program API Route
 *
 * POST /api/programs/[id]/assign - Assign program to client
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

const assignProgramSchema = z.object({
  clientId: z.string().uuid(),
  startDate: z.string(),
});

// POST /api/programs/[id]/assign - Assign program to client
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const { id } = params;
    const body = await request.json();
    const data = assignProgramSchema.parse(body);

    // Verify program ownership
    const program = await prisma.program.findFirst({
      where: { id, trainerId: user.id },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      );
    }

    // Check client relationship
    const clientRelation = await prisma.trainerClient.findFirst({
      where: {
        trainerId: user.id,
        clientId: data.clientId,
        status: 'active',
      },
    });

    if (!clientRelation) {
      return NextResponse.json(
        { success: false, error: 'Client not found or inactive' },
        { status: 403 }
      );
    }

    // Calculate end date
    const startDate = new Date(data.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (program.durationWeeks * 7));

    const assignment = await prisma.programAssignment.create({
      data: {
        programId: id,
        clientId: data.clientId,
        trainerId: user.id,
        startDate,
        endDate,
      },
      include: {
        program: true,
        client: {
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

    return NextResponse.json(
      { success: true, message: 'Program assigned successfully', data: assignment },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error assigning program:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to assign program' },
      { status: 500 }
    );
  }
}
