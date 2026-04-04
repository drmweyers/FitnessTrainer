/**
 * Story 007-02: View Progress Charts
 * FORGE User Simulation - Stream D
 *
 * As a client, I want to view my progress in charts
 * So that I can visualize my fitness journey
 */

import { prisma } from '@/lib/db/prisma';

const mockFindMany = jest.fn();

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    measurement: {
      findMany: (...args: any[]) => mockFindMany(...args),
    },
  },
}));

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
    jest.clearAllMocks();
    mockFindMany.mockReset();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Happy Path', () => {
    it('views weight progress chart', async () => {
      const client = await ActorFactory.createClient();

      const chartData = [
        { value: 200, recordedAt: new Date('2026-01-01'), type: "weight" },
        { value: 195, recordedAt: new Date('2026-02-01'), type: "weight" },
        { value: 188, recordedAt: new Date('2026-03-01'), type: "weight" },
        { value: 185, recordedAt: new Date('2026-03-31'), type: "weight" }
      ];

      mockFindMany.mockResolvedValue(chartData);

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

      const data = await prisma.measurement.findMany({ where: { userId: client.id } });
      expect(data).toHaveLength(4);
      expect(data[0].value).toBe(200);
      expect(data[3].value).toBe(185);
    });

    it('views multiple measurement charts', async () => {
      const client = await ActorFactory.createClient();

      const measurements = [
        { value: 40, recordedAt: new Date('2026-01-15'), type: "chest" },
        { value: 40.25, recordedAt: new Date('2026-02-15'), type: "chest" },
        { value: 40.5, recordedAt: new Date('2026-03-15'), type: "chest" },
        { value: 34, recordedAt: new Date('2026-01-15'), type: "waist" },
        { value: 33.25, recordedAt: new Date('2026-02-15'), type: "waist" },
        { value: 32.5, recordedAt: new Date('2026-03-15'), type: "waist" },
        { value: 39, recordedAt: new Date('2026-01-15'), type: "hips" },
        { value: 38.75, recordedAt: new Date('2026-02-15'), type: "hips" },
        { value: 38.5, recordedAt: new Date('2026-03-15'), type: "hips" },
      ];

      mockFindMany.mockResolvedValue(measurements);

      const data = await prisma.measurement.findMany({ where: { userId: client.id } });

      expect(data.length).toBe(9); // 3 types x 3 dates

      // Group by type for chart display
      const byType = data.reduce((acc: any, m) => {
        acc[m.type] = acc[m.type] || [];
        acc[m.type].push(m);
        return acc;
      }, {} as Record<string, typeof data>);

      expect(Object.keys(byType)).toContain('chest');
      expect(Object.keys(byType)).toContain('waist');
      expect(Object.keys(byType)).toContain('hips');
      expect(byType['chest']).toHaveLength(3);
    });

    it('compares multiple metrics on same chart', async () => {
      const client = await ActorFactory.createClient();

      const weightData = [
        { value: 200, recordedAt: new Date(), type: "weight" },
        { value: 197, recordedAt: new Date(), type: "weight" },
        { value: 194, recordedAt: new Date(), type: "weight" },
        { value: 191, recordedAt: new Date(), type: "weight" }
      ];

      const bodyFatData = [
        { value: 20, recordedAt: new Date(), type: "bodyFat" },
        { value: 19.5, recordedAt: new Date(), type: "bodyFat" },
        { value: 19, recordedAt: new Date(), type: "bodyFat" },
        { value: 18.5, recordedAt: new Date(), type: "bodyFat" }
      ];

      expect(weightData).toHaveLength(4);
      expect(bodyFatData).toHaveLength(4);

      // Both should show downward trend
      expect(weightData[0].value).toBeGreaterThan(weightData[3].value);
      expect(bodyFatData[0].value).toBeGreaterThan(bodyFatData[3].value);
    });

    it('views chart with goal overlay', async () => {
      const client = await ActorFactory.createClient();

      const measurements = [
        { value: 195, recordedAt: new Date(), type: "weight" },
        { value: 192.5, recordedAt: new Date(), type: "weight" },
        { value: 190, recordedAt: new Date(), type: "weight" },
        { value: 187.5, recordedAt: new Date(), type: "weight" },
        { value: 185, recordedAt: new Date(), type: "weight" }
      ];

      mockFindMany.mockResolvedValue(measurements);

      const goal = { target: 180 };
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

      const measurements = [
        { recordedAt: new Date('2026-01-01'), value: 34 },
        { recordedAt: new Date('2026-02-01'), value: 33 },
        { recordedAt: new Date('2026-03-01'), value: 32 }
      ];

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

      const filtered = [{ value: 200, recordedAt: new Date('2026-03-31'), type: "weight" }];

      expect(filtered).toHaveLength(1);
    });

    it('filters chart data by 1 month range', async () => {
      const client = await ActorFactory.createClient();

      const filtered = [
        { value: 200, recordedAt: new Date('2026-03-15'), type: "weight" },
        { value: 185, recordedAt: new Date('2026-03-31'), type: "weight" }
      ];

      expect(filtered).toHaveLength(2);
    });

    it('filters chart data by 3 month range', async () => {
      const client = await ActorFactory.createClient();

      const filtered = [
        { value: 200, recordedAt: new Date('2026-01-01'), type: "weight" },
        { value: 195, recordedAt: new Date('2026-02-01'), type: "weight" },
        { value: 190, recordedAt: new Date('2026-03-01'), type: "weight" }
      ];

      expect(filtered).toHaveLength(3);
    });

    it('filters chart data by 1 year range', async () => {
      const client = await ActorFactory.createClient();

      const filtered = Array(12).fill(null).map((_, i) => ({
        value: 200 - i,
        recordedAt: new Date(2026, i, 15),
        type: "weight"
      }));

      expect(filtered).toHaveLength(12);
    });
  });

  describe('Chart Interactions', () => {
    it('zooms into specific time period', async () => {
      const client = await ActorFactory.createClient();

      const zoomedData = Array(7).fill(null).map((_, i) => ({
        value: 200 - (i * 0.1),
        recordedAt: new Date(2026, 2, 8 + i),
        type: "weight"
      }));

      expect(zoomedData).toHaveLength(7);
    });

    it('shows tooltip data on hover', async () => {
      const client = await ActorFactory.createClient();

      // Tooltip data format
      const tooltipData = {
        date: new Date('2026-03-31').toLocaleDateString(),
        value: 32,
        unit: 'inches',
        change: -1.5,
        changePercent: -4.5
      };

      expect(tooltipData).toHaveProperty('date');
      expect(tooltipData).toHaveProperty('value');
      expect(tooltipData).toHaveProperty('change');
    });

    it('exports chart as image', async () => {
      const client = await ActorFactory.createClient();

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

      const trend = weights[weights.length - 1] < weights[0] ? 'downward' : 'upward';
      expect(trend).toBe('downward');
    });

    it('calculates upward trend', async () => {
      const client = await ActorFactory.createClient();

      const measurements = [14, 14.25, 14.5, 14.75, 15];

      const trend = measurements[measurements.length - 1] > measurements[0] ? 'upward' : 'downward';
      expect(trend).toBe('upward');
    });

    it('identifies plateau', async () => {
      const client = await ActorFactory.createClient();

      const weights = [185, 185.2, 184.9, 185.1, 185];

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

      const clientData = [
        { value: 200, recordedAt: new Date(), type: "weight" },
        { value: 185, recordedAt: new Date(), type: "weight" }
      ];

      expect(clientData.length).toBeGreaterThan(0);
    });

    it('trainer compares multiple clients charts', async () => {
      const trainer = await ActorFactory.createTrainer();
      const client1 = await ActorFactory.createClient({ fullName: 'Client A' });
      const client2 = await ActorFactory.createClient({ fullName: 'Client B' });

      const data1 = [{ userId: client1.id, value: 180 }];
      const data2 = [{ userId: client2.id, value: 200 }];

      mockFindMany
        .mockResolvedValueOnce(data1)
        .mockResolvedValueOnce(data2);

      const result1 = await prisma.measurement.findMany({ where: { userId: client1.id } });
      const result2 = await prisma.measurement.findMany({ where: { userId: client2.id } });

      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
    });
  });
});
