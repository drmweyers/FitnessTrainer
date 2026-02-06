const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface InviteClientData {
  clientEmail: string;
  customMessage?: string;
}

export interface ClientConnection {
  id: string;
  status: 'active' | 'pending' | 'inactive' | 'archived';
  connectedAt: string;
  archivedAt?: string;
  client: {
    id: string;
    email: string;
    userProfile?: {
      bio?: string;
    };
    clientProfile?: {
      fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
      goals?: any;
      preferences?: any;
      emergencyContact?: any;
      medicalConditions?: string[];
      medications?: string[];
      allergies?: string[];
    };
    lastLoginAt?: string;
  };
}

export interface TrainerInvitation {
  id: string;
  trainerId: string;
  clientEmail: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  customMessage?: string;
  sentAt: string;
  expiresAt: string;
  acceptedAt?: string;
  trainer: {
    id: string;
    email: string;
    userProfile?: {
      bio?: string;
    };
  };
}

export interface TrainerConnection {
  id: string;
  status: 'active' | 'pending' | 'inactive' | 'archived';
  connectedAt: string;
  trainer: {
    id: string;
    email: string;
    userProfile?: {
      bio?: string;
    };
    trainerCertifications?: Array<{
      certificationName: string;
      issuingOrganization: string;
      credentialId?: string;
      issueDate?: string;
      expiryDate?: string;
      isVerified: boolean;
    }>;
    trainerSpecializations?: Array<{
      specialization: string;
      yearsExperience?: number;
      description?: string;
    }>;
  };
}

class ClientConnectionService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success ? data.data : data;
  }

  // =====================================
  // TRAINER METHODS
  // =====================================

  /**
   * Get all clients for a trainer
   */
  async getTrainerClients(filters?: {
    status?: string;
    search?: string;
    tags?: string[];
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }): Promise<{ clients: ClientConnection[]; pagination: any }> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(item => params.append(key, item));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/clients?${params.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  /**
   * Get specific client details
   */
  async getClientById(clientId: string): Promise<ClientConnection> {
    const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  /**
   * Send client invitation
   */
  async inviteClient(data: InviteClientData): Promise<TrainerInvitation> {
    const response = await fetch(`${API_BASE_URL}/clients/invite`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    return this.handleResponse(response);
  }

  /**
   * Get trainer's invitations
   */
  async getTrainerInvitations(): Promise<TrainerInvitation[]> {
    const response = await fetch(`${API_BASE_URL}/clients/invitations`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  /**
   * Resend invitation
   */
  async resendInvitation(invitationId: string): Promise<TrainerInvitation> {
    const response = await fetch(`${API_BASE_URL}/clients/invitations/${invitationId}/resend`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  /**
   * Update client status
   */
  async updateClientStatus(clientId: string, status: string): Promise<ClientConnection> {
    const response = await fetch(`${API_BASE_URL}/clients/${clientId}/status`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status })
    });

    return this.handleResponse(response);
  }

  /**
   * Remove/archive client
   */
  async removeClient(clientId: string): Promise<ClientConnection> {
    const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  // =====================================
  // CLIENT METHODS
  // =====================================

  /**
   * Get client's trainer information
   */
  async getClientTrainer(): Promise<TrainerConnection> {
    const response = await fetch(`${API_BASE_URL}/clients/my-trainer`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  /**
   * Get pending invitations for client
   */
  async getClientInvitations(): Promise<TrainerInvitation[]> {
    const response = await fetch(`${API_BASE_URL}/clients/my-invitations`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  /**
   * Accept trainer invitation
   */
  async acceptInvitation(token: string): Promise<TrainerConnection> {
    const response = await fetch(`${API_BASE_URL}/clients/invitations/accept`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ token })
    });

    return this.handleResponse(response);
  }

  /**
   * Decline trainer invitation
   */
  async declineInvitation(invitationId: string): Promise<TrainerInvitation> {
    const response = await fetch(`${API_BASE_URL}/clients/invitations/${invitationId}/decline`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  /**
   * Disconnect from trainer
   */
  async disconnectTrainer(): Promise<TrainerConnection> {
    const response = await fetch(`${API_BASE_URL}/clients/disconnect-trainer`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  // =====================================
  // SHARED METHODS
  // =====================================

  /**
   * Accept invitation via token (for new users or login page)
   */
  async acceptInvitationByToken(token: string): Promise<TrainerConnection> {
    return this.acceptInvitation(token);
  }
}

export const clientConnectionService = new ClientConnectionService();
export default clientConnectionService;