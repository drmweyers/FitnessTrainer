/**
 * @jest-environment node
 */

import { checkAppointmentConflicts, generateAppointmentReminder, getGroupClassParticipantCount } from '@/lib/services/appointments';
import { prisma } from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    appointment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('Appointment Services', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAppointmentConflicts', () => {
    it('should return null when no conflicts exist', async () => {
      (prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await checkAppointmentConflicts(
        'trainer-1',
        new Date('2026-02-20T10:00:00Z'),
        new Date('2026-02-20T11:00:00Z')
      );

      expect(result).toBeNull();
      expect(prisma.appointment.findFirst).toHaveBeenCalledWith({
        where: {
          trainerId: 'trainer-1',
          status: { notIn: ['cancelled'] },
          AND: [
            { startDatetime: { lt: new Date('2026-02-20T11:00:00Z') } },
            { endDatetime: { gt: new Date('2026-02-20T10:00:00Z') } },
          ],
        },
        select: {
          id: true,
          title: true,
          startDatetime: true,
          endDatetime: true,
        },
      });
    });

    it('should return conflict when overlapping appointment exists', async () => {
      const mockConflict = {
        id: 'appt-1',
        title: 'Existing Appointment',
        startDatetime: new Date('2026-02-20T10:30:00Z'),
        endDatetime: new Date('2026-02-20T11:30:00Z'),
      };

      (prisma.appointment.findFirst as jest.Mock).mockResolvedValue(mockConflict);

      const result = await checkAppointmentConflicts(
        'trainer-1',
        new Date('2026-02-20T10:00:00Z'),
        new Date('2026-02-20T11:00:00Z')
      );

      expect(result).toEqual(mockConflict);
    });

    it('should exclude specified appointment when checking conflicts', async () => {
      (prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null);

      await checkAppointmentConflicts(
        'trainer-1',
        new Date('2026-02-20T10:00:00Z'),
        new Date('2026-02-20T11:00:00Z'),
        'exclude-appt-1'
      );

      expect(prisma.appointment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 'exclude-appt-1' },
          }),
        })
      );
    });
  });

  describe('generateAppointmentReminder', () => {
    it('should generate reminder data for appointment', async () => {
      const mockAppointment = {
        id: 'appt-1',
        title: 'Training Session',
        startDatetime: new Date('2026-02-21T10:00:00Z'),
        endDatetime: new Date('2026-02-21T11:00:00Z'),
        location: 'Main Gym',
        isOnline: false,
        meetingLink: null,
        notes: 'Bring workout gear',
        trainer: {
          email: 'trainer@example.com',
          userProfile: { bio: 'Certified trainer' },
        },
        client: {
          email: 'client@example.com',
          userProfile: { bio: 'Fitness enthusiast' },
        },
      };

      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment);

      const result = await generateAppointmentReminder('appt-1');

      expect(result).toEqual({
        appointmentId: 'appt-1',
        recipientEmail: 'client@example.com',
        trainerEmail: 'trainer@example.com',
        reminderTime: new Date('2026-02-20T10:00:00Z'),
        messageTemplate: expect.objectContaining({
          subject: expect.stringContaining('Training Session'),
          body: expect.stringContaining('Training Session'),
        }),
      });
    });

    it('should throw error when appointment not found', async () => {
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(generateAppointmentReminder('invalid-id')).rejects.toThrow('Appointment not found');
    });
  });

  describe('getGroupClassParticipantCount', () => {
    it('returns 1 for an existing group_class appointment', async () => {
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue({
        id: 'appt-group-1',
        appointmentType: 'group_class',
      });

      const count = await getGroupClassParticipantCount('appt-group-1');
      expect(count).toBe(1);
    });

    it('returns 0 when appointment does not exist', async () => {
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(null);

      const count = await getGroupClassParticipantCount('non-existent');
      expect(count).toBe(0);
    });

    it('returns 0 for a non-group_class appointment type', async () => {
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue({
        id: 'appt-individual',
        appointmentType: 'individual',
      });

      const count = await getGroupClassParticipantCount('appt-individual');
      expect(count).toBe(0);
    });

    it('returns 0 for a consultation appointment type', async () => {
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue({
        id: 'appt-consult',
        appointmentType: 'consultation',
      });

      const count = await getGroupClassParticipantCount('appt-consult');
      expect(count).toBe(0);
    });

    it('queries with correct select fields', async () => {
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue({
        id: 'appt-1',
        appointmentType: 'group_class',
      });

      await getGroupClassParticipantCount('appt-1');

      expect(prisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'appt-1' },
        select: { appointmentType: true },
      });
    });
  });
});
