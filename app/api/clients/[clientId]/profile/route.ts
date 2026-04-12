/**
 * Client Profile Edit API
 * PATCH /api/clients/[clientId]/profile
 *
 * Updates the editable fields of a client's profile:
 * - emergencyContactName / emergencyContactPhone (stored in ClientProfile.emergencyContact JSON)
 * - goals (stored in ClientProfile.goals JSON)
 * - limitations (stored in ClientProfile.injuries JSON)
 * - notes (stored in TrainerClient custom notes or ClientNote)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { clientId: string };
}

/**
 * PATCH /api/clients/[clientId]/profile
 * Updates inline-editable profile fields for a client.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  if (req.user?.role !== 'trainer' && req.user?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Trainer or admin role required' },
      { status: 403 }
    );
  }

  const { clientId } = params;

  // Verify trainer owns this client relationship
  if (req.user?.role === 'trainer') {
    const relationship = await prisma.trainerClient.findFirst({
      where: { trainerId: req.user.id, clientId },
    });
    if (!relationship) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Client not found in your roster' },
        { status: 404 }
      );
    }
  }

  try {
    const body = await request.json();
    const { phone, emergencyContactName, emergencyContactPhone, goals, limitations, notes } = body as {
      phone?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      goals?: { primaryGoal?: string } | string;
      limitations?: string;
      notes?: string;
    };

    // Build emergency contact JSON from individual name/phone fields
    const emergencyContact =
      emergencyContactName !== undefined || emergencyContactPhone !== undefined
        ? { name: emergencyContactName ?? '', phone: emergencyContactPhone ?? '' }
        : undefined;

    // Phone lives on UserProfile, not ClientProfile
    if (phone !== undefined) {
      await prisma.userProfile.upsert({
        where: { userId: clientId },
        create: { userId: clientId, phone: phone || null },
        update: { phone: phone || null },
      });
    }

    const normalizedGoals =
      goals !== undefined
        ? typeof goals === 'string'
          ? { primaryGoal: goals }
          : goals
        : undefined;

    // Upsert ClientProfile with new values
    await prisma.clientProfile.upsert({
      where: { userId: clientId },
      update: {
        ...(emergencyContact !== undefined && { emergencyContact }),
        ...(normalizedGoals !== undefined && { goals: normalizedGoals }),
        ...(limitations !== undefined && { injuries: { description: limitations } }),
      },
      create: {
        userId: clientId,
        fitnessLevel: 'beginner',
        ...(emergencyContact !== undefined && { emergencyContact }),
        ...(normalizedGoals !== undefined && { goals: normalizedGoals }),
        ...(limitations !== undefined && { injuries: { description: limitations } }),
      },
    });

    // Persist trainer notes as a ClientNote record
    if (notes !== undefined) {
      await prisma.clientNote.create({
        data: {
          trainerId: req.user!.id,
          clientId,
          note: notes,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating client profile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update client profile' },
      { status: 500 }
    );
  }
}
