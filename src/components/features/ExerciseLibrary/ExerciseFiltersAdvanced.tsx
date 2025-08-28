'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  X, 
  Filter, 
  Search,
  BookOpen,
  Heart,
  RotateCcw,
  Save,
  Star,
  Target,
  Dumbbell,
  User
} from 'lucide-react'
import { ExerciseFilters, FilterOptions } from '@/types/exercise'

interface FilterPreset {
  id: string
  name: string
  filters: ExerciseFilters
  isDefault?: boolean
}

interface ExerciseFiltersAdvancedProps {
  filters: ExerciseFilters
  onChange: (filters: ExerciseFilters) => void
  filterOptions: FilterOptions
  presets?: FilterPreset[]
  onSavePreset?: (preset: Omit<FilterPreset, 'id'>) => void
  onDeletePreset?: (presetId: string) => void
  className?: string
}

interface FilterSectionProps {
  title: string
  icon: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
  count?: number
}

const FilterSection = ({ title, icon, isExpanded, onToggle, children, count }: FilterSectionProps) => (
  <div className="border border-gray-200 rounded-lg bg-white">
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center space-x-3">
        {icon}
        <span className="font-medium text-gray-900">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
            {count}
          </span>
        )}
      </div>
      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </button>
    
    {isExpanded && (
      <div className="px-4 pb-4 border-t border-gray-100">
        {children}
      </div>
    )}
  </div>
)

