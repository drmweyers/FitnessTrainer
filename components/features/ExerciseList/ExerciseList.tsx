'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react'

// Types - match backend API response
interface Exercise {
  id: string
  exerciseId: string
  name: string
  gifUrl: string
  bodyPart: string
  equipment: string
  targetMuscle: string
  secondaryMuscles: string[]
  instructions: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  isFavorite?: boolean
  createdAt: string
  updatedAt: string
}

interface FilterState {
  bodyPart: string[]
  equipment: string[]
  targetMuscle: string[]
  difficulty: string[]
}

interface SortState {
  field: keyof Exercise
  direction: 'asc' | 'desc'
}

// Map backend fields to frontend display names
const fieldMap = {
  bodyPart: 'Body Part',
  equipment: 'Equipment',
  targetMuscle: 'Target Muscle',
  difficulty: 'Difficulty'
}

interface ExerciseListProps {
  preloadedExercises?: Exercise[]
}

export default function ExerciseList({ preloadedExercises }: ExerciseListProps = {}) {
  const [exercises, setExercises] = useState<Exercise[]>(preloadedExercises || [])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterState>({
    bodyPart: [],
    equipment: [],
    targetMuscle: [],
    difficulty: []
  })
  const [showFilters, setShowFilters] = useState(false)
  const [sort, setSort] = useState<SortState>({ field: 'name', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Dynamic filter options derived from exercises
  const filterOptions = {
    bodyPart: Array.from(new Set(exercises.map(ex => ex.bodyPart))).sort(),
    equipment: Array.from(new Set(exercises.map(ex => ex.equipment))).sort(),
    targetMuscle: Array.from(new Set(exercises.map(ex => ex.targetMuscle))).sort(),
    difficulty: ['beginner', 'intermediate', 'advanced'] as const
  }

  // Load exercises from API on mount (skip if preloaded)
  useEffect(() => {
    // Skip loading if preloaded exercises are provided
    if (preloadedExercises && preloadedExercises.length > 0) {
      setExercises(preloadedExercises)
      setLoading(false)
      return
    }

    const loadExercises = async () => {
      try {
        setLoading(true)
        setError(null)
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'
        const params = new URLSearchParams({
          page: '1',
          limit: '100',
          sortBy: 'name',
          sortOrder: 'asc'
        })
        const response = await fetch(`${API_BASE_URL}/exercises?${params.toString()}`)

        if (!response.ok) {
          throw new Error(`Failed to load exercises: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || 'API returned error')
        }

        setExercises(data.data.exercises)
      } catch (err) {
        console.error('Error loading exercises:', err)
        setError(err instanceof Error ? err.message : 'Failed to load exercises')
      } finally {
        setLoading(false)
      }
    }

    loadExercises()
  }, [preloadedExercises])

  // Apply filters and search
  useEffect(() => {
    let result = [...exercises]

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(ex =>
        ex.name.toLowerCase().includes(query) ||
        ex.bodyPart.toLowerCase().includes(query) ||
        ex.targetMuscle.toLowerCase().includes(query) ||
        ex.equipment.toLowerCase().includes(query)
      )
    }

    // Apply filters
    if (filters.bodyPart.length > 0) {
      result = result.filter(ex => filters.bodyPart.includes(ex.bodyPart))
    }
    if (filters.equipment.length > 0) {
      result = result.filter(ex => filters.equipment.includes(ex.equipment))
    }
    if (filters.targetMuscle.length > 0) {
      result = result.filter(ex => filters.targetMuscle.includes(ex.targetMuscle))
    }
    if (filters.difficulty.length > 0) {
      result = result.filter(ex => filters.difficulty.includes(ex.difficulty))
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sort.field]
      const bValue = b[sort.field]

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sort.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return 0
    })

    setFilteredExercises(result)
    setCurrentPage(1) // Reset to first page when filters change
  }, [exercises, searchQuery, filters, sort])

  // Toggle filter selection
  const toggleFilter = (category: keyof FilterState, value: string) => {
    setFilters(prev => {
      const current = [...prev[category]]
      const index = current.indexOf(value)

      if (index === -1) {
        current.push(value)
      } else {
        current.splice(index, 1)
      }

      return {
        ...prev,
        [category]: current
      }
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      bodyPart: [],
      equipment: [],
      targetMuscle: [],
      difficulty: []
    })
    setSearchQuery('')
  }
  
  // Toggle sort
  const toggleSort = (field: keyof Exercise) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }
  
  // Toggle select all exercises
  const toggleSelectAll = () => {
    if (selectedExercises.length === paginatedExercises.length) {
      setSelectedExercises([])
    } else {
      setSelectedExercises(paginatedExercises.map(ex => ex.id))
    }
  }
  
  // Toggle select single exercise
  const toggleSelectExercise = (id: string) => {
    setSelectedExercises(prev => 
      prev.includes(id) 
        ? prev.filter(exId => exId !== id) 
        : [...prev, id]
    )
  }
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredExercises.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedExercises = filteredExercises.slice(startIndex, startIndex + itemsPerPage)
  
  // Get active filter count
  const activeFilterCount = Object.values(filters).flat().length
  
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search and filter header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search exercises..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button
            className={`flex items-center px-4 py-2 border ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            } rounded-md text-sm font-medium`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} className="mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
        
        {/* Filter panel */}
        {showFilters && (
          <div className="mt-4 border border-gray-200 rounded-md p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-700">Filter Exercises</h3>
              <button 
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={clearFilters}
              >
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.keys(filterOptions) as Array<keyof typeof filterOptions>).map(category => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 capitalize">{category}</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {filterOptions[category].map(option => (
                      <label key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          checked={filters[category as keyof FilterState].includes(option)}
                          onChange={() => toggleFilter(category as keyof FilterState, option)}
                        />
                        <span className="ml-2 text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Active filters */}
        {activeFilterCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(filters).map(([category, values]) => 
              values.map((value: any) => (
                <div 
                  key={`${category}-${value}`}
                  className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs"
                >
                  <span className="capitalize mr-1">{category}:</span>
                  <span>{value}</span>
                  <button 
                    className="ml-1 text-blue-500 hover:text-blue-700"
                    onClick={() => toggleFilter(category as keyof FilterState, value)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Table header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center">
          <input
            type="checkbox"
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            checked={selectedExercises.length === paginatedExercises.length && paginatedExercises.length > 0}
            onChange={toggleSelectAll}
          />
          <span className="ml-2 text-sm text-gray-700">
            {selectedExercises.length} selected
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            className="text-sm border border-gray-300 rounded-md p-1.5"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Loading exercises...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-red-500 font-medium mb-2">Failed to load exercises</div>
          <div className="text-gray-600 text-sm mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && exercises.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-gray-500 font-medium mb-2">No exercises found</div>
          <div className="text-gray-400 text-sm">Try adjusting your filters or search query</div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && filteredExercises.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="w-10 px-4 py-3">
                  <span className="sr-only">Select</span>
                </th>
                <th scope="col" className="w-16 px-4 py-3">
                  <span className="sr-only">GIF</span>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center">
                    <span>Name</span>
                    {sort.field === 'name' && (
                      <span className="ml-1">
                        {sort.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                  onClick={() => toggleSort('bodyPart')}
                >
                  <div className="flex items-center">
                    <span>Body Part</span>
                    {sort.field === 'bodyPart' && (
                      <span className="ml-1">
                        {sort.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                  onClick={() => toggleSort('targetMuscle')}
                >
                  <div className="flex items-center">
                    <span>Target Muscle</span>
                    {sort.field === 'targetMuscle' && (
                      <span className="ml-1">
                        {sort.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden lg:table-cell"
                  onClick={() => toggleSort('equipment')}
                >
                  <div className="flex items-center">
                    <span>Equipment</span>
                    {sort.field === 'equipment' && (
                      <span className="ml-1">
                        {sort.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden lg:table-cell"
                  onClick={() => toggleSort('difficulty')}
                >
                  <div className="flex items-center">
                    <span>Difficulty</span>
                    {sort.field === 'difficulty' && (
                      <span className="ml-1">
                        {sort.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="w-10 px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedExercises.map(exercise => (
                <tr
                  key={exercise.id}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={selectedExercises.includes(exercise.id)}
                      onChange={() => toggleSelectExercise(exercise.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Image
                      src={exercise.gifUrl}
                      alt={exercise.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-md object-cover"
                      unoptimized
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{exercise.name}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-gray-700 capitalize">{exercise.bodyPart}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-gray-700 capitalize">{exercise.targetMuscle}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                    <div className="text-sm text-gray-700 capitalize">{exercise.equipment}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                      exercise.difficulty === 'beginner'
                        ? 'bg-green-100 text-green-800'
                        : exercise.difficulty === 'intermediate'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {exercise.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gray-500 hover:text-gray-700">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(startIndex + itemsPerPage, filteredExercises.length)}
              </span>{' '}
              of <span className="font-medium">{filteredExercises.length}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft size={18} />
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                // Show pages around current page
                let pageNum = currentPage;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <span className="sr-only">Next</span>
                <ChevronRight size={18} />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}