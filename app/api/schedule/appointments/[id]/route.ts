/**
 * Single Appointment API Routes
 *
 * GET /api/schedule/appointments/[id] - Get appointment details
 * PUT /api/schedule/appointments/[id] - Update appointment
 * DELETE /api/schedule/appointments/[id] - Cancel appointment
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

const updateAppointmentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  appointmentType: z.enum([
    'one_on_one', 'group_class', 'assessment', 'consultation', 'online_session',
  ]).optional(),
  startDatetime: z.string().optional(),
  endDatetime: z.string().optional(),
  location: z.string().max(255).optional(),
  isOnline: z.boolean().optional(),
  meetingLink: z.string().max(500).optional(),
  notes: z.string().optional(),
  status: z.enum([
    'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show',
  ]).optional(),
});

const cancelSchema = z.object({
  cancelReason: z.string().optional(),
});

// GET /api/schedule/appointments/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        trainer: {
          select: {
            id: true,
            email: true,
            userProfile: { select: { bio: true, profilePhotoUrl: true } },
          },
        },
        client: {
          select: {
            id: true,
            email: true,
            userProfile: { select: { bio: true, profilePhotoUrl: true } },
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check access: trainer or client
    if (appointment.trainerId !== user.id && appointment.clientId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Not authorized to view this appointment' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: appointment });
  } catch (error: any) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

// PUT /api/schedule/appointments/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const existing = await prisma.appointment.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (existing.trainerId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only the trainer can update this appointment' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = updateAppointmentSchema.parse(body);

    const updateData: any = {};

    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.appointmentType) updateData.appointmentType = data.appointmentType;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.isOnline !== undefined) updateData.isOnline = data.isOnline;
    if (data.meetingLink !== undefined) updateData.meetingLink = data.meetingLink;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status) updateData.status = data.status;

    // Handle rescheduling
    if (data.startDatetime || data.endDatetime) {
      const newStart = data.startDatetime ? new Date(data.startDatetime) : existing.startDatetime;
      const newEnd = data.endDatetime ? new Date(data.endDatetime) : existing.endDatetime;

      if (newStart >= newEnd) {
        return NextResponse.json(
          { success: false, error: 'End time must be after start time' },
          { status: 400 }
        );
      }

      // Check for conflicts (excluding current appointment)
      const conflict = await prisma.appointment.findFirst({
        where: {
          trainerId: existing.trainerId,
          id: { not: params.id },
          status: { notIn: ['cancelled'] },
          AND: [
            { startDatetime: { lt: newEnd } },
            { endDatetime: { gt: newStart } },
          ],
        },
      });

      if (conflict) {
        return NextResponse.json(
          { success: false, error: 'Rescheduled time conflicts with another appointment' },
          { status: 409 }
        );
      }

      updateData.startDatetime = newStart;
      updateData.endDatetime = newEnd;
      updateData.durationMinutes = Math.round(
        (newEnd.getTime() - newStart.getTime()) / 60000
      );
    }

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        trainer: { select: { id: true, email: true } },
        client: { select: { id: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment updated',
      data: appointment,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// DELETE /api/schedule/appointments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const existing = await prisma.appointment.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Trainer or the client can cancel
    if (existing.trainerId !== user.id && existing.clientId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Not authorized to cancel this appointment' },
        { status: 403 }
      );
    }

    let cancelReason: string | undefined;
    try {
      const body = await request.json();
      const parsed = cancelSchema.parse(body);
      cancelReason = parsed.cancelReason;
    } catch {
      // No body is fine for DELETE
    }

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: cancelReason || `Cancelled by ${user.role}`,
      },
    });

    // Check if this is a late cancellation (less than 24 hours before appointment)
    const hoursUntilAppointment = (existing.startDatetime.getTime() - Date.now()) / (1000 * 60 * 60);
    const isLateCancellation = hoursUntilAppointment < 24 && hoursUntilAppointment > 0;

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled',
      data: {
        ...appointment,
        ...(isLateCancellation && { lateCancellation: true }),
      },
    });
  } catch (error: any) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}