export function ExerciseFiltersAdvanced({
  filters,
  onChange,
  filterOptions,
  presets = [],
  onSavePreset,
  onDeletePreset,
  className = ''
}: ExerciseFiltersAdvancedProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    bodyParts: true,
    equipments: false,
    targetMuscles: false,
    favorites: false,
    presets: false
  })
  
  const [muscleSearch, setMuscleSearch] = useState('')
  const [showPresetModal, setShowPresetModal] = useState(false)
  const [presetName, setPresetName] = useState('')

  // Filter muscle options by search
  const filteredMuscles = useMemo(() => {
    if (!muscleSearch.trim()) return filterOptions.targetMuscles
    return filterOptions.targetMuscles.filter(muscle =>
      muscle.toLowerCase().includes(muscleSearch.toLowerCase())
    )
  }, [filterOptions.targetMuscles, muscleSearch])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return filters.bodyParts.length + 
           filters.equipments.length + 
           filters.targetMuscles.length + 
           (filters.favorites ? 1 : 0) + 
           (filters.collections?.length || 0)
  }, [filters])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleFilterChange = (category: keyof ExerciseFilters, value: string | boolean | string[]) => {
    if (category === 'favorites') {
      onChange({
        ...filters,
        [category]: value as boolean
      })
    } else if (category === 'search') {
      onChange({
        ...filters,
        [category]: value as string
      })
    } else {
      // Handle array filters
      const currentValues = filters[category] as string[]
      let newValues: string[]
      
      if (Array.isArray(value)) {
        newValues = value
      } else {
        const stringValue = value as string
        if (currentValues.includes(stringValue)) {
          newValues = currentValues.filter(v => v !== stringValue)
        } else {
          newValues = [...currentValues, stringValue]
        }
      }

      onChange({
        ...filters,
        [category]: newValues
      })
    }
  }

  const clearAllFilters = () => {
    onChange({
      bodyParts: [],
      equipments: [],
      targetMuscles: [],
      search: '',
      favorites: false,
      collections: []
    })
    setMuscleSearch('')
  }

  const applyPreset = (preset: FilterPreset) => {
    onChange(preset.filters)
  }

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset({
        name: presetName.trim(),
        filters: { ...filters }
      })
      setPresetName('')
      setShowPresetModal(false)
    }
  }

  const removeActiveFilter = (category: keyof ExerciseFilters, value: string) => {
    if (category === 'favorites') {
      handleFilterChange(category, false)
    } else {
      const currentValues = filters[category] as string[]
      handleFilterChange(category, currentValues.filter(v => v !== value))
    }
  }

  // Default presets
  const defaultPresets: FilterPreset[] = [
    {
      id: 'strength-training',
      name: 'Strength Training',
      filters: {
        bodyParts: ['chest', 'back', 'legs'],
        equipments: ['barbell', 'dumbbell'],
        targetMuscles: [],
        search: '',
        favorites: false,
        collections: []
      },
      isDefault: true
    },
    {
      id: 'bodyweight',
      name: 'Bodyweight Only',
      filters: {
        bodyParts: [],
        equipments: ['body weight'],
        targetMuscles: [],
        search: '',
        favorites: false,
        collections: []
      },
      isDefault: true
    },
    {
      id: 'upper-body',
      name: 'Upper Body',
      filters: {
        bodyParts: ['chest', 'back', 'shoulders'],
        equipments: [],
        targetMuscles: [],
        search: '',
        favorites: false,
        collections: []
      },
      isDefault: true
    }
  ]

  const allPresets = [...defaultPresets, ...presets]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-semibold">
              {activeFilterCount} active
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPresetModal(true)}
            className="p-2 text-gray-500 hover:text-blue-600 rounded-lg transition-colors"
            title="Save current filters as preset"
            disabled={activeFilterCount === 0}
          >
            <Save size={16} />
          </button>
          
          <button
            onClick={clearAllFilters}
            className="p-2 text-gray-500 hover:text-red-600 rounded-lg transition-colors"
            title="Clear all filters"
            disabled={activeFilterCount === 0}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
          {filters.bodyParts.map(part => (
            <div
              key={`bodypart-${part}`}
              className="inline-flex items-center bg-white text-blue-800 px-3 py-1 rounded-full text-sm border border-blue-200"
            >
              <User size={14} className="mr-1" />
              <span className="capitalize">{part}</span>
              <button
                onClick={() => removeActiveFilter('bodyParts', part)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          
          {filters.equipments.map(equipment => (
            <div
              key={`equipment-${equipment}`}
              className="inline-flex items-center bg-white text-green-800 px-3 py-1 rounded-full text-sm border border-green-200"
            >
              <Dumbbell size={14} className="mr-1" />
              <span className="capitalize">{equipment}</span>
              <button
                onClick={() => removeActiveFilter('equipments', equipment)}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          
          {filters.targetMuscles.map(muscle => (
            <div
              key={`muscle-${muscle}`}
              className="inline-flex items-center bg-white text-purple-800 px-3 py-1 rounded-full text-sm border border-purple-200"
            >
              <Target size={14} className="mr-1" />
              <span className="capitalize">{muscle}</span>
              <button
                onClick={() => removeActiveFilter('targetMuscles', muscle)}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          
          {filters.favorites && (
            <div className="inline-flex items-center bg-white text-red-800 px-3 py-1 rounded-full text-sm border border-red-200">
              <Heart size={14} className="mr-1" />
              <span>Favorites</span>
              <button
                onClick={() => removeActiveFilter('favorites', 'favorites')}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filter Presets */}
      <FilterSection
        title="Filter Presets"
        icon={<BookOpen size={18} className="text-purple-600" />}
        isExpanded={expandedSections.presets}
        onToggle={() => toggleSection('presets')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          {allPresets.map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="p-3 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{preset.name}</span>
                {preset.isDefault && (
                  <Star size={14} className="text-yellow-500" />
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {preset.filters.bodyParts.length + preset.filters.equipments.length + preset.filters.targetMuscles.length} filters
              </div>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Body Parts Filter */}
      <FilterSection
        title="Body Parts"
        icon={<User size={18} className="text-blue-600" />}
        isExpanded={expandedSections.bodyParts}
        onToggle={() => toggleSection('bodyParts')}
        count={filters.bodyParts.length}
      >
        <div className="grid grid-cols-2 gap-2 mt-3">
          {filterOptions.bodyParts.map(bodyPart => (
            <label key={bodyPart} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.bodyParts.includes(bodyPart)}
                onChange={() => handleFilterChange('bodyParts', bodyPart)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm capitalize text-gray-700">{bodyPart}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Equipment Filter */}
      <FilterSection
        title="Equipment"
        icon={<Dumbbell size={18} className="text-green-600" />}
        isExpanded={expandedSections.equipments}
        onToggle={() => toggleSection('equipments')}
        count={filters.equipments.length}
      >
        <div className="grid grid-cols-2 gap-2 mt-3">
          {filterOptions.equipments.map(equipment => (
            <label key={equipment} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.equipments.includes(equipment)}
                onChange={() => handleFilterChange('equipments', equipment)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm capitalize text-gray-700">{equipment}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Target Muscles Filter */}
      <FilterSection
        title="Target Muscles"
        icon={<Target size={18} className="text-purple-600" />}
        isExpanded={expandedSections.targetMuscles}
        onToggle={() => toggleSection('targetMuscles')}
        count={filters.targetMuscles.length}
      >
        <div className="mt-3 space-y-3">
          {/* Muscle Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={muscleSearch}
              onChange={(e) => setMuscleSearch(e.target.value)}
              placeholder="Search muscles..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          {/* Muscle List */}
          <div className="max-h-48 overflow-y-auto">
            <div className="grid grid-cols-1 gap-1">
              {filteredMuscles.map(muscle => (
                <label key={muscle} className="flex items-center space-x-2 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={filters.targetMuscles.includes(muscle)}
                    onChange={() => handleFilterChange('targetMuscles', muscle)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm capitalize text-gray-700">{muscle}</span>
                </label>
              ))}
            </div>
            
            {filteredMuscles.length === 0 && muscleSearch && (
              <p className="text-sm text-gray-500 py-2">No muscles found matching "{muscleSearch}"</p>
            )}
          </div>
        </div>
      </FilterSection>

      {/* Special Filters */}
      <FilterSection
        title="Special Filters"
        icon={<Heart size={18} className="text-red-600" />}
        isExpanded={expandedSections.favorites}
        onToggle={() => toggleSection('favorites')}
        count={filters.favorites ? 1 : 0}
      >
        <div className="mt-3 space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.favorites || false}
              onChange={(e) => handleFilterChange('favorites', e.target.checked)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <div className="flex items-center space-x-2">
              <Heart size={16} className="text-red-500" />
              <span className="text-sm font-medium text-gray-700">Show only favorites</span>
            </div>
          </label>
        </div>
      </FilterSection>

      {/* Save Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Filter Preset</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preset Name
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g., My Gym Routine"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="text-sm text-gray-500">
                This will save your current filter combination ({activeFilterCount} filters active)
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPresetModal(false)
                  setPresetName('')
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 rounded-lg transition-colors"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}