/**
 * Tests for workoutService (frontend service layer)
 */

import { workoutService } from '@/services/workoutService';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockFetchSuccess(data: any, status = 200) {
  mockFetch.mockResolvedValue({
    ok: true,
    status,
    json: () => Promise.resolve(data),
  });
}

function mockFetchError(error: string, status = 400) {
  mockFetch.mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ error }),
  });
}

function mockFetch204() {
  mockFetch.mockResolvedValue({
    ok: true,
    status: 204,
    json: () => Promise.resolve(null),
  });
}

describe('workoutService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches workouts without filters', async () => {
      const workouts = [{ id: '1' }, { id: '2' }];
      mockFetchSuccess(workouts);

      const result = await workoutService.getAll();
      expect(result).toEqual(workouts);
      expect(mockFetch).toHaveBeenCalledWith('/api/workouts');
    });

    it('appends filter params to URL', async () => {
      mockFetchSuccess([]);

      const filters = {
        clientId: 'client-1',
        programId: 'prog-1',
        status: 'completed' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        limit: 10,
      };
      await workoutService.getAll(filters);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('clientId=client-1');
      expect(calledUrl).toContain('programId=prog-1');
      expect(calledUrl).toContain('status=completed');
      expect(calledUrl).toContain('startDate=');
      expect(calledUrl).toContain('endDate=');
      expect(calledUrl).toContain('limit=10');
    });

    it('omits undefined filter params', async () => {
      mockFetchSuccess([]);

      await workoutService.getAll({ limit: 5 });
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).not.toContain('clientId');
      expect(calledUrl).not.toContain('programId');
      expect(calledUrl).toContain('limit=5');
    });

    it('throws on error response', async () => {
      mockFetchError('Failed to fetch workouts');

      await expect(workoutService.getAll()).rejects.toThrow('Failed to fetch workouts');
    });

    it('uses default error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(workoutService.getAll()).rejects.toThrow('Failed to fetch workouts');
    });
  });

  describe('getById', () => {
    it('fetches workout by ID', async () => {
      const workout = { id: 'sess-1', status: 'in_progress' };
      mockFetchSuccess(workout);

      const result = await workoutService.getById('sess-1');
      expect(result).toEqual(workout);
      expect(mockFetch).toHaveBeenCalledWith('/api/workouts/sess-1');
    });

    it('throws on error', async () => {
      mockFetchError('Not found', 404);
      await expect(workoutService.getById('bad-id')).rejects.toThrow('Not found');
    });

    it('uses default error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });
      await expect(workoutService.getById('bad-id')).rejects.toThrow('Failed to fetch workout');
    });
  });

  describe('startSession', () => {
    it('sends POST request', async () => {
      const session = { id: 'new-sess' };
      mockFetchSuccess(session);

      const data = { programId: 'prog-1', programWorkoutId: 'pw-1' };
      const result = await workoutService.startSession(data);

      expect(result).toEqual(session);
      expect(mockFetch).toHaveBeenCalledWith('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    });

    it('throws on error', async () => {
      mockFetchError('Failed to start');
      await expect(
        workoutService.startSession({ programId: 'prog-1' })
      ).rejects.toThrow('Failed to start');
    });

    it('uses default error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });
      await expect(
        workoutService.startSession({})
      ).rejects.toThrow('Failed to start workout');
    });
  });

  describe('updateSession', () => {
    it('sends PUT request', async () => {
      const updated = { id: 'sess-1', status: 'in_progress' };
      mockFetchSuccess(updated);

      const data = { status: 'in_progress' };
      const result = await workoutService.updateSession('sess-1', data as any);

      expect(result).toEqual(updated);
      expect(mockFetch).toHaveBeenCalledWith('/api/workouts/sess-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    });

    it('throws on error', async () => {
      mockFetchError('Update failed');
      await expect(
        workoutService.updateSession('sess-1', {} as any)
      ).rejects.toThrow('Update failed');
    });

    it('uses default error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });
      await expect(
        workoutService.updateSession('sess-1', {} as any)
      ).rejects.toThrow('Failed to update workout');
    });
  });

  describe('logSet', () => {
    it('sends POST to sets endpoint', async () => {
      const setLog = { id: 'sl-1' };
      mockFetchSuccess(setLog);

      const setData = { exerciseId: 'ex-1', setNumber: 1, completed: true };
      const result = await workoutService.logSet('sess-1', setData as any);

      expect(result).toEqual(setLog);
      expect(mockFetch).toHaveBeenCalledWith('/api/workouts/sess-1/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setData),
      });
    });

    it('throws on error', async () => {
      mockFetchError('Log set failed');
      await expect(
        workoutService.logSet('sess-1', {} as any)
      ).rejects.toThrow('Log set failed');
    });

    it('uses default error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });
      await expect(
        workoutService.logSet('sess-1', {} as any)
      ).rejects.toThrow('Failed to log set');
    });
  });

  describe('completeSession', () => {
    it('sends POST to complete endpoint', async () => {
      mockFetchSuccess({});

      await workoutService.completeSession('sess-1', 'Great workout!');

      expect(mockFetch).toHaveBeenCalledWith('/api/workouts/sess-1/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"notes":"Great workout!"'),
      });
    });

    it('includes endTime in body', async () => {
      mockFetchSuccess({});

      await workoutService.completeSession('sess-1');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.endTime).toBeDefined();
    });

    it('throws on error', async () => {
      mockFetchError('Complete failed');
      await expect(
        workoutService.completeSession('sess-1')
      ).rejects.toThrow('Complete failed');
    });

    it('uses default error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });
      await expect(
        workoutService.completeSession('sess-1')
      ).rejects.toThrow('Failed to complete workout');
    });
  });

  describe('getActiveSession', () => {
    it('returns active session', async () => {
      const session = { id: 'sess-1', status: 'in_progress' };
      mockFetchSuccess(session);

      const result = await workoutService.getActiveSession();
      expect(result).toEqual(session);
      expect(mockFetch).toHaveBeenCalledWith('/api/workouts/active');
    });

    it('returns null for 204 status', async () => {
      mockFetch204();

      const result = await workoutService.getActiveSession();
      expect(result).toBeNull();
    });

    it('throws on error', async () => {
      mockFetchError('Failed to fetch');
      await expect(workoutService.getActiveSession()).rejects.toThrow('Failed to fetch');
    });

    it('uses default error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });
      await expect(workoutService.getActiveSession()).rejects.toThrow(
        'Failed to fetch active workout'
      );
    });
  });

  describe('getHistory', () => {
    it('delegates to getAll', async () => {
      mockFetchSuccess([]);

      const filters = { status: 'completed' as const };
      await workoutService.getHistory(filters);

      // getHistory calls getAll which calls fetch
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workouts')
      );
    });
  });

  describe('getProgress', () => {
    it('fetches progress without exerciseId', async () => {
      const progress = { totalWorkouts: 10 };
      mockFetchSuccess(progress);

      const result = await workoutService.getProgress();
      expect(result).toEqual(progress);
      expect(mockFetch).toHaveBeenCalledWith('/api/workouts/progress');
    });

    it('fetches progress with exerciseId', async () => {
      mockFetchSuccess({});

      await workoutService.getProgress('ex-1');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/workouts/progress?exerciseId=ex-1'
      );
    });

    it('throws on error', async () => {
      mockFetchError('Progress fetch failed');
      await expect(workoutService.getProgress()).rejects.toThrow('Progress fetch failed');
    });

    it('uses default error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });
      await expect(workoutService.getProgress()).rejects.toThrow(
        'Failed to fetch progress'
      );
    });
  });

  describe('delete', () => {
    it('sends DELETE request', async () => {
      mockFetchSuccess({});

      await workoutService.delete('sess-1');
      expect(mockFetch).toHaveBeenCalledWith('/api/workouts/sess-1', {
        method: 'DELETE',
      });
    });

    it('throws on error', async () => {
      mockFetchError('Delete failed');
      await expect(workoutService.delete('sess-1')).rejects.toThrow('Delete failed');
    });

    it('uses default error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });
      await expect(workoutService.delete('sess-1')).rejects.toThrow(
        'Failed to delete workout'
      );
    });
  });
});
