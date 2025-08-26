'use client'

import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'

interface FilterOption {
  id: string
  label: string
}

interface FilterCategory {
  id: string
  name: string
  options: FilterOption[]
}

const filterCategories: FilterCategory[] = [
  {
    id: 'muscle-group',
    name: 'Muscle Group',
    options: [
      { id: 'chest', label: 'Chest' },
      { id: 'back', label: 'Back' },
      { id: 'shoulders', label: 'Shoulders' },
      { id: 'arms', label: 'Arms' },
      { id: 'legs', label: 'Legs' },
      { id: 'core', label: 'Core' },
    ]
  },
  {
    id: 'equipment',
    name: 'Equipment',
    options: [
      { id: 'barbell', label: 'Barbell' },
      { id: 'dumbbell', label: 'Dumbbell' },
      { id: 'kettlebell', label: 'Kettlebell' },
      { id: 'machine', label: 'Machine' },
      { id: 'bodyweight', label: 'Bodyweight' },
      { id: 'resistance-band', label: 'Resistance Band' },
    ]
  },
  {
    id: 'difficulty',
    name: 'Difficulty',
    options: [
      { id: 'beginner', label: 'Beginner' },
      { id: 'intermediate', label: 'Intermediate' },
      { id: 'advanced', label: 'Advanced' },
    ]
  },
  {
    id: 'type',
    name: 'Type',
    options: [
      { id: 'strength', label: 'Strength' },
      { id: 'cardio', label: 'Cardio' },
      { id: 'flexibility', label: 'Flexibility' },
      { id: 'balance', label: 'Balance' },
    ]
  }
]

export default function ExerciseFilters() {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'muscle-group': true,
    'equipment': true,
  })
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    'muscle-group': [],
    'equipment': [],
    'difficulty': [],
    'type': [],
  })
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }
  
  const toggleFilter = (categoryId: string, filterId: string) => {
    setSelectedFilters(prev => {
      const currentFilters = prev[categoryId] || []
      const newFilters = currentFilters.includes(filterId)
        ? currentFilters.filter(id => id !== filterId)
        : [...currentFilters, filterId]
        
      return {
        ...prev,
        [categoryId]: newFilters
      }
    })
  }
  
  const removeFilter = (categoryId: string, filterId: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].filter(id => id !== filterId)
    }))
  }
  
  const clearAllFilters = () => {
    setSelectedFilters({
      'muscle-group': [],
      'equipment': [],
      'difficulty': [],
      'type': [],
    })
  }
  
  // Count total selected filters
  const totalSelectedFilters = Object.values(selectedFilters).flat().length
  
  return (
    <div className="mb-6">
      {/* Active filters */}
      {totalSelectedFilters > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Active Filters</h3>
            <button 
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={clearAllFilters}
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(selectedFilters).map(([categoryId, filterIds]) => (
              filterIds.map(filterId => {
                const category = filterCategories.find(c => c.id === categoryId)
                const option = category?.options.find(o => o.id === filterId)
                
                if (!category || !option) return null
                
                return (
                  <div 
                    key={`${categoryId}-${filterId}`}
                    className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm"
                  >
                    <span className="mr-1">{option.label}</span>
                    <button 
                      onClick={() => removeFilter(categoryId, filterId)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })
            ))}
          </div>
        </div>
      )}
      
      {/* Filter categories */}
      <div className="space-y-4">
        {filterCategories.map(category => (
          <div key={category.id} className="border border-gray-200 rounded-md">
            <button
              className="w-full flex items-center justify-between p-3 text-left"
              onClick={() => toggleCategory(category.id)}
            >
              <span className="font-medium text-gray-700">{category.name}</span>
              <ChevronDown 
                size={18} 
                className={`text-gray-400 transition-transform ${
                  expandedCategories[category.id] ? 'transform rotate-180' : ''
                }`} 
              />
            </button>
            
            {expandedCategories[category.id] && (
              <div className="p-3 pt-0 border-t border-gray-200">
                <div className="space-y-2">
                  {category.options.map(option => (
                    <label key={option.id} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        checked={selectedFilters[category.id]?.includes(option.id) || false}
                        onChange={() => toggleFilter(category.id, option.id)}
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}