/**
 * Available Slots API Route
 *
 * GET /api/schedule/slots - Get available time slots for a trainer on a date
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticate } from '@/lib/middleware/auth';

// GET /api/schedule/slots?trainerId=xxx&date=2026-02-10&duration=60
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;

    const searchParams = request.nextUrl.searchParams;
    const trainerId = searchParams.get('trainerId');
    const dateStr = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '60');

    if (!trainerId || !dateStr) {
      return NextResponse.json(
        { success: false, error: 'trainerId and date are required' },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const dayOfWeek = date.getDay();

    // Get trainer availability for this day
    const availability = await prisma.trainerAvailability.findMany({
      where: {
        trainerId,
        dayOfWeek,
        isAvailable: true,
      },
      orderBy: { startTime: 'asc' },
    });

    if (availability.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Trainer is not available on this day',
      });
    }

    // Get existing appointments for this trainer on this date
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        trainerId,
        status: { notIn: ['cancelled'] },
        startDatetime: { gte: startOfDay },
        endDatetime: { lte: endOfDay },
      },
      orderBy: { startDatetime: 'asc' },
    });

    // Generate time slots from availability, minus booked appointments
    const slots: Array<{
      startTime: string;
      endTime: string;
      available: boolean;
    }> = [];

    for (const avail of availability) {
      const [startHour, startMin] = avail.startTime.split(':').map(Number);
      const [endHour, endMin] = avail.endTime.split(':').map(Number);

      let currentMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      while (currentMinutes + duration <= endMinutes) {
        const slotStartHour = Math.floor(currentMinutes / 60);
        const slotStartMin = currentMinutes % 60;
        const slotEndMin = currentMinutes + duration;
        const slotEndHour = Math.floor(slotEndMin / 60);
        const slotEndMinRemainder = slotEndMin % 60;

        const slotStart = `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}`;
        const slotEnd = `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMinRemainder).padStart(2, '0')}`;

        // Build actual datetime for comparison
        const slotStartDt = new Date(dateStr);
        slotStartDt.setHours(slotStartHour, slotStartMin, 0, 0);
        const slotEndDt = new Date(dateStr);
        slotEndDt.setHours(slotEndHour, slotEndMinRemainder, 0, 0);

        // Check if this slot overlaps with any existing appointment
        const isBooked = existingAppointments.some((appt) => {
          const apptStart = new Date(appt.startDatetime);
          const apptEnd = new Date(appt.endDatetime);
          return slotStartDt < apptEnd && slotEndDt > apptStart;
        });

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          available: !isBooked,
        });

        currentMinutes += 30; // Move in 30-min increments
      }
    }

    return NextResponse.json({
      success: true,
      data: slots,
      meta: { date: dateStr, trainerId, duration },
    });
  } catch (error: any) {
    console.error('Error fetching slots:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch slots' },
      { status: 500 }
    );
  }
}
