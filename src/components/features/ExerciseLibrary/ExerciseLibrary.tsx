'use client'

import React from 'react'
import { ExerciseWithUserData } from '@/types/exercise'
import { ExerciseGrid } from './ExerciseGrid'
import { ExerciseGridSkeleton } from './ExerciseGridSkeleton'

interface ExerciseLibraryProps {
  exercises: ExerciseWithUserData[]
  viewMode: 'grid' | 'list'
  isLoading?: boolean
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  onPageChange: (page: number) => void
}

export function ExerciseLibrary({ 
  exercises, 
  viewMode, 
  isLoading = false,
  currentPage,
  totalPages,
  hasNextPage,
  onPageChange
}: ExerciseLibraryProps) {
  if (isLoading) {
    return <ExerciseGridSkeleton count={20} viewMode={viewMode} />
  }
  
  return (
    <div className="space-y-6">
      {/* Exercise Grid */}
      <ExerciseGrid
        exercises={exercises}
        viewMode={viewMode}
        isLoading={false}
      />
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i))
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    pageNum === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNextPage}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* No Results */}
      {exercises.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-lg">No exercises found matching your criteria</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}