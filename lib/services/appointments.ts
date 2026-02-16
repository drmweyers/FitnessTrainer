/**
 * Appointment Service - Business logic for appointment operations
 */

import { prisma } from '@/lib/db/prisma';

export interface AppointmentConflict {
  id: string;
  title: string;
  startDatetime: Date;
  endDatetime: Date;
}

/**
 * Check for appointment conflicts for a trainer in a given time range
 *
 * @param trainerId - Trainer user ID
 * @param startTime - Appointment start time
 * @param endTime - Appointment end time
 * @param excludeAppointmentId - Optional appointment ID to exclude (for rescheduling)
 * @returns Conflicting appointment if found, null otherwise
 */
export async function checkAppointmentConflicts(
  trainerId: string,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string
): Promise<AppointmentConflict | null> {
  const conflict = await prisma.appointment.findFirst({
    where: {
      trainerId,
      status: { notIn: ['cancelled'] },
      ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
      AND: [
        { startDatetime: { lt: endTime } },
        { endDatetime: { gt: startTime } },
      ],
    },
    select: {
      id: true,
      title: true,
      startDatetime: true,
      endDatetime: true,
    },
  });

  return conflict;
}

/**
 * Generate email reminder data for an appointment
 *
 * @param appointmentId - Appointment ID
 * @returns Email reminder metadata
 */
export async function generateAppointmentReminder(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      trainer: {
        select: {
          email: true,
          userProfile: { select: { bio: true } },
        },
      },
      client: {
        select: {
          email: true,
          userProfile: { select: { bio: true } },
        },
      },
    },
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Calculate reminder time (24 hours before appointment)
  const reminderTime = new Date(appointment.startDatetime);
  reminderTime.setHours(reminderTime.getHours() - 24);

  const reminderData = {
    appointmentId: appointment.id,
    recipientEmail: appointment.client.email,
    trainerEmail: appointment.trainer.email,
    reminderTime,
    messageTemplate: {
      subject: `Reminder: ${appointment.title} - Tomorrow`,
      body: `Hi,

This is a reminder that you have an appointment scheduled:

Title: ${appointment.title}
Date: ${appointment.startDatetime.toLocaleDateString()}
Time: ${appointment.startDatetime.toLocaleTimeString()} - ${appointment.endDatetime.toLocaleTimeString()}
${appointment.location ? `Location: ${appointment.location}` : ''}
${appointment.isOnline && appointment.meetingLink ? `Meeting Link: ${appointment.meetingLink}` : ''}

${appointment.notes ? `Notes: ${appointment.notes}` : ''}

See you soon!`,
    },
  };

  return reminderData;
}

/**
 * Count participants for a group class appointment
 *
 * @param appointmentId - Appointment ID
 * @returns Participant count
 */
export async function getGroupClassParticipantCount(appointmentId: string): Promise<number> {
  // For now, return 1 (the client). In future, this could query a participants table
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { appointmentType: true },
  });

  if (!appointment || appointment.appointmentType !== 'group_class') {
    return 0;
  }

  // Placeholder: In a real implementation, this would query a participants table
  // For now, return 1 to indicate the appointment exists
  return 1;
}
