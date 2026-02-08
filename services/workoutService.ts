/**
 * Workout Service
 *
 * Service layer for workout API calls.
 * Provides type-safe methods for all workout operations.
 */

import type {
  WorkoutSession,
  WorkoutFilters,
  LogSetDTO,
  UpdateSetDTO,
  ProgressData,
} from '@/types/workout';

const API_BASE = '/api/workouts';

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export const workoutService = {
  /**
   * Get workout sessions with optional filters
   */
  async getAll(filters?: WorkoutFilters): Promise<WorkoutSession[]> {
    const params = new URLSearchParams();

    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.programId) params.append('programId', filters.programId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters?.limit) params.append('limit', String(filters.limit));

    const queryString = params.toString();
    const response = await fetch(`${API_BASE}${queryString ? `?${queryString}` : ''}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch workouts');
    }

    return response.json();
  },

  /**
   * Get workout session by ID
   */
  async getById(id: string): Promise<WorkoutSession> {
    const response = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch workout');
    }

    return response.json();
  },

  /**
   * Start new workout session
   */
  async startSession(data: {
    programId?: string;
    programWorkoutId?: string;
    clientId?: string;
  }): Promise<WorkoutSession> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start workout');
    }

    return response.json();
  },

  /**
   * Update workout session
   */
  async updateSession(id: string, data: Partial<WorkoutSession>): Promise<WorkoutSession> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update workout');
    }

    return response.json();
  },

  /**
   * Log exercise set
   */
  async logSet(sessionId: string, setData: LogSetDTO): Promise<any> {
    const response = await fetch(`${API_BASE}/${sessionId}/sets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(setData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to log set');
    }

    return response.json();
  },

  /**
   * Complete workout session
   */
  async completeSession(
    sessionId: string,
    notes?: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/${sessionId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes, endTime: new Date().toISOString() }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete workout');
    }
  },

  /**
   * Get active workout session
   */
  async getActiveSession(): Promise<WorkoutSession | null> {
    const response = await fetch(`${API_BASE}/active`, {
      headers: getAuthHeaders(),
    });

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch active workout');
    }

    return response.json();
  },

  /**
   * Get workout history
   */
  async getHistory(filters?: WorkoutFilters): Promise<WorkoutSession[]> {
    return this.getAll(filters);
  },

  /**
   * Get progress data
   */
  async getProgress(exerciseId?: string): Promise<ProgressData> {
    const params = exerciseId ? `?exerciseId=${exerciseId}` : '';
    const response = await fetch(`${API_BASE}/progress${params}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch progress');
    }

    return response.json();
  },

  /**
   * Delete workout session
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete workout');
    }
  },
};
