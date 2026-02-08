/**
 * Trainer Availability API Routes
 *
 * GET /api/schedule/availability - Get trainer's weekly availability
 * POST /api/schedule/availability - Create/update availability slots
 * DELETE /api/schedule/availability - Remove a specific slot
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticate, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

const createAvailabilitySchema = z.object({
  slots: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    isAvailable: z.boolean().optional(),
    location: z.string().max(255).optional(),
  })).min(1),
});

const deleteAvailabilitySchema = z.object({
  slotId: z.string().uuid(),
});

// GET /api/schedule/availability
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    const searchParams = request.nextUrl.searchParams;
    const trainerId = searchParams.get('trainerId') || user.id;

    const slots = await prisma.trainerAvailability.findMany({
      where: { trainerId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json({ success: true, data: slots });
  } catch (error: any) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

// POST /api/schedule/availability
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    if (user.role !== 'trainer' && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only trainers can set availability' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createAvailabilitySchema.parse(body);

    // Validate time ranges
    for (const slot of data.slots) {
      if (slot.startTime >= slot.endTime) {
        return NextResponse.json(
          { success: false, error: `Invalid time range: ${slot.startTime} - ${slot.endTime}` },
          { status: 400 }
        );
      }
    }

    // Upsert each slot (unique on trainerId + dayOfWeek + startTime)
    const results = await Promise.all(
      data.slots.map((slot) =>
        prisma.trainerAvailability.upsert({
          where: {
            trainerId_dayOfWeek_startTime: {
              trainerId: user.id,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
            },
          },
          update: {
            endTime: slot.endTime,
            isAvailable: slot.isAvailable ?? true,
            location: slot.location,
          },
          create: {
            trainerId: user.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isAvailable: slot.isAvailable ?? true,
            location: slot.location,
          },
        })
      )
    );

    return NextResponse.json(
      { success: true, message: 'Availability updated', data: results },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating availability:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update availability' },
      { status: 500 }
    );
  }
}

// DELETE /api/schedule/availability
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;
    const user = (authResult as AuthenticatedRequest).user!;

    if (user.role !== 'trainer' && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only trainers can modify availability' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = deleteAvailabilitySchema.parse(body);

    // Verify ownership
    const slot = await prisma.trainerAvailability.findUnique({
      where: { id: data.slotId },
    });

    if (!slot || slot.trainerId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Availability slot not found' },
        { status: 404 }
      );
    }

    await prisma.trainerAvailability.delete({
      where: { id: data.slotId },
    });

    return NextResponse.json({ success: true, message: 'Slot deleted' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error deleting availability:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete slot' },
      { status: 500 }
    );
  }
}
