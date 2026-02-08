/**
 * Appointments API Routes - Main Endpoint
 *
 * GET /api/schedule/appointments - List appointments with filters
 * POST /api/schedule/appointments - Create new appointment
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

const createAppointmentSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  appointmentType: z.enum([
    'one_on_one', 'group_class', 'assessment', 'consultation', 'online_session',
  ]),
  startDatetime: z.string(),
  endDatetime: z.string(),
  location: z.string().max(255).optional(),
  isOnline: z.boolean().optional(),
  meetingLink: z.string().max(500).optional(),
  notes: z.string().optional(),
});

// GET /api/schedule/appointments
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      ...(user.role === 'client'
        ? { clientId: user.id }
        : { trainerId: user.id }),
      ...(status && { status: status as any }),
      ...(startDate || endDate
        ? {
            startDatetime: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
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
        orderBy: { startDatetime: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: appointments,
      meta: { total, hasMore: offset + limit < total, limit, offset },
    });
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// POST /api/schedule/appointments
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    if (user.role !== 'trainer' && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only trainers can create appointments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createAppointmentSchema.parse(body);

    const startDatetime = new Date(data.startDatetime);
    const endDatetime = new Date(data.endDatetime);

    if (startDatetime >= endDatetime) {
      return NextResponse.json(
        { success: false, error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Calculate duration in minutes
    const durationMinutes = Math.round(
      (endDatetime.getTime() - startDatetime.getTime()) / 60000
    );

    // Check for overlapping appointments for this trainer
    const conflict = await prisma.appointment.findFirst({
      where: {
        trainerId: user.id,
        status: { notIn: ['cancelled'] },
        AND: [
          { startDatetime: { lt: endDatetime } },
          { endDatetime: { gt: startDatetime } },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        { success: false, error: 'Time slot conflicts with an existing appointment' },
        { status: 409 }
      );
    }

    // Verify trainer availability for that day/time
    const dayOfWeek = startDatetime.getDay();
    const timeStr = startDatetime.toTimeString().slice(0, 5);
    const endTimeStr = endDatetime.toTimeString().slice(0, 5);

    const availability = await prisma.trainerAvailability.findFirst({
      where: {
        trainerId: user.id,
        dayOfWeek,
        isAvailable: true,
        startTime: { lte: timeStr },
        endTime: { gte: endTimeStr },
      },
    });

    if (!availability) {
      return NextResponse.json(
        { success: false, error: 'Time is outside your availability window' },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        trainerId: user.id,
        clientId: data.clientId,
        title: data.title,
        description: data.description,
        appointmentType: data.appointmentType as any,
        startDatetime,
        endDatetime,
        durationMinutes,
        location: data.location,
        isOnline: data.isOnline || false,
        meetingLink: data.meetingLink,
        notes: data.notes,
        status: 'scheduled',
      },
      include: {
        trainer: {
          select: { id: true, email: true },
        },
        client: {
          select: { id: true, email: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, message: 'Appointment created', data: appointment },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
