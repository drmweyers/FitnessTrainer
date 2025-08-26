'use client'

import Layout from '@/components/layout/Layout'
import ExerciseFilters from '@/components/features/ExerciseFilters/ExerciseFilters'
import ExerciseList from '@/components/features/ExerciseList/ExerciseList'

export default function ExerciseLibraryPage() {
  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Exercise Library</h1>
          <p className="text-gray-600">Manage and organize your exercise collection</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <ExerciseFilters />
          </div>
          
          <div className="lg:col-span-3">
            <ExerciseList />
          </div>
        </div>
      </div>
    </Layout>
  )
}