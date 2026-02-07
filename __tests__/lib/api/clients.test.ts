/**
 * Tests for lib/api/clients.ts (Client management API)
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

import { clientsApi, invitationsApi, notesApi, tagsApi, ApiError } from '@/lib/api/clients';

function mockJsonResponse(data: any, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
  };
}

function mockJsonErrorParseFail(status = 500) {
  return {
    ok: false,
    status,
    json: () => Promise.reject(new Error('parse failed')),
  };
}

describe('clientsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  // ─── Auth headers ───

  describe('auth headers', () => {
    it('includes auth token in requests', async () => {
      localStorageMock.getItem.mockReturnValue('my-token');
      mockFetch.mockResolvedValue(mockJsonResponse({ clients: [] }));

      await clientsApi.getClients();

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer my-token');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('omits auth when no token', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      mockFetch.mockResolvedValue(mockJsonResponse({ clients: [] }));

      await clientsApi.getClients();

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });

  // ─── handleResponse ───

  describe('handleResponse (tested via methods)', () => {
    it('throws ApiError with message from response', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ error: 'Bad request' }, false, 400));

      try {
        await clientsApi.getClientById('1');
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as any).message).toBe('Bad request');
        expect((err as any).status).toBe(400);
      }
    });

    it('throws fallback error when JSON parse fails', async () => {
      mockFetch.mockResolvedValue(mockJsonErrorParseFail());

      try {
        await clientsApi.getClientById('1');
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as any).message).toBe('Unknown error');
      }
    });

    it('uses "Request failed" when no error message in response', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({}, false, 500));

      try {
        await clientsApi.getClientById('1');
        fail('Should have thrown');
      } catch (err) {
        expect((err as any).message).toBe('Request failed');
      }
    });
  });

  // ─── getClients ───

  describe('getClients', () => {
    it('fetches clients without filters', async () => {
      const data = { clients: [{ id: 'c1' }], pagination: { page: 1, total: 1 } };
      mockFetch.mockResolvedValue(mockJsonResponse(data));

      const result = await clientsApi.getClients();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients?'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual(data);
    });

    it('passes scalar filters as query params', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ clients: [] }));

      await clientsApi.getClients({ status: 'active' as any, search: 'john', page: 2, limit: 10 });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('status=active');
      expect(url).toContain('search=john');
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
    });

    it('passes array filters as repeated params', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ clients: [] }));

      await clientsApi.getClients({ tags: ['vip', 'new'] } as any);

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('tags=vip');
      expect(url).toContain('tags=new');
    });

    it('skips undefined filter values', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ clients: [] }));

      await clientsApi.getClients({ status: undefined as any, search: 'test' });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).not.toContain('status');
      expect(url).toContain('search=test');
    });
  });

  // ─── getClientById ───

  describe('getClientById', () => {
    it('fetches client by ID', async () => {
      const client = { id: 'c1', email: 'client@test.com' };
      mockFetch.mockResolvedValue(mockJsonResponse(client));

      const result = await clientsApi.getClientById('c1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/c1'),
        expect.any(Object)
      );
      expect(result).toEqual(client);
    });
  });

  // ─── createClient ───

  describe('createClient', () => {
    it('sends POST with client data', async () => {
      const newClient = { id: 'c-new', email: 'new@test.com' };
      mockFetch.mockResolvedValue(mockJsonResponse(newClient));

      const result = await clientsApi.createClient({ email: 'new@test.com' } as any);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'new@test.com' }),
        })
      );
      expect(result).toEqual(newClient);
    });
  });

  // ─── updateClient ───

  describe('updateClient', () => {
    it('sends PUT with update data', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 'c1', updated: true }));

      await clientsApi.updateClient('c1', { email: 'updated@test.com' } as any);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/c1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ email: 'updated@test.com' }),
        })
      );
    });
  });

  // ─── updateClientStatus ───

  describe('updateClientStatus', () => {
    it('sends PUT with status', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 'c1', status: 'inactive' }));

      await clientsApi.updateClientStatus('c1', 'inactive' as any);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/c1/status'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'inactive' }),
        })
      );
    });
  });

  // ─── archiveClient ───

  describe('archiveClient', () => {
    it('sends DELETE to archive client', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 'c1', status: 'archived' }));

      await clientsApi.archiveClient('c1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/c1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});

// ─── invitationsApi ───

describe('invitationsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('getInvitations', () => {
    it('fetches invitations', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([{ id: 'inv1' }]));

      const result = await invitationsApi.getInvitations();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/invitations'),
        expect.any(Object)
      );
      expect(result).toEqual([{ id: 'inv1' }]);
    });
  });

  describe('inviteClient', () => {
    it('sends POST with invitation data', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 'inv-new' }));

      await invitationsApi.inviteClient({ clientEmail: 'new@test.com', customMessage: 'Join!' } as any);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/invite'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ clientEmail: 'new@test.com', customMessage: 'Join!' }),
        })
      );
    });
  });

  describe('resendInvitation', () => {
    it('sends POST to resend endpoint', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 'inv1' }));

      await invitationsApi.resendInvitation('inv1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/invitations/inv1/resend'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('acceptInvitation', () => {
    it('sends POST with token', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ status: 'accepted' }));

      await invitationsApi.acceptInvitation('invite-token-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/invitations/accept'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: 'invite-token-123' }),
        })
      );
    });
  });
});

// ─── notesApi ───

describe('notesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('getNotes', () => {
    it('fetches notes for client without pagination', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ notes: [], total: 0 }));

      await notesApi.getNotes('c1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/c1/notes'),
        expect.any(Object)
      );
    });

    it('passes pagination params', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ notes: [] }));

      await notesApi.getNotes('c1', { page: 2, limit: 5 });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('page=2');
      expect(url).toContain('limit=5');
    });
  });

  describe('addNote', () => {
    it('sends POST with note text', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 'n1', note: 'Test note' }));

      await notesApi.addNote('c1', 'Test note');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/c1/notes'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ note: 'Test note' }),
        })
      );
    });
  });

  describe('updateNote', () => {
    it('sends PUT with updated note', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 'n1', note: 'Updated' }));

      await notesApi.updateNote('n1', 'Updated');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/notes/n1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ note: 'Updated' }),
        })
      );
    });
  });

  describe('deleteNote', () => {
    it('sends DELETE', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse(null));

      await notesApi.deleteNote('n1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/notes/n1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});

// ─── tagsApi ───

describe('tagsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('getTags', () => {
    it('fetches tags', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse([{ id: 't1', name: 'VIP' }]));

      const result = await tagsApi.getTags();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/tags'),
        expect.any(Object)
      );
      expect(result).toEqual([{ id: 't1', name: 'VIP' }]);
    });
  });

  describe('createTag', () => {
    it('sends POST with tag data', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 't-new', name: 'Important' }));

      await tagsApi.createTag({ name: 'Important', color: '#ff0000' } as any);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/tags'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Important', color: '#ff0000' }),
        })
      );
    });
  });

  describe('updateTag', () => {
    it('sends PUT with updated tag data', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 't1', name: 'Updated' }));

      await tagsApi.updateTag('t1', { name: 'Updated' } as any);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/tags/t1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated' }),
        })
      );
    });
  });

  describe('deleteTag', () => {
    it('sends DELETE', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse(null));

      await tagsApi.deleteTag('t1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/tags/t1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('assignTags', () => {
    it('sends PUT with tag IDs', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 'c1' }));

      await tagsApi.assignTags('c1', ['t1', 't2']);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/clients/c1/tags'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ tagIds: ['t1', 't2'] }),
        })
      );
    });
  });

  describe('removeTags', () => {
    it('sends PUT with action=remove query param', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 'c1' }));

      await tagsApi.removeTags('c1', ['t1']);

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/clients/c1/tags?action=remove');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ tagIds: ['t1'] }),
        })
      );
    });
  });
});

// ─── ApiError class ───

describe('ApiError', () => {
  it('has correct properties', () => {
    const err = new ApiError('Test error', 404, { field: 'name' });

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiError');
    expect(err.message).toBe('Test error');
    expect(err.status).toBe(404);
    expect(err.details).toEqual({ field: 'name' });
  });
});
