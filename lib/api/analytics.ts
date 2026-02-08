// Epic 007: Progress Analytics API Service

import {
  BodyMeasurement,
  PerformanceMetric,
  TrainingLoad,
  GoalProgress,
  UserGoal,
  UserInsight,
  AnalyticsReport,
  AnalyticsDashboardData,
  MilestoneAchievement
} from '@/types/analytics';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

class AnalyticsApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    // If the response has a data property (envelope format), unwrap it
    if (json && typeof json === 'object' && 'data' in json) {
      return json.data as T;
    }
    return json as T;
  }

  // Body Measurements
  async getBodyMeasurements(timeRange?: string): Promise<BodyMeasurement[]> {
    const params = new URLSearchParams();
    if (timeRange) params.append('timeRange', timeRange);
    
    return this.request<BodyMeasurement[]>(
      `/analytics/measurements/me${params.toString() ? '?' + params.toString() : ''}`
    );
  }

  async saveBodyMeasurement(measurement: Omit<BodyMeasurement, 'id' | 'createdAt'>): Promise<BodyMeasurement> {
    return this.request<BodyMeasurement>('/analytics/measurements', {
      method: 'POST',
      body: JSON.stringify(measurement),
    });
  }

  async updateBodyMeasurement(id: string, measurement: Partial<BodyMeasurement>): Promise<BodyMeasurement> {
    return this.request<BodyMeasurement>(`/analytics/measurements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(measurement),
    });
  }

  async deleteBodyMeasurement(id: string): Promise<void> {
    return this.request<void>(`/analytics/measurements/${id}`, {
      method: 'DELETE',
    });
  }

  // Performance Metrics
  async getPerformanceMetrics(exerciseId?: string): Promise<PerformanceMetric[]> {
    const params = new URLSearchParams();
    if (exerciseId) params.append('exerciseId', exerciseId);
    
    return this.request<PerformanceMetric[]>(
      `/analytics/performance/me${params.toString() ? '?' + params.toString() : ''}`
    );
  }

  async recordPerformanceMetric(metric: Omit<PerformanceMetric, 'id' | 'recordedAt'>): Promise<PerformanceMetric> {
    return this.request<PerformanceMetric>('/analytics/performance', {
      method: 'POST',
      body: JSON.stringify(metric),
    });
  }

  async getPersonalBests(): Promise<Array<{ exercise: string; metric: string; value: number; date: string }>> {
    return this.request<Array<{ exercise: string; metric: string; value: number; date: string }>>(
      `/analytics/performance/me/personal-bests`
    );
  }

  // Training Load
  async getTrainingLoad(weekCount: number = 12): Promise<TrainingLoad[]> {
    return this.request<TrainingLoad[]>(`/analytics/training-load/me?weeks=${weekCount}`);
  }

  async calculateWeeklyLoad(weekStartDate: string): Promise<TrainingLoad> {
    return this.request<TrainingLoad>('/analytics/training-load/calculate', {
      method: 'POST',
      body: JSON.stringify({ weekStartDate }),
    });
  }

  // Goals
  async getGoals(): Promise<UserGoal[]> {
    return this.request<UserGoal[]>('/analytics/goals');
  }

  async createGoal(goal: Omit<UserGoal, 'id' | 'createdAt' | 'updatedAt' | 'currentValue'>): Promise<UserGoal> {
    return this.request<UserGoal>('/analytics/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
  }

  // Goal Progress
  async getGoalProgress(goalId: string): Promise<GoalProgress[]> {
    return this.request<GoalProgress[]>(`/analytics/goals/${goalId}/progress`);
  }

  async updateGoalProgress(goalId: string, currentValue: number, notes?: string): Promise<GoalProgress> {
    return this.request<GoalProgress>(`/analytics/goals/${goalId}/progress`, {
      method: 'POST',
      body: JSON.stringify({
        currentValue,
        notes,
        recordedDate: new Date().toISOString().split('T')[0],
      }),
    });
  }

  // User Insights
  async getUserInsights(unreadOnly: boolean = false): Promise<UserInsight[]> {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unreadOnly', 'true');
    
    return this.request<UserInsight[]>(
      `/analytics/insights/me${params.toString() ? '?' + params.toString() : ''}`
    );
  }

  async markInsightAsRead(insightId: string): Promise<void> {
    return this.request<void>(`/analytics/insights/${insightId}/read`, {
      method: 'PUT',
    });
  }

  async markInsightActionTaken(insightId: string): Promise<void> {
    return this.request<void>(`/analytics/insights/${insightId}/action-taken`, {
      method: 'PUT',
    });
  }

  async dismissInsight(insightId: string): Promise<void> {
    return this.request<void>(`/analytics/insights/${insightId}`, {
      method: 'DELETE',
    });
  }

  // Milestone Achievements
  async getMilestoneAchievements(): Promise<MilestoneAchievement[]> {
    return this.request<MilestoneAchievement[]>(`/analytics/milestones/me`);
  }

  // Analytics Reports
  async generateProgressReport(
    userId: string, 
    reportType: string, 
    dateRange: { start: string; end: string },
    trainerId?: string
  ): Promise<AnalyticsReport> {
    return this.request<AnalyticsReport>('/analytics/reports/generate', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        trainerId,
        reportType,
        periodStart: dateRange.start,
        periodEnd: dateRange.end,
      }),
    });
  }

  async getAnalyticsReports(userId: string): Promise<AnalyticsReport[]> {
    return this.request<AnalyticsReport[]>(`/analytics/reports/${userId}`);
  }

  async downloadReport(reportId: string): Promise<Blob> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    const response = await fetch(`${API_BASE}/analytics/reports/${reportId}/download`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    return response.blob();
  }

  // Dashboard Data
  async getDashboardData(): Promise<AnalyticsDashboardData> {
    return this.request<AnalyticsDashboardData>(`/analytics/dashboard/me`);
  }

  // Chart Data Helpers
  async getWeightProgressData(timeRange: string = '6m'): Promise<Array<{ date: string; weight: number; bodyFat?: number }>> {
    const measurements = await this.getBodyMeasurements(timeRange);
    return measurements
      .filter(m => m.weight)
      .map(m => ({
        date: m.measurementDate,
        weight: m.weight!,
        bodyFat: m.bodyFatPercentage,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getStrengthProgressData(
    exerciseIds: string[], 
    timeRange: string = '6m'
  ): Promise<Array<{ exercise: string; data: Array<{ date: string; maxWeight: number }> }>> {
    const allMetrics = await this.getPerformanceMetrics();
    
    return exerciseIds.map(exerciseId => {
      const exerciseMetrics = allMetrics
        .filter(m => m.exerciseId === exerciseId && m.metricType === 'one_rm')
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
      
      return {
        exercise: exerciseId, // This would ideally be the exercise name
        data: exerciseMetrics.map(m => ({
          date: m.recordedAt.split('T')[0],
          maxWeight: m.value,
        })),
      };
    });
  }

  async getVolumeProgressionData(timeRange: string = '3m'): Promise<Array<{ date: string; volume: number }>> {
    const metrics = await this.getPerformanceMetrics();
    
    // Group by date and sum volume
    const volumeByDate = metrics
      .filter(m => m.metricType === 'volume')
      .reduce((acc, metric) => {
        const date = metric.recordedAt.split('T')[0];
        acc[date] = (acc[date] || 0) + metric.value;
        return acc;
      }, {} as Record<string, number>);
    
    return Object.entries(volumeByDate)
      .map(([date, volume]) => ({ date, volume }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Comparison and Analysis
  async compareWithBaseline(userId: string, baselineId: string): Promise<{
    measurements: Array<{ type: string; baseline: number; current: number; change: number; percentChange: number }>;
    performance: Array<{ exercise: string; baseline: number; current: number; improvement: number }>;
  }> {
    return this.request<any>(`/analytics/compare/${userId}/baseline/${baselineId}`);
  }

  // Export functionality
  async exportData(userId: string, dataType: string, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    const response = await fetch(`${API_BASE}/analytics/export/${userId}?type=${dataType}&format=${format}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }
}

export const analyticsApi = new AnalyticsApiService();