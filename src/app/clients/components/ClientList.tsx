'use client'

import { useState, useEffect } from 'react'
import ClientListItem from './ClientListItem'
import FilterBar from './FilterBar'
import ClientModal from './ClientModal'
import { Client } from '../api/clientsApi'

export default function ClientList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | undefined>()

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      // const data = await getClients()
      setClients([
        {
          id: '1',
          name: 'John Doe',
          avatar: '/avatars/default.png',
          status: 'active',
          completionPercentage: 75,
          lastActive: '2w ago'
        },
        {
          id: '2',
          name: 'Jane Smith',
          avatar: '/avatars/default.png',
          status: 'inactive',
          completionPercentage: 50, 
          lastActive: '1w ago'
        },  
        {
          id: '3',
          name: 'Alice Johnson',
          avatar: '/avatars/default.png',
          status: 'active', 
          completionPercentage: 80,
          lastActive: '3d ago'
        },
        {
          id: '4',
          name: 'Bob Brown',
          avatar: '/avatars/default.png',
          status: 'inactive',
          completionPercentage: 30,
          lastActive: '2d ago'
        },
        {
          id: '5',
          name: 'Charlie Davis',
          avatar: '/avatars/default.png',
          status: 'active',
          completionPercentage: 95,
          lastActive: '4d ago'
        }])
      setError('')
    } catch (err) {
      setError('Failed to fetch clients')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || client.status === filter

    return matchesSearch && matchesFilter
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