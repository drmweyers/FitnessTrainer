/**
 * Tests for ClientConnectionService
 *
 * This service wraps fetch calls for trainer-client connection management.
 * We mock global fetch and localStorage to test each method.
 */

import { clientConnectionService } from '@/services/clientConnectionService';

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

// Mock global fetch
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.Mock;

function mockSuccessResponse(data: any) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data }),
  } as Response);
}

function mockRawResponse(data: any) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response);
}

function mockErrorResponse(status: number, error: string) {
  return Promise.resolve({
    ok: false,
    status,
    statusText: 'Error',
    json: () => Promise.resolve({ error }),
  } as unknown as Response);
}

function mockErrorResponseJsonFail(status: number) {
  return Promise.resolve({
    ok: false,
    status,
    statusText: 'Internal Server Error',
    json: () => Promise.reject(new Error('parse error')),
  } as unknown as Response);
}

describe('ClientConnectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  // ─── Auth Headers ───

  describe('getAuthHeaders (private, tested via methods)', () => {
    it('includes auth token when present in localStorage', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      mockFetch.mockReturnValue(mockSuccessResponse([]));

      await clientConnectionService.getTrainerInvitations();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('omits Authorization when no token in localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      mockFetch.mockReturnValue(mockSuccessResponse([]));

      await clientConnectionService.getTrainerInvitations();

      const calledHeaders = mockFetch.mock.calls[0][1].headers;
      expect(calledHeaders.Authorization).toBeUndefined();
      expect(calledHeaders['Content-Type']).toBe('application/json');
    });
  });

  // ─── handleResponse (private, tested via methods) ───

  describe('handleResponse (tested via methods)', () => {
    it('returns data.data when response has success: true', async () => {
      mockFetch.mockReturnValue(mockSuccessResponse({ id: '1', name: 'Client' }));

      const result = await clientConnectionService.getClientById('1');

      expect(result).toEqual({ id: '1', name: 'Client' });
    });

    it('returns full body when response does not have success field', async () => {
      mockFetch.mockReturnValue(mockRawResponse({ id: '1', name: 'Client' }));

      const result = await clientConnectionService.getClientById('1');

      expect(result).toEqual({ id: '1', name: 'Client' });
    });

    it('throws error with message from server on failure', async () => {
      mockFetch.mockReturnValue(mockErrorResponse(400, 'Bad request'));

      await expect(clientConnectionService.getClientById('1'))
        .rejects.toThrow('Bad request');
    });

    it('throws fallback message when error JSON parse fails', async () => {
      mockFetch.mockReturnValue(mockErrorResponseJsonFail(500));

      await expect(clientConnectionService.getClientById('1'))
        .rejects.toThrow('Unknown error occurred');
    });

    it('throws HTTP status message when server error has no message', async () => {
      mockFetch.mockReturnValue(Promise.resolve({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({}),
      } as unknown as Response));

      await expect(clientConnectionService.getClientById('1'))
        .rejects.toThrow('HTTP 403: Forbidden');
    });
  });

  // ─── Trainer Methods ───

  describe('getTrainerClients', () => {
    it('fetches clients without filters', async () => {
      const mockData = { clients: [], pagination: { page: 1, total: 0 } };
      mockFetch.mockReturnValue(mockSuccessResponse(mockData));

      const result = await clientConnectionService.getTrainerClients();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients?'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockData);
    });

    it('passes scalar filter params as query string', async () => {
      mockFetch.mockReturnValue(mockSuccessResponse({ clients: [], pagination: {} }));

      await clientConnectionService.getTrainerClients({
        status: 'active',
        search: 'john',
        page: 2,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('status=active');
      expect(calledUrl).toContain('search=john');
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).toContain('sortBy=name');
      expect(calledUrl).toContain('sortOrder=asc');
    });

    it('passes array filter params (tags) as repeated params', async () => {
      mockFetch.mockReturnValue(mockSuccessResponse({ clients: [], pagination: {} }));

      await clientConnectionService.getTrainerClients({
        tags: ['vip', 'active'],
      });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('tags=vip');
      expect(calledUrl).toContain('tags=active');
    });

    it('skips undefined filter values', async () => {
      mockFetch.mockReturnValue(mockSuccessResponse({ clients: [], pagination: {} }));

      await clientConnectionService.getTrainerClients({
        status: undefined,
        search: 'test',
      });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).not.toContain('status');
      expect(calledUrl).toContain('search=test');
    });
  });

  describe('getClientById', () => {
    it('fetches a specific client', async () => {
      const mockClient = { id: 'c1', status: 'active' };
      mockFetch.mockReturnValue(mockSuccessResponse(mockClient));

      const result = await clientConnectionService.getClientById('c1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients/c1'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockClient);
    });
  });

  describe('inviteClient', () => {
    it('sends invitation with correct payload', async () => {
      const invitation = { id: 'inv1', clientEmail: 'new@test.com' };
      mockFetch.mockReturnValue(mockSuccessResponse(invitation));

      const result = await clientConnectionService.inviteClient({
        clientEmail: 'new@test.com',
        customMessage: 'Join me!',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients/invite'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ clientEmail: 'new@test.com', customMessage: 'Join me!' }),
        })
      );
      expect(result).toEqual(invitation);
    });
  });

  describe('getTrainerInvitations', () => {
    it('fetches trainer invitations', async () => {
      const invitations = [{ id: 'inv1' }, { id: 'inv2' }];
      mockFetch.mockReturnValue(mockSuccessResponse(invitations));

      const result = await clientConnectionService.getTrainerInvitations();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients/invitations'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(invitations);
    });
  });

  describe('resendInvitation', () => {
    it('resends invitation by ID', async () => {
      const invitation = { id: 'inv1', status: 'pending' };
      mockFetch.mockReturnValue(mockSuccessResponse(invitation));

      const result = await clientConnectionService.resendInvitation('inv1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients/invitations/inv1/resend'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result).toEqual(invitation);
    });
  });

  describe('updateClientStatus', () => {
    it('sends PUT with status payload', async () => {
      const client = { id: 'c1', status: 'inactive' };
      mockFetch.mockReturnValue(mockSuccessResponse(client));

      const result = await clientConnectionService.updateClientStatus('c1', 'inactive');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients/c1/status'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'inactive' }),
        })
      );
      expect(result).toEqual(client);
    });
  });

  describe('removeClient', () => {
    it('sends DELETE for client', async () => {
      const client = { id: 'c1', status: 'archived' };
      mockFetch.mockReturnValue(mockSuccessResponse(client));

      const result = await clientConnectionService.removeClient('c1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients/c1'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual(client);
    });
  });

  // ─── Client Methods ───

  describe('getClientTrainer', () => {
    it('fetches client trainer connection', async () => {
      const trainer = { id: 'tc1', trainer: { id: 't1' } };
      mockFetch.mockReturnValue(mockSuccessResponse(trainer));

      const result = await clientConnectionService.getClientTrainer();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients/my-trainer'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(trainer);
    });
  });

  describe('getClientInvitations', () => {
    it('fetches client invitations', async () => {
      const invitations = [{ id: 'inv1' }];
      mockFetch.mockReturnValue(mockSuccessResponse(invitations));

      const result = await clientConnectionService.getClientInvitations();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients/my-invitations'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(invitations);
    });
  });

  describe('acceptInvitation', () => {
    it('accepts invitation with token', async () => {
      const connection = { id: 'conn1', status: 'active' };
      mockFetch.mockReturnValue(mockSuccessResponse(connection));

      const result = await clientConnectionService.acceptInvitation('token123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients/invitations/accept'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: 'token123' }),
        })
      );
      expect(result).toEqual(connection);
    });
  });

  describe('declineInvitation', () => {
    it('declines invitation by ID', async () => {
      const invitation = { id: 'inv1', status: 'expired' };
      mockFetch.mockReturnValue(mockSuccessResponse(invitation));

      const result = await clientConnectionService.declineInvitation('inv1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients/invitations/inv1/decline'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result).toEqual(invitation);
    });
  });

  describe('disconnectTrainer', () => {
    it('sends DELETE to disconnect trainer', async () => {
      const connection = { id: 'conn1', status: 'inactive' };
      mockFetch.mockReturnValue(mockSuccessResponse(connection));

      const result = await clientConnectionService.disconnectTrainer();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients/disconnect-trainer'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual(connection);
    });
  });

  // ─── Shared Methods ───

  describe('acceptInvitationByToken', () => {
    it('delegates to acceptInvitation', async () => {
      const connection = { id: 'conn1', status: 'active' };
      mockFetch.mockReturnValue(mockSuccessResponse(connection));

      const result = await clientConnectionService.acceptInvitationByToken('token123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients/invitations/accept'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: 'token123' }),
        })
      );
      expect(result).toEqual(connection);
    });
  });
});
