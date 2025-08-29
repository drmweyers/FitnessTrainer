'use client'

import React from 'react'
import { Search, SlidersHorizontal, Grid3X3, List } from 'lucide-react'
import { ProgramFilters as ProgramFiltersType, ProgramType, DifficultyLevel } from '@/types/program'

interface ProgramFiltersProps {
  filters: ProgramFiltersType
  onFiltersChange: (filters: ProgramFiltersType) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

const programTypeLabels: Record<ProgramType, string> = {
  [ProgramType.STRENGTH]: 'Strength',
  [ProgramType.HYPERTROPHY]: 'Hypertrophy',
  [ProgramType.ENDURANCE]: 'Endurance',
  [ProgramType.POWERLIFTING]: 'Powerlifting',
  [ProgramType.OLYMPIC_WEIGHTLIFTING]: 'Olympic Lifting',
  [ProgramType.CROSSFIT]: 'CrossFit',
  [ProgramType.CALISTHENICS]: 'Calisthenics',
  [ProgramType.CARDIO]: 'Cardio',
  [ProgramType.FLEXIBILITY]: 'Flexibility',
  [ProgramType.REHABILITATION]: 'Rehabilitation',
  [ProgramType.SPORTS_SPECIFIC]: 'Sports Specific',
  [ProgramType.GENERAL_FITNESS]: 'General Fitness',
  [ProgramType.WEIGHT_LOSS]: 'Weight Loss',
  [ProgramType.MUSCLE_GAIN]: 'Muscle Gain',
  [ProgramType.HYBRID]: 'Hybrid',
  [ProgramType.BODYBUILDING]: 'Bodybuilding',
  [ProgramType.SPORT_SPECIFIC]: 'Sport Specific'
}

const difficultyLabels: Record<DifficultyLevel, string> = {
  [DifficultyLevel.BEGINNER]: 'Beginner',
  [DifficultyLevel.INTERMEDIATE]: 'Intermediate',
  [DifficultyLevel.ADVANCED]: 'Advanced'
}

const sortOptions = [
  { value: 'createdAt', label: 'Newest First' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'durationWeeks', label: 'Duration' }
]

export default function ProgramFilters({ 
  filters, 
  onFiltersChange, 
  viewMode, 
  onViewModeChange 
}: ProgramFiltersProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false)

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined })
  }

  const handleProgramTypeChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      programType: value ? value as ProgramType : undefined 
    })
  }

  const handleDifficultyChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      difficultyLevel: value ? value as DifficultyLevel : undefined 
    })
  }

  const handleSortChange = (value: string, order: 'asc' | 'desc') => {
    onFiltersChange({ 
      ...filters, 
      sortBy: value as 'name' | 'createdAt' | 'durationWeeks',
      sortOrder: order
    })
  }

  const handleTemplateToggle = (isTemplate: boolean) => {
    onFiltersChange({ ...filters, isTemplate })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).some(key => filters[key as keyof ProgramFiltersType] !== undefined)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Main Filter Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search and Basic Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search programs..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Program Type Filter */}
          <select
            value={filters.programType || ''}
            onChange={(e) => handleProgramTypeChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
          >
            <option value="">All Types</option>
            {Object.entries(programTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={filters.difficultyLevel || ''}
            onChange={(e) => handleDifficultyChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
          >
            <option value="">All Levels</option>
            {Object.entries(difficultyLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2">
          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showAdvanced 
                ? 'bg-primary-50 border-primary-200 text-primary-700' 
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</label>
              <select
                value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-')
                  handleSortChange(sortBy, sortOrder as 'asc' | 'desc')
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-sm"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="durationWeeks-asc">Shortest Duration</option>
                <option value="durationWeeks-desc">Longest Duration</option>
              </select>
            </div>

            {/* Template Filter */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={filters.isTemplate === true}
                  onChange={(e) => handleTemplateToggle(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Templates only
              </label>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium px-2 py-1 rounded-md hover:bg-primary-50 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}