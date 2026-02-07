/**
 * Tests for lib/api/apiClient.ts (Enhanced API client with auth interceptors)
 */

// Mock the auth module before importing apiClient
jest.mock('@/lib/api/auth', () => {
  const tokenUtils = {
    getTokens: jest.fn(() => ({ accessToken: null, refreshToken: null })),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  };
  const authApi = {
    refreshToken: jest.fn(),
  };
  return { tokenUtils, authApi, default: authApi };
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { apiClient, ApiClientError, isApiError, handleApiError } from '@/lib/api/apiClient';
import { tokenUtils, authApi } from '@/lib/api/auth';

const mockedTokenUtils = tokenUtils as jest.Mocked<typeof tokenUtils>;
const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;

function jsonResponse(data: any, ok = true, status = 200, contentType = 'application/json') {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers({ 'content-type': contentType }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

function textResponse(text: string, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers({ 'content-type': 'text/plain' }),
    json: () => Promise.reject(new Error('Not JSON')),
    text: () => Promise.resolve(text),
  };
}

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedTokenUtils.getTokens.mockReturnValue({ accessToken: null, refreshToken: null });
  });

  // ─── GET ───

  describe('get', () => {
    it('sends GET request and returns JSON data', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: 'test' }));

      const result = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual({ data: 'test' });
    });

    it('includes auth header when token exists', async () => {
      mockedTokenUtils.getTokens.mockReturnValue({
        accessToken: 'my-access-token',
        refreshToken: 'my-refresh-token',
      });
      mockFetch.mockResolvedValue(jsonResponse({}));

      await apiClient.get('/protected');

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer my-access-token');
    });

    it('omits auth header when skipAuth is true', async () => {
      mockedTokenUtils.getTokens.mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });
      mockFetch.mockResolvedValue(jsonResponse({}));

      await apiClient.get('/public', { skipAuth: true });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });

  // ─── POST ───

  describe('post', () => {
    it('sends POST with JSON body', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ id: '1' }));

      const result = await apiClient.post('/items', { name: 'Test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/items'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
        })
      );
      expect(result).toEqual({ id: '1' });
    });

    it('sends POST without body when data is undefined', async () => {
      mockFetch.mockResolvedValue(jsonResponse({}));

      await apiClient.post('/empty');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      );
    });
  });

  // ─── PUT ───

  describe('put', () => {
    it('sends PUT request with data', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ updated: true }));

      await apiClient.put('/items/1', { name: 'Updated' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/items/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated' }),
        })
      );
    });
  });

  // ─── PATCH ───

  describe('patch', () => {
    it('sends PATCH request with data', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ patched: true }));

      await apiClient.patch('/items/1', { field: 'value' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/items/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ field: 'value' }),
        })
      );
    });
  });

  // ─── DELETE ───

  describe('delete', () => {
    it('sends DELETE request', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ deleted: true }));

      await apiClient.delete('/items/1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/items/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  // ─── upload ───

  describe('upload', () => {
    it('sends FormData with POST method', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ url: 'file.jpg' }));

      const formData = new FormData();
      formData.append('file', 'data');

      const result = await apiClient.upload('/upload', formData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/upload'),
        expect.objectContaining({
          method: 'POST',
          body: formData,
        })
      );
      expect(result).toEqual({ url: 'file.jpg' });
    });
  });

  // ─── request ───

  describe('request', () => {
    it('allows custom request configuration', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ custom: true }));

      await apiClient.request('/custom', { method: 'OPTIONS' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/custom'),
        expect.objectContaining({ method: 'OPTIONS' })
      );
    });
  });

  // ─── Error handling ───

  describe('error handling', () => {
    it('throws ApiClientError with message from response', async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ message: 'Validation failed', code: 'VALIDATION_ERROR' }, false, 422)
      );

      try {
        await apiClient.get('/bad');
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect((err as ApiClientError).message).toBe('Validation failed');
        expect((err as ApiClientError).statusCode).toBe(422);
        expect((err as ApiClientError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('uses statusText as fallback error message', async () => {
      mockFetch.mockResolvedValue(jsonResponse({}, false, 500));

      try {
        await apiClient.get('/error');
        fail('Should have thrown');
      } catch (err) {
        expect((err as ApiClientError).message).toContain('HTTP 500');
      }
    });

    it('handles non-JSON error responses', async () => {
      mockFetch.mockResolvedValue(textResponse('Server Error', false, 500));

      try {
        await apiClient.get('/text-error');
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect((err as ApiClientError).statusCode).toBe(500);
      }
    });

    it('handles non-JSON success responses', async () => {
      mockFetch.mockResolvedValue(textResponse('OK'));

      const result = await apiClient.get('/text-success');

      expect(result).toEqual({ message: 'OK' });
    });

    it('handles empty text response', async () => {
      mockFetch.mockResolvedValue(textResponse(''));

      const result = await apiClient.get('/empty-text');

      expect(result).toEqual({});
    });
  });

  // ─── Token refresh on 401 ───

  describe('token refresh on 401', () => {
    it('refreshes token and retries request on 401', async () => {
      mockedTokenUtils.getTokens.mockReturnValue({
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh',
      });

      // First call returns 401
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ message: 'Token expired' }, false, 401)
      );

      // Mock the refresh token call
      mockedAuthApi.refreshToken.mockResolvedValue({
        data: {
          tokens: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        },
      } as any);

      // Retry returns success
      mockFetch.mockResolvedValueOnce(jsonResponse({ data: 'refreshed' }));

      const result = await apiClient.get('/protected');

      expect(result).toEqual({ data: 'refreshed' });
      expect(mockedAuthApi.refreshToken).toHaveBeenCalledWith({
        refreshToken: 'valid-refresh',
      });
      expect(mockedTokenUtils.setTokens).toHaveBeenCalledWith(
        'new-access-token',
        'new-refresh-token'
      );
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('clears tokens when refresh fails', async () => {
      // Define window for node test environment
      const mockDispatch = jest.fn(() => true);
      (global as any).window = { dispatchEvent: mockDispatch };

      mockedTokenUtils.getTokens.mockReturnValue({
        accessToken: 'expired-token',
        refreshToken: 'invalid-refresh',
      });

      // First call returns 401
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ message: 'Unauthorized' }, false, 401)
      );

      // Refresh token fails
      mockedAuthApi.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

      try {
        await apiClient.get('/protected');
      } catch (err) {
        // The original 401 error propagates since refresh failed
      }

      expect(mockedTokenUtils.clearTokens).toHaveBeenCalled();

      delete (global as any).window;
    });

    it('does not refresh when skipAuth is true', async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ message: 'Unauthorized' }, false, 401)
      );

      try {
        await apiClient.get('/public', { skipAuth: true });
      } catch (err) {
        // Expected
      }

      expect(mockedAuthApi.refreshToken).not.toHaveBeenCalled();
    });

    it('does not refresh when skipRefresh is true', async () => {
      mockedTokenUtils.getTokens.mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });
      mockFetch.mockResolvedValue(
        jsonResponse({ message: 'Unauthorized' }, false, 401)
      );

      try {
        await apiClient.get('/no-refresh', { skipRefresh: true });
      } catch (err) {
        // Expected
      }

      expect(mockedAuthApi.refreshToken).not.toHaveBeenCalled();
    });

    it('does not attempt refresh when no refresh token available', async () => {
      // Define window for node test environment
      (global as any).window = { dispatchEvent: jest.fn(() => true) };

      mockedTokenUtils.getTokens.mockReturnValue({
        accessToken: 'expired-token',
        refreshToken: null,
      });

      mockFetch.mockResolvedValue(
        jsonResponse({ message: 'Unauthorized' }, false, 401)
      );

      try {
        await apiClient.get('/protected');
      } catch (err) {
        // Expected
      }

      expect(mockedTokenUtils.clearTokens).toHaveBeenCalled();

      delete (global as any).window;
    });
  });

  // ─── Utility functions ───

  describe('isApiError', () => {
    it('returns true for ApiClientError instances', () => {
      expect(isApiError(new ApiClientError('test', 400))).toBe(true);
    });

    it('returns false for other errors', () => {
      expect(isApiError(new Error('test'))).toBe(false);
    });

    it('returns false for non-error values', () => {
      expect(isApiError('string')).toBe(false);
      expect(isApiError(null)).toBe(false);
    });
  });

  describe('handleApiError', () => {
    it('extracts info from ApiClientError', () => {
      const err = new ApiClientError('Bad request', 400, 'BAD_REQUEST');
      const result = handleApiError(err);

      expect(result).toEqual({
        message: 'Bad request',
        code: 'BAD_REQUEST',
        statusCode: 400,
      });
    });

    it('handles network errors (fetch TypeError)', () => {
      const err = new TypeError('fetch failed');
      const result = handleApiError(err);

      expect(result).toEqual({
        message: 'Network error: Unable to connect to server',
        code: 'NETWORK_ERROR',
        statusCode: 0,
      });
    });

    it('handles generic Error instances', () => {
      const result = handleApiError(new Error('Something broke'));

      expect(result).toEqual({
        message: 'Something broke',
        code: 'UNKNOWN_ERROR',
        statusCode: 0,
      });
    });

    it('handles non-Error values', () => {
      const result = handleApiError('random string');

      expect(result).toEqual({
        message: 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
        statusCode: 0,
      });
    });
  });

  // ─── ApiClientError ───

  describe('ApiClientError', () => {
    it('has correct name and properties', () => {
      const err = new ApiClientError('Test', 404, 'NOT_FOUND', { raw: true });

      expect(err.name).toBe('ApiClientError');
      expect(err.message).toBe('Test');
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.originalResponse).toEqual({ raw: true });
    });

    it('is an instance of Error', () => {
      const err = new ApiClientError('Test', 500);
      expect(err).toBeInstanceOf(Error);
    });
  });
});
