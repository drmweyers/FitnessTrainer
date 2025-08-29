// Enhanced API client with authentication interceptors

import { authApi, tokenUtils } from './auth';
import type { AuthTokens } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Types for API client configuration
interface ApiClientConfig extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiError {
  success: false;
  message: string;
  error?: string;
  code?: string;
  statusCode?: number;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public originalResponse?: any
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// Token refresh handler (to prevent circular dependency)
let refreshTokenPromise: Promise<AuthTokens> | null = null;

async function refreshTokens(): Promise<AuthTokens> {
  // Return existing promise if refresh is already in progress
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  const { refreshToken } = tokenUtils.getTokens();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  refreshTokenPromise = authApi.refreshToken({ refreshToken })
    .then(response => {
      const tokens = response.data.tokens;
      tokenUtils.setTokens(tokens.accessToken, tokens.refreshToken);
      return tokens;
    })
    .finally(() => {
      refreshTokenPromise = null;
    });

  return refreshTokenPromise;
}

// Enhanced fetch wrapper with authentication and auto-refresh
async function apiRequest<T = any>(
  endpoint: string,
  config: ApiClientConfig = {}
): Promise<T> {
  const { skipAuth = false, skipRefresh = false, ...requestOptions } = config;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((requestOptions.headers as Record<string, string>) || {}),
  };

  // Add authorization header if not skipping auth
  if (!skipAuth) {
    const { accessToken } = tokenUtils.getTokens();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  const requestConfig: RequestInit = {
    ...requestOptions,
    headers,
  };

  async function makeRequest(): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, requestConfig);
  }

  let response = await makeRequest();

  // Handle token refresh for 401 errors (if not already skipping refresh)
  if (response.status === 401 && !skipAuth && !skipRefresh) {
    try {
      // Try to refresh the token
      const newTokens = await refreshTokens();
      
      // Update the authorization header with the new token
      headers.Authorization = `Bearer ${newTokens.accessToken}`;
      requestConfig.headers = headers;
      
      // Retry the original request with the new token
      response = await makeRequest();
    } catch (refreshError) {
      // Refresh failed, clear tokens and let the original 401 handle the redirect
      tokenUtils.clearTokens();
      
      // Dispatch a custom event to notify the auth context
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
  }

  // Parse response
  let responseData: any;
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    responseData = await response.json();
  } else {
    const textContent = await response.text();
    responseData = textContent ? { message: textContent } : {};
  }

  if (!response.ok) {
    const errorData = responseData as ApiError;
    throw new ApiClientError(
      errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData.code,
      errorData
    );
  }

  return responseData;
}

// API client with common HTTP methods
export const apiClient = {
  /**
   * GET request
   */
  async get<T = any>(endpoint: string, config: ApiClientConfig = {}): Promise<T> {
    return apiRequest<T>(endpoint, {
      ...config,
      method: 'GET',
    });
  },

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, config: ApiClientConfig = {}): Promise<T> {
    return apiRequest<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, config: ApiClientConfig = {}): Promise<T> {
    return apiRequest<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, config: ApiClientConfig = {}): Promise<T> {
    return apiRequest<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, config: ApiClientConfig = {}): Promise<T> {
    return apiRequest<T>(endpoint, {
      ...config,
      method: 'DELETE',
    });
  },

  /**
   * Upload file(s)
   */
  async upload<T = any>(
    endpoint: string, 
    formData: FormData, 
    config: ApiClientConfig = {}
  ): Promise<T> {
    const { headers, ...otherConfig } = config;
    
    // Don't set Content-Type for FormData, let the browser set it
    const uploadHeaders = { ...((headers as Record<string, string>) || {}) };
    delete uploadHeaders['Content-Type'];

    return apiRequest<T>(endpoint, {
      ...otherConfig,
      method: 'POST',
      body: formData,
      headers: uploadHeaders,
    });
  },

  /**
   * Raw request (for custom configurations)
   */
  async request<T = any>(endpoint: string, config: ApiClientConfig = {}): Promise<T> {
    return apiRequest<T>(endpoint, config);
  },
};

// Utility to check if error is an API error
export function isApiError(error: any): error is ApiClientError {
  return error instanceof ApiClientError;
}

// Utility to handle API errors consistently
export function handleApiError(error: any): { message: string; code?: string; statusCode?: number } {
  if (isApiError(error)) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }
  
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Network error: Unable to connect to server',
      code: 'NETWORK_ERROR',
      statusCode: 0,
    };
  }
  
  return {
    message: error instanceof Error ? error.message : 'Unknown error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode: 0,
  };
}

export default apiClient;