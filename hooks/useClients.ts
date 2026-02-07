import { useState, useEffect, useCallback } from 'react';
import { 
  Client, 
  ClientFilters, 
  ClientListResponse, 
  CreateClientData, 
  UpdateClientData,
  ClientStatus,
  InviteClientData,
  ClientInvitation 
} from '@/types/client';
import { clientsApi, invitationsApi, ApiError } from '@/lib/api/clients';

interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: string | null;
  pagination: ClientListResponse['pagination'] | null;
  filters: ClientFilters;
  setFilters: (filters: Partial<ClientFilters>) => void;
  refreshClients: () => Promise<void>;
  createClient: (data: CreateClientData) => Promise<Client | null>;
  updateClient: (id: string, data: UpdateClientData) => Promise<Client | null>;
  updateClientStatus: (id: string, status: ClientStatus) => Promise<Client | null>;
  archiveClient: (id: string) => Promise<boolean>;
}

export const useClients = (initialFilters: ClientFilters = {}): UseClientsReturn => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ClientListResponse['pagination'] | null>(null);
  const [filters, setFiltersState] = useState<ClientFilters>({
    page: 1,
    limit: 20,
    sortBy: 'name',
    sortOrder: 'asc',
    ...initialFilters,
  });

  const setFilters = useCallback((newFilters: Partial<ClientFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
      // Reset page when filters change (except when explicitly setting page)
      ...(newFilters.page === undefined && { page: 1 }),
    }));
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await clientsApi.getClients(filters);
      setClients(response.data?.clients || []);
      setPagination(response.data?.pagination || null);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to fetch clients';
      setError(errorMessage);
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const refreshClients = useCallback(async () => {
    await fetchClients();
  }, [fetchClients]);

  const createClient = useCallback(async (data: CreateClientData): Promise<Client | null> => {
    try {
      const response = await clientsApi.createClient(data);
      const newClient = response.data;
      
      // Add to local state
      setClients(prev => [newClient, ...prev]);
      
      return newClient;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to create client';
      setError(errorMessage);
      console.error('Error creating client:', err);
      return null;
    }
  }, []);

  const updateClient = useCallback(async (id: string, data: UpdateClientData): Promise<Client | null> => {
    try {
      const response = await clientsApi.updateClient(id, data);
      const updatedClient = response.data;
      
      // Update in local state
      setClients(prev => 
        prev.map(client => 
          client.id === id ? updatedClient : client
        )
      );
      
      return updatedClient;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to update client';
      setError(errorMessage);
      console.error('Error updating client:', err);
      return null;
    }
  }, []);

  const updateClientStatus = useCallback(async (id: string, status: ClientStatus): Promise<Client | null> => {
    try {
      const response = await clientsApi.updateClientStatus(id, status);
      const updatedClient = response.data;
      
      // Update in local state
      setClients(prev => 
        prev.map(client => 
          client.id === id ? updatedClient : client
        )
      );
      
      return updatedClient;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to update client status';
      setError(errorMessage);
      console.error('Error updating client status:', err);
      return null;
    }
  }, []);

  const archiveClient = useCallback(async (id: string): Promise<boolean> => {
    try {
      await clientsApi.archiveClient(id);
      
      // Remove from local state or mark as archived
      setClients(prev => 
        prev.filter(client => client.id !== id)
      );
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to archive client';
      setError(errorMessage);
      console.error('Error archiving client:', err);
      return false;
    }
  }, []);

  return {
    clients,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    refreshClients,
    createClient,
    updateClient,
    updateClientStatus,
    archiveClient,
  };
};

// Hook for individual client data
interface UseClientReturn {
  client: Client | null;
  loading: boolean;
  error: string | null;
  refreshClient: () => Promise<void>;
}

export const useClient = (clientId: string): UseClientReturn => {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClient = useCallback(async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await clientsApi.getClientById(clientId);
      setClient(response.data);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to fetch client';
      setError(errorMessage);
      console.error('Error fetching client:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const refreshClient = useCallback(async () => {
    await fetchClient();
  }, [fetchClient]);

  return {
    client,
    loading,
    error,
    refreshClient,
  };
};

// Hook for invitations
interface UseInvitationsReturn {
  invitations: ClientInvitation[];
  loading: boolean;
  error: string | null;
  refreshInvitations: () => Promise<void>;
  inviteClient: (data: InviteClientData) => Promise<ClientInvitation | null>;
  resendInvitation: (id: string) => Promise<ClientInvitation | null>;
}

export const useInvitations = (): UseInvitationsReturn => {
  const [invitations, setInvitations] = useState<ClientInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await invitationsApi.getInvitations();
      setInvitations(response || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to fetch invitations';
      setError(errorMessage);
      console.error('Error fetching invitations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const refreshInvitations = useCallback(async () => {
    await fetchInvitations();
  }, [fetchInvitations]);

  const inviteClient = useCallback(async (data: InviteClientData): Promise<ClientInvitation | null> => {
    try {
      const response = await invitationsApi.inviteClient(data);
      const newInvitation = response.data;
      
      // Add to local state
      setInvitations(prev => [newInvitation, ...prev]);
      
      return newInvitation;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to send invitation';
      setError(errorMessage);
      console.error('Error sending invitation:', err);
      return null;
    }
  }, []);

  const resendInvitation = useCallback(async (id: string): Promise<ClientInvitation | null> => {
    try {
      const response = await invitationsApi.resendInvitation(id);
      const updatedInvitation = response.data;
      
      // Update in local state
      setInvitations(prev => 
        prev.map(invitation => 
          invitation.id === id ? updatedInvitation : invitation
        )
      );
      
      return updatedInvitation;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to resend invitation';
      setError(errorMessage);
      console.error('Error resending invitation:', err);
      return null;
    }
  }, []);

  return {
    invitations,
    loading,
    error,
    refreshInvitations,
    inviteClient,
    resendInvitation,
  };
};