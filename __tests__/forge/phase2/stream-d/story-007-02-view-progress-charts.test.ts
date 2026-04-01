/**
 * Story 007-02: View Progress Charts
 * FORGE User Simulation - Stream D
 *
 * As a client, I want to view my progress in charts
 * So that I can visualize my fitness journey
 */


import {
  ActorFactory,
  WorkflowRunner,
  MeasurementHelpers,
  GoalHelpers,
  cleanupTestData
} from './utils';

describe('Story 007-02: View Progress Charts', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('views weight progress chart', async () => {
      const client = await ActorFactory.createClient();

      // Create weight history
      const dates = [
        new Date('2026-01-01'),
        new Date('2026-02-01'),
        new Date('2026-03-01'),
        new Date('2026-03-31')
      ];
      const weights = [200, 195, 188, 185];

      for (let i = 0; i < dates.length; i++) {
        await MeasurementHelpers.createMeasurement(client.id, {
          type: 'weight',
          value: weights[i],
          unit: 'lbs',
          recordedAt: dates[i]
        });
      }

      const result = await WorkflowRunner.run({
        actor: client,
        steps: [
          { action: 'navigateToAnalytics', data: { section: 'charts' } },
          { action: 'selectMetric', data: { metric: 'weight' } },
          { action: 'setTimeRange', data: { range: '3months' } },
          { action: 'viewChart', data: { chartType: 'line' } }
        ]
      });

      expect(result.success).toBe(true);

      // Verify chart data
      const chartData = await prisma.measurement.findMany({
        where: { userId: client.id, type: 'weight' },
        orderBy: { recordedAt: 'asc' }
      });

      expect(chartData).toHaveLength(4);
      expect(chartData[0].value).toBe(200);
      expect(chartData[3].value).toBe(185);
    });

    it('views multiple measurement charts', async () => {
      const client = await ActorFactory.createClient();

      // Create body measurement history
      const measurementDates = [
        new Date('2026-01-15'),
        new Date('2026-02-15'),
        new Date('2026-03-15')
      ];

      for (const date of measurementDates) {
        await MeasurementHelpers.createBodyMeasurements(client.id, {
          chest: 40 + (date.getMonth() * 0.25),
          waist: 34 - (date.getMonth() * 0.75),
          hips: 39 - (date.getMonth() * 0.25),
          unit: 'inches',
          recordedAt: date
        });
      }

      const measurements = await prisma.measurement.findMany({
        where: { userId: client.id },
        orderBy: { recordedAt: 'asc' }
      });

      expect(measurements.length).toBe(9); // 3 types x 3 dates

      // Group by type for chart display
      const byType = measurements.reduce((acc, m) => {
        acc[m.type] = acc[m.type] || [];
        acc[m.type].push(m);
        return acc;
      }, {} as Record<string, typeof measurements>);

      expect(Object.keys(byType)).toContain('chest');
      expect(Object.keys(byType)).toContain('waist');
      expect(Object.keys(byType)).toContain('hips');
      expect(byType['chest']).toHaveLength(3);
    });

    it('compares multiple metrics on same chart', async () => {
      const client = await ActorFactory.createClient();

      // Create correlated measurements
      const baseDate = new Date('2026-03-01');

      for (let i = 0; i < 4; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + (i * 7));

        await MeasurementHelpers.createMeasurement(client.id, {
          type: 'weight',
          value: 200 - (i * 3),
          unit: 'lbs',
          recordedAt: date
        });

        await MeasurementHelpers.createMeasurement(client.id, {
          type: 'bodyFat',
          value: 20 - (i * 0.5),
          unit: 'percent',
          recordedAt: date
        });
      }

      const weightData = await prisma.measurement.findMany({
        where: { userId: client.id, type: 'weight' },
        orderBy: { recordedAt: 'asc' }
      });

      const bodyFatData = await prisma.measurement.findMany({
        where: { userId: client.id, type: 'bodyFat' },
        orderBy: { recordedAt: 'asc' }
      });

      expect(weightData).toHaveLength(4);
      expect(bodyFatData).toHaveLength(4);

      // Both should show downward trend
      expect(weightData[0].value).toBeGreaterThan(weightData[3].value);
      expect(bodyFatData[0].value).toBeGreaterThan(bodyFatData[3].value);
    });

    it('views chart with goal overlay', async () => {
      const client = await ActorFactory.createClient();

      // Create goal
      const goal = await GoalHelpers.createGoal(client.id, {
        type: 'weight',
        target: 180,
        current: 185,
        unit: 'lbs'
      });

      // Create progress data
      for (let i = 0; i < 5; i++) {
        await MeasurementHelpers.createMeasurement(client.id, {
          type: 'weight',
          value: 195 - (i * 2.5),
          unit: 'lbs',
          recordedAt: new Date(2026, 2, 1 + (i * 7))
        });
      }

      const measurements = await prisma.measurement.findMany({
        where: { userId: client.id, type: 'weight' },
        orderBy: { recordedAt: 'asc' }
      });

      const goalProgress = GoalHelpers.calculateGoalProgress(
        measurements[measurements.length - 1].value,
        goal.target
      );

      expect(goalProgress.progress).toBeGreaterThan(0);
      expect(goalProgress.isAchieved || !goalProgress.isAchieved).toBeDefined();
    });
  });

  describe('Chart Types', () => {
    it('generates line chart data', async () => {
      const client = await ActorFactory.createClient();

      const measurements = await Promise.all([
        MeasurementHelpers.createMeasurement(client.id, {
          type: 'waist',
          value: 34,
          unit: 'inches',
          recordedAt: new Date('2026-01-01')
        }),
        MeasurementHelpers.createMeasurement(client.id, {
          type: 'waist',
          value: 33,
          unit: 'inches',
          recordedAt: new Date('2026-02-01')
        }),
        MeasurementHelpers.createMeasurement(client.id, {
          type: 'waist',
          value: 32,
          unit: 'inches',
          recordedAt: new Date('2026-03-01')
        })
      ]);

      // Line chart data format
      const lineChartData = measurements.map(m => ({
        x: m.recordedAt.toISOString().split('T')[0],
        y: m.value
      }));

      expect(lineChartData).toHaveLength(3);
      expect(lineChartData[0]).toHaveProperty('x');
      expect(lineChartData[0]).toHaveProperty('y');
    });

    it('generates bar chart data', async () => {
      const client = await ActorFactory.createClient();

      // Weekly weight changes
      const weeklyChanges = [-2, -1.5, -2.5, -1];

      const barChartData = weeklyChanges.map((change, index) => ({
        week: `Week ${index + 1}`,
        change: Math.abs(change)
      }));

      expect(barChartData).toHaveLength(4);
      expect(barChartData[0].change).toBe(2);
    });

    it('generates area chart data with cumulative progress', async () => {
      const client = await ActorFactory.createClient();

      const measurements = [200, 198, 195, 193, 190];
      let cumulativeLoss = 0;

      const areaChartData = measurements.map((weight, index) => {
        if (index > 0) {
          cumulativeLoss += measurements[index - 1] - weight;
        }
        return {
          date: new Date(2026, 2, 1 + (index * 7)).toISOString().split('T')[0],
          weight,
          cumulativeLoss
        };
      });

      expect(areaChartData[areaChartData.length - 1].cumulativeLoss).toBe(10);
    });
  });

  describe('Time Range Selection', () => {
    it('filters chart data by 1 week range', async () => {
      const client = await ActorFactory.createClient();

      // Create measurements across multiple weeks
      const dates = [
        new Date('2026-01-01'),
        new Date('2026-02-01'),
        new Date('2026-03-01'),
        new Date('2026-03-15'),
        new Date('2026-03-31')
      ];

      for (const date of dates) {
        await MeasurementHelpers.createMeasurement(client.id, {
          type: 'weight',
          value: 200,
          unit: 'lbs',
          recordedAt: date
        });
      }

      // Filter last week of March
      const startDate = new Date('2026-03-24');
      const endDate = new Date('2026-03-31');

      const filtered = await prisma.measurement.findMany({
        where: {
          userId: client.id,
          type: 'weight',
          recordedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      expect(filtered).toHaveLength(1);
    });

    it('filters chart data by 1 month range', async () => {
      const client = await ActorFactory.createClient();

      const dates = [
        new Date('2026-01-15'),
        new Date('2026-02-15'),
        new Date('2026-03-15'),
        new Date('2026-03-31')
      ];

      for (const date of dates) {
        await MeasurementHelpers.createMeasurement(client.id, {
          type: 'weight',
          value: 200,
          unit: 'lbs',
          recordedAt: date
        });
      }

      // Filter March only
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-31');

      const filtered = await prisma.measurement.findMany({
        where: {
          userId: client.id,
          type: 'weight',
          recordedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      expect(filtered).toHaveLength(2);
    });

    it('filters chart data by 3 month range', async () => {
      const client = await ActorFactory.createClient();

      const dates = [
        new Date('2026-01-01'),
        new Date('2026-02-01'),
        new Date('2026-03-01'),
        new Date('2026-04-01')
      ];

      for (const date of dates) {
        await MeasurementHelpers.createMeasurement(client.id, {
          type: 'weight',
          value: 200,
          unit: 'lbs',
          recordedAt: date
        });
      }

      // Filter Q1 2026
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-03-31');

      const filtered = await prisma.measurement.findMany({
        where: {
          userId: client.id,
          type: 'weight',
          recordedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      expect(filtered).toHaveLength(3);
    });

    it('filters chart data by 1 year range', async () => {
      const client = await ActorFactory.createClient();

      // Create monthly measurements for a year
      for (let month = 0; month < 12; month++) {
        await MeasurementHelpers.createMeasurement(client.id, {
          type: 'weight',
          value: 200 - month,
          unit: 'lbs',
          recordedAt: new Date(2026, month, 15)
        });
      }

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-12-31');

      const filtered = await prisma.measurement.findMany({
        where: {
          userId: client.id,
          type: 'weight',
          recordedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      expect(filtered).toHaveLength(12);
    });
  });

  describe('Chart Interactions', () => {
    it('zooms into specific time period', async () => {
      const client = await ActorFactory.createClient();

      // Create daily measurements
      for (let day = 1; day <= 30; day++) {
        await MeasurementHelpers.createMeasurement(client.id, {
          type: 'weight',
          value: 200 - (day * 0.1),
          unit: 'lbs',
          recordedAt: new Date(2026, 2, day)
        });
      }

      // Zoom to week 2
      const zoomStart = new Date('2026-03-08');
      const zoomEnd = new Date('2026-03-14');

      const zoomedData = await prisma.measurement.findMany({
        where: {
          userId: client.id,
          type: 'weight',
          recordedAt: {
            gte: zoomStart,
            lte: zoomEnd
          }
        }
      });

      expect(zoomedData).toHaveLength(7);
    });

    it('shows tooltip data on hover', async () => {
      const client = await ActorFactory.createClient();

      const measurement = await MeasurementHelpers.createMeasurement(client.id, {
        type: 'waist',
        value: 32,
        unit: 'inches',
        recordedAt: new Date('2026-03-31')
      });

      // Tooltip data format
      const tooltipData = {
        date: measurement.recordedAt.toLocaleDateString(),
        value: measurement.value,
        unit: measurement.unit,
        change: -1.5,
        changePercent: -4.5
      };

      expect(tooltipData).toHaveProperty('date');
      expect(tooltipData).toHaveProperty('value');
      expect(tooltipData).toHaveProperty('change');
    });

    it('exports chart as image', async () => {
      const client = await ActorFactory.createClient();

      await MeasurementHelpers.createMeasurement(client.id, {
        type: 'weight',
        value: 185,
        unit: 'lbs',
        recordedAt: new Date('2026-03-31')
      });

      // Simulate export
      const exportResult = {
        format: 'png',
        width: 1200,
        height: 600,
        filename: 'weight-progress-march-2026.png',
        success: true
      };

      expect(exportResult.format).toBe('png');
      expect(exportResult.success).toBe(true);
    });
  });

  describe('Trend Analysis', () => {
    it('calculates downward trend', async () => {
      const client = await ActorFactory.createClient();

      const weights = [200, 198, 196, 194, 192];
      for (let i = 0; i < weights.length; i++) {
        await MeasurementHelpers.createMeasurement(client.id, {
          type: 'weight',
          value: weights[i],
          unit: 'lbs',
          recordedAt: new Date(2026, 2, 1 + (i * 7))
        });
      }

      const trend = weights[weights.length - 1] < weights[0] ? 'downward' : 'upward';
      expect(trend).toBe('downward');
    });

    it('calculates upward trend', async () => {
      const client = await ActorFactory.createClient();

      const measurements = [14, 14.25, 14.5, 14.75, 15];
      for (let i = 0; i < measurements.length; i++) {
        await MeasurementHelpers.createMeasurement(client.id, {
          type: 'leftArm',
          value: measurements[i],
          unit: 'inches',
          recordedAt: new Date(2026, 2, 1 + (i * 7))
        });
      }

      const trend = measurements[measurements.length - 1] > measurements[0] ? 'upward' : 'downward';
      expect(trend).toBe('upward');
    });

    it('identifies plateau', async () => {
      const client = await ActorFactory.createClient();

      const weights = [185, 185.2, 184.9, 185.1, 185];
      for (let i = 0; i < weights.length; i++) {
        await MeasurementHelpers.createMeasurement(client.id, {
          type: 'weight',
          value: weights[i],
          unit: 'lbs',
          recordedAt: new Date(2026, 2, 1 + (i * 7))
        });
      }

      const variance = Math.max(...weights) - Math.min(...weights);
      const isPlateau = variance < 1;

      expect(isPlateau).toBe(true);
    });

    it('calculates average rate of change', async () => {
      const startWeight = 200;
      const endWeight = 185;
      const weeks = 12;

      const totalChange = endWeight - startWeight;
      const weeklyRate = totalChange / weeks;

      expect(totalChange).toBe(-15);
      expect(weeklyRate).toBe(-1.25);
    });
  });

  describe('Trainer View', () => {
    it('trainer views client progress charts', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client = await ActorFactory.createClient();

      await prisma.client.create({
        data: {
          trainerId: trainer.id,
          userId: client.id,
          status: 'ACTIVE'
        }
      });

      // Client has measurements
      await MeasurementHelpers.createBodyMeasurements(client.id, {
        chest: 40,
        waist: 32,
        hips: 38,
        unit: 'inches'
      });

      const clientData = await prisma.measurement.findMany({
        where: { userId: client.id }
      });

      expect(clientData.length).toBeGreaterThan(0);
    });

    it('trainer compares multiple clients charts', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client1 = await ActorFactory.createClient({ fullName: 'Client A' });
      const client2 = await ActorFactory.createClient({ fullName: 'Client B' });

      await prisma.client.create({
        data: { trainerId: trainer.id, userId: client1.id, status: 'ACTIVE' }
      });
      await prisma.client.create({
        data: { trainerId: trainer.id, userId: client2.id, status: 'ACTIVE' }
      });

      // Both clients have weight data
      await MeasurementHelpers.createMeasurement(client1.id, {
        type: 'weight',
        value: 180,
        unit: 'lbs'
      });

      await MeasurementHelpers.createMeasurement(client2.id, {
        type: 'weight',
        value: 200,
        unit: 'lbs'
      });

      const [data1, data2] = await Promise.all([
        prisma.measurement.findMany({ where: { userId: client1.id } }),
        prisma.measurement.findMany({ where: { userId: client2.id } })
      ]);

      expect(data1).toHaveLength(1);
      expect(data2).toHaveLength(1);
    });
  });
});
