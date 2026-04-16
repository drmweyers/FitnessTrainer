'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import ProgramList from '@/components/features/Programs/ProgramList'
import ProgramFilters from '@/components/features/Programs/ProgramFilters'
import { Plus } from 'lucide-react'
import { ProgramFilters as ProgramFiltersType } from '@/types/program'
import { useRequireAuth } from '@/hooks/useRequireAuth'

export default function ProgramsPage() {
  const { user, isLoading: authLoading } = useRequireAuth()
  const router = useRouter()
  const [filters, setFilters] = useState<ProgramFiltersType>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const handleCreateProgram = () => {
    router.push('/programs/new')
  }

  // Show loading while auth is initializing
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading programs...</p>
        </div>
      </div>
    )
  }

  const isClient = user?.role === 'client'

  return (
    <div className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isClient ? 'My Training Programs' : 'Training Programs'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isClient
                ? 'Programs assigned to you by your trainer'
                : 'Create and manage workout programs for your clients'}
            </p>
          </div>

          {!isClient && (
            <button
              onClick={handleCreateProgram}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors touch-target"
            >
              <Plus size={20} className="mr-2" />
              Create Program
            </button>
          )}
        </div>

        <ProgramFilters 
          filters={filters}
          onFiltersChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        
        <ProgramList
          filters={filters}
          viewMode={viewMode}
          isClient={isClient}
        />
      </div>
  )
}