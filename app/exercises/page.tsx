'use client'

import { useState } from 'react'

import ExerciseFilters from '@/components/features/ExerciseFilters/ExerciseFilters'
import ExerciseList from '@/components/features/ExerciseList/ExerciseList'
import { LayoutGrid, List } from 'lucide-react'

export default function ExerciseLibraryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Exercise Library</h1>
            <p className="text-gray-600">Manage and organize your exercise collection</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              className={`p-2 rounded-md ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              className={`p-2 rounded-md ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setViewMode('list')}
            >
              <List size={20} />
            </button>
          </div>
        </div>
        
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <ExerciseFilters />
            </div>
            
            <div className="lg:col-span-3">
              <ExerciseList />
            </div>
          </div>
        ) : (
          <ExerciseList />
        )}
      </div>
  )
}