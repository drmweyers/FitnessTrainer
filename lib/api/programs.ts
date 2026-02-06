import { 
  Program,
  ProgramData,
  ProgramListResponse,
  ProgramTemplate,
  ProgramAssignment,
  AssignProgramData,
  ProgramFilters
} from '@/types/program';

// Base API configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const PROGRAMS_ENDPOINT = `${API_BASE}/programs`;

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Error handling utility
class ApiError extends Error {
  constructor(message: string, public status: number, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(
      errorData.error || errorData.message || 'Request failed',
      response.status,
      errorData.details
    );
  }
  return response.json();
};

// =====================================
// PROGRAM MANAGEMENT
// =====================================

/**
 * Fetch all programs for the authenticated trainer
 * @param token - Authentication token
 * @param filters - Optional filters for programs
 * @returns Promise<Program[]>
 */
export const fetchPrograms = async (token?: string, filters?: ProgramFilters): Promise<Program[]> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });
  }

  const headers = token ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  } : getAuthHeaders();

  const response = await fetch(`${PROGRAMS_ENDPOINT}?${params}`, {
    headers,
  });

  const result = await handleResponse(response);
  return result.data || [];
};

/**
 * Fetch a specific program by ID
 * @param id - Program ID
 * @param token - Authentication token
 * @returns Promise<Program>
 */
export const fetchProgram = async (id: string, token?: string): Promise<Program> => {
  const headers = token ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  } : getAuthHeaders();

  const response = await fetch(`${PROGRAMS_ENDPOINT}/${id}`, {
    headers,
  });

  const result = await handleResponse(response);
  return result.data;
};

/**
 * Create a new program
 * @param data - Program data
 * @param token - Authentication token
 * @returns Promise<Program>
 */
export const createProgram = async (data: ProgramData, token?: string): Promise<Program> => {
  const headers = token ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  } : getAuthHeaders();

  const response = await fetch(PROGRAMS_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  const result = await handleResponse(response);
  return result.data;
};

/**
 * Update an existing program
 * @param id - Program ID
 * @param data - Updated program data
 * @param token - Authentication token
 * @returns Promise<Program>
 */
export const updateProgram = async (id: string, data: Partial<ProgramData>, token?: string): Promise<Program> => {
  const headers = token ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  } : getAuthHeaders();

  const response = await fetch(`${PROGRAMS_ENDPOINT}/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });

  const result = await handleResponse(response);
  return result.data;
};

/**
 * Delete a program
 * @param id - Program ID
 * @param token - Authentication token
 * @returns Promise<{success: boolean, message: string}>
 */
export const deleteProgram = async (id: string, token?: string): Promise<{success: boolean, message: string}> => {
  const headers = token ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  } : getAuthHeaders();

  const response = await fetch(`${PROGRAMS_ENDPOINT}/${id}`, {
    method: 'DELETE',
    headers,
  });

  return handleResponse(response);
};

/**
 * Duplicate an existing program
 * @param id - Program ID to duplicate
 * @param token - Authentication token
 * @param name - Optional new name for duplicated program
 * @returns Promise<Program>
 */
export const duplicateProgram = async (id: string, token?: string, name?: string): Promise<Program> => {
  const headers = token ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  } : getAuthHeaders();

  const body = name ? JSON.stringify({ name }) : undefined;

  const response = await fetch(`${PROGRAMS_ENDPOINT}/${id}/duplicate`, {
    method: 'POST',
    headers,
    ...(body && { body }),
  });

  const result = await handleResponse(response);
  return result.data;
};

/**
 * Assign a program to a client
 * @param programId - Program ID
 * @param clientId - Client ID
 * @param startDate - Start date for the assignment
 * @param token - Authentication token
 * @returns Promise<ProgramAssignment>
 */
export const assignProgram = async (
  programId: string, 
  clientId: string, 
  startDate: Date, 
  token?: string
): Promise<ProgramAssignment> => {
  const headers = token ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  } : getAuthHeaders();

  const assignmentData: AssignProgramData = {
    clientId,
    startDate: startDate.toISOString()
  };

  const response = await fetch(`${PROGRAMS_ENDPOINT}/${programId}/assign`, {
    method: 'POST',
    headers,
    body: JSON.stringify(assignmentData),
  });

  const result = await handleResponse(response);
  return result.data;
};

/**
 * Get all available program templates
 * @param token - Authentication token
 * @param category - Optional category filter
 * @returns Promise<ProgramTemplate[]>
 */
export const getTemplates = async (token?: string, category?: string): Promise<ProgramTemplate[]> => {
  const params = new URLSearchParams();
  if (category) {
    params.append('category', category);
  }

  const headers = token ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  } : getAuthHeaders();

  const response = await fetch(`${PROGRAMS_ENDPOINT}/templates?${params}`, {
    headers,
  });

  const result = await handleResponse(response);
  return result.data || [];
};

// =====================================
// CLIENT PROGRAM MANAGEMENT
// =====================================

/**
 * Get programs assigned to a specific client
 * @param clientId - Client ID
 * @param token - Authentication token
 * @returns Promise<ProgramAssignment[]>
 */
export const getClientPrograms = async (clientId: string, token?: string): Promise<ProgramAssignment[]> => {
  const headers = token ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  } : getAuthHeaders();

  const response = await fetch(`${PROGRAMS_ENDPOINT}/client/${clientId}`, {
    headers,
  });

  const result = await handleResponse(response);
  return result.data || [];
};

// =====================================
// COMBINED API OBJECT
// =====================================

export const programsApi = {
  // Core program CRUD
  fetchPrograms,
  fetchProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  
  // Program operations
  duplicateProgram,
  assignProgram,
  
  // Templates and client programs
  getTemplates,
  getClientPrograms,
};

// Export individual functions for backward compatibility  
export { ApiError as ProgramApiError };

// Export as default
export default programsApi;