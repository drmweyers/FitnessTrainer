import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { sendClientInvitationEmail } from '@/lib/services/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  if (req.user!.role !== 'trainer') {
    return NextResponse.json(
      { success: false, error: 'Only trainers can resend invitations' },
      { status: 403 }
    );
  }

  try {
    const { id } = params;
    const trainerId = req.user!.id;

    const invitation = await prisma.clientInvitation.findFirst({
      where: { id, trainerId },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      );
    }

    const newToken = crypto.randomUUID();
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const updated = await prisma.clientInvitation.update({
      where: { id },
      data: {
        token: newToken,
        status: 'pending',
        expiresAt: newExpiry,
      },
    });

    const trainer = await prisma.user.findUnique({
      where: { id: trainerId },
      select: { email: true },
    });

    const invitationLink = `${APP_URL}/invite/${newToken}`;
    const trainerName = trainer?.email?.split('@')[0] || 'Your Trainer';

    await sendClientInvitationEmail(
      invitation.clientEmail,
      trainerName,
      invitationLink,
      invitation.customMessage || undefined
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Resend invitation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend invitation' },
      { status: 500 }
    );
  }
}
