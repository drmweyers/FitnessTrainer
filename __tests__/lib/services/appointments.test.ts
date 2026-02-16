/**
 * @jest-environment node
 */

import { checkAppointmentConflicts, generateAppointmentReminder } from '@/lib/services/appointments';
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
});
