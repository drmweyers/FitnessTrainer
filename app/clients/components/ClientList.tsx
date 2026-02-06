'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ClientListItem from './ClientListItem'
import FilterBar from './FilterBar'
import ClientModal from './ClientModal'
import { Client } from '../api/clientsApi'
import { clientsApi, ApiError } from '@/lib/api/clients'
import { ClientStatus } from '@/types/client'

// Map API Client to the local Client interface used by ClientListItem
function mapApiClientToLocal(apiClient: any): Client {
  const status = apiClient.trainerClient?.status || (apiClient.isActive ? 'active' : 'offline')
  const lastLogin = apiClient.lastLoginAt
    ? formatTimeAgo(new Date(apiClient.lastLoginAt))
    : apiClient.lastActivity
      ? formatTimeAgo(new Date(apiClient.lastActivity))
      : 'Never'

  return {
    id: apiClient.id,
    name: apiClient.displayName || apiClient.email || 'Unknown',
    avatar: apiClient.avatar || apiClient.userProfile?.profilePhotoUrl || '/avatars/default.png',
    status,
    completionPercentage: apiClient.data?.completionPercentage ?? 0,
    lastActive: lastLogin,
    email: apiClient.email,
    phone: apiClient.userProfile?.phone,
    goals: apiClient.clientProfile?.goals
      ? [apiClient.clientProfile.goals.primaryGoal].filter(Boolean)
      : undefined,
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffWeeks < 5) return `${diffWeeks}w ago`
  return `${diffMonths}mo ago`
}

// Map FilterBar values to API ClientStatus values
function mapFilterToApiStatus(filter: string): ClientStatus | undefined {
  const statusMap: Record<string, ClientStatus> = {
    active: ClientStatus.ACTIVE,
    offline: ClientStatus.OFFLINE,
    pending: ClientStatus.PENDING,
    need_programming: ClientStatus.NEED_PROGRAMMING,
    archived: ClientStatus.ARCHIVED,
  }
  return statusMap[filter]
}

interface ClientListProps {
  initialFilter?: string
}

export default function ClientList({ initialFilter = 'all' }: ClientListProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState(initialFilter)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | undefined>()

  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true)
      const apiStatus = filter !== 'all' ? mapFilterToApiStatus(filter) : undefined
      const response = await clientsApi.getClients({
        status: apiStatus,
      })

      // The API wraps response in { success, data: { clients, pagination } }
      const clientsData = (response as any).data?.clients || (response as any).clients || []
      const mappedClients = clientsData.map(mapApiClientToLocal)
      setClients(mappedClients)
      setError('')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/auth/login')
        return
      }
      setError(err instanceof ApiError ? err.message : 'Failed to fetch clients')
      console.error('Error fetching clients:', err)
    } finally {
      setIsLoading(false)
    }
  }, [filter, router])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  // Client-side search filtering for instant feedback
  const filteredClients = clients.filter(client => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return client.name.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term)
  })

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedClient(undefined)
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchClients}
          className="mt-2 text-red-700 underline hover:text-red-800"
        >
          Try again
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="mt-2 h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FilterBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filter={filter}
        onFilterChange={setFilter}
      />
      
      {filteredClients.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No clients found
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClients.map(client => (
            <ClientListItem 
              key={client.id}
              client={client}
              onEdit={() => handleEditClient(client)}
            />
          ))}
        </div>
      )}

      <ClientModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={fetchClients}
        client={selectedClient}
      />
    </div>
  )
} 