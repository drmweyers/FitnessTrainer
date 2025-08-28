'use client'

import { useState, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface ExerciseSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
  initialValue?: string
  className?: string
}

export function ExerciseSearch({
  onSearch,
  placeholder = "Search exercises...",
  initialValue = '',
  className = ''
}: ExerciseSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSearch(searchQuery)
    }
  }

  const handleClear = () => {
    setSearchQuery('')
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
        />

        {searchQuery && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}