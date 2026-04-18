import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { sendClientInvitationEmail } from '@/lib/services/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  if (req.user!.role !== 'trainer') {
    return NextResponse.json(
      { success: false, error: 'Only trainers can invite clients' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { clientEmail, customMessage } = body;

    if (!clientEmail || typeof clientEmail !== 'string' || !clientEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    const trainerId = req.user!.id;

    const existing = await prisma.clientInvitation.findFirst({
      where: {
        trainerId,
        clientEmail: clientEmail.toLowerCase(),
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const invitation = await prisma.clientInvitation.create({
      data: {
        trainerId,
        clientEmail: clientEmail.toLowerCase(),
        token,
        status: 'pending',
        customMessage: customMessage || null,
        expiresAt,
      },
    });

    const trainer = await prisma.user.findUnique({
      where: { id: trainerId },
      select: { email: true },
    });

    const invitationLink = `${APP_URL}/invite/${token}`;
    const trainerName = trainer?.email?.split('@')[0] || 'Your Trainer';

    await sendClientInvitationEmail(
      clientEmail.toLowerCase(),
      trainerName,
      invitationLink,
      customMessage || undefined
    );

    return NextResponse.json({ success: true, data: invitation });
  } catch (error) {
    console.error('Invite client error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
