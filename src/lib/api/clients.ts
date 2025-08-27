import { 
  Client, 
  ClientListResponse, 
  ClientFilters, 
  CreateClientData, 
  InviteClientData, 
  UpdateClientData,
  ClientInvitation,
  ClientNote,
  NotesResponse,
  NotePagination,
  ClientTag,
  CreateTagData,
  UpdateTagData,
  ClientStatus
} from '@/types/client';

// Base API configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const CLIENT_ENDPOINT = `${API_BASE}/clients`;

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
      errorData.error || 'Request failed',
      response.status,
      errorData.details
    );
  }
  return response.json();
};

// =====================================
// CLIENT MANAGEMENT
// =====================================

export const clientsApi = {
  // Get all clients for trainer
  async getClients(filters?: ClientFilters): Promise<ClientListResponse> {
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

    const response = await fetch(`${CLIENT_ENDPOINT}?${params}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Get specific client by ID
  async getClientById(id: string): Promise<Client> {
    const response = await fetch(`${CLIENT_ENDPOINT}/${id}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Create client directly (manual add)
  async createClient(data: CreateClientData): Promise<Client> {
    const response = await fetch(CLIENT_ENDPOINT, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  // Update client
  async updateClient(id: string, data: UpdateClientData): Promise<Client> {
    const response = await fetch(`${CLIENT_ENDPOINT}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  // Update client status
  async updateClientStatus(id: string, status: ClientStatus): Promise<Client> {
    const response = await fetch(`${CLIENT_ENDPOINT}/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    return handleResponse(response);
  },

  // Archive client (soft delete)
  async archiveClient(id: string): Promise<Client> {
    const response = await fetch(`${CLIENT_ENDPOINT}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },
};

// =====================================
// INVITATIONS
// =====================================

export const invitationsApi = {
  // Get all invitations for trainer
  async getInvitations(): Promise<ClientInvitation[]> {
    const response = await fetch(`${CLIENT_ENDPOINT}/invitations`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Send client invitation
  async inviteClient(data: InviteClientData): Promise<ClientInvitation> {
    const response = await fetch(`${CLIENT_ENDPOINT}/invite`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  // Resend invitation
  async resendInvitation(id: string): Promise<ClientInvitation> {
    const response = await fetch(`${CLIENT_ENDPOINT}/invitations/${id}/resend`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Accept invitation (for clients)
  async acceptInvitation(token: string): Promise<any> {
    const response = await fetch(`${CLIENT_ENDPOINT}/invitations/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ token }),
    });

    return handleResponse(response);
  },
};

// =====================================
// NOTES
// =====================================

export const notesApi = {
  // Get client notes
  async getNotes(clientId: string, pagination?: NotePagination): Promise<NotesResponse> {
    const params = new URLSearchParams();
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());

    const response = await fetch(`${CLIENT_ENDPOINT}/${clientId}/notes?${params}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Add note to client
  async addNote(clientId: string, note: string): Promise<ClientNote> {
    const response = await fetch(`${CLIENT_ENDPOINT}/${clientId}/notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ note }),
    });

    return handleResponse(response);
  },

  // Update note
  async updateNote(noteId: string, note: string): Promise<ClientNote> {
    const response = await fetch(`${CLIENT_ENDPOINT}/notes/${noteId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ note }),
    });

    return handleResponse(response);
  },

  // Delete note
  async deleteNote(noteId: string): Promise<void> {
    const response = await fetch(`${CLIENT_ENDPOINT}/notes/${noteId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },
};

// =====================================
// TAGS
// =====================================

export const tagsApi = {
  // Get trainer's tags
  async getTags(): Promise<ClientTag[]> {
    const response = await fetch(`${CLIENT_ENDPOINT}/tags`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Create new tag
  async createTag(data: CreateTagData): Promise<ClientTag> {
    const response = await fetch(`${CLIENT_ENDPOINT}/tags`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  // Update tag
  async updateTag(tagId: string, data: UpdateTagData): Promise<ClientTag> {
    const response = await fetch(`${CLIENT_ENDPOINT}/tags/${tagId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  // Delete tag
  async deleteTag(tagId: string): Promise<void> {
    const response = await fetch(`${CLIENT_ENDPOINT}/tags/${tagId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Assign tags to client
  async assignTags(clientId: string, tagIds: string[]): Promise<Client> {
    const response = await fetch(`${CLIENT_ENDPOINT}/${clientId}/tags`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tagIds }),
    });

    return handleResponse(response);
  },

  // Remove tags from client
  async removeTags(clientId: string, tagIds: string[]): Promise<Client> {
    const response = await fetch(`${CLIENT_ENDPOINT}/${clientId}/tags?action=remove`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tagIds }),
    });

    return handleResponse(response);
  },
};

// Export all APIs as named exports for easier imports
export { ApiError };
export default {
  clients: clientsApi,
  invitations: invitationsApi,
  notes: notesApi,
  tags: tagsApi,
};