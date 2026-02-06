'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ClientList from './components/ClientList'
import ClientModal from './components/ClientModal'
import Layout from '@/components/layout/Layout'

export default function ClientsPage() {
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status') || 'all'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <Layout>
      <div className="p-6">
        <div className="flex flex-col space-y-8 p-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              {statusFilter === 'all' ? 'All Clients' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Clients`}
            </h1>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
            >
              Add Client
            </button>
          </div>
          <ClientList key={refreshKey} initialFilter={statusFilter} />
        </div>
      </div>

      <ClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false)
          setRefreshKey(prev => prev + 1)
        }}
      />
    </Layout>
  )
}
