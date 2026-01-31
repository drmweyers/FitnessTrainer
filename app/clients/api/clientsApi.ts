export interface Client {
  id: string
  name: string
  avatar: string
  status: string
  completionPercentage: number
  lastActive: string
  email?: string
  phone?: string
  goals?: string[]
  programId?: string
}

export interface CreateClientData {
  name: string
  email: string
  phone?: string
  goals?: string[]
  programId?: string
}

const API_BASE = '/api/clients'

export async function getClients(): Promise<Client[]> {
  const response = await fetch(API_BASE)
  if (!response.ok) {
    throw new Error('Failed to fetch clients')
  }
  return response.json()
}

export async function createClient(data: CreateClientData): Promise<Client> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create client')
  }
  
  return response.json()
}

export async function updateClient(id: string, data: Partial<CreateClientData>): Promise<Client> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error('Failed to update client')
  }
  
  return response.json()
}

export async function deleteClient(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete client')
  }
} 