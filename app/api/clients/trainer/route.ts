/**
 * GET /api/clients/trainer
 * Returns the authenticated client's trainer info (including WhatsApp number).
 * Used by the client dashboard to show the WhatsApp floating button.
 */
import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  try {
    const userId = req.user!.id;

    // Find the trainer connected to this client
    const trainerClient = await prisma.trainerClient.findFirst({
      where: { clientId: userId, status: 'active' },
      include: {
        trainer: {
          include: {
            userProfile: {
              select: {
                whatsappNumber: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { connectedAt: 'desc' },
    });

    if (!trainerClient) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const trainer = trainerClient.trainer;
    const name = trainer.email.split('@')[0].replace(/[._]/g, ' ');

    return NextResponse.json({
      success: true,
      data: {
        id: trainer.id,
        email: trainer.email,
        name,
        whatsappNumber: trainer.userProfile?.whatsappNumber || null,
        phone: trainer.userProfile?.phone || null,
      },
    });
  } catch (error) {
    console.error('Error fetching trainer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trainer info' },
      { status: 500 }
    );
  }
}
