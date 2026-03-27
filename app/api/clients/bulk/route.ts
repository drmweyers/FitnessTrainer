/**
 * Bulk Client Operations API
 * POST /api/clients/bulk
 *
 * Supported actions:
 *   update-status  - Updates TrainerClient.status for all given clientIds
 *   assign-tags    - Replaces tag assignments for all given clientIds
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

const VALID_ACTIONS = ['update-status', 'assign-tags'] as const;
type BulkAction = (typeof VALID_ACTIONS)[number];

const VALID_STATUSES = ['active', 'inactive', 'onboarding', 'paused', 'archived'] as const;

/**
 * POST /api/clients/bulk
 * Performs a bulk operation on a set of clients.
 *
 * Body:
 *   action    - 'update-status' | 'assign-tags'
 *   clientIds - string[] (non-empty)
 *   value     - string (status) | string | string[] (tag ids)
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  if (req.user?.role !== 'trainer' && req.user?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Trainer or admin role required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { action, clientIds, value } = body as {
      action: BulkAction;
      clientIds: string[];
      value: string | string[];
    };

    // Validate action
    if (!action || !VALID_ACTIONS.includes(action as BulkAction)) {
      return NextResponse.json(
        { error: 'Validation Error', message: `action must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate clientIds
    if (!Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'clientIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate value is present
    if (value === undefined || value === null) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'value is required' },
        { status: 400 }
      );
    }

    if (action === 'update-status') {
      return await handleUpdateStatus(req.user!.id, clientIds, value as string);
    }

    if (action === 'assign-tags') {
      return await handleAssignTags(clientIds, value);
    }

    // Unreachable but TypeScript needs it
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error in bulk client operation:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Bulk operation failed' },
      { status: 500 }
    );
  }
}

/**
 * Updates the status for all specified trainer-client relationships.
 */
async function handleUpdateStatus(
  trainerId: string,
  clientIds: string[],
  status: string
): Promise<NextResponse> {
  if (!status) {
    return NextResponse.json(
      { error: 'Validation Error', message: 'value (status) is required for update-status action' },
      { status: 400 }
    );
  }

  const result = await prisma.trainerClient.updateMany({
    where: {
      trainerId,
      clientId: { in: clientIds },
    },
    data: { status: status as any },
  });

  return NextResponse.json({
    success: true,
    data: { updatedCount: result.count },
  });
}

/**
 * Replaces tag assignments for all specified clients with the given tag IDs.
 * Clears existing assignments first, then bulk-inserts the new ones.
 */
async function handleAssignTags(
  clientIds: string[],
  value: string | string[]
): Promise<NextResponse> {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return NextResponse.json(
      { error: 'Validation Error', message: 'value (tag ids) is required for assign-tags action' },
      { status: 400 }
    );
  }

  const tagIds = Array.isArray(value) ? value : [value];

  // Remove existing assignments for these clients
  await prisma.clientTagAssignment.deleteMany({
    where: { clientId: { in: clientIds } },
  });

  // Build cross-product of clientIds × tagIds
  const assignments = clientIds.flatMap((clientId) =>
    tagIds.map((tagId) => ({ clientId, tagId }))
  );

  await prisma.clientTagAssignment.createMany({
    data: assignments,
    skipDuplicates: true,
  });

  return NextResponse.json({
    success: true,
    data: { assignedCount: assignments.length },
  });
}
