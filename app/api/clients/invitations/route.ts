import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;

  if (req.user!.role !== 'trainer') {
    return NextResponse.json(
      { success: false, error: 'Only trainers can view invitations' },
      { status: 403 }
    );
  }

  try {
    const invitations = await prisma.clientInvitation.findMany({
      where: { trainerId: req.user!.id },
      orderBy: { sentAt: 'desc' },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('List invitations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}
