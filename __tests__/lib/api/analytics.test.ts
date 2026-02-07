/**
 * Tests for lib/api/analytics.ts (AnalyticsApiService)
 */

// Define window on global BEFORE importing analytics module,
// so the `typeof window !== 'undefined'` check in the request helper works.
if (typeof (global as any).window === 'undefined') {
  (global as any).window = {};
}

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

import { analyticsApi } from '@/lib/api/analytics';

function mockJsonResponse(data: any, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    blob: () => Promise.resolve(new Blob()),
    headers: new Headers({ 'content-type': 'application/json' }),
  };
}

function mockBlobResponse(ok = true, status = 200) {
  return {
    ok,
    status,
    blob: () => Promise.resolve(new Blob(['data'], { type: 'text/csv' })),
  };
}

describe('AnalyticsApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  // ─── Request helper (private) ───

  describe('request helper (tested via methods)', () => {
    it('includes auth token when present', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      mockFetch.mockResolvedValue(mockJsonResponse([]));

      await analyticsApi.getBodyMeasurements();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('omits auth header when no token', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      mockFetch.mockResolvedValue(mockJsonResponse([]));

      await analyticsApi.getBodyMeasurements();

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });

    it('throws error on non-ok response', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ message: 'Not found' }, false, 404));

      await expect(analyticsApi.getBodyMeasurements()).rejects.toThrow('Not found');
    });

    it('throws fallback message when JSON parse fails on error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('parse failed')),
      });

      await expect(analyticsApi.getBodyMeasurements()).rejects.toThrow('Request failed');
    });

    it('throws HTTP status error when no message in error body', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({}, false, 500));

      await expect(analyticsApi.getBodyMeasurements()).rejects.toThrow('HTTP error! status: 500');
    });
  });

  // ─── Body Measurements ───

  describe('getBodyMeasurements', () => {
    it('fetches measurements without time range', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([{ id: 'm1' }]));

      const result = await analyticsApi.getBodyMeasurements();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/measurements/me'),
        expect.any(Object)
      );
      expect(result).toEqual([{ id: 'm1' }]);
    });

    it('appends timeRange parameter', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([]));

      await analyticsApi.getBodyMeasurements('3m');

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('timeRange=3m');
    });
  });

  describe('saveBodyMeasurement', () => {
    it('sends POST with measurement data', async () => {
      const measurement = { weight: 80, measurementDate: '2024-06-01', userId: 'u1' };
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 'm1', ...measurement }));

      const result = await analyticsApi.saveBodyMeasurement(measurement as any);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/measurements'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(measurement),
        })
      );
      expect(result).toHaveProperty('id', 'm1');
    });
  });

  describe('updateBodyMeasurement', () => {
    it('sends PUT with partial data', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 'm1', weight: 78 }));

      await analyticsApi.updateBodyMeasurement('m1', { weight: 78 } as any);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/measurements/m1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('deleteBodyMeasurement', () => {
    it('sends DELETE', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse(null));

      await analyticsApi.deleteBodyMeasurement('m1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/measurements/m1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  // ─── Performance Metrics ───

  describe('getPerformanceMetrics', () => {
    it('fetches without exerciseId', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([]));

      await analyticsApi.getPerformanceMetrics();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/performance/me'),
        expect.any(Object)
      );
    });

    it('appends exerciseId parameter', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([]));

      await analyticsApi.getPerformanceMetrics('ex-1');

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('exerciseId=ex-1');
    });
  });

  describe('recordPerformanceMetric', () => {
    it('sends POST request', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 'pm1' }));

      await analyticsApi.recordPerformanceMetric({ exerciseId: 'ex-1', metricType: 'one_rm', value: 100 } as any);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/performance'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('getPersonalBests', () => {
    it('fetches personal bests endpoint', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([]));

      await analyticsApi.getPersonalBests();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/performance/me/personal-bests'),
        expect.any(Object)
      );
    });
  });

  // ─── Training Load ───

  describe('getTrainingLoad', () => {
    it('fetches with default week count', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([]));

      await analyticsApi.getTrainingLoad();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/training-load/me?weeks=12'),
        expect.any(Object)
      );
    });

    it('uses custom week count', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([]));

      await analyticsApi.getTrainingLoad(4);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('weeks=4'),
        expect.any(Object)
      );
    });
  });

  describe('calculateWeeklyLoad', () => {
    it('sends POST with week start date', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ weeklyVolume: 1000 }));

      await analyticsApi.calculateWeeklyLoad('2024-06-01');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/training-load/calculate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ weekStartDate: '2024-06-01' }),
        })
      );
    });
  });

  // ─── Goal Progress ───

  describe('getGoalProgress', () => {
    it('fetches goal progress by goal ID', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([]));

      await analyticsApi.getGoalProgress('goal-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/goals/goal-1/progress'),
        expect.any(Object)
      );
    });
  });

  describe('updateGoalProgress', () => {
    it('sends POST with current value and notes', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 'gp1' }));

      await analyticsApi.updateGoalProgress('goal-1', 75, 'Making progress');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/goals/goal-1/progress'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"currentValue":75'),
        })
      );
    });
  });

  // ─── User Insights ───

  describe('getUserInsights', () => {
    it('fetches all insights by default', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([]));

      await analyticsApi.getUserInsights();

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('/analytics/insights/me');
      expect(url).not.toContain('unreadOnly');
    });

    it('appends unreadOnly when true', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([]));

      await analyticsApi.getUserInsights(true);

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('unreadOnly=true');
    });
  });

  describe('markInsightAsRead', () => {
    it('sends PUT to read endpoint', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse(null));

      await analyticsApi.markInsightAsRead('ins-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/insights/ins-1/read'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('markInsightActionTaken', () => {
    it('sends PUT to action-taken endpoint', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse(null));

      await analyticsApi.markInsightActionTaken('ins-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/insights/ins-1/action-taken'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('dismissInsight', () => {
    it('sends DELETE', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse(null));

      await analyticsApi.dismissInsight('ins-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/insights/ins-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  // ─── Milestone Achievements ───

  describe('getMilestoneAchievements', () => {
    it('fetches milestones', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([]));

      await analyticsApi.getMilestoneAchievements();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/milestones/me'),
        expect.any(Object)
      );
    });
  });

  // ─── Analytics Reports ───

  describe('generateProgressReport', () => {
    it('sends POST with report config', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 'r1' }));

      await analyticsApi.generateProgressReport('u1', 'monthly', { start: '2024-01-01', end: '2024-01-31' }, 't1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/reports/generate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            userId: 'u1',
            trainerId: 't1',
            reportType: 'monthly',
            periodStart: '2024-01-01',
            periodEnd: '2024-01-31',
          }),
        })
      );
    });

    it('omits trainerId when not provided', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 'r1' }));

      await analyticsApi.generateProgressReport('u1', 'weekly', { start: '2024-01-01', end: '2024-01-07' });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.trainerId).toBeUndefined();
    });
  });

  describe('getAnalyticsReports', () => {
    it('fetches reports for user', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([]));

      await analyticsApi.getAnalyticsReports('u1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/reports/u1'),
        expect.any(Object)
      );
    });
  });

  describe('downloadReport', () => {
    it('fetches blob for report download', async () => {
      localStorageMock.getItem.mockReturnValue('my-token');
      mockFetch.mockResolvedValue(mockBlobResponse());

      const blob = await analyticsApi.downloadReport('r1');

      expect(blob).toBeInstanceOf(Blob);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/reports/r1/download'),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
        })
      );
    });

    it('throws on failed download', async () => {
      mockFetch.mockResolvedValue(mockBlobResponse(false, 404));

      await expect(analyticsApi.downloadReport('bad')).rejects.toThrow('Download failed: 404');
    });
  });

  // ─── Dashboard Data ───

  describe('getDashboardData', () => {
    it('fetches dashboard data', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ workoutsThisWeek: 3 }));

      const result = await analyticsApi.getDashboardData();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/dashboard/me'),
        expect.any(Object)
      );
      expect(result).toHaveProperty('workoutsThisWeek', 3);
    });
  });

  // ─── Chart Data Helpers ───

  describe('getWeightProgressData', () => {
    it('filters and sorts measurements by date', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([
        { weight: 80, bodyFatPercentage: 15, measurementDate: '2024-03-01' },
        { weight: 78, bodyFatPercentage: 14, measurementDate: '2024-01-01' },
        { weight: null, measurementDate: '2024-02-01' }, // No weight, filtered out
      ]));

      const result = await analyticsApi.getWeightProgressData('6m');

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2024-01-01'); // Sorted by date asc
      expect(result[1].date).toBe('2024-03-01');
      expect(result[0].weight).toBe(78);
    });
  });

  describe('getStrengthProgressData', () => {
    it('groups performance metrics by exercise', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([
        { exerciseId: 'ex-1', metricType: 'one_rm', value: 100, recordedAt: '2024-01-01T00:00:00' },
        { exerciseId: 'ex-1', metricType: 'one_rm', value: 110, recordedAt: '2024-02-01T00:00:00' },
        { exerciseId: 'ex-2', metricType: 'one_rm', value: 60, recordedAt: '2024-01-15T00:00:00' },
        { exerciseId: 'ex-1', metricType: 'volume', value: 5000, recordedAt: '2024-01-01T00:00:00' }, // filtered out (not one_rm)
      ]));

      const result = await analyticsApi.getStrengthProgressData(['ex-1', 'ex-2']);

      expect(result).toHaveLength(2);
      expect(result[0].exercise).toBe('ex-1');
      expect(result[0].data).toHaveLength(2);
      expect(result[1].exercise).toBe('ex-2');
      expect(result[1].data).toHaveLength(1);
    });
  });

  describe('getVolumeProgressionData', () => {
    it('groups volume by date and sorts', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([
        { metricType: 'volume', value: 1000, recordedAt: '2024-01-01T00:00:00' },
        { metricType: 'volume', value: 500, recordedAt: '2024-01-01T00:00:00' },
        { metricType: 'volume', value: 2000, recordedAt: '2024-01-15T00:00:00' },
        { metricType: 'one_rm', value: 100, recordedAt: '2024-01-01T00:00:00' }, // filtered
      ]));

      const result = await analyticsApi.getVolumeProgressionData('3m');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ date: '2024-01-01', volume: 1500 });
      expect(result[1]).toEqual({ date: '2024-01-15', volume: 2000 });
    });
  });

  // ─── Comparison and Analysis ───

  describe('compareWithBaseline', () => {
    it('fetches comparison data', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ measurements: [], performance: [] }));

      const result = await analyticsApi.compareWithBaseline('u1', 'baseline-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/compare/u1/baseline/baseline-1'),
        expect.any(Object)
      );
      expect(result).toHaveProperty('measurements');
      expect(result).toHaveProperty('performance');
    });
  });

  // ─── Export ───

  describe('exportData', () => {
    it('fetches export blob with correct params', async () => {
      localStorageMock.getItem.mockReturnValue('my-token');
      mockFetch.mockResolvedValue(mockBlobResponse());

      const blob = await analyticsApi.exportData('u1', 'measurements', 'csv');

      expect(blob).toBeInstanceOf(Blob);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/export/u1?type=measurements&format=csv'),
        expect.any(Object)
      );
    });

    it('uses csv as default format', async () => {
      mockFetch.mockResolvedValue(mockBlobResponse());

      await analyticsApi.exportData('u1', 'performance');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('format=csv'),
        expect.any(Object)
      );
    });

    it('throws on failed export', async () => {
      mockFetch.mockResolvedValue(mockBlobResponse(false, 500));

      await expect(analyticsApi.exportData('u1', 'measurements')).rejects.toThrow('Export failed: 500');
    });
  });
});
