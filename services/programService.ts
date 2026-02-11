/**
 * Program Service
 *
 * Service layer for program API calls.
 * Provides type-safe methods for all program operations.
 */

import type {
  Program,
  ProgramFilters,
  ProgramListResponse,
  ProgramData,
  ProgramAssignment,
  ProgramTemplate,
  AssignProgramData,
} from '@/types/program';

const API_BASE = '/api/programs';

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

/**
 * Program Service
 */
export const programService = {
  /**
   * Get all programs with optional filters
   */
  async getAll(filters?: ProgramFilters): Promise<ProgramListResponse> {
    const params = new URLSearchParams();

    if (filters?.programType) params.append('programType', filters.programType);
    if (filters?.difficultyLevel) params.append('difficultyLevel', filters.difficultyLevel);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isTemplate !== undefined) params.append('isTemplate', String(filters.isTemplate));
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const queryString = params.toString();
    const response = await fetch(`${API_BASE}${queryString ? `?${queryString}` : ''}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch programs');
    }

    const result = await response.json();
    // API returns { success, data: Program[], count } - map to ProgramListResponse
    return {
      programs: result.data || result.programs || [],
      pagination: result.pagination || result.meta,
    };
  },

  /**
   * Get program by ID
   */
  async getById(id: string): Promise<Program> {
    const response = await fetch(`${API_BASE}/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch program');
    }

    const result = await response.json();
    return result.data || result;
  },

  /**
   * Create new program
   */
  async create(data: ProgramData): Promise<Program> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create program');
    }

    const result = await response.json();
    return result.data || result;
  },

  /**
   * Update program
   */
  async update(id: string, data: Partial<ProgramData>): Promise<Program> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update program');
    }

    const result = await response.json();
    return result.data || result;
  },

  /**
   * Delete program
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete program');
    }
  },

  /**
   * Duplicate program
   */
  async duplicate(id: string, name?: string): Promise<Program> {
    const response = await fetch(`${API_BASE}/${id}/duplicate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to duplicate program');
    }

    const result = await response.json();
    return result.data || result;
  },

  /**
   * Assign program to client
   */
  async assignToClient(id: string, data: AssignProgramData): Promise<ProgramAssignment> {
    const response = await fetch(`${API_BASE}/${id}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to assign program');
    }

    const result = await response.json();
    return result.data || result;
  },

  /**
   * Get program templates
   */
  async getTemplates(category?: string): Promise<ProgramTemplate[]> {
    const queryString = category ? `?category=${category}` : '';
    const response = await fetch(`${API_BASE}/templates${queryString}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch templates');
    }

    const data = await response.json();
    return data.templates || data.data || [];
  },
};
