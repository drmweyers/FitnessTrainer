'use client'

import { useState } from 'react'
import Layout from '@/components/layout/Layout'
import ProgramList from '@/components/features/Programs/ProgramList'
import ProgramFilters from '@/components/features/Programs/ProgramFilters'
import { Plus } from 'lucide-react'
import { ProgramFilters as ProgramFiltersType } from '@/types/program'

export default function ProgramsPage() {
  const [filters, setFilters] = useState<ProgramFiltersType>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const handleCreateProgram = () => {
    // TODO: Navigate to program creation page
    console.log('Navigate to create program')
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Training Programs</h1>
            <p className="text-gray-600 mt-1">Create and manage workout programs for your clients</p>
          </div>
          
          <button 
            onClick={handleCreateProgram}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors touch-target"
          >
            <Plus size={20} className="mr-2" />
            Create Program
          </button>
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
        />
      </div>
    </Layout>
  )
}