/**
 * @jest-environment jsdom
 */

/**
 * Tests for useClients, useClient, and useInvitations hooks
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useClients, useClient, useInvitations } from '@/hooks/useClients';
import { clientsApi, invitationsApi, ApiError } from '@/lib/api/clients';

jest.mock('@/lib/api/clients', () => ({
  clientsApi: {
    getClients: jest.fn(),
    getClientById: jest.fn(),
    createClient: jest.fn(),
    updateClient: jest.fn(),
    updateClientStatus: jest.fn(),
    archiveClient: jest.fn(),
  },
  invitationsApi: {
    getInvitations: jest.fn(),
    inviteClient: jest.fn(),
    resendInvitation: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    details?: any;
    constructor(message: string, status: number, details?: any) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.details = details;
    }
  },
}));

const mockClientsApi = clientsApi as jest.Mocked<typeof clientsApi>;
const mockInvitationsApi = invitationsApi as jest.Mocked<typeof invitationsApi>;
const MockApiError = ApiError;

const mockClient = {
  id: 'c1',
  email: 'client@test.com',
  role: 'CLIENT',
  isActive: true,
  isVerified: true,
  createdAt: '2024-01-01',
  tags: [],
  displayName: 'Test Client',
};

const mockPagination = {
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
};

describe('useClients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('fetches clients on mount with default filters', async () => {
    mockClientsApi.getClients.mockResolvedValue({
      data: { clients: [mockClient], pagination: mockPagination },
      clients: [mockClient],
      pagination: mockPagination,
    } as any);

    const { result } = renderHook(() => useClients());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockClientsApi.getClients).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc',
      })
    );
    expect(result.current.clients).toEqual([mockClient]);
    expect(result.current.error).toBeNull();
  });

  it('uses initial filters when provided', async () => {
    mockClientsApi.getClients.mockResolvedValue({
      data: { clients: [], pagination: mockPagination },
      clients: [],
      pagination: mockPagination,
    } as any);

    renderHook(() => useClients({ page: 2, limit: 10, sortBy: 'dateAdded' }));

    await waitFor(() => {
      expect(mockClientsApi.getClients).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
          sortBy: 'dateAdded',
          sortOrder: 'asc',
        })
      );
    });
  });

  it('handles fetch error with ApiError', async () => {
    mockClientsApi.getClients.mockRejectedValue(
      new MockApiError('Server error', 500)
    );

    const { result } = renderHook(() => useClients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Server error');
    expect(result.current.clients).toEqual([]);
  });

  it('handles fetch error with generic error', async () => {
    mockClientsApi.getClients.mockRejectedValue(new Error('network fail'));

    const { result } = renderHook(() => useClients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch clients');
  });

  it('sets empty clients when response data is missing', async () => {
    mockClientsApi.getClients.mockResolvedValue({
      data: null,
    } as any);

    const { result } = renderHook(() => useClients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.clients).toEqual([]);
    expect(result.current.pagination).toBeNull();
  });

  it('resets page to 1 when filters change (not page)', async () => {
    mockClientsApi.getClients.mockResolvedValue({
      data: { clients: [], pagination: mockPagination },
    } as any);

    const { result } = renderHook(() => useClients({ page: 3 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ search: 'new search' });
    });

    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.search).toBe('new search');
  });

  it('preserves page when explicitly setting page in setFilters', async () => {
    mockClientsApi.getClients.mockResolvedValue({
      data: { clients: [], pagination: mockPagination },
    } as any);

    const { result } = renderHook(() => useClients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ page: 5 });
    });

    expect(result.current.filters.page).toBe(5);
  });

  it('refreshClients re-fetches data', async () => {
    mockClientsApi.getClients.mockResolvedValue({
      data: { clients: [mockClient], pagination: mockPagination },
    } as any);

    const { result } = renderHook(() => useClients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockClientsApi.getClients).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refreshClients();
    });

    expect(mockClientsApi.getClients).toHaveBeenCalledTimes(2);
  });

  it('createClient adds new client to local state', async () => {
    mockClientsApi.getClients.mockResolvedValue({
      data: { clients: [], pagination: mockPagination },
    } as any);

    const newClient = { ...mockClient, id: 'c2' };
    mockClientsApi.createClient.mockResolvedValue({ data: newClient } as any);

    const { result } = renderHook(() => useClients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let created: any;
    await act(async () => {
      created = await result.current.createClient({ email: 'new@test.com' });
    });

    expect(created).toEqual(newClient);
    expect(result.current.clients).toContainEqual(newClient);
  });

  it('createClient returns null on error', async () => {
    mockClientsApi.getClients.mockResolvedValue({
      data: { clients: [], pagination: mockPagination },
    } as any);
    mockClientsApi.createClient.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useClients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let created: any;
    await act(async () => {
      created = await result.current.createClient({ email: 'new@test.com' });
    });

    expect(created).toBeNull();
    expect(result.current.error).toBe('Failed to create client');
  });

  it('updateClient updates client in local state', async () => {
    mockClientsApi.getClients.mockResolvedValue({
      data: { clients: [mockClient], pagination: mockPagination },
    } as any);

    const updatedClient = { ...mockClient, displayName: 'Updated' };
    mockClientsApi.updateClient.mockResolvedValue({ data: updatedClient } as any);

    const { result } = renderHook(() => useClients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updated: any;
    await act(async () => {
      updated = await result.current.updateClient('c1', { status: 'active' as any });
    });

    expect(updated).toEqual(updatedClient);
    expect(result.current.clients[0].displayName).toBe('Updated');
  });

  it('updateClient returns null on error', async () => {
    mockClientsApi.getClients.mockResolvedValue({
      data: { clients: [mockClient], pagination: mockPagination },
    } as any);
    mockClientsApi.updateClient.mockRejectedValue(new MockApiError('Update failed', 400));

    const { result } = renderHook(() => useClients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updated: any;
    await act(async () => {
      updated = await result.current.updateClient('c1', {});
    });

    expect(updated).toBeNull();
    expect(result.current.error).toBe('Update failed');
  });

  it('updateClientStatus updates status in local state', async () => {
    mockClientsApi.getClients.mockResolvedValue({
      data: { clients: [mockClient], pagination: mockPagination },
    } as any);

    const statusUpdated = { ...mockClient, status: 'archived' };
    mockClientsApi.updateClientStatus.mockResolvedValue({ data: statusUpdated } as any);

    const { result } = renderHook(() => useClients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updated: any;
    await act(async () => {
      updated = await result.current.updateClientStatus('c1', 'archived' as any);
    });

    expect(updated).toEqual(statusUpdated);
  });

  it('updateClientStatus returns null on error', async () => {
    mockClientsApi.getClients.mockResolvedValue({
      data: { clients: [mockClient], pagination: mockPagination },
    } as any);
    mockClientsApi.updateClientStatus.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useClients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let updated: any;
    await act(async () => {
      updated = await result.current.updateClientStatus('c1', 'archived' as any);
    });

    expect(updated).toBeNull();
    expect(result.current.error).toBe('Failed to update client status');
  });

  it('archiveClient removes client from local state', async () => {
    mockClientsApi.getClients.mockResolvedValue({
      data: { clients: [mockClient], pagination: mockPagination },
    } as any);
    mockClientsApi.archiveClient.mockResolvedValue({} as any);

    const { result } = renderHook(() => useClients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let archived: boolean = false;
    await act(async () => {
      archived = await result.current.archiveClient('c1');
    });

    expect(archived).toBe(true);
    expect(result.current.clients).toHaveLength(0);
  });

  it('archiveClient returns false on error', async () => {
    mockClientsApi.getClients.mockResolvedValue({
      data: { clients: [mockClient], pagination: mockPagination },
    } as any);
    mockClientsApi.archiveClient.mockRejectedValue(new MockApiError('Forbidden', 403));

    const { result } = renderHook(() => useClients());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let archived: boolean = true;
    await act(async () => {
      archived = await result.current.archiveClient('c1');
    });

    expect(archived).toBe(false);
    expect(result.current.error).toBe('Forbidden');
  });
});

describe('useClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('fetches individual client on mount', async () => {
    mockClientsApi.getClientById.mockResolvedValue({ data: mockClient } as any);

    const { result } = renderHook(() => useClient('c1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockClientsApi.getClientById).toHaveBeenCalledWith('c1');
    expect(result.current.client).toEqual(mockClient);
    expect(result.current.error).toBeNull();
  });

  it('does not fetch when clientId is empty', async () => {
    const { result } = renderHook(() => useClient(''));

    // Should remain in initial state (loading but no fetch)
    await waitFor(() => {
      expect(mockClientsApi.getClientById).not.toHaveBeenCalled();
    });
  });

  it('handles fetch error', async () => {
    mockClientsApi.getClientById.mockRejectedValue(new MockApiError('Not found', 404));

    const { result } = renderHook(() => useClient('c1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Not found');
    expect(result.current.client).toBeNull();
  });

  it('handles generic error', async () => {
    mockClientsApi.getClientById.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useClient('c1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch client');
  });

  it('refreshClient re-fetches data', async () => {
    mockClientsApi.getClientById.mockResolvedValue({ data: mockClient } as any);

    const { result } = renderHook(() => useClient('c1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshClient();
    });

    expect(mockClientsApi.getClientById).toHaveBeenCalledTimes(2);
  });
});

describe('useInvitations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  const mockInvitation = {
    id: 'inv1',
    trainerId: 't1',
    clientEmail: 'client@test.com',
    token: 'tok1',
    status: 'pending',
    sentAt: '2024-01-01',
    expiresAt: '2024-02-01',
  };

  it('fetches invitations on mount', async () => {
    mockInvitationsApi.getInvitations.mockResolvedValue([mockInvitation] as any);

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.invitations).toEqual([mockInvitation]);
    expect(result.current.error).toBeNull();
  });

  it('sets empty array when response is falsy', async () => {
    mockInvitationsApi.getInvitations.mockResolvedValue(null as any);

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.invitations).toEqual([]);
  });

  it('handles fetch error', async () => {
    mockInvitationsApi.getInvitations.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch invitations');
  });

  it('refreshInvitations re-fetches', async () => {
    mockInvitationsApi.getInvitations.mockResolvedValue([]);

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshInvitations();
    });

    expect(mockInvitationsApi.getInvitations).toHaveBeenCalledTimes(2);
  });

  it('inviteClient adds invitation to local state', async () => {
    mockInvitationsApi.getInvitations.mockResolvedValue([]);
    const newInv = { ...mockInvitation, id: 'inv2' };
    mockInvitationsApi.inviteClient.mockResolvedValue({ data: newInv } as any);

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let invited: any;
    await act(async () => {
      invited = await result.current.inviteClient({ clientEmail: 'new@test.com' });
    });

    expect(invited).toEqual(newInv);
    expect(result.current.invitations).toContainEqual(newInv);
  });

  it('inviteClient returns null on error', async () => {
    mockInvitationsApi.getInvitations.mockResolvedValue([]);
    mockInvitationsApi.inviteClient.mockRejectedValue(new MockApiError('Conflict', 409));

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let invited: any;
    await act(async () => {
      invited = await result.current.inviteClient({ clientEmail: 'new@test.com' });
    });

    expect(invited).toBeNull();
    expect(result.current.error).toBe('Conflict');
  });

  it('resendInvitation updates invitation in local state', async () => {
    mockInvitationsApi.getInvitations.mockResolvedValue([mockInvitation] as any);
    const updated = { ...mockInvitation, sentAt: '2024-06-01' };
    mockInvitationsApi.resendInvitation.mockResolvedValue({ data: updated } as any);

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let resent: any;
    await act(async () => {
      resent = await result.current.resendInvitation('inv1');
    });

    expect(resent).toEqual(updated);
    expect(result.current.invitations[0].sentAt).toBe('2024-06-01');
  });

  it('resendInvitation returns null on error', async () => {
    mockInvitationsApi.getInvitations.mockResolvedValue([mockInvitation] as any);
    mockInvitationsApi.resendInvitation.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useInvitations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let resent: any;
    await act(async () => {
      resent = await result.current.resendInvitation('inv1');
    });

    expect(resent).toBeNull();
    expect(result.current.error).toBe('Failed to resend invitation');
  });
});
