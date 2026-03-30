/** @jest-environment node */

import {
  checkAppointmentConflicts,
  generateAppointmentReminder,
  getGroupClassParticipantCount,
} from '@/lib/services/appointments';
import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('appointments service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAppointmentConflicts', () => {
    const trainerId = 'trainer-1';
    const startTime = new Date('2026-03-15T10:00:00Z');
    const endTime = new Date('2026-03-15T11:00:00Z');

    it('returns null when no conflicts exist', async () => {
      (mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue(null);
      const result = await checkAppointmentConflicts(trainerId, startTime, endTime);
      expect(result).toBeNull();
    });

    it('returns conflict when one exists', async () => {
      const conflict = {
        id: 'appt-existing',
        title: 'Existing Session',
        startDatetime: new Date('2026-03-15T09:30:00Z'),
        endDatetime: new Date('2026-03-15T10:30:00Z'),
      };
      (mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue(conflict);
      const result = await checkAppointmentConflicts(trainerId, startTime, endTime);
      expect(result).toEqual(conflict);
    });

    it('queries with correct trainer and time range filters', async () => {
      (mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue(null);
      await checkAppointmentConflicts(trainerId, startTime, endTime);

      expect(mockPrisma.appointment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            trainerId,
            status: { notIn: ['cancelled'] },
          }),
        })
      );
    });

    it('excludes specified appointment ID when provided', async () => {
      (mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue(null);
      await checkAppointmentConflicts(trainerId, startTime, endTime, 'exclude-id');

      expect(mockPrisma.appointment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 'exclude-id' },
          }),
        })
      );
    });

    it('does not include id filter when excludeAppointmentId not provided', async () => {
      (mockPrisma.appointment.findFirst as jest.Mock).mockResolvedValue(null);
      await checkAppointmentConflicts(trainerId, startTime, endTime);

      const callArg = (mockPrisma.appointment.findFirst as jest.Mock).mock.calls[0][0];
      expect(callArg.where.id).toBeUndefined();
    });
  });

  describe('generateAppointmentReminder', () => {
    const mockAppointment = {
      id: 'appt-1',
      title: 'Leg Day',
      startDatetime: new Date('2026-03-15T10:00:00Z'),
      endDatetime: new Date('2026-03-15T11:00:00Z'),
      location: 'Main Gym',
      notes: 'Bring water',
      isOnline: false,
      meetingLink: null,
      trainer: {
        email: 'trainer@gym.com',
        userProfile: { bio: 'Expert trainer' },
      },
      client: {
        email: 'client@example.com',
        userProfile: { bio: null },
      },
    };

    it('returns reminder data for a valid appointment', async () => {
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment);
      const result = await generateAppointmentReminder('appt-1');

      expect(result.appointmentId).toBe('appt-1');
      expect(result.recipientEmail).toBe('client@example.com');
      expect(result.trainerEmail).toBe('trainer@gym.com');
      expect(result.messageTemplate.subject).toContain('Leg Day');
    });

    it('calculates reminder time 24 hours before appointment', async () => {
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment);
      const result = await generateAppointmentReminder('appt-1');

      const expectedReminderTime = new Date('2026-03-15T10:00:00Z');
      expectedReminderTime.setHours(expectedReminderTime.getHours() - 24);
      expect(result.reminderTime.getTime()).toBe(expectedReminderTime.getTime());
    });

    it('throws when appointment not found', async () => {
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(generateAppointmentReminder('nonexistent')).rejects.toThrow('Appointment not found');
    });

    it('includes location in message body when present', async () => {
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment);
      const result = await generateAppointmentReminder('appt-1');
      expect(result.messageTemplate.body).toContain('Main Gym');
    });

    it('excludes location in message when not present', async () => {
      const apptNoLocation = { ...mockAppointment, location: null };
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(apptNoLocation);
      const result = await generateAppointmentReminder('appt-1');
      expect(result.messageTemplate.body).not.toContain('Location:');
    });

    it('includes meeting link for online appointments', async () => {
      const onlineAppt = {
        ...mockAppointment,
        isOnline: true,
        meetingLink: 'https://meet.example.com/abc',
      };
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(onlineAppt);
      const result = await generateAppointmentReminder('appt-1');
      expect(result.messageTemplate.body).toContain('https://meet.example.com/abc');
    });

    it('excludes meeting link when not online', async () => {
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment);
      const result = await generateAppointmentReminder('appt-1');
      expect(result.messageTemplate.body).not.toContain('Meeting Link:');
    });

    it('includes notes when present', async () => {
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment);
      const result = await generateAppointmentReminder('appt-1');
      expect(result.messageTemplate.body).toContain('Bring water');
    });

    it('excludes notes section when notes are empty', async () => {
      const apptNoNotes = { ...mockAppointment, notes: null };
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(apptNoNotes);
      const result = await generateAppointmentReminder('appt-1');
      expect(result.messageTemplate.body).not.toContain('Notes:');
    });
  });

  describe('getGroupClassParticipantCount', () => {
    it('returns 1 for a group_class appointment', async () => {
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue({
        appointmentType: 'group_class',
      });
      const count = await getGroupClassParticipantCount('appt-1');
      expect(count).toBe(1);
    });

    it('returns 0 for non-group-class appointment types', async () => {
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue({
        appointmentType: 'one_on_one',
      });
      const count = await getGroupClassParticipantCount('appt-1');
      expect(count).toBe(0);
    });

    it('returns 0 when appointment not found', async () => {
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(null);
      const count = await getGroupClassParticipantCount('nonexistent');
      expect(count).toBe(0);
    });
  });
});
