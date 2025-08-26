'use client'

import { useState } from 'react'
import ClientList from './components/ClientList'
import ClientModal from './components/ClientModal'
import Layout from '@/components/layout/Layout'

export default function ClientsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  return (
    <Layout>
      <div className="p-6">
        <div className="flex flex-col space-y-8 p-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">All Clients</h1>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
            >
              Add Client
            </button>
          </div>
          <ClientList />
        </div>
      </div>

      <ClientModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false)
          // The ClientList component will automatically refresh due to its useEffect
        }}
      />
    </Layout>
  )
} 