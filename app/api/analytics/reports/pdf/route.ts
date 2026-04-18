import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db/prisma';
import { validatePdfRequest } from '@/lib/pdf/analyticsPdfValidation';
import { transformForTemplate } from '@/lib/pdf/analyticsPdfData';
import { renderPdf } from '@/lib/pdf/pdfRenderer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  const req = authResult as AuthenticatedRequest;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  try {
    const body = await request.json();
    const validation = validatePdfRequest(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { clientId, startDate, endDate, sections } = validation.data;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const targetUserId = userRole === 'trainer' ? clientId : userId;

    const [client, trainer, workoutSessions, measurements, trainingLoads, goals, performanceMetrics] = await Promise.all([
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, email: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      }),
      prisma.workoutSession.findMany({
        where: {
          clientId: targetUserId,
          scheduledDate: { gte: start, lte: end },
        },
        select: {
          status: true,
          totalDuration: true,
          totalVolume: true,
          totalSets: true,
          completedSets: true,
          averageRpe: true,
        },
        orderBy: { scheduledDate: 'asc' },
      }),
      prisma.userMeasurement.findMany({
        where: {
          userId: targetUserId,
          recordedAt: { gte: start, lte: end },
        },
        select: {
          weight: true,
          bodyFatPercentage: true,
          muscleMass: true,
          recordedAt: true,
        },
        orderBy: { recordedAt: 'asc' },
      }),
      prisma.trainingLoad.findMany({
        where: {
          userId: targetUserId,
          weekStartDate: { gte: start, lte: end },
        },
        select: {
          weekStartDate: true,
          acuteLoad: true,
          chronicLoad: true,
          loadRatio: true,
          totalVolume: true,
        },
        orderBy: { weekStartDate: 'asc' },
      }),
      prisma.userGoal.findMany({
        where: {
          userId: targetUserId,
          isActive: true,
        },
        include: {
          goalProgress: {
            where: { recordedDate: { gte: start, lte: end } },
            orderBy: { recordedDate: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.performanceMetric.findMany({
        where: {
          userId: targetUserId,
          recordedAt: { gte: start, lte: end },
        },
        select: {
          metricType: true,
          value: true,
          unit: true,
          recordedAt: true,
        },
        orderBy: { recordedAt: 'desc' },
      }),
    ]);

    const clientName = client?.email?.split('@')[0] || 'Client';
    const trainerName = trainer?.email?.split('@')[0] || 'Trainer';

    const templateData = transformForTemplate({
      sections,
      clientName,
      trainerName,
      startDate,
      endDate,
      workoutSessions,
      measurements,
      trainingLoads,
      goals,
      performanceMetrics,
    });

    const pdfBuffer = await renderPdf(templateData);

    const filename = `evofit-report-${clientName.replace(/\s+/g, '-').toLowerCase()}-${startDate}-to-${endDate}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
}
