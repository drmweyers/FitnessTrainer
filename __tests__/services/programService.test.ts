/**
 * Tests for programService (frontend service layer)
 */

import { programService } from '@/services/programService';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('programService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches programs without filters', async () => {
      const programs = { programs: [{ id: 'p1' }], pagination: { page: 1 } };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(programs),
      });

      const result = await programService.getAll();

      expect(mockFetch).toHaveBeenCalledWith('/api/programs', expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }));
      expect(result).toEqual(programs);
    });

    it('appends filters as query parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: [] }),
      });

      await programService.getAll({
        programType: 'strength' as any,
        difficultyLevel: 'beginner' as any,
        search: 'test',
        isTemplate: true,
        sortBy: 'name',
        sortOrder: 'asc',
        page: 2,
        limit: 10,
      });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('programType=strength');
      expect(url).toContain('difficultyLevel=beginner');
      expect(url).toContain('search=test');
      expect(url).toContain('isTemplate=true');
      expect(url).toContain('sortBy=name');
      expect(url).toContain('sortOrder=asc');
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
    });

    it('omits undefined filter values', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: [] }),
      });

      await programService.getAll({ search: 'test' });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('search=test');
      expect(url).not.toContain('programType');
      expect(url).not.toContain('page');
    });

    it('throws error when response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      await expect(programService.getAll()).rejects.toThrow('Server error');
    });

    it('throws default error when no error message in response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(programService.getAll()).rejects.toThrow('Failed to fetch programs');
    });

    it('calls without query string when no filters provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ programs: [] }),
      });

      await programService.getAll();

      expect(mockFetch).toHaveBeenCalledWith('/api/programs', expect.any(Object));
    });
  });

  describe('getById', () => {
    it('fetches a single program by ID', async () => {
      const program = { id: 'p1', name: 'Test' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(program),
      });

      const result = await programService.getById('p1');

      expect(mockFetch).toHaveBeenCalledWith('/api/programs/p1', expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }));
      expect(result).toEqual(program);
    });

    it('throws error when program not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Program not found' }),
      });

      await expect(programService.getById('nonexistent')).rejects.toThrow('Program not found');
    });

    it('throws default error message when none provided', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(programService.getById('id')).rejects.toThrow('Failed to fetch program');
    });
  });

  describe('create', () => {
    const createData = {
      name: 'New Program',
      programType: 'strength' as any,
      difficultyLevel: 'beginner' as any,
      durationWeeks: 4,
    };

    it('sends POST request with program data', async () => {
      const program = { id: 'p1', ...createData };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(program),
      });

      const result = await programService.create(createData);

      expect(mockFetch).toHaveBeenCalledWith('/api/programs', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      }));
      expect(result).toEqual(program);
    });

    it('throws error on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Validation failed' }),
      });

      await expect(programService.create(createData)).rejects.toThrow('Validation failed');
    });

    it('throws default error message when none provided', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(programService.create(createData)).rejects.toThrow('Failed to create program');
    });
  });

  describe('update', () => {
    it('sends PUT request with update data', async () => {
      const updateData = { name: 'Updated Name' };
      const updated = { id: 'p1', name: 'Updated Name' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updated),
      });

      const result = await programService.update('p1', updateData);

      expect(mockFetch).toHaveBeenCalledWith('/api/programs/p1', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updateData),
      }));
      expect(result).toEqual(updated);
    });

    it('throws error on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      await expect(programService.update('p1', { name: 'Test' })).rejects.toThrow('Not found');
    });

    it('throws default error message when none provided', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(programService.update('p1', {})).rejects.toThrow('Failed to update program');
    });
  });

  describe('delete', () => {
    it('sends DELETE request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await programService.delete('p1');

      expect(mockFetch).toHaveBeenCalledWith('/api/programs/p1', expect.objectContaining({
        method: 'DELETE',
      }));
    });

    it('throws error on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Cannot delete' }),
      });

      await expect(programService.delete('p1')).rejects.toThrow('Cannot delete');
    });

    it('throws default error message when none provided', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(programService.delete('p1')).rejects.toThrow('Failed to delete program');
    });

    it('returns void on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await programService.delete('p1');
      expect(result).toBeUndefined();
    });
  });

  describe('duplicate', () => {
    it('sends POST request with optional name', async () => {
      const duplicated = { id: 'p2', name: 'Copy of Program' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(duplicated),
      });

      const result = await programService.duplicate('p1', 'Copy of Program');

      expect(mockFetch).toHaveBeenCalledWith('/api/programs/p1/duplicate', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Copy of Program' }),
      }));
      expect(result).toEqual(duplicated);
    });

    it('sends POST request without name', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'p2' }),
      });

      await programService.duplicate('p1');

      expect(mockFetch).toHaveBeenCalledWith('/api/programs/p1/duplicate', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: undefined }),
      }));
    });

    it('throws error on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Duplicate failed' }),
      });

      await expect(programService.duplicate('p1')).rejects.toThrow('Duplicate failed');
    });

    it('throws default error message when none provided', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(programService.duplicate('p1')).rejects.toThrow('Failed to duplicate program');
    });
  });

  describe('assignToClient', () => {
    const assignData = {
      clientId: 'client-1',
      startDate: '2024-06-01',
    };

    it('sends POST request with assignment data', async () => {
      const assignment = { id: 'a1', programId: 'p1', ...assignData };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(assignment),
      });

      const result = await programService.assignToClient('p1', assignData);

      expect(mockFetch).toHaveBeenCalledWith('/api/programs/p1/assign', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(assignData),
      }));
      expect(result).toEqual(assignment);
    });

    it('throws error on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Client not found' }),
      });

      await expect(programService.assignToClient('p1', assignData)).rejects.toThrow('Client not found');
    });

    it('throws default error message when none provided', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(programService.assignToClient('p1', assignData)).rejects.toThrow('Failed to assign program');
    });
  });

  describe('getTemplates', () => {
    it('fetches templates without category', async () => {
      const templates = [{ id: 't1', name: 'Template 1' }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ templates }),
      });

      const result = await programService.getTemplates();

      expect(mockFetch).toHaveBeenCalledWith('/api/programs/templates', expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }));
      expect(result).toEqual(templates);
    });

    it('fetches templates with category filter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ templates: [] }),
      });

      await programService.getTemplates('strength');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/programs/templates?category=strength',
        expect.any(Object)
      );
    });

    it('returns templates array from response data', async () => {
      const templates = [{ id: 't1' }, { id: 't2' }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ templates }),
      });

      const result = await programService.getTemplates();
      expect(result).toEqual(templates);
    });

    it('throws error on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Fetch failed' }),
      });

      await expect(programService.getTemplates()).rejects.toThrow('Fetch failed');
    });

    it('throws default error message when none provided', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(programService.getTemplates()).rejects.toThrow('Failed to fetch templates');
    });
  });
});
