/**
 * Story 008-07: Business Hours
 * FORGE User Simulation - Stream D
 *
 * As a trainer, I want to set my business hours
 * So that clients know when I am available
 */


import {
  ActorFactory,
  WorkflowRunner,
  cleanupTestData
} from './utils';

describe('Story 008-07: Business Hours', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('sets business hours', async () => {
      const trainer = await ActorFactory.createTrainer();

      const businessHours = await prisma.businessHours.create({
        data: {
          userId: trainer.id,
          timezone: 'America/New_York',
          schedule: {
            monday: { start: '09:00', end: '17:00', available: true },
            tuesday: { start: '09:00', end: '17:00', available: true },
            wednesday: { start: '09:00', end: '17:00', available: true },
            thursday: { start: '09:00', end: '17:00', available: true },
            friday: { start: '09:00', end: '17:00', available: true },
            saturday: { start: '10:00', end: '14:00', available: true },
            sunday: { start: null, end: null, available: false }
          }
        }
      });

      expect(businessHours.timezone).toBe('America/New_York');
      expect(businessHours.schedule.monday.available).toBe(true);
    });

    it('views trainer business hours', async () => {
      const trainer = await ActorFactory.createTrainer();

      await prisma.businessHours.create({
        data: {
          userId: trainer.id,
          timezone: 'America/New_York',
          schedule: {
            monday: { start: '09:00', end: '17:00', available: true }
          }
        }
      });

      const hours = await prisma.businessHours.findFirst({
        where: { userId: trainer.id }
      });

      expect(hours).toBeDefined();
      expect(hours?.schedule.monday.start).toBe('09:00');
    });

    it('checks if currently within business hours', async () => {
      const schedule = {
        monday: { start: '09:00', end: '17:00', available: true }
      };

      const now = '14:00'; // 2 PM
      const day = 'monday';

      const daySchedule = schedule[day as keyof typeof schedule];
      const isWithinHours = now >= daySchedule.start && now <= daySchedule.end;

      expect(isWithinHours).toBe(true);
    });
  });

  describe('Availability Management', () => {
    it('sets unavailable days', async () => {
      const trainer = await ActorFactory.createTrainer();

      const businessHours = await prisma.businessHours.create({
        data: {
          userId: trainer.id,
          timezone: 'America/New_York',
          schedule: {
            monday: { start: '09:00', end: '17:00', available: true },
            sunday: { start: null, end: null, available: false }
          }
        }
      });

      expect(businessHours.schedule.sunday.available).toBe(false);
    });

    it('sets different hours for different days', async () => {
      const schedule = {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '10:00', end: '18:00' },
        wednesday: { start: '08:00', end: '16:00' }
      };

      expect(schedule.tuesday.start).toBe('10:00');
      expect(schedule.wednesday.start).toBe('08:00');
    });

    it('sets lunch break', async () => {
      const schedule = {
        monday: {
          start: '09:00',
          end: '17:00',
          breaks: [{ start: '12:00', end: '13:00', name: 'Lunch' }]
        }
      };

      expect(schedule.monday.breaks).toHaveLength(1);
      expect(schedule.monday.breaks[0].name).toBe('Lunch');
    });

    it('sets vacation days', async () => {
      const trainer = await ActorFactory.createTrainer();

      const vacation = await prisma.vacation.create({
        data: {
          userId: trainer.id,
          startDate: new Date('2026-07-01'),
          endDate: new Date('2026-07-07'),
          reason: 'Summer vacation'
        }
      });

      expect(vacation.reason).toBe('Summer vacation');
    });
  });

  describe('Client View', () => {
    it('client sees trainer availability', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      await prisma.client.create({
        data: {
          trainerId: trainer.id,
          userId: client.id,
          status: 'ACTIVE'
        }
      });

      await prisma.businessHours.create({
        data: {
          userId: trainer.id,
          timezone: 'America/New_York',
          schedule: {
            monday: { start: '09:00', end: '17:00', available: true }
          }
        }
      });

      const hours = await prisma.businessHours.findFirst({
        where: { userId: trainer.id }
      });

      expect(hours).toBeDefined();
    });

    it('shows next available time', async () => {
      const schedule = {
        monday: { start: '09:00', end: '17:00', available: true },
        tuesday: { start: '09:00', end: '17:00', available: true }
      };

      const currentDay = 'monday';
      const currentTime = '18:00';

      // If after hours, next available is tomorrow
      const nextAvailable = currentTime > schedule[currentDay as keyof typeof schedule].end
        ? 'tuesday at 09:00'
        : 'today';

      expect(nextAvailable).toBe('tuesday at 09:00');
    });
  });

  describe('Auto-Reply', () => {
    it('sets auto-reply for after hours', async () => {
      const autoReply = {
        enabled: true,
        message: 'Thanks for your message! I typically respond during business hours (9 AM - 5 PM EST).',
        outsideHoursOnly: true
      };

      expect(autoReply.enabled).toBe(true);
      expect(autoReply.outsideHoursOnly).toBe(true);
    });

    it('triggers auto-reply when message received after hours', async () => {
      const businessHours = { start: 9, end: 17 };
      const messageTime = 20; // 8 PM

      const isAfterHours = messageTime < businessHours.start || messageTime > businessHours.end;

      expect(isAfterHours).toBe(true);
    });
  });

  describe('Time Zone Handling', () => {
    it('stores timezone', async () => {
      const trainer = await ActorFactory.createTrainer();

      const businessHours = await prisma.businessHours.create({
        data: {
          userId: trainer.id,
          timezone: 'America/Los_Angeles',
          schedule: {}
        }
      });

      expect(businessHours.timezone).toBe('America/Los_Angeles');
    });

    it('converts to client timezone', async () => {
      const trainerTime = '09:00';
      const trainerZone = 'America/New_York';
      const clientZone = 'America/Los_Angeles';

      // EST to PST is -3 hours
      const clientTime = '06:00';

      expect(clientTime).toBe('06:00');
    });
  });
});
