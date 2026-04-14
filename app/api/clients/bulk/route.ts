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
import { getEntitlements } from '@/lib/subscription/EntitlementsService';

export const dynamic = 'force-dynamic';

const VALID_ACTIONS = ['update-status', 'assign-tags', 'remove-tag'] as const;
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
      return await handleUpdateStatus(req.user!.id, req.user!.role, clientIds, value as string);
    }

    if (action === 'assign-tags') {
      return await handleAssignTags(clientIds, value);
    }

    if (action === 'remove-tag') {
      return await handleRemoveTag(clientIds, value as string);
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
  role: string,
  clientIds: string[],
  status: string
): Promise<NextResponse> {
  if (!status) {
    return NextResponse.json(
      { error: 'Validation Error', message: 'value (status) is required for update-status action' },
      { status: 400 }
    );
  }

  if (!VALID_STATUSES.includes(status as any)) {
    return NextResponse.json(
      { error: 'Validation Error', message: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  // Enforce client tier limit when a trainer bulk-reactivates archived clients.
  // This prevents bypassing the Starter (5-client) cap by archiving + reactivating.
  if (status === 'active' && role === 'trainer') {
    const entitlements = await getEntitlements(trainerId);
    const { max, used } = entitlements.limits.clients;
    if (max !== -1) {
      // Count how many of the targeted clients are NOT currently active (they'd be newly activated)
      const currentlyInactive = await prisma.trainerClient.count({
        where: { trainerId, clientId: { in: clientIds }, status: { not: 'active' } },
      });
      if (used + currentlyInactive > max) {
        return NextResponse.json(
          {
            error: 'Tier Limit Reached',
            message: `Cannot reactivate ${currentlyInactive} clients — would exceed your ${max}-client limit (currently ${used} active). Upgrade to Professional for unlimited clients.`,
            upgradeRequired: true,
            currentTier: entitlements.tier,
          },
          { status: 403 }
        );
      }
    }
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
 * Removes a single tag from all specified clients.
 */
async function handleRemoveTag(clientIds: string[], tagId: string): Promise<NextResponse> {
  if (!tagId) {
    return NextResponse.json(
      { error: 'Validation Error', message: 'value (tagId) is required for remove-tag action' },
      { status: 400 }
    );
  }

  const result = await prisma.clientTagAssignment.deleteMany({
    where: { clientId: { in: clientIds }, tagId },
  });

  return NextResponse.json({
    success: true,
    data: { removedCount: result.count },
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
