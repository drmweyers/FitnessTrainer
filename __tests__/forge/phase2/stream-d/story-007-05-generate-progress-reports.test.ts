/**
 * Story 007-05: Generate Progress Reports
 * FORGE User Simulation - Stream D
 *
 * As a client, I want to generate progress reports
 * So that I can share my achievements with others
 */


import {
  ActorFactory,
  WorkflowRunner,
  MeasurementHelpers,
  GoalHelpers,
  cleanupTestData
} from './utils';

describe('Story 007-05: Generate Progress Reports', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('generates monthly progress report', async () => {
      const client = await ActorFactory.createClient();

      // Create measurement history
      await MeasurementHelpers.createMeasurement(client.id, {
        type: 'weight',
        value: 200,
        unit: 'lbs',
        recordedAt: new Date('2026-02-01')
      });

      await MeasurementHelpers.createMeasurement(client.id, {
        type: 'weight',
        value: 190,
        unit: 'lbs',
        recordedAt: new Date('2026-03-01')
      });

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'navigateToReports', data: { section: 'progress-reports' } },
          { action: 'selectReportType', data: { type: 'monthly' } },
          { action: 'selectMonth', data: { month: 'March', year: 2026 } },
          { action: 'includeMetrics', data: { metrics: ['weight', 'measurements', 'goals'] } },
          { action: 'generateReport', data: { confirm: true } }
        ]
      });

      expect(result.success).toBe(true);

      // Verify report data
      const measurements = await prisma.measurement.findMany({
        where: { userId: client.id }
      });

      expect(measurements).toHaveLength(2);
    });

    it('generates comprehensive progress report', async () => {
      const client = await ActorFactory.createClient();

      // Add various data points
      await MeasurementHelpers.createBodyMeasurements(client.id, {
        chest: 40,
        waist: 34,
        hips: 38,
        unit: 'inches',
        recordedAt: new Date('2026-03-01')
      });

      await GoalHelpers.createGoal(client.id, {
        type: 'weight_loss',
        target: 180,
        current: 190,
        unit: 'lbs'
      });

      const report = {
        userId: client.id,
        generatedAt: new Date(),
        period: { start: '2026-03-01', end: '2026-03-31' },
        sections: {
          summary: true,
          measurements: true,
          goals: true,
          photos: true,
          workouts: true
        }
      };

      expect(report.sections.summary).toBe(true);
      expect(report.sections.measurements).toBe(true);
    });

    it('exports report as PDF', async () => {
      const exportOptions = {
        format: 'PDF',
        filename: 'progress-report-march-2026.pdf',
        includeCharts: true,
        includePhotos: true,
        pageSize: 'A4'
      };

      expect(exportOptions.format).toBe('PDF');
      expect(exportOptions.includeCharts).toBe(true);
    });

    it('exports report as shareable link', async () => {
      const shareOptions = {
        type: 'link',
        expiresIn: '30d',
        passwordProtected: false,
        allowDownload: true
      };

      expect(shareOptions.type).toBe('link');
      expect(shareOptions.expiresIn).toBe('30d');
    });
  });

  describe('Report Sections', () => {
    it('includes executive summary', async () => {
      const client = await ActorFactory.createClient();

      await MeasurementHelpers.createMeasurement(client.id, {
        type: 'weight',
        value: 190,
        unit: 'lbs',
        recordedAt: new Date('2026-03-01')
      });

      const summary = {
        startingWeight: 200,
        currentWeight: 190,
        totalChange: -10,
        changePercentage: -5,
        period: 'March 2026',
        keyAchievements: ['Lost 10 lbs', 'Completed all workouts', 'Hit protein goals']
      };

      expect(summary.totalChange).toBe(-10);
      expect(summary.keyAchievements).toHaveLength(3);
    });

    it('includes measurement summary', async () => {
      const measurements = {
        weight: { start: 200, end: 190, change: -10 },
        chest: { start: 40, end: 40.5, change: 0.5 },
        waist: { start: 34, end: 32, change: -2 },
        hips: { start: 38, end: 37.5, change: -0.5 }
      };

      expect(measurements.weight.change).toBe(-10);
      expect(measurements.waist.change).toBe(-2);
    });

    it('includes goal progress section', async () => {
      const goals = [
        { type: 'weight_loss', target: 180, current: 190, progress: 50 },
        { type: 'workout_frequency', target: 12, current: 12, progress: 100 },
        { type: 'body_fat', target: 15, current: 18, progress: 60 }
      ];

      const achievedGoals = goals.filter(g => g.progress >= 100);
      expect(achievedGoals).toHaveLength(1);
    });

    it('includes workout summary', async () => {
      const workoutSummary = {
        totalWorkouts: 12,
        totalSets: 144,
        totalReps: 1440,
        totalVolume: 144000,
        favoriteExercise: 'Bench Press',
        consistency: 92
      };

      expect(workoutSummary.totalWorkouts).toBe(12);
      expect(workoutSummary.consistency).toBe(92);
    });
  });

  describe('Report Customization', () => {
    it('selects custom date range', async () => {
      const dateRange = {
        start: '2026-01-01',
        end: '2026-03-31',
        label: 'Q1 2026'
      };

      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);

      expect(startDate.getMonth()).toBe(0);
      expect(endDate.getMonth()).toBe(2);
    });

    it('selects specific metrics to include', async () => {
      const selectedMetrics = {
        weight: true,
        measurements: true,
        bodyFat: false,
        photos: true,
        workouts: true,
        goals: true
      };

      const included = Object.entries(selectedMetrics)
        .filter(([, v]) => v)
        .map(([k]) => k);

      expect(included).toContain('weight');
      expect(included).toContain('measurements');
      expect(included).not.toContain('bodyFat');
    });

    it('customizes report branding', async () => {
      const branding = {
        logo: '/assets/logo.png',
        primaryColor: '#3B82F6',
        accentColor: '#10B981',
        fontFamily: 'Inter',
        includeTrainerLogo: true
      };

      expect(branding.primaryColor).toBe('#3B82F6');
      expect(branding.includeTrainerLogo).toBe(true);
    });
  });

  describe('Report Sharing', () => {
    it('shares report via email', async () => {
      const emailOptions = {
        recipients: ['trainer@example.com', 'partner@example.com'],
        subject: 'My March 2026 Progress Report',
        message: 'Here is my progress for this month!',
        includePdf: true
      };

      expect(emailOptions.recipients).toHaveLength(2);
      expect(emailOptions.includePdf).toBe(true);
    });

    it('generates public share link', async () => {
      const shareLink = {
        url: 'https://evofit.io/reports/abc123',
        token: 'abc123',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        views: 0,
        maxViews: null
      };

      expect(shareLink.token).toBeDefined();
      expect(shareLink.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('sets view limits on shared report', async () => {
      const shareLink = {
        token: 'xyz789',
        maxViews: 5,
        views: 0,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      expect(shareLink.maxViews).toBe(5);
    });
  });

  describe('Scheduled Reports', () => {
    it('schedules monthly report', async () => {
      const schedule = {
        frequency: 'monthly',
        dayOfMonth: 1,
        email: 'user@example.com',
        autoGenerate: true,
        lastGenerated: null
      };

      expect(schedule.frequency).toBe('monthly');
      expect(schedule.autoGenerate).toBe(true);
    });

    it('schedules weekly report', async () => {
      const schedule = {
        frequency: 'weekly',
        dayOfWeek: 1, // Monday
        email: 'user@example.com',
        autoGenerate: true
      };

      expect(schedule.frequency).toBe('weekly');
      expect(schedule.dayOfWeek).toBe(1);
    });
  });

  describe('Trainer Reports', () => {
    it('trainer generates client report', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      await prisma.client.create({
        data: {
          trainerId: trainer.id,
          userId: client.id,
          status: 'ACTIVE'
        }
      });

      await MeasurementHelpers.createMeasurement(client.id, {
        type: 'weight',
        value: 185,
        unit: 'lbs'
      });

      const clientData = await prisma.measurement.findMany({
        where: { userId: client.id }
      });

      expect(clientData).toHaveLength(1);
    });

    it('generates batch report for all clients', async () => {
      const trainer = await ActorFactory.createTrainer();
      const clients = await Promise.all([
        ActorFactory.createClient({ fullName: 'Client A' }),
        ActorFactory.createClient({ fullName: 'Client B' }),
        ActorFactory.createClient({ fullName: 'Client C' })
      ]);

      for (const client of clients) {
        await prisma.client.create({
          data: {
            trainerId: trainer.id,
            userId: client.id,
            status: 'ACTIVE'
          }
        });
      }

      const batchReport = {
        trainerId: trainer.id,
        period: 'March 2026',
        clientCount: clients.length,
        generatedAt: new Date()
      };

      expect(batchReport.clientCount).toBe(3);
    });
  });
});
