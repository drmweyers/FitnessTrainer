'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Client } from '../api/clientsApi'
import { clientsApi, ApiError } from '@/lib/api/clients'

interface ClientModalFormData {
  name: string
  email: string
  phone?: string
  goals?: string[]
}

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  client?: Client
}

export default function ClientModal({ isOpen, onClose, onSuccess, client }: ClientModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<ClientModalFormData>({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    goals: client?.goals || [],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Split name into first/last for the API
      const nameParts = formData.name.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || undefined

      if (client) {
        await clientsApi.updateClient(client.id, {
          goals: formData.goals?.length
            ? { primaryGoal: formData.goals[0] }
            : undefined,
        })
      } else {
        await clientsApi.createClient({
          email: formData.email,
          firstName,
          lastName,
        })
      }
      onSuccess()
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/auth/login')
        return
      }
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : client ? 'Update' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 