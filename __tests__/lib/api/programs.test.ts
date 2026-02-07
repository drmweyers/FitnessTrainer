/**
 * Tests for lib/api/programs.ts (Program management API)
 */

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

import {
  fetchPrograms,
  fetchProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  duplicateProgram,
  assignProgram,
  getTemplates,
  getClientPrograms,
  programsApi,
  ProgramApiError,
} from '@/lib/api/programs';

function mockSuccessResponse(data: any) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  };
}

function mockErrorResponse(errorMsg: string, status = 400) {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({ error: errorMsg }),
  };
}

function mockErrorJsonFail(status = 500) {
  return {
    ok: false,
    status,
    json: () => Promise.reject(new Error('parse failed')),
  };
}

describe('Programs API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  // ─── Auth headers ───

  describe('auth headers', () => {
    it('uses explicit token when provided', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: [] }));

      await fetchPrograms('explicit-token');

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer explicit-token');
    });

    it('uses localStorage token when no explicit token', async () => {
      localStorageMock.getItem.mockReturnValue('stored-token');
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: [] }));

      await fetchPrograms();

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer stored-token');
    });

    it('omits auth header when no token at all', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: [] }));

      await fetchPrograms();

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });

  // ─── handleResponse ───

  describe('handleResponse (tested via methods)', () => {
    it('throws ProgramApiError with error from response', async () => {
      mockFetch.mockResolvedValue(mockErrorResponse('Program not found', 404));

      try {
        await fetchProgram('bad-id');
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ProgramApiError);
        expect((err as any).message).toBe('Program not found');
        expect((err as any).status).toBe(404);
      }
    });

    it('throws fallback error when JSON parse fails', async () => {
      mockFetch.mockResolvedValue(mockErrorJsonFail());

      try {
        await fetchProgram('bad-id');
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ProgramApiError);
        expect((err as any).message).toBe('Unknown error');
      }
    });

    it('uses "Request failed" when response has message field but no error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error happened' }),
      });

      try {
        await fetchProgram('id');
        fail('Should have thrown');
      } catch (err) {
        // The handleResponse checks error || message || 'Request failed'
        expect((err as any).message).toBe('Server error happened');
      }
    });
  });

  // ─── fetchPrograms ───

  describe('fetchPrograms', () => {
    it('fetches programs and returns data array', async () => {
      const programs = [{ id: 'p1' }, { id: 'p2' }];
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: programs }));

      const result = await fetchPrograms();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs?'),
        expect.any(Object)
      );
      expect(result).toEqual(programs);
    });

    it('returns empty array when data is undefined', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({}));

      const result = await fetchPrograms();

      expect(result).toEqual([]);
    });

    it('passes filters as query params', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: [] }));

      await fetchPrograms(undefined, {
        programType: 'strength' as any,
        search: 'test',
        page: 2,
        limit: 10,
      });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('programType=strength');
      expect(url).toContain('search=test');
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
    });

    it('handles array filter values', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: [] }));

      await fetchPrograms(undefined, { tags: ['a', 'b'] } as any);

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('tags=a');
      expect(url).toContain('tags=b');
    });

    it('skips undefined filter values', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: [] }));

      await fetchPrograms(undefined, { search: undefined, page: 1 });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).not.toContain('search');
      expect(url).toContain('page=1');
    });
  });

  // ─── fetchProgram ───

  describe('fetchProgram', () => {
    it('fetches single program by ID', async () => {
      const program = { id: 'p1', name: 'Strength 101' };
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: program }));

      const result = await fetchProgram('p1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs/p1'),
        expect.any(Object)
      );
      expect(result).toEqual(program);
    });

    it('uses explicit token', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: {} }));

      await fetchProgram('p1', 'my-token');

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer my-token');
    });
  });

  // ─── createProgram ───

  describe('createProgram', () => {
    it('sends POST with program data', async () => {
      const programData = { name: 'New Program', programType: 'strength' };
      const created = { id: 'p-new', ...programData };
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: created }));

      const result = await createProgram(programData as any);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(programData),
        })
      );
      expect(result).toEqual(created);
    });
  });

  // ─── updateProgram ───

  describe('updateProgram', () => {
    it('sends PUT with partial data', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: { id: 'p1', name: 'Updated' } }));

      const result = await updateProgram('p1', { name: 'Updated' } as any);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs/p1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated' }),
        })
      );
      expect(result).toEqual({ id: 'p1', name: 'Updated' });
    });
  });

  // ─── deleteProgram ───

  describe('deleteProgram', () => {
    it('sends DELETE request', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({ success: true, message: 'Deleted' }));

      const result = await deleteProgram('p1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs/p1'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual({ success: true, message: 'Deleted' });
    });
  });

  // ─── duplicateProgram ───

  describe('duplicateProgram', () => {
    it('sends POST with optional name', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: { id: 'p-copy' } }));

      const result = await duplicateProgram('p1', 'my-token', 'Copy of Program');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs/p1/duplicate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Copy of Program' }),
        })
      );
      expect(result).toEqual({ id: 'p-copy' });
    });

    it('sends POST without body when no name provided', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: { id: 'p-copy' } }));

      await duplicateProgram('p1');

      const fetchOptions = mockFetch.mock.calls[0][1];
      expect(fetchOptions.body).toBeUndefined();
    });
  });

  // ─── assignProgram ───

  describe('assignProgram', () => {
    it('sends POST with assignment data', async () => {
      const startDate = new Date('2024-06-01');
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: { id: 'a1' } }));

      const result = await assignProgram('p1', 'c1', startDate);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs/p1/assign'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            clientId: 'c1',
            startDate: startDate.toISOString(),
          }),
        })
      );
      expect(result).toEqual({ id: 'a1' });
    });

    it('uses explicit token when provided', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: {} }));

      await assignProgram('p1', 'c1', new Date(), 'explicit-token');

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer explicit-token');
    });
  });

  // ─── getTemplates ───

  describe('getTemplates', () => {
    it('fetches templates without category', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: [{ id: 't1' }] }));

      const result = await getTemplates();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs/templates'),
        expect.any(Object)
      );
      expect(result).toEqual([{ id: 't1' }]);
    });

    it('passes category as query param', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: [] }));

      await getTemplates(undefined, 'strength');

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('category=strength');
    });

    it('returns empty array when data is undefined', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({}));

      const result = await getTemplates();

      expect(result).toEqual([]);
    });
  });

  // ─── getClientPrograms ───

  describe('getClientPrograms', () => {
    it('fetches programs for a specific client', async () => {
      const assignments = [{ id: 'a1', programId: 'p1' }];
      mockFetch.mockResolvedValue(mockSuccessResponse({ data: assignments }));

      const result = await getClientPrograms('c1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs/client/c1'),
        expect.any(Object)
      );
      expect(result).toEqual(assignments);
    });

    it('returns empty array when no data', async () => {
      mockFetch.mockResolvedValue(mockSuccessResponse({}));

      const result = await getClientPrograms('c1');

      expect(result).toEqual([]);
    });
  });

  // ─── programsApi combined object ───

  describe('programsApi', () => {
    it('exposes all functions', () => {
      expect(programsApi.fetchPrograms).toBe(fetchPrograms);
      expect(programsApi.fetchProgram).toBe(fetchProgram);
      expect(programsApi.createProgram).toBe(createProgram);
      expect(programsApi.updateProgram).toBe(updateProgram);
      expect(programsApi.deleteProgram).toBe(deleteProgram);
      expect(programsApi.duplicateProgram).toBe(duplicateProgram);
      expect(programsApi.assignProgram).toBe(assignProgram);
      expect(programsApi.getTemplates).toBe(getTemplates);
      expect(programsApi.getClientPrograms).toBe(getClientPrograms);
    });
  });

  // ─── ProgramApiError ───

  describe('ProgramApiError', () => {
    it('is an Error with status and details', () => {
      const err = new ProgramApiError('Test', 404, { field: 'id' });

      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('ApiError');
      expect(err.message).toBe('Test');
      expect(err.status).toBe(404);
      expect(err.details).toEqual({ field: 'id' });
    });
  });
});
