/**
 * Bulk Assign Program API Route (Enterprise only)
 *
 * POST /api/programs/[id]/bulk-assign
 *
 * Assigns a program to multiple clients in a single Prisma $transaction.
 * Duplicate client IDs are silently deduped.
 * Invalid client IDs (no active trainer-client relationship) are returned as
 * warnings rather than failing the whole request.
 *
 * Response: { success, data: { created, skipped, warnings } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { withTier } from '@/lib/subscription/withTier';

export const dynamic = 'force-dynamic';

const bulkAssignSchema = z.object({
  clientIds: z.array(z.string().uuid()).min(1, 'At least one client ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
});

async function handler(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const { id: programId } = params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(programId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid program ID format' },
        { status: 400 },
      );
    }

    // Parse + validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const parseResult = bulkAssignSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parseResult.error.errors },
        { status: 400 },
      );
    }

    const { clientIds: rawClientIds, startDate } = parseResult.data;

    // Verify program ownership
    const program = await prisma.program.findFirst({
      where: { id: programId, trainerId: user.id },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 },
      );
    }

    // Deduplicate client IDs
    const uniqueClientIds = [...new Set(rawClientIds)];

    // Calculate dates
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + program.durationWeeks * 7);

    const warnings: string[] = [];
    let created = 0;
    let skipped = 0;

    // Process each client in a single transaction
    await prisma.$transaction(async (tx) => {
      for (const clientId of uniqueClientIds) {
        // Verify active trainer-client relationship
        const relation = await tx.trainerClient.findFirst({
          where: { trainerId: user.id, clientId, status: 'active' },
        });

        if (!relation) {
          warnings.push(`Client ${clientId}: not found or not an active client`);
          continue;
        }

        // Check for existing assignment (idempotent)
        const existing = await tx.programAssignment.findFirst({
          where: { programId, clientId },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await tx.programAssignment.create({
          data: {
            programId,
            clientId,
            trainerId: user.id,
            startDate: start,
            endDate: end,
          },
        });

        created++;
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: { created, skipped, warnings },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to bulk assign program';
    console.error('Error bulk-assigning program:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// Wrap with Enterprise tier gate
export const POST = withTier({ feature: 'programBuilder.bulkAssign' })(handler);
